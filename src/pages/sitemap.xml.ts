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
		'/',
		'/arthur-hollands-show/',
		'/blessing-time-osaka2026/',
		'/friday-night/',
		'/walk-across/',
		'/walk-across-usa2014/',
		'/walk-across-awaji2026/',
		'/walk-across-goto2026/',
		'/message-jukebox/',
		'/swords-of-words/',
		'/1000-verses/',
		'/calendar/',
	];

	const urls = [
		...staticPaths.map((path) => ({
			loc: `${siteURL}${path === '/' ? '' : path}`,
			lastmod: messages[0]?.data.date.toISOString() || now.toISOString(),
			changefreq: path === '/' ? 'daily' : 'weekly',
			priority: path === '/' ? '1.0' : '0.7',
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
