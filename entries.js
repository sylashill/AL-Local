// ═══════════════════════════════════════════════════════════════
//  entries.js — Anime entry işlemleri
// ═══════════════════════════════════════════════════════════════

let _entryAdvOpen = false;

// ─────────────────────────────────────────
//  FORM
// ─────────────────────────────────────────
function openForm(id) {
  AppState.formListId      = AppState.activeListId;
  AppState.editEntryId     = id;
  AppState.formImg         = null;
  AppState.formTagColor    = null;
  AppState.formLayerIds    = [];
  AppState.layersPickerOpen = false;
  _entryAdvOpen = false;

  const advPanel = document.getElementById('entry-adv-panel');
  const advArrow = document.getElementById('entry-adv-arrow');
  if (advPanel) advPanel.style.display = 'none';
  if (advArrow) advArrow.textContent = '▶';

  clearFormErrors();
  document.getElementById('paste-notice').classList.remove('show');
  const pickerEl = document.getElementById('layers-picker');
  if (pickerEl) pickerEl.style.display = 'none';

  if (id) {
    const l = getList(AppState.formListId);
    const e = l ? l.entries.find(x => x.id === id) : null;
    if (!e) return;

    AppState.formLayerIds = Array.isArray(e.customLayers) ? [...e.customLayers] : [];
    document.getElementById('form-title').textContent = '✎ DÜZENLE';
    document.getElementById('f-name').value    = e.name;
    document.getElementById('f-title').value   = e.title;
    document.getElementById('f-watched').value = e.watched;
    document.getElementById('f-score').value   = e.score.toFixed(1);
    document.getElementById('f-desc').value    = e.desc;
    document.getElementById('f-img-url').value = e.img || '';
    AppState.formImg      = e.img || null;
    AppState.formTagColor = e.tagColor || null;
    updateFormImgPreview();
    if (e.tagColor) document.getElementById('f-tagcolor').value = e.tagColor;

    // Etiket alanları
    const satEl = document.getElementById('f-tagsat'), satValEl = document.getElementById('f-tagsat-val');
    if (satEl) { satEl.value = e.tagSat !== undefined ? e.tagSat : 100; if (satValEl) satValEl.textContent = satEl.value; }
    const sizeEl = document.getElementById('f-tagsize'), sizeValEl = document.getElementById('f-tagsize-val');
    if (sizeEl) { sizeEl.value = e.tagSize !== undefined ? e.tagSize : 0.65; if (sizeValEl) sizeValEl.textContent = parseFloat(sizeEl.value).toFixed(2); }
    const shapeEl = document.getElementById('f-tagshape');
    if (shapeEl) shapeEl.value = e.tagShapeOverride || '';
    const briEl = document.getElementById('f-tagbri'), briValEl = document.getElementById('f-tagbri-val');
    if (briEl) { briEl.value = e.tagBri !== undefined ? e.tagBri : 100; if (briValEl) briValEl.textContent = briEl.value; }
    const opacityEl = document.getElementById('f-tagopacity'), opacityValEl = document.getElementById('f-tagopacity-val');
    if (opacityEl) { opacityEl.value = e.tagOpacity !== undefined ? e.tagOpacity : 100; if (opacityValEl) opacityValEl.textContent = opacityEl.value; }
    const borderEl = document.getElementById('f-tagborder'), borderValEl = document.getElementById('f-tagborder-val');
    if (borderEl) { borderEl.value = e.tagBorderWidth !== undefined ? e.tagBorderWidth : 1; if (borderValEl) borderValEl.textContent = borderEl.value; }
    const boldEl = document.getElementById('f-tagbold');
    if (boldEl) boldEl.checked = e.tagBold || false;
    const italicEl = document.getElementById('f-tagitalic');
    if (italicEl) italicEl.checked = e.tagItalic || false;
    // Glow
    const glowEl = document.getElementById('f-tagglow'), glowWrap = document.getElementById('f-tagglow-wrap');
    const glowIntEl = document.getElementById('f-tagglowint'), glowIntVal = document.getElementById('f-tagglowint-val');
    if (glowEl) { glowEl.checked = e.tagGlow || false; if (glowWrap) glowWrap.style.display = e.tagGlow ? 'block' : 'none'; }
    if (glowIntEl) { glowIntEl.value = e.tagGlowIntensity !== undefined ? e.tagGlowIntensity : 6; if (glowIntVal) glowIntVal.textContent = glowIntEl.value; }
    // Tag BG override
    const tagBgEl = document.getElementById('f-tagbg'), tagBgEnabled = document.getElementById('f-tagbg-enabled');
    if (tagBgEl) tagBgEl.value = e.tagBgColor || '#131320';
    if (tagBgEnabled) tagBgEnabled.checked = !!e.tagBgColor;

    // Poster alanları
    const posteroverlayEnabled = document.getElementById('f-posteroverlay-enabled');
    const posteroverlayWrap = document.getElementById('f-posteroverlay-wrap');
    const posteroverlayEl = document.getElementById('f-posteroverlay');
    const posteroverlayOpEl = document.getElementById('f-posteroverlayop'), posteroverlayOpVal = document.getElementById('f-posteroverlayop-val');
    if (posteroverlayEnabled) { posteroverlayEnabled.checked = !!e.posterOverlayColor; if (posteroverlayWrap) posteroverlayWrap.style.display = e.posterOverlayColor ? 'block' : 'none'; }
    if (posteroverlayEl) posteroverlayEl.value = e.posterOverlayColor || '#000000';
    if (posteroverlayOpEl) { posteroverlayOpEl.value = e.posterOverlayOpacity !== undefined ? e.posterOverlayOpacity : 20; if (posteroverlayOpVal) posteroverlayOpVal.textContent = posteroverlayOpEl.value; }
    const posterblurEl = document.getElementById('f-posterblur'), posterblurVal = document.getElementById('f-posterblur-val');
    if (posterblurEl) { posterblurEl.value = e.posterBlur !== undefined ? e.posterBlur : 0; if (posterblurVal) posterblurVal.textContent = posterblurEl.value; }
    const postersatEl = document.getElementById('f-postersat'), postersatVal = document.getElementById('f-postersat-val');
    if (postersatEl) { postersatEl.value = e.posterSat !== undefined ? e.posterSat : 100; if (postersatVal) postersatVal.textContent = postersatEl.value; }
    const posterbriEl = document.getElementById('f-posterbri'), posterbriVal = document.getElementById('f-posterbri-val');
    if (posterbriEl) { posterbriEl.value = e.posterBri !== undefined ? e.posterBri : 100; if (posterbriVal) posterbriVal.textContent = posterbriEl.value; }
    const postercontrastEl = document.getElementById('f-postercontrast'), postercontrastVal = document.getElementById('f-postercontrast-val');
    if (postercontrastEl) { postercontrastEl.value = e.posterContrast !== undefined ? e.posterContrast : 100; if (postercontrastVal) postercontrastVal.textContent = postercontrastEl.value; }
    const posterhueEl = document.getElementById('f-posterhue'), posterhueVal = document.getElementById('f-posterhue-val');
    if (posterhueEl) { posterhueEl.value = e.posterHue !== undefined ? e.posterHue : 0; if (posterhueVal) posterhueVal.textContent = posterhueEl.value; }
    const posterSepiaEl = document.getElementById('f-postersepia');
    if (posterSepiaEl) posterSepiaEl.checked = e.posterSepia || false;
    const posterInvertEl = document.getElementById('f-posterinvert');
    if (posterInvertEl) posterInvertEl.checked = e.posterInvert || false;
    const posterposEl = document.getElementById('f-posterpos');
    if (posterposEl) posterposEl.value = e.posterImgPos || '';
    const posterfitEl = document.getElementById('f-posterfit');
    if (posterfitEl) posterfitEl.value = e.posterImgFit || '';
    const postersizeEnabled = document.getElementById('f-postersize-enabled'), postersizeWrap = document.getElementById('f-postersize-wrap');
    const posterwEl = document.getElementById('f-posterw'), posterwVal = document.getElementById('f-posterw-val');
    const posterhEl = document.getElementById('f-posterh'), posterhVal = document.getElementById('f-posterh-val');
    const hasPosterSize = e.posterWidth !== undefined || e.posterHeight !== undefined;
    if (postersizeEnabled) { postersizeEnabled.checked = hasPosterSize; if (postersizeWrap) postersizeWrap.style.display = hasPosterSize ? 'block' : 'none'; }
    if (posterwEl) { posterwEl.value = e.posterWidth || 80; if (posterwVal) posterwVal.textContent = posterwEl.value; }
    if (posterhEl) { posterhEl.value = e.posterHeight || 112; if (posterhVal) posterhVal.textContent = posterhEl.value; }
    const posteropacityEl = document.getElementById('f-posteropacity'), posteropacityVal = document.getElementById('f-posteropacity-val');
    if (posteropacityEl) { posteropacityEl.value = e.posterOpacity !== undefined ? e.posterOpacity : 100; if (posteropacityVal) posteropacityVal.textContent = posteropacityEl.value; }

    const hasAdvanced = e.tagColor || e.tagSat !== undefined || e.tagSize !== undefined || e.tagShapeOverride ||
      e.tagBri !== undefined || e.tagOpacity !== undefined || e.tagBorderWidth !== undefined ||
      e.tagBold || e.tagItalic || e.tagGlow || e.tagBgColor ||
      e.posterOverlayColor || e.posterBlur !== undefined || e.posterSat !== undefined ||
      e.posterBri !== undefined || e.posterContrast !== undefined || e.posterHue !== undefined ||
      e.posterSepia || e.posterInvert || e.posterImgPos || e.posterImgFit ||
      e.posterWidth || e.posterHeight || e.posterOpacity !== undefined;
    if (hasAdvanced) {
      _entryAdvOpen = true;
      if (advPanel) advPanel.style.display = 'block';
      if (advArrow) advArrow.textContent = '▼';
    }
    updateScorePreview(); renderTagSwatch();
  } else {
    document.getElementById('form-title').textContent = '＋ YENİ ANİME';
    ['f-name','f-title','f-watched','f-desc','f-img-url'].forEach(fid => document.getElementById(fid).value = '');
    document.getElementById('f-score').value = '';
    document.getElementById('img-prev').style.display  = 'none';
    document.getElementById('img-label').style.display = 'block';
    document.getElementById('score-preview').innerHTML = '';
    document.getElementById('f-tagcolor').value = '#e040fb';
    // Reset etiket alanları
    const _r = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    const _rv = (id, vid, val, fmt) => { const el = document.getElementById(id); if (el) { el.value = val; const v = document.getElementById(vid); if (v) v.textContent = fmt ? fmt(val) : val; } };
    _rv('f-tagsat','f-tagsat-val',100);
    _rv('f-tagsize','f-tagsize-val',0.65, v => parseFloat(v).toFixed(2));
    _rv('f-tagbri','f-tagbri-val',100);
    _rv('f-tagopacity','f-tagopacity-val',100);
    _rv('f-tagborder','f-tagborder-val',1);
    const shapeEl = document.getElementById('f-tagshape'); if (shapeEl) shapeEl.value = '';
    const boldEl = document.getElementById('f-tagbold'); if (boldEl) boldEl.checked = false;
    const italicEl = document.getElementById('f-tagitalic'); if (italicEl) italicEl.checked = false;
    const glowEl = document.getElementById('f-tagglow'); if (glowEl) glowEl.checked = false;
    const glowWrap = document.getElementById('f-tagglow-wrap'); if (glowWrap) glowWrap.style.display = 'none';
    _rv('f-tagglowint','f-tagglowint-val',6);
    const tagBgEnabled = document.getElementById('f-tagbg-enabled'); if (tagBgEnabled) tagBgEnabled.checked = false;
    // Reset poster alanları
    const poe = document.getElementById('f-posteroverlay-enabled'); if (poe) poe.checked = false;
    const pow = document.getElementById('f-posteroverlay-wrap'); if (pow) pow.style.display = 'none';
    _rv('f-posteroverlayop','f-posteroverlayop-val',20);
    _rv('f-posterblur','f-posterblur-val',0);
    _rv('f-postersat','f-postersat-val',100);
    _rv('f-posterbri','f-posterbri-val',100);
    _rv('f-postercontrast','f-postercontrast-val',100);
    _rv('f-posterhue','f-posterhue-val',0);
    const sepiaEl = document.getElementById('f-postersepia'); if (sepiaEl) sepiaEl.checked = false;
    const invertEl = document.getElementById('f-posterinvert'); if (invertEl) invertEl.checked = false;
    const posterposEl = document.getElementById('f-posterpos'); if (posterposEl) posterposEl.value = '';
    const posterfitEl = document.getElementById('f-posterfit'); if (posterfitEl) posterfitEl.value = '';
    const psizeEnabled = document.getElementById('f-postersize-enabled'); if (psizeEnabled) psizeEnabled.checked = false;
    const psizeWrap = document.getElementById('f-postersize-wrap'); if (psizeWrap) psizeWrap.style.display = 'none';
    _rv('f-posterw','f-posterw-val',80);
    _rv('f-posterh','f-posterh-val',112);
    _rv('f-posteropacity','f-posteropacity-val',100);
    renderTagSwatch();
  }

  renderLayersPicker();
  renderCustomFieldInputs(id);
  document.getElementById('form-overlay').classList.add('on');
}

