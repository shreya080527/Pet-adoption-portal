// ============================================================
// pets.js
// Used by: pets.html, pet-detail.html, index.html (featured)
// ============================================================

import { db }      from "./firebase-config.js";
import { auth }    from "./auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  collection, getDocs, getDoc, doc,
  query, where, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { formatDate, originLabel, getParam } from "./utils.js";

// ── Shared pet card builder ───────────────────────────────────
export function buildPetCard(pet) {
  const statusClass = { available: "badge-available", pending: "badge-pending", adopted: "badge-adopted" }[pet.status] || "";
  return `
    <div class="pet-card">
      <img class="pet-card-img"
           src="${pet.imageURL || 'https://placehold.co/400x300?text=No+Photo'}"
           alt="${pet.name}" />
      <div class="pet-card-body">
        <h3>${pet.name}</h3>
        <p class="pet-card-meta">${pet.species}${pet.breed ? " · " + pet.breed : ""} · ${pet.age ?? "?"} yr${pet.age !== 1 ? "s" : ""} · ${pet.gender || ""}</p>
        <p class="pet-card-meta" style="margin-bottom:0">${originLabel(pet.origin)}</p>
        <div class="pet-card-footer">
          <a href="pet-detail.html?id=${pet.id}" class="btn btn-sm btn-primary">View profile</a>
          <span class="badge ${statusClass}">${pet.status}</span>
        </div>
      </div>
    </div>`;
}

// ── pets.html — browse + filter ───────────────────────────────
const petGrid = document.getElementById("petGrid");
if (petGrid) {
  let allPets = [];

  async function loadPets() {
    const snap = await getDocs(query(collection(db, "pets"), orderBy("addedAt", "desc")));
    allPets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    applyFilters();
  }

  function applyFilters() {
    const species = document.getElementById("filterSpecies")?.value;
    const origin  = document.getElementById("filterOrigin")?.value;
    const age     = document.getElementById("filterAge")?.value;
    const status  = document.getElementById("filterStatus")?.value;
    const search  = document.getElementById("searchInput")?.value.toLowerCase();

    let filtered = allPets.filter(p => {
      if (species && p.species !== species) return false;
      if (origin  && p.origin  !== origin)  return false;
      if (status  && p.status  !== status)  return false;
      if (age) {
        const a = parseFloat(p.age) || 0;
        if (age === "young"  && a > 1)   return false;
        if (age === "adult"  && (a < 1 || a > 7)) return false;
        if (age === "senior" && a < 7)   return false;
      }
      if (search && !p.name.toLowerCase().includes(search) &&
          !(p.breed || "").toLowerCase().includes(search)) return false;
      return true;
    });

    document.getElementById("resultsCount").textContent = `${filtered.length} pet${filtered.length !== 1 ? "s" : ""}`;
    petGrid.innerHTML = filtered.length
      ? filtered.map(buildPetCard).join("")
      : `<p class="empty-state">No pets match your filters.</p>`;
  }

  ["filterSpecies","filterOrigin","filterAge","filterStatus"].forEach(id =>
    document.getElementById(id)?.addEventListener("change", applyFilters)
  );
  document.getElementById("searchInput")?.addEventListener("input", applyFilters);
  document.getElementById("resetFilters")?.addEventListener("click", () => {
    ["filterSpecies","filterOrigin","filterAge","filterStatus"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = id === "filterStatus" ? "available" : "";
    });
    const s = document.getElementById("searchInput");
    if (s) s.value = "";
    applyFilters();
  });

  loadPets();
}

// ── pet-detail.html ───────────────────────────────────────────
const petDetailContent = document.getElementById("petDetailContent");
if (petDetailContent) {
  const petId = getParam("id");
  if (!petId) {
    document.getElementById("loadingMsg").textContent = "No pet ID specified.";
  } else {
    (async () => {
      const snap = await getDoc(doc(db, "pets", petId));
      if (!snap.exists()) {
        document.getElementById("loadingMsg").textContent = "Pet not found.";
        return;
      }
      const p = { id: snap.id, ...snap.data() };
      const statusClass = { available: "badge-available", pending: "badge-pending", adopted: "badge-adopted" }[p.status] || "";

      document.getElementById("loadingMsg").hidden = true;
      petDetailContent.hidden = false;

      document.getElementById("petImage").src         = p.imageURL || "https://placehold.co/600x600?text=No+Photo";
      document.getElementById("petImage").alt         = p.name;
      document.getElementById("petStatusBadge").textContent  = p.status;
      document.getElementById("petStatusBadge").className    = `badge ${statusClass}`;
      document.getElementById("petOriginTag").textContent    = originLabel(p.origin);
      document.getElementById("petName").textContent         = p.name;
      document.getElementById("petNameInline").textContent   = p.name;
      document.getElementById("petMeta").textContent         =
        `${p.species}${p.breed ? " · " + p.breed : ""} · ${p.age ?? "?"} yr${p.age !== 1 ? "s" : ""} · ${p.gender || ""}`;
      document.getElementById("petColor").textContent        = p.color || "—";
      document.getElementById("petVaccinated").textContent   = p.vaccinated  ? "Yes ✓" : "No";
      document.getElementById("petNeutered").textContent     = p.neutered    ? "Yes ✓" : "No";
      document.getElementById("petHealthStatus").textContent = p.healthStatus || "—";
      document.getElementById("petDescription").textContent  = p.description || "No description provided.";

      document.getElementById("healthRecordsBtn").href = `pet-health.html?id=${p.id}&name=${encodeURIComponent(p.name)}`;

      // Adopt button — only if available and logged in
      const adoptBtn = document.getElementById("adoptBtn");
      onAuthStateChanged(auth, user => {
        if (!user || p.status !== "available") {
          adoptBtn.textContent = p.status !== "available" ? "Not available" : "Log in to adopt";
          adoptBtn.classList.replace("btn-primary", "btn-outline");
          adoptBtn.href = user ? "#" : "login.html";
        } else {
          adoptBtn.href = `adopt.html?id=${p.id}&name=${encodeURIComponent(p.name)}`;
        }
      });
    })();
  }
}

// ── index.html — featured pets (latest 6 available) ───────────
const featuredPets = document.getElementById("featuredPets");
if (featuredPets) {
  (async () => {
    const snap = await getDocs(
      query(collection(db, "pets"), where("status", "==", "available"), orderBy("addedAt", "desc"), limit(6))
    );
    const pets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    featuredPets.innerHTML = pets.length
      ? pets.map(buildPetCard).join("")
      : `<p class="empty-state">No pets listed yet.</p>`;
  })();
}
