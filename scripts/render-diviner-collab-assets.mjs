import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const campaignDir = path.join(root, 'public/assets/diviner-arthur-202606');
const sourceDir = path.join(campaignDir, 'source');
const renderedDir = path.join(campaignDir, 'rendered');

const fonts = {
	head: 'Impact, Oswald, Arial Black, sans-serif',
	sans: 'Hiragino Kaku Gothic ProN, Yu Gothic, Noto Sans JP, sans-serif',
	serif: 'Hiragino Mincho ProN, Yu Mincho, serif',
};

const colors = {
	black: '#060606',
	charcoal: '#151515',
	ink: '#f5f1e8',
	muted: '#bcb6ad',
	red: '#b12c2d',
	wood: '#caa770',
};

const files = {
	texture: 'gptimg2-texture-background.png',
	walkFront: 'walk-front-cross.jpg',
	walkBack: 'walk-back-road.jpg',
	walkClose: 'walk-closeup-cross.jpg',
	wheel: 'walk-wheel-detail.jpg',
	water: 'walk-water-cross.jpg',
	graphicProduct: 'graphic-tee-product.jpg',
	graphicBack: 'graphic-tee-back-print.jpg',
	graphicFront: 'graphic-tee-front-logo.jpg',
	graphicHem: 'graphic-tee-hem-label.jpg',
	photoModel: 'photo-tee-model-front.jpg',
	photoProduct: 'photo-tee-product.jpg',
	photoPrint: 'photo-tee-print-detail.jpg',
	photoNeck: 'photo-tee-neck-you-are-loved.jpg',
	photoHem: 'photo-tee-hem-label.jpg',
	photoWalkClose: 'photo-walk-closeup-cross.jpg',
	photoWater: 'photo-walk-water-cross.jpg',
};

function esc(text) {
	return String(text)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

async function dataUri(name) {
	const file = path.join(sourceDir, name);
	const ext = path.extname(name).toLowerCase();
	const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
	const buf = await fs.readFile(file);
	return `data:${mime};base64,${buf.toString('base64')}`;
}

function image(href, x, y, width, height, options = {}) {
	const { opacity = 1, ratio = 'xMidYMid slice', clip = '', filter = '' } = options;
	return `<image href="${href}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="${ratio}" opacity="${opacity}" ${clip ? `clip-path="url(#${clip})"` : ''} ${filter ? `filter="url(#${filter})"` : ''}/>`;
}

function block(x, y, width, height, fill = colors.black, opacity = 1, radius = 0) {
	return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" opacity="${opacity}"/>`;
}

function textLines(lines, x, y, options = {}) {
	const {
		size = 64,
		lineHeight = Math.round(size * 1.18),
		weight = 700,
		fill = colors.ink,
		family = fonts.sans,
		anchor = 'start',
		spacing = 0,
		opacity = 1,
		transform = '',
	} = options;
	const tspans = lines
		.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${esc(line)}</tspan>`)
		.join('');
	return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" opacity="${opacity}" letter-spacing="${spacing}" ${transform ? `transform="${transform}"` : ''}>${tspans}</text>`;
}

function label(text, x, y, options = {}) {
	const { width = 260, fill = colors.red, textFill = colors.ink, size = 34 } = options;
	return [
		block(x, y - 42, width, 56, fill, 1, 4),
		textLines([text], x + width / 2, y, {
			size,
			weight: 900,
			fill: textFill,
			family: fonts.head,
			anchor: 'middle',
		}),
	].join('');
}

function svgBase(width, height, content, defs = '') {
	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs>
<filter id="grain">
  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/>
  <feColorMatrix type="saturate" values="0"/>
  <feComponentTransfer><feFuncA type="table" tableValues="0 0.12"/></feComponentTransfer>
</filter>
<filter id="mono">
  <feColorMatrix type="matrix" values="0.9 0.05 0.05 0 0  0.08 0.85 0.08 0 0  0.06 0.06 0.82 0 0  0 0 0 1 0"/>
</filter>
${defs}
</defs>
${content}
</svg>`;
}

async function writePng(fileName, width, height, content, defs = '') {
	const svg = svgBase(width, height, content, defs);
	await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(renderedDir, fileName));
}

async function writeJpeg(fileName, width, height, content, defs = '') {
	const svg = svgBase(width, height, content, defs);
	await sharp(Buffer.from(svg)).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(renderedDir, fileName));
}

async function writeWebpThumb(input, output, width, height = null) {
	await sharp(path.join(sourceDir, input))
		.resize({ width, height, fit: height ? 'cover' : 'inside', withoutEnlargement: false })
		.webp({ quality: 82 })
		.toFile(path.join(renderedDir, output));
}

function clipDefs(items) {
	return items
		.map(({ id, x, y, width, height, radius = 0 }) => `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}"/></clipPath>`)
		.join('');
}

