#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const linePath = process.env.LINE_SCRIPTURE_SOURCE || process.argv[2] || '';
const bookletPath = path.join(rootDir, 'src/data/word-of-god-booklet.json');
const fridayPath = path.join(rootDir, 'src/data/friday-night-archive.json');
const showPath = path.join(rootDir, 'src/data/arthur-show-archive.json');
const dailyPath = path.join(rootDir, 'src/data/daily-verse-videos.json');
const outPath = path.join(rootDir, 'src/data/line-scripture-video-links.json');

const bookAliases = [
	['創世記', ['創世記']],
	['出エジプト記', ['出エジプト記', '出エジプト']],
	['レビ記', ['レビ記', 'レビ']],
	['民数記', ['民数記', '民数']],
	['申命記', ['申命記', '申命']],
	['ヨシュア記', ['ヨシュア記', 'ヨシュア']],
	['士師記', ['士師記', '士師']],
	['ルツ記', ['ルツ記', 'ルツ']],
	['サムエル記 第一', ['サムエル記 第一', 'サムエル記第一', '第一サムエル', 'サムエル記上', 'サムエル上']],
	['サムエル記 第二', ['サムエル記 第二', 'サムエル記第二', '第二サムエル', 'サムエル記下', 'サムエル下']],
	['列王記 第一', ['列王記 第一', '列王記第一', '第一列王', '列王記上', '列王上']],
	['列王記 第二', ['列王記 第二', '列王記第二', '第二列王', '列王記下', '列王下']],
	['歴代誌 第一', ['歴代誌 第一', '歴代誌第一', '第一歴代誌', '歴代誌上', '歴代志上']],
	['歴代誌 第二', ['歴代誌 第二', '歴代誌第二', '第二歴代誌', '歴代誌下', '歴代志下']],
	['エズラ記', ['エズラ記', 'エズラ']],
	['ネヘミヤ記', ['ネヘミヤ記', 'ネヘミヤ']],
	['エステル記', ['エステル記', 'エステル']],
	['ヨブ記', ['ヨブ記', 'ヨブ']],
	['詩篇', ['詩篇', '詩編']],
	['箴言', ['箴言']],
	['伝道者の書', ['伝道者の書', '伝道者', 'コヘレトの言葉']],
	['雅歌', ['雅歌']],
	['イザヤ書', ['イザヤ書', 'イザヤ']],
	['エレミヤ書', ['エレミヤ書', 'エレミヤ']],
	['哀歌', ['哀歌']],
	['エゼキエル書', ['エゼキエル書', 'エゼキエル']],
	['ダニエル書', ['ダニエル書', 'ダニエル']],
	['ホセア書', ['ホセア書', 'ホセア']],
	['ヨエル書', ['ヨエル書', 'ヨエル']],
	['アモス書', ['アモス書', 'アモス']],
	['オバデヤ書', ['オバデヤ書', 'オバデヤ']],
	['ヨナ書', ['ヨナ書', 'ヨナ']],
	['ミカ書', ['ミカ書', 'ミカ']],
	['ナホム書', ['ナホム書', 'ナホム']],
	['ハバクク書', ['ハバクク書', 'ハバクク']],
	['ゼパニヤ書', ['ゼパニヤ書', 'ゼパニヤ']],
	['ハガイ書', ['ハガイ書', 'ハガイ']],
	['ゼカリヤ書', ['ゼカリヤ書', 'ゼカリヤ']],
	['マラキ書', ['マラキ書', 'マラキ']],
	['マタイの福音書', ['マタイの福音書', 'マタイによる福音書', 'マタイ福音書', 'マタイ']],
	['マルコの福音書', ['マルコの福音書', 'マルコによる福音書', 'マルコ福音書', 'マルコ']],
	['ルカの福音書', ['ルカの福音書', 'ルカによる福音書', 'ルカ福音書', 'ルカ']],
	['ヨハネの福音書', ['ヨハネの福音書', 'ヨハネによる福音書', 'ヨハネ福音書']],
	['使徒の働き', ['使徒の働き', '使徒行伝', '使徒言行録', '使徒']],
	['ローマ人への手紙', ['ローマ人への手紙', 'ローマ人への手紙', 'ローマ']],
	['コリント人への手紙 第一', ['コリント人への手紙 第一', 'コリント人への手紙第一', '第一コリント', 'コリント前書']],
	['コリント人への手紙 第二', ['コリント人への手紙 第二', 'コリント人への手紙第二', '第二コリント', 'コリント後書']],
	['ガラテヤ人への手紙', ['ガラテヤ人への手紙', 'ガラテヤ']],
	['エペソ人への手紙', ['エペソ人への手紙', 'エフェソ人への手紙', 'エペソ', 'エフェソ']],
	['ピリピ人への手紙', ['ピリピ人への手紙', 'フィリピ人への手紙', 'ピリピ', 'フィリピ']],
	['コロサイ人への手紙', ['コロサイ人への手紙', 'コロサイ']],
	['テサロニケ人への手紙 第一', ['テサロニケ人への手紙 第一', 'テサロニケ人への手紙第一', '第一テサロニケ', 'テサロニケ前書']],
	['テサロニケ人への手紙 第二', ['テサロニケ人への手紙 第二', 'テサロニケ人への手紙第二', '第二テサロニケ', 'テサロニケ後書']],
	['テモテへの手紙 第一', ['テモテへの手紙 第一', 'テモテへの手紙第一', '第一テモテ', 'テモテ前書']],
	['テモテへの手紙 第二', ['テモテへの手紙 第二', 'テモテへの手紙第二', '第二テモテ', 'テモテ後書']],
	['テトスへの手紙', ['テトスへの手紙', 'テトス']],
	['ピレモンへの手紙', ['ピレモンへの手紙', 'ピレモン']],
	['ヘブル人への手紙', ['ヘブル人への手紙', 'へブル人への手紙', 'ヘブライ人への手紙', 'ヘブル', 'ヘブライ']],
	['ヤコブの手紙', ['ヤコブの手紙', 'ヤコブ']],
	['ペテロの手紙 第一', ['ペテロの手紙 第一', 'ペテロの手紙第一', '第一ペテロ', 'ペテロ前書']],
	['ペテロの手紙 第二', ['ペテロの手紙 第二', 'ペテロの手紙第二', '第二ペテロ', 'ペテロ後書']],
	['ヨハネの手紙 第一', ['ヨハネの手紙 第一', 'ヨハネの手紙第一', '第一ヨハネ', 'ヨハネ第一書']],
	['ヨハネの手紙 第二', ['ヨハネの手紙 第二', 'ヨハネの手紙第二', '第二ヨハネ', 'ヨハネ第二書']],
	['ヨハネの手紙 第三', ['ヨハネの手紙 第三', 'ヨハネの手紙第三', '第三ヨハネ', 'ヨハネ第三書']],
	['ユダの手紙', ['ユダの手紙', 'ユダ']],
	['ヨハネの黙示録', ['ヨハネの黙示録', '黙示録']],
];

