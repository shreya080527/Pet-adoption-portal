function formatDate(timestamp) {
  if (!timestamp) return '—';
  var date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function toast(message) {
  var existing = document.getElementById('toastMsg');
  if (existing) existing.remove();
  var el = document.createElement('div');
  el.id = 'toastMsg';
  el.textContent = message;
  el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 20px;border-radius:6px;z-index:9999;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,.2);';
  document.body.appendChild(el);
  setTimeout(function () { el.remove(); }, 3000);
}

function showError(id, msg) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
}

function hideError(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.hidden = true;
}

function showSuccess(id, msg) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
}

function setLoading(btnId, isLoading, normalText) {
  var btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = isLoading;
  btn.textContent = isLoading ? 'Saving...' : normalText;
}

function getParam(name) {
  var params = new URLSearchParams(window.location.search);
  return params.get(name);
}