function closeForm() {
  document.getElementById('form-overlay').classList.remove('on');
}

function clearFormErrors() {
  ['name','title','watched','score','desc','layers'].forEach(f => {
    const el = document.getElementById('err-' + f); if (el) el.classList.remove('show');
  });
  const ei = document.getElementById('err-img'); if (ei) ei.classList.remove('show');
}

function toggleEntryAdvSettings() {
  _entryAdvOpen = !_entryAdvOpen;
  const panel = document.getElementById('entry-adv-panel');
  const arrow = document.getElementById('entry-adv-arrow');
  if (panel) panel.style.display = _entryAdvOpen ? 'block' : 'none';
  if (arrow) arrow.textContent = _entryAdvOpen ? '▼' : '▶';
}

function updateFormImgPreview() {
  const url  = document.getElementById('f-img-url').value.trim();
  const prev = document.getElementById('img-prev');
  const lbl  = document.getElementById('img-label');
  const err  = document.getElementById('err-img');
  if (!url) {
    AppState.formImg = null; prev.style.display = 'none'; lbl.style.display = 'block'; err.classList.remove('show'); return;
  }
  const img = new Image();
  img.onload = () => { err.classList.remove('show'); AppState.formImg = url; prev.src = url; prev.style.display = 'block'; lbl.style.display = 'none'; };
  img.onerror = () => { AppState.formImg = null; prev.style.display = 'none'; lbl.style.display = 'block'; err.textContent = 'Görsel yüklenemedi. URL doğru mu?'; err.classList.add('show'); };
  img.src = url;
}