async function renderA4(assets) {
	const w = 2480;
	const h = 3508;
	const defs = clipDefs([
		{ id: 'heroClip', x: 0, y: 0, width: 2480, height: 1520 },
		{ id: 'productA', x: 132, y: 1664, width: 1040, height: 960, radius: 20 },
		{ id: 'productB', x: 1308, y: 1664, width: 1040, height: 960, radius: 20 },
		{ id: 'story1', x: 136, y: 2818, width: 404, height: 506, radius: 16 },
		{ id: 'story2', x: 586, y: 2818, width: 404, height: 506, radius: 16 },
		{ id: 'story3', x: 1036, y: 2818, width: 404, height: 506, radius: 16 },
		{ id: 'story4', x: 1486, y: 2818, width: 404, height: 506, radius: 16 },
		{ id: 'story5', x: 1936, y: 2818, width: 404, height: 506, radius: 16 },
	]);
	const timeline = [
		['6/22 MON', 'SNS投稿', '初回告知'],
		['6/24 WED', 'INTERVIEW', '記事公開'],
		['6/26 FRI', 'SNS投稿', '発売前告知'],
		['6/27 SAT 21:00', 'LAUNCH', '発売開始'],
	];
	const timelineSvg = timeline
		.map((item, index) => {
			const x = 150 + index * 548;
			const fill = index === 3 ? colors.red : colors.charcoal;
			return [
				block(x, 1358, 464, 184, fill, 0.94, 8),
				textLines([item[0]], x + 232, 1424, {
					size: index === 3 ? 48 : 44,
					weight: 900,
					fill: colors.ink,
					family: fonts.head,
					anchor: 'middle',
				}),
				textLines([item[1], item[2]], x + 232, 1488, {
					size: 30,
					lineHeight: 40,
					weight: 700,
					fill: index === 3 ? '#fff6f6' : colors.muted,
					family: fonts.sans,
					anchor: 'middle',
				}),
			].join('');
		})
		.join('');
	return writePng(
		'a4-infographic.png',
		w,
		h,
		[
			block(0, 0, w, h, colors.black),
			image(assets.texture, 0, 0, w, h, { opacity: 0.18 }),
			image(assets.walkFront, 0, 0, w, 1520, { clip: 'heroClip', filter: 'mono' }),
			block(0, 0, w, 1520, '#000', 0.48),
			block(0, 1060, w, 460, '#000', 0.7),
			block(0, 0, 32, h, colors.red, 1),
			label('COLLABORATION TEE', 136, 208, { width: 600, size: 42 }),
			textLines(['ARTHUR HOLLANDS', '× DIVINER'], 136, 382, {
				size: 166,
				lineHeight: 176,
				weight: 900,
				family: fonts.head,
				fill: colors.ink,
			}),
			textLines(['Tシャツ2種類、', '6/27（土）21:00 発売開始。'], 136, 818, {
				size: 78,
				lineHeight: 94,
				weight: 900,
				family: fonts.sans,
				fill: colors.ink,
			}),
			textLines(['どちらもDIVINER公式サイトで購入できます', 'https://www.joker-ev.jp'], 136, 1044, {
				size: 52,
				lineHeight: 66,
				weight: 700,
				family: fonts.sans,
				fill: colors.muted,
			}),
			timelineSvg,
			textLines(['TWO RELEASE ITEMS'], 136, 1642, {
				size: 52,
				weight: 900,
				family: fonts.head,
				fill: colors.red,
			}),
			image(assets.graphicProduct, 132, 1664, 1040, 960, { clip: 'productA' }),
			block(132, 2384, 1040, 240, '#151515', 1, 0),
			textLines(['01', 'Graphic TEE'], 180, 2452, {
				size: 48,
				lineHeight: 56,
				weight: 900,
				family: fonts.head,
			}),
			textLines(['WALK ACROSS / YOU ARE LOVED', 'John 3:16 を背負うグラフィック。'], 180, 2578, {
				size: 30,
				lineHeight: 40,
				weight: 700,
				fill: colors.muted,
			}),
			image(assets.photoProduct, 1308, 1664, 1040, 960, { clip: 'productB' }),
			block(1308, 2384, 1040, 240, '#151515', 1, 0),
			textLines(['02', 'Photo TEE'], 1356, 2452, {
				size: 48,
				lineHeight: 56,
				weight: 900,
				family: fonts.head,
			}),
			textLines(['ARTHUR HOLLANDS × DIVINER', '写真プリント仕様のコラボT。'], 1356, 2578, {
				size: 30,
				lineHeight: 40,
				weight: 700,
				fill: colors.muted,
			}),
			textLines(['PROMO VISUAL SET'], 136, 2782, {
				size: 48,
				weight: 900,
				family: fonts.head,
				fill: colors.red,
			}),
			image(assets.walkClose, 136, 2818, 404, 506, { clip: 'story1' }),
			image(assets.graphicBack, 586, 2818, 404, 506, { clip: 'story2' }),
			image(assets.photoModel, 1036, 2818, 404, 506, { clip: 'story3' }),
			image(assets.photoPrint, 1486, 2818, 404, 506, { clip: 'story4' }),
			image(assets.wheel, 1936, 2818, 404, 506, { clip: 'story5' }),
			textLines(['YOU ARE LOVED 告知: 6/26（金） / 発売前SNS投稿'], 136, 3408, {
				size: 34,
				weight: 700,
				fill: colors.muted,
			}),
			textLines(['THE ARTHUR HOLLANDS SHOW'], 2348, 3408, {
				size: 34,
				weight: 900,
				fill: colors.ink,
				family: fonts.head,
				anchor: 'end',
			}),
			block(0, 0, w, h, '#000', 0, 0),
			block(0, 0, w, h, '#000', 0.02, 0),
			block(0, 0, w, h, '#fff', 0, 0),
			'<rect width="2480" height="3508" filter="url(#grain)" opacity="0.55"/>',
		].join(''),
		defs,
	);
}

