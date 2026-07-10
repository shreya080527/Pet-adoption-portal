// ============================================================
// surrender-pet.js — owner surrenders a pet (goes to review queue)
// ============================================================

import { db, storage }  from "./firebase-config.js";
import { requireAuth }  from "./auth.js";
import { auth }         from "./auth.js";
import {
  collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { wireImagePreview, showError, hideError, showSuccess, setLoading, toast } from "./utils.js";

wireImagePreview("petImageFile", "imagePreview");

const form = document.getElementById("surrenderForm");
if (form) {
  requireAuth().then(user => {
    document.getElementById("authGate")?.setAttribute("hidden", true);
    form.hidden = false;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError("surrenderError");

    const user        = auth.currentUser;
    const name        = document.getElementById("petName").value.trim();
    const species     = document.getElementById("petSpecies").value;
    const breed       = document.getElementById("petBreed").value.trim();
    const age         = parseFloat(document.getElementById("petAge").value);
    const gender      = document.getElementById("petGender").value;
    const color       = document.getElementById("petColor").value.trim();
    const vaccinated  = document.getElementById("petVaccinated").checked;
    const neutered    = document.getElementById("petNeutered").checked;
    const reason      = document.getElementById("reasonGivenUp").value.trim();
    const description = document.getElementById("petDescription").value.trim();
    const imageFile   = document.getElementById("petImageFile").files[0];

    if (!name || !species || !reason || !description || !imageFile) {
      showError("surrenderError", "Please fill in all required fields and select a photo."); return;
    }

    setLoading("surrenderBtn", true, "Submit for Review");
    try {
      const imgRef = ref(storage, `surrenders/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imgRef, imageFile);
      const imageURL = await getDownloadURL(imgRef);

      await addDoc(collection(db, "pets"), {
        name, species, breed, age, gender, color,
        vaccinated, neutered, description, imageURL,
        origin:       "owner_given_up",
        status:       "pending",           // admin must approve before listing
        reasonGivenUp: reason,
        surrenderedBy: user.uid,
        addedAt:      serverTimestamp(),
        updatedAt:    serverTimestamp()
      });

      toast("Submission received! We'll review it shortly.");
      form.reset();
      document.getElementById("imagePreview").hidden = true;
      showSuccess("surrenderSuccess", "Your pet has been submitted for review. Our team will contact you soon.");
    } catch (err) {
      showError("surrenderError", err.message);
    } finally {
      setLoading("surrenderBtn", false, "Submit for Review");
    }
  });
}
