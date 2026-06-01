#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const playlistsPath = path.join(rootDir, 'src/data/walk-across-playlists.ts');
const outPath = path.join(rootDir, 'src/data/walk-across-archive.json');

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const tokenPath = path.join(os.homedir(), '.arthur-tools/youtube_oauth_token.json');
const secretPath = path.join(os.homedir(), '.arthur-tools/google_client_secret.json');
const fetchCaptions = ['1', 'true', 'yes'].includes(String(process.env.FETCH_WALK_CAPTIONS || '').toLowerCase());
const useYtDlpFallback = !['0', 'false', 'no'].includes(String(process.env.YT_DLP_FALLBACK || '').toLowerCase());
const useYtDlpOnly = ['1', 'true', 'yes'].includes(String(process.env.YT_DLP_ONLY || '').toLowerCase());
const fetchFullYtDlpMetadata = ['1', 'true', 'yes'].includes(String(process.env.YT_DLP_FULL_METADATA || '').toLowerCase());
const requestedSlugs = new Set(
	String(process.env.WALK_ACROSS_SLUGS || '')
		.split(',')
		.map((slug) => slug.trim())
		.filter(Boolean)
);
const execFileAsync = promisify(execFile);

function die(message) {
	console.error(message);
	process.exit(1);
}

async function readJson(filePath) {
	return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function writeJson(filePath, data) {
	await fs.mkdir(path.dirname(filePath), { recursive: true });
	await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function readExistingArchive() {
	try {
		return await readJson(outPath);
	} catch {
		return { fetchedAt: null, playlists: {} };
	}
}

function isQuotaError(error) {
	return /quotaExceeded|exceeded your .*quota|SERVICE_DISABLED|accessNotConfigured/i.test(error?.message || '');
}

function normalizeYtDlpDate(value) {
	const text = String(value || '');
	if (!/^\d{8}$/.test(text)) return '';
	return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}T00:00:00.000Z`;
}

function normalizeYtDlpVideo(entry) {
	const thumbnails = Array.isArray(entry.thumbnails) ? entry.thumbnails : [];
	const bestThumb = [...thumbnails].reverse().find((thumb) => thumb?.url)?.url || entry.thumbnail || '';
	const description = entry.description || entry.fulltitle || '';
	return {
		id: entry.id || '',
		title: entry.title || entry.fulltitle || '',
		description,
		publishedAt: entry.timestamp ? new Date(entry.timestamp * 1000).toISOString() : normalizeYtDlpDate(entry.upload_date),
		thumbnail: bestThumb,
		duration: entry.duration_string || (entry.duration ? String(entry.duration) : ''),
		viewCount: entry.view_count ? String(entry.view_count) : '',
		caption: null,
		excerpt: makeExcerpt('', description),
	};
}

function isPublicVideo(video) {
	const title = String(video?.title || '').trim();
	if (!video?.id || !title) return false;
	return !/(^\[?private video\]?$|^\[?deleted video\]?$|unavailable|非公開|削除済み|この動画は再生できません)/i.test(title);
}

function filterJapan2024BlessingNews(archive, playlistData) {
	const japan2024Ids = new Set((archive.playlists?.['japan-2024']?.videos || []).map((video) => video.id));
	const extraJapan2024Ids = new Set([
		'2jtXSXw4nx0',
		'bmP13AYbZ5s',
		'XlYKIygXg7M',
		'uh6jgPRCBQk',
		's4XHpdAlsgU',
		'BAEH-2DsPII',
	]);
	const seen = new Set();
	const videos = (playlistData.videos || []).filter((video) => {
		const keep = japan2024Ids.has(video.id) || extraJapan2024Ids.has(video.id);
		if (!keep || seen.has(video.id)) return false;
		seen.add(video.id);
		return true;
	});
	return {
		...playlistData,
		videos,
		source: `${playlistData.source || 'unknown'} filtered from Blessing News`,
	};
}

function postProcessPlaylist(archive, slug) {
	if (slug === 'japan-2024-blessing-news') {
		archive.playlists[slug] = filterJapan2024BlessingNews(archive, archive.playlists[slug]);
	}
}

async function fetchPlaylistWithYtDlp(playlistId) {
	if (!useYtDlpFallback) throw new Error('yt-dlp fallback is disabled.');
	const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
	const args = [
		...(fetchFullYtDlpMetadata ? [] : ['--flat-playlist']),
		'--skip-download',
		'--dump-single-json',
		'--ignore-errors',
		'--ignore-no-formats-error',
		'--no-warnings',
		'--sleep-requests', '1',
		'--sleep-interval', '1',
		'--max-sleep-interval', '3',
		playlistUrl,
	];
	const { stdout } = await execFileAsync('yt-dlp', args, {
		maxBuffer: 1024 * 1024 * 80,
		timeout: 1000 * 60 * 20,
	});
	const data = JSON.parse(stdout);
	const videos = (data.entries || [])
		.filter((entry) => entry?.id)
		.map(normalizeYtDlpVideo)
		.filter(isPublicVideo);
	return { playlistId, videos, source: 'yt-dlp' };
}

async function loadPlaylists() {
	const source = await fs.readFile(playlistsPath, 'utf8');
	const matches = [...source.matchAll(/slug:\s*'([^']+)'[\s\S]*?playlistId:\s*'([^']+)'/g)];
	if (!matches.length) die('walk-across-playlists.ts から playlistId を読み取れませんでした。');
	return matches.map((match) => ({ slug: match[1], playlistId: match[2] }));
}

async function refreshTokenIfNeeded() {
	let token;
	try {
		token = await readJson(tokenPath);
	} catch {
		die(`OAuthトークンがありません: ${tokenPath}\nArthur Toolsの設定画面でYouTube OAuthを完了してください。`);
	}

	const expiresAt = Number(token.expires_at || 0) * 1000;
	if (token.access_token && expiresAt > Date.now() + 60_000) {
		return token.access_token;
	}
	if (!token.refresh_token) {
		die('OAuthトークンにrefresh_tokenがありません。Arthur ToolsでYouTube OAuthをリセットして再認証してください。');
	}

	let secret;
	try {
		secret = await readJson(secretPath);
	} catch {
		die(`Google OAuth client secret がありません: ${secretPath}`);
	}
	const installed = secret.installed || secret.web || {};
	const params = new URLSearchParams({
		client_id: installed.client_id || '',
		client_secret: installed.client_secret || '',
		refresh_token: token.refresh_token,
		grant_type: 'refresh_token',
	});
	const resp = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: params,
	});
	if (!resp.ok) {
		const body = await resp.text();
		die(`OAuthトークン更新に失敗しました (${resp.status})。\nArthur ToolsでYouTube OAuthを再認証してください。\n${body}`);
	}
	const data = await resp.json();
	const nextToken = {
		...token,
		access_token: data.access_token,
		expires_at: Math.floor(Date.now() / 1000) + Number(data.expires_in || 3600),
	};
	if (data.refresh_token) nextToken.refresh_token = data.refresh_token;
	await writeJson(tokenPath, nextToken);
	return nextToken.access_token;
}

async function apiGet(pathname, params, accessToken, media = false) {
	const url = new URL(`${YOUTUBE_API_BASE}${pathname}`);
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
	});
	const resp = await fetch(url, {
		headers: { Authorization: `Bearer ${accessToken}` },
	});
	if (!resp.ok) {
		const body = await resp.text();
		throw new Error(`${url.pathname} failed (${resp.status}): ${body}`);
	}
	return media ? resp.text() : resp.json();
}

async function fetchPlaylistItems(playlistId, accessToken) {
	const items = [];
	let pageToken = '';
	do {
		const data = await apiGet('/playlistItems', {
			part: 'snippet,contentDetails',
			playlistId,
			maxResults: 50,
			pageToken,
		}, accessToken);
		items.push(...(data.items || []));
		pageToken = data.nextPageToken || '';
	} while (pageToken);
	return items;
}

async function fetchVideos(videoIds, accessToken) {
	const result = new Map();
	for (let i = 0; i < videoIds.length; i += 50) {
		const data = await apiGet('/videos', {
			part: 'snippet,contentDetails,statistics',
			id: videoIds.slice(i, i + 50).join(','),
			maxResults: 50,
		}, accessToken);
		for (const item of data.items || []) result.set(item.id, item);
	}
	return result;
}

function cleanTranscript(text) {
	return text
		.replace(/\r/g, '')
		.replace(/WEBVTT[\s\S]*?\n\n/g, '')
		.replace(/^\d+$/gm, '')
		.replace(/\d{2}:\d{2}:\d{2}[,.]\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}[,.]\d{3}.*$/gm, '')
		.replace(/<[^>]+>/g, '')
		.replace(/\[[^\]]+\]/g, '')
		.replace(/[ \t]+/g, ' ')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

function makeExcerpt(text, fallback = '') {
	const source = cleanTranscript(text || fallback);
	if (!source) return '';
	const first = source.split(/\n+/).map((line) => line.trim()).filter(Boolean).slice(0, 8).join(' ');
	return first.length > 220 ? `${first.slice(0, 220)}...` : first;
}

async function fetchCaption(videoId, accessToken) {
	if (!fetchCaptions) return null;
	let tracks;
	try {
		tracks = await apiGet('/captions', { part: 'snippet', videoId }, accessToken);
	} catch (error) {
		console.warn(`caption list skipped: ${videoId} ${error.message}`);
		return null;
	}
	const candidates = (tracks.items || []).filter((item) => {
		const lang = item.snippet?.language || '';
		return ['ja', 'ja-JP', 'en'].includes(lang) || item.snippet?.trackKind === 'ASR';
	});
	for (const track of candidates) {
		try {
			const text = await apiGet(`/captions/${track.id}`, { tfmt: 'srt' }, accessToken, true);
			if (text.trim()) {
				return {
					id: track.id,
					language: track.snippet?.language || '',
					name: track.snippet?.name || '',
					trackKind: track.snippet?.trackKind || '',
					text: cleanTranscript(text),
				};
			}
		} catch (error) {
			console.warn(`caption download skipped: ${videoId} ${track.id} ${error.message}`);
		}
	}
	return null;
}

async function main() {
	const accessToken = useYtDlpOnly ? '' : await refreshTokenIfNeeded();
	const playlists = (await loadPlaylists()).filter((playlist) => !requestedSlugs.size || requestedSlugs.has(playlist.slug));
	if (!playlists.length) {
		die(`更新対象のWALK_ACROSS_SLUGSが見つかりません: ${[...requestedSlugs].join(', ')}`);
	}
	const archive = await readExistingArchive();
	archive.fetchedAt = new Date().toISOString();
	archive.playlists ||= {};
	let apiQuotaReached = false;

	for (const playlist of playlists) {
		console.log(`Fetching ${playlist.slug}...`);
		try {
			if (useYtDlpOnly || apiQuotaReached) {
				console.log(`Using yt-dlp metadata fallback for ${playlist.slug}...`);
				archive.playlists[playlist.slug] = await fetchPlaylistWithYtDlp(playlist.playlistId);
			} else {
				const playlistItems = await fetchPlaylistItems(playlist.playlistId, accessToken);
				const videoIds = playlistItems.map((item) => item.contentDetails?.videoId).filter(Boolean);
				const videoMap = await fetchVideos(videoIds, accessToken);
				const videos = [];
				for (const item of playlistItems) {
					const videoId = item.contentDetails?.videoId;
					if (!videoId) continue;
					const video = videoMap.get(videoId);
					const snippet = video?.snippet || item.snippet || {};
					const caption = await fetchCaption(videoId, accessToken);
					videos.push({
						id: videoId,
						title: snippet.title || '',
						description: snippet.description || '',
						publishedAt: snippet.publishedAt || item.contentDetails?.videoPublishedAt || '',
						thumbnail: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || '',
						duration: video?.contentDetails?.duration || '',
						viewCount: video?.statistics?.viewCount || '',
						caption,
						excerpt: makeExcerpt(caption?.text, snippet.description || ''),
					});
				}
				archive.playlists[playlist.slug] = { playlistId: playlist.playlistId, videos: videos.filter(isPublicVideo), source: 'youtube-api' };
			}
			postProcessPlaylist(archive, playlist.slug);
			await writeJson(outPath, archive);
		} catch (error) {
			if (isQuotaError(error)) {
				apiQuotaReached = true;
				console.warn(`Quota/API limit reached while fetching ${playlist.slug}. Falling back to yt-dlp metadata.`);
				try {
					archive.playlists[playlist.slug] = await fetchPlaylistWithYtDlp(playlist.playlistId);
				} catch (fallbackError) {
					console.warn(`yt-dlp fallback failed for ${playlist.slug}. Keeping existing data. ${fallbackError.message}`);
				}
				await writeJson(outPath, archive);
				continue;
			}
			throw error;
		}
	}

	await writeJson(outPath, archive);
	console.log(`Wrote ${outPath}`);
}

main().catch((error) => die(error.stack || error.message));
