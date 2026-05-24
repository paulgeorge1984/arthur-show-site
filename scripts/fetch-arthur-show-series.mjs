#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outPath = path.join(rootDir, 'src/data/arthur-show-series.json');
const execFileAsync = promisify(execFile);

const series = [
	{
		slug: 'cross-talk-reiko-uehara',
		kind: 'dialogue',
		label: 'CROSS TALK',
		title: 'Arthur Hollands × Reiko Uehara Special Cross Talk',
		description: '上原令子氏との信仰本音トーク。音楽、証し、信仰の歩みを語り合う対談シリーズ。',
		playlistId: 'PL-faIdjPoxKhT1qs_GHsoaEVV7MJbIlzT',
	},
	{
		slug: 'special-message',
		kind: 'message',
		label: 'SPECIAL MESSAGE',
		title: '全国各地での講演会 Arthur Hollands Special Message',
		description: '教会、集会、各地の会場で語られてきたスペシャルメッセージの記録。',
		playlistId: 'PL-faIdjPoxKgCoEeX8ABTS--RLjgOwJOM',
	},
	{
		slug: 'lords-angels-motorcycle',
		kind: 'road',
		label: "LORD'S ANGELS",
		title: "LORD'S ANGELS Motorcycle Across 2023 in Niigata and Akita",
		description: "LORD'S ANGELSの歩みと、バイク、旅、証しが交差する特別アーカイブ。",
		playlistId: 'PL-faIdjPoxKiA5aStAASg7VMrjT_-90_o',
	},
	{
		slug: 'painting-series',
		kind: 'painting',
		label: 'PAINTING SERIES',
		title: '絵画シリーズ',
		description: '一枚の絵画を入口に、聖書、人生、信仰の風景を深く見つめるTHE ARTHUR HOLLANDS SHOWの特別シリーズ。',
		playlistId: 'PL-faIdjPoxKjNhr8TCuwAB1bk-J_whk2k',
	},
];

function toIsoDuration(seconds) {
	const value = Number(seconds || 0);
	if (!value) return '';
	const hours = Math.floor(value / 3600);
	const minutes = Math.floor((value % 3600) / 60);
	const secs = value % 60;
	return `PT${hours ? `${hours}H` : ''}${minutes ? `${minutes}M` : ''}${secs ? `${secs}S` : ''}`;
}

async function fetchPlaylist(item) {
	const url = `https://www.youtube.com/playlist?list=${item.playlistId}`;
	const { stdout } = await execFileAsync('yt-dlp', [
		'--flat-playlist',
		'--skip-download',
		'--dump-single-json',
		'--ignore-errors',
		'--ignore-no-formats-error',
		'--no-warnings',
		'--sleep-requests', '1',
		url,
	], {
		maxBuffer: 1024 * 1024 * 40,
		timeout: 1000 * 60 * 10,
	});
	const data = JSON.parse(stdout);
	const videos = (data.entries || [])
		.filter((entry) => entry?.id)
		.map((entry) => ({
			id: entry.id,
			title: entry.title || entry.fulltitle || '',
			thumbnail: `https://i.ytimg.com/vi/${entry.id}/hq720.jpg`,
			duration: toIsoDuration(entry.duration),
			viewCount: entry.view_count ? String(entry.view_count) : '',
		}))
		.filter((video) => video.id && video.title);

	return {
		...item,
		url,
		count: videos.length,
		videos,
	};
}

async function main() {
	const playlists = [];
	for (const item of series) {
		console.log(`Fetching ${item.slug}...`);
		playlists.push(await fetchPlaylist(item));
	}
	await fs.mkdir(path.dirname(outPath), { recursive: true });
	await fs.writeFile(outPath, `${JSON.stringify({ fetchedAt: new Date().toISOString(), playlists }, null, 2)}\n`, 'utf8');
	console.log(`Wrote ${outPath}`);
}

main().catch((error) => {
	console.error(error.stack || error.message);
	process.exit(1);
});
