import { deals, CHECKED_LABEL } from "./data.js";

const grid = document.getElementById("dealGrid");
const resultLine = document.getElementById("resultLine");
const emptyMsg = document.getElementById("emptyMsg");
const searchBox = document.getElementById("searchBox");
const categoryFilter = document.getElementById("categoryFilter");
const storeFilter = document.getElementById("storeFilter");
const discountFilter = document.getElementById("discountFilter");
const verdictFilter = document.getElementById("verdictFilter");
const sortOrder = document.getElementById("sortOrder");
const resetBtn = document.getElementById("resetBtn");

export function discountPct(deal) {
  return Math.round(((deal.was - deal.price) / deal.was) * 100);
}

export function dollarsSaved(deal) {
  return deal.was - deal.price;
}

export function money(n) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\.00$/, "");
}

const VERDICT_LABELS = {
  real: "REAL DEAL",
  strong: "STRONG",
  decent: "DECENT",
  routine: "ROUTINE",
  "check-list": "CHECK THE LIST",
};

function fillSelect(select, values, allLabel) {
  select.innerHTML = "";
  const all = document.createElement("option");
  all.value = "";
  all.textContent = allLabel;
  select.appendChild(all);
  for (const value of values) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    select.appendChild(opt);
  }
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

fillSelect(categoryFilter, uniqueSorted(deals.map((d) => d.category)), "All categories");
fillSelect(storeFilter, uniqueSorted(deals.map((d) => d.store)), "All stores");

function verdictRank(deal) {
  return { real: 0, strong: 1, decent: 2, routine: 3, "check-list": 4 }[deal.verdict];
}

function matchesFilters(deal) {
  const q = searchBox.value.trim().toLowerCase();
  if (q && !(deal.title + " " + deal.store + " " + deal.category).toLowerCase().includes(q)) return false;
  if (categoryFilter.value && deal.category !== categoryFilter.value) return false;
  if (storeFilter.value && deal.store !== storeFilter.value) return false;
  if (discountPct(deal) < Number(discountFilter.value)) return false;
  const vf = verdictFilter.value;
  if (vf === "real" && deal.verdict !== "real") return false;
  if (vf === "strong" && verdictRank(deal) > 1) return false;
  if (vf === "routine" && deal.verdict !== "routine") return false;
  if (vf === "check-list" && deal.verdict !== "check-list") return false;
  return true;
}

function sortDeals(list) {
  const sorted = [...list];
  if (sortOrder.value === "discount") sorted.sort((a, b) => discountPct(b) - discountPct(a) || dollarsSaved(b) - dollarsSaved(a));
  else if (sortOrder.value === "saved") sorted.sort((a, b) => dollarsSaved(b) - dollarsSaved(a));
  else if (sortOrder.value === "price-low") sorted.sort((a, b) => a.price - b.price);
  else if (sortOrder.value === "price-high") sorted.sort((a, b) => b.price - a.price);
  else sorted.sort((a, b) => a.title.localeCompare(b.title));
  return sorted;
}

function renderCard(deal) {
  const card = document.createElement("article");
  card.className = "card";
  const top = document.createElement("div");
  top.className = "card-top";
  const cat = document.createElement("span");
  cat.textContent = deal.category;
  const store = document.createElement("span");
  store.textContent = deal.store;
  top.append(cat, store);
  const title = document.createElement("h3");
  title.textContent = deal.title;
  const priceRow = document.createElement("div");
  priceRow.className = "price-row";
  const sale = document.createElement("span");
  sale.className = "sale";
  sale.textContent = money(deal.price);
  const was = document.createElement("span");
  was.className = "was";
  was.textContent = money(deal.was);
  const save = document.createElement("span");
  save.className = "save";
  save.textContent = "Save " + money(dollarsSaved(deal)) + " (" + discountPct(deal) + "% off)";
  priceRow.append(sale, was, save);
  const badge = document.createElement("span");
  badge.className = "badge badge-" + deal.verdict;
  badge.textContent = VERDICT_LABELS[deal.verdict];
  const evidence = document.createElement("p");
  evidence.className = "evidence";
  evidence.textContent = deal.evidence;
  const source = document.createElement("p");
  source.className = "source";
  source.textContent = "Checked " + CHECKED_LABEL + " · Source: " + deal.source;
  const link = document.createElement("a");
  link.className = "store-link";
  link.href = deal.url;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "View at " + deal.store + " \u2197";
  card.append(top, title, priceRow, badge, evidence, source, link);
  return card;
}

export function renderDeals() {
  const shown = sortDeals(deals.filter(matchesFilters));
  grid.innerHTML = "";
  for (const deal of shown) grid.appendChild(renderCard(deal));
  const realCount = shown.filter((d) => d.verdict === "real").length;
  resultLine.textContent = shown.length + " of " + deals.length + " deals shown" + (realCount ? " · " + realCount + " real deals" : "") + ".";
  emptyMsg.hidden = shown.length > 0;
}

function fillStats() {
  const real = deals.filter((d) => d.verdict === "real").length;
  const best = Math.max(...deals.map(discountPct));
  const saved = deals.reduce((sum, d) => sum + dollarsSaved(d), 0);
  document.getElementById("statTotal").textContent = String(deals.length);
  document.getElementById("statReal").textContent = String(real);
  document.getElementById("statBest").textContent = best + "%";
  document.getElementById("statSaved").textContent = money(saved);
}

for (const el of [searchBox, categoryFilter, storeFilter, discountFilter, verdictFilter, sortOrder]) {
  el.addEventListener("input", renderDeals);
  el.addEventListener("change", renderDeals);
}

resetBtn.addEventListener("click", () => {
  searchBox.value = "";
  categoryFilter.value = "";
  storeFilter.value = "";
  discountFilter.value = "0";
  verdictFilter.value = "";
  sortOrder.value = "discount";
  renderDeals();
});

// Shareable filtered links: ?category=TVs&store=Amazon&verdict=real&q=airpods
// lets a shopper (or a screenshot) open the finder already filtered.
function applyUrlParams() {
  const params = new URLSearchParams(location.search);
  if (params.get("q")) searchBox.value = params.get("q");
  if (params.get("category")) categoryFilter.value = params.get("category");
  if (params.get("store")) storeFilter.value = params.get("store");
  if (params.get("discount")) discountFilter.value = params.get("discount");
  if (params.get("verdict")) verdictFilter.value = params.get("verdict");
  if (params.get("sort")) sortOrder.value = params.get("sort");
}

fillStats();
applyUrlParams();
renderDeals();
