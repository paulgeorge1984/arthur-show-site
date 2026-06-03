export type WalkAcrossPlaylist = {
	slug: string;
	title: string;
	englishTitle: string;
	year: string;
	region: string;
	playlistId?: string;
	sourceUrl?: string;
	description: string;
	featured?: boolean;
	manualArchive?: boolean;
	journeyStops?: { year: string; country: string }[];
	useArchiveVideoSeries?: boolean;
};

export const walkAcrossPlaylists: WalkAcrossPlaylist[] = [
	{
		slug: 'noto-2025',
		title: '全国縦断十字架行進2025 能登半島編',
		englishTitle: 'WALK ACROSS NOTO 2025',
		year: '2025',
		region: '能登半島',
		playlistId: 'PL-faIdjPoxKjtHaPP9DP1jwDchOMavF4C',
		description: '能登半島を歩いた祈りと証しの記録。',
	},
	{
		slug: 'taiwan-2025',
		title: '台湾縦断十字架行進2025',
		englishTitle: 'WALK ACROSS TAIWAN 2025',
		year: '2025',
		region: '台湾',
		playlistId: 'PL-faIdjPoxKgNUi5356Fxx_i3fOh1njB5',
		description: '台湾の地を縦断した十字架行進の記録。',
	},
	{
		slug: 'awaji-2025',
		title: '淡路島一周十字架行進2025',
		englishTitle: 'WALK ACROSS AWAJI 2025',
		year: '2025',
		region: '淡路島',
		playlistId: 'PL-faIdjPoxKh4cQX7ZPrBfEU0PRQF34Wu',
		description: '淡路島を一周した十字架行進のアーカイブ。',
	},
	{
		slug: 'japan-2024',
		title: '全国縦断十字架行進2024',
		englishTitle: 'WALK ACROSS JAPAN 2024',
		year: '2024',
		region: '日本全国',
		playlistId: 'PL-faIdjPoxKg0jyQn4-t-jlVmpdU3rfPV',
		description: '日本を縦断した十字架行進2024の記録。',
	},
	{
		slug: 'japan-2024-digest',
		title: '日本縦断十字架行進2024 ダイジェスト映像集',
		englishTitle: 'WALK ACROSS JAPAN 2024 DIGEST',
		year: '2024',
		region: '日本全国',
		playlistId: 'PL-faIdjPoxKjxsMx6rQkVZES7ZL6Tg6Uz',
		description: '日本縦断十字架行進2024を凝縮したダイジェスト映像集。',
	},
	{
		slug: 'japan-2024-daily',
		title: '日本縦断十字架行進2024でのデイリーメッセージ集',
		englishTitle: 'WALK ACROSS JAPAN 2024 DAILY MESSAGE',
		year: '2024',
		region: '日本全国',
		playlistId: 'PL-faIdjPoxKgiITOcvwjUMgL7zgH8sY6H',
		description: '行進の旅路から届けられたデイリーメッセージ。',
	},
	{
		slug: 'japan-2024-blessing-news',
		title: '日本縦断十字架行進2024 Blessing News',
		englishTitle: 'WALK ACROSS JAPAN 2024 BLESSING NEWS',
		year: '2024',
		region: '日本全国',
		playlistId: 'PL-faIdjPoxKjVQ_uvV2tyTmPXe9d7T-bt',
		description: 'Blessing Newsで届けられた、日本縦断十字架行進2024の出会い、証し、洗礼の記録。',
		useArchiveVideoSeries: true,
	},
	{
		slug: 'fuji-2023',
		title: '富士山一周十字架行進2023',
		englishTitle: 'WALK ACROSS FUJI 2023',
		year: '2023',
		region: '富士山',
		playlistId: 'PL-faIdjPoxKiZzqU1NDapCZ2QL0plGR_I',
		description: '富士山を巡る十字架行進の記録。',
	},
	{
		slug: 'shikoku-2023',
		title: '四国横断十字架行進2023',
		englishTitle: 'WALK ACROSS SHIKOKU 2023',
		year: '2023',
		region: '四国',
		playlistId: 'PL-faIdjPoxKgN5HxZmsri957uoFBmWO1V',
		description: '四国を横断した祈りの旅路。',
	},
	{
		slug: 'mie-2023',
		title: '三重県縦断十字架行進2023',
		englishTitle: 'WALK ACROSS MIE 2023',
		year: '2023',
		region: '三重県',
		playlistId: 'PL-faIdjPoxKiWCv9OqCyehRKc9Auvf_Qm',
		description: '三重県を縦断した十字架行進の記録。',
	},
	{
		slug: 'awaji-2023',
		title: '淡路島一周十字架行進2023',
		englishTitle: 'WALK ACROSS AWAJI 2023',
		year: '2023',
		region: '淡路島',
		playlistId: 'PL-faIdjPoxKhl3LbWwWcmbBJCuD4apYmE',
		description: '淡路島一周十字架行進2023のアーカイブ。',
	},
	{
		slug: 'kii-2023',
		title: '紀伊半島十字架行進2023',
		englishTitle: 'WALK ACROSS KII 2023',
		year: '2023',
		region: '紀伊半島',
		playlistId: 'PL-faIdjPoxKi20nyhW9L1lRnaD444Q6-Z',
		description: '紀伊半島を歩いた十字架行進の記録。',
	},
	{
		slug: 'usa-ministry-2023',
		title: 'アメリカ伝道旅行 2023.8.14-29 Arthur Hollands Ministry',
		englishTitle: 'ARTHUR HOLLANDS MINISTRY USA 2023',
		year: '2023',
		region: 'アメリカ',
		playlistId: 'PL-faIdjPoxKiXqkBxtfsNVZqyoB6sQEM5',
		description: 'アメリカ伝道旅行の記録。',
	},
	{
		slug: 'japan-2022',
		title: '全国縦断十字架行進2022',
		englishTitle: 'WALK ACROSS JAPAN 2022',
		year: '2022',
		region: '日本全国',
		playlistId: 'PL-faIdjPoxKgmp3V2X5g5rWCqgJtb8QCy',
		description: '全国縦断十字架行進2022のアーカイブ。',
	},
	{
		slug: 'world-2014-2019',
		title: '世界の十字架行進 総集編 2014-2019',
		englishTitle: 'WALK ACROSS THE WORLD 2014-2019',
		year: '2014-2019',
		region: 'アメリカ・韓国・キューバ・日本',
		sourceUrl: 'https://youtu.be/__LZwUw89M8',
		description: 'Ken Lawさんによる、貴重な各国での十字架行進を追った作品。アメリカ、韓国、キューバ、日本へと続いた歩みを一本の映像でたどります。',
		manualArchive: true,
		useArchiveVideoSeries: true,
		journeyStops: [
			{ year: '2014-2015', country: 'アメリカ' },
			{ year: '2017', country: '韓国' },
			{ year: '2018', country: 'キューバ' },
			{ year: '2019', country: '日本' },
		],
	},
	{
		slug: 'japan-2022-documentary',
		title: '日本縦断十字架行進2022 まとめ映像集',
		englishTitle: 'WALK ACROSS JAPAN 2022 DOCUMENTARY',
		year: '2022',
		region: '日本全国',
		sourceUrl: 'https://www.youtube.com/@arthurhollands4834/videos',
		description: 'Arthur Hollandsチャンネルにまとめられた、日本縦断十字架行進2022の映像シリーズ。',
		manualArchive: true,
		useArchiveVideoSeries: true,
	},
];
