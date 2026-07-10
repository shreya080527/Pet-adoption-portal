// ============================================================
// auth.js
// Handles: login, register, logout, onAuthStateChanged navbar,
//          role (admin) checks, page-level auth guards.
// ============================================================

import { auth, db }           from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { wireNavToggle, showError, setLoading } from "./utils.js";

// ── Navbar auth state ─────────────────────────────────────────
wireNavToggle();

onAuthStateChanged(auth, async (user) => {
  const navActions = document.getElementById("navActions");
  if (!navActions) return;

  if (user) {
    const snap = await getDoc(doc(db, "users", user.uid));
    const role = snap.exists() ? snap.data().role : "adopter";

    navActions.innerHTML = `
      <a href="dashboard.html" class="btn btn-ghost">Dashboard</a>
      ${role === "admin" ? '<a href="admin.html" class="btn btn-ghost">Admin</a>' : ""}
      <button id="logoutBtn" class="btn btn-outline">Log Out</button>
    `;
    document.getElementById("logoutBtn")?.addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "index.html";
    });
  } else {
    navActions.innerHTML = `
      <a href="login.html" class="btn btn-ghost">Log In</a>
      <a href="register.html" class="btn btn-primary">Sign Up</a>
    `;
  }
});

// ── Register form ─────────────────────────────────────────────
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name     = document.getElementById("name").value.trim();
    const email    = document.getElementById("email").value.trim();
    const phone    = document.getElementById("phone").value.trim();
    const address  = document.getElementById("address").value.trim();
    const password = document.getElementById("password").value;
    const confirm  = document.getElementById("confirmPassword").value;

    if (password !== confirm) {
      showError("registerError", "Passwords do not match."); return;
    }
    setLoading("registerBtn", true, "Sign Up");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", cred.user.uid), {
        name, email, phone, address,
        role: "adopter",
        createdAt: serverTimestamp()
      });
      window.location.href = "index.html";
    } catch (err) {
      showError("registerError", err.message);
      setLoading("registerBtn", false, "Sign Up");
    }
  });
}

// ── Login form ────────────────────────────────────────────────
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    setLoading("loginBtn", true, "Log In");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "index.html";
    } catch (err) {
      showError("loginError", "Invalid email or password.");
      setLoading("loginBtn", false, "Log In");
    }
  });
}

// ── Exported helpers used by other pages ──────────────────────

/** Returns current user's Firestore data, or null */
export async function getCurrentUserData() {
  const user = auth.currentUser;
  if (!user) return null;
  const snap = await getDoc(doc(db, "users", user.uid));
  return snap.exists() ? { uid: user.uid, ...snap.data() } : null;
}

/** Redirect to login if not authenticated; returns user object */
export function requireAuth(redirectTo = "login.html") {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (!user) { window.location.href = redirectTo; return; }
      resolve(user);
    });
  });
}

/** Redirect to index if not admin */
export async function requireAdmin() {
  const user = await requireAuth();
  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists() || snap.data().role !== "admin") {
    window.location.href = "index.html";
    return null;
  }
  return { uid: user.uid, ...snap.data() };
}

export { auth, db };