async function renderOg(assets) {
	const w = 1200;
	const h = 630;
	const defs = clipDefs([
		{ id: 'ogPhoto', x: 760, y: 48, width: 382, height: 534, radius: 8 },
	]);
	return writeJpeg(
		'og-diviner-arthur-collab.jpg',
		w,
		h,
		[
			block(0, 0, w, h, colors.black),
			image(assets.texture, 0, 0, w, h, { opacity: 0.2 }),
			image(assets.walkBack, 0, 0, w, h, { opacity: 0.5, filter: 'mono' }),
			block(0, 0, w, h, '#000', 0.5),
			block(0, 0, 18, h, colors.red),
			textLines(['ARTHUR', 'HOLLANDS', '× DIVINER'], 56, 118, {
				size: 70,
				lineHeight: 74,
				weight: 900,
				family: fonts.head,
			}),
			textLines(['NEW COLLABORATION'], 60, 360, { size: 42, weight: 900, family: fonts.head, fill: colors.red }),
			textLines(['STAY TUNED', 'A NEW SIGNAL IS COMING'], 60, 438, {
				size: 34,
				lineHeight: 46,
				weight: 700,
				fill: colors.muted,
			}),
			textLines(['www.joker-ev.jp'], 60, 544, { size: 38, weight: 900, family: fonts.head }),
			image(assets.walkClose, 760, 48, 382, 534, { clip: 'ogPhoto' }),
			block(0, 0, w, h, '#fff', 0),
			'<rect width="1200" height="630" filter="url(#grain)" opacity="0.5"/>',
		].join(''),
		defs,
	);
}

