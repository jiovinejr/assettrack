// ─────────────────────────────────────────────────────────────────
//  admin.js — Admin panel logic
// ─────────────────────────────────────────────────────────────────

const BASE_URL = 'https://assets.iovine.com';

// ── STATE ─────────────────────────────────────────────────────────
let allAssets    = [];
let isNewAsset   = false;
let currentAsset = null;

// ── VIEWS ─────────────────────────────────────────────────────────
function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + id).classList.add('active');
}

// ── LOADER / TOAST ────────────────────────────────────────────────
function showLoader(msg) {
  document.getElementById('loader-msg').textContent = msg || 'Loading...';
  document.getElementById('loader').classList.add('show');
}
function hideLoader() {
  document.getElementById('loader').classList.remove('show');
}
function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show' + (type ? ' t-' + type : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3200);
}

// ── ADMIN LIST ────────────────────────────────────────────────────
function fetchAllAssets() {
  document.getElementById('asset-list').innerHTML = '';
  document.getElementById('admin-stats').innerHTML = '';
  showLoader('Loading assets…');
  ASSETS.get()
    .then(snap => {
      hideLoader();
      allAssets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      allAssets.sort((a, b) => (a.dateAdded || '').localeCompare(b.dateAdded || ''));
      renderStats(allAssets);
      renderAssetList(allAssets);
    })
    .catch(err => { hideLoader(); showToast('Failed to load: ' + err.message, 'error'); });
}

function renderStats(assets) {
  const active  = assets.filter(a => a.status === 'Active').length;
  const repair  = assets.filter(a => a.status === 'Under Repair').length;
  const expired = assets.filter(a => a.warrantyExpiry && new Date(a.warrantyExpiry + 'T00:00:00') < new Date()).length;
  document.getElementById('admin-stats').innerHTML =
    `<span class="stat-chip">Total <span>${assets.length}</span></span>` +
    `<span class="stat-chip">Active <span>${active}</span></span>` +
    (repair  ? `<span class="stat-chip">In Repair <span>${repair}</span></span>` : '') +
    (expired ? `<span class="stat-chip" style="color:var(--danger)">Warranty Expired <span>${expired}</span></span>` : '');
}

function filterAssets() {
  const q = document.getElementById('search-input').value.toLowerCase();
  renderAssetList(!q ? allAssets : allAssets.filter(a =>
    [a.name, a.id, a.location, a.category, a.status].some(f => (f || '').toLowerCase().includes(q))
  ));
}

const ICONS = {
  vehicle:'🚗', forklift:'🏗️', truck:'🚚', machinery:'🏭', equipment:'⚙️',
  tool:'🔧', computer:'💻', laptop:'💻', electrical:'⚡', furniture:'🪑',
  pump:'💧', generator:'🔋', default:'📦'
};
function getIcon(cat) {
  if (!cat) return ICONS.default;
  const l = cat.toLowerCase();
  for (const [k, v] of Object.entries(ICONS)) if (l.includes(k)) return v;
  return ICONS.default;
}
const SBC = { Active: 'b-success', Inactive: 'b-neutral', 'Under Repair': 'b-warning', Retired: 'b-danger' };

