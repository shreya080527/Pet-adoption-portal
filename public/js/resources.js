// ============================================================
// resources.js — resources.html
// ============================================================

import { db }  from "./firebase-config.js";
import {
  collection, getDocs, getDoc, doc,
  query, where, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getParam, formatDate } from "./utils.js";

const resourceGrid    = document.getElementById("resourceGrid");
const articleSection  = document.getElementById("articleSection");
let activeCategory    = "";

// ── Check if a direct article link ───────────────────────────
const directId = getParam("id");
if (directId) {
  openArticle(directId);
} else {
  loadResources();
}

// ── Category tabs ─────────────────────────────────────────────
document.querySelectorAll("#resourceTabs .tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#resourceTabs .tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeCategory = btn.dataset.category;
    loadResources();
  });
});

// ── Load articles list ────────────────────────────────────────
async function loadResources() {
  if (!resourceGrid) return;
  resourceGrid.innerHTML = `<p class="empty-state">Loading articles…</p>`;
  articleSection.hidden  = true;
  resourceGrid.parentElement.hidden = false;

  const q = activeCategory
    ? query(collection(db, "resources"), where("category", "==", activeCategory), orderBy("createdAt", "desc"))
    : query(collection(db, "resources"), orderBy("createdAt", "desc"));

  const snap = await getDocs(q);
  if (snap.empty) { resourceGrid.innerHTML = `<p class="empty-state">No articles yet.</p>`; return; }

  resourceGrid.innerHTML = snap.docs.map(d => {
    const r = d.data();
    return `
      <div class="resource-card" onclick="openArticleById('${d.id}')">
        <img src="${r.imageURL || 'https://placehold.co/400x200?text=Article'}" alt="${r.title}" />
        <div class="resource-card-body">
          <span class="origin-tag">${r.category}</span>
          <h3>${r.title}</h3>
          <p>${(r.content || "").slice(0, 100)}…</p>
        </div>
      </div>`;
  }).join("");
}

// ── Open single article ───────────────────────────────────────
window.openArticleById = openArticle;

async function openArticle(id) {
  const snap = await getDoc(doc(db, "resources", id));
  if (!snap.exists()) return;
  const r = snap.data();

  document.getElementById("articleCategory").textContent = r.category;
  document.getElementById("articleTitle").textContent    = r.title;
  document.getElementById("articleMeta").textContent     = `By ${r.author || "PawPath Team"} · ${formatDate(r.createdAt)}`;

  const img = document.getElementById("articleImage");
  if (r.imageURL) { img.src = r.imageURL; img.hidden = false; } else { img.hidden = true; }

  document.getElementById("articleContent").innerHTML =
    (r.content || "").split("\n").map(line => `<p>${line}</p>`).join("");

  resourceGrid?.parentElement && (resourceGrid.closest("section").hidden = true);
  articleSection.hidden = false;
  window.scrollTo(0, 0);
}

// Back to list
document.getElementById("backToResources")?.addEventListener("click", (e) => {
  e.preventDefault();
  articleSection.hidden = true;
  resourceGrid?.closest("section") && (resourceGrid.closest("section").hidden = false);
  loadResources();
});