async function renderSocial(assetName, spec, assets) {
	const w = 1080;
	const h = 1350;
	const defs = clipDefs([
		{ id: 'main', x: 70, y: 64, width: 940, height: 630, radius: 10 },
		{ id: 'smallA', x: 70, y: 1066, width: 442, height: 140, radius: 8 },
		{ id: 'smallB', x: 568, y: 1066, width: 442, height: 140, radius: 8 },
	]);
	return writePng(
		assetName,
		w,
		h,
		[
			block(0, 0, w, h, colors.black),
			image(assets.texture, 0, 0, w, h, { opacity: 0.16 }),
			image(spec.main, 70, 64, 940, 630, { clip: 'main', filter: spec.mono ? 'mono' : '' }),
			block(70, 64, 940, 630, '#000', spec.mainShade ?? 0.18, 10),
			block(70, 650, 940, 62, colors.red, 0.95, 0),
			textLines([spec.kicker], 100, 691, { size: 32, weight: 900, family: fonts.head }),
			textLines(spec.title, 70, 812, {
				size: spec.titleSize ?? 86,
				lineHeight: spec.titleLineHeight ?? 92,
				weight: 900,
				family: fonts.head,
			}),
			textLines(spec.body, 74, 974, {
				size: 38,
				lineHeight: 50,
				weight: 700,
				fill: colors.muted,
			}),
			image(spec.smallA, 70, 1066, 442, 140, { clip: 'smallA' }),
			image(spec.smallB, 568, 1066, 442, 140, { clip: 'smallB' }),
			block(70, 1230, 940, 82, spec.ctaRed ? colors.red : colors.charcoal, 0.98, 6),
			textLines([spec.cta], 540, 1285, {
				size: 40,
				weight: 900,
				fill: colors.ink,
				family: fonts.head,
				anchor: 'middle',
			}),
			'<rect width="1080" height="1350" filter="url(#grain)" opacity="0.52"/>',
		].join(''),
		defs,
	);
}

async function renderStoryLaunch(assets) {
	const w = 1080;
	const h = 1920;
	const defs = clipDefs([
		{ id: 'hero', x: 0, y: 0, width: 1080, height: 1180 },
		{ id: 'p1', x: 78, y: 1230, width: 448, height: 372, radius: 8 },
		{ id: 'p2', x: 554, y: 1230, width: 448, height: 372, radius: 8 },
	]);
	return writePng(
		'story-20260627-launch.png',
		w,
		h,
		[
			block(0, 0, w, h, colors.black),
			image(assets.walkFront, 0, 0, 1080, 1180, { clip: 'hero', filter: 'mono' }),
			block(0, 0, w, 1180, '#000', 0.46),
			block(0, 0, 20, h, colors.red),
			textLines(['ARTHUR HOLLANDS', '× DIVINER'], 70, 190, {
				size: 86,
				lineHeight: 96,
				weight: 900,
				family: fonts.head,
			}),
			textLines(['NOW ON SALE'], 70, 520, { size: 112, weight: 900, family: fonts.head, fill: colors.red }),
			textLines(['6/27（土）21:00', 'DIVINER公式サイトで発売開始'], 74, 652, {
				size: 48,
				lineHeight: 64,
				weight: 900,
			}),
			image(assets.graphicProduct, 78, 1230, 448, 372, { clip: 'p1' }),
			image(assets.photoProduct, 554, 1230, 448, 372, { clip: 'p2' }),
			textLines(['2 TYPES TEE', 'www.joker-ev.jp'], 540, 1734, {
				size: 52,
				lineHeight: 66,
				weight: 900,
				family: fonts.head,
				anchor: 'middle',
			}),
			'<rect width="1080" height="1920" filter="url(#grain)" opacity="0.52"/>',
		].join(''),
		defs,
	);
}

