// ============================================================
// lost-found.js — lost-found.html
// ============================================================

import { db, storage }  from "./firebase-config.js";
import { auth, requireAuth } from "./auth.js";
import {
  collection, addDoc, getDocs,
  query, where, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { wireImagePreview, showError, hideError, showSuccess, setLoading, toast, formatDate } from "./utils.js";

wireImagePreview("lfImageFile", "lfImagePreview");

let activeType = "";   // "" | "lost" | "found"

// ── Load posts ────────────────────────────────────────────────
const lfGrid = document.getElementById("lfGrid");

async function loadPosts() {
  if (!lfGrid) return;
  lfGrid.innerHTML = `<p class="empty-state">Loading…</p>`;

  let q = activeType
    ? query(collection(db, "lost_found"), where("type", "==", activeType), orderBy("createdAt", "desc"))
    : query(collection(db, "lost_found"), orderBy("createdAt", "desc"));

  const snap = await getDocs(q);
  if (snap.empty) { lfGrid.innerHTML = `<p class="empty-state">No posts yet.</p>`; return; }

  lfGrid.innerHTML = snap.docs.map(d => {
    const p = d.data();
    const typeClass = p.type === "lost" ? "badge-lost" : "badge-found";
    return `
      <div class="lf-card">
        <img src="${p.imageURL || 'https://placehold.co/400x200?text=No+Photo'}" alt="${p.species}" />
        <div class="lf-card-body">
          <span class="badge ${typeClass}">${p.type.toUpperCase()}</span>
          <h4>${p.species}${p.breed ? " · " + p.breed : ""}</h4>
          <p>${p.color ? "Color: " + p.color : ""}</p>
          <p>${p.description}</p>
          <p>📍 ${p.location} — ${p.date}</p>
          <p class="lf-card-contact">Contact: ${p.contactName} · ${p.contactPhone}</p>
        </div>
      </div>`;
  }).join("");
}
loadPosts();

// ── Tab filter ────────────────────────────────────────────────
document.querySelectorAll("#lfTabs .tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#lfTabs .tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeType = btn.dataset.type;
    loadPosts();
  });
});

// ── Report form toggle ────────────────────────────────────────
const reportFormEl = document.getElementById("lostFoundForm");

document.getElementById("openReportFormBtn")?.addEventListener("click", () => {
  onAuthStateChanged(auth, user => {
    if (!user) {
      document.getElementById("authGate").hidden = false; return;
    }
    reportFormEl.hidden = !reportFormEl.hidden;
  });
});
document.getElementById("cancelLfForm")?.addEventListener("click", () => {
  reportFormEl.hidden = true;
});

// ── Submit report ─────────────────────────────────────────────
reportFormEl?.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError("lfError");

  const user        = auth.currentUser;
  const postType    = document.getElementById("postType").value;
  const species     = document.getElementById("lfSpecies").value;
  const breed       = document.getElementById("lfBreed").value.trim();
  const color       = document.getElementById("lfColor").value.trim();
  const description = document.getElementById("lfDescription").value.trim();
  const location    = document.getElementById("lfLocation").value.trim();
  const date        = document.getElementById("lfDate").value;
  const contactName = document.getElementById("lfContactName").value.trim();
  const contactPhone= document.getElementById("lfContactPhone").value.trim();
  const imageFile   = document.getElementById("lfImageFile").files[0];

  if (!species || !description || !location || !date || !contactName || !contactPhone) {
    showError("lfError", "Please fill in all required fields."); return;
  }

  setLoading("lfSubmitBtn", true, "Post Report");
  try {
    let imageURL = "";
    if (imageFile) {
      const imgRef = ref(storage, `lost_found/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imgRef, imageFile);
      imageURL = await getDownloadURL(imgRef);
    }

    await addDoc(collection(db, "lost_found"), {
      type: postType, species, breed, color, description,
      location, date, contactName, contactPhone, imageURL,
      reportedBy: user.uid,
      createdAt: serverTimestamp()
    });

    toast("Report posted successfully!");
    reportFormEl.reset();
    reportFormEl.hidden = true;
    document.getElementById("lfImagePreview").hidden = true;
    loadPosts();
  } catch (err) {
    showError("lfError", err.message);
  } finally {
    setLoading("lfSubmitBtn", false, "Post Report");
  }
});
