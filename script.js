// Studio settings: replace these values once when connecting the live sheet and enquiry backend.
const CONFIG = Object.freeze({
  SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSh5AuE68K5ESEVX0LWjQ1RQeaXkxIP3L-9_nU9gps2VH_OKIax3jfYmxp3xYZ3Jro_daWiWV8wRpnj/pub?output=csv",
  APPS_SCRIPT_URL: "PASTE_APPS_SCRIPT_WEB_APP_URL_HERE",
  COMPANY_NAME: "Supreme Interiotech & Constructions",
  PHONE: "",
  WHATSAPP_NUMBER: "",
  EMAIL: "",
  MAP_URL: "",
  YOUTUBE_URL: "https://m.youtube.com/@supreme_interio_constructions",
  INSTAGRAM_URL: "https://www.instagram.com/supreme_interiotech/",
  AUTO_REPLY: true,
  SHEET_REFRESH_MS: 300000
});

const TIER_INFO = {
  Premium: "Elevated materials, bespoke details and a fully tailored experience.",
  Signature: "Distinctive design choices, balanced with considered value.",
  Essential: "Beautiful, practical foundations with the details that matter most."
};

const LEGACY_DEMO_TIERS = Object.freeze({
  "ksr area project": "Premium",
  "msr area project": "Signature",
  "bsr area project": "Essential"
});

const DEMO_PROJECTS = [
  {
    title: "KSR Area Project",
    tier: "Premium",
    location: "KSR area",
    year: "2026-11-12",
    area: "",
    description: "Interior project in the KSR area.",
    youtubeUrls: ["https://youtu.be/SNc9uJD_y9s"],
    coverImageUrl: "",
    photoUrls: [],
    instagramUrls: ["https://www.instagram.com/p/DL7_mlJzEsP/"],
    featured: true,
    status: "Show"
  },
  {
    title: "MSR Area Project",
    tier: "Signature",
    location: "MSR area",
    year: "2026-11-13",
    area: "",
    description: "Interior project in the MSR area.",
    youtubeUrls: ["https://youtu.be/SNc9uJD_y9s"],
    coverImageUrl: "",
    photoUrls: [],
    instagramUrls: ["https://www.instagram.com/p/DL7_mlJzEsP/"],
    featured: true,
    status: "Show"
  },
  {
    title: "BSR Area Project",
    tier: "Essential",
    location: "BSR area",
    year: "2026-11-10",
    area: "",
    description: "Interior project in the BSR area.",
    youtubeUrls: ["https://youtu.be/SNc9uJD_y9s"],
    coverImageUrl: "",
    photoUrls: [],
    instagramUrls: ["https://www.instagram.com/p/DL7_mlJzEsP/"],
    featured: true,
    status: "Show"
  }
];

function demoProjects() {
  return DEMO_PROJECTS.map(project => ({
    ...project,
    cover: project.coverImageUrl,
    photos: project.photoUrls,
    instagramPosts: project.instagramUrls.map(url => instagramMedia(url)).filter(Boolean),
    videoIds: project.youtubeUrls.map(youtubeVideoId).filter(Boolean),
    videoFiles: []
  }));
}

const elements = {
  projectGrid: document.querySelector("#project-grid"),
  featuredGrid: document.querySelector("#featured-grid"),
  featuredSection: document.querySelector("#featured-section"),
  tierFilters: document.querySelector("#tier-filters"),
  portfolioStatus: document.querySelector("#portfolio-status"),
  dataNotice: document.querySelector("#data-notice"),
  projectModal: document.querySelector("#project-modal"),
  modalClose: document.querySelector("#modal-close"),
  modalTitle: document.querySelector("#modal-title"),
  modalTier: document.querySelector("#modal-tier"),
  modalMeta: document.querySelector("#modal-meta"),
  modalDescription: document.querySelector("#modal-description"),
  modalMedia: document.querySelector("#modal-media"),
  modalMediaStage: document.querySelector("#modal-media-stage"),
  modalMediaContent: document.querySelector("#modal-media-content"),
  modalMediaCount: document.querySelector("#modal-media-count"),
  modalMediaThumbnails: document.querySelector("#modal-media-thumbnails"),
  mediaPrevious: document.querySelector("#media-previous"),
  mediaNext: document.querySelector("#media-next"),
  enquireProject: document.querySelector("#enquire-project"),
  photoLightbox: document.querySelector("#photo-lightbox"),
  lightboxImage: document.querySelector("#lightbox-image"),
  lightboxCount: document.querySelector("#lightbox-count"),
  contactForm: document.querySelector("#contact-form"),
  formStatus: document.querySelector("#form-status"),
  menuToggle: document.querySelector("#menu-toggle"),
  primaryNav: document.querySelector("#primary-nav")
};

