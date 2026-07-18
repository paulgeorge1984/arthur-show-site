import { getCollection } from 'astro:content';
import showArchive from '../data/arthur-show-archive.json';
import seriesArchive from '../data/arthur-show-series.json';
import walkArchive from '../data/walk-across-archive.json';

export const prerender = true;

const cleanText = (value = '') =>
	String(value)
		.replace(/<style>{`[\s\S]*?`}<\/style>/g, ' ')
		.replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
		.replace(/<script[\s\S]*?<\/script>/g, ' ')
		.replace(/<svg[\s\S]*?<\/svg>/g, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/[{}()[\];"`<>]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

const cleanDescription = (value = '', fallback = '') => {
	const cleaned = cleanText(value)
		.replace(/THE ARTHUR HOLLANDS SHOW\s*YouTube公式サイトがスタートしました。?/g, ' ')
		.replace(/https:\/\/arthur-show\.com\/messages\/[^\s"']+/g, ' ')
		.replace(/【新企画】\s*📖?\s*3分で復習！\s*👉?THE DAILY ディボーションガイド\s*はこちら/g, ' ')
		.replace(/THE DAILY ディボーションガイド\s*はこちら/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	return cleaned || fallback;
};

const stripEmoji = (value = '') =>
	String(value).replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();

const extractFirst = (body: string, patterns: RegExp[]) => {
	for (const pattern of patterns) {
		const match = body.match(pattern);
		if (match?.[1]) return cleanText(match[1]);
	}
	return '';
};

const extractListItemsAfterHeading = (body: string, heading: string) => {
	const headingIndex = body.search(new RegExp(heading, 'i'));
	if (headingIndex === -1) return [];
	const chunk = body.slice(headingIndex, headingIndex + 2400);
	return Array.from(chunk.matchAll(/<li[^>]*>([\s\S]*?)<\/li>|<div class=["']step-text["'][^>]*>([\s\S]*?)<\/div>/g))
		.map((match) => cleanText(match[1] || match[2] || ''))
		.filter(Boolean)
		.slice(0, 4);
};

const extractVerses = (body: string) =>
	Array.from(body.matchAll(/<p\s+class=["']verse-text["'][^>]*>([\s\S]*?)<\/p>\s*<span\s+class=["']verse-ref["'][^>]*>([\s\S]*?)<\/span>/g))
		.map((match) => ({
			text: cleanText(match[1]),
			ref: cleanText(match[2]),
		}))
		.filter((verse) => verse.text && verse.ref)
		.slice(0, 3);

const classifySeries = (slug: string, title: string, tags: string[] = []) => {
	const haystack = `${slug} ${title} ${tags.join(' ')}`.toLowerCase();
	if (haystack.includes('fridaynight') || haystack.includes('friday night')) return 'Friday Night';
	if (haystack.includes('stayfast')) return 'Stay Fast Church';
	if (haystack.includes('walk across')) return 'WALK ACROSS';
	if (haystack.includes('movie') || haystack.includes('documentary')) return 'Documentary';
	if (haystack.includes('dailyplus') || haystack.includes('daily plus')) return 'THE DAILY PLUS';
	return 'THE DAILY';
};

const formatDate = (date: Date) => date.toLocaleDateString('ja-JP', {
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	timeZone: 'Asia/Tokyo',
});

const isPublicVideo = (video: { id?: string; title?: string }) => {
	const title = cleanText(video.title || '');
	return Boolean(video.id && title && !/(^\[?private video\]?$|^\[?deleted video\]?$|unavailable|非公開|削除済み|この動画は再生できません)/i.test(title));
};

const videoFromArchive = (video: any, fallbackSeries = '') => ({
	id: video.id,
	title: stripEmoji(cleanText(video.title || '')),
	thumbnail: video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hq720.jpg`,
	duration: video.duration || '',
	viewCount: video.viewCount || '',
	publishedAt: video.publishedAt || '',
	excerpt: cleanDescription(video.excerpt || video.description || '', video.title || ''),
	youtubeUrl: video.url || `https://www.youtube.com/watch?v=${video.id}`,
	series: fallbackSeries,
});

const scheduleEvents = [
	{
		id: 'saturday-night-arthur-2026-07-04',
		title: 'Saturday Night Arthur －賛美と御言葉の夕べ－',
		label: 'SPECIAL EVENT',
		startsAt: '2026-07-04T17:00:00+09:00',
		timeLabel: '2026.7.4 SAT / 17:00 START',
		location: '小田原市国府津「BLEND PARK」',
		address: '小田原市国府津2丁目6-17',
		description: '青い空と星空が天井、広がる草原と大海原がフロアー。賛美と御言葉の夕べ。',
		image: 'https://arthur-show.com/assets/generated/saturday-night-arthur-20260704-banner.webp',
		url: 'https://arthur-show.com/saturday-night-arthur-20260704/',
		mapUrl: 'https://maps.app.goo.gl/hqXBkcpq68fy58q3A?g_st=il',
	},
	{
		id: 'blessing-time-osaka-2026-07-18',
		title: 'BLESSING TIME in OSAKA',
		label: 'SPECIAL EVENT',
		startsAt: '2026-07-18T15:00:00+09:00',
		timeLabel: '2026.7.18 SAT / OPEN 14:30 / START 15:00',
		location: '大阪クリスチャンセンター OCCホール',
		address: '大阪市中央区玉造2丁目26-47',
		description: 'アーサー・ホーランド Talk Live と豪華アーティスト陣による Worship。',
		image: 'https://arthur-show.com/assets/generated/blessing-time-osaka2026-banner.webp',
		url: 'https://arthur-show.com/blessing-time-osaka2026/',
		mapUrl: 'https://maps.google.com/?q=大阪クリスチャンセンター%20OCCホール',
	},
	{
		id: 'the-essence-akita-2026-11-14',
		title: 'THE ESSENCE',
		label: 'SPECIAL MESSAGE',
		startsAt: '2026-11-14T19:00:00+09:00',
		timeLabel: '2026.11.14 SAT / OPEN 18:30 / 19:00-21:00',
		location: '秋田キャッスルホテル 弥生の間',
		address: '秋田県秋田市中通1丁目3番5号',
		description: 'きれいごとでは終われない、人生の本質を問う夜。不良牧師アーサーホーランドが秋田で語ります。',
		image: 'https://arthur-show.com/assets/the-essence-akita-20261114.jpg',
		url: 'https://arthur-show.com/the-essence-akita-20261114/',
		mapUrl: 'https://www.castle-hotel.jp/access/',
	},
];

const bible = {
	title: '聖書 口語訳',
	source: 'Japanese Kougo-yaku 口語訳「聖書」(1954/1955年版)',
	license: 'Public Domain / 著作権保護期間終了。本文は改変せず、出典を明記して使用。',
	attribution: '出典: 聖書 口語訳（1954/1955年版）',
	verses: [
		{ id: 'John.3.16', ref: 'ヨハネによる福音書 3:16', book: 'John', chapter: 3, verse: 16, text: '神はそのひとり子を賜わったほどに、この世を愛して下さった。それは御子を信じる者がひとりも滅びないで、永遠の命を得るためである。' },
		{ id: 'John.8.12', ref: 'ヨハネによる福音書 8:12', book: 'John', chapter: 8, verse: 12, text: 'イエスは、また人々に語ってこう言われた、「わたしは世の光である。わたしに従って来る者は、やみのうちを歩くことがなく、命の光をもつであろう」。' },
		{ id: 'Matthew.5.3', ref: 'マタイによる福音書 5:3', book: 'Matthew', chapter: 5, verse: 3, text: '「こころの貧しい人たちは、さいわいである、天国は彼らのものである。' },
		{ id: 'Matthew.5.4', ref: 'マタイによる福音書 5:4', book: 'Matthew', chapter: 5, verse: 4, text: '悲しんでいる人たちは、さいわいである、彼らは慰められるであろう。' },
		{ id: 'Matthew.5.9', ref: 'マタイによる福音書 5:9', book: 'Matthew', chapter: 5, verse: 9, text: '平和をつくり出す人たちは、さいわいである、彼らは神の子と呼ばれるであろう。' },
		{ id: 'Romans.8.1', ref: 'ローマ人への手紙 8:1', book: 'Romans', chapter: 8, verse: 1, text: 'こういうわけで、今やキリスト・イエスにある者は罪に定められることがない。' },
		{ id: 'Romans.8.28', ref: 'ローマ人への手紙 8:28', book: 'Romans', chapter: 8, verse: 28, text: '神は、神を愛する者たち、すなわち、ご計画に従って召された者たちと共に働いて、万事を益となるようにして下さることを、わたしたちは知っている。' },
		{ id: 'Isaiah.43.18', ref: 'イザヤ書 43:18', book: 'Isaiah', chapter: 43, verse: 18, text: '「あなたがたは、さきの事を思い出してはならない、また、いにしえのことを考えてはならない。' },
		{ id: 'Isaiah.43.19', ref: 'イザヤ書 43:19', book: 'Isaiah', chapter: 43, verse: 19, text: '見よ、わたしは新しい事をなす。やがてそれは起る、あなたがたはそれを知らないのか。わたしは荒野に道を設け、さばくに川を流れさせる。' },
		{ id: 'Psalms.23.1', ref: '詩篇 23:1', book: 'Psalms', chapter: 23, verse: 1, text: '主はわたしの牧者であって、わたしには乏しいことがない。' },
		{ id: 'Psalms.23.4', ref: '詩篇 23:4', book: 'Psalms', chapter: 23, verse: 4, text: 'たといわたしは死の陰の谷を歩むとも、わざわいを恐れません。あなたがわたしと共におられるからです。あなたのむちと、あなたのつえはわたしを慰めます。' },
		{ id: 'Philippians.3.13', ref: 'ピリピ人への手紙 3:13', book: 'Philippians', chapter: 3, verse: 13, text: '兄弟たちよ。わたしはすでに捕えたとは思っていない。ただこの一事を努めている。すなわち、後のものを忘れ、前のものに向かってからだを伸ばしつつ、' },
		{ id: 'Philippians.3.14', ref: 'ピリピ人への手紙 3:14', book: 'Philippians', chapter: 3, verse: 14, text: '目標を目ざして走り、キリスト・イエスにおいて上に召して下さる神の賞与を得ようと努めているのである。' },
	],
};

export async function GET() {
	const currentBuildTime = new Date();
	const allMessages = (await getCollection('daily-messages', ({ data }) => data.date <= currentBuildTime))
		.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

	const messages = allMessages.map((post: any) => {
		const body = post.body || '';
		const title = stripEmoji(post.data.title);
		const tags = Array.isArray(post.data.tags) ? post.data.tags.map(String) : [];
		const verses = extractVerses(body);
		const question = extractFirst(body, [
			/TODAY[’']?S QUESTION[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i,
			/今日の問い[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i,
			/<div class=["']q-box["'][^>]*>\s*<p[^>]*>([\s\S]*?)<\/p>/i,
		]);
		const prayer = extractFirst(body, [
			/<p class=["']prayer-body["'][^>]*>([\s\S]*?)<\/p>/i,
			/PRAYER[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i,
			/祈り[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i,
		]);
		const steps = extractListItemsAfterHeading(body, 'SMALL STEPS|今日できる小さな一歩');
		const shareQuestions = extractListItemsAfterHeading(body, '分かち合い|SHARE|QUESTIONS');
		const description = cleanDescription(post.data.description, title);

		return {
			id: post.slug,
			slug: post.slug,
			title,
			date: post.data.date.toISOString(),
			dateLabel: formatDate(post.data.date),
			youtubeId: String(post.data.youtubeId || ''),
			thumbnail: post.data.heroImage || `https://i.ytimg.com/vi/${post.data.youtubeId}/hq720.jpg`,
			url: `https://arthur-show.com/messages/${post.slug}/`,
			youtubeUrl: `https://www.youtube.com/watch?v=${post.data.youtubeId}`,
			description,
			excerpt: cleanDescription(cleanText(body).slice(0, 260), description),
			tags,
			series: classifySeries(post.slug, title, tags),
			verses,
			question,
			prayer,
			steps,
			shareQuestions,
			hasDevotion: Boolean(question || prayer || steps.length || verses.length),
		};
	}).filter((message) => message.youtubeId);

	const playlists = ((seriesArchive as any).playlists || []).map((playlist: any) => ({
		slug: playlist.slug,
		title: playlist.title,
		label: playlist.label,
		description: playlist.description,
		count: playlist.count,
		playlistId: playlist.playlistId,
		url: playlist.url,
		videos: (playlist.videos || []).slice(0, 8).map((video: any) => ({
			id: video.id,
			title: stripEmoji(video.title),
			thumbnail: video.thumbnail,
			duration: video.duration || '',
			viewCount: video.viewCount || '',
			youtubeUrl: `https://www.youtube.com/watch?v=${video.id}`,
		})),
	}));

	const showTheater = {
		id: 'show-theater',
		title: 'THE ARTHUR HOLLANDS SHOW Theater',
		label: 'LIVE PROGRAM STAGE',
		description: '番組アーカイブを映画館のスクリーンのように巡るコーナー。',
		heroImage: (showArchive as any).videos?.[0]?.thumbnail || 'https://arthur-show.com/og-image.jpg',
		videos: ((showArchive as any).videos || []).filter(isPublicVideo).slice(0, 24).map((video: any) => videoFromArchive(video, 'THE ARTHUR HOLLANDS SHOW')),
	};

	const walkAcrossTheaters = Object.entries((walkArchive as any).playlists || {})
		.map(([slug, playlist]: [string, any]) => {
			const videos = (playlist.videos || []).filter(isPublicVideo).slice(0, 12).map((video: any) => videoFromArchive(video, slug));
			const digestVideos = videos.filter((video: any) => /digest|ダイジェスト|day|walk across|十字架行進/i.test(video.title));
			return {
				id: slug,
				title: slug.replace(/-/g, ' ').toUpperCase(),
				label: /documentary|movie/i.test(slug) ? 'DOCUMENTARY' : 'WALK ACROSS',
				description: digestVideos[0]?.excerpt || videos[0]?.excerpt || '十字架行進の記録映像コーナー。',
				heroImage: videos[0]?.thumbnail || '',
				videos,
				digestVideos: digestVideos.length ? digestVideos.slice(0, 8) : videos.slice(0, 8),
			};
		})
		.filter((item) => item.videos.length)
		.slice(0, 12);

	const documentaryVideos = [
		...messages.filter((message) => /movie|documentary|ドキュメンタリー|映画|証し|okinawa|king of tattoo/i.test(`${message.id} ${message.title} ${message.tags.join(' ')}`))
			.slice(0, 20)
			.map((message) => ({
				id: message.youtubeId,
				title: message.title,
				thumbnail: message.thumbnail,
				duration: '',
				viewCount: '',
				publishedAt: message.date,
				excerpt: message.description,
				youtubeUrl: message.youtubeUrl,
				series: 'Documentary',
				messageId: message.id,
			})),
		...showTheater.videos.filter((video: any) => /documentary|ドキュメンタリー|密着|special|okinawa|証し/i.test(video.title)).slice(0, 10),
	];

	const theaterCollections = [
		showTheater,
		{
			id: 'documentary-theater',
			title: 'Documentary Cinema',
			label: 'DOCUMENTARY',
			description: '証し、密着映像、スペシャル映像を映画館の棚としてまとめました。',
			heroImage: documentaryVideos[0]?.thumbnail || showTheater.heroImage,
			videos: documentaryVideos.slice(0, 24),
		},
		{
			id: 'cross-walk-digest',
			title: 'Cross Walk Digest Theater',
			label: 'WALK ACROSS DIGEST',
			description: '十字架行進のダイジェスト映像を、旅のシアターとして巡れます。',
			heroImage: walkAcrossTheaters[0]?.heroImage || showTheater.heroImage,
			videos: walkAcrossTheaters.flatMap((item: any) => item.digestVideos).slice(0, 36),
		},
		...walkAcrossTheaters.slice(0, 6),
	].filter((collection) => collection.videos?.length);

	const tags = Array.from(new Set(messages.flatMap((message) => message.tags))).filter(Boolean).sort((a, b) => a.localeCompare(b, 'ja'));
	const featured = [
		...messages.filter((message) => message.series === 'THE DAILY').slice(0, 8),
		...messages.filter((message) => message.series !== 'THE DAILY').slice(0, 8),
	].slice(0, 12);
	const bookPages = messages
		.filter((message) => message.hasDevotion)
		.slice(0, 80)
		.map((message) => ({
			id: message.id,
			title: message.title,
			dateLabel: message.dateLabel,
			verse: message.verses[0] || null,
			question: message.question,
			prayer: message.prayer,
			steps: message.steps,
			tags: message.tags,
		}));

	return new Response(JSON.stringify({
		generatedAt: new Date().toISOString(),
		siteUrl: 'https://arthur-show.com',
		messages,
		featured,
		playlists,
		theaterCollections,
		scheduleEvents,
		bible,
		tags,
		bookPages,
	}), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'public, max-age=300',
		},
	});
}
