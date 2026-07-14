// Assumes firebase-config.js already created global `auth` and `db`

function requireAuth() {
  return new Promise(function (resolve) {
    auth.onAuthStateChanged(function (user) {
      if (!user) { window.location.href = 'login.html'; return; }
      resolve(user);
    });
  });
}

function requireAdmin() {
  return new Promise(function (resolve) {
    auth.onAuthStateChanged(async function (user) {
      if (!user) { window.location.href = 'login.html'; resolve(null); return; }
      var snap = await db.collection('users').doc(user.uid).get();
      var role = snap.exists ? snap.data().role : '';
      if (role !== 'admin' && role !== 'owner') {
        document.body.innerHTML = '<div style="text-align:center;padding:4rem;"><h2>Access Denied</h2><a href="index.html">Go Home</a></div>';
        resolve(null);
        return;
      }
      resolve(user);
    });
  });
}

// ============================================================
// SIGNUP FUNCTIONALITY
// ============================================================
var registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    var name = document.getElementById('name').value.trim();
    var email = document.getElementById('email').value.trim();
    var phone = document.getElementById('phone').value.trim();
    var address = document.getElementById('address').value.trim();
    var password = document.getElementById('password').value;
    var confirmPassword = document.getElementById('confirmPassword').value;

    hideError('registerError');

    if (!name || !email || !phone || !address || !password) {
      showError('registerError', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      showError('registerError', 'Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      showError('registerError', 'Password must be at least 6 characters.');
      return;
    }

    var registerBtn = document.getElementById('registerBtn');
    registerBtn.disabled = true;
    registerBtn.textContent = 'Creating account...';

    try {
      console.log('Attempting to create user with email:', email);
      var userCredential = await auth.createUserWithEmailAndPassword(email, password);
      console.log('User created successfully:', userCredential.user.uid);

      // Create user document in Firestore
      await db.collection('users').doc(userCredential.user.uid).set({
        name: name,
        email: email,
        phone: phone,
        address: address,
        role: 'adopter', // Default role
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('User document created in Firestore');

      toast('Account created successfully!');
      setTimeout(function () {
        window.location.href = 'dashboard.html';
      }, 1000);

    } catch (error) {
      console.error('Signup error:', error);
      var errorMessage = 'Signup failed. ';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage += 'Email already registered.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage += 'Password is too weak.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage += 'Invalid email address.';
      } else {
        errorMessage += error.message;
      }
      showError('registerError', errorMessage);
    } finally {
      registerBtn.disabled = false;
      registerBtn.textContent = 'Sign Up';
    }
  });
}

// ============================================================
// LOGIN FUNCTIONALITY
// ============================================================
var loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    var email = document.getElementById('email').value.trim();
    var password = document.getElementById('password').value;

    hideError('loginError');

    if (!email || !password) {
      showError('loginError', 'Please enter email and password.');
      return;
    }

    var loginBtn = document.getElementById('loginBtn');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';

    try {
      console.log('Attempting to login with email:', email);
      await auth.signInWithEmailAndPassword(email, password);
      console.log('Login successful');
      toast('Login successful!');
      setTimeout(function () {
        window.location.href = 'dashboard.html';
      }, 500);

    } catch (error) {
      console.error('Login error:', error);
      var errorMessage = 'Login failed. ';
      if (error.code === 'auth/user-not-found') {
        errorMessage += 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage += 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage += 'Invalid email address.';
      } else {
        errorMessage += error.message;
      }
      showError('loginError', errorMessage);
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Log In';
    }
  });
}

// ============================================================
// LOGOUT FUNCTIONALITY
// ============================================================
var logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async function (e) {
    e.preventDefault();
    try {
      await auth.signOut();
      toast('Logged out successfully');
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Logout error:', error);
      toast('Error logging out');
    }
  });
}