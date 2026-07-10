// ============================================================
// dashboard.js — dashboard.html
// ============================================================

import { db }        from "./firebase-config.js";
import { auth, requireAuth } from "./auth.js";
import {
  doc, getDoc, updateDoc,
  collection, getDocs, deleteDoc,
  query, where, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { formatDate, showError, hideError, showSuccess, toast } from "./utils.js";

(async () => {
  const user = await requireAuth();
  const userSnap = await getDoc(doc(db, "users", user.uid));
  const userData = userSnap.exists() ? userSnap.data() : {};

  document.getElementById("welcomeMsg").textContent = `Welcome back, ${userData.name || ""}!`;
  document.getElementById("dashboardContent").hidden = false;

  // ── Pre-fill profile form ───────────────────────────────────
  document.getElementById("profileName").value    = userData.name    || "";
  document.getElementById("profilePhone").value   = userData.phone   || "";
  document.getElementById("profileAddress").value = userData.address || "";

  // ── Adoption requests ───────────────────────────────────────
  const adoptSnap = await getDocs(
    query(collection(db, "adoption_requests"), where("adopterId", "==", user.uid), orderBy("createdAt", "desc"))
  );
  document.getElementById("dashAdoptionCount").textContent = adoptSnap.size;

  const adoptBody = document.getElementById("adoptionTableBody");
  adoptBody.innerHTML = adoptSnap.empty
    ? `<tr><td colspan="4" class="empty-state">No adoption requests yet.</td></tr>`
    : adoptSnap.docs.map(d => {
        const r = d.data();
        const statusClass = { pending: "badge-pending", approved: "badge-available", rejected: "badge-lost" }[r.status] || "";
        return `<tr>
          <td><a href="pet-detail.html?id=${r.petId}">${r.petName}</a></td>
          <td><span class="badge ${statusClass}">${r.status}</span></td>
          <td>${formatDate(r.createdAt)}</td>
          <td>${r.status === "pending"
            ? `<button class="btn btn-sm btn-danger" onclick="cancelAdoption('${d.id}')">Cancel</button>`
            : ""}</td>
        </tr>`;
      }).join("");

  // ── Surrendered pets ────────────────────────────────────────
  const surSnap = await getDocs(
    query(collection(db, "pets"),
      where("surrenderedBy", "==", user.uid),
      where("origin", "==", "owner_given_up"),
      orderBy("addedAt", "desc"))
  );
  document.getElementById("dashSurrenderCount").textContent = surSnap.size;

  const surBody = document.getElementById("surrenderTableBody");
  surBody.innerHTML = surSnap.empty
    ? `<tr><td colspan="4" class="empty-state">No surrendered pets.</td></tr>`
    : surSnap.docs.map(d => {
        const p = d.data();
        const sClass = { available: "badge-available", pending: "badge-pending", adopted: "badge-adopted" }[p.status] || "";
        return `<tr>
          <td>${p.name}</td>
          <td><span class="badge ${sClass}">${p.status}</span></td>
          <td>${formatDate(p.addedAt)}</td>
          <td><a href="pet-detail.html?id=${d.id}" class="btn btn-sm btn-outline">View</a></td>
        </tr>`;
      }).join("");

  // ── Lost & Found posts ──────────────────────────────────────
  const lfSnap = await getDocs(
    query(collection(db, "lost_found"), where("reportedBy", "==", user.uid), orderBy("createdAt", "desc"))
  );
  document.getElementById("dashLfCount").textContent = lfSnap.size;

  const lfBody = document.getElementById("lfTableBody");
  lfBody.innerHTML = lfSnap.empty
    ? `<tr><td colspan="4" class="empty-state">No lost & found posts.</td></tr>`
    : lfSnap.docs.map(d => {
        const p = d.data();
        return `<tr>
          <td>${p.species}${p.breed ? " · " + p.breed : ""}</td>
          <td><span class="badge ${p.type === 'lost' ? 'badge-lost' : 'badge-found'}">${p.type}</span></td>
          <td>${formatDate(p.createdAt)}</td>
          <td><button class="btn btn-sm btn-danger" onclick="deleteLfPost('${d.id}')">Delete</button></td>
        </tr>`;
      }).join("");

  // ── Profile form save ───────────────────────────────────────
  document.getElementById("profileForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError("profileError");
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name:    document.getElementById("profileName").value.trim(),
        phone:   document.getElementById("profilePhone").value.trim(),
        address: document.getElementById("profileAddress").value.trim(),
      });
      showSuccess("profileSuccess", "Profile updated!");
      toast("Profile saved.");
    } catch (err) {
      showError("profileError", err.message);
    }
  });
})();

// ── Global helpers called from table buttons ──────────────────
window.cancelAdoption = async (id) => {
  if (!confirm("Cancel this adoption request?")) return;
  await deleteDoc(doc(db, "adoption_requests", id));
  toast("Request cancelled."); location.reload();
};

window.deleteLfPost = async (id) => {
  if (!confirm("Delete this lost & found post?")) return;
  await deleteDoc(doc(db, "lost_found", id));
  toast("Post deleted."); location.reload();
};
