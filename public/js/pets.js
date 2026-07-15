// ============================================================
// pets.js  –  Firebase v8 compat syntax (matches your setup)
// ============================================================

let allPets = [];

async function loadPets() {
  const gallery = document.getElementById('petGallery');
  const empty   = document.getElementById('galleryEmpty');
  const count   = document.getElementById('resultCount');

  if (gallery) gallery.innerHTML = '<p style="text-align:center;padding:2rem;">Loading pets...</p>';

  try {
    const snap = await db.collection('pets')
      .get();

    allPets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    allPets.sort((a, b) => {
      const aTime = a.addedAt && a.addedAt.toMillis ? a.addedAt.toMillis() : 0;
      const bTime = b.addedAt && b.addedAt.toMillis ? b.addedAt.toMillis() : 0;
      return bTime - aTime;
    });

    renderPets(allPets);

  } catch (err) {
    console.error('Error loading pets:', err);
    if (gallery) {
      gallery.innerHTML = '<p style="text-align:center;padding:2rem;color:red;">Error: ' + err.message + '</p>';
    }
  }
}

function renderPets(pets) {
  const gallery = document.getElementById('petGallery');
  const empty   = document.getElementById('galleryEmpty');
  const count   = document.getElementById('resultCount');

  if (!gallery) return;

  if (count) count.textContent = pets.length + ' pet' + (pets.length !== 1 ? 's' : '') + ' found';

  if (pets.length === 0) {
    gallery.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';

  const originLabel = {
    shelter_born:   '🏠 Born in Shelter',
    rescued:        '🚑 Rescued',
    owner_given_up: '💛 Owner Given Up'
  };

  gallery.innerHTML = pets.map(function(pet) {
    const imgSrc = pet.imageURL ? pet.imageURL : 'https://placehold.co/400x300/f0f4f8/888?text=No+Image';
    return '<div class="pet-card" onclick="window.location.href=\'pet-detail.html?id=' + pet.id + '\'" style="cursor:pointer;">'
      + '<div class="pet-card-img"><img src="' + imgSrc + '" alt="' + (pet.name || '') + '" onerror="this.src=\'https://placehold.co/400x300/f0f4f8/888?text=No+Image\'"></div>'
      + '<div class="pet-card-body">'
      + '<h3 class="pet-name">' + (pet.name || 'Unknown') + '</h3>'
      + '<p class="pet-meta">' + (pet.species || '') + (pet.breed ? ' · ' + pet.breed : '') + '</p>'
      + '<div class="pet-tags">'
      + (pet.age    ? '<span class="tag">' + pet.age + '</span>' : '')
      + (pet.gender ? '<span class="tag">' + pet.gender + '</span>' : '')
      + (pet.vaccinated ? '<span class="tag tag-green">Vaccinated ✓</span>' : '')
      + '</div>'
      + '<p class="pet-origin">' + (originLabel[pet.origin] || '') + '</p>'
      + '<button class="btn btn-primary btn-sm">View Details</button>'
      + '</div></div>';
  }).join('');
}

function applyFilters() {
  var search  = document.getElementById('filterSearch')  ? document.getElementById('filterSearch').value.toLowerCase()  : '';
  var species = document.getElementById('filterSpecies') ? document.getElementById('filterSpecies').value.toLowerCase() : '';
  var gender  = document.getElementById('filterGender')  ? document.getElementById('filterGender').value.toLowerCase()  : '';
  var size    = document.getElementById('filterSize')    ? document.getElementById('filterSize').value.toLowerCase()    : '';
  var origin  = document.getElementById('filterOrigin')  ? document.getElementById('filterOrigin').value.toLowerCase()  : '';

  var filtered = allPets.filter(function(pet) {
    var matchSearch  = !search  || (pet.name  || '').toLowerCase().includes(search) || (pet.breed || '').toLowerCase().includes(search);
    var matchSpecies = !species || (pet.species || '').toLowerCase() === species;
    var matchGender  = !gender  || (pet.gender  || '').toLowerCase() === gender;
    var matchSize    = !size    || (pet.size    || '').toLowerCase() === size;
    var matchOrigin  = !origin  || (pet.origin  || '').toLowerCase() === origin;
    return matchSearch && matchSpecies && matchGender && matchSize && matchOrigin;
  });

  renderPets(filtered);
}

document.addEventListener('DOMContentLoaded', function() {
  if (!document.getElementById('petGallery')) return;

  loadPets();

  ['filterSearch', 'filterSpecies', 'filterGender', 'filterSize', 'filterOrigin'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener('input',  applyFilters);
      el.addEventListener('change', applyFilters);
    }
  });

  var clearBtn = document.getElementById('clearFiltersBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      ['filterSearch', 'filterSpecies', 'filterGender', 'filterSize', 'filterOrigin'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.value = '';
      });
      renderPets(allPets);
    });
  }
});
