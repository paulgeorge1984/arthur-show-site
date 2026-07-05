const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox?.querySelector("img");
const closeButton = document.querySelector(".lightbox-close");
const globalMenuToggle = document.querySelector("[data-global-menu-toggle]");
const globalNavShell = document.querySelector("[data-global-nav-shell]");
const globalNav = document.querySelector("[data-global-section-nav]");
const shareTitle =
  "アーサーホーランド WALK ACROSS GOTO ISLANDS 2026 | THE ARTHUR HOLLANDS SHOW";
const shareText =
  "不良牧師、殉教の島へ。五島列島十字架行進ダイジェスト【潜伏キリシタンの島】をページ上部に掲載しています。";
const shareUrl = "https://arthur-show.com/walk-across-goto2026/?share=20260706#digest-video";
const sharePayload = `${shareTitle}\n${shareText}\n${shareUrl}`;

// Add field report YouTube videos here after publication.
const videos = [
  {
    id: "FwFAiKcVU1Q",
    day: "DAY02 / 2026.06.24",
    title:
      "心の扉を開いて ジーザス、COME IN！今日できる一番素直な祈り",
    description:
      "五島列島十字架行進DAY02より。海と山に囲まれた静かな場所から、アーサー先生がYouTube視聴者へ届けた祈りのメッセージです。心の扉を開き、今日できる一番素直な祈りへと招きます。",
  },
];

// Add documentary or digest YouTube videos here after publication.
const documentaries = [
  {
    id: "04mpIA2fFZw",
    day: "DIGEST / 2026.07.05",
    title:
      "不良牧師、殉教の島へ。五島列島十字架行進ダイジェスト【潜伏キリシタンの島】",
    description:
      "潜伏キリシタンと殉教の歴史が刻まれた五島列島で、アーサー・ホーランドが十字架を背負い祈りながら歩いた旅のダイジェスト映像です。",
  },
];

function videoCard(video) {
  return `
    <article class="video-card">
      <a class="video-link" href="https://youtu.be/${video.id}" target="_blank" rel="noreferrer">
        <span class="video-frame">
          <img
            src="https://i.ytimg.com/vi/${video.id}/hqdefault.jpg"
            alt="${video.title}"
            loading="lazy"
            decoding="async"
          />
          <span class="play-button" aria-hidden="true"></span>
        </span>
        ${video.day ? `<span class="video-day">${video.day}</span>` : ""}
        <span class="video-title">${video.title}</span>
        ${video.description ? `<span class="video-description">${video.description}</span>` : ""}
      </a>
    </article>
  `;
}

function placeholderCard(kind, text) {
  return `
    <article class="placeholder-card">
      <span>${kind}</span>
      <h3>公開後に掲載します</h3>
      <p>${text}</p>
    </article>
  `;
}

const videoGrid = document.querySelector("[data-video-grid]");
if (videoGrid) {
  videoGrid.innerHTML = videos.length
    ? videos.map(videoCard).join("")
    : placeholderCard("FIELD VIDEO", "五島列島から届く現地レポート、祈り、行進の記録映像をここに追加します。");
}

const documentaryGrid = document.querySelector("[data-documentary-grid]");
if (documentaryGrid) {
  documentaryGrid.innerHTML = documentaries.length
    ? documentaries.map(videoCard).join("")
    : placeholderCard("DOCUMENTARY", "ダイジェスト、ロードムービー、ドキュメンタリー映像を公開後にここへまとめます。");
}

function updateShareLinks() {
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`${shareTitle}\n${shareText}`);
  const encodedLineText = encodeURIComponent(sharePayload);
  const lineItems = document.querySelectorAll("[data-share-line], [data-goto-share-line]");
  const xItems = document.querySelectorAll("[data-share-x], [data-goto-share-x]");
  const facebookItems = document.querySelectorAll("[data-share-facebook], [data-goto-share-facebook]");

  lineItems.forEach((line) => {
    line.href = `https://line.me/R/msg/text/?${encodedLineText}`;
  });
  xItems.forEach((x) => {
    x.href = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  });
  facebookItems.forEach((facebook) => {
    facebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  });
}

function setButtonFeedback(button, text, restoreText) {
  if (!button) return;
  const label = button.querySelector("small") || button;
  const original = restoreText || label.dataset.originalText || label.textContent;
  label.dataset.originalText = original;
  label.textContent = text;
  window.clearTimeout(button._shareFeedbackTimer);
  button._shareFeedbackTimer = window.setTimeout(() => {
    label.textContent = original;
  }, 1800);
}

function showCopyStatus(text) {
  const statusItems = document.querySelectorAll("[data-copy-status]");
  statusItems.forEach((item) => {
    item.textContent = text;
  });
  window.clearTimeout(showCopyStatus._timer);
  showCopyStatus._timer = window.setTimeout(() => {
    statusItems.forEach((item) => {
      item.textContent = "URLをクリップボードへ";
    });
  }, 1800);
}

async function writeClipboardText(text) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    textarea.remove();
  }
}

async function copyShareLink(event) {
  const button = event?.currentTarget;

  try {
    const copied = await writeClipboardText(sharePayload);
    if (!copied) throw new Error("copy command failed");
    showCopyStatus("コピーしました");
    setButtonFeedback(button, "コピーしました");
    return true;
  } catch {
    window.prompt("この内容をコピーしてください", sharePayload);
    showCopyStatus("コピー用の画面を開きました");
    setButtonFeedback(button, "コピー用の画面を開きました");
    return false;
  }
}

async function sharePage(event) {
  const button = event?.currentTarget;
  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }

  const shareSection = document.querySelector("#share");
  if (shareSection && button?.closest(".quick-share")) {
    shareSection.scrollIntoView({ behavior: "smooth", block: "start" });
    setButtonFeedback(button, "共有方法を選んでください", "このページをシェア");
    return;
  }

  await copyShareLink(event);
}

function setGotoSharePanel(open) {
  const panel = document.querySelector("[data-goto-share-panel]");
  const trigger = document.querySelector("[data-goto-share-menu]");
  if (!panel || !trigger) return;

  panel.hidden = !open;
  trigger.setAttribute("aria-expanded", String(open));
}

async function openGotoShareMenu(event) {
  const button = event?.currentTarget;
  const panel = document.querySelector("[data-goto-share-panel]");
  const shouldOpen = panel?.hidden ?? true;
  setGotoSharePanel(shouldOpen);
  if (shouldOpen) {
    setButtonFeedback(button, "共有方法を選んでください", "このページをシェア");
  }
}

function setGlobalMenu(open) {
  if (!globalMenuToggle || !globalNavShell || !globalNav) return;
  globalNavShell.classList.toggle("is-open", open);
  globalMenuToggle.setAttribute("aria-expanded", String(open));
}

updateShareLinks();

globalMenuToggle?.addEventListener("click", () => {
  setGlobalMenu(!globalNavShell?.classList.contains("is-open"));
});

globalNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setGlobalMenu(false));
});

document.querySelectorAll("[data-share-native]").forEach((button) => {
  button.addEventListener("click", sharePage);
});

document.querySelectorAll("[data-copy-link]").forEach((button) => {
  button.addEventListener("click", copyShareLink);
});

document.querySelectorAll("[data-goto-share-menu]").forEach((button) => {
  button.addEventListener("click", openGotoShareMenu);
});

document.querySelectorAll("[data-goto-copy-link]").forEach((button) => {
  button.addEventListener("click", copyShareLink);
});

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-goto-share-menu], [data-goto-share-panel]")) return;
  setGotoSharePanel(false);
});

document.querySelectorAll("[data-full]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!lightbox || !lightboxImage || !closeButton) return;
    lightboxImage.src = button.dataset.full;
    lightboxImage.alt = button.querySelector("img")?.alt || "";
    lightbox.hidden = false;
    lightbox.setAttribute("aria-modal", "true");
    document.body.style.overflow = "hidden";
    closeButton.focus();
  });
});

function closeLightbox() {
  if (!lightbox || !lightboxImage) return;
  lightbox.hidden = true;
  lightbox.removeAttribute("aria-modal");
  lightboxImage.removeAttribute("src");
  document.body.style.overflow = "";
}

closeButton?.addEventListener("click", closeLightbox);

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setGlobalMenu(false);
    setGotoSharePanel(false);
    if (lightbox && !lightbox.hidden) closeLightbox();
  }
});
