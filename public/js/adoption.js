// ============================================================
// adoption.js — adopt.html
// ============================================================

import { db }          from "./firebase-config.js";
import { auth, requireAuth } from "./auth.js";
import {
  doc, getDoc, addDoc, collection,
  query, where, getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getParam, showError, hideError, showSuccess, setLoading, toast, formatDate } from "./utils.js";

const form = document.getElementById("adoptionForm");
if (form) {
  const petId   = getParam("id");
  const petName = getParam("name") || "this pet";

  document.getElementById("adoptPetName").textContent     = petName;
  document.getElementById("adoptPetNameCard").textContent = petName;

  // Load pet summary card
  if (petId) {
    (async () => {
      const snap = await getDoc(doc(db, "pets", petId));
      if (snap.exists()) {
        const p = snap.data();
        const card = document.getElementById("petSummaryCard");
        document.getElementById("adoptPetImage").src         = p.imageURL || "";
        document.getElementById("adoptPetImage").alt         = p.name;
        document.getElementById("adoptPetNameCard").textContent = p.name;
        document.getElementById("adoptPetMetaCard").textContent =
          `${p.species}${p.breed ? " · " + p.breed : ""} · ${p.age ?? "?"} yrs · ${p.gender || ""}`;
        card.hidden = false;
      }
    })();
  }

  requireAuth().then(user => {
    document.getElementById("authGate")?.setAttribute("hidden", true);
    form.hidden = false;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError("adoptionError");
    if (!petId) { showError("adoptionError", "No pet selected."); return; }

    const user     = auth.currentUser;
    const homeType = document.getElementById("homeType").value;
    const experience = document.getElementById("experience").value;
    const preferredAnimal = document.getElementById("preferredAnimal").value.trim();
    const householdMembers = document.getElementById("householdMembers").value.trim();
    const message  = document.getElementById("message").value.trim();

    if (!homeType || !experience || !message) {
      showError("adoptionError", "Please fill in all required fields."); return;
    }

    // Prevent duplicate pending requests
    const existing = await getDocs(
      query(collection(db, "adoption_requests"),
        where("petId", "==", petId),
        where("adopterId", "==", user.uid),
        where("status", "==", "pending"))
    );
    if (!existing.empty) {
      showError("adoptionError", "You already have a pending request for this pet."); return;
    }

    setLoading("adoptionBtn", true, "Submit Adoption Request");
    try {
      // Get user display name
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const adopterName = userSnap.exists() ? userSnap.data().name : user.email;

      // Get pet name
      const petSnap = await getDoc(doc(db, "pets", petId));
      const pName   = petSnap.exists() ? petSnap.data().name : petName;

      await addDoc(collection(db, "adoption_requests"), {
        petId, petName: pName,
        adopterId: user.uid, adopterName,
        homeType, experience, preferredAnimal, householdMembers, message,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast("Adoption request submitted!");
      showSuccess("adoptionSuccess", "Your request has been submitted. The shelter will review and contact you.");
      form.reset();
      document.getElementById("adoptionBtn").textContent = "Submitted ✓";
    } catch (err) {
      showError("adoptionError", err.message);
      setLoading("adoptionBtn", false, "Submit Adoption Request");
    }
  });
}
