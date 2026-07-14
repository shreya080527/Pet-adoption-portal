(async function () {
  var user = await requireAuth();
  var userSnap = await db.collection('users').doc(user.uid).get();
  var userData = userSnap.exists ? userSnap.data() : {};

  document.getElementById('welcomeMsg').textContent = 'Welcome back, ' + (userData.name || '') + '!';
  document.getElementById('dashboardContent').hidden = false;

  document.getElementById('profileName').value    = userData.name    || '';
  document.getElementById('profilePhone').value   = userData.phone   || '';
  document.getElementById('profileAddress').value = userData.address || '';

  var adoptSnap = await db.collection('adoption_requests')
    .where('adopterId', '==', user.uid)
    .orderBy('createdAt', 'desc')
    .get();
  document.getElementById('dashAdoptionCount').textContent = adoptSnap.size;

  var adoptBody = document.getElementById('adoptionTableBody');
  adoptBody.innerHTML = adoptSnap.empty
    ? '<tr><td colspan="4" class="empty-state">No adoption requests yet.</td></tr>'
    : adoptSnap.docs.map(function (d) {
        var r = d.data();
        var statusClass = { pending: 'badge-pending', approved: 'badge-available', rejected: 'badge-lost' }[r.status] || '';
        return '<tr>' +
          '<td><a href="pet-detail.html?id=' + r.petId + '">' + r.petName + '</a></td>' +
          '<td><span class="badge ' + statusClass + '">' + r.status + '</span></td>' +
          '<td>' + formatDate(r.createdAt) + '</td>' +
          '<td>' + (r.status === 'pending'
            ? '<button class="btn btn-sm btn-danger" onclick="cancelAdoption(\'' + d.id + '\')">Cancel</button>'
            : '') +
          '</td>' +
        '</tr>';
      }).join('');

  var surSnap = await db.collection('pets')
    .where('surrenderedBy', '==', user.uid)
    .where('origin', '==', 'owner_given_up')
    .orderBy('addedAt', 'desc')
    .get();
  document.getElementById('dashSurrenderCount').textContent = surSnap.size;

  var surBody = document.getElementById('surrenderTableBody');
  surBody.innerHTML = surSnap.empty
    ? '<tr><td colspan="4" class="empty-state">No surrendered pets.</td></tr>'
    : surSnap.docs.map(function (d) {
        var p = d.data();
        var sClass = { available: 'badge-available', pending: 'badge-pending', adopted: 'badge-adopted' }[p.status] || '';
        return '<tr>' +
          '<td>' + p.name + '</td>' +
          '<td><span class="badge ' + sClass + '">' + p.status + '</span></td>' +
          '<td>' + formatDate(p.addedAt) + '</td>' +
          '<td><a href="pet-detail.html?id=' + d.id + '" class="btn btn-sm btn-outline">View</a></td>' +
        '</tr>';
      }).join('');

  var lfSnap = await db.collection('lost_found')
    .where('reportedBy', '==', user.uid)
    .orderBy('createdAt', 'desc')
    .get();
  document.getElementById('dashLfCount').textContent = lfSnap.size;

  var lfBody = document.getElementById('lfTableBody');
  lfBody.innerHTML = lfSnap.empty
    ? '<tr><td colspan="4" class="empty-state">No lost & found posts.</td></tr>'
    : lfSnap.docs.map(function (d) {
        var p = d.data();
        return '<tr>' +
          '<td>' + p.species + (p.breed ? ' · ' + p.breed : '') + '</td>' +
          '<td><span class="badge ' + (p.type === 'lost' ? 'badge-lost' : 'badge-found') + '">' + p.type + '</span></td>' +
          '<td>' + formatDate(p.createdAt) + '</td>' +
          '<td><button class="btn btn-sm btn-danger" onclick="deleteLfPost(\'' + d.id + '\')">Delete</button></td>' +
        '</tr>';
      }).join('');

  var profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      hideError('profileError');
      try {
        await db.collection('users').doc(user.uid).update({
          name:    document.getElementById('profileName').value.trim(),
          phone:   document.getElementById('profilePhone').value.trim(),
          address: document.getElementById('profileAddress').value.trim()
        });
        showSuccess('profileSuccess', 'Profile updated!');
        toast('Profile saved.');
      } catch (err) {
        showError('profileError', err.message);
      }
    });
  }
})();

window.cancelAdoption = async function (id) {
  if (!confirm('Cancel this adoption request?')) return;
  await db.collection('adoption_requests').doc(id).delete();
  toast('Request cancelled.'); location.reload();
};

window.deleteLfPost = async function (id) {
  if (!confirm('Delete this lost & found post?')) return;
  await db.collection('lost_found').doc(id).delete();
  toast('Post deleted.'); location.reload();
};