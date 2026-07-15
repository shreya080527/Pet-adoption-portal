// found-pet.js — Report a found stray (public form, no login required)
// Writes straight into the shared 'pets' collection with status: 'available'
// so it appears in the gallery immediately, same as shelter-added pets.
// Firebase v8 compat syntax

var form = document.getElementById('foundPetForm');
var submitBtn = document.getElementById('submitBtn');
var formMessage = document.getElementById('formMessage');
var photoInput = document.getElementById('photoInput');
var imagePreview = document.getElementById('imagePreview');

// Live image preview
if (photoInput) {
  photoInput.addEventListener('change', function () {
    var file = photoInput.files[0];
    if (!file) {
      imagePreview.style.display = 'none';
      return;
    }
    imagePreview.src = URL.createObjectURL(file);
    imagePreview.style.display = 'block';
  });
}

function showMessage(text, type) {
  formMessage.className = type === 'error' ? 'form-error' : 'form-success';
  formMessage.textContent = text;
}

if (form) {
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    formMessage.textContent = '';
    formMessage.className = '';

    var species = document.getElementById('species').value;
    var foundLocation = document.getElementById('foundLocation').value.trim();
    var photoFile = photoInput.files[0];

    if (!species || !foundLocation || !photoFile) {
      showMessage('Please fill in species, location found, and a photo — those are required.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      // 1. Upload photo to Storage
      var safeName = Date.now() + '_' + photoFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
      var photoRef = storage.ref('pet-photos/found-strays/' + safeName);
      await photoRef.put(photoFile);
      var photoURL = await photoRef.getDownloadURL();

      // 2. Build pet document.
      // photoURL and imageURL are both set so this works regardless of which
      // field name your pets.js/pet-detail.js reads from.
      var petData = {
        name: document.getElementById('petName').value.trim() || 'Unnamed Stray',
        species: species,
        breed: document.getElementById('breed').value.trim() || 'Unknown',
        ageGroup: document.getElementById('ageGroup').value,
        age: null, // unknown numeric age — ageGroup carries the info instead
        gender: document.getElementById('gender').value,
        size: document.getElementById('size').value,
        color: document.getElementById('color').value.trim(),
        description: document.getElementById('description').value.trim(),
        origin: 'found_stray',
        status: 'available',
        foundLocation: foundLocation,
        foundDate: document.getElementById('foundDate').value || null,
        reporterName: document.getElementById('reporterName').value.trim() || null,
        reporterContact: document.getElementById('reporterContact').value.trim() || null,
        photoURL: photoURL,
        imageURL: photoURL,
        addedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      // Track uploader if logged in
      if (auth.currentUser) {
        petData.uploadedBy = auth.currentUser.uid;
      }

      await db.collection('pets').add(petData);

      showMessage('Thank you! This pet has been registered and is now visible in the gallery.', 'success');
      form.reset();
      imagePreview.style.display = 'none';
    } catch (err) {
      console.error('Error registering found pet:', err);
      showMessage('Something went wrong submitting this. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Register This Pet';
    }
  });
}
