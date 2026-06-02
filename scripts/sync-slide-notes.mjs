import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const contentRoot = path.join(repoRoot, 'src/content/daily-messages');
const outputPath = path.join(repoRoot, 'src/data/slideNotes.ts');
const deckPattern = /(?:docs\.google\.com|docs-google-com\.translate\.goog)\/presentation\/d\/([A-Za-z0-9_-]+)/g;
const concurrency = Number(process.env.SLIDE_NOTES_CONCURRENCY || 8);
const timeoutMs = Number(process.env.SLIDE_NOTES_TIMEOUT_MS || 30000);

if (process.env.SKIP_SLIDE_NOTES_SYNC === '1') {
	console.log('[slide-notes] Skipped because SKIP_SLIDE_NOTES_SYNC=1');
	process.exit(0);
}

async function listMdxFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const fullPath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...await listMdxFiles(fullPath));
		} else if (entry.isFile() && entry.name.endsWith('.mdx')) {
			files.push(fullPath);
		}
	}

	return files.sort();
}

async function collectDeckIds() {
	const deckIds = new Set();

	for (const file of await listMdxFiles(contentRoot)) {
		const body = await readFile(file, 'utf8');
		for (const match of body.matchAll(deckPattern)) {
			deckIds.add(match[1]);
		}
	}

	return [...deckIds];
}

async function readExistingNotes() {
	try {
		const source = await readFile(outputPath, 'utf8');
		const start = source.indexOf('{');
		const end = source.lastIndexOf('};');
		if (start === -1 || end === -1) return new Map();

		const objectSource = source
			.slice(start, end + 1)
			.replace(/,\s*}/, '\n}');
		const parsed = JSON.parse(objectSource);
		return new Map(Object.entries(parsed).filter(([, value]) => typeof value === 'string' && value.trim()));
	} catch (error) {
		console.warn(`[slide-notes] Could not read existing notes: ${error.message}`);
		return new Map();
	}
}

function cleanSlideText(text) {
	return text
		.replace(/\r\n/g, '\n')
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

async function fetchSlideText(deckId) {
	const url = `https://docs.google.com/presentation/d/${deckId}/export/txt`;

	for (let attempt = 1; attempt <= 3; attempt += 1) {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), timeoutMs);

		try {
			const response = await fetch(url, {
				redirect: 'follow',
				signal: controller.signal,
				headers: {
					'User-Agent': 'arthur-show-slide-notes-sync/1.0',
				},
			});
			const text = cleanSlideText(await response.text());

			if (response.ok && text) return { text };
			if (attempt === 3) {
				return { error: `HTTP ${response.status} (${text.length} bytes)` };
			}
		} catch (error) {
			if (attempt === 3) return { error: error.message };
		} finally {
			clearTimeout(timeout);
		}

		await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
	}

	return { error: 'Unknown fetch failure' };
}

async function syncDecks(deckIds, existingNotes) {
	const syncedNotes = new Map();
	const failures = [];
	let cursor = 0;

	async function worker() {
		while (cursor < deckIds.length) {
			const deckId = deckIds[cursor];
			cursor += 1;

			const result = await fetchSlideText(deckId);
			if (result.text) {
				syncedNotes.set(deckId, result.text);
				continue;
			}

			if (existingNotes.has(deckId)) {
				syncedNotes.set(deckId, existingNotes.get(deckId));
				failures.push({ deckId, keptExisting: true, error: result.error });
				continue;
			}

			failures.push({ deckId, keptExisting: false, error: result.error });
		}
	}

	await Promise.all(Array.from({ length: Math.min(concurrency, deckIds.length) }, worker));
	return { syncedNotes, failures };
}

function buildSource(deckIds, notes) {
	let source = 'export const slideNotesByDeckId: Record<string, string> = {\n';

	for (const deckId of deckIds) {
		const text = notes.get(deckId);
		if (!text) continue;
		source += `\t${JSON.stringify(deckId)}: ${JSON.stringify(text)},\n`;
	}

	source += '};\n';
	return source;
}

const deckIds = await collectDeckIds();
const existingNotes = await readExistingNotes();
const { syncedNotes, failures } = await syncDecks(deckIds, existingNotes);
const nextSource = buildSource(deckIds, syncedNotes);
const previousSource = await readFile(outputPath, 'utf8').catch(() => '');

if (nextSource !== previousSource) {
	await writeFile(outputPath, nextSource, 'utf8');
	console.log(`[slide-notes] Updated ${path.relative(repoRoot, outputPath)}`);
} else {
	console.log('[slide-notes] No changes');
}

const missingCount = deckIds.filter((deckId) => !syncedNotes.has(deckId)).length;
console.log(`[slide-notes] Decks: ${deckIds.length}; notes: ${syncedNotes.size}; missing: ${missingCount}`);

if (failures.length) {
	for (const failure of failures) {
		const action = failure.keptExisting ? 'kept existing text' : 'no text available';
		console.warn(`[slide-notes] ${failure.deckId}: ${failure.error}; ${action}`);
	}
}
