// ============================================================
// utils.js — shared helpers
// ============================================================

/** Format a Firestore Timestamp or JS Date to "Jan 5, 2025" */
export function formatDate(value) {
  if (!value) return "—";
  const d = value.toDate ? value.toDate() : new Date(value);
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

/** Show a brief toast notification */
export function toast(message, type = "success") {
  const existing = document.getElementById("pawToast");
  if (existing) existing.remove();

  const el = document.createElement("div");
  el.id = "pawToast";
  el.textContent = message;
  Object.assign(el.style, {
    position:     "fixed",
    bottom:       "28px",
    right:        "24px",
    zIndex:       "9999",
    padding:      "14px 20px",
    borderRadius: "12px",
    border:       "2px solid #2B2118",
    background:   type === "error" ? "#C44545" : "#3D6B5C",
    color:        "#fff",
    fontWeight:   "600",
    fontSize:     "0.92rem",
    boxShadow:    "4px 4px 0 #2B2118",
    maxWidth:     "320px",
    transition:   "opacity 0.4s",
  });
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; }, 2600);
  setTimeout(() => el.remove(), 3000);
}

/** Wire a file input to show an <img> preview */
export function wireImagePreview(inputId, previewId) {
  const input   = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!input || !preview) return;
  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) { preview.hidden = true; return; }
    const reader = new FileReader();
    reader.onload = e => { preview.src = e.target.result; preview.hidden = false; };
    reader.readAsDataURL(file);
  });
}

/** Show/hide an error <p> with a message */
export function showError(elId, message) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
}
export function hideError(elId) {
  const el = document.getElementById(elId);
  if (el) el.hidden = true;
}

/** Show a success message */
export function showSuccess(elId, message) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
}

/** Disable/enable a submit button with loading text */
export function setLoading(btnId, loading, defaultText) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? "Please wait…" : defaultText;
}

/** Get URL query param */
export function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/** Origin label display */
export function originLabel(origin) {
  return { shelter_born: "Born in shelter", rescued: "Rescued", owner_given_up: "Given up by owner" }[origin] || origin;
}

/** Wire mobile nav toggle (call once per page) */
export function wireNavToggle() {
  const btn  = document.getElementById("navToggle");
  const nav  = document.getElementById("mainNav");
  const acts = document.getElementById("navActions");
  if (!btn) return;
  btn.addEventListener("click", () => {
    nav?.classList.toggle("open");
    acts?.classList.toggle("open");
  });
}
