// ============================================================
// admin.js — admin.html  (admin-only)
// ============================================================

import { db, storage }    from "./firebase-config.js";
import { requireAdmin }   from "./auth.js";
import { auth }           from "./auth.js";
import {
  collection, getDocs, getDoc, addDoc,
  updateDoc, deleteDoc, doc,
  query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { formatDate, toast, showError, hideError } from "./utils.js";

// ── Auth guard ────────────────────────────────────────────────
requireAdmin().then(admin => {
  if (!admin) return;
  document.getElementById("adminContent").hidden = false;
  loadAll();
});

// ── Tab switching ─────────────────────────────────────────────
document.querySelectorAll("#adminTabs .tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#adminTabs .tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".admin-panel").forEach(p => p.hidden = true);
    btn.classList.add("active");
    document.getElementById(`panel-${btn.dataset.panel}`).hidden = false;
  });
});

// ── Load all data ─────────────────────────────────────────────
async function loadAll() {
  await Promise.all([loadPets(), loadAdoptions(), loadSurrenders(), loadLF(), loadResources(), loadUsers()]);
}

// ════════════════════════════════════════════════════════════
// PETS
// ════════════════════════════════════════════════════════════
async function loadPets() {
  const snap = await getDocs(query(collection(db, "pets"), orderBy("addedAt", "desc")));
  const tbody = document.getElementById("adminPetsBody");

  document.getElementById("adminTotalPets").textContent = snap.size;

  // Search filter
  let allRows = snap.docs;
  const render = (rows) => {
    tbody.innerHTML = rows.length
      ? rows.map(d => {
          const p = d.data();
          const sClass = { available:"badge-available", pending:"badge-pending", adopted:"badge-adopted" }[p.status] || "";
          return `<tr>
            <td><img class="thumb" src="${p.imageURL || ''}" alt="${p.name}" onerror="this.style.display='none'" /></td>
            <td>${p.name}</td>
            <td>${p.species}</td>
            <td>${p.origin?.replace(/_/g," ") || "—"}</td>
            <td><span class="badge ${sClass}">${p.status}</span></td>
            <td>
              <select class="btn btn-sm" onchange="updatePetStatus('${d.id}', this.value)">
                <option value="">Change status</option>
                <option value="available">Available</option>
                <option value="pending">Pending</option>
                <option value="adopted">Adopted</option>
              </select>
              <button class="btn btn-sm btn-danger" onclick="deletePet('${d.id}')">Delete</button>
            </td>
          </tr>`;
        }).join("")
      : `<tr><td colspan="6" class="empty-state">No pets.</td></tr>`;
  };

  render(allRows);
  document.getElementById("adminPetSearch")?.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    render(allRows.filter(d => d.data().name.toLowerCase().includes(q)));
  });
}

window.updatePetStatus = async (id, status) => {
  if (!status) return;
  await updateDoc(doc(db, "pets", id), { status, updatedAt: serverTimestamp() });
  toast(`Status updated to "${status}".`);
  loadPets();
};
window.deletePet = async (id) => {
  if (!confirm("Delete this pet record?")) return;
  await deleteDoc(doc(db, "pets", id));
  toast("Pet deleted."); loadPets();
};

// ════════════════════════════════════════════════════════════
// ADOPTION REQUESTS
// ════════════════════════════════════════════════════════════
async function loadAdoptions() {
  const snap = await getDocs(query(collection(db, "adoption_requests"), orderBy("createdAt", "desc")));
  const tbody = document.getElementById("adminAdoptionsBody");
  const pending = snap.docs.filter(d => d.data().status === "pending").length;
  document.getElementById("adminPendingAdoptions").textContent = pending;

  tbody.innerHTML = snap.empty
    ? `<tr><td colspan="6" class="empty-state">No requests.</td></tr>`
    : snap.docs.map(d => {
        const r = d.data();
        const sClass = { pending:"badge-pending", approved:"badge-available", rejected:"badge-lost" }[r.status] || "";
        return `<tr>
          <td><a href="pet-detail.html?id=${r.petId}">${r.petName}</a></td>
          <td>${r.adopterName}</td>
          <td>${r.homeType}</td>
          <td>${r.experience}</td>
          <td><span class="badge ${sClass}">${r.status}</span></td>
          <td>
            ${r.status === "pending" ? `
              <button class="btn btn-sm btn-secondary" onclick="updateAdoption('${d.id}','approved')">Approve</button>
              <button class="btn btn-sm btn-danger"    onclick="updateAdoption('${d.id}','rejected')">Reject</button>` : ""}
          </td>
        </tr>`;
      }).join("");
}

window.updateAdoption = async (id, status) => {
  await updateDoc(doc(db, "adoption_requests", id), { status, updatedAt: serverTimestamp() });
  // If approved, mark the pet as adopted
  if (status === "approved") {
    const snap = await getDoc(doc(db, "adoption_requests", id));
    if (snap.exists()) {
      await updateDoc(doc(db, "pets", snap.data().petId), { status: "adopted", updatedAt: serverTimestamp() });
    }
  }
  toast(`Request ${status}.`); loadAdoptions(); loadPets();
};

