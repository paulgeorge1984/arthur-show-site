const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox.querySelector("img");
const closeButton = document.querySelector(".lightbox-close");
const globalMenuToggle = document.querySelector("[data-global-menu-toggle]");
const globalNavShell = document.querySelector("[data-global-nav-shell]");
const globalNav = document.querySelector("[data-global-section-nav]");
const shareTitle =
  "ARTHUR HOLLANDS WALK ACROSS AWAJI 2026 | アーサーホーランド公式YouTubeチャンネル THE ARTHUR HOLLANDS SHOW";
const shareText =
  "淡路島一周十字架行進2026のメモリアルアーカイブ。祈り、出会い、洗礼、感謝に満ちた5日間の記録。";
const shareUrl = "https://arthur-show.com/walk-across-awaji2026/";

// Add future YouTube videos here. Use the video ID from the YouTube URL.
const videos = [
  {
    id: "oNdUDnd1CQU",
    title: "空と海と大地が語るジーザスの愛　淡路島十字架行進いよいよスタート！(2026/04/27)",
  },
  {
    id: "v73iKYYeb8M",
    title:
      "「奇跡の始まり。4名が洗礼へ！淡路島十字架行進で、ジーザスと共に新しい人生を歩み始めた4名に、ありったけのおめでとうを！」(淡路島十字架行進 DAY01)",
  },
  {
    id: "qtptIcz5KQQ",
    title: "「神はここにいる　自然の中に響く創造主の声」（淡路島十字架行進 DAY03）",
  },
];

const videoGrid = document.querySelector("[data-video-grid]");

if (videoGrid) {
  videoGrid.innerHTML = videos
    .map(
      (video) => `
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
      `,
    )
    .join("");
}

function getShareUrl() {
  return shareUrl;
}

function updateShareLinks() {
  const url = getShareUrl();
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${shareTitle}\n${shareText}`);
  const encodedLineText = encodeURIComponent(`${shareTitle}\n${shareText}\n${url}`);
  const line = document.querySelector("[data-share-line]");
  const x = document.querySelector("[data-share-x]");
  const facebook = document.querySelector("[data-share-facebook]");

  if (line) {
    line.href = `https://line.me/R/msg/text/?${encodedLineText}`;
  }

  if (x) {
    x.href = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  }

  if (facebook) {
    facebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  }
}

async function copyShareLink() {
  const url = getShareUrl();
  const statusItems = document.querySelectorAll("[data-copy-status]");

  try {
    await navigator.clipboard.writeText(`${shareTitle}\n${shareText}\n${url}`);
    statusItems.forEach((item) => {
      item.textContent = "コピーしました";
    });
    setTimeout(() => {
      statusItems.forEach((item) => {
        item.textContent = "URLをクリップボードへ";
      });
    }, 1800);
  } catch {
    window.prompt("この内容をコピーしてください", `${shareTitle}\n${shareText}\n${url}`);
  }
}

async function sharePage() {
  const url = getShareUrl();

  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url,
      });
      return;
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }
    }
  }

  await copyShareLink();
}

updateShareLinks();

function setGlobalMenu(open) {
  if (!globalMenuToggle || !globalNavShell || !globalNav) return;
  globalNavShell.classList.toggle("is-open", open);
  globalMenuToggle.setAttribute("aria-expanded", String(open));
}

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
    lightboxImage.src = button.dataset.full;
    lightboxImage.alt = button.querySelector("img")?.alt || "";
    lightbox.hidden = false;
    lightbox.setAttribute("aria-modal", "true");
    document.body.style.overflow = "hidden";
    closeButton.focus();
  });
});

function closeLightbox() {
  lightbox.hidden = true;
  lightbox.removeAttribute("aria-modal");
  lightboxImage.removeAttribute("src");
  document.body.style.overflow = "";
}

closeButton.addEventListener("click", closeLightbox);

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setGlobalMenu(false);
  }

  if (event.key === "Escape" && !lightbox.hidden) {
    closeLightbox();
  }
});
