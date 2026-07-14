// ============================================================
// resources.js — resources.html (Firebase v8 compat syntax)
// ============================================================

var resourceGrid = document.getElementById('resourceGrid');
var articleSection = document.getElementById('articleSection');
var activeCategory = '';

// Check if a direct article link
var directId = getParam('id');
if (directId) {
  openArticle(directId);
} else {
  loadResources();
}

// Category tabs
document.querySelectorAll('#resourceTabs .tab-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('#resourceTabs .tab-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    activeCategory = btn.dataset.category;
    loadResources();
  });
});

// Load articles list
async function loadResources() {
  if (!resourceGrid) return;
  resourceGrid.innerHTML = '<p class="empty-state">Loading articles…</p>';
  articleSection.hidden = true;
  resourceGrid.parentElement.hidden = false;

  var q = activeCategory
    ? db.collection('resources').where('category', '==', activeCategory).orderBy('createdAt', 'desc')
    : db.collection('resources').orderBy('createdAt', 'desc');

  try {
    var snap = await q.get();
    if (snap.empty) {
      resourceGrid.innerHTML = '<p class="empty-state">No articles yet.</p>';
      return;
    }

    resourceGrid.innerHTML = snap.docs.map(function (d) {
      var r = d.data();
      return '<div class="resource-card" onclick="openArticleById(\'' + d.id + '\')">' +
        '<img src="' + (r.imageURL || 'https://placehold.co/400x200?text=Article') + '" alt="' + r.title + '" />' +
        '<div class="resource-card-body">' +
        '<span class="origin-tag">' + r.category + '</span>' +
        '<h3>' + r.title + '</h3>' +
        '<p>' + (r.content || '').slice(0, 100) + '…</p>' +
        '</div></div>';
    }).join('');
  } catch (err) {
    console.error('Error loading resources:', err);
    resourceGrid.innerHTML = '<p class="empty-state">Error loading articles.</p>';
  }
}

// Open single article
window.openArticleById = openArticle;

async function openArticle(id) {
  try {
    var snap = await db.collection('resources').doc(id).get();
    if (!snap.exists) return;
    var r = snap.data();

    document.getElementById('articleCategory').textContent = r.category;
    document.getElementById('articleTitle').textContent = r.title;
    document.getElementById('articleMeta').textContent = 'By ' + (r.author || 'PawPath Team') + ' · ' + formatDate(r.createdAt);

    var img = document.getElementById('articleImage');
    if (r.imageURL) {
      img.src = r.imageURL;
      img.hidden = false;
    } else {
      img.hidden = true;
    }

    document.getElementById('articleContent').innerHTML =
      (r.content || '').split('\n').map(function (line) { return '<p>' + line + '</p>'; }).join('');

    if (resourceGrid && resourceGrid.parentElement) {
      resourceGrid.closest('section').hidden = true;
    }
    articleSection.hidden = false;
    window.scrollTo(0, 0);
  } catch (err) {
    console.error('Error opening article:', err);
  }
}

// Back to list
var backToResources = document.getElementById('backToResources');
if (backToResources) {
  backToResources.addEventListener('click', function (e) {
    e.preventDefault();
    articleSection.hidden = true;
    if (resourceGrid && resourceGrid.closest('section')) {
      resourceGrid.closest('section').hidden = false;
    }
    loadResources();
  });
}