function renderAssetList(assets) {
  const list = document.getElementById('asset-list');
  if (!assets.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <div>No assets found</div>
        <div class="empty-hint">Tap + NEW to add your first asset</div>
      </div>`;
    return;
  }
  list.innerHTML = assets.map(a => `
    <div class="list-item" onclick="window.location.href='/asset/${escAttr(a.id)}'" style="cursor:pointer;">
      <div class="list-icon">${getIcon(a.category)}</div>
      <div class="list-info">
        <div class="list-name">${esc(a.name || 'Unnamed')}</div>
        <div class="list-meta">${esc(a.id)} &nbsp;·&nbsp; ${esc(a.location || 'No location')}</div>
      </div>
      <span class="badge list-badge ${SBC[a.status] || 'b-neutral'}">${esc(a.status || '?')}</span>
      <div class="list-actions" onclick="event.stopPropagation()">
        <button class="list-action-btn" onclick="editAsset('${escAttr(a.id)}')" title="Edit">✏️</button>
        <button class="list-action-btn" onclick="showLabel('${escAttr(a.id)}')" title="QR Label">🏷</button>
      </div>
    </div>`).join('');
}

// ── EDIT / ADD ────────────────────────────────────────────────────
function showAddNew() {
  isNewAsset = true; currentAsset = null;
  document.getElementById('edit-topbar-title').textContent = 'NEW ASSET';
  document.getElementById('btn-delete').style.display = 'none';
  ['f-id','f-name','f-category','f-location','f-last-serviced','f-next-service',
   'f-warranty','f-notes','f-serial','f-model','f-vendor','f-purchase-date',
   'f-service-provider','f-service-phone','f-manual']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('f-status').value    = 'Active';
  document.getElementById('f-condition').value = 'Good';
  showView('edit');
}

function editAsset(id) {
  const a = allAssets.find(a => a.id === id);
  if (!a) return;
  currentAsset = a;
  isNewAsset = false;
  document.getElementById('edit-topbar-title').textContent = 'EDIT ASSET';
  document.getElementById('btn-delete').style.display = 'block';
  document.getElementById('f-id').value              = a.id || '';
  document.getElementById('f-name').value            = a.name || '';
  document.getElementById('f-category').value        = a.category || '';
  document.getElementById('f-status').value          = a.status || 'Active';
  document.getElementById('f-location').value        = a.location || '';
  document.getElementById('f-last-serviced').value   = a.lastServiced || '';
  document.getElementById('f-next-service').value    = a.nextServiceDue || '';
  document.getElementById('f-warranty').value        = a.warrantyExpiry || '';
  document.getElementById('f-condition').value       = a.condition || 'Good';
  document.getElementById('f-notes').value           = a.notes || '';
  document.getElementById('f-serial').value          = a.serialNumber || '';
  document.getElementById('f-model').value           = a.modelNumber || '';
  document.getElementById('f-vendor').value          = a.vendor || '';
  document.getElementById('f-purchase-date').value   = a.purchaseDate || '';
  document.getElementById('f-service-provider').value = a.serviceProvider || '';
  document.getElementById('f-service-phone').value   = a.servicePhone || '';
  document.getElementById('f-manual').value          = a.manualUrl || '';
  showView('edit');
}

function cancelEdit() {
  showView('admin');
}

function saveAsset() {
  const name = document.getElementById('f-name').value.trim();
  if (!name) { showToast('Asset name is required', 'error'); return; }

  const btn = document.getElementById('btn-save');
  btn.disabled = true; btn.textContent = 'SAVING…';

  const data = {
    name,
    category:        document.getElementById('f-category').value.trim(),
    status:          document.getElementById('f-status').value,
    location:        document.getElementById('f-location').value.trim(),
    lastServiced:    document.getElementById('f-last-serviced').value,
    nextServiceDue:  document.getElementById('f-next-service').value,
    warrantyExpiry:  document.getElementById('f-warranty').value,
    condition:       document.getElementById('f-condition').value,
    notes:           document.getElementById('f-notes').value.trim(),
    serialNumber:    document.getElementById('f-serial').value.trim(),
    modelNumber:     document.getElementById('f-model').value.trim(),
    vendor:          document.getElementById('f-vendor').value.trim(),
    purchaseDate:    document.getElementById('f-purchase-date').value,
    serviceProvider: document.getElementById('f-service-provider').value.trim(),
    servicePhone:    document.getElementById('f-service-phone').value.trim(),
    manualUrl:       document.getElementById('f-manual').value.trim(),
  };

  const finish = (id) => {
    btn.disabled = false; btn.textContent = 'SAVE ASSET';
    showToast('✓ Asset saved', 'success');
    allAssets = [];
    fetchAllAssets();
    showView('admin');
  };

  const docId = document.getElementById('f-id').value.trim();

  if (isNewAsset || !docId) {
    data.dateAdded = new Date().toISOString().slice(0, 10);
    ASSETS.get()
      .then(snap => {
        const num   = String(snap.size + 1).padStart(4, '0');
        const newId = 'AST-' + num;
        return ASSETS.doc(newId).set(data).then(() => newId);
      })
      .then(newId => finish(newId))
      .catch(err => { btn.disabled = false; btn.textContent = 'SAVE ASSET'; showToast('Save failed: ' + err.message, 'error'); });
  } else {
    ASSETS.doc(docId).update(data)
      .then(() => finish(docId))
      .catch(err => { btn.disabled = false; btn.textContent = 'SAVE ASSET'; showToast('Save failed: ' + err.message, 'error'); });
  }
}

function confirmDelete() {
  if (!currentAsset) return;
  if (!confirm(`Delete "${currentAsset.name}"?\n\nThis cannot be undone.`)) return;
  showLoader('Deleting…');
  ASSETS.doc(currentAsset.id).delete()
    .then(() => { hideLoader(); showToast('Asset deleted', ''); allAssets = []; fetchAllAssets(); showView('admin'); })
    .catch(() => { hideLoader(); showToast('Delete failed', 'error'); });
}

// ── QR LABEL ──────────────────────────────────────────────────────
function showLabel(id) {
  const a = allAssets.find(a => a.id === id);
  if (!a) return;

  const url = `${BASE_URL}/asset/${a.id}`;

  document.getElementById('label-id-text').textContent   = a.id;
  document.getElementById('label-name-text').textContent = a.name || '';
  document.getElementById('label-url-text').textContent  = url;

  // Generate QR pointing to the asset URL
  const area = document.getElementById('label-render-area');
  area.innerHTML = '';
  const img = document.createElement('img');
  img.alt    = a.id;
  img.width  = 200;
  img.height = 200;
  img.style.display = 'block';
  img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=4&format=png&data=' + encodeURIComponent(url);
  area.appendChild(img);

  showView('label');
}

// ── UTILS ──────────────────────────────────────────────────────────
function esc(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s) { return String(s || '').replace(/'/g, "\\'"); }

// ── INIT ───────────────────────────────────────────────────────────
fetchAllAssets();