// ─────────────────────────────────────────
//  GÖRSEL UPLOAD (Catbox.moe & Imgbb)
// ─────────────────────────────────────────
let _uploadProvider = 'catbox'; // 'catbox' | 'imgbb'
let _imgbbApiKey    = '';

function openImgUploadPicker() {
  const existing = document.getElementById('img-upload-modal');
  if (existing) { existing.remove(); return; }

  const modal = document.createElement('div');
  modal.id = 'img-upload-modal';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);
  `;

  const box = document.createElement('div');
  box.style.cssText = `
    background:var(--card);border:1px solid var(--border);border-radius:6px;
    padding:1.2rem 1.4rem;width:min(92vw,380px);display:flex;flex-direction:column;gap:0.8rem;
    font-family:inherit;
  `;

  box.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <span style="font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;font-weight:700;color:var(--accent);">🖼 Görsel Yükle</span>
      <button id="img-upload-close" style="background:transparent;border:none;color:var(--muted);font-size:1rem;cursor:pointer;line-height:1;padding:0.1rem 0.3rem;">✕</button>
    </div>

    <!-- Servis seçimi -->
    <div style="display:flex;gap:0.4rem;">
      <button id="upbtn-catbox" onclick="setUploadProvider('catbox')"
        style="flex:1;padding:0.4rem;font-family:inherit;font-size:0.62rem;letter-spacing:0.06em;text-transform:uppercase;border-radius:3px;cursor:pointer;transition:all 0.15s;
               background:${_uploadProvider==='catbox'?'var(--accent)':'var(--surface)'};
               color:${_uploadProvider==='catbox'?'#000':'var(--muted)'};
               border:1px solid ${_uploadProvider==='catbox'?'var(--accent)':'var(--border)'};">
        Catbox.moe<br><span style="font-size:0.5rem;opacity:0.7;">Anonim · Ücretsiz</span>
      </button>
      <button id="upbtn-imgbb" onclick="setUploadProvider('imgbb')"
        style="flex:1;padding:0.4rem;font-family:inherit;font-size:0.62rem;letter-spacing:0.06em;text-transform:uppercase;border-radius:3px;cursor:pointer;transition:all 0.15s;
               background:${_uploadProvider==='imgbb'?'var(--accent)':'var(--surface)'};
               color:${_uploadProvider==='imgbb'?'#000':'var(--muted)'};
               border:1px solid ${_uploadProvider==='imgbb'?'var(--accent)':'var(--border)'};">
        ImgBB<br><span style="font-size:0.5rem;opacity:0.7;">API key gerekli</span>
      </button>
    </div>

    <!-- ImgBB API key alanı -->
    <div id="imgbb-key-wrap" style="display:${_uploadProvider==='imgbb'?'flex':'none'};flex-direction:column;gap:0.3rem;">
      <label style="font-size:0.55rem;color:var(--muted);letter-spacing:0.08em;text-transform:uppercase;">ImgBB API Key
        <a href="https://api.imgbb.com/" target="_blank" style="color:var(--accent);margin-left:0.3rem;font-size:0.5rem;">↗ Al</a>
      </label>
      <input id="imgbb-api-key-inp" type="text" placeholder="Buraya yapıştır…" value="${_imgbbApiKey}"
        style="background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:0.72rem;padding:0.38rem 0.5rem;border-radius:2px;outline:none;width:100%;">
    </div>

    <!-- Dosya seçici -->
    <div>
      <label style="font-size:0.55rem;color:var(--muted);letter-spacing:0.08em;text-transform:uppercase;display:block;margin-bottom:0.35rem;">Dosya Seç (jpg, png, webp, gif)</label>
      <label id="img-file-label" style="
        display:flex;align-items:center;justify-content:center;gap:0.5rem;
        border:1px dashed var(--border);border-radius:4px;padding:0.8rem;
        cursor:pointer;transition:border-color 0.2s;font-size:0.65rem;color:var(--muted);">
        📁 Dosya seç veya sürükle
        <input type="file" id="img-file-input" accept="image/*" style="display:none;">
      </label>
      <div id="img-file-name" style="font-size:0.58rem;color:var(--muted);margin-top:0.25rem;min-height:0.9rem;"></div>
    </div>

    <!-- Yükle butonu -->
    <button id="img-upload-btn" onclick="doImageUpload()"
      style="background:var(--accent);color:#000;border:none;font-family:inherit;font-size:0.65rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:0.5rem;border-radius:3px;cursor:pointer;transition:opacity 0.2s;">
      ⬆ Yükle
    </button>

    <!-- Durum -->
    <div id="img-upload-status" style="font-size:0.62rem;color:var(--muted);text-align:center;min-height:1rem;"></div>
  `;

  modal.appendChild(box);
  document.body.appendChild(modal);

  document.getElementById('img-upload-close').onclick = () => modal.remove();
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  const fileInp = document.getElementById('img-file-input');
  fileInp.addEventListener('change', () => {
    const name = fileInp.files[0] ? fileInp.files[0].name : '';
    document.getElementById('img-file-name').textContent = name ? '📎 ' + name : '';
  });

  // Sürükle-bırak
  const lbl = document.getElementById('img-file-label');
  lbl.addEventListener('dragover', e => { e.preventDefault(); lbl.style.borderColor = 'var(--accent)'; });
  lbl.addEventListener('dragleave', () => { lbl.style.borderColor = 'var(--border)'; });
  lbl.addEventListener('drop', e => {
    e.preventDefault(); lbl.style.borderColor = 'var(--border)';
    if (e.dataTransfer.files[0]) {
      fileInp.files = e.dataTransfer.files;
      document.getElementById('img-file-name').textContent = '📎 ' + e.dataTransfer.files[0].name;
    }
  });
}

