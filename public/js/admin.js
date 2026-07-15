requireAdmin().then(function (admin) {
  if (!admin) return;
  document.getElementById('adminContent').hidden = false;
  loadAll();
});

document.querySelectorAll('#adminTabs .tab-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('#adminTabs .tab-btn').forEach(function (b) { b.classList.remove('active'); });
    document.querySelectorAll('.admin-panel').forEach(function (p) { p.hidden = true; });
    btn.classList.add('active');
    document.getElementById('panel-' + btn.dataset.panel).hidden = false;
  });
});

async function loadAll() {
  await Promise.all([loadPets(), loadAdoptions(), loadSurrenders(), loadLF(), loadResources(), loadUsers()]);
}

async function loadPets() {
  var snap = await db.collection('pets').orderBy('addedAt', 'desc').get();
  var tbody = document.getElementById('adminPetsBody');
  document.getElementById('adminTotalPets').textContent = snap.size;

  var allRows = snap.docs;
  function render(rows) {
    tbody.innerHTML = rows.length
      ? rows.map(function (d) {
          var p = d.data();
          var sClass = { available: 'badge-available', pending: 'badge-pending', adopted: 'badge-adopted' }[p.status] || '';
          return '<tr>' +
            '<td><img class="thumb" src="' + (p.imageURL || '') + '" alt="' + p.name + '" onerror="this.style.display=\'none\'" /></td>' +
            '<td>' + p.name + '</td>' +
            '<td>' + p.species + '</td>' +
            '<td>' + (p.origin ? p.origin.replace(/_/g, ' ') : '—') + '</td>' +
            '<td><span class="badge ' + sClass + '">' + p.status + '</span></td>' +
            '<td>' +
              '<select class="btn btn-sm" onchange="updatePetStatus(\'' + d.id + '\', this.value)">' +
                '<option value="">Change status</option>' +
                '<option value="available">Available</option>' +
                '<option value="pending">Pending</option>' +
                '<option value="adopted">Adopted</option>' +
              '</select>' +
              '<button class="btn btn-sm btn-danger" onclick="deletePet(\'' + d.id + '\')">Delete</button>' +
            '</td>' +
          '</tr>';
        }).join('')
      : '<tr><td colspan="6" class="empty-state">No pets.</td></tr>';
  }

  render(allRows);
  var searchEl = document.getElementById('adminPetSearch');
  if (searchEl) {
    searchEl.addEventListener('input', function (e) {
      var q = e.target.value.toLowerCase();
      render(allRows.filter(function (d) { return d.data().name.toLowerCase().indexOf(q) !== -1; }));
    });
  }
}

