#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const bookletPath = path.join(rootDir, 'src/data/word-of-god-booklet.json');

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
	['ローマ人への手紙', ['ローマ人への手紙', 'ローマ']],
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

const aliasPattern = [...aliasToBook.keys()]
	.sort((a, b) => b.length - a.length)
	.map((alias) => alias.split('').map(escapeRegExp).join('[\\s　]*'))
	.join('|');
const refRegex = new RegExp(
	`(${aliasPattern})\\s*(\\d{1,3})\\s*(?:(?:章\\s*(?:(\\d{1,3})(?:\\s*節)?(?:\\s*[-ー〜~–－]\\s*(\\d{1,3}))?)?)|(?:[:：]\\s*(\\d{1,3})(?:\\s*[-ー〜~–－]\\s*(\\d{1,3}))?))(?!\\d)`,
	'g',
);

function normalizeAlias(value = '') {
	return String(value).normalize('NFKC').replace(/[　\s・]/g, '').replace(/^第([一二三])/, '$1');
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatRef(book, chapter, verse, endVerse) {
	if (!verse) return `${book} ${chapter} 章`;
	return `${book} ${chapter}:${verse}${endVerse && endVerse !== verse ? `-${endVerse}` : ''}`;
}

function extractRefs(value = '') {
	const refs = [];
	const seen = new Set();
	const source = String(value).normalize('NFKC').replace(/[\r\n]+/g, ' ');
	for (const match of source.matchAll(refRegex)) {
		const book = aliasToBook.get(normalizeAlias(match[1]));
		const chapter = Number(match[2]);
		const verse = Number(match[3] || match[5] || 0);
		const endVerse = Number(match[4] || match[6] || verse || 0);
		if (!book || !chapter) continue;
		const ref = formatRef(book, chapter, verse, Math.max(verse, endVerse));
		if (seen.has(ref)) continue;
		seen.add(ref);
		refs.push(ref);
	}
	return refs;
}

function isWholeChapterRef(ref = '') {
	return /\s\d+\s*章$/.test(ref);
}

const booklet = JSON.parse(await fs.readFile(bookletPath, 'utf8'));
let repaired = 0;
let carried = 0;
let previousWholeChapterRefs = [];

for (const page of booklet.pages || []) {
	let refs = extractRefs(page.text || '');
	if (!refs.length) refs = extractRefs(`${page.label || ''}\n${(page.refs || []).join('\n')}`);
	if (refs.length) {
		const before = JSON.stringify(page.refs || []);
		page.refs = refs;
		page.label = refs[0];
		if (JSON.stringify(page.refs) !== before) repaired += 1;
		previousWholeChapterRefs = refs.filter(isWholeChapterRef);
		continue;
	}
	if ((!page.refs || !page.refs.length) && previousWholeChapterRefs.length) {
		page.refs = previousWholeChapterRefs;
		page.label = previousWholeChapterRefs[0];
		carried += 1;
	}
}

await fs.writeFile(bookletPath, `${JSON.stringify(booklet, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ repaired, carried }, null, 2));
