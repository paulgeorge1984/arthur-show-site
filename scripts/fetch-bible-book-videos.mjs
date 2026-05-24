#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outPath = path.join(rootDir, 'src/data/bible-book-videos.json');
const execFileAsync = promisify(execFile);

const playlist = {
	id: 'PL-faIdjPoxKhk3dvt6OK5udmxtvf1JPJu',
	title: 'THE DAILY with Arthur Hollands from 66 books of the Bible',
	url: 'https://www.youtube.com/playlist?list=PL-faIdjPoxKhk3dvt6OK5udmxtvf1JPJu',
};

const bibleBooks = [
	'創世記', '出エジプト記', 'レビ記', '民数記', '申命記', 'ヨシュア記', '士師記', 'ルツ記',
	'サムエル記 第一', 'サムエル記 第二', '列王記 第一', '列王記 第二', '歴代誌 第一', '歴代誌 第二',
	'エズラ記', 'ネヘミヤ記', 'エステル記', 'ヨブ記', '詩篇', '箴言', '伝道者の書', '雅歌',
	'イザヤ書', 'エレミヤ書', '哀歌', 'エゼキエル書', 'ダニエル書', 'ホセア書', 'ヨエル書', 'アモス書',
	'オバデヤ書', 'ヨナ書', 'ミカ書', 'ナホム書', 'ハバクク書', 'ゼパニヤ書', 'ハガイ書', 'ゼカリヤ書', 'マラキ書',
	'マタイの福音書', 'マルコの福音書', 'ルカの福音書', 'ヨハネの福音書', '使徒の働き',
	'ローマ人への手紙', 'コリント人への手紙 第一', 'コリント人への手紙 第二', 'ガラテヤ人への手紙',
	'エペソ人への手紙', 'ピリピ人への手紙', 'コロサイ人への手紙', 'テサロニケ人への手紙 第一',
	'テサロニケ人への手紙 第二', 'テモテへの手紙 第一', 'テモテへの手紙 第二', 'テトスへの手紙',
	'ピレモンへの手紙', 'ヘブル人への手紙', 'ヤコブの手紙', 'ペテロの手紙 第一', 'ペテロの手紙 第二',
	'ヨハネの手紙 第一', 'ヨハネの手紙 第二', 'ヨハネの手紙 第三', 'ユダの手紙', 'ヨハネの黙示録',
];

const titleAliases = new Map([
	['ネヘミア記', 'ネヘミヤ記'],
	['サムエル記第一', 'サムエル記 第一'],
	['サムエル記第二', 'サムエル記 第二'],
	['列王記第一', '列王記 第一'],
	['列王記第二', '列王記 第二'],
	['歴代誌第一', '歴代誌 第一'],
	['歴代誌第二', '歴代誌 第二'],
	['コリント人への手紙第一', 'コリント人への手紙 第一'],
	['コリント人への手紙第二', 'コリント人への手紙 第二'],
	['テサロニケ人への手紙第一', 'テサロニケ人への手紙 第一'],
	['テサロニケ人への手紙第二', 'テサロニケ人への手紙 第二'],
	['テモテへの手紙第一', 'テモテへの手紙 第一'],
	['テモテへの手紙第二', 'テモテへの手紙 第二'],
	['ペテロの手紙第一', 'ペテロの手紙 第一'],
	['ペテロの手紙第二', 'ペテロの手紙 第二'],
	['ヨハネの手紙第一', 'ヨハネの手紙 第一'],
	['ヨハネの手紙第二', 'ヨハネの手紙 第二'],
	['ヨハネの手紙第三', 'ヨハネの手紙 第三'],
]);

function compact(value = '') {
	return String(value).normalize('NFKC').replace(/\s+/g, '');
}

function normalizeBookName(value = '') {
	return titleAliases.get(compact(value)) || value;
}

function findBook(title = '') {
	const compactTitle = compact(title);
	const matched = bibleBooks
		.map((book) => ({ book, key: compact(book) }))
		.find(({ key }) => compactTitle.includes(key));
	return matched?.book || normalizeBookName([...titleAliases.keys()].find((key) => compactTitle.includes(key)) || '');
}

function extractQuote(title = '') {
	return title.match(/「([^」]+)」/)?.[1]?.trim() || title.replace(/\s*-?\s*THE DAILY[\s\S]*$/i, '').trim();
}

function toIsoDuration(seconds) {
	const value = Number(seconds || 0);
	if (!value) return '';
	const hours = Math.floor(value / 3600);
	const minutes = Math.floor((value % 3600) / 60);
	const secs = value % 60;
	return `PT${hours ? `${hours}H` : ''}${minutes ? `${minutes}M` : ''}${secs ? `${secs}S` : ''}`;
}

function isPublicVideo(entry) {
	const title = String(entry?.title || '').trim();
	if (!entry?.id || !title) return false;
	return !/(^\[?private video\]?$|^\[?deleted video\]?$|unavailable|非公開|削除済み|この動画は再生できません)/i.test(title);
}

async function main() {
	const { stdout } = await execFileAsync('yt-dlp', [
		'--flat-playlist',
		'--skip-download',
		'--dump-single-json',
		'--ignore-errors',
		'--ignore-no-formats-error',
		'--no-warnings',
		playlist.url,
	], {
		maxBuffer: 1024 * 1024 * 40,
		timeout: 1000 * 60 * 5,
	});
	const playlistData = JSON.parse(stdout);
	const videos = (playlistData.entries || [])
		.filter(isPublicVideo)
		.map((entry) => ({
			id: entry.id,
			book: findBook(entry.title || entry.fulltitle || ''),
			title: entry.title || entry.fulltitle || '',
			quote: extractQuote(entry.title || entry.fulltitle || ''),
			url: `https://youtu.be/${entry.id}`,
			thumbnail: `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg`,
			duration: toIsoDuration(entry.duration),
		}))
		.filter((video) => video.book);

	const missingBooks = bibleBooks.filter((book) => !videos.some((video) => video.book === book));
	await fs.writeFile(outPath, `${JSON.stringify({
		fetchedAt: new Date().toISOString(),
		playlist: {
			...playlist,
			title: playlistData.title || playlist.title,
		},
		stats: {
			publicVideoCount: videos.length,
			linkedBookCount: new Set(videos.map((video) => video.book)).size,
			missingBooks,
		},
		videos,
	}, null, 2)}\n`, 'utf8');
	console.log(`Wrote ${outPath} (${videos.length} videos / ${new Set(videos.map((video) => video.book)).size} books)`);
	if (missingBooks.length) console.log(`Missing: ${missingBooks.join(', ')}`);
}

main().catch((error) => {
	console.error(error.stack || error.message);
	process.exit(1);
});
