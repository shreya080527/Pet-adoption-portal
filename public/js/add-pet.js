// ============================================================
// add-pet.js — shelter/admin adds a pet (shelter-born / rescued)
// ============================================================

import { db, storage }     from "./firebase-config.js";
import { requireAdmin }    from "./auth.js";
import {
  collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { wireImagePreview, showError, hideError, showSuccess, setLoading, toast } from "./utils.js";

wireImagePreview("petImageFile", "imagePreview");

const form = document.getElementById("addPetForm");
if (form) {
  // Only admins/staff may add shelter pets
  requireAdmin().then(admin => {
    if (!admin) return;
    document.getElementById("authGate")?.setAttribute("hidden", true);
    form.hidden = false;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError("addPetError");

    const name        = document.getElementById("petName").value.trim();
    const species     = document.getElementById("petSpecies").value;
    const breed       = document.getElementById("petBreed").value.trim();
    const age         = parseFloat(document.getElementById("petAge").value);
    const gender      = document.getElementById("petGender").value;
    const color       = document.getElementById("petColor").value.trim();
    const origin      = document.getElementById("petOrigin").value;
    const vaccinated  = document.getElementById("petVaccinated").checked;
    const neutered    = document.getElementById("petNeutered").checked;
    const healthStatus = document.getElementById("petHealthStatus").value;
    const description = document.getElementById("petDescription").value.trim();
    const imageFile   = document.getElementById("petImageFile").files[0];

    if (!name || !species || !origin || !description || !imageFile) {
      showError("addPetError", "Please fill in all required fields and select a photo."); return;
    }

    setLoading("addPetBtn", true, "Add Pet");
    try {
      // Upload image
      const imgRef = ref(storage, `pets/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imgRef, imageFile);
      const imageURL = await getDownloadURL(imgRef);

      // Save to Firestore
      await addDoc(collection(db, "pets"), {
        name, species, breed, age, gender, color, origin,
        vaccinated, neutered, healthStatus, description, imageURL,
        status: "available",
        addedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast("Pet added successfully!");
      form.reset();
      document.getElementById("imagePreview").hidden = true;
      document.getElementById("addPetSuccess").textContent = "Pet listed successfully.";
      document.getElementById("addPetSuccess").hidden = false;
    } catch (err) {
      showError("addPetError", err.message);
    } finally {
      setLoading("addPetBtn", false, "Add Pet");
    }
  });
}
