// ============================================================
// pet-health.js — pet-health.html
// Admins can add records; everyone can read them.
// ============================================================

import { db }    from "./firebase-config.js";
import { auth }  from "./auth.js";
import {
  collection, addDoc, getDocs,
  query, where, orderBy, serverTimestamp, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getParam, formatDate, showError, hideError, setLoading, toast } from "./utils.js";

const petId   = getParam("id");
const petName = getParam("name") || "Pet";

// Set page heading
const heading = document.getElementById("healthPetName");
if (heading) heading.textContent = decodeURIComponent(petName);

// Back link
const backLink = document.getElementById("backToPet");
if (backLink && petId) backLink.href = `pet-detail.html?id=${petId}`;

// ── Load records ──────────────────────────────────────────────
const timeline = document.getElementById("healthTimeline");

async function loadRecords() {
  if (!timeline || !petId) return;
  const snap = await getDocs(
    query(collection(db, "pet_health_records"),
      where("petId", "==", petId),
      orderBy("date", "desc"))
  );
  if (snap.empty) {
    timeline.innerHTML = `<p class="empty-state">No health records yet.</p>`;
    return;
  }
  timeline.innerHTML = snap.docs.map(d => {
    const r = d.data();
    return `
      <div class="timeline-item">
        <div>
          <div class="timeline-date">${r.date || "—"}</div>
        </div>
        <div>
          <span class="timeline-type">${r.type}</span>
          <p><strong>${r.description}</strong></p>
          ${r.vetName    ? `<p>Vet: ${r.vetName}</p>` : ""}
          ${r.nextDueDate ? `<p>Next due: ${r.nextDueDate}</p>` : ""}
        </div>
      </div>`;
  }).join("");
}
loadRecords();

// ── Admin-only: show add-record form ──────────────────────────
onAuthStateChanged(auth, async user => {
  if (!user) return;
  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists() && snap.data().role === "admin") {
    document.getElementById("addRecordBar").hidden = false;
  }
});

// Toggle add form
document.getElementById("toggleAddRecordForm")?.addEventListener("click", () => {
  const form = document.getElementById("addRecordForm");
  form.hidden = !form.hidden;
});
document.getElementById("cancelAddRecord")?.addEventListener("click", () => {
  document.getElementById("addRecordForm").hidden = true;
});

// Submit record
document.getElementById("addRecordForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError("recordError");

  const type        = document.getElementById("recordType").value;
  const date        = document.getElementById("recordDate").value;
  const description = document.getElementById("recordDescription").value.trim();
  const vetName     = document.getElementById("recordVet").value.trim();
  const nextDueDate = document.getElementById("recordNextDue").value;

  if (!date || !description) {
    showError("recordError", "Date and description are required."); return;
  }

  setLoading("addRecordForm", true);
  try {
    await addDoc(collection(db, "pet_health_records"), {
      petId, type, date, description, vetName, nextDueDate,
      createdAt: serverTimestamp()
    });
    toast("Health record added!");
    document.getElementById("addRecordForm").reset();
    document.getElementById("addRecordForm").hidden = true;
    loadRecords();
  } catch (err) {
    showError("recordError", err.message);
  }
});
