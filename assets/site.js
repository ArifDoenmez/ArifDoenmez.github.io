const grid = document.getElementById("feature-grid");
const emptyState = document.getElementById("empty-state");
const filterButtons = document.querySelectorAll("[data-filter]");

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function topLevelCategories() {
  return new Set(["paper", "talk", "essay", "system"]);
}

function createCard(entry) {
  const a = document.createElement("a");
  a.className = "feature-card";
  a.href = entry.href;
  a.dataset.tags = ["all", ...entry.categories].join(" ");

  const visibleCats = entry.categories
    .filter((cat) => !topLevelCategories().has(cat))
    .slice(0, 2);
  const metaParts = [entry.type, ...visibleCats];

  a.innerHTML = `
    <div class="feature-card__bg" style="background-image: url('${entry.thumbnail}')"></div>
    <div class="feature-card__overlay"></div>
    <div class="feature-card__content">
      <div class="feature-card__meta">
        ${metaParts.map((x) => `<span>${escapeHtml(formatLabel(x))}</span>`).join("")}
      </div>
      <h2 class="feature-card__title">${escapeHtml(entry.title)}</h2>
      <p class="feature-card__excerpt">${escapeHtml(entry.excerpt)}</p>
    </div>
  `;

  return a;
}

function formatLabel(value) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function setActiveFilter(value) {
  filterButtons.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.filter === value);
  });
}

function showAllCards() {
  grid
    .querySelectorAll(".feature-card")
    .forEach((card) => card.classList.remove("is-hidden"));
  emptyState.classList.remove("is-visible");
  setActiveFilter("all");
}

function applyFilter(filterValue) {
  let visibleCount = 0;

  grid.querySelectorAll(".feature-card").forEach((card) => {
    const tags = (card.dataset.tags || "").split(" ");
    const isVisible = tags.includes(filterValue);
    card.classList.toggle("is-hidden", !isVisible);
    if (isVisible) visibleCount += 1;
  });

  emptyState.classList.toggle("is-visible", visibleCount === 0);
  setActiveFilter(filterValue);
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filterValue = button.dataset.filter;
    const isAlreadyActive = button.classList.contains("is-active");

    if (filterValue === "all" || isAlreadyActive) {
      showAllCards();
      return;
    }

    applyFilter(filterValue);
  });
});

async function loadCards() {
  const slugs = await loadJSON("released/index.json");

  const entries = await Promise.all(
    slugs.map(async (slug) => {
      const meta = await loadJSON(`released/${slug}/meta.json`);
      return {
        slug,
        ...meta,
        href: meta.external_url || `released/${slug}/index.html`,
        isExternal: Boolean(meta.external_url),
        thumbnail: `released/${slug}/${meta.thumbnail || "thumbnail.svg"}`,
      };
    }),
  );

  entries.forEach((entry) => {
    grid.appendChild(createCard(entry));
  });
}

loadCards()
  .then(() => showAllCards())
  .catch((err) => {
    console.error(err);
    emptyState.textContent =
      "Could not load entries. Serve the folder through a local or static web server.";
    emptyState.classList.add("is-visible");
  });
