document.addEventListener("DOMContentLoaded", function () {
  auth.onAuthStateChanged(async function (user) {
    if (!user) { window.location.href = "login.html"; return; }
    var snap = await db.collection("users").doc(user.uid).get();
    var role = snap.exists ? snap.data().role : "";
    if (role !== "admin" && role !== "owner") {
      document.body.innerHTML = "<div style='text-align:center;padding:4rem;'><h2>Access Denied</h2><a href='index.html'>Go Home</a></div>";
      return;
    }
    var form = document.getElementById("addPetForm");
    if (form) form.hidden = false;
    var gate = document.getElementById("authGate");
    if (gate) gate.hidden = true;
  });
  var form = document.getElementById("addPetForm");
  if (!form) return;
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var name = document.getElementById("petName").value.trim();
    var species = document.getElementById("petSpecies").value;
    var breed = document.getElementById("petBreed").value.trim();
    var age = document.getElementById("petAge").value.trim();
    var gender = document.getElementById("petGender").value;
    var color = document.getElementById("petColor").value.trim();
    var origin = document.getElementById("petOrigin").value;
    var vaccinated = document.getElementById("petVaccinated").checked;
    var neutered = document.getElementById("petNeutered").checked;
    var healthStatus = document.getElementById("petHealthStatus").value;
    var description = document.getElementById("petDescription").value.trim();
    var imageURLEl = document.getElementById("petImageURL");
    var imageURL = imageURLEl ? imageURLEl.value.trim() : "";
    var errorEl = document.getElementById("addPetError");
    var btn = document.getElementById("addPetBtn");
    if (!name || !species || !origin || !description) {
      if (errorEl) { errorEl.textContent = "Please fill in all required fields."; errorEl.hidden = false; }
      return;
    }
    if (errorEl) errorEl.hidden = true;
    if (btn) { btn.disabled = true; btn.textContent = "Saving..."; }
    try {
      await db.collection("pets").add({
        name: name, species: species, breed: breed, age: age,
        gender: gender, color: color, origin: origin,
        vaccinated: vaccinated, neutered: neutered,
        healthStatus: healthStatus, description: description,
        imageURL: imageURL, status: "available",
        addedBy: auth.currentUser ? auth.currentUser.uid : "",
        addedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      var successEl = document.getElementById("addPetSuccess");
      if (successEl) { successEl.textContent = "Pet listed successfully! ??"; successEl.hidden = false; }
      form.reset();
      setTimeout(function () { window.location.href = "pets.html"; }, 2000);
    } catch (err) {
      if (errorEl) { errorEl.textContent = "Error: " + err.message; errorEl.hidden = false; }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "Add Pet"; }
    }
  });
});