window.updatePetStatus = async function (id, status) {
  if (!status) return;

  try {
    // Check if current user is the uploader or an admin
    var petSnap = await db.collection('pets').doc(id).get();
    if (!petSnap.exists) {
      toast('Pet not found.');
      return;
    }

    var pet = petSnap.data();
    var currentUser = auth.currentUser;
    var userSnap = await db.collection('users').doc(currentUser.uid).get();
    var userData = userSnap.exists ? userSnap.data() : {};

    // Allow if user is admin or the uploader
    if (userData.role !== 'admin' && pet.uploadedBy !== currentUser.uid) {
      toast('Only the uploader or an admin can change pet status.');
      return;
    }

    await db.collection('pets').doc(id).update({ status: status, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    toast('Status updated to "' + status + '".');
    loadPets();
  } catch (err) {
    console.error('Error updating status:', err);
    toast('Error updating status.');
  }
};

window.deletePet = async function (id) {
  if (!confirm('Delete this pet record?')) return;
  await db.collection('pets').doc(id).delete();
  toast('Pet deleted.'); loadPets();
};

async function loadAdoptions() {
  var snap = await db.collection('adoption_requests').orderBy('createdAt', 'desc').get();
  var tbody = document.getElementById('adminAdoptionsBody');
  var pending = snap.docs.filter(function (d) { return d.data().status === 'pending'; }).length;
  document.getElementById('adminPendingAdoptions').textContent = pending;

  tbody.innerHTML = snap.empty
    ? '<tr><td colspan="6" class="empty-state">No requests.</td></tr>'
    : snap.docs.map(function (d) {
        var r = d.data();
        var sClass = { pending: 'badge-pending', approved: 'badge-available', rejected: 'badge-lost' }[r.status] || '';
        return '<tr>' +
          '<td><a href="pet-detail.html?id=' + r.petId + '">' + r.petName + '</a></td>' +
          '<td>' + r.adopterName + '</td>' +
          '<td>' + r.homeType + '</td>' +
          '<td>' + r.experience + '</td>' +
          '<td><span class="badge ' + sClass + '">' + r.status + '</span></td>' +
          '<td>' + (r.status === 'pending'
            ? '<button class="btn btn-sm btn-secondary" onclick="updateAdoption(\'' + d.id + '\',\'approved\')">Approve</button>' +
              '<button class="btn btn-sm btn-danger" onclick="updateAdoption(\'' + d.id + '\',\'rejected\')">Reject</button>'
            : '') +
          '</td>' +
        '</tr>';
      }).join('');
}

window.updateAdoption = async function (id, status) {
  await db.collection('adoption_requests').doc(id).update({ status: status, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  if (status === 'approved') {
    var snap = await db.collection('adoption_requests').doc(id).get();
    if (snap.exists) {
      await db.collection('pets').doc(snap.data().petId).update({ status: 'adopted', updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    }
  }
  toast('Request ' + status + '.'); loadAdoptions(); loadPets();
};

async function loadSurrenders() {
  var snap = await db.collection('pets').orderBy('addedAt', 'desc').get();
  var surrenders = snap.docs.filter(function (d) { return d.data().origin === 'owner_given_up'; });
  var pending = surrenders.filter(function (d) { return d.data().status === 'pending'; }).length;
  document.getElementById('adminPendingSurrenders').textContent = pending;

  var tbody = document.getElementById('adminSurrendersBody');
  tbody.innerHTML = surrenders.length
    ? surrenders.map(function (d) {
        var p = d.data();
        var sClass = { available: 'badge-available', pending: 'badge-pending', adopted: 'badge-adopted' }[p.status] || '';
        return '<tr>' +
          '<td><img class="thumb" src="' + (p.imageURL || '') + '" alt="' + p.name + '" onerror="this.style.display=\'none\'"/></td>' +
          '<td>' + p.name + ' — ' + p.species + '</td>' +
          '<td>' + (p.surrenderedBy || '—') + '</td>' +
          '<td>' + (p.reasonGivenUp || '—') + '</td>' +
          '<td><span class="badge ' + sClass + '">' + p.status + '</span></td>' +
          '<td>' + (p.status === 'pending'
            ? '<button class="btn btn-sm btn-secondary" onclick="approveSurrender(\'' + d.id + '\')">List Pet</button>' +
              '<button class="btn btn-sm btn-danger" onclick="deletePet(\'' + d.id + '\')">Reject</button>'
            : '') +
          '</td>' +
        '</tr>';
      }).join('')
    : '<tr><td colspan="6" class="empty-state">No surrenders.</td></tr>';
}

window.approveSurrender = async function (id) {
  await db.collection('pets').doc(id).update({ status: 'available', updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  toast('Pet listed as available!'); loadSurrenders(); loadPets();
};

async function loadLF() {
  var snap = await db.collection('lost_found').orderBy('createdAt', 'desc').get();
  var tbody = document.getElementById('adminLfBody');
  tbody.innerHTML = snap.empty
    ? '<tr><td colspan="6" class="empty-state">No posts.</td></tr>'
    : snap.docs.map(function (d) {
        var p = d.data();
        return '<tr>' +
          '<td><img class="thumb" src="' + (p.imageURL || '') + '" alt="" onerror="this.style.display=\'none\'"/></td>' +
          '<td><span class="badge ' + (p.type === 'lost' ? 'badge-lost' : 'badge-found') + '">' + p.type + '</span></td>' +
          '<td>' + p.species + '</td>' +
          '<td>' + p.location + '</td>' +
          '<td>' + p.contactName + '</td>' +
          '<td><button class="btn btn-sm btn-danger" onclick="deleteLF(\'' + d.id + '\')">Delete</button></td>' +
        '</tr>';
      }).join('');
}
window.deleteLF = async function (id) {
  if (!confirm('Delete this post?')) return;
  await db.collection('lost_found').doc(id).delete();
  toast('Post deleted.'); loadLF();
};

async function loadResources() {
  var snap = await db.collection('resources').orderBy('createdAt', 'desc').get();
  var tbody = document.getElementById('adminResourcesBody');
  tbody.innerHTML = snap.empty
    ? '<tr><td colspan="5" class="empty-state">No articles.</td></tr>'
    : snap.docs.map(function (d) {
        var r = d.data();
        return '<tr>' +
          '<td>' + r.title + '</td>' +
          '<td>' + r.category + '</td>' +
          '<td>' + (r.author || '—') + '</td>' +
          '<td>' + formatDate(r.createdAt) + '</td>' +
          '<td><button class="btn btn-sm btn-danger" onclick="deleteResource(\'' + d.id + '\')">Delete</button></td>' +
        '</tr>';
      }).join('');
}
window.deleteResource = async function (id) {
  if (!confirm('Delete this article?')) return;
  await db.collection('resources').doc(id).delete();
  toast('Article deleted.'); loadResources();
};

var toggleAddResourceBtn = document.getElementById('toggleAddResourceForm');
if (toggleAddResourceBtn) {
  toggleAddResourceBtn.addEventListener('click', function () {
    var form = document.getElementById('addResourceForm');
    form.hidden = !form.hidden;
  });
}
var cancelAddResourceBtn = document.getElementById('cancelAddResource');
if (cancelAddResourceBtn) {
  cancelAddResourceBtn.addEventListener('click', function () {
    document.getElementById('addResourceForm').hidden = true;
  });
}

var addResourceForm = document.getElementById('addResourceForm');
if (addResourceForm) {
  addResourceForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideError('resError');
    var user = auth.currentUser;
    var title = document.getElementById('resTitle').value.trim();
    var category = document.getElementById('resCategory').value;
    var content = document.getElementById('resContent').value.trim();
    var imageURLEl = document.getElementById('resImageURL');
    var imageURL = imageURLEl ? imageURLEl.value.trim() : '';
    if (!title || !content) { showError('resError', 'Title and content required.'); return; }

    try {
      var userSnap = await db.collection('users').doc(user.uid).get();
      var author = userSnap.exists ? userSnap.data().name : 'Admin';
      await db.collection('resources').add({
        title: title, category: category, content: content, imageURL: imageURL, author: author,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      toast('Article published!');
      addResourceForm.reset();
      addResourceForm.hidden = true;
      loadResources();
    } catch (err) { showError('resError', err.message); }
  });
}

async function loadUsers() {
  var snap = await db.collection('users').orderBy('createdAt', 'desc').get();
  document.getElementById('adminUsers').textContent = snap.size;
  var tbody = document.getElementById('adminUsersBody');
  tbody.innerHTML = snap.empty
    ? '<tr><td colspan="4" class="empty-state">No users.</td></tr>'
    : snap.docs.map(function (d) {
        var u = d.data();
        return '<tr>' +
          '<td>' + (u.name || '—') + '</td>' +
          '<td>' + (u.email || '—') + '</td>' +
          '<td><span class="badge ' + (u.role === 'admin' ? 'badge-available' : 'badge-pending') + '">' + u.role + '</span></td>' +
          '<td>' + formatDate(u.createdAt) + '</td>' +
        '</tr>';
      }).join('');
}