let projects = [];
let selectedTier = "All";
let modalProject = null;
let activePhotoIndex = 0;
let activeMediaIndex = 0;
let projectMediaItems = [];
let videoLoadTimer = 0;
let lastFocusedElement = null;
let youTubeApiPromise;

function normalizeHeader(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some(cell => cell.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some(cell => cell.trim())) rows.push(row);
  return rows;
}

function splitList(value) {
  return value.split(",").map(item => item.trim()).filter(Boolean);
}

function youtubeVideoId(value) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const path = url.pathname.split("/").filter(Boolean);
    let id = "";

    if (host === "youtu.be") id = path[0] || "";
    else if (["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) {
      if (url.pathname === "/watch") id = url.searchParams.get("v") || "";
      else if (["shorts", "live", "embed"].includes(path[0])) id = path[1] || "";
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : "";
  } catch {
    return "";
  }
}

function directVideoUrl(value) {
  try {
    const url = new URL(value.trim(), document.baseURI);
    if (!["https:", "http:"].includes(url.protocol) || !/\.(mp4|m4v|webm|ogv|ogg)$/i.test(url.pathname)) return "";
    return url.href;
  } catch {
    return "";
  }
}

function instagramEmbedUrl(value) {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const path = url.pathname.split("/").filter(Boolean);
    if (url.protocol !== "https:" || host !== "instagram.com" || !["p", "reel", "tv"].includes(path[0]) || !path[1]) return "";
    return `https://www.instagram.com/${path[0]}/${encodeURIComponent(path[1])}/embed/`;
  } catch {
    return "";
  }
}

function instagramMediaKind(value, declaredType = "") {
  const type = declaredType.trim().toLowerCase();
  if (["reel", "reels"].includes(type)) return "reel";
  if (["post", "posts"].includes(type)) return "post";
  if (["video", "tv"].includes(type)) return "video";

  try {
    const path = new URL(value.trim()).pathname.split("/").filter(Boolean);
    return ({ p: "post", reel: "reel", tv: "video" })[path[0]] || "post";
  } catch {
    return "post";
  }
}

function instagramMedia(value, declaredType = "") {
  const url = instagramEmbedUrl(value);
  return url ? { url, kind: instagramMediaKind(value, declaredType) } : null;
}

function parseProjectRows(csv) {
  const rows = parseCsv(csv);
  if (rows.length < 2) throw new Error("The published Projects sheet has no project rows.");
  const headers = rows[0].map((name, index) => normalizeHeader(index === 0 ? name.replace(/^\uFEFF/, "") : name));
  const column = Object.fromEntries(headers.map((header, index) => [header, index]));
  if (["project", "image", "video", "reels"].every(name => column[name] !== undefined)) {
    return parseProjectMediaColumns(rows.slice(1), column);
  }
  if (["project", "type", "link"].every(name => column[name] !== undefined)) {
    return parseMediaRows(rows.slice(1), column);
  }

  const required = ["title", "tier", "location", "year", "area sq ft", "description", "youtube url", "cover image url", "photo urls", "featured", "status"];
  const missing = required.filter(name => column[name] === undefined);
  if (missing.length) throw new Error(`Missing Projects sheet columns: ${missing.join(", ")}.`);

  const value = (cells, key) => (cells[column[key]] || "").trim();
  return rows.slice(1).map((cells, rowIndex) => {
    if (value(cells, "status").toLowerCase() !== "show") return null;
    const title = value(cells, "title");
    const tier = titleCaseTier(value(cells, "tier"));
    if (!title || !tier) return null;

    const videoIds = [];
    const videoFiles = [];
    splitList(value(cells, "youtube url")).forEach(url => {
      const videoId = youtubeVideoId(url);
      const videoFile = directVideoUrl(url);
      if (videoId && !videoIds.includes(videoId)) videoIds.push(videoId);
      else if (videoFile && !videoFiles.includes(videoFile)) videoFiles.push(videoFile);
    });
    const mediaUrls = splitList(value(cells, "photo urls"));
    const photos = [...new Set(mediaUrls.filter(isPublicHttpUrl).filter(url => !instagramEmbedUrl(url)))];
    const instagramPosts = [...new Map(mediaUrls.map(url => instagramMedia(url)).filter(Boolean).map(item => [item.url, item])).values()];
    const coverUrl = value(cells, "cover image url");
    const cover = isPublicHttpUrl(coverUrl)
      ? coverUrl
      : videoIds.length
        ? `https://img.youtube.com/vi/${videoIds[0]}/hqdefault.jpg`
        : photos[0] || "";
    if (!cover && !photos.length && !instagramPosts.length && !videoIds.length && !videoFiles.length) return null;

    return {
      title,
      tier,
      location: value(cells, "location"),
      year: value(cells, "year"),
      area: value(cells, "area sq ft"),
      description: value(cells, "description"),
      videoIds,
      videoFiles,
      photos,
      instagramPosts,
      cover,
      featured: value(cells, "featured").toLowerCase() === "yes",
      status: "Show",
      sheetOrder: rowIndex
    };
  }).filter(Boolean).sort((a, b) => projectYear(b.year) - projectYear(a.year) || a.sheetOrder - b.sheetOrder);
}

