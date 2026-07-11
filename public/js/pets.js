// pets.js — Browse/filter gallery for pets.html
// Loads ALL pets once, renders them as gallery cards, then filters
// client-side live as the user types/selects (no extra Firestore reads per keystroke).

import { db } from './firebase-config.js';
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let allPets = [];

const galleryEl = document.getElementById('petGallery');
const emptyEl = document.getElementById('galleryEmpty');
const resultCountEl = document.getElementById('resultCount');

const filters = {
  search: document.getElementById('filterSearch'),
  species: document.getElementById('filterSpecies'),
  age: document.getElementById('filterAge'),
  gender: document.getElementById('filterGender'),
  origin: document.getElementById('filterOrigin'),
  size: document.getElementById('filterSize'),
};

const clearBtn = document.getElementById('clearFiltersBtn');

// ---------- Load pets from Firestore ----------
async function loadPets() {
  try {
    // Only show pets that are available for adoption in the public gallery.
    // Adjust/remove the where() clause if you want surrendered-but-pending pets hidden differently.
    const petsRef = collection(db, 'pets');
    const q = query(petsRef, where('status', '!=', 'adopted'));
    const snap = await getDocs(q);

    allPets = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    renderGallery(allPets);
  } catch (err) {
    console.error('Error loading pets:', err);
    resultCountEl.textContent = 'Could not load pets right now.';
  }
}

// ---------- Render gallery cards ----------
function renderGallery(pets) {
  galleryEl.innerHTML = '';

  if (pets.length === 0) {
    emptyEl.style.display = 'block';
    resultCountEl.textContent = '0 pets found';
    return;
  }

  emptyEl.style.display = 'none';
  resultCountEl.textContent = `${pets.length} pet${pets.length === 1 ? '' : 's'} found`;

  const fragment = document.createDocumentFragment();

  pets.forEach(pet => {
    const card = document.createElement('article');
    card.className = 'pet-card';

    const photo = pet.photoURL || pet.imageUrl || 'assets/placeholder-pet.jpg';
    const ageLabel = formatAgeLabel(pet.age, pet.ageGroup);
    const originLabel = formatOriginLabel(pet.origin);

    card.innerHTML = `
      <div class="pet-card-photo">
        <img src="${escapeHtml(photo)}" alt="${escapeHtml(pet.name || 'Pet')}" loading="lazy">
        <span class="pet-card-badge">${escapeHtml(ageLabel)}</span>
      </div>
      <div class="pet-card-body">
        <h3 class="pet-card-name">${escapeHtml(pet.name || 'Unnamed')}</h3>
        <p class="pet-card-breed">${escapeHtml(pet.breed || pet.species || 'Mixed breed')}</p>
        <p class="pet-card-origin">${escapeHtml(originLabel)}${pet.shelterName ? ' · ' + escapeHtml(pet.shelterName) : ''}</p>
        <a href="pet-detail.html?id=${encodeURIComponent(pet.id)}" class="btn btn-primary btn-small pet-card-btn">
          Pet Details →
        </a>
      </div>
    `;

    fragment.appendChild(card);
  });

  galleryEl.appendChild(fragment);
}

// ---------- Filtering ----------
function applyFilters() {
  const searchVal = filters.search.value.trim().toLowerCase();
  const speciesVal = filters.species.value;
  const ageVal = filters.age.value;
  const genderVal = filters.gender.value;
  const originVal = filters.origin.value;
  const sizeVal = filters.size.value;

  const filtered = allPets.filter(pet => {
    if (searchVal) {
      const haystack = `${pet.name || ''} ${pet.breed || ''}`.toLowerCase();
      if (!haystack.includes(searchVal)) return false;
    }
    if (speciesVal && (pet.species || '').toLowerCase() !== speciesVal) return false;
    if (ageVal && (pet.ageGroup || '').toLowerCase() !== ageVal) return false;
    if (genderVal && (pet.gender || '').toLowerCase() !== genderVal) return false;
    if (originVal && (pet.origin || '').toLowerCase() !== originVal) return false;
    if (sizeVal && (pet.size || '').toLowerCase() !== sizeVal) return false;
    return true;
  });

  renderGallery(filtered);
}

// ---------- Helpers ----------
function formatAgeLabel(age, ageGroup) {
  if (ageGroup) {
    const map = { baby: 'Baby', young: 'Young', adult: 'Adult', senior: 'Senior' };
    return map[ageGroup] || ageGroup;
  }
  if (typeof age === 'number') return `${age} ${age === 1 ? 'yr' : 'yrs'}`;
  return 'Age unknown';
}

function formatOriginLabel(origin) {
  const map = {
    shelter_born: 'Shelter',
    rescued: 'Rescued',
    surrender: 'Owner Surrender'
  };
  return map[origin] || 'Shelter';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function debounce(fn, delay = 150) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ---------- Event wiring ----------
filters.search.addEventListener('input', debounce(applyFilters, 150));
filters.species.addEventListener('change', applyFilters);
filters.age.addEventListener('change', applyFilters);
filters.gender.addEventListener('change', applyFilters);
filters.origin.addEventListener('change', applyFilters);
filters.size.addEventListener('change', applyFilters);

document.getElementById('clearFiltersBtn').addEventListener('click', () => {
  Object.values(filters).forEach(el => { el.value = ''; });
  renderGallery(allPets);
});

// ---------- Init ----------
loadPets();
