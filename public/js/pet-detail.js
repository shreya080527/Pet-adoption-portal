document.addEventListener('DOMContentLoaded', async function () {

  var params = new URLSearchParams(window.location.search);
  var petId  = params.get('id');

  if (!petId) {
    document.getElementById('loadingMsg').textContent = 'No pet selected.';
    return;
  }

  try {
    var doc = await db.collection('pets').doc(petId).get();

    if (!doc.exists) {
      document.getElementById('loadingMsg').textContent = 'Pet not found.';
      return;
    }

    var pet = doc.data();

    document.getElementById('loadingMsg').hidden = true;
    document.getElementById('petDetailContent').hidden = false;

    document.getElementById('petName').textContent       = pet.name || '';
    document.getElementById('petNameInline').textContent = pet.name || '';
    document.getElementById('petMeta').textContent =
      (pet.species || '') + (pet.breed ? ' · ' + pet.breed : '') +
      (pet.age ? ' · ' + pet.age + ' yrs' : '') +
      (pet.gender ? ' · ' + pet.gender : '');

    document.getElementById('petColor').textContent        = pet.color || '—';
    document.getElementById('petVaccinated').textContent   = pet.vaccinated ? 'Yes ✓' : 'No';
    document.getElementById('petNeutered').textContent     = pet.neutered ? 'Yes ✓' : 'No';
    document.getElementById('petHealthStatus').textContent = pet.healthStatus || '—';
    document.getElementById('petDescription').textContent  = pet.description || '';

    var img = document.getElementById('petImage');
    if (img) {
      img.src = pet.imageURL || 'https://placehold.co/600x400/f0f4f8/888?text=No+Image';
      img.alt = pet.name || 'Pet photo';
    }

    var badge = document.getElementById('petStatusBadge');
    if (badge) {
      badge.textContent = pet.status === 'available' ? 'Available' :
                           pet.status === 'pending'   ? 'Pending'   : 'Adopted';
      badge.className = 'badge badge-' + (pet.status || 'available');
    }

    var originMap = {
      shelter_born:   '🏠 Born in Shelter',
      rescued:        '🚑 Rescued',
      owner_given_up: '💛 Owner Given Up'
    };
    var originTag = document.getElementById('petOriginTag');
    if (originTag) originTag.textContent = originMap[pet.origin] || '';

    var adoptBtn = document.getElementById('adoptBtn');
    if (adoptBtn) {
      if (pet.status !== 'available') {
        adoptBtn.textContent = 'Not Available';
        adoptBtn.classList.add('btn-disabled');
        adoptBtn.style.pointerEvents = 'none';
        adoptBtn.style.opacity = '0.5';
      } else {
        adoptBtn.href = 'adopt.html?id=' + petId + '&name=' + encodeURIComponent(pet.name || '');
      }
    }

    var healthBtn = document.getElementById('healthRecordsBtn');
    if (healthBtn) {
      healthBtn.href = 'pet-health.html?id=' + petId;
    }

  } catch (err) {
    console.error('Error loading pet:', err);
    document.getElementById('loadingMsg').textContent = 'Error loading pet: ' + err.message;
  }
});