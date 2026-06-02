const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox?.querySelector("img");
const closeButton = document.querySelector(".lightbox-close");
const globalMenuToggle = document.querySelector("[data-global-menu-toggle]");
const globalNavShell = document.querySelector("[data-global-nav-shell]");
const globalNav = document.querySelector("[data-global-section-nav]");
const shareTitle =
  "ARTHUR HOLLANDS WALK ACROSS GOTO ISLANDS 2026 | 五島列島十字架行進2026";
const shareText =
  "2026年6月、長崎県・五島列島を舞台に十字架を掲げて歩く祈りの旅。現地映像とドキュメンタリー映像を順次掲載します。";
const shareUrl = "https://arthur-show.com/walk-across-goto2026/?share=20260602";

// Add field report YouTube videos here after publication.
const videos = [];

// Add documentary or digest YouTube videos here after publication.
const documentaries = [];

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
        <span class="video-title">${video.title}</span>
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
  const encodedLineText = encodeURIComponent(`${shareTitle}\n${shareText}\n${shareUrl}`);
  const line = document.querySelector("[data-share-line]");
  const x = document.querySelector("[data-share-x]");
  const facebook = document.querySelector("[data-share-facebook]");

  if (line) line.href = `https://line.me/R/msg/text/?${encodedLineText}`;
  if (x) x.href = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  if (facebook) facebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
}

async function copyShareLink() {
  const statusItems = document.querySelectorAll("[data-copy-status]");

  try {
    await navigator.clipboard.writeText(`${shareTitle}\n${shareText}\n${shareUrl}`);
    statusItems.forEach((item) => {
      item.textContent = "コピーしました";
    });
    setTimeout(() => {
      statusItems.forEach((item) => {
        item.textContent = "URLをクリップボードへ";
      });
    }, 1800);
  } catch {
    window.prompt("この内容をコピーしてください", `${shareTitle}\n${shareText}\n${shareUrl}`);
  }
}

async function sharePage() {
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

  await copyShareLink();
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
    if (lightbox && !lightbox.hidden) closeLightbox();
  }
});