const aliasToBook = new Map();
for (const [book, aliases] of bookAliases) {
	for (const alias of aliases) aliasToBook.set(normalizeAlias(alias), book);
}
const aliasPattern = [...aliasToBook.keys()].sort((a, b) => b.length - a.length).map(escapeRegExp).join('|');
const refRegex = new RegExp(
	`(${aliasPattern})[^0-9\\n]{0,8}(\\d{1,3})\\s*(?:(?:章\\s*(?:(\\d{1,3})(?:\\s*節)?(?:\\s*[-ー〜~–－]\\s*(\\d{1,3}))?)?)|(?:[:：]\\s*(\\d{1,3})(?:\\s*[-ー〜~–－]\\s*(\\d{1,3}))?))`,
	'g',
);

function normalizeAlias(value = '') {
	return String(value).normalize('NFKC').replace(/[　\s・]/g, '').replace(/^第([一二三])/, '$1');
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toDateKey(date) {
	return date.toISOString().slice(0, 10);
}

function addDays(dateKey, days) {
	const date = new Date(`${dateKey}T00:00:00+09:00`);
	date.setDate(date.getDate() + days);
	return toDateKey(date);
}

function dayDiff(a, b) {
	const aTime = new Date(`${a}T00:00:00+09:00`).getTime();
	const bTime = new Date(`${b}T00:00:00+09:00`).getTime();
	return Math.round((aTime - bTime) / 86400000);
}

function parseLineMessages(text) {
	const messages = [];
	let currentDate = '';
	let current = null;
	for (const rawLine of text.split(/\r?\n/)) {
		const dateMatch = rawLine.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
		if (dateMatch) {
			currentDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
			current = null;
			continue;
		}
		const messageMatch = rawLine.match(/^(\d{1,2}:\d{2})\t([^\t]+)\t([\s\S]*)$/);
		if (messageMatch) {
			current = {
				date: currentDate,
				time: messageMatch[1],
				sender: messageMatch[2],
				text: messageMatch[3],
			};
			messages.push(current);
			continue;
		}
		if (current && rawLine.trim()) current.text += `\n${rawLine}`;
	}
	return messages;
}

function extractRefs(text = '') {
	const normalized = normalizeAlias(text);
	const refs = [];
	for (const match of normalized.matchAll(refRegex)) {
		const book = aliasToBook.get(match[1]);
		const chapter = Number(match[2]);
		const explicitVerse = Number(match[3] || match[5] || 0);
		const startVerse = explicitVerse || 1;
		const endVerse = Number(match[4] || match[6] || explicitVerse || 999);
		if (!book || !chapter || !startVerse) continue;
		refs.push({
			book,
			chapter,
			startVerse,
			endVerse: Math.max(startVerse, endVerse),
			label: explicitVerse ? `${book} ${chapter}:${startVerse}${endVerse > startVerse ? `-${endVerse}` : ''}` : `${book} ${chapter} 章`,
		});
	}
	return refs;
}

function parseRef(value = '') {
	const refs = extractRefs(value);
	return refs[0] || null;
}

function refsOverlap(a, b) {
	if (!a || !b) return false;
	if (a.book !== b.book || a.chapter !== b.chapter) return false;
	return a.startVerse <= b.endVerse && b.startVerse <= a.endVerse;
}

function buildPages(booklet) {
	return (booklet.pages || [])
		.filter((page) => Array.isArray(page.refs) && page.refs.length)
		.map((page) => ({
			...page,
			parsedRefs: page.refs.map(parseRef).filter(Boolean),
		}));
}

function pagesForRef(ref, pages) {
	return pages.filter((page) => page.parsedRefs.some((pageRef) => refsOverlap(ref, pageRef)));
}

function parseDates(value = '') {
	const source = String(value).normalize('NFKC');
	const dates = [];
	for (const match of source.matchAll(/(20\d{2})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/g)) {
		dates.push(`${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`);
	}
	for (const match of source.matchAll(/(20\d{2})[/.](\d{1,2})[/.](\d{1,2})/g)) {
		dates.push(`${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`);
	}
	for (const match of source.matchAll(/(\d{4})-(\d{2})-(\d{2})/g)) {
		dates.push(`${match[1]}-${match[2]}-${match[3]}`);
	}
	return [...new Set(dates)];
}

function firstFriday(year, month) {
	const date = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00+09:00`);
	while (date.getDay() !== 5) date.setDate(date.getDate() + 1);
	return toDateKey(date);
}

function expectedMonthlyFridayNight(year, month) {
	const date = new Date(`${firstFriday(year, month)}T00:00:00+09:00`);
	if (month === 1 || month === 5) date.setDate(date.getDate() + 7);
	return toDateKey(date);
}

function firstFridayNextMonth(dateKey) {
	const date = new Date(`${dateKey}T00:00:00+09:00`);
	date.setMonth(date.getMonth() + 1, 1);
	return firstFriday(date.getFullYear(), date.getMonth() + 1);
}

function expectedFridayNightDate(lineDate) {
	const date = new Date(`${lineDate}T00:00:00+09:00`);
	const current = expectedMonthlyFridayNight(date.getFullYear(), date.getMonth() + 1);
	if (dayDiff(lineDate, current) <= 3) return current;
	date.setMonth(date.getMonth() + 1, 1);
	return expectedMonthlyFridayNight(date.getFullYear(), date.getMonth() + 1);
}

function expectedShowDates(lineDate) {
	const dates = new Set();
	for (let offset = -1; offset <= 2; offset += 1) {
		const candidate = addDays(lineDate, offset);
		const day = new Date(`${candidate}T00:00:00+09:00`).getDay();
		if (day === 2 || day === 3) dates.add(candidate);
	}
	return dates;
}

function decorateFriday(video) {
	const dates = parseDates(video.title);
	return {
		...video,
		source: 'FRIDAY NIGHT',
		eventDate: dates[0] || '',
		publishedDate: dates[1] || '',
		matchKind: 'friday-night-date',
	};
}

function decorateShow(video) {
	const dates = parseDates(`${video.title} ${video.description || ''}`);
	const publishedDate = video.publishedAt ? video.publishedAt.slice(0, 10) : '';
	return {
		...video,
		source: 'THE ARTHUR HOLLANDS SHOW',
		eventDate: dates[0] || publishedDate,
		publishedDate,
		matchKind: 'show-date',
	};
}

function decorateDaily(video) {
	const dates = parseDates(video.title);
	return {
		...video,
		source: 'THE DAILY',
		eventDate: video.eventDate || dates[0] || '',
		matchKind: 'daily-scripture',
	};
}

function videoCard(video) {
	return {
		id: video.id,
		title: video.title,
		url: video.url || (video.id ? `https://youtu.be/${video.id}` : ''),
		thumbnail: video.thumbnail,
		duration: video.duration || '',
		source: video.source,
	};
}

