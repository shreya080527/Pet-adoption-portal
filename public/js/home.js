// ============================================================
// home.js — index.html stats counter + featured resources
// ============================================================

import { db } from "./firebase-config.js";
import {
  collection, getDocs, query, where, limit, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Live stats ────────────────────────────────────────────────
(async () => {
  const [petsSnap, lfSnap] = await Promise.all([
    getDocs(collection(db, "pets")),
    getDocs(collection(db, "lost_found"))
  ]);

  const pets = petsSnap.docs.map(d => d.data());
  const available = pets.filter(p => p.status === "available").length;
  const adopted   = pets.filter(p => p.status === "adopted").length;

  const statAvailable = document.getElementById("statAvailable");
  const statAdopted   = document.getElementById("statAdopted");
  const statLostFound = document.getElementById("statLostFound");
  if (statAvailable) statAvailable.textContent = available;
  if (statAdopted)   statAdopted.textContent   = adopted;
  if (statLostFound) statLostFound.textContent = lfSnap.size;
})();

// ── Featured resources (latest 3) ────────────────────────────
const featuredResources = document.getElementById("featuredResources");
if (featuredResources) {
  (async () => {
    const snap = await getDocs(
      query(collection(db, "resources"), orderBy("createdAt", "desc"), limit(3))
    );
    if (snap.empty) {
      featuredResources.innerHTML = `<p class="empty-state">No articles yet.</p>`;
      return;
    }
    featuredResources.innerHTML = snap.docs.map(d => {
      const r = d.data();
      return `
        <div class="resource-card" onclick="window.location.href='resources.html?id=${d.id}'">
          <img src="${r.imageURL || 'https://placehold.co/400x200?text=Article'}" alt="${r.title}" />
          <div class="resource-card-body">
            <span class="origin-tag">${r.category}</span>
            <h3>${r.title}</h3>
            <p>${(r.content || "").slice(0, 90)}…</p>
          </div>
        </div>`;
    }).join("");
  })();
}
