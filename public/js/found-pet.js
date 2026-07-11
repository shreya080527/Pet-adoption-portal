// found-pet.js — Report a found stray (public form, no login required)
// Writes straight into the shared 'pets' collection with status: 'available'
// so it appears in the gallery immediately, same as shelter-added pets.

import { db, storage } from "./firebase-config.js";
import {
  collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const form = document.getElementById("foundPetForm");
const submitBtn = document.getElementById("submitBtn");
const formMessage = document.getElementById("formMessage");
const photoInput = document.getElementById("photoInput");
const imagePreview = document.getElementById("imagePreview");

// ── Live image preview ──
photoInput?.addEventListener("change", () => {
  const file = photoInput.files[0];
  if (!file) {
    imagePreview.style.display = "none";
    return;
  }
  imagePreview.src = URL.createObjectURL(file);
  imagePreview.style.display = "block";
});

function showMessage(text, type) {
  formMessage.className = type === "error" ? "form-error" : "form-success";
  formMessage.textContent = text;
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMessage.textContent = "";
  formMessage.className = "";

  const species = document.getElementById("species").value;
  const foundLocation = document.getElementById("foundLocation").value.trim();
  const photoFile = photoInput.files[0];

  if (!species || !foundLocation || !photoFile) {
    showMessage("Please fill in species, location found, and a photo — those are required.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  try {
    // 1. Upload photo to Storage
    const safeName = `${Date.now()}_${photoFile.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const photoRef = ref(storage, `pet-photos/found-strays/${safeName}`);
    await uploadBytes(photoRef, photoFile);
    const photoURL = await getDownloadURL(photoRef);

    // 2. Build pet document.
    // photoURL and imageURL are both set so this works regardless of which
    // field name your pets.js/pet-detail.js reads from.
    const petData = {
      name: document.getElementById("petName").value.trim() || "Unnamed Stray",
      species,
      breed: document.getElementById("breed").value.trim() || "Unknown",
      ageGroup: document.getElementById("ageGroup").value,
      age: null, // unknown numeric age — ageGroup carries the info instead
      gender: document.getElementById("gender").value,
      size: document.getElementById("size").value,
      color: document.getElementById("color").value.trim(),
      description: document.getElementById("description").value.trim(),
      origin: "found_stray",
      status: "available",
      foundLocation,
      foundDate: document.getElementById("foundDate").value || null,
      reporterName: document.getElementById("reporterName").value.trim() || null,
      reporterContact: document.getElementById("reporterContact").value.trim() || null,
      photoURL,
      imageURL: photoURL,
      addedAt: serverTimestamp()
    };

    await addDoc(collection(db, "pets"), petData);

    showMessage("Thank you! This pet has been registered and is now visible in the gallery.", "success");
    form.reset();
    imagePreview.style.display = "none";
  } catch (err) {
    console.error("Error registering found pet:", err);
    showMessage("Something went wrong submitting this. Please try again.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Register This Pet";
  }
});
