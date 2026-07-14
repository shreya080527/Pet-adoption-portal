var activeType = '';
var lfGrid = document.getElementById('lfGrid');

async function loadPosts() {
  if (!lfGrid) return;
  lfGrid.innerHTML = '<p class="empty-state">Loading…</p>';

  var q = activeType
    ? db.collection('lost_found').where('type', '==', activeType).orderBy('createdAt', 'desc')
    : db.collection('lost_found').orderBy('createdAt', 'desc');

  var snap = await q.get();
  if (snap.empty) { lfGrid.innerHTML = '<p class="empty-state">No posts yet.</p>'; return; }

  lfGrid.innerHTML = snap.docs.map(function (d) {
    var p = d.data();
    var typeClass = p.type === 'lost' ? 'badge-lost' : 'badge-found';
    return '<div class="lf-card">' +
      '<img src="' + (p.imageURL || 'https://placehold.co/400x200?text=No+Photo') + '" alt="' + p.species + '" />' +
      '<div class="lf-card-body">' +
        '<span class="badge ' + typeClass + '">' + p.type.toUpperCase() + '</span>' +
        '<h4>' + p.species + (p.breed ? ' · ' + p.breed : '') + '</h4>' +
        '<p>' + (p.color ? 'Color: ' + p.color : '') + '</p>' +
        '<p>' + p.description + '</p>' +
        '<p>📍 ' + p.location + ' — ' + p.date + '</p>' +
        '<p class="lf-card-contact">Contact: ' + p.contactName + ' · ' + p.contactPhone + '</p>' +
      '</div>' +
    '</div>';
  }).join('');
}
loadPosts();

document.querySelectorAll('#lfTabs .tab-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('#lfTabs .tab-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    activeType = btn.dataset.type;
    loadPosts();
  });
});

var reportFormEl = document.getElementById('lostFoundForm');

var openReportFormBtn = document.getElementById('openReportFormBtn');
if (openReportFormBtn) {
  openReportFormBtn.addEventListener('click', function () {
    auth.onAuthStateChanged(function (user) {
      if (!user) { document.getElementById('authGate').hidden = false; return; }
      reportFormEl.hidden = !reportFormEl.hidden;
    });
  });
}
var cancelLfFormBtn = document.getElementById('cancelLfForm');
if (cancelLfFormBtn) {
  cancelLfFormBtn.addEventListener('click', function () { reportFormEl.hidden = true; });
}

if (reportFormEl) {
  reportFormEl.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideError('lfError');

    var user         = auth.currentUser;
    var postType     = document.getElementById('postType').value;
    var species      = document.getElementById('lfSpecies').value;
    var breed        = document.getElementById('lfBreed').value.trim();
    var color        = document.getElementById('lfColor').value.trim();
    var description  = document.getElementById('lfDescription').value.trim();
    var location     = document.getElementById('lfLocation').value.trim();
    var date         = document.getElementById('lfDate').value;
    var contactName  = document.getElementById('lfContactName').value.trim();
    var contactPhone = document.getElementById('lfContactPhone').value.trim();
    var imageURLEl   = document.getElementById('lfImageURL');
    var imageURL     = imageURLEl ? imageURLEl.value.trim() : '';

    if (!species || !description || !location || !date || !contactName || !contactPhone) {
      showError('lfError', 'Please fill in all required fields.'); return;
    }

    setLoading('lfSubmitBtn', true, 'Post Report');
    try {
      await db.collection('lost_found').add({
        type: postType, species: species, breed: breed, color: color, description: description,
        location: location, date: date, contactName: contactName, contactPhone: contactPhone, imageURL: imageURL,
        reportedBy: user.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      toast('Report posted successfully!');
      reportFormEl.reset();
      reportFormEl.hidden = true;
      loadPosts();
    } catch (err) {
      showError('lfError', err.message);
    } finally {
      setLoading('lfSubmitBtn', false, 'Post Report');
    }
  });
}