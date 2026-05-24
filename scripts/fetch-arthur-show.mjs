#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outPath = path.join(rootDir, 'src/data/arthur-show-archive.json');
const tokenPath = path.join(os.homedir(), '.arthur-tools/youtube_oauth_token.json');
const secretPath = path.join(os.homedir(), '.arthur-tools/google_client_secret.json');
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const playlistId = 'PL-faIdjPoxKj10dRLBajkm2zk1xbzK-RQ';
const execFileAsync = promisify(execFile);
const yearOverrides = new Map([
	['tUOSn2Bp3jI', '1992'],
	['aPPRePlh-IY', '1998'],
]);

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

async function refreshTokenIfNeeded() {
	let token;
	try {
		token = await readJson(tokenPath);
	} catch {
		die(`OAuthトークンがありません: ${tokenPath}`);
	}

	const expiresAt = Number(token.expires_at || 0) * 1000;
	if (token.access_token && expiresAt > Date.now() + 60_000) return token.access_token;
	if (!token.refresh_token) die('OAuthトークンにrefresh_tokenがありません。');

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
	if (!resp.ok) die(`OAuthトークン更新に失敗しました (${resp.status}): ${await resp.text()}`);
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

async function apiGet(pathname, params, accessToken) {
	const url = new URL(`${YOUTUBE_API_BASE}${pathname}`);
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
	});
	const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
	if (!resp.ok) throw new Error(`${url.pathname} failed (${resp.status}): ${await resp.text()}`);
	return resp.json();
}

async function fetchPlaylistItems(accessToken) {
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
			part: 'snippet,contentDetails,statistics,liveStreamingDetails',
			id: videoIds.slice(i, i + 50).join(','),
			maxResults: 50,
		}, accessToken);
		for (const item of data.items || []) result.set(item.id, item);
	}
	return result;
}

function excerptFromDescription(description = '') {
	const cleaned = description
		.replace(/https?:\/\/\S+/g, '')
		.replace(/[#＃][^\s　]+/g, '')
		.replace(/\r/g, '')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.filter((line) => !/^(チャンネル登録|高評価|公式|Instagram|Facebook|X\s*:|Twitter|YouTube)/i.test(line))
		.slice(0, 5)
		.join(' ');
	if (!cleaned) return '';
	return cleaned.length > 220 ? `${cleaned.slice(0, 220)}...` : cleaned;
}

function parseYear(value = '') {
	const date = new Date(value);
	return Number.isNaN(date.valueOf()) ? '' : String(date.getFullYear());
}

function parseYearFromTitle(value = '') {
	return value.match(/20\d{2}/)?.[0] || '';
}

function decodeXml(value = '') {
	return value
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>');
}

function readTag(source, tagName) {
	const escaped = tagName.replace(':', '\\:');
	const match = source.match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`));
	return match ? decodeXml(match[1].trim()) : '';
}

function readAttr(source, tagName, attrName) {
	const escaped = tagName.replace(':', '\\:');
	const match = source.match(new RegExp(`<${escaped}[^>]*\\s${attrName}="([^"]+)"`));
	return match ? decodeXml(match[1].trim()) : '';
}

async function fetchPublicFeed() {
	const resp = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`);
	if (!resp.ok) return new Map();
	const xml = await resp.text();
	const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
	const map = new Map();
	for (const entry of entries) {
		const source = entry[1];
		const id = readTag(source, 'yt:videoId');
		if (!id) continue;
		const description = readTag(source, 'media:description');
		map.set(id, {
			id,
			title: readTag(source, 'title'),
			description,
			excerpt: excerptFromDescription(description),
			publishedAt: readTag(source, 'published'),
			year: parseYear(readTag(source, 'published')),
			thumbnail: readAttr(source, 'media:thumbnail', 'url') || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
			viewCount: readAttr(source, 'media:statistics', 'views'),
		});
	}
	return map;
}

async function fetchWithYtDlpFallback() {
	const publicFeed = await fetchPublicFeed();
	const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
	const { stdout } = await execFileAsync('yt-dlp', [
		'--flat-playlist',
		'--skip-download',
		'--dump-single-json',
		'--ignore-errors',
		'--ignore-no-formats-error',
		'--no-warnings',
		'--sleep-requests', '1',
		playlistUrl,
	], {
		maxBuffer: 1024 * 1024 * 60,
		timeout: 1000 * 60 * 10,
	});
	const data = JSON.parse(stdout);
	return (data.entries || [])
		.filter((entry) => entry?.id)
		.map((entry) => {
			const feed = publicFeed.get(entry.id) || {};
			const duration = entry.duration ? `PT${Math.floor(entry.duration / 3600) ? `${Math.floor(entry.duration / 3600)}H` : ''}${Math.floor((entry.duration % 3600) / 60)}M${entry.duration % 60}S` : '';
			const description = feed.description || '';
			return {
				id: entry.id,
				title: feed.title || entry.title || entry.fulltitle || '',
				description,
				excerpt: feed.excerpt || excerptFromDescription(description),
				publishedAt: feed.publishedAt || '',
				year: yearOverrides.get(entry.id) || feed.year || parseYearFromTitle(entry.title || ''),
				thumbnail: feed.thumbnail || `https://i.ytimg.com/vi/${entry.id}/hq720.jpg`,
				duration,
				viewCount: feed.viewCount || (entry.view_count ? String(entry.view_count) : ''),
				liveStartedAt: '',
			};
		})
		.filter((video) => video.id && video.title);
}

async function main() {
	const accessToken = await refreshTokenIfNeeded();
	let videos = [];
	let source = 'youtube-api';
	try {
		const playlistItems = await fetchPlaylistItems(accessToken);
		const videoIds = playlistItems.map((item) => item.contentDetails?.videoId).filter(Boolean);
		const videoMap = await fetchVideos(videoIds, accessToken);
		videos = playlistItems
			.map((item) => {
				const id = item.contentDetails?.videoId;
				const video = videoMap.get(id);
				const snippet = video?.snippet || item.snippet || {};
				const description = snippet.description || '';
				return {
					id,
					title: snippet.title || '',
					description,
					excerpt: excerptFromDescription(description),
					publishedAt: snippet.publishedAt || item.contentDetails?.videoPublishedAt || '',
					year: yearOverrides.get(id) || parseYear(snippet.publishedAt || item.contentDetails?.videoPublishedAt || '') || parseYearFromTitle(snippet.title || ''),
					thumbnail: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.standard?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || '',
					duration: video?.contentDetails?.duration || '',
					viewCount: video?.statistics?.viewCount || '',
					liveStartedAt: video?.liveStreamingDetails?.actualStartTime || '',
				};
			})
			.filter((video) => video.id && video.title);
	} catch (error) {
		if (!/quotaExceeded|quota/i.test(error.message || '')) throw error;
		console.warn('YouTube API quota exceeded. Falling back to public feed + flat playlist metadata.');
		source = 'public-feed-and-yt-dlp-flat';
		videos = await fetchWithYtDlpFallback();
	}

	await writeJson(outPath, {
		fetchedAt: new Date().toISOString(),
		playlist: {
			id: playlistId,
			title: 'THE ARTHUR HOLLANDS SHOW',
			url: `https://www.youtube.com/playlist?list=${playlistId}`,
		},
		source,
		videos,
	});
	console.log(`Wrote ${outPath} (${videos.length} videos)`);
}

main().catch((error) => die(error.stack || error.message));
