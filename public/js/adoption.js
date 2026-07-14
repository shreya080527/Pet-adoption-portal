// ============================================================
// adoption.js — adopt.html (Firebase v8 compat syntax)
// ============================================================

var form = document.getElementById('adoptionForm');
if (form) {
  var petId = getParam('id');
  var petName = getParam('name') || 'this pet';

  document.getElementById('adoptPetName').textContent = petName;
  document.getElementById('adoptPetNameCard').textContent = petName;

  // Load pet summary card
  if (petId) {
    (async function () {
      try {
        var snap = await db.collection('pets').doc(petId).get();
        if (snap.exists) {
          var p = snap.data();
          var card = document.getElementById('petSummaryCard');
          document.getElementById('adoptPetImage').src = p.imageURL || '';
          document.getElementById('adoptPetImage').alt = p.name;
          document.getElementById('adoptPetNameCard').textContent = p.name;
          document.getElementById('adoptPetMetaCard').textContent =
            (p.species || '') + (p.breed ? ' · ' + p.breed : '') + ' · ' + (p.age || '?') + ' yrs · ' + (p.gender || '');
          card.hidden = false;
        }
      } catch (err) {
        console.error('Error loading pet:', err);
      }
    })();
  }

  requireAuth().then(function (user) {
    var authGate = document.getElementById('authGate');
    if (authGate) authGate.hidden = true;
    form.hidden = false;
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideError('adoptionError');
    if (!petId) { showError('adoptionError', 'No pet selected.'); return; }

    var user = auth.currentUser;
    var homeType = document.getElementById('homeType').value;
    var experience = document.getElementById('experience').value;
    var preferredAnimal = document.getElementById('preferredAnimal').value.trim();
    var householdMembers = document.getElementById('householdMembers').value.trim();
    var message = document.getElementById('message').value.trim();

    if (!homeType || !experience || !message) {
      showError('adoptionError', 'Please fill in all required fields.');
      return;
    }

    // Prevent duplicate pending requests
    try {
      var existing = await db.collection('adoption_requests')
        .where('petId', '==', petId)
        .where('adopterId', '==', user.uid)
        .where('status', '==', 'pending')
        .get();

      if (!existing.empty) {
        showError('adoptionError', 'You already have a pending request for this pet.');
        return;
      }

      setLoading('adoptionBtn', true, 'Submit Adoption Request');

      // Get user display name
      var userSnap = await db.collection('users').doc(user.uid).get();
      var adopterName = userSnap.exists ? userSnap.data().name : user.email;

      // Get pet name
      var petSnap = await db.collection('pets').doc(petId).get();
      var pName = petSnap.exists ? petSnap.data().name : petName;

      await db.collection('adoption_requests').add({
        petId: petId,
        petName: pName,
        adopterId: user.uid,
        adopterName: adopterName,
        homeType: homeType,
        experience: experience,
        preferredAnimal: preferredAnimal,
        householdMembers: householdMembers,
        message: message,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      toast('Adoption request submitted!');
      showSuccess('adoptionSuccess', 'Your request has been submitted. The shelter will review and contact you.');
      form.reset();
      document.getElementById('adoptionBtn').textContent = 'Submitted ✓';
    } catch (err) {
      showError('adoptionError', err.message);
      setLoading('adoptionBtn', false, 'Submit Adoption Request');
    }
  });
}
