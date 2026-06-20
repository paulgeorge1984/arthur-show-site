import { getCollection } from 'astro:content';
import { walkAcrossPlaylists } from '../data/walk-across-playlists';

export const prerender = true;

const siteURL = 'https://arthur-show.com';

const escapeXML = (value: string) =>
	value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');

export async function GET() {
	const now = new Date();
	const messages = (await getCollection('daily-messages'))
		.filter((message) => message.data.date <= now)
		.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

	const staticPaths = [
		{ path: '/', changefreq: 'daily', priority: '1.0' },
		{ path: '/arthur-hollands-show/', changefreq: 'weekly', priority: '0.9' },
		{ path: '/walk-across/', changefreq: 'weekly', priority: '0.8' },
		{ path: '/walk-across-goto2026/', changefreq: 'daily', priority: '0.9' },
		{ path: '/walk-across-awaji2026/', changefreq: 'weekly', priority: '0.8' },
		{ path: '/saturday-night-arthur-20260704/', changefreq: 'weekly', priority: '0.8' },
		{ path: '/blessing-time-osaka2026/', changefreq: 'weekly', priority: '0.8' },
		{ path: '/friday-night/', changefreq: 'weekly', priority: '0.7' },
		{ path: '/walk-across-usa2014/', changefreq: 'monthly', priority: '0.7' },
		{ path: '/message-jukebox/', changefreq: 'weekly', priority: '0.7' },
		{ path: '/swords-of-words/', changefreq: 'weekly', priority: '0.7' },
		{ path: '/1000-verses/', changefreq: 'weekly', priority: '0.7' },
		{ path: '/calendar/', changefreq: 'weekly', priority: '0.7' },
		{ path: '/app-privacy/', changefreq: 'monthly', priority: '0.3' },
	];

	const urls = [
		...staticPaths.map((page) => ({
			loc: `${siteURL}${page.path === '/' ? '' : page.path}`,
			lastmod: now.toISOString(),
			changefreq: page.changefreq,
			priority: page.priority,
		})),
		...walkAcrossPlaylists.map((playlist) => ({
			loc: `${siteURL}/walk-across/${playlist.slug}/`,
			lastmod: now.toISOString(),
			changefreq: 'monthly',
			priority: '0.7',
		})),
		...messages.map((message) => ({
			loc: `${siteURL}/messages/${message.slug}/`,
			lastmod: message.data.date.toISOString(),
			changefreq: 'weekly',
			priority: '0.8',
		})),
	];

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map(
		(url) => `  <url>
    <loc>${escapeXML(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
		},
	});
}
