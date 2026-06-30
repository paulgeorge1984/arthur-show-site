<?php
declare(strict_types=1);

$tz = new DateTimeZone('Asia/Tokyo');
$overrideNow = getenv('DIVINER_STAGE_NOW');
$now = $overrideNow
	? new DateTimeImmutable($overrideNow, $tz)
	: new DateTimeImmutable('now', $tz);

$schedule = [
	'20260622' => new DateTimeImmutable('2026-06-22T06:30:00+09:00'),
	'20260624' => new DateTimeImmutable('2026-06-24T06:30:00+09:00'),
	'20260626' => new DateTimeImmutable('2026-06-26T06:30:00+09:00'),
	'launch' => new DateTimeImmutable('2026-06-27T21:00:00+09:00'),
];

$stageKey = 'top';
foreach ($schedule as $key => $publishAt) {
	if ($now >= $publishAt) {
		$stageKey = $key;
	}
}

$stages = [
	'top' => [
		'kicker' => 'NEW SIGNAL',
		'title' => 'ARTHUR HOLLANDS × DIVINER',
		'lead' => ['A new collaboration begins.', 'Stay tuned.'],
		'hero' => '/assets/diviner-arthur-202606/rendered/walk-closeup-cross.webp',
		'panelKicker' => "WHAT'S NEW?",
		'panelTitle' => 'COMING SOON',
		'panelBody' => ['ARTHUR HOLLANDS × DIVINER', '新しいシグナルが、静かに動き出す。'],
		'strip' => ['ARTHUR HOLLANDS', 'RECKLESS LIFE', 'STAY TUNED'],
	],
	'20260622' => [
		'kicker' => 'NEW COLLABORATION',
		'title' => 'ARTHUR HOLLANDS × DIVINER',
		'lead' => ['The first signal has dropped.', 'RECKLESS LIFE.'],
		'hero' => '/assets/diviner-arthur-202606/rendered/walk-front-cross.webp',
		'panelKicker' => "WHAT'S NEW?",
		'panelTitle' => 'NEW COLLABORATION',
		'panelBody' => ['ARTHUR HOLLANDS × DIVINER', 'ここから、新しいコラボレーションが始まります。'],
		'strip' => ['ARTHUR HOLLANDS', 'DIVINER', 'FIRST SIGNAL'],
	],
	'20260624' => [
		'kicker' => 'INTERVIEW',
		'title' => 'THE STORY BEHIND',
		'lead' => ['このコラボレーションに込めた思いを公開。', '歩みと姿勢が重なる瞬間。'],
		'hero' => '/assets/diviner-arthur-202606/rendered/walk-closeup-cross.webp',
		'panelKicker' => "WHAT'S NEW?",
		'panelTitle' => 'INTERVIEW',
		'panelBody' => ['アーサー先生の言葉から、背景が少しずつ見えてくる。', '公開されたメッセージを、ぜひ受け取ってください。'],
		'strip' => ['INTERVIEW', 'RECKLESS LIFE', 'STAY TUNED'],
	],
	'20260626' => [
		'kicker' => 'YOU ARE LOVED',
		'title' => 'YOU ARE LOVED',
		'lead' => ['愛されている。だから、折れない。', 'その確信だけで、前へ行ける。'],
		'hero' => '/assets/diviner-arthur-202606/rendered/walk-back-road.webp',
		'panelKicker' => "WHAT'S NEW?",
		'panelTitle' => 'YOU ARE LOVED',
		'panelBody' => ['明日、全貌公開。', '期待感だけを残して、次の瞬間へ。'],
		'strip' => ['YOU ARE LOVED', 'RECKLESS LIFE', 'TOMORROW'],
	],
	'launch' => [
		'kicker' => 'NOW AVAILABLE',
		'title' => 'ARTHUR HOLLANDS × DIVINER',
		'lead' => ['コラボTシャツ2種類、発売開始。', 'DIVINER公式サイトで購入できます。'],
		'hero' => '/assets/diviner-arthur-202606/rendered/walk-front-cross.webp',
		'panelKicker' => 'LAUNCH',
		'panelTitle' => '2026.6.27 SAT 21:00',
		'panelBody' => ['Graphic TEE / Photo TEE', 'どちらもDIVINER公式サイトで購入できます。'],
		'strip' => ['LAUNCH', 'DIVINER OFFICIAL', 'YOU ARE LOVED'],
	],
];

$stage = $stages[$stageKey];
$isLaunch = $stageKey === 'launch';
$interviewUrl = 'https://www.joker-ev.jp/f/arthurhollands';
$showInterviewArticle = $now >= $schedule['20260624'];
$robots = $isLaunch
	? 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'
	: 'noindex,nofollow,noarchive';

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
header('X-Robots-Tag: ' . $robots);

