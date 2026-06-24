export type DivinerCampaignArticle = {
	slug: string;
	dateLabel: string;
	publishAt: string;
	stage: string;
	title: string;
	subtitle: string;
	heroImage: string;
	snsImage: string;
	lead: string;
	body: string[];
	primaryAsset: string;
	externalUrl?: string;
	ctaLabel?: string;
};

const base = '/assets/diviner-arthur-202606';
const rendered = `${base}/rendered`;
const source = `${base}/source`;
const docs = `${base}/docs`;

export const divinerCampaign = {
	pagePath: '/preview-diviner-arthur-202606-3c3ed9b1831e4fd6/',
	title: 'ARTHUR HOLLANDS × DIVINER',
	brand: 'ARTHUR HOLLANDS × DIVINER',
	siteUrl: 'https://www.joker-ev.jp',
	interviewUrl: 'https://www.joker-ev.jp/f/arthurhollands',
	launchLabel: '2026年6月27日（土）21:00',
	launchIso: '2026-06-27T21:00:00+09:00',
	summary:
		'ARTHUR HOLLANDS × DIVINER。A new collaboration begins.',
	images: {
		og: `${rendered}/og-diviner-arthur-collab.jpg`,
		a4: `${rendered}/a4-infographic.png`,
		a4Pdf: `${docs}/a4-infographic.pdf`,
		assortment: `${rendered}/photo-assortment-contact-sheet.jpg`,
		assortmentPdf: `${docs}/photo-assortment-contact-sheet.pdf`,
		storyLaunch: `${rendered}/story-20260627-launch.png`,
		graphicProduct: `${rendered}/graphic-tee-product.webp`,
		graphicBack: `${rendered}/graphic-tee-back-print.webp`,
		photoProduct: `${rendered}/photo-tee-product.webp`,
		photoModel: `${rendered}/photo-tee-model-front.webp`,
		photoPrint: `${rendered}/photo-tee-print-detail.webp`,
		walkFront: `${rendered}/walk-front-cross.webp`,
		walkClose: `${rendered}/walk-closeup-cross.webp`,
		walkBack: `${rendered}/walk-back-road.webp`,
		wheel: `${rendered}/walk-wheel-detail.webp`,
	},
	sourceDir: source,
	docsDir: docs,
};

export const divinerArticles: DivinerCampaignArticle[] = [
	{
		slug: '20260622-sns-teaser',
		dateLabel: '6/22（月）',
		publishAt: '2026-06-22T06:30:00+09:00',
		stage: 'NEWS',
		title: 'NEW COLLABORATION',
		subtitle: 'A new collaboration begins.',
		heroImage: `${rendered}/walk-front-cross.webp`,
		snsImage: `${rendered}/sns-20260622-teaser.png`,
		lead:
			'A new collaboration begins.',
		body: [
			'ARTHUR HOLLANDS × DIVINER。',
			'The first signal has dropped.',
		],
		primaryAsset: `${rendered}/sns-20260622-teaser.png`,
	},
	{
		slug: '20260624-interview',
		dateLabel: '6/24（水）',
		publishAt: '2026-06-24T06:30:00+09:00',
		stage: 'INTERVIEW',
		title: 'INTERVIEW',
		subtitle: 'このコラボに込めたメッセージを、言葉でも。',
		heroImage: `${rendered}/walk-closeup-cross.webp`,
		snsImage: `${rendered}/sns-20260624-interview.png`,
		lead:
			'このコラボに込めたメッセージを公開。',
		body: [
			'DIVINER公式サイトで、アーサー先生の特別対談が公開されました。',
			'十字架行進、不良牧師としての歩み、そして「You are loved」に込めた思いへ。',
		],
		primaryAsset: `${rendered}/walk-closeup-cross.webp`,
		externalUrl: 'https://www.joker-ev.jp/f/arthurhollands',
		ctaLabel: '対談記事を読む',
	},
	{
		slug: '20260626-countdown',
		dateLabel: '6/26（金）',
		publishAt: '2026-06-26T06:30:00+09:00',
		stage: 'YOU ARE LOVED',
		title: 'YOU ARE LOVED',
		subtitle: '愛されている。だから、折れない。',
		heroImage: `${rendered}/walk-back-road.webp`,
		snsImage: `${rendered}/sns-20260626-countdown.png`,
		lead:
			'YOU ARE LOVED。その確信だけで、前へ行ける。',
		body: [
			'明日、全貌公開。',
		],
		primaryAsset: `${rendered}/walk-back-road.webp`,
	},
	{
		slug: '20260627-launch',
		dateLabel: '6/27（土）',
		publishAt: '2026-06-27T21:00:00+09:00',
		stage: 'LAUNCH',
		title: '発売開始',
		subtitle: '2026年6月27日（土）21:00、DIVINER公式サイトで販売開始。',
		heroImage: `${rendered}/sns-20260627-launch.png`,
		snsImage: `${rendered}/story-20260627-launch.png`,
		lead:
			'ARTHUR HOLLANDS × DIVINER、発売開始。',
		body: [
			'Graphic TEE / Photo TEE の2種類。',
			'どちらもDIVINER公式サイトで購入できます。',
		],
		primaryAsset: `${rendered}/sns-20260627-launch.png`,
	},
];

export const productionPlacementPlan = [
	{
		timing: '6/22（月）初回告知',
		placement: 'ホーム上部に小さめのNEWS帯を追加',
		intent: '発売決定と6/27（土）21:00を覚えてもらう',
	},
	{
		timing: '6/24（水）インタビュー公開',
		placement: '記事カードをホーム中段とSNS導線に配置',
		intent: '商品告知をストーリー化し、読後に発売日を残す',
	},
	{
		timing: '6/26（金）発売前',
		placement: 'ホーム上部をカウントダウン表示に切り替え',
		intent: 'YOU ARE LOVEDを主役にして翌日21時へ集約',
	},
	{
		timing: '6/27（土）21:00発売開始',
		placement: 'ホーム上部を購入CTA付きキャンペーン枠へ切り替え',
		intent: '説明を絞り、DIVINER公式サイトへのクリックを最優先にする',
	},
];