// ════════════════════════════════════════════════════════════
// SURRENDERS (pets with origin=owner_given_up, status=pending)
// ════════════════════════════════════════════════════════════
async function loadSurrenders() {
  const snap = await getDocs(query(collection(db, "pets"), orderBy("addedAt", "desc")));
  const surrenders = snap.docs.filter(d => d.data().origin === "owner_given_up");
  const pending = surrenders.filter(d => d.data().status === "pending").length;
  document.getElementById("adminPendingSurrenders").textContent = pending;

  const tbody = document.getElementById("adminSurrendersBody");
  tbody.innerHTML = surrenders.length
    ? surrenders.map(d => {
        const p = d.data();
        const sClass = { available:"badge-available", pending:"badge-pending", adopted:"badge-adopted" }[p.status] || "";
        return `<tr>
          <td><img class="thumb" src="${p.imageURL||''}" alt="${p.name}" onerror="this.style.display='none'"/></td>
          <td>${p.name} — ${p.species}</td>
          <td>${p.surrenderedBy || "—"}</td>
          <td>${p.reasonGivenUp || "—"}</td>
          <td><span class="badge ${sClass}">${p.status}</span></td>
          <td>
            ${p.status === "pending" ? `
              <button class="btn btn-sm btn-secondary" onclick="approveSurrender('${d.id}')">List Pet</button>
              <button class="btn btn-sm btn-danger"    onclick="deletePet('${d.id}')">Reject</button>` : ""}
          </td>
        </tr>`;
      }).join("")
    : `<tr><td colspan="6" class="empty-state">No surrenders.</td></tr>`;
}

window.approveSurrender = async (id) => {
  await updateDoc(doc(db, "pets", id), { status: "available", updatedAt: serverTimestamp() });
  toast("Pet listed as available!"); loadSurrenders(); loadPets();
};

// ════════════════════════════════════════════════════════════
// LOST & FOUND
// ════════════════════════════════════════════════════════════
async function loadLF() {
  const snap = await getDocs(query(collection(db, "lost_found"), orderBy("createdAt", "desc")));
  const tbody = document.getElementById("adminLfBody");
  tbody.innerHTML = snap.empty
    ? `<tr><td colspan="6" class="empty-state">No posts.</td></tr>`
    : snap.docs.map(d => {
        const p = d.data();
        return `<tr>
          <td><img class="thumb" src="${p.imageURL||''}" alt="" onerror="this.style.display='none'"/></td>
          <td><span class="badge ${p.type==='lost'?'badge-lost':'badge-found'}">${p.type}</span></td>
          <td>${p.species}</td>
          <td>${p.location}</td>
          <td>${p.contactName}</td>
          <td><button class="btn btn-sm btn-danger" onclick="deleteLF('${d.id}')">Delete</button></td>
        </tr>`;
      }).join("");
}
window.deleteLF = async (id) => {
  if (!confirm("Delete this post?")) return;
  await deleteDoc(doc(db, "lost_found", id));
  toast("Post deleted."); loadLF();
};

// ════════════════════════════════════════════════════════════
// RESOURCES / ARTICLES
// ════════════════════════════════════════════════════════════
async function loadResources() {
  const snap = await getDocs(query(collection(db, "resources"), orderBy("createdAt", "desc")));
  const tbody = document.getElementById("adminResourcesBody");
  tbody.innerHTML = snap.empty
    ? `<tr><td colspan="5" class="empty-state">No articles.</td></tr>`
    : snap.docs.map(d => {
        const r = d.data();
        return `<tr>
          <td>${r.title}</td>
          <td>${r.category}</td>
          <td>${r.author || "—"}</td>
          <td>${formatDate(r.createdAt)}</td>
          <td><button class="btn btn-sm btn-danger" onclick="deleteResource('${d.id}')">Delete</button></td>
        </tr>`;
      }).join("");
}
window.deleteResource = async (id) => {
  if (!confirm("Delete this article?")) return;
  await deleteDoc(doc(db, "resources", id));
  toast("Article deleted."); loadResources();
};

// Add resource form toggle
document.getElementById("toggleAddResourceForm")?.addEventListener("click", () => {
  const form = document.getElementById("addResourceForm");
  form.hidden = !form.hidden;
});
document.getElementById("cancelAddResource")?.addEventListener("click", () => {
  document.getElementById("addResourceForm").hidden = true;
});

document.getElementById("addResourceForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError("resError");
  const user     = auth.currentUser;
  const title    = document.getElementById("resTitle").value.trim();
  const category = document.getElementById("resCategory").value;
  const content  = document.getElementById("resContent").value.trim();
  const imageFile= document.getElementById("resImageFile").files[0];
  if (!title || !content) { showError("resError", "Title and content required."); return; }

  try {
    let imageURL = "";
    if (imageFile) {
      const imgRef = ref(storage, `resources/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imgRef, imageFile);
      imageURL = await getDownloadURL(imgRef);
    }
    const userSnap = await getDoc(doc(db, "users", user.uid));
    const author   = userSnap.exists() ? userSnap.data().name : "Admin";
    await addDoc(collection(db, "resources"), {
      title, category, content, imageURL, author,
      createdAt: serverTimestamp()
    });
    toast("Article published!");
    document.getElementById("addResourceForm").reset();
    document.getElementById("addResourceForm").hidden = true;
    loadResources();
  } catch (err) { showError("resError", err.message); }
});

// ════════════════════════════════════════════════════════════
// USERS
// ════════════════════════════════════════════════════════════
async function loadUsers() {
  const snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
  document.getElementById("adminUsers").textContent = snap.size;
  const tbody = document.getElementById("adminUsersBody");
  tbody.innerHTML = snap.empty
    ? `<tr><td colspan="4" class="empty-state">No users.</td></tr>`
    : snap.docs.map(d => {
        const u = d.data();
        return `<tr>
          <td>${u.name || "—"}</td>
          <td>${u.email || "—"}</td>
          <td><span class="badge ${u.role==='admin'?'badge-available':'badge-pending'}">${u.role}</span></td>
          <td>${formatDate(u.createdAt)}</td>
        </tr>`;
      }).join("");
}
