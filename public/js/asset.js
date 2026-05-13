// ─────────────────────────────────────────────────────────────────
//  asset.js — View-only asset page
//  Reads the asset ID from the URL path: /asset/AST-0001
// ─────────────────────────────────────────────────────────────────

function showLoader(msg) {
  document.getElementById('loader-msg').textContent = msg || 'Loading...';
  document.getElementById('loader').classList.add('show');
}
function hideLoader() {
  document.getElementById('loader').classList.remove('show');
}

function fmtDate(s) {
  if (!s) return null;
  try { return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return s; }
}

function esc(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Pull asset ID from URL path e.g. /asset/AST-0001
function getAssetIdFromUrl() {
  const parts = window.location.pathname.split('/');
  // pathname = /asset/AST-0001 → parts = ['', 'asset', 'AST-0001']
  return parts[2] || null;
}

function renderAsset(a) {
  const today = new Date(); today.setHours(0,0,0,0);
  function daysDiff(d) { return d ? Math.floor((new Date(d + 'T00:00:00') - today) / 86400000) : null; }
  function dateTile(d) {
    if (!d) return { html: '<span style="color:var(--text-dim)">—</span>', cls: '' };
    const diff = daysDiff(d), label = fmtDate(d);
    if (diff < 0)  return { html: `${label} <span style="color:var(--danger)">⚠ Overdue</span>`,  cls: 'bad'  };
    if (diff < 30) return { html: `${label} <span style="color:var(--warning)">⚡ Soon</span>`,   cls: 'warn' };
    return { html: label, cls: 'ok' };
  }
  function warrantyBadge() {
    if (!a.warrantyExpiry) return '<span class="badge b-neutral">No Warranty</span>';
    const d = daysDiff(a.warrantyExpiry);
    if (d < 0)  return '<span class="badge b-danger">Warranty Expired</span>';
    if (d < 30) return '<span class="badge b-warning">Expiring Soon</span>';
    return '<span class="badge b-success">In Warranty</span>';
  }
  const SC = { Active: 'b-success', Inactive: 'b-neutral', 'Under Repair': 'b-warning', Retired: 'b-danger' };
  const CC = { Excellent: 'b-success', Good: 'b-info', Fair: 'b-warning', Poor: 'b-danger' };
  const ls = dateTile(a.lastServiced), ns = dateTile(a.nextServiceDue), wa = dateTile(a.warrantyExpiry);

  // Update page title
  document.title = `${a.name || a.id} — AssetTrack`;

  document.getElementById('asset-content').innerHTML = `
    <div class="asset-hero">
      <div class="asset-id-tag">▶ ${esc(a.id)}</div>
      <div class="asset-name-display">${esc(a.name || 'Unnamed Asset')}</div>
      <div class="badges-row">
        <span class="badge ${SC[a.status] || 'b-neutral'}">${esc(a.status || 'Unknown')}</span>
        <span class="badge ${CC[a.condition] || 'b-neutral'}">${esc(a.condition || '—')}</span>
        ${warrantyBadge()}
      </div>
    </div>

    <div class="section-label">Location & Category</div>
    <div class="info-grid">
      <div class="info-tile">
        <div class="info-tile-label">Location</div>
        <div class="info-tile-value">${esc(a.location || '—')}</div>
      </div>
      <div class="info-tile">
        <div class="info-tile-label">Category</div>
        <div class="info-tile-value">${esc(a.category || '—')}</div>
      </div>
    </div>

    <div class="section-label">Service</div>
    <div class="info-grid">
      <div class="info-tile">
        <div class="info-tile-label">Last Serviced</div>
        <div class="info-tile-value ${ls.cls}">${ls.html}</div>
      </div>
      <div class="info-tile">
        <div class="info-tile-label">Next Service</div>
        <div class="info-tile-value ${ns.cls}">${ns.html}</div>
      </div>
    </div>

    <div class="section-label">Warranty</div>
    <div class="full-tile">
      <div class="info-tile-label">Expiry</div>
      <div class="info-tile-value ${wa.cls}" style="margin-top:4px">${wa.html}</div>
    </div>

    ${a.notes ? `
    <div class="section-label">Notes</div>
    <div class="full-tile">
      <div class="notes-body">${esc(a.notes)}</div>
    </div>` : ''}

    <div class="section-label">Record</div>
    <div class="full-tile">
      <div class="info-tile-label">Date Added</div>
      <div class="info-tile-value mono" style="margin-top:4px">${fmtDate(a.dateAdded) || '—'}</div>
    </div>

    <div class="admin-link-row">
      <a href="https://assets.iovine.com" class="btn-admin-link">⚙️ &nbsp;Go to Admin Panel</a>
    </div>
  `;
}

function renderNotFound(id) {
  document.title = 'Asset Not Found — AssetTrack';
  document.getElementById('asset-content').innerHTML = `
    <div class="not-found-box">
      <div class="not-found-icon">🔍</div>
      <div class="not-found-title">Asset Not Found</div>
      <div class="not-found-id">${esc(id)}</div>
      <div class="not-found-body">No asset with this ID exists.<br>Add it from the Admin Panel.</div>
      <a href="https://assets.iovine.com" class="btn-admin-link" style="margin-top:24px; display:inline-block;">← Back to Asset List</a>
    </div>`;
}

// ── INIT ─────────────────────────────────────────────────────────
(function init() {
  const assetId = getAssetIdFromUrl();

  if (!assetId) {
    window.location.href = '/';
    return;
  }

  showLoader('Loading asset…');
  ASSETS.doc(assetId).get()
    .then(doc => {
      hideLoader();
      if (doc.exists) {
        renderAsset({ id: doc.id, ...doc.data() });
      } else {
        renderNotFound(assetId);
      }
    })
    .catch(err => {
      hideLoader();
      document.getElementById('asset-content').innerHTML = `
        <div class="not-found-box">
          <div class="not-found-icon">⚠️</div>
          <div class="not-found-title">Error loading asset</div>
          <div class="not-found-body">${esc(err.message)}</div>
        </div>`;
    });
})();