async function renderContactSheet(assets) {
	const w = 1800;
	const h = 2400;
	const clips = [];
	const cells = [
		['walk-front-cross.jpg', 'WALK / FRONT'],
		['walk-closeup-cross.jpg', 'WALK / CLOSE'],
		['graphic-tee-product.jpg', 'GRAPHIC TEE'],
		['graphic-tee-back-print.jpg', 'GRAPHIC PRINT'],
		['photo-tee-model-front.jpg', 'PHOTO TEE MODEL'],
		['photo-tee-product.jpg', 'PHOTO TEE PRODUCT'],
		['photo-tee-print-detail.jpg', 'PHOTO PRINT'],
		['photo-tee-neck-you-are-loved.jpg', 'YOU ARE LOVED'],
		['walk-wheel-detail.jpg', 'WHEEL DETAIL'],
		['photo-walk-water-cross.jpg', 'WALK / WATER'],
		['graphic-tee-front-logo.jpg', 'FRONT LOGO'],
		['photo-tee-hem-label.jpg', 'HEM LABEL'],
	];
	const body = [];
	cells.forEach((cell, index) => {
		const col = index % 3;
		const row = Math.floor(index / 3);
		const x = 100 + col * 550;
		const y = 430 + row * 455;
		const id = `c${index}`;
		clips.push({ id, x, y, width: 490, height: 360, radius: 8 });
		body.push(image(assets[cell[0]], x, y, 490, 360, { clip: id }));
		body.push(block(x, y + 292, 490, 68, '#000', 0.68));
		body.push(textLines([cell[1]], x + 245, y + 336, {
			size: 30,
			weight: 900,
			family: fonts.head,
			anchor: 'middle',
		}));
	});
	return writeJpeg(
		'photo-assortment-contact-sheet.jpg',
		w,
		h,
		[
			block(0, 0, w, h, colors.black),
			image(assets.texture, 0, 0, w, h, { opacity: 0.12 }),
			block(0, 0, 24, h, colors.red),
			textLines(['ARTHUR HOLLANDS × DIVINER'], 100, 150, {
				size: 82,
				weight: 900,
				family: fonts.head,
			}),
			textLines(['PHOTO ASSORTMENT / PROMO MATERIALS'], 104, 244, {
				size: 42,
				weight: 900,
				family: fonts.head,
				fill: colors.red,
			}),
			textLines(['Use by stage: 6/22 teaser, 6/24 interview, 6/26 countdown, 6/27 launch.'], 104, 320, {
				size: 32,
				weight: 700,
				fill: colors.muted,
			}),
			...body,
			textLines(['All source files are stored in /public/assets/diviner-arthur-202606/source/'], 100, 2310, {
				size: 30,
				weight: 700,
				fill: colors.muted,
			}),
			'<rect width="1800" height="2400" filter="url(#grain)" opacity="0.5"/>',
		].join(''),
		clipDefs(clips),
	);
}

async function main() {
	await fs.mkdir(renderedDir, { recursive: true });
	const assets = {};
	for (const [key, name] of Object.entries(files)) {
		assets[key] = await dataUri(name);
		assets[name] = assets[key];
	}

	await Promise.all([
		writeWebpThumb(files.walkFront, 'walk-front-cross.webp', 1400),
		writeWebpThumb(files.walkClose, 'walk-closeup-cross.webp', 1400),
		writeWebpThumb(files.walkBack, 'walk-back-road.webp', 1400),
		writeWebpThumb(files.graphicProduct, 'graphic-tee-product.webp', 1400),
		writeWebpThumb(files.graphicBack, 'graphic-tee-back-print.webp', 1400),
		writeWebpThumb(files.photoModel, 'photo-tee-model-front.webp', 1400),
		writeWebpThumb(files.photoProduct, 'photo-tee-product.webp', 1400),
		writeWebpThumb(files.photoPrint, 'photo-tee-print-detail.webp', 1400),
		writeWebpThumb(files.photoNeck, 'photo-tee-neck-you-are-loved.webp', 1400),
		writeWebpThumb(files.wheel, 'walk-wheel-detail.webp', 1400),
	]);

	await renderA4(assets);
	await renderOg(assets);
	await renderSocial(
		'sns-20260622-teaser.png',
		{
			kicker: '2026.6.22 MON / FIRST POST',
			title: ['ARTHUR', '× DIVINER'],
			body: ['A new collaboration begins.', 'First signal dropped.'],
			cta: 'STAY TUNED',
			ctaRed: true,
			main: assets.walkFront,
			smallA: assets.walkClose,
			smallB: assets.wheel,
			mainShade: 0.34,
			titleSize: 96,
			titleLineHeight: 100,
		},
		assets,
	);
	await renderSocial(
		'sns-20260624-interview.png',
		{
			kicker: '2026.6.24 WED / INTERVIEW',
			title: ['INTERVIEW', 'ARTICLE'],
			body: ['アーサー先生の言葉を公開。', '輪郭が少しずつ見えてくる。'],
			cta: 'READ THE INTERVIEW',
			main: assets.walkClose,
			smallA: assets.walkFront,
			smallB: assets.wheel,
			mainShade: 0.24,
			titleSize: 86,
			titleLineHeight: 92,
		},
		assets,
	);
	await renderSocial(
		'sns-20260626-countdown.png',
		{
			kicker: '2026.6.26 FRI / COUNTDOWN',
			title: ['YOU ARE', 'LOVED'],
			body: ['愛されている。だから、折れない。', '明日、全貌公開。'],
			cta: 'TOMORROW',
			ctaRed: true,
			main: assets.walkBack,
			smallA: assets.walkClose,
			smallB: assets.wheel,
			mainShade: 0.24,
			titleSize: 102,
			titleLineHeight: 106,
		},
		assets,
	);
	await renderSocial(
		'sns-20260627-launch.png',
		{
			kicker: '2026.6.27 SAT 21:00 / LAUNCH',
			title: ['NOW', 'ON SALE'],
			body: ['アーサーホーランド × DIVINER', 'コラボTシャツ2種類、発売開始。'],
			cta: 'BUY AT www.joker-ev.jp',
			ctaRed: true,
			main: assets.photoProduct,
			smallA: assets.graphicProduct,
			smallB: assets.photoModel,
			mainShade: 0.18,
			titleSize: 104,
			titleLineHeight: 108,
		},
		assets,
	);
	await renderSocial(
		'sns-20260626-you-are-loved.png',
		{
			kicker: '2026.6.26 FRI / YOU ARE LOVED',
			title: ['YOU ARE', 'LOVED'],
			body: ['愛されている。だから、折れない。', 'その確信だけで、前へ行ける。'],
			cta: 'ARTHUR HOLLANDS × DIVINER',
			main: assets.walkBack,
			smallA: assets.walkClose,
			smallB: assets.water,
			mainShade: 0.2,
			titleSize: 104,
			titleLineHeight: 108,
		},
		assets,
	);
	await renderStoryLaunch(assets);
	await renderContactSheet(assets);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