function h(string $value): string
{
	return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function data_uri(string $assetPath, string $mime): string
{
	$fullPath = __DIR__ . '/../' . ltrim($assetPath, '/');
	if (!is_readable($fullPath)) {
		return $assetPath;
	}
	return 'data:' . $mime . ';base64,' . base64_encode((string) file_get_contents($fullPath));
}

$siteUrl = 'https://arthur-show.com';
$canonical = $siteUrl . '/diviner/';
$ogImage = $siteUrl . '/assets/diviner-arthur-202606/rendered/og-diviner-arthur-collab.jpg';
$description = $isLaunch
	? 'ARTHUR HOLLANDS × DIVINER コラボTシャツ発売開始。DIVINER公式サイトで購入できます。特別対談記事も公開中。'
	: ($showInterviewArticle
		? 'DIVINER公式サイトで公開された、アーサー・ホーランド特別対談への案内ページです。'
		: 'ARTHUR HOLLANDS × DIVINER。A new collaboration begins.');
$shareTitle = $isLaunch
	? 'ARTHUR HOLLANDS × DIVINER コラボレーション発売開始'
	: 'ARTHUR HOLLANDS × DIVINER';
$shareText = $isLaunch
	? $shareTitle . "\n" . $canonical
	: $shareTitle . "\nA new collaboration begins.\n" . $canonical;
$shareUrl = rawurlencode($canonical);
$shareTitleEncoded = rawurlencode($shareTitle);
$shareLineEncoded = rawurlencode($shareText);
$graphicProduct = $isLaunch ? data_uri('/assets/diviner-arthur-202606/rendered/graphic-tee-product.webp', 'image/webp') : '';
$photoProduct = $isLaunch ? data_uri('/assets/diviner-arthur-202606/rendered/photo-tee-product.webp', 'image/webp') : '';
$instagramPosts = [
	[
		'url' => 'https://www.instagram.com/p/DZ4ysi-icG2/',
		'title' => 'ARTHUR HOLLANDS × DIVINER',
		'body' => 'Instagramに掲載されたコラボレーション投稿です。',
		'image' => data_uri('/assets/diviner-arthur-202606/rendered/sns-20260627-launch.png', 'image/png'),
	],
	[
		'url' => 'https://www.instagram.com/diviner_official/p/DaDF-suiZDo/',
		'title' => 'DIVINER OFFICIAL POST',
		'body' => 'DIVINER公式Instagramの関連投稿です。',
		'image' => data_uri('/assets/diviner-arthur-202606/rendered/graphic-tee-product.webp', 'image/webp'),
	],
	[
		'url' => 'https://www.instagram.com/diviner_official/p/DZ9BQmQJH-J/',
		'title' => 'DIVINER OFFICIAL POST',
		'body' => 'DIVINER公式Instagramの関連投稿です。',
		'image' => data_uri('/assets/diviner-arthur-202606/rendered/photo-tee-product.webp', 'image/webp'),
	],
];
$navItems = [
	['href' => '/#messages', 'label' => "Arthur Hollands' Message", 'active' => false],
	['href' => '/walk-across-goto2026/', 'label' => 'GOTO ISLANDS 2026', 'active' => false],
	['href' => '/diviner/', 'label' => 'DIVINER', 'active' => true],
	['href' => '/arthur-hollands-show/', 'label' => 'THE ARTHUR HOLLANDS SHOW', 'active' => false],
	['href' => '/friday-night/', 'label' => 'FRIDAY NIGHT', 'active' => false],
	['href' => '/walk-across/', 'label' => 'WALK ACROSS', 'active' => false],
	['href' => '/walk-across-awaji2026/', 'label' => 'WALK ACROSS AWAJI 2026', 'active' => false],
	['href' => '/message-jukebox/', 'label' => 'BIBLE JUKEBOX', 'active' => false],
	['href' => '/swords-of-words/', 'label' => 'THE SWORDS OF WORDS', 'active' => false],
	['href' => '/1000-verses/', 'label' => '厳選 1000 VERSES', 'active' => false],
	['href' => '/calendar/', 'label' => 'CALENDAR', 'active' => false],
];
?>
<!doctype html>
<html lang="ja">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<meta name="format-detection" content="telephone=no">
		<meta name="robots" content="<?= h($robots) ?>">
		<meta name="googlebot" content="<?= h($robots) ?>">
		<meta name="description" content="<?= h($description) ?>">
		<meta name="theme-color" content="#050505">
		<link rel="canonical" href="<?= h($canonical) ?>">
		<title>ARTHUR HOLLANDS × DIVINER | THE ARTHUR HOLLANDS SHOW</title>
		<meta property="og:title" content="ARTHUR HOLLANDS × DIVINER">
		<meta property="og:description" content="<?= h($description) ?>">
		<meta property="og:type" content="website">
		<meta property="og:url" content="<?= h($canonical) ?>">
		<meta property="og:site_name" content="THE ARTHUR HOLLANDS SHOW">
		<meta property="og:locale" content="ja_JP">
		<meta property="og:image" content="<?= h($ogImage) ?>">
		<meta property="og:image:secure_url" content="<?= h($ogImage) ?>">
		<meta property="og:image:type" content="image/jpeg">
		<meta property="og:image:width" content="1200">
		<meta property="og:image:height" content="630">
		<meta name="twitter:card" content="summary_large_image">
		<link rel="preconnect" href="https://fonts.googleapis.com">
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
		<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&family=Oswald:wght@400;700;900&display=swap" rel="stylesheet">
		<link rel="preconnect" href="https://www.googletagmanager.com">
		<script async src="https://www.googletagmanager.com/gtag/js?id=G-X3DDK6KV8Z"></script>
		<script>
			window.dataLayer = window.dataLayer || [];
			function gtag(){dataLayer.push(arguments);}
			gtag('js', new Date());
			gtag('config', 'G-X3DDK6KV8Z', {
				anonymize_ip: true,
				cookie_flags: 'SameSite=None;Secure'
			});
		</script>
		<style>
			* { box-sizing: border-box; }
			html {
				width: 100%;
				overflow-x: hidden;
				background: #050505;
				color: #f5f1e8;
				font-family: 'Noto Sans JP', sans-serif;
				scroll-behavior: smooth;
			}
			body {
				width: 100%;
				min-width: 0;
				margin: 0;
				overflow-x: hidden;
				background:
					radial-gradient(circle at 88% 12%, rgba(201, 52, 52, 0.18), transparent 26rem),
					linear-gradient(180deg, #050505 0%, #0c0c0c 54%, #050505 100%);
				color: #f5f1e8;
			}
			body::before {
				content: '';
				position: fixed;
				inset: 0;
				z-index: -1;
				background:
					linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px) 0 0 / 42px 42px,
					linear-gradient(0deg, rgba(255, 255, 255, 0.026) 1px, transparent 1px) 0 0 / 42px 42px;
				mask-image: linear-gradient(180deg, #000, transparent 82%);
			}
			a { color: inherit; text-decoration: none; }
			img { max-width: 100%; display: block; }
			.page {
				min-height: 100svh;
				isolation: isolate;
			}
			.site-header {
				position: sticky;
				top: 0;
				z-index: 100;
				padding: 20px 0;
				background: #0a0a0a;
				color: #fff;
				border-bottom: 4px solid #c5a059;
			}
			.header-inner {
				display: grid;
				grid-template-columns: minmax(72px, 1fr) auto minmax(72px, 1fr);
				align-items: center;
				gap: 18px;
				width: 100%;
				padding: 0 clamp(18px, 4vw, 44px);
			}
			.logo {
				grid-column: 2;
				display: flex;
				flex-direction: column;
				align-items: center;
				min-width: 0;
				text-align: center;
			}
			.logo-main {
				font-family: 'Oswald', sans-serif;
				font-size: clamp(1.1rem, 6vw, 1.5rem);
				font-weight: 700;
				line-height: 1;
			}
			.logo-sub {
				margin-top: 5px;
				color: #c5a059;
				font-family: serif;
				font-size: 1.05rem;
				font-style: italic;
				line-height: 1;
			}
			.global-nav-shell {
				position: sticky;
				top: 85px;
				z-index: 90;
				width: 100%;
				margin: 0;
				background: rgba(10, 10, 10, 0.96);
				border-bottom: 1px solid rgba(197, 160, 89, 0.72);
				box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
				backdrop-filter: blur(12px);
			}
			.global-menu-toggle,
			.global-quick-nav {
				display: none;
			}
			.global-section-nav {
				display: flex;
				justify-content: center;
				flex-wrap: wrap;
				gap: 4px 6px;
				width: 100%;
				max-width: 1240px;
				margin: 0 auto;
				padding: 10px clamp(14px, 2vw, 22px);
				overflow: visible;
				scrollbar-width: none;
			}
			.global-section-nav::-webkit-scrollbar,
			.global-quick-nav::-webkit-scrollbar {
				display: none;
			}
			.global-quick-nav a,
			.global-section-nav a {
				display: flex;
				align-items: center;
				justify-content: center;
				flex: 0 0 auto;
				min-height: 32px;
				padding: 0 clamp(8px, 0.8vw, 12px);
				color: rgba(255, 255, 255, 0.78);
				border: 1px solid transparent;
				border-bottom: 2px solid transparent;
				font-family: 'Oswald', sans-serif;
				font-size: clamp(0.72rem, 0.8vw, 0.8rem);
				font-weight: 900;
				letter-spacing: 0.02em;
				line-height: 1;
				text-align: center;
				white-space: nowrap;
			}
			.global-quick-nav a:hover,
			.global-quick-nav a.active,
			.global-section-nav a:hover,
			.global-section-nav a.active {
				color: #fff;
				border-color: rgba(197, 160, 89, 0.24);
				border-bottom-color: #c5a059;
				background: rgba(255, 255, 255, 0.06);
			}
			.topbar {
				position: sticky;
				top: 0;
				z-index: 20;
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 18px;
				min-height: 64px;
				padding: 0 clamp(18px, 4vw, 42px);
				background: rgba(5, 5, 5, 0.82);
				backdrop-filter: blur(18px);
				border-bottom: 1px solid rgba(255, 255, 255, 0.11);
			}
			.topbar strong,
			.topbar span,
			.kicker,
			.panel-kicker,
			.hero h1,
			.strip,
			.cta,
			.article-eyebrow,
			.interview-card h3,
			.interview-card span,
			.product-card h3 {
				font-family: 'Oswald', sans-serif;
				letter-spacing: 0;
			}
			.topbar strong {
				font-size: clamp(1rem, 2vw, 1.35rem);
				line-height: 1;
			}
			.topbar span {
				color: #ff5b55;
				font-size: 0.82rem;
				font-weight: 900;
			}
			.hero {
				position: relative;
				display: grid;
				grid-template-columns: minmax(0, 1fr) minmax(320px, 440px);
				gap: clamp(24px, 5vw, 72px);
				align-items: end;
				width: min(1180px, calc(100% - 40px));
				min-height: calc(100svh - 64px);
				margin: 0 auto;
				padding: clamp(54px, 8vw, 96px) 0 clamp(60px, 9vw, 110px);
			}
			.hero-copy {
				position: relative;
				z-index: 2;
				padding-bottom: 42px;
			}
			.kicker,
			.panel-kicker {
				margin: 0 0 14px;
				color: #ff5b55;
				font-size: 0.95rem;
				font-weight: 900;
				line-height: 1.1;
				text-transform: uppercase;
			}
			.hero h1 {
				max-width: 920px;
				margin: 0 0 22px;
				font-size: clamp(4.15rem, 12vw, 8.5rem);
				font-weight: 900;
				line-height: 0.84;
				text-transform: uppercase;
				overflow-wrap: anywhere;
			}
			.lead {
				display: grid;
				gap: 6px;
				max-width: 700px;
				margin: 0;
				color: #fff;
				font-size: clamp(1.25rem, 2.8vw, 1.9rem);
				font-weight: 900;
				line-height: 1.5;
			}
			.hero-art {
				position: relative;
				z-index: 1;
				align-self: stretch;
				min-height: 580px;
				overflow: hidden;
				background: #111;
				border: 1px solid rgba(255, 255, 255, 0.13);
				box-shadow: 0 28px 80px rgba(0, 0, 0, 0.44);
			}
			.hero-art::after {
				content: '';
				position: absolute;
				inset: 0;
				background:
					linear-gradient(180deg, transparent 0%, rgba(5, 5, 5, 0.08) 58%, rgba(5, 5, 5, 0.72) 100%),
					linear-gradient(90deg, rgba(201, 52, 52, 0.14), transparent 44%);
				pointer-events: none;
			}
			.hero-art img {
				width: 100%;
				height: 100%;
				object-fit: cover;
				object-position: center 10%;
				filter: contrast(1.06) saturate(0.92);
			}
			.strip {
				position: absolute;
				left: 0;
				right: 0;
				bottom: 24px;
				display: grid;
				grid-template-columns: repeat(3, 1fr);
				border: 1px solid rgba(255, 255, 255, 0.18);
				background: rgba(201, 52, 52, 0.94);
				color: #fff;
				font-size: clamp(0.78rem, 1.7vw, 1rem);
				font-weight: 900;
				line-height: 1.15;
				text-align: center;
				text-transform: uppercase;
			}
			.strip span {
				display: flex;
				align-items: center;
				justify-content: center;
				min-height: 44px;
				padding: 10px 12px;
			}
			.strip span + span {
				border-left: 1px solid rgba(255, 255, 255, 0.24);
			}
			.news {
				width: min(1180px, calc(100% - 40px));
				margin: 0 auto;
				padding: 0 0 clamp(64px, 9vw, 110px);
			}
			.panel {
				position: relative;
				display: grid;
				grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
				gap: clamp(22px, 4vw, 52px);
				align-items: center;
				padding: clamp(26px, 4vw, 48px);
				overflow: hidden;
				background:
					linear-gradient(118deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.025)),
					#0b0b0b;
				border: 1px solid rgba(255, 255, 255, 0.13);
			}
			.panel::before {
				content: '';
				position: absolute;
				inset: 0;
				border-left: 6px solid #c93434;
				pointer-events: none;
			}
			.panel h2 {
				position: relative;
				margin: 0;
				font-family: 'Oswald', sans-serif;
				font-size: clamp(2.35rem, 6vw, 5.2rem);
				font-weight: 900;
				line-height: 0.92;
				text-transform: uppercase;
				overflow-wrap: anywhere;
			}
			.panel-copy {
				position: relative;
				display: grid;
				gap: 12px;
				color: rgba(255, 255, 255, 0.82);
				font-size: clamp(1rem, 2vw, 1.22rem);
				font-weight: 800;
				line-height: 1.7;
			}
			.panel-copy p {
				margin: 0;
			}
			.cta {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				width: fit-content;
				min-height: 52px;
				margin-top: 12px;
				padding: 0 22px;
				background: #c93434;
				color: #fff;
				font-size: 1.08rem;
				font-weight: 900;
				line-height: 1;
			}
			.interview-card {
				display: grid;
				grid-template-columns: minmax(160px, 0.44fr) minmax(0, 1fr);
				gap: clamp(18px, 3vw, 28px);
				align-items: stretch;
				margin-top: 18px;
				padding: clamp(16px, 2.5vw, 24px);
				background:
					linear-gradient(115deg, rgba(201, 52, 52, 0.22), rgba(255, 255, 255, 0.035)),
					#0b0b0b;
				border: 1px solid rgba(255, 255, 255, 0.14);
				color: #fff;
			}
			.interview-card:hover {
				border-color: rgba(255, 91, 85, 0.64);
				background:
					linear-gradient(115deg, rgba(201, 52, 52, 0.3), rgba(255, 255, 255, 0.055)),
					#0b0b0b;
			}
			.interview-media {
				min-height: 100%;
				overflow: hidden;
				background: #111;
			}
			.interview-media img {
				width: 100%;
				height: 100%;
				min-height: 220px;
				aspect-ratio: 4 / 3;
					object-fit: cover;
					object-position: center 30%;
			}
			.interview-copy {
				display: grid;
				align-content: center;
				gap: 12px;
				min-width: 0;
			}
			.article-eyebrow {
				margin: 0;
				color: #ff5b55;
				font-size: 0.88rem;
				font-weight: 900;
				line-height: 1.1;
				text-transform: uppercase;
			}
			.interview-card h3 {
				margin: 0;
				font-size: clamp(1.75rem, 4vw, 3.25rem);
				font-weight: 900;
				line-height: 1.05;
				overflow-wrap: anywhere;
			}
			.interview-card p {
				margin: 0;
				color: rgba(255, 255, 255, 0.78);
				font-size: clamp(0.98rem, 1.7vw, 1.12rem);
				font-weight: 800;
				line-height: 1.75;
			}
			.interview-card span {
				justify-self: start;
				margin-top: 4px;
				padding-bottom: 5px;
				border-bottom: 2px solid #ff5b55;
				color: #fff;
				font-size: 1.02rem;
				font-weight: 900;
				line-height: 1.1;
			}
			.instagram-list {
				display: grid;
				grid-template-columns: repeat(3, minmax(0, 1fr));
				gap: 14px;
				margin-top: 18px;
			}
			.instagram-card {
				display: grid;
				align-content: start;
				gap: 12px;
				padding: 14px;
				background: #0b0b0b;
				border: 1px solid rgba(255, 255, 255, 0.14);
				color: #fff;
			}
			.instagram-card:hover {
				border-color: rgba(255, 91, 85, 0.64);
				background: rgba(255, 255, 255, 0.045);
			}
			.instagram-card img {
				width: 100%;
				aspect-ratio: 4 / 5;
				object-fit: cover;
				object-position: center;
				background: #111;
			}
			.instagram-card h3 {
				margin: 0;
				font-family: 'Oswald', sans-serif;
				font-size: clamp(1.2rem, 2.6vw, 1.65rem);
				font-weight: 900;
				line-height: 1.05;
				text-transform: uppercase;
			}
			.instagram-card p {
				margin: 0;
				color: rgba(255, 255, 255, 0.74);
				font-size: 0.92rem;
				font-weight: 800;
				line-height: 1.6;
			}
			.instagram-card span {
				justify-self: start;
				padding-bottom: 5px;
				border-bottom: 2px solid #ff5b55;
				color: #fff;
				font-family: 'Oswald', sans-serif;
				font-size: 0.98rem;
				font-weight: 900;
				line-height: 1.1;
			}
			.share-panel {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 18px;
				margin-top: 18px;
				padding: 18px;
				background: rgba(255, 255, 255, 0.055);
				border: 1px solid rgba(255, 255, 255, 0.12);
			}
			.share-copy {
				display: grid;
				gap: 2px;
				min-width: 0;
			}
			.share-label {
				color: #ff5b55;
				font-family: 'Oswald', sans-serif;
				font-size: 0.74rem;
				font-weight: 900;
				letter-spacing: 0.12em;
				line-height: 1;
			}
			.share-copy strong {
				color: #fff;
				font-family: 'Oswald', sans-serif;
				font-size: clamp(1.1rem, 2.4vw, 1.55rem);
				font-weight: 900;
				line-height: 1.1;
				text-transform: uppercase;
			}
			.share-actions {
				display: flex;
				flex: 0 0 auto;
				gap: 8px;
			}
			.share-button {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				width: 44px;
				height: 44px;
				border: 1px solid rgba(255, 255, 255, 0.2);
				background: #0b0b0b;
				color: #fff;
				font-family: 'Oswald', sans-serif;
				font-size: 0.84rem;
				font-weight: 900;
				line-height: 1;
				cursor: pointer;
			}
			.share-button:hover {
				background: #c93434;
				border-color: #c93434;
			}
			.share-status {
				min-height: 1em;
				color: rgba(255, 255, 255, 0.58);
				font-size: 0.76rem;
				font-weight: 800;
			}
			.products {
				display: grid;
				grid-template-columns: repeat(2, minmax(0, 1fr));
				gap: 18px;
				margin-top: 28px;
			}
			.product-card {
				background: #fff;
				color: #080808;
				padding: 14px;
				border: 1px solid rgba(255, 255, 255, 0.18);
			}
			.product-card img {
				display: block;
				width: 100%;
				height: auto;
				aspect-ratio: 4 / 5;
				background: #f7f7f7;
			}
			.product-card h3 {
				margin: 12px 0 2px;
				font-size: 1.25rem;
				font-weight: 900;
				line-height: 1.1;
			}
			.product-card p {
				margin: 0;
				color: #555;
				font-size: 0.92rem;
				font-weight: 900;
			}
			@media (max-width: 820px) {
				.site-header {
					padding: 18px 0;
				}
				.header-inner {
					grid-template-columns: 56px minmax(0, 1fr) 56px;
					padding: 0 20px;
					gap: 8px;
				}
				.logo-main {
					font-size: clamp(1rem, 6.4vw, 1.35rem);
				}
				.global-nav-shell {
					top: 82px;
					padding: 10px 14px;
				}
				.global-quick-nav {
					display: flex;
					gap: 4px;
					margin: 0 -4px 10px;
					padding: 0 4px 10px;
					overflow-x: auto;
					border-bottom: 1px solid rgba(197, 160, 89, 0.2);
					scrollbar-width: none;
				}
				.global-quick-nav a {
					min-height: 34px;
					padding: 0 12px;
					background: rgba(255, 255, 255, 0.045);
					border-color: rgba(255, 255, 255, 0.06);
					font-size: 0.78rem;
				}
				.global-menu-toggle {
					display: inline-flex;
					align-items: center;
					justify-content: flex-start;
					gap: 10px;
					width: 100%;
					min-height: 42px;
					padding: 0 14px;
					background: rgba(10, 10, 10, 0.96);
					border: 1px solid rgba(197, 160, 89, 0.34);
					color: #fff;
					font-family: 'Oswald', sans-serif;
					font-size: 0.86rem;
					font-weight: 900;
					cursor: pointer;
				}
				.menu-lines {
					display: grid;
					gap: 4px;
					width: 18px;
				}
				.menu-lines i {
					display: block;
					width: 18px;
					height: 2px;
					background: #c5a059;
				}
				.global-section-nav {
					display: none;
					grid-template-columns: 1fr;
					gap: 6px;
					padding: 10px 0 2px;
				}
				.global-nav-shell.is-open .global-section-nav {
					display: grid;
				}
				.global-section-nav a {
					justify-content: flex-start;
					width: 100%;
					min-height: 42px;
					padding: 0 14px;
					background: rgba(255, 255, 255, 0.04);
					border: 1px solid rgba(255, 255, 255, 0.08);
					font-size: 0.84rem;
				}
				.topbar {
					position: relative;
					align-items: flex-start;
					flex-direction: column;
					gap: 6px;
					min-height: 0;
					padding: 16px 18px;
				}
					.hero {
						grid-template-columns: 1fr;
						gap: 22px;
						width: min(100% - 28px, 540px);
						min-height: 0;
						padding: 18px 0 26px;
					}
					.hero-copy {
						order: 2;
						padding-bottom: 0;
					}
					.hero-art {
						order: 1;
						min-height: 0;
						height: clamp(300px, 52svh, 430px);
					}
					.hero h1 {
						font-size: clamp(2.85rem, 15.5vw, 4.35rem);
						line-height: 0.9;
					}
					.lead {
						font-size: 1.05rem;
					}
					.strip {
						position: static;
						order: 3;
						grid-column: 1;
						grid-template-columns: 1fr;
					}
				.strip span {
					min-height: 34px;
					padding: 8px 10px;
				}
				.strip span + span {
					border-top: 1px solid rgba(255, 255, 255, 0.24);
					border-left: 0;
				}
				.news {
					width: min(100% - 28px, 540px);
					padding-bottom: 64px;
				}
				.panel {
					grid-template-columns: 1fr;
					padding: 24px 20px;
				}
				.panel h2 {
					font-size: clamp(2.55rem, 14vw, 4rem);
				}
				.share-panel {
					display: grid;
					gap: 14px;
				}
					.interview-card {
						grid-template-columns: 1fr;
						gap: 16px;
						padding: 18px;
					}
					.interview-media img {
						display: block;
						min-height: 0;
						height: auto;
						aspect-ratio: auto;
						object-fit: contain;
						object-position: center top;
					}
					.article-eyebrow {
						font-size: 0.78rem;
					}
					.interview-card h3 {
						font-size: 1.55rem;
						line-height: 1.18;
					}
					.interview-card p {
						font-size: 0.94rem;
						line-height: 1.65;
					}
					.share-actions {
						flex-wrap: wrap;
					}
				.share-button {
					flex: 1 1 72px;
					width: auto;
				}
				.products {
					grid-template-columns: 1fr;
				}
				.instagram-list {
					grid-template-columns: 1fr;
				}
			}
		</style>
	</head>
	<body>
		<header class="site-header">
			<div class="header-inner">
				<a href="/" class="logo" aria-label="THE ARTHUR HOLLANDS SHOW トップへ">
					<span class="logo-main">THE ARTHUR HOLLANDS SHOW</span>
					<span class="logo-sub">You are Loved</span>
				</a>
			</div>
		</header>
		<div class="global-nav-shell" data-global-nav-shell>
			<nav class="global-quick-nav" aria-label="サイト内主要メニューショートカット">
				<?php foreach ($navItems as $item): ?>
					<a href="<?= h($item['href']) ?>" class="<?= $item['active'] ? 'active' : '' ?>"><?= h($item['label']) ?></a>
				<?php endforeach; ?>
			</nav>
			<button class="global-menu-toggle" type="button" aria-expanded="false" aria-controls="global-section-nav" data-global-menu-toggle>
				<span class="menu-lines" aria-hidden="true"><i></i><i></i><i></i></span>
				<strong>SITE MENU</strong>
			</button>
			<nav class="global-section-nav" id="global-section-nav" aria-label="サイト内主要メニュー" data-global-section-nav>
				<?php foreach ($navItems as $item): ?>
					<a href="<?= h($item['href']) ?>" class="<?= $item['active'] ? 'active' : '' ?>"><?= h($item['label']) ?></a>
				<?php endforeach; ?>
			</nav>
		</div>
		<main class="page">
			<section class="hero" aria-labelledby="campaign-title">
				<div class="hero-copy">
					<p class="kicker"><?= h($stage['kicker']) ?></p>
					<h1 id="campaign-title"><?= h($stage['title']) ?></h1>
					<p class="lead">
						<?php foreach ($stage['lead'] as $line): ?>
							<span><?= h($line) ?></span>
						<?php endforeach; ?>
					</p>
					<?php if ($isLaunch): ?>
						<a class="cta" href="https://www.joker-ev.jp" target="_blank" rel="noopener noreferrer">DIVINER公式サイトへ</a>
					<?php endif; ?>
				</div>
				<picture class="hero-art">
					<img src="<?= h($stage['hero']) ?>" alt="" width="1400" height="1750" loading="eager">
				</picture>
				<div class="strip" aria-hidden="true">
					<?php foreach ($stage['strip'] as $item): ?>
						<span><?= h($item) ?></span>
					<?php endforeach; ?>
				</div>
			</section>

			<section class="news" aria-labelledby="news-title">
				<div class="panel">
					<div>
						<p class="panel-kicker"><?= h($stage['panelKicker']) ?></p>
						<h2 id="news-title"><?= h($stage['panelTitle']) ?></h2>
					</div>
					<div class="panel-copy">
						<?php foreach ($stage['panelBody'] as $line): ?>
							<p><?= h($line) ?></p>
						<?php endforeach; ?>
						<?php if ($isLaunch): ?>
							<a class="cta" href="https://www.joker-ev.jp" target="_blank" rel="noopener noreferrer">購入ページへ</a>
						<?php endif; ?>
					</div>
				</div>
				<?php if ($showInterviewArticle): ?>
					<a class="interview-card" href="<?= h($interviewUrl) ?>" target="_blank" rel="noopener noreferrer" aria-label="DIVINER公式特別対談記事を読む">
						<div class="interview-media" aria-hidden="true">
							<img src="/assets/diviner-arthur-202606/rendered/walk-front-cross.webp" alt="" width="1400" height="1750" loading="lazy">
						</div>
						<div class="interview-copy">
							<p class="article-eyebrow">DIVINER OFFICIAL ARTICLE</p>
							<h3>「粋を目指す野暮であれ」不良牧師アーサー・ホーランドの生き様</h3>
							<p>DIVINER公式サイトで公開された特別対談。十字架行進、不良牧師としての歩み、そして「You are loved」に込めた思いへ。</p>
							<span>対談記事を読む</span>
						</div>
					</a>
				<?php endif; ?>
				<div class="instagram-list" aria-label="Instagram関連投稿">
					<?php foreach ($instagramPosts as $post): ?>
						<a class="instagram-card" href="<?= h($post['url']) ?>" target="_blank" rel="noopener noreferrer" aria-label="<?= h($post['title']) ?>をInstagramで見る">
							<img src="<?= h($post['image']) ?>" alt="" loading="lazy">
							<h3><?= h($post['title']) ?></h3>
							<p><?= h($post['body']) ?></p>
							<span>Instagramで見る</span>
						</a>
					<?php endforeach; ?>
				</div>
				<div class="share-panel" aria-label="このページをシェア">
					<div class="share-copy">
						<span class="share-label">SHARE</span>
						<strong>Spread the signal</strong>
						<span class="share-status" data-share-status></span>
					</div>
					<div class="share-actions">
						<a class="share-button" href="https://twitter.com/intent/tweet?text=<?= h($shareTitleEncoded) ?>&amp;url=<?= h($shareUrl) ?>" target="_blank" rel="noopener noreferrer" aria-label="Xでシェア">X</a>
						<a class="share-button" href="https://www.facebook.com/sharer/sharer.php?u=<?= h($shareUrl) ?>" target="_blank" rel="noopener noreferrer" aria-label="Facebookでシェア">f</a>
						<a class="share-button" href="https://line.me/R/msg/text/?<?= h($shareLineEncoded) ?>" target="_blank" rel="noopener noreferrer" aria-label="LINEでシェア">LINE</a>
						<button class="share-button" type="button" data-copy-share="<?= h($shareText) ?>" aria-label="リンクをコピー">COPY</button>
					</div>
				</div>
				<?php if ($isLaunch): ?>
					<div class="products" aria-label="発売商品">
						<article class="product-card">
							<img src="<?= h($graphicProduct) ?>" alt="ARTHUR HOLLANDS × DIVINER Graphic TEE" width="1400" height="1750" loading="lazy">
							<h3>Graphic TEE</h3>
							<p>ARTHUR HOLLANDS × DIVINER</p>
						</article>
						<article class="product-card">
							<img src="<?= h($photoProduct) ?>" alt="ARTHUR HOLLANDS × DIVINER Photo TEE" width="1400" height="1750" loading="lazy">
							<h3>Photo TEE</h3>
							<p>ARTHUR HOLLANDS × DIVINER</p>
						</article>
					</div>
				<?php endif; ?>
			</section>
		</main>
		<script>
			var globalMenuToggle = document.querySelector('[data-global-menu-toggle]');
			var globalNavShell = document.querySelector('[data-global-nav-shell]');
			var globalNav = document.querySelector('[data-global-section-nav]');
			function setGlobalMenu(open) {
				if (!globalMenuToggle || !globalNavShell || !globalNav) return;
				if (open) {
					globalNavShell.classList.add('is-open');
				} else {
					globalNavShell.classList.remove('is-open');
				}
				globalMenuToggle.setAttribute('aria-expanded', String(open));
			}
			if (globalMenuToggle) {
				globalMenuToggle.addEventListener('click', function () {
					setGlobalMenu(!(globalNavShell && globalNavShell.classList.contains('is-open')));
				});
			}
			if (globalNav) {
				var navLinks = globalNav.querySelectorAll('a');
				for (var i = 0; i < navLinks.length; i += 1) {
					navLinks[i].addEventListener('click', function () { setGlobalMenu(false); });
				}
			}
			document.addEventListener('keydown', function (event) {
				if (event.key === 'Escape') setGlobalMenu(false);
			});
			var copyShareButton = document.querySelector('[data-copy-share]');
			var shareStatus = document.querySelector('[data-share-status]');
			if (copyShareButton) {
				copyShareButton.addEventListener('click', function () {
					var text = copyShareButton.getAttribute('data-copy-share') || window.location.href;
					function done(message) {
						if (!shareStatus) return;
						shareStatus.textContent = message;
						window.setTimeout(function () {
							shareStatus.textContent = '';
						}, 2200);
					}
					if (navigator.clipboard && navigator.clipboard.writeText) {
						navigator.clipboard.writeText(text).then(function () {
							done('リンクをコピーしました');
						}).catch(function () {
							done('URLをコピーしてください');
						});
					} else {
						done('URLをコピーしてください');
					}
				});
			}
		</script>
	</body>
</html>
