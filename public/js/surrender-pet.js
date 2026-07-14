var form = document.getElementById('surrenderForm');
if (form) {
  requireAuth().then(function (user) {
    var gate = document.getElementById('authGate');
    if (gate) gate.hidden = true;
    form.hidden = false;
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideError('surrenderError');

    var user        = auth.currentUser;
    var name        = document.getElementById('petName').value.trim();
    var species     = document.getElementById('petSpecies').value;
    var breed       = document.getElementById('petBreed').value.trim();
    var age         = parseFloat(document.getElementById('petAge').value);
    var gender      = document.getElementById('petGender').value;
    var color       = document.getElementById('petColor').value.trim();
    var vaccinated  = document.getElementById('petVaccinated').checked;
    var neutered    = document.getElementById('petNeutered').checked;
    var reason      = document.getElementById('reasonGivenUp').value.trim();
    var description = document.getElementById('petDescription').value.trim();
    var imageURLEl  = document.getElementById('petImageURL');
    var imageURL    = imageURLEl ? imageURLEl.value.trim() : '';

    if (!name || !species || !reason || !description) {
      showError('surrenderError', 'Please fill in all required fields.'); return;
    }

    setLoading('surrenderBtn', true, 'Submit for Review');
    try {
      await db.collection('pets').add({
        name: name, species: species, breed: breed, age: age, gender: gender, color: color,
        vaccinated: vaccinated, neutered: neutered, description: description, imageURL: imageURL,
        origin: 'owner_given_up',
        status: 'pending',
        reasonGivenUp: reason,
        surrenderedBy: user.uid,
        addedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      toast("Submission received! We'll review it shortly.");
      form.reset();
      showSuccess('surrenderSuccess', "Your pet has been submitted for review. Our team will contact you soon.");
    } catch (err) {
      showError('surrenderError', err.message);
    } finally {
      setLoading('surrenderBtn', false, 'Submit for Review');
    }
  });
}