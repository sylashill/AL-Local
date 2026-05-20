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
    const satEl = document.getElementById('f-tagsat'), satValEl = document.getElementById('f-tagsat-val');
    if (satEl) { satEl.value = e.tagSat !== undefined ? e.tagSat : 100; if (satValEl) satValEl.textContent = satEl.value; }
    const sizeEl = document.getElementById('f-tagsize'), sizeValEl = document.getElementById('f-tagsize-val');
    if (sizeEl) { sizeEl.value = e.tagSize !== undefined ? e.tagSize : 0.65; if (sizeValEl) sizeValEl.textContent = parseFloat(sizeEl.value).toFixed(2); }
    const shapeEl = document.getElementById('f-tagshape');
    if (shapeEl) shapeEl.value = e.tagShapeOverride || '';
    if (e.tagColor || e.tagSat !== undefined || e.tagSize !== undefined || e.tagShapeOverride) {
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
    const satEl  = document.getElementById('f-tagsat');  if (satEl)  { satEl.value  = 100;  const sv = document.getElementById('f-tagsat-val');  if (sv) sv.textContent = '100'; }
    const sizeEl = document.getElementById('f-tagsize'); if (sizeEl) { sizeEl.value = 0.65; const sv = document.getElementById('f-tagsize-val'); if (sv) sv.textContent = '0.65'; }
    const shapeEl = document.getElementById('f-tagshape'); if (shapeEl) shapeEl.value = '';
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
  const customFieldValues = collectCustomFieldValues();

  const entryData = {
    name, title, watched, score, desc,
    img: AppState.formImg, tagColor: AppState.formTagColor || null,
    customLayers: [...AppState.formLayerIds],
    tagSat, tagSize, tagShapeOverride,
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