function findFridayVideos(lineDate, fridayVideos) {
	const expected = expectedFridayNightDate(lineDate);
	const expectedRelease = firstFridayNextMonth(expected);
	const matched = fridayVideos
		.filter((video) => {
			const eventMatches = video.eventDate && Math.abs(dayDiff(video.eventDate, expected)) <= 7;
			const releaseMatches = video.publishedDate && Math.abs(dayDiff(video.publishedDate, expectedRelease)) <= 7;
			return eventMatches || releaseMatches;
		})
		.map((video) => videoCard(video))
		.slice(0, 2);
	if (matched.length) return matched;
	return fridayVideos
		.filter((video) => video.eventDate && Math.abs(dayDiff(video.eventDate, lineDate)) <= 14)
		.map((video) => videoCard(video))
		.slice(0, 1);
}

function findShowVideos(lineDate, showVideos) {
	const expectedDates = expectedShowDates(lineDate);
	const matched = showVideos
		.filter((video) => video.eventDate && expectedDates.has(video.eventDate))
		.map((video) => videoCard(video))
		.slice(0, 2);
	if (matched.length) return matched;
	return showVideos
		.filter((video) => video.eventDate && Math.abs(dayDiff(video.eventDate, lineDate)) <= 3)
		.map((video) => videoCard(video))
		.slice(0, 1);
}

function findDailyVideos(pageNumber, lineDate, dailyByPage) {
	const videos = dailyByPage[String(pageNumber)] || [];
	return videos
		.map(decorateDaily)
		.filter((video) => !video.eventDate || (dayDiff(video.eventDate, lineDate) >= 0 && dayDiff(video.eventDate, lineDate) <= 7))
		.map((video) => videoCard(video))
		.slice(0, 3);
}

function findDailyBatchVideo(refIndex, refCount, lineDate, dailyVideos) {
	if (refCount < 2) return [];
	const candidates = dailyVideos
		.filter((video) => video.eventDate && dayDiff(video.eventDate, lineDate) >= 0 && dayDiff(video.eventDate, lineDate) <= 9)
		.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
	const video = candidates[refIndex];
	return video ? [videoCard(video)] : [];
}

function uniqueVideos(videos) {
	const seen = new Set();
	return videos.filter((video) => {
		const key = `${video.source}:${video.id}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

async function main() {
	if (!linePath) {
		throw new Error('LINE_SCRIPTURE_SOURCE or a local LINE export path argument is required. The private LINE export itself must not be committed.');
	}
	const [lineText, booklet, friday, show, daily] = await Promise.all([
		fs.readFile(linePath, 'utf8'),
		fs.readFile(bookletPath, 'utf8').then(JSON.parse),
		fs.readFile(fridayPath, 'utf8').then(JSON.parse),
		fs.readFile(showPath, 'utf8').then(JSON.parse),
		fs.readFile(dailyPath, 'utf8').then(JSON.parse),
	]);
	const pages = buildPages(booklet);
	const fridayVideos = (friday.videos || []).map(decorateFriday).filter((video) => video.eventDate && !/^【VR版】/.test(video.title));
	const showVideos = (show.videos || []).map(decorateShow).filter((video) => video.eventDate);
	const dailyVideos = (daily.videos || []).map(decorateDaily).filter((video) => video.eventDate);
	const messages = parseLineMessages(lineText).filter((message) => message.sender === 'Arthur Hollands');
	const videosByPage = {};
	let lineRefCount = 0;

	for (const message of messages) {
		const refs = extractRefs(message.text);
		if (!refs.length) continue;
		for (const [refIndex, ref] of refs.entries()) {
			const matchedPages = pagesForRef(ref, pages);
			if (!matchedPages.length) continue;
			lineRefCount += 1;
			for (const page of matchedPages) {
				const videos = uniqueVideos([
					...findFridayVideos(message.date, fridayVideos),
					...findShowVideos(message.date, showVideos),
					...findDailyVideos(page.page, message.date, daily.videosByPage || {}),
					...findDailyBatchVideo(refIndex, refs.length, message.date, dailyVideos),
				]);
				if (!videos.length) continue;
				videosByPage[page.page] ||= [];
				videosByPage[page.page].push(...videos);
			}
		}
	}

	for (const videos of Object.values(videosByPage)) {
		const seen = new Set();
		for (let index = videos.length - 1; index >= 0; index -= 1) {
			const video = videos[index];
			const key = `${video.source}:${video.id}`;
			if (seen.has(key)) videos.splice(index, 1);
			seen.add(key);
		}
	}

	const linkedVideoCount = Object.values(videosByPage).reduce((total, videos) => total + videos.length, 0);

	await fs.writeFile(outPath, `${JSON.stringify({
		generatedAt: new Date().toISOString(),
		stats: {
			linkedPageCount: Object.keys(videosByPage).length,
			linkedVideoCount,
		},
		videosByPage,
	}, null, 2)}\n`, 'utf8');

	console.log(`Wrote ${outPath}`);
	console.log(JSON.stringify({
		lineScriptureRefsMatchedToPdf: lineRefCount,
		linkedPageCount: Object.keys(videosByPage).length,
		linkedVideoCount,
	}, null, 2));
}

main().catch((error) => {
	console.error(error.stack || error.message);
	process.exit(1);
});
