#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outPath = path.join(rootDir, 'src/data/friday-night-archive.json');
const execFileAsync = promisify(execFile);

const playlist = {
	id: 'PL-faIdjPoxKhKboeW8o-N3vOvpwSerzAt',
	title: 'お茶の水クリスチャンセンター Friday Night',
	url: 'https://www.youtube.com/playlist?list=PL-faIdjPoxKhKboeW8o-N3vOvpwSerzAt',
};

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

async function thumbnailExists(url) {
	try {
		const response = await fetch(url, { method: 'HEAD' });
		const contentLength = Number(response.headers.get('content-length') || 0);
		return response.ok && contentLength > 1000;
	} catch {
		return false;
	}
}

async function resolveThumbnail(id) {
	const candidates = ['maxresdefault', 'hq720', 'sddefault', 'hqdefault', 'mqdefault']
		.map((quality) => `https://i.ytimg.com/vi/${id}/${quality}.jpg`);
	for (const url of candidates) {
		if (await thumbnailExists(url)) return url;
	}
	return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

async function main() {
	const { stdout } = await execFileAsync('yt-dlp', [
		'--flat-playlist',
		'--skip-download',
		'--dump-single-json',
		'--ignore-errors',
		'--ignore-no-formats-error',
		'--no-warnings',
		'--sleep-requests', '1',
		playlist.url,
	], {
		maxBuffer: 1024 * 1024 * 40,
		timeout: 1000 * 60 * 10,
	});
	const data = JSON.parse(stdout);
	const videos = [];
	for (const entry of data.entries || []) {
		const video = {
			id: entry.id || '',
			title: entry.title || entry.fulltitle || '',
			url: `https://youtu.be/${entry.id}`,
			thumbnail: entry.id ? await resolveThumbnail(entry.id) : '',
			duration: toIsoDuration(entry.duration),
			viewCount: entry.view_count ? String(entry.view_count) : '',
		};
		if (isPublicVideo(video)) videos.push(video);
	}

	await fs.mkdir(path.dirname(outPath), { recursive: true });
	await fs.writeFile(outPath, `${JSON.stringify({
		fetchedAt: new Date().toISOString(),
		playlist: {
			...playlist,
			title: data.title || playlist.title,
		},
		videos,
	}, null, 2)}\n`, 'utf8');
	console.log(`Wrote ${outPath} (${videos.length} videos)`);
}

main().catch((error) => {
	console.error(error.stack || error.message);
	process.exit(1);
});
