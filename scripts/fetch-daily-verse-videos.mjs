#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outPath = path.join(rootDir, 'src/data/daily-verse-videos.json');
const bookletPath = path.join(rootDir, 'src/data/word-of-god-booklet.json');
const execFileAsync = promisify(execFile);

const playlist = {
	id: 'PL-faIdjPoxKh0A9o6_eq2pH5-ZVrhcAD8',
	title: 'THE DAILY with ARTHUR HOLLANDS',
	url: 'https://www.youtube.com/playlist?list=PL-faIdjPoxKh0A9o6_eq2pH5-ZVrhcAD8',
};

function normalizeText(value = '') {
	return String(value)
		.normalize('NFKC')
		.toLowerCase()
		.replace(/[\s　。、，,.!！?？:：;；「」『』（）()【】[\]<>＜＞'"“”‘’〜～―—_・]/g, '');
}

function toIsoDuration(seconds) {
	const value = Number(seconds || 0);
	if (!value) return '';
	const hours = Math.floor(value / 3600);
	const minutes = Math.floor((value % 3600) / 60);
	const secs = value % 60;
	return `PT${hours ? `${hours}H` : ''}${minutes ? `${minutes}M` : ''}${secs ? `${secs}S` : ''}`;
}

function isPublicVideo(video) {
	const title = String(video?.title || '').trim();
	if (!video?.id || !title) return false;
	return !/(^\[?private video\]?$|^\[?deleted video\]?$|unavailable|非公開|削除済み|この動画は再生できません)/i.test(title);
}

function extractQuote(title = '') {
	const matches = [...String(title).matchAll(/「([^」]{4,})」/g)];
	if (matches.length) return matches.map((match) => match[1]).sort((a, b) => b.length - a.length)[0].trim();
	return String(title)
		.replace(/-?\s*THE DAILY[\s\S]*$/i, '')
		.replace(/\s*with Arthur Hollands[\s\S]*$/i, '')
		.trim();
}

function longestCommonSubstringLength(a, b) {
	if (!a || !b) return 0;
	const previous = new Uint16Array(b.length + 1);
	const current = new Uint16Array(b.length + 1);
	let best = 0;
	for (let i = 1; i <= a.length; i += 1) {
		for (let j = 1; j <= b.length; j += 1) {
			const value = a[i - 1] === b[j - 1] ? previous[j - 1] + 1 : 0;
			current[j] = value;
			if (value > best) best = value;
		}
		previous.set(current);
		current.fill(0);
	}
	return best;
}

function chooseMatch(video, pages) {
	const quote = extractQuote(video.title);
	const normalizedQuote = normalizeText(quote);
	if (normalizedQuote.length < 8) return null;

	let best = null;
	for (const page of pages) {
		const exact = page.normalizedText.includes(normalizedQuote);
		const score = exact ? normalizedQuote.length : longestCommonSubstringLength(normalizedQuote, page.normalizedText);
		if (!best || score > best.score) {
			best = { page, score, exact };
		}
	}
	if (!best) return null;

	const ratio = best.score / normalizedQuote.length;
	const confidence = best.exact ? 'exact' : (best.score >= 12 && ratio >= 0.32 ? 'phrase' : '');
	if (!confidence) return null;

	return {
		page: best.page.page,
		pageLabel: best.page.label || '',
		pageRefs: best.page.refs || [],
		quote,
		confidence,
		score: best.score,
	};
}

async function main() {
	const bookletData = JSON.parse(await fs.readFile(bookletPath, 'utf8'));
	const pages = (bookletData.pages || [])
		.filter((page) => Array.isArray(page.refs) && page.refs.length)
		.map((page) => ({
			...page,
			normalizedText: normalizeText(`${page.label || ''} ${(page.refs || []).join(' ')} ${page.text || ''}`),
		}));

	const { stdout } = await execFileAsync('yt-dlp', [
		'--flat-playlist',
		'--skip-download',
		'--dump-single-json',
		'--ignore-errors',
		'--ignore-no-formats-error',
		'--no-warnings',
		playlist.url,
	], {
		maxBuffer: 1024 * 1024 * 80,
		timeout: 1000 * 60 * 10,
	});

	const playlistData = JSON.parse(stdout);
	const seen = new Set();
	const videosByPage = {};
	let publicVideoCount = 0;

	for (const entry of playlistData.entries || []) {
		const video = {
			id: entry.id || '',
			title: entry.title || entry.fulltitle || '',
			url: `https://youtu.be/${entry.id}`,
			thumbnail: `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg`,
			duration: toIsoDuration(entry.duration),
		};
		if (!isPublicVideo(video)) continue;
		publicVideoCount += 1;
		const match = chooseMatch(video, pages);
		if (!match) continue;
		const dedupeKey = `${match.page}:${video.id}`;
		if (seen.has(dedupeKey)) continue;
		seen.add(dedupeKey);
		videosByPage[match.page] ||= [];
		videosByPage[match.page].push({
			...video,
			quote: match.quote,
			pageLabel: match.pageLabel,
			pageRefs: match.pageRefs,
			confidence: match.confidence,
			score: match.score,
		});
	}

	for (const videos of Object.values(videosByPage)) {
		videos.sort((a, b) => (a.confidence === b.confidence ? 0 : a.confidence === 'exact' ? -1 : 1));
	}

	const linkedVideoCount = Object.values(videosByPage).reduce((total, videos) => total + videos.length, 0);
	await fs.writeFile(outPath, `${JSON.stringify({
		fetchedAt: new Date().toISOString(),
		playlist: {
			...playlist,
			title: playlistData.title || playlist.title,
		},
		stats: {
			publicVideoCount,
			linkedVideoCount,
			linkedPageCount: Object.keys(videosByPage).length,
		},
		videosByPage,
	}, null, 2)}\n`, 'utf8');

	console.log(`Wrote ${outPath} (${linkedVideoCount} linked videos / ${Object.keys(videosByPage).length} pages)`);
}

main().catch((error) => {
	console.error(error.stack || error.message);
	process.exit(1);
});
