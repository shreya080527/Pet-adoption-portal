// ============================================================
// pet-health.js — pet-health.html (Firebase v8 compat syntax)
// Admins can add records; everyone can read them.
// ============================================================

// Get URL parameters
var params = new URLSearchParams(window.location.search);
var petId = params.get('id');
var petName = 'Pet';

console.log('Page loaded. URL:', window.location.href);
console.log('Pet ID from URL:', petId);

if (!petId) {
  console.error('No pet ID found in URL!');
  document.getElementById('healthTimeline').innerHTML = '<p class="empty-state" style="color:red;">Error: No pet ID provided. Please access this page from a pet detail page.</p>';
} else {
  console.log('Pet ID is valid, proceeding to load records');
}

// Fetch pet name from database
async function loadPetName() {
  if (!petId) return;
  try {
    var snap = await db.collection('pets').doc(petId).get();
    if (snap.exists) {
      petName = snap.data().name || 'Pet';
      var heading = document.getElementById('healthPetName');
      if (heading) heading.textContent = petName;
      console.log('Pet name loaded:', petName);
    } else {
      console.error('Pet not found in database with ID:', petId);
    }
  } catch (err) {
    console.error('Error loading pet name:', err);
  }
}

// Set page heading
var heading = document.getElementById('healthPetName');
if (heading) heading.textContent = petName;

// Back link
var backLink = document.getElementById('backToPet');
if (backLink && petId) backLink.href = 'pet-detail.html?id=' + petId;

// Load records
var timeline = document.getElementById('healthTimeline');

// Load pet name and records
loadPetName();

async function loadRecords() {
  if (!timeline || !petId) {
    console.log('Missing timeline or petId:', { timeline: !!timeline, petId: petId });
    return;
  }
  try {
    console.log('Loading health records for petId:', petId);
    var snap = await db.collection('pet_health_records')
      .where('petId', '==', petId)
      .orderBy('date', 'desc')
      .get();

    console.log('Health records query result:', snap.size, 'records found');

    if (snap.empty) {
      timeline.innerHTML = '<p class="empty-state">No health records yet.</p>';
      return;
    }

    timeline.innerHTML = snap.docs.map(function (d) {
      var r = d.data();
      console.log('Record data:', r);
      return '<div class="timeline-item">' +
        '<div>' +
        '<div class="timeline-date">' + (r.date || '—') + '</div>' +
        '</div>' +
        '<div>' +
        '<span class="timeline-type">' + r.type + '</span>' +
        '<p><strong>' + r.description + '</strong></p>' +
        (r.vetName ? '<p>Vet: ' + r.vetName + '</p>' : '') +
        (r.nextDueDate ? '<p>Next due: ' + r.nextDueDate + '</p>' : '') +
        '</div>' +
        '</div>';
    }).join('');
    console.log('Timeline HTML updated');
  } catch (err) {
    console.error('Error loading health records:', err);
    timeline.innerHTML = '<p class="empty-state">Error loading health records: ' + err.message + '</p>';
  }
}
loadRecords();

// Admin-only: show add-record form
auth.onAuthStateChanged(async function (user) {
  if (!user) return;
  try {
    var snap = await db.collection('users').doc(user.uid).get();
    if (snap.exists && snap.data().role === 'admin') {
      var addRecordBar = document.getElementById('addRecordBar');
      if (addRecordBar) addRecordBar.hidden = false;
    }
  } catch (err) {
    console.error('Error checking admin status:', err);
  }
});

// Toggle add form
var toggleAddRecordForm = document.getElementById('toggleAddRecordForm');
if (toggleAddRecordForm) {
  toggleAddRecordForm.addEventListener('click', function () {
    var form = document.getElementById('addRecordForm');
    form.hidden = !form.hidden;
  });
}

var cancelAddRecord = document.getElementById('cancelAddRecord');
if (cancelAddRecord) {
  cancelAddRecord.addEventListener('click', function () {
    document.getElementById('addRecordForm').hidden = true;
  });
}

// Submit record
var addRecordForm = document.getElementById('addRecordForm');
if (addRecordForm) {
  addRecordForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideError('recordError');

    var type = document.getElementById('recordType').value;
    var date = document.getElementById('recordDate').value;
    var description = document.getElementById('recordDescription').value.trim();
    var vetName = document.getElementById('recordVet').value.trim();
    var nextDueDate = document.getElementById('recordNextDue').value;

    if (!date || !description) {
      showError('recordError', 'Date and description are required.');
      return;
    }

    var submitBtn = addRecordForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
    }

    try {
      console.log('Saving health record:', { petId, type, date, description, vetName, nextDueDate });
      var docRef = await db.collection('pet_health_records').add({
        petId: petId,
        type: type,
        date: date,
        description: description,
        vetName: vetName,
        nextDueDate: nextDueDate,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('Health record saved with ID:', docRef.id);
      toast('Health record added!');
      addRecordForm.reset();
      addRecordForm.hidden = true;
      console.log('Reloading health records...');
      await loadRecords();
    } catch (err) {
      console.error('Error saving health record:', err);
      showError('recordError', err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Record';
      }
    }
  });
}
