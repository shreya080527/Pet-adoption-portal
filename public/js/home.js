(async function () {
  var petsSnap = await db.collection('pets').get();
  var lfSnap   = await db.collection('lost_found').get();

  var pets = petsSnap.docs.map(function (d) { return d.data(); });
  var available = pets.filter(function (p) { return p.status === 'available'; }).length;
  var adopted   = pets.filter(function (p) { return p.status === 'adopted'; }).length;

  var statAvailable = document.getElementById('statAvailable');
  var statAdopted   = document.getElementById('statAdopted');
  var statLostFound = document.getElementById('statLostFound');
  if (statAvailable) statAvailable.textContent = available;
  if (statAdopted)   statAdopted.textContent   = adopted;
  if (statLostFound) statLostFound.textContent = lfSnap.size;
})();

var featuredResources = document.getElementById('featuredResources');
if (featuredResources) {
  (async function () {
    var snap = await db.collection('resources').orderBy('createdAt', 'desc').limit(3).get();
    if (snap.empty) {
      featuredResources.innerHTML = '<p class="empty-state">No articles yet.</p>';
      return;
    }
    featuredResources.innerHTML = snap.docs.map(function (d) {
      var r = d.data();
      return '<div class="resource-card" onclick="window.location.href=\'resources.html?id=' + d.id + '\'">' +
        '<img src="' + (r.imageURL || 'https://placehold.co/400x200?text=Article') + '" alt="' + r.title + '" />' +
        '<div class="resource-card-body">' +
          '<span class="origin-tag">' + r.category + '</span>' +
          '<h3>' + r.title + '</h3>' +
          '<p>' + (r.content || '').slice(0, 90) + '…</p>' +
        '</div>' +
      '</div>';
    }).join('');
  })();
}