function parseProjectMediaColumns(rows, column) {
  const value = (cells, key) => (cells[column[key]] || "").trim();

  return rows.map((cells, rowIndex) => {
    const projectName = value(cells, "project");
    const category = column.category === undefined ? "" : value(cells, "category");
    const sheetTier = column.tier === undefined ? "" : titleCaseTier(value(cells, "tier"));
    const tier = sheetTier || titleCaseTier(category) || LEGACY_DEMO_TIERS[projectName.toLowerCase()] || "Signature";
    if (!projectName || !tier) return null;
    if (column.status !== undefined && value(cells, "status").toLowerCase() !== "show") return null;

    const photos = [];
    const instagramPosts = [];
    const videoIds = [];
    const videoFiles = [];
    const addInstagram = (url, type) => {
      const item = instagramMedia(url, type);
      if (item && !instagramPosts.some(existing => existing.url === item.url)) instagramPosts.push(item);
    };

    splitList(value(cells, "image")).forEach(url => {
      const item = instagramMedia(url);
      if (item) {
        if (!instagramPosts.some(existing => existing.url === item.url)) instagramPosts.push(item);
      } else if (isPublicHttpUrl(url) && !photos.includes(url)) {
        photos.push(url);
      }
    });

    splitList(value(cells, "video")).forEach(url => {
      const videoId = youtubeVideoId(url);
      const videoFile = directVideoUrl(url);
      if (videoId && !videoIds.includes(videoId)) videoIds.push(videoId);
      else if (videoFile && !videoFiles.includes(videoFile)) videoFiles.push(videoFile);
      else addInstagram(url, "video");
    });

    splitList(value(cells, "reels")).forEach(url => addInstagram(url, "reel"));

    const coverUrl = column["cover image url"] === undefined ? "" : value(cells, "cover image url");
    const cover = isPublicHttpUrl(coverUrl)
      ? coverUrl
      : videoIds.length
        ? `https://img.youtube.com/vi/${videoIds[0]}/hqdefault.jpg`
        : photos[0] || "";
    if (!cover && !photos.length && !instagramPosts.length && !videoIds.length && !videoFiles.length) return null;

    const year = column.date === undefined ? "" : value(cells, "date");
    return {
      title: displayProjectName(projectName),
      tier,
      tierSource: sheetTier || titleCaseTier(category) ? "sheet" : "default",
      category,
      location: "",
      year,
      area: "",
      description: column.description === undefined ? "" : value(cells, "description"),
      videoIds,
      videoFiles,
      photos,
      instagramPosts,
      cover,
      featured: column.featured !== undefined && value(cells, "featured").toLowerCase() === "yes",
      status: "Show",
      sheetOrder: rowIndex
    };
  }).filter(Boolean)
    .map(project => ({
      ...project,
      description: project.description || `${project.category ? `${project.category} ` : ""}interior project.`
    }))
    .sort((a, b) => projectYear(b.year) - projectYear(a.year) || a.sheetOrder - b.sheetOrder);
}

function parseMediaRows(rows, column) {
  const groupedProjects = new Map();
  rows.forEach((cells, rowIndex) => {
    const projectName = (cells[column.project] || "").trim();
    const link = (cells[column.link] || "").trim();
    const type = (cells[column.type] || "").trim().toLowerCase();
    if (!projectName || !isPublicHttpUrl(link)) return;

    const key = projectName.toLowerCase();
    let project = groupedProjects.get(key);
    if (!project) {
      const category = column.category === undefined ? "" : (cells[column.category] || "").trim();
      const sheetTier = column.tier === undefined ? "" : titleCaseTier((cells[column.tier] || "").trim());
      const categoryTier = titleCaseTier(category);
      project = {
        title: displayProjectName(projectName),
        tier: sheetTier || categoryTier || LEGACY_DEMO_TIERS[key] || "Signature",
        tierSource: sheetTier || categoryTier ? "sheet" : "default",
        category,
        sourceFormat: "media",
        location: "",
        year: "",
        area: "",
        description: "",
        videoIds: [],
        videoFiles: [],
        photos: [],
        instagramPosts: [],
        featured: false,
        status: "Show",
        sheetOrder: rowIndex
      };
      groupedProjects.set(key, project);
    }

    const date = column.date === undefined ? "" : (cells[column.date] || "").trim();
    if (projectYear(date) > projectYear(project.year)) project.year = date;
    const description = column.description === undefined ? "" : (cells[column.description] || "").trim();
    if (description && description.toLowerCase() !== projectName.toLowerCase() && !project.description) {
      project.description = description;
    }

    const instagramItem = instagramMedia(link, type);
    if (instagramItem && ["video", "image", "reel", "reels", "post", "posts", "instagram"].includes(type)) {
      if (!project.instagramPosts.some(item => item.url === instagramItem.url)) project.instagramPosts.push(instagramItem);
    } else if (type === "video") {
      const videoId = youtubeVideoId(link);
      if (videoId && !project.videoIds.includes(videoId)) project.videoIds.push(videoId);
      else {
        const videoFile = directVideoUrl(link);
        if (videoFile && !project.videoFiles.includes(videoFile)) project.videoFiles.push(videoFile);
      }
    } else if (type === "image" && isPublicHttpUrl(link) && !project.photos.includes(link)) {
      project.photos.push(link);
    }
  });

  return [...groupedProjects.values()]
    .filter(project => project.videoIds.length || project.videoFiles.length || project.photos.length || project.instagramPosts.length)
    .map(project => ({
      ...project,
      description: project.description || `${project.category ? `${project.category} ` : ""}interior project.`,
      cover: project.videoIds.length
        ? `https://img.youtube.com/vi/${project.videoIds[0]}/hqdefault.jpg`
        : project.photos[0] || ""
    }))
    .sort((a, b) => projectYear(b.year) - projectYear(a.year) || a.sheetOrder - b.sheetOrder);
}

function displayProjectName(value) {
  return value
    .replace(/\b\w/g, character => character.toUpperCase())
    .replace(/\bKsr\b/g, "KSR")
    .replace(/\bMsr\b/g, "MSR")
    .replace(/\bBsr\b/g, "BSR");
}

function titleCaseTier(value) {
  const tier = value.trim().toLowerCase();
  return ({ premium: "Premium", signature: "Signature", essential: "Essential" })[tier] || "";
}

function isPublicHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function projectYear(year) {
  if (/^\d{4}$/.test(year)) return Date.UTC(Number(year), 11, 31);
  const parsed = Date.parse(year);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatProjectYear(year) {
  if (/^\d{4}$/.test(year)) return year;
  const timestamp = Date.parse(year);
  if (!Number.isFinite(timestamp)) return year;
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function textElement(tag, text, className) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function projectCard(project) {
  const card = document.createElement("article");
  card.className = "project-card";
  const button = document.createElement("button");
  button.className = "project-card-button";
  button.type = "button";
  const mediaSummary = projectMediaSummary(project);
  button.setAttribute("aria-label", `View ${project.title}, ${project.tier} interior project${mediaSummary ? ` with ${mediaSummary}` : ""}`);

  if (project.cover) {
    const image = document.createElement("img");
    image.className = "project-cover";
    image.src = project.cover;
    image.alt = `Interior design project: ${project.title}${project.location ? ` in ${project.location}` : ""}`;
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => {
      image.replaceWith(textElement("span", "S", "cover-placeholder"));
    }, { once: true });
    button.append(image);
  } else {
    button.append(textElement("span", "S", "cover-placeholder"));
  }

  button.append(textElement("span", project.tier, "project-tier"));
  const copy = document.createElement("div");
  copy.className = "project-card-copy";
  const details = document.createElement("div");
  const title = textElement("h3", project.title);
  if (project.featured) title.append(textElement("span", "FEATURED", "project-featured"));
  details.append(title);
  const metadata = [project.category, project.location, formatProjectYear(project.year)].filter(Boolean).join(" · ");
  if (metadata) details.append(textElement("p", metadata, "project-location"));
  if (mediaSummary) details.append(textElement("p", mediaSummary, "project-media-summary"));
  copy.append(details, textElement("span", "↗", "project-arrow"));
  button.append(copy);
  button.addEventListener("click", () => openProject(project, button));
  card.append(button);
  return card;
}

function visibleProjects() {
  return selectedTier === "All"
    ? projects
    : projects.filter(project => project.tier === selectedTier);
}

function projectMediaSummary(project) {
  const types = [];
  if (project.videoIds.length || project.videoFiles.length) types.push("Videos");
  if (project.photos.length) types.push("Photos");
  if (project.instagramPosts.some(item => item.kind === "reel")) types.push("Reels");
  if (project.instagramPosts.some(item => item.kind === "post")) types.push("Posts");
  if (project.instagramPosts.some(item => item.kind === "video")) types.push("Instagram videos");
  return types.join(" · ");
}

function renderFilters() {
  elements.tierFilters.replaceChildren();
  ["All", "Premium", "Signature", "Essential"].forEach(tier => {
    const button = textElement("button", tier, "tier-filter");
    button.type = "button";
    button.setAttribute("aria-pressed", String(tier === selectedTier));
    button.addEventListener("click", () => {
      selectedTier = tier;
      renderFilters();
      renderProjects();
    });
    elements.tierFilters.append(button);
  });
}

function renderProjects() {
  const shown = visibleProjects();
  elements.projectGrid.replaceChildren();
  elements.projectGrid.setAttribute("aria-busy", "false");
  if (!shown.length) {
    elements.projectGrid.append(textElement("p", "No projects are available in this tier yet.", "empty-card"));
    return;
  }
  elements.projectGrid.append(...shown.map(projectCard));
}

function renderFeatured() {
  const featured = projects.filter(project => project.featured);
  elements.featuredGrid.replaceChildren();
  elements.featuredSection.hidden = featured.length === 0;
  if (featured.length) elements.featuredGrid.append(...featured.map(projectCard));
}

function metadataLine(project) {
  return [
    project.category,
    project.location,
    formatProjectYear(project.year),
    project.area ? `${project.area} sq ft` : ""
  ].filter(Boolean).join("  ·  ");
}

function closeProject() {
  window.clearTimeout(videoLoadTimer);
  elements.modalMediaContent.replaceChildren();
  elements.modalMediaThumbnails.replaceChildren();
  elements.modalMedia.hidden = true;
  projectMediaItems = [];
  modalProject = null;
  document.body.classList.remove("dialog-open");
}

function addVideoPlayer(videoId) {
  window.clearTimeout(videoLoadTimer);
  elements.modalMediaContent.replaceChildren();
  const frame = document.createElement("div");
  frame.className = "video-player";
  const iframe = document.createElement("iframe");
  iframe.id = "active-youtube-player";
  iframe.title = `Project video: ${modalProject.title}`;
  iframe.loading = "eager";
  iframe.referrerPolicy = "no-referrer-when-downgrade";
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
  iframe.allowFullscreen = true;
  const embedUrl = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
  embedUrl.search = new URLSearchParams({
    autoplay: "1",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "1",
    origin: window.location.origin
  });
  iframe.src = embedUrl.href;
  iframe.addEventListener("error", () => showVideoError(frame), { once: true });
  iframe.addEventListener("load", () => {
    loadYouTubeIframeApi().then(() => {
      if (!iframe.isConnected) return;
      new window.YT.Player(iframe.id, {
        events: {
          onReady: () => window.clearTimeout(videoLoadTimer),
          onError: () => {
            window.clearTimeout(videoLoadTimer);
            showVideoError(frame);
          }
        }
      });
    }).catch(() => {
      window.clearTimeout(videoLoadTimer);
      showVideoError(frame);
    });
  }, { once: true });
  frame.append(iframe);
  elements.modalMediaContent.append(frame);
  videoLoadTimer = window.setTimeout(() => {
    if (iframe.isConnected) showVideoError(frame);
  }, 30000);
}

function addHostedVideoPlayer(url) {
  const frame = document.createElement("div");
  frame.className = "video-player";
  const video = document.createElement("video");
  video.className = "hosted-video-player";
  video.controls = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.src = url;
  video.addEventListener("error", () => {
    showVideoError(frame, "Check that the video URL is public and uses a browser-supported MP4, WebM, or Ogg format.");
  }, { once: true });
  frame.append(video);
  elements.modalMediaContent.append(frame);
}

function loadYouTubeIframeApi() {
  if (window.YT?.Player) return Promise.resolve();
  if (youTubeApiPromise) return youTubeApiPromise;

  youTubeApiPromise = new Promise((resolve, reject) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousCallback === "function") previousCallback();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => reject(new Error("YouTube's player could not be loaded."));
    document.head.append(script);
  });
  return youTubeApiPromise;
}

function showVideoError(frame, message = "Check the video URL and make sure embedding is enabled for it.") {
  if (!frame.isConnected || frame.querySelector(".video-error")) return;
  window.clearTimeout(videoLoadTimer);
  frame.replaceChildren();
  const error = document.createElement("div");
  error.className = "video-error";
  error.append(
    textElement("strong", "This video could not be played here."),
    textElement("span", message)
  );
  frame.append(error);
}

function renderMediaNavigation() {
  elements.modalMediaThumbnails.replaceChildren();
  elements.modalMediaThumbnails.hidden = projectMediaItems.length < 2;
  projectMediaItems.forEach((item, index) => {
    const button = textElement("button", item.label, "media-thumbnail");
    button.type = "button";
    button.setAttribute("aria-current", String(index === activeMediaIndex));
    button.addEventListener("click", () => showProjectMedia(index));
    elements.modalMediaThumbnails.append(button);
  });
}

function showProjectMedia(index) {
  if (!modalProject || !projectMediaItems.length) return;
  activeMediaIndex = (index + projectMediaItems.length) % projectMediaItems.length;
  const item = projectMediaItems[activeMediaIndex];
  window.clearTimeout(videoLoadTimer);
  elements.modalMediaContent.replaceChildren();
  elements.modalMediaStage.dataset.mediaType = item.type;
  elements.modalMediaCount.textContent = `${activeMediaIndex + 1} / ${projectMediaItems.length} · ${item.label}`;
  elements.mediaPrevious.disabled = projectMediaItems.length < 2;
  elements.mediaNext.disabled = projectMediaItems.length < 2;
  renderMediaNavigation();

  if (item.type === "video") {
    addVideoPlayer(item.id);
  } else if (item.type === "video-file") {
    addHostedVideoPlayer(item.url);
  } else if (item.type === "photo") {
    const button = document.createElement("button");
    button.className = "media-photo-trigger";
    button.type = "button";
    button.setAttribute("aria-label", `View ${modalProject.title}, photo ${item.photoIndex + 1} full size`);
    const image = document.createElement("img");
    image.className = "project-media-image";
    image.src = item.url;
    image.alt = `${modalProject.title}, project photo ${item.photoIndex + 1}`;
    image.decoding = "async";
    button.append(image);
    button.addEventListener("click", () => openPhotoLightbox(item.photoIndex));
    elements.modalMediaContent.append(button);
  } else {
    const iframe = document.createElement("iframe");
    iframe.className = "instagram-post-frame";
    iframe.title = `${modalProject.title}, Instagram project photos`;
    iframe.loading = "eager";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; web-share";
    iframe.src = item.url;
    const note = textElement("p", "Instagram provides only a preview here; its Reel URL cannot play the video in this viewer. For in-page playback, add the original MP4 (H.264/AAC) to the site and put its path, such as assets/project-reel.mp4, in this project's video cell.", "instagram-embed-note");
    elements.modalMediaContent.append(iframe, note);
  }
}

function openProject(project, trigger) {
  modalProject = project;
  lastFocusedElement = trigger;
  activeMediaIndex = 0;
  elements.modalTitle.textContent = project.title;
  elements.modalTier.textContent = project.tier;
  elements.modalMeta.textContent = metadataLine(project);
  elements.modalMeta.hidden = !elements.modalMeta.textContent;
  elements.modalDescription.textContent = project.description;
  elements.modalDescription.hidden = !project.description;
  const instagramCounts = { post: 0, reel: 0, video: 0 };
  projectMediaItems = [
    ...project.videoIds.map((id, index) => ({ type: "video", id, label: `Video ${index + 1}` })),
    ...project.videoFiles.map((url, index) => ({ type: "video-file", url, label: `Video ${project.videoIds.length + index + 1}` })),
    ...project.photos.map((url, index) => ({ type: "photo", url, photoIndex: index, label: `Photo ${index + 1}` })),
    ...project.instagramPosts.map(item => {
      instagramCounts[item.kind] += 1;
      const kind = item.kind[0].toUpperCase() + item.kind.slice(1);
      return { type: "instagram", url: item.url, label: `Instagram ${kind} ${instagramCounts[item.kind]}` };
    })
  ];
  elements.modalMedia.hidden = projectMediaItems.length === 0;

  elements.enquireProject.onclick = event => {
    event.preventDefault();
    const title = modalProject?.title || project.title;
    closeProjectDialog();
    document.querySelector("#project-interest").value = title;
    document.querySelector("#contact").scrollIntoView({ behavior: "smooth" });
    window.setTimeout(() => document.querySelector("#contact-form input[name='name']").focus(), 450);
  };

  elements.projectModal.showModal();
  document.body.classList.add("dialog-open");
  elements.modalClose.focus();
  if (projectMediaItems.length) showProjectMedia(0);
}

function closeProjectDialog() {
  if (elements.projectModal.open) elements.projectModal.close();
  closeProject();
  lastFocusedElement?.focus();
}

let activePhotoUrls = [];
function openPhotoLightbox(index) {
  activePhotoUrls = modalProject?.photos || [];
  if (!activePhotoUrls.length) return;
  activePhotoIndex = index;
  updateLightbox();
  elements.photoLightbox.showModal();
}

function updateLightbox() {
  const url = activePhotoUrls[activePhotoIndex];
  elements.lightboxImage.src = url;
  elements.lightboxImage.alt = `${modalProject?.title || "Project"} photo ${activePhotoIndex + 1}`;
  elements.lightboxCount.textContent = `${activePhotoIndex + 1} / ${activePhotoUrls.length}`;
  document.querySelector("#lightbox-prev").disabled = activePhotoUrls.length < 2;
  document.querySelector("#lightbox-next").disabled = activePhotoUrls.length < 2;
}

function moveLightbox(direction) {
  if (!activePhotoUrls.length) return;
  activePhotoIndex = (activePhotoIndex + direction + activePhotoUrls.length) % activePhotoUrls.length;
  updateLightbox();
}

function renderContactSettings() {
  document.title = `${CONFIG.COMPANY_NAME} | Interior Design`;
  document.querySelector(".brand-name").innerHTML = `${escapeHtml(CONFIG.COMPANY_NAME.split(" ")[0].toUpperCase())} <small>INTERIOTECH & CONSTRUCTIONS</small>`;
  document.querySelector(".footer-brand .brand-name").innerHTML = `${escapeHtml(CONFIG.COMPANY_NAME.split(" ")[0].toUpperCase())} <small>INTERIOTECH & CONSTRUCTIONS</small>`;
  document.querySelector("#current-year").textContent = String(new Date().getFullYear());
  document.querySelector("#youtube-link").href = CONFIG.YOUTUBE_URL;
  document.querySelector("#instagram-link").href = CONFIG.INSTAGRAM_URL;

  if (CONFIG.PHONE) {
    const phone = document.querySelector("#contact-phone");
    phone.href = `tel:${CONFIG.PHONE.replace(/[^\d+]/g, "")}`;
    phone.textContent = CONFIG.PHONE;
    phone.hidden = false;
  }
  if (CONFIG.EMAIL) {
    const email = document.querySelector("#contact-email");
    email.href = `mailto:${CONFIG.EMAIL}`;
    email.textContent = CONFIG.EMAIL;
    email.hidden = false;
  }
  if (CONFIG.MAP_URL && isPublicHttpUrl(CONFIG.MAP_URL)) {
    const map = document.querySelector("#contact-map");
    map.href = CONFIG.MAP_URL;
    map.hidden = false;
  }
  if (CONFIG.WHATSAPP_NUMBER) {
    const whatsapp = document.querySelector("#whatsapp-link");
    whatsapp.href = `https://wa.me/${CONFIG.WHATSAPP_NUMBER.replace(/\D/g, "")}`;
    whatsapp.hidden = false;
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function showDemoNotice(message) {
  elements.dataNotice.replaceChildren(document.createTextNode(message));
  elements.dataNotice.hidden = false;
}

async function loadProjects({ quiet = false } = {}) {
  if (!quiet) {
    elements.projectGrid.setAttribute("aria-busy", "true");
    elements.projectGrid.replaceChildren(textElement("div", "Gathering project stories…", "loading-card"));
  }

  if (!CONFIG.SHEET_CSV_URL || CONFIG.SHEET_CSV_URL.includes("PASTE_")) {
    projects = demoProjects();
    showDemoNotice("Showing sample projects. Connect the published Projects CSV in script.js to load the studio's live work.");
  } else {
    try {
      const response = await fetch(CONFIG.SHEET_CSV_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`Google Sheets returned HTTP ${response.status}.`);
      const loaded = parseProjectRows(await response.text());
      projects = loaded;
      elements.dataNotice.hidden = true;
      if (loaded.some(project => project.sourceFormat === "media" && project.tierSource !== "sheet")) {
        showDemoNotice("Some media-sheet projects do not have a Premium, Signature, or Essential value in the tier/category column. KSR, MSR, and BSR use demo assignments; other projects default to Signature. Add a tier column to assign tiers in the sheet.");
      }
      if (!projects.length) showDemoNotice("No projects with Status = Show were found. Showing sample projects until the sheet is updated.");
      if (!projects.length) projects = demoProjects();
    } catch (error) {
      projects = demoProjects();
      showDemoNotice(`The projects sheet could not be loaded (${error.message}). Showing sample projects. Check the published Projects CSV URL.`);
    }
  }

  renderFilters();
  renderFeatured();
  renderProjects();
}

function setFormStatus(message, state = "") {
  elements.formStatus.textContent = message;
  elements.formStatus.dataset.state = state;
}

async function submitEnquiry(event) {
  event.preventDefault();
  const form = elements.contactForm;
  const data = new FormData(form);
  const formStartedAt = Number(data.get("formStartedAt"));
  if (data.get("website") || !Number.isFinite(formStartedAt) || Date.now() - formStartedAt < 3000) {
    setFormStatus("Please wait a moment and try submitting again.", "error");
    return;
  }
  if (!form.reportValidity()) return;

  if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.includes("PASTE_")) {
    setFormStatus("The enquiry form is not connected yet. Please use the studio's phone or email once those contact details are added.", "error");
    return;
  }

  const button = form.querySelector(".submit-button");
  button.disabled = true;
  button.querySelector("span").textContent = "Sending…";
  setFormStatus("");
  const payload = new URLSearchParams();
  for (const [key, value] of data.entries()) payload.set(key, String(value));
  payload.set("autoReply", String(CONFIG.AUTO_REPLY));

  try {
    const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: "POST",
      mode: "cors",
      redirect: "follow",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: payload.toString()
    });
    if (!response.ok) throw new Error(`The enquiry service returned HTTP ${response.status}.`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || "The enquiry could not be saved.");
    form.reset();
    document.querySelector("#form-started-at").value = String(Date.now());
    setFormStatus("Thank you—your enquiry has been received.");
  } catch (error) {
    setFormStatus(`${error.message} Check your connection or contact the studio directly.`, "error");
  } finally {
    button.disabled = false;
    button.querySelector("span").textContent = "Send enquiry";
  }
}

function initNavigation() {
  elements.menuToggle.addEventListener("click", () => {
    const expanded = elements.menuToggle.getAttribute("aria-expanded") === "true";
    elements.menuToggle.setAttribute("aria-expanded", String(!expanded));
    elements.menuToggle.setAttribute("aria-label", expanded ? "Open menu" : "Close menu");
    elements.primaryNav.classList.toggle("is-open", !expanded);
  });
  elements.primaryNav.addEventListener("click", event => {
    if (event.target.closest("a")) {
      elements.primaryNav.classList.remove("is-open");
      elements.menuToggle.setAttribute("aria-expanded", "false");
      elements.menuToggle.setAttribute("aria-label", "Open menu");
    }
  });
}

function initDialogs() {
  elements.modalClose.addEventListener("click", closeProjectDialog);
  elements.mediaPrevious.addEventListener("click", () => showProjectMedia(activeMediaIndex - 1));
  elements.mediaNext.addEventListener("click", () => showProjectMedia(activeMediaIndex + 1));
  elements.projectModal.addEventListener("click", event => {
    if (event.target === elements.projectModal) closeProjectDialog();
  });
  elements.projectModal.addEventListener("close", closeProject);
  elements.photoLightbox.addEventListener("click", event => {
    if (event.target === elements.photoLightbox) elements.photoLightbox.close();
  });
  elements.photoLightbox.addEventListener("cancel", event => {
    event.preventDefault();
    elements.photoLightbox.close();
  });
  document.querySelector("#lightbox-close").addEventListener("click", () => elements.photoLightbox.close());
  document.querySelector("#lightbox-prev").addEventListener("click", () => moveLightbox(-1));
  document.querySelector("#lightbox-next").addEventListener("click", () => moveLightbox(1));
  document.addEventListener("keydown", event => {
    if (elements.photoLightbox.open && event.key === "ArrowLeft") moveLightbox(-1);
    if (elements.photoLightbox.open && event.key === "ArrowRight") moveLightbox(1);
    if (elements.projectModal.open && !elements.photoLightbox.open && event.key === "ArrowLeft") showProjectMedia(activeMediaIndex - 1);
    if (elements.projectModal.open && !elements.photoLightbox.open && event.key === "ArrowRight") showProjectMedia(activeMediaIndex + 1);
  });
}

renderContactSettings();
initNavigation();
initDialogs();
elements.contactForm.addEventListener("submit", submitEnquiry);
document.querySelector("#form-started-at").value = String(Date.now());
loadProjects();
window.setInterval(() => loadProjects({ quiet: true }), CONFIG.SHEET_REFRESH_MS);