function setUploadProvider(p) {
  _uploadProvider = p;
  // Buton stillerini güncelle
  const cb = document.getElementById('upbtn-catbox');
  const ib = document.getElementById('upbtn-imgbb');
  const kw = document.getElementById('imgbb-key-wrap');
  if (cb) {
    cb.style.background = p === 'catbox' ? 'var(--accent)' : 'var(--surface)';
    cb.style.color      = p === 'catbox' ? '#000' : 'var(--muted)';
    cb.style.borderColor= p === 'catbox' ? 'var(--accent)' : 'var(--border)';
  }
  if (ib) {
    ib.style.background = p === 'imgbb' ? 'var(--accent)' : 'var(--surface)';
    ib.style.color      = p === 'imgbb' ? '#000' : 'var(--muted)';
    ib.style.borderColor= p === 'imgbb' ? 'var(--accent)' : 'var(--border)';
  }
  if (kw) kw.style.display = p === 'imgbb' ? 'flex' : 'none';
}

async function doImageUpload() {
  const fileInp = document.getElementById('img-file-input');
  const statusEl = document.getElementById('img-upload-status');
  const uploadBtn = document.getElementById('img-upload-btn');

  if (!fileInp || !fileInp.files[0]) {
    statusEl.style.color = '#ff6060';
    statusEl.textContent = '⚠ Önce bir dosya seç.'; return;
  }

  const file = fileInp.files[0];
  if (file.size > 20 * 1024 * 1024) {
    statusEl.style.color = '#ff6060';
    statusEl.textContent = '⚠ Dosya 20MB\'den büyük olamaz.'; return;
  }

  uploadBtn.disabled = true; uploadBtn.style.opacity = '0.5';
  statusEl.style.color = 'var(--muted)';
  statusEl.textContent = '⏳ Yükleniyor…';

  try {
    let resultUrl = '';

    if (_uploadProvider === 'catbox') {
      // Catbox.moe anonim upload
      const fd = new FormData();
      fd.append('reqtype', 'fileupload');
      fd.append('fileToUpload', file);
      const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Catbox sunucu hatası: ' + res.status);
      const text = await res.text();
      if (!text.startsWith('https://')) throw new Error('Beklenmedik yanıt: ' + text.slice(0, 80));
      resultUrl = text.trim();

    } else {
      // ImgBB upload
      const keyInp = document.getElementById('imgbb-api-key-inp');
      const key = keyInp ? keyInp.value.trim() : _imgbbApiKey;
      if (!key) { throw new Error('ImgBB API key boş. "↗ Al" linkinden ücretsiz alabilirsin.'); }
      _imgbbApiKey = key;
      const fd = new FormData(); fd.append('image', file);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(key)}`, { method: 'POST', body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'ImgBB hatası');
      resultUrl = json.data.url;
    }

    // URL input'una yaz ve önizlemeyi güncelle
    const urlInp = document.getElementById('f-img-url');
    if (urlInp) { urlInp.value = resultUrl; updateFormImgPreview(); }

    statusEl.style.color = '#4caf50';
    statusEl.textContent = '✓ Yüklendi! URL forma aktarıldı.';
    setTimeout(() => { const m = document.getElementById('img-upload-modal'); if (m) m.remove(); }, 1200);

  } catch (err) {
    statusEl.style.color = '#ff6060';
    statusEl.textContent = '✕ ' + err.message;
    uploadBtn.disabled = false; uploadBtn.style.opacity = '1';
  }
}

// ─────────────────────────────────────────
//  ÖZEL ALAN (CUSTOM FIELD) FORM RENDERI
// ─────────────────────────────────────────
function renderCustomFieldInputs(editId) {
  const l = getList(AppState.formListId);
  const container = document.getElementById('custom-fields-form-wrap');
  if (!container) return;
  container.innerHTML = '';
  if (!l || !l.customFields || !l.customFields.length) return;

  const existingEntry = editId ? (l.entries.find(x => x.id === editId) || {}) : {};
  const vals = existingEntry.customFieldValues || {};

  l.customFields.forEach(field => {
    const div = document.createElement('div');
    div.className = 'field';
    const req = field.required ? ' *' : ' <span style="opacity:0.4">(isteğe bağlı)</span>';
    div.innerHTML = `<label>${escHtml(field.label)}${req}</label>`;

    let inp;
    if (field.type === 'select') {
      inp = document.createElement('select');
      inp.style.cssText = 'width:100%;background:var(--card);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:0.8rem;padding:0.45rem 0.65rem;border-radius:2px;outline:none;';
      const emptyOpt = document.createElement('option'); emptyOpt.value = ''; emptyOpt.textContent = '— Seç —'; inp.appendChild(emptyOpt);
      (field.options || []).forEach(opt => {
        const o = document.createElement('option'); o.value = opt; o.textContent = opt;
        if (vals[field.id] === opt) o.selected = true;
        inp.appendChild(o);
      });
    } else if (field.type === 'number') {
      inp = document.createElement('input');
      inp.type = 'number'; inp.step = 'any';
      inp.value = vals[field.id] !== undefined ? vals[field.id] : '';
      inp.style.cssText = 'width:100%;background:var(--card);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:0.8rem;padding:0.45rem 0.65rem;border-radius:2px;outline:none;';
    } else {
      inp = document.createElement('input');
      inp.type = 'text';
      inp.value = vals[field.id] || '';
      inp.placeholder = field.placeholder || '';
      inp.style.cssText = 'width:100%;background:var(--card);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:0.8rem;padding:0.45rem 0.65rem;border-radius:2px;outline:none;';
    }
    inp.dataset.fieldId = field.id;
    inp.className = 'custom-field-input';
    div.appendChild(inp);
    container.appendChild(div);
  });
}

function collectCustomFieldValues() {
  const values = {};
  document.querySelectorAll('.custom-field-input').forEach(inp => {
    values[inp.dataset.fieldId] = inp.value;
  });
  return values;
}

// ─────────────────────────────────────────
//  KAYDET
// ─────────────────────────────────────────
function saveEntry() {
  clearFormErrors(); let ok = true;
  const name    = document.getElementById('f-name').value.trim();
  const title   = document.getElementById('f-title').value.trim();
  const watched = document.getElementById('f-watched').value.trim();
  const score   = parseScore(document.getElementById('f-score').value);
  const desc    = document.getElementById('f-desc').value.trim();

  if (!name)                             { document.getElementById('err-name').classList.add('show'); ok = false; }
  if (!title)                            { document.getElementById('err-title').classList.add('show'); ok = false; }
  if (!watched)                          { document.getElementById('err-watched').classList.add('show'); ok = false; }
  if (isNaN(score) || score < 0 || score > 5) { document.getElementById('err-score').classList.add('show'); ok = false; }
  if (!desc)                             { document.getElementById('err-desc').classList.add('show'); ok = false; }

  const _l = getList(AppState.formListId);
  if (_l && _l.id !== 'main' && _l.customTiers && _l.customTiers.length > 0 && AppState.formLayerIds.length === 0) {
    document.getElementById('err-layers').classList.add('show'); ok = false;
  }
  if (!ok) return;

  const l = getList(AppState.formListId); if (!l) return;
  const satEl   = document.getElementById('f-tagsat');  const tagSat = satEl   ? parseInt(satEl.value)   : 100;
  const sizeEl  = document.getElementById('f-tagsize'); const tagSize = sizeEl ? parseFloat(sizeEl.value) : 0.65;
  const shapeEl = document.getElementById('f-tagshape'); const tagShapeOverride = shapeEl ? (shapeEl.value || null) : null;
  // Yeni etiket alanları
  const briEl    = document.getElementById('f-tagbri');     const tagBri = briEl ? parseInt(briEl.value) : 100;
  const opEl     = document.getElementById('f-tagopacity'); const tagOpacity = opEl ? parseInt(opEl.value) : 100;
  const borderEl = document.getElementById('f-tagborder');  const tagBorderWidth = borderEl ? parseFloat(borderEl.value) : 1;
  const boldEl   = document.getElementById('f-tagbold');    const tagBold = boldEl ? boldEl.checked : false;
  const italicEl = document.getElementById('f-tagitalic');  const tagItalic = italicEl ? italicEl.checked : false;
  const glowEl   = document.getElementById('f-tagglow');    const tagGlow = glowEl ? glowEl.checked : false;
  const glowIntEl= document.getElementById('f-tagglowint'); const tagGlowIntensity = glowIntEl ? parseInt(glowIntEl.value) : 6;
  const tagBgEnabledEl = document.getElementById('f-tagbg-enabled');
  const tagBgEl  = document.getElementById('f-tagbg');      const tagBgColor = (tagBgEnabledEl && tagBgEnabledEl.checked && tagBgEl) ? tagBgEl.value : null;
  // Poster alanları
  const poeEl   = document.getElementById('f-posteroverlay-enabled');
  const povEl   = document.getElementById('f-posteroverlay');     const posterOverlayColor = (poeEl && poeEl.checked && povEl) ? povEl.value : null;
  const popEl   = document.getElementById('f-posteroverlayop');   const posterOverlayOpacity = popEl ? parseInt(popEl.value) : 20;
  const pblEl   = document.getElementById('f-posterblur');        const posterBlur = pblEl ? parseFloat(pblEl.value) : 0;
  const psatEl  = document.getElementById('f-postersat');         const posterSat = psatEl ? parseInt(psatEl.value) : 100;
  const pbriEl  = document.getElementById('f-posterbri');         const posterBri = pbriEl ? parseInt(pbriEl.value) : 100;
  const pconEl  = document.getElementById('f-postercontrast');    const posterContrast = pconEl ? parseInt(pconEl.value) : 100;
  const phueEl  = document.getElementById('f-posterhue');         const posterHue = phueEl ? parseInt(phueEl.value) : 0;
  const psepEl  = document.getElementById('f-postersepia');       const posterSepia = psepEl ? psepEl.checked : false;
  const pinvEl  = document.getElementById('f-posterinvert');      const posterInvert = pinvEl ? pinvEl.checked : false;
  const pposEl  = document.getElementById('f-posterpos');         const posterImgPos = pposEl ? (pposEl.value || null) : null;
  const pfitEl  = document.getElementById('f-posterfit');         const posterImgFit = pfitEl ? (pfitEl.value || null) : null;
  const psizeEnabledEl = document.getElementById('f-postersize-enabled');
  const pwEl    = document.getElementById('f-posterw');           const posterWidth = (psizeEnabledEl && psizeEnabledEl.checked && pwEl) ? parseInt(pwEl.value) : undefined;
  const phEl    = document.getElementById('f-posterh');           const posterHeight = (psizeEnabledEl && psizeEnabledEl.checked && phEl) ? parseInt(phEl.value) : undefined;
  const popacityEl = document.getElementById('f-posteropacity');  const posterOpacity = popacityEl ? parseInt(popacityEl.value) : 100;
  const customFieldValues = collectCustomFieldValues();

  const entryData = {
    name, title, watched, score, desc,
    img: AppState.formImg, tagColor: AppState.formTagColor || null,
    customLayers: [...AppState.formLayerIds],
    tagSat, tagSize, tagShapeOverride,
    tagBri, tagOpacity, tagBorderWidth, tagBold, tagItalic,
    tagGlow, tagGlowIntensity, tagBgColor,
    posterOverlayColor, posterOverlayOpacity, posterBlur,
    posterSat, posterBri, posterContrast, posterHue,
    posterSepia, posterInvert, posterImgPos, posterImgFit,
    posterWidth, posterHeight, posterOpacity,
    customFieldValues,
  };

  if (AppState.editEntryId) {
    const idx = l.entries.findIndex(e => e.id === AppState.editEntryId);
    if (idx > -1) l.entries[idx] = { ...l.entries[idx], ...entryData };
  } else {
    l.entries.push({ id: genId(), ...entryData });
  }
  saveData(); renderTierPage(); closeForm();
}

// ─────────────────────────────────────────
//  SCORE INPUT
// ─────────────────────────────────────────
function onScoreInput() { updateScorePreview(); }
function onScoreKey(e) { if (e.key === 'ArrowUp') { e.preventDefault(); stepScore(0.1); } if (e.key === 'ArrowDown') { e.preventDefault(); stepScore(-0.1); } }
function stepScore(d) {
  const inp = document.getElementById('f-score');
  inp.value = Math.round(Math.min(5, Math.max(0, (parseScore(inp.value) || 0) + d)) * 10) / 10;
  updateScorePreview();
}
function updateScorePreview() {
  const sc = parseScore(document.getElementById('f-score').value);
  const c  = document.getElementById('score-preview');
  if (isNaN(sc) || sc < 0 || sc > 5) { c.innerHTML = ''; return; }
  c.innerHTML = partialStarsHtml(sc, getTierColor(getTier(sc)), '1.3rem');
}

// ─────────────────────────────────────────
//  TAG COLOR
// ─────────────────────────────────────────
function onTagColorPick()  { AppState.formTagColor = document.getElementById('f-tagcolor').value; renderTagSwatch(); }
function onTagBgPick()     { /* değer zaten input'ta, kayıt sırasında okunur */ }
function onTagBgEnabledChange() { /* checkbox onChange, kayıt sırasında kontrol edilir */ }
function clearTagBg() {
  const el = document.getElementById('f-tagbg-enabled'); if (el) el.checked = false;
  const bg = document.getElementById('f-tagbg'); if (bg) bg.value = '#131320';
}
function onTagGlowChange() {
  const glowEl = document.getElementById('f-tagglow');
  const wrap = document.getElementById('f-tagglow-wrap');
  if (wrap) wrap.style.display = glowEl && glowEl.checked ? 'block' : 'none';
}
function onPosterOverlayChange() {
  const el = document.getElementById('f-posteroverlay-enabled');
  const wrap = document.getElementById('f-posteroverlay-wrap');
  if (wrap) wrap.style.display = el && el.checked ? 'block' : 'none';
}
function onPosterSizeChange() {
  const el = document.getElementById('f-postersize-enabled');
  const wrap = document.getElementById('f-postersize-wrap');
  if (wrap) wrap.style.display = el && el.checked ? 'block' : 'none';
}
function randomTagColor()  {
  const h = Math.floor(Math.random() * 360), s = Math.floor(60 + Math.random() * 30), l = Math.floor(50 + Math.random() * 20);
  AppState.formTagColor = hslToHex(h, s, l);
  document.getElementById('f-tagcolor').value = AppState.formTagColor;
  renderTagSwatch();
}
function clearTagColor() { AppState.formTagColor = null; renderTagSwatch(); }
function renderTagSwatch() {
  const el = document.getElementById('tag-color-swatches');
  if (AppState.formTagColor)
    el.innerHTML = `<span style="display:inline-block;width:22px;height:22px;background:${AppState.formTagColor};border:1px solid ${AppState.formTagColor}50;border-radius:2px;"></span><span style="font-size:0.6rem;color:var(--muted)">${AppState.formTagColor}</span>`;
  else
    el.innerHTML = `<span style="font-size:0.6rem;color:var(--muted);opacity:0.5">varsayılan</span>`;
}

// ─────────────────────────────────────────
//  LAYERS PICKER
// ─────────────────────────────────────────
function renderLayersPicker() {
  const l = getList(AppState.formListId);
  const fieldEl  = document.getElementById('field-layers');
  const pickerEl = document.getElementById('layers-picker');
  if (!l || l.id === 'main' || !l.customTiers || l.customTiers.length === 0) {
    if (fieldEl) fieldEl.style.display = 'none'; return;
  }
  if (fieldEl) fieldEl.style.display = '';
  const reqMark = document.getElementById('layers-required-mark');
  const optLabel = document.getElementById('layers-optional-label');
  if (reqMark) reqMark.style.display = 'inline';
  if (optLabel) optLabel.style.display = 'none';
  pickerEl.innerHTML = '';
  l.customTiers.forEach((t, idx) => {
    const row = document.createElement('label');
    row.style.cssText = 'display:flex;align-items:center;gap:0.55rem;cursor:pointer;font-size:0.72rem;padding:0.25rem 0.3rem;border-radius:2px;transition:background 0.15s;';
    row.onmouseenter = () => row.style.background = 'rgba(255,255,255,0.04)';
    row.onmouseleave = () => row.style.background = '';
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.value = t.id; cb.checked = AppState.formLayerIds.includes(t.id);
    cb.style.cssText = 'accent-color:var(--accent);width:14px;height:14px;cursor:pointer;flex-shrink:0;';
    cb.onchange = () => {
      if (cb.checked) { if (!AppState.formLayerIds.includes(t.id)) AppState.formLayerIds.push(t.id); }
      else { AppState.formLayerIds = AppState.formLayerIds.filter(x => x !== t.id); }
      updateLayersBtnLabel(l);
    };
    const num = document.createElement('span'); num.style.cssText = 'font-size:0.52rem;color:var(--muted);min-width:16px;text-align:right;flex-shrink:0;'; num.textContent = (idx + 1) + '.';
    const emoji = document.createElement('span'); emoji.style.cssText = 'font-size:0.9rem;line-height:1;flex-shrink:0;'; emoji.textContent = t.emoji || '⭐';
    const name = document.createElement('span'); name.style.cssText = `color:${t.color || 'var(--accent)'};font-weight:700;letter-spacing:0.03em;`; name.textContent = t.name || 'İsimsiz';
    row.appendChild(cb); row.appendChild(num); row.appendChild(emoji); row.appendChild(name);
    pickerEl.appendChild(row);
  });
  updateLayersBtnLabel(l);
}

function updateLayersBtnLabel(l) {
  const lbl = document.getElementById('layers-btn-label'); if (!lbl) return;
  if (!AppState.formLayerIds.length) { lbl.textContent = 'Katman seç…'; lbl.style.color = 'var(--muted)'; return; }
  const names = AppState.formLayerIds.map(id => { const t = l.customTiers.find(x => x.id === id); return t ? (t.emoji || '⭐') + ' ' + t.name : id; });
  lbl.textContent = names.join(', '); lbl.style.color = 'var(--text)';
}

function toggleLayersPicker() {
  AppState.layersPickerOpen = !AppState.layersPickerOpen;
  const pickerEl = document.getElementById('layers-picker');
  pickerEl.style.display = AppState.layersPickerOpen ? 'flex' : 'none';
  const arrow = document.querySelector('#btn-layers-toggle span:last-child');
  if (arrow) arrow.textContent = AppState.layersPickerOpen ? '▲' : '▼';
}

// ─────────────────────────────────────────
//  DETAIL MODAL
// ─────────────────────────────────────────
function openDetail(id, listId) {
  const l = getList(listId); if (!l) return;
  const e = l.entries.find(x => x.id === id); if (!e) return;
  AppState.detailEntryId = id; AppState.detailListId = listId;

  document.getElementById('d-name').textContent  = e.name;
  document.getElementById('d-stars').innerHTML   = partialStarsHtml(e.score, getTierColor(getTier(e.score)), '1.1rem') + `<span class="detail-score-val">&nbsp;${e.score.toFixed(1)} / 5.0</span>`;
  document.getElementById('d-title').textContent = e.title;
  document.getElementById('d-watched').textContent = e.watched;
  document.getElementById('d-desc').textContent  = e.desc;
  document.getElementById('d-img-wrap').innerHTML = e.img ? `<img class="detail-img" src="${e.img}" alt="${escHtml(e.name)}">` : '';

  // Özel alanları göster
  const cfWrap = document.getElementById('d-custom-fields');
  if (cfWrap) {
    cfWrap.innerHTML = '';
    if (l.customFields && l.customFields.length && e.customFieldValues) {
      l.customFields.forEach(field => {
        const val = e.customFieldValues[field.id];
        if (!val && val !== 0) return;
        const row = document.createElement('div'); row.className = 'detail-fl';
        row.innerHTML = `<div class="detail-fl-label">${escHtml(field.label)}</div><div class="detail-fl-val">${escHtml(String(val))}</div>`;
        cfWrap.appendChild(row);
      });
    }
  }

  document.getElementById('detail-overlay').classList.add('on');
}

function closeDetail() {
  document.getElementById('detail-overlay').classList.remove('on');
  AppState.detailEntryId = null; AppState.detailListId = null;
}

function editEntry() {
  const sid = AppState.detailEntryId, lid = AppState.detailListId;
  const overlay = document.getElementById('detail-overlay');
  overlay.addEventListener('transitionend', () => { AppState.formListId = lid; openForm(sid); }, { once: true });
  closeDetail();
}

function deleteEntry() {
  if (!AppState.detailEntryId) return;
  showConfirm('Sil', 'Bu animeyi silmek istiyor musun?', () => {
    const l = getList(AppState.detailListId);
    if (l) { l.entries = l.entries.filter(e => e.id !== AppState.detailEntryId); saveData(); renderTierPage(); }
    closeDetail();
  });
}

// ─────────────────────────────────────────
//  COPY / PASTE
// ─────────────────────────────────────────
function copyEntry() {
  if (!AppState.detailEntryId) return;
  const l = getList(AppState.detailListId);
  const e = l ? l.entries.find(x => x.id === AppState.detailEntryId) : null; if (!e) return;
  AppState.copiedEntry = { name: e.name, title: e.title, watched: e.watched, score: e.score, desc: e.desc, img: e.img || null, tagColor: e.tagColor || null };
  try { navigator.clipboard.writeText('__al2_entry__' + JSON.stringify(AppState.copiedEntry)); } catch (err) {}
  showInfo('Kopyalandı', 'Entry kopyalandı! Formu açıp "Yapıştır" butonuna bas.');
}

function pasteEntry() {
  const fill = data => {
    if (!data) return;
    document.getElementById('paste-notice').classList.add('show');
    document.getElementById('f-name').value    = data.name    || '';
    document.getElementById('f-title').value   = data.title   || '';
    document.getElementById('f-watched').value = data.watched || '';
    document.getElementById('f-score').value   = data.score !== undefined ? Number(data.score).toFixed(1) : '';
    document.getElementById('f-desc').value    = data.desc  || '';
    AppState.formImg = data.img || null; AppState.formTagColor = data.tagColor || null;
    document.getElementById('f-img-url').value = AppState.formImg || '';
    updateFormImgPreview();
    if (AppState.formTagColor) document.getElementById('f-tagcolor').value = AppState.formTagColor;
    renderTagSwatch(); updateScorePreview();
  };
  if (navigator.clipboard && navigator.clipboard.readText) {
    navigator.clipboard.readText().then(txt => {
      if (txt.startsWith('__al2_entry__')) { try { fill(JSON.parse(txt.slice(13))); return; } catch (e) {} }
      if (AppState.copiedEntry) fill(AppState.copiedEntry);
      else showInfo('Yapıştır', 'Kopyalanmış entry bulunamadı.');
    }).catch(() => { if (AppState.copiedEntry) fill(AppState.copiedEntry); else showInfo('Yapıştır', 'Pano erişimi reddedildi.'); });
  } else {
    if (AppState.copiedEntry) fill(AppState.copiedEntry); else showInfo('Yapıştır', 'Kopyalanmış entry bulunamadı.');
  }
}
