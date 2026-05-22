// ═══════════════════════════════════════════════════════════════
//  settings.js — Ayarlar paneli, özel katmanlar, görünüm ayarları
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────
//  SETTINGS SAVE / CANCEL
// ─────────────────────────────────────────
/** Kaydedilmemiş değişiklik uyarı çubuğunu gösterir. */
function markSettingsDirty() {
  const bar = document.getElementById('settings-save-bar');
  if (bar) bar.style.display = 'flex';
  const lbl = document.getElementById('settings-save-bar-label');
  if (lbl) lbl.textContent = '⚠ Kaydedilmemiş değişiklikler var';
}

/** Draft ayarları aktif listeye uygular ve kaydeder. */
function saveSettingsNow() {
  if (!AppState.settingsListId || !_settingsListSelected) return;
  const l = getList(AppState.settingsListId); if (!l) return;
  if (_settingsDraft) { Object.assign(l.settings, _settingsDraft); _settingsDraft = null; }
  saveData(true);
  const bar = document.getElementById('settings-save-bar'); if (bar) bar.style.display = 'none';
  showInfo('Kaydedildi', 'Ayarlar "' + l.name + '" listesi için kaydedildi.');
  AppState._lastAppliedListId = null;
}

/** Kaydedilmemiş değişiklikleri iptal eder ve UI'ı sıfırlar. */
function cancelSettingsChanges() {
  _settingsDraft = null;
  const bar = document.getElementById('settings-save-bar'); if (bar) bar.style.display = 'none';
  loadSettingsUI(AppState.settingsListId);
}

// ─────────────────────────────────────────
//  SETTINGS PANEL RENDER
// ─────────────────────────────────────────
/** Ayarlar panelini (liste seçimi + dinamik içerik) render eder. */
function renderSettingsPanel() {
  const btnsContainer = document.getElementById('settings-list-btns');
  if (btnsContainer) {
    btnsContainer.innerHTML = '';
    lists.forEach(l => {
      const isActive = l.id === AppState.settingsListId && _settingsListSelected;
      const btn = document.createElement('button');
      btn.style.cssText = `
        display:flex;align-items:center;gap:0.7rem;
        background:${isActive ? 'rgba(224,64,251,0.10)' : 'var(--card)'};
        border:1px solid ${isActive ? 'var(--accent)' : 'var(--border)'};
        color:${isActive ? 'var(--accent)' : 'var(--text)'};
        font-family:inherit;font-size:0.78rem;
        padding:0.55rem 0.9rem;border-radius:3px;cursor:pointer;
        text-align:left;width:100%;
        transition:background 0.2s,border-color 0.2s,color 0.2s;
        letter-spacing:0.03em;
      `;
      btn.innerHTML = `
        <span style="font-size:0.85rem;opacity:0.7;">${l.id === 'main' ? '★' : '◈'}</span>
        <span style="flex:1;">${escHtml(l.name)}</span>
        <span style="font-size:0.55rem;color:var(--muted);letter-spacing:0.06em;">${l.entries.length} anime</span>
        ${isActive ? '<span style="font-size:0.6rem;color:var(--accent);">▶</span>' : ''}
      `;
      btn.onmouseenter = () => { if (!isActive) { btn.style.borderColor = 'var(--text)'; btn.style.color = 'var(--text)'; } };
      btn.onmouseleave = () => { if (!isActive) { btn.style.borderColor = 'var(--border)'; btn.style.color = 'var(--text)'; } };
      btn.addEventListener('click', () => onSettingsListSelect(l.id));
      btnsContainer.appendChild(btn);
    });
  }

  if (!_settingsListSelected) return;

  ['s-list-mgmt','settings-dynamic-content','settings-io-section','settings-readable-section',
   'settings-data-divider','settings-readable-divider'].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.display = '';
  });

  renderListMgmtPanel();
  buildSettingsDynamicContent();
  loadSettingsUI(AppState.settingsListId);
  renderCustomTierBuilder();
  renderCustomFieldsManager();
}

/** Liste seçildiğinde; kaydedilmemiş değişiklik varsa onay ister. */
function onSettingsListSelect(id) {
  if (_settingsDraft && Object.keys(_settingsDraft).length > 0 && AppState.settingsListId !== id) {
    showConfirm('Kaydedilmemiş Değişiklikler', 'Mevcut değişiklikler kaydedilmedi. Çıkmak istiyor musun?', () => {
      _settingsDraft = null;
      const bar = document.getElementById('settings-save-bar'); if (bar) bar.style.display = 'none';
      AppState.settingsListId = id; _settingsListSelected = true; renderSettingsPanel();
    });
    return;
  }
  AppState.settingsListId = id; _settingsListSelected = true; _settingsDraft = null;
  const bar = document.getElementById('settings-save-bar'); if (bar) bar.style.display = 'none';
  renderSettingsPanel();
}

/** onSettingsListSelect için alias. */
function onSettingsListChange(id) { onSettingsListSelect(id); }

// ─────────────────────────────────────────
//  DYNAMIC SETTINGS CONTENT — ALT FONKSİYONLAR
// ─────────────────────────────────────────

/** Görünüm bölümünün (renkler, font, şeffaflık, arka plan) HTML'ini döndürür. */
function renderAppearanceSection() {
  return `
    <!-- APPEARANCE -->
    <div class="settings-section">
      <h2>Görünüm</h2>

      <!-- Tema Preset'leri -->
      <div style="margin-bottom:1.2rem;">
        <div style="font-size:0.6rem;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.5rem;">Hızlı Tema Preset</div>
        <div id="theme-presets-wrap" style="display:flex;flex-wrap:wrap;gap:0.4rem;"></div>
      </div>

      <!-- Font -->
      <div style="margin-bottom:1rem;">
        <div style="font-size:0.6rem;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.4rem;">Font</div>
        <div style="position:relative;margin-bottom:0.4rem;">
          <input type="text" id="font-search" placeholder="Font ara… (örn: Mono, Pixel)" autocomplete="off"
            style="width:100%;background:var(--card);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:0.75rem;padding:0.4rem 0.5rem;border-radius:2px 2px 0 0;outline:none;box-sizing:border-box;"
            oninput="filterFontList(this.value)">
          <select id="font-select" size="6"
            style="width:100%;background:var(--card);border:1px solid var(--border);border-top:none;color:var(--text);font-family:inherit;font-size:0.72rem;padding:0.2rem 0;border-radius:0 0 2px 2px;outline:none;cursor:pointer;display:block;"
            onchange="applyFontSetting()">
            ${GOOGLE_FONTS.map(f => `<option value="${f}">${f}</option>`).join('')}
          </select>
        </div>
        <div class="font-preview" id="font-preview">Anime listesi — サンプルテキスト — 0123456789</div>
      </div>

      <!-- Font Boyutu -->
      <div style="margin-bottom:1rem;">
        <div style="font-size:0.6rem;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.4rem;">Font Boyutu</div>
        <div style="display:flex;align-items:center;gap:0.6rem;">
          <input type="range" id="font-size-range" min="10" max="22" step="1" value="14"
            style="flex:1;" oninput="applyFontSizeSetting(this.value)">
          <span id="vd-fontsize" style="font-size:0.65rem;color:var(--muted);min-width:28px;text-align:right;">14px</span>
        </div>
      </div>

      <!-- Renkler -->
      <div class="settings-grid">
        <div class="setting-item"><label>Arka Plan</label><input type="color" id="col-bg" value="#08080f" oninput="applyColorSetting('bg',this.value)"></div>
        <div class="setting-item"><label>Yüzey</label><input type="color" id="col-surface" value="#0e0e1a" oninput="applyColorSetting('surface',this.value)"></div>
        <div class="setting-item"><label>Kart</label><input type="color" id="col-card" value="#131320" oninput="applyColorSetting('card',this.value)"></div>
        <div class="setting-item"><label>Kenarlık</label><input type="color" id="col-border" value="#1f1f35" oninput="applyColorSetting('border',this.value)"></div>
        <div class="setting-item"><label>Metin</label><input type="color" id="col-text" value="#ddddf5" oninput="applyColorSetting('text',this.value)"></div>
        <div class="setting-item"><label>Vurgu</label><input type="color" id="col-accent" value="#e040fb" oninput="applyColorSetting('accent',this.value)"></div>
        <div class="setting-item full-col"><label>Nav Şeffaflığı</label><input type="range" id="op-nav" min="0" max="100" value="90" oninput="applyOpacitySetting('nav',this.value)"><div class="val-disp" id="vd-nav">%90</div></div>
        <div class="setting-item full-col"><label>Modal Şeffaflığı</label><input type="range" id="op-modal" min="10" max="100" value="100" oninput="applyOpacitySetting('modal',this.value)"><div class="val-disp" id="vd-modal">%100</div></div>
        <div class="setting-item full-col"><label>Kart Şeffaflığı</label><input type="range" id="op-card" min="0" max="100" value="100" oninput="applyOpacitySetting('card',this.value)"><div class="val-disp" id="vd-card">%100</div></div>
        <div class="setting-item full-col"><label>Yüzey Şeffaflığı</label><input type="range" id="op-surface" min="0" max="100" value="100" oninput="applyOpacitySetting('surface',this.value)"><div class="val-disp" id="vd-surface">%100</div></div>
        <div class="setting-item full-col"><label>Kenarlık Şeffaflığı</label><input type="range" id="op-border" min="0" max="100" value="100" oninput="applyOpacitySetting('border',this.value)"><div class="val-disp" id="vd-border">%100</div></div>
        <div class="setting-item full-col"><label>Etiket Şeffaflığı</label><input type="range" id="op-tag" min="10" max="100" value="100" oninput="applyOpacitySetting('tag',this.value)"><div class="val-disp" id="vd-tag">%100</div></div>
        <div class="setting-item full-col"><label>UI Doygunluğu</label><input type="range" id="ui-sat" min="0" max="150" value="100" oninput="applyOpacitySetting('sat',this.value)"><div class="val-disp" id="vd-sat">%100</div></div>
        <div class="setting-item full-col"><label>UI Parlaklığı</label><input type="range" id="ui-bri" min="20" max="150" value="100" oninput="applyOpacitySetting('bri',this.value)"><div class="val-disp" id="vd-bri">%100</div></div>
        <div class="setting-item full-col"><label>Katmanlar Arası Boşluk</label><input type="range" id="tier-gap" min="0" max="48" value="8" oninput="applyTierGapSetting(this.value)"><div class="val-disp" id="vd-tiergap">8px</div></div>
      </div>
    </div>

    <!-- BG IMAGE -->
    <div class="settings-section">
      <h2>Arka Plan Görsel URL</h2>
      <div class="bg-upload-row">
        <input type="text" id="bg-img-url" placeholder="https://..." oninput="applyBgUrlSetting()" style="width:100%;background:var(--card);border:1px solid var(--border);color:var(--text);padding:0.5rem;border-radius:4px;margin-bottom:0.5rem;">
        <div class="bg-img-drop" style="cursor:default;min-height:40px;display:flex;align-items:center;justify-content:center;">
          <img class="bg-preview" id="bg-preview-img" style="display:none;max-height:100px;">
          <p id="bg-drop-label">🖼 URL girildiğinde önizleme görünecek</p>
        </div>
        <button class="btn-clear-bg" onclick="clearBg()">Kaldır</button>
      </div>
      <div style="margin-top:0.8rem;">
        <div class="setting-item"><label>Görsel Opaklığı</label><input type="range" id="bg-opacity" min="0" max="100" value="18" oninput="applyBgOpacity()"><div class="val-disp" id="vd-bgop">%18</div></div>
      </div>
    </div>

    <!-- CUSTOM TIERS -->
    <div class="settings-section">
      <h2>Özel Katmanlar <span id="custom-tier-list-label" style="font-size:0.6rem;color:var(--muted);font-weight:400;text-transform:lowercase;letter-spacing:0"></span></h2>
      <p style="font-size:0.62rem;color:var(--muted);margin-bottom:0.9rem;line-height:1.7;">Seçili listeye ait özel katmanlar. Emoji, isim, renk, banner ve görünürlük ayarlanabilir.</p>
      <div class="custom-tier-list" id="custom-tier-builder"></div>
      <button class="btn-add-tier" onclick="addCustomTier()">＋ Yeni Katman Ekle</button>
    </div>

    <!-- CUSTOM FIELDS -->
    <div class="settings-section">
      <h2>Özel Alanlar <span id="custom-fields-list-label" style="font-size:0.6rem;color:var(--muted);font-weight:400;text-transform:lowercase;letter-spacing:0"></span></h2>
      <p style="font-size:0.62rem;color:var(--muted);margin-bottom:0.9rem;line-height:1.7;">Anime formuna ek alanlar ekle: Yönetmen, Stüdyo, Bölüm Sayısı, vb. Her liste için ayrı alan seti tanımlanabilir.</p>
      <div class="custom-fields-list" id="custom-fields-builder"></div>
      <button class="btn-add-tier" onclick="addCustomField()">＋ Yeni Alan Ekle</button>
    </div>

    <!-- ŞABLON -->
    <div class="settings-section">
      <h2>Liste Şablonu</h2>
      <p style="font-size:0.62rem;color:var(--muted);margin-bottom:0.9rem;line-height:1.7;">Seçili listenin katmanlarını, özel alanlarını ve görünüm ayarlarını şablon olarak kaydet. Başka bir listeye uygulayabilirsin.</p>
      <div style="display:flex;gap:0.6rem;flex-wrap:wrap;">
        <button class="btn-io" onclick="exportListTemplate(AppState.settingsListId)">⬇ Şablonu İndir</button>
        <label class="btn-io btn-io-import">⬆ Şablon Uygula<input type="file" accept=".json" style="display:none" onchange="importListTemplate(event, AppState.settingsListId)"></label>
      </div>
    </div>

    <!-- RESET -->
    <div class="settings-section">
      <h2>Sıfırla</h2>
      <p style="font-size:0.62rem;color:var(--muted);margin-bottom:0.8rem;line-height:1.7;">Seçili listenin renk, font, şeffaflık ve arka plan ayarlarını sıfırlar. Animeler ve özel katmanlar korunur.</p>
      <button class="btn-reset-default" onclick="confirmResetDefaults()">↺ &nbsp;Varsayılan Ayarlara Dön</button>
    </div>
  `;
}

/** Kart ve görünüm bölümünün HTML'ini döndürür. */
function renderCardSection() {
  return `
    <!-- KART & GÖRÜNÜM -->
    <div class="settings-section">
      <h2>Kart &amp; Görünüm</h2>
      <div class="settings-grid">

        <div class="setting-item full-col">
          <label>Kart Köşe Yarıçapı</label>
          <input type="range" id="card-radius" min="0" max="20" step="1" value="3"
            oninput="applyCardSetting('cardRadius',this.value,this,'px')">
          <div class="val-disp" id="vd-cardradius">3px</div>
        </div>

        <div class="setting-item full-col">
          <label>Poster Genişliği (img modu)</label>
          <input type="range" id="card-width" min="48" max="200" step="4" value="80"
            oninput="applyCardSetting('cardWidth',this.value,this,'px')">
          <div class="val-disp" id="vd-cardwidth">80px</div>
        </div>

        <div class="setting-item full-col">
          <label>Poster Yüksekliği (img modu)</label>
          <input type="range" id="card-height" min="64" max="280" step="4" value="112"
            oninput="applyCardSetting('cardHeight',this.value,this,'px')">
          <div class="val-disp" id="vd-cardheight">112px</div>
        </div>

        <div class="setting-item full-col">
          <label>Hover Gölge Yoğunluğu</label>
          <input type="range" id="card-shadow" min="0" max="40" step="2" value="12"
            oninput="applyCardSetting('cardShadow',this.value,this,'px')">
          <div class="val-disp" id="vd-cardshadow">12px</div>
        </div>

        <div class="setting-item full-col">
          <label>Hover Parlaklık Artışı</label>
          <input type="range" id="card-hover-bright" min="100" max="250" step="5" value="140"
            oninput="applyCardSetting('cardHoverBright',this.value,this,'%')">
          <div class="val-disp" id="vd-cardhoverbright">140%</div>
        </div>

        <div class="setting-item full-col">
          <label>Hover Yükseklik (translateY)</label>
          <input type="range" id="card-hover-lift" min="0" max="10" step="1" value="2"
            oninput="applyCardSetting('cardHoverLift',this.value,this,'px')">
          <div class="val-disp" id="vd-cardhoverlift">2px</div>
        </div>

        <div class="setting-item full-col">
          <label>Poster Kırpma Pozisyonu</label>
          <select id="card-img-pos" onchange="applyCardSelectSetting('cardImgPos',this.value)"
            style="background:var(--card);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:0.68rem;padding:0.35rem 0.5rem;border-radius:2px;outline:none;width:100%;cursor:pointer;">
            <option value="top">Üstten (varsayılan)</option>
            <option value="center">Ortadan</option>
            <option value="bottom">Alttan</option>
          </select>
        </div>

        <div class="setting-item full-col">
          <label>Poster Fit Modu</label>
          <select id="card-img-fit" onchange="applyCardSelectSetting('cardImgFit',this.value)"
            style="background:var(--card);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:0.68rem;padding:0.35rem 0.5rem;border-radius:2px;outline:none;width:100%;cursor:pointer;">
            <option value="cover">Cover (doldur)</option>
            <option value="contain">Contain (tam göster)</option>
          </select>
        </div>

      </div>
    </div>
  `;
}

/** Liste ve sıralama bölümünün HTML'ini döndürür. */
function renderListSection() {
  return `
    <!-- LİSTE & SIRALAMA -->
    <div class="settings-section">
      <h2>Liste &amp; Sıralama</h2>
      <div class="settings-grid">

        <div class="setting-item full-col">
          <label>Varsayılan Sıralama</label>
          <select id="default-sort" onchange="applyDefaultSort(this.value)"
            style="background:var(--card);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:0.68rem;padding:0.35rem 0.5rem;border-radius:2px;outline:none;width:100%;cursor:pointer;">
            <option value="added">Eklenme sırası</option>
            <option value="name">A–Z İsim (Japonca)</option>
            <option value="title">A–Z Başlık (Türkçe/İngilizce)</option>
            <option value="score-desc">Puan ↓ (yüksekten düşüğe)</option>
            <option value="score-asc">Puan ↑ (düşükten yükseğe)</option>
            <option value="watched-asc">İzlenme sayısı ↑</option>
            <option value="watched-desc">İzlenme sayısı ↓</option>
          </select>
        </div>

        <div class="setting-item full-col">
          <label>Etiket Şekli (metin modu)</label>
          <select id="tag-shape-global" onchange="applyTagShapeGlobal(this.value)"
            style="background:var(--card);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:0.68rem;padding:0.35rem 0.5rem;border-radius:2px;outline:none;width:100%;cursor:pointer;">
            <option value="2px">Köşeli (2px)</option>
            <option value="0px">Tam Köşeli (0px)</option>
            <option value="6px">Hafif Yuvarlak (6px)</option>
            <option value="12px">Yuvarlak (12px)</option>
            <option value="999px">Pill / Kapsül</option>
          </select>
        </div>

        <div class="setting-item full-col">
          <label>Etiket İç Boşluğu (yatay)</label>
          <input type="range" id="tag-pad-x" min="2" max="20" step="1" value="6"
            oninput="applyTagPad('x',this.value,this)">
          <div class="val-disp" id="vd-tagpadx">6px</div>
        </div>

        <div class="setting-item full-col">
          <label>Etiket İç Boşluğu (dikey)</label>
          <input type="range" id="tag-pad-y" min="1" max="12" step="1" value="3"
            oninput="applyTagPad('y',this.value,this)">
          <div class="val-disp" id="vd-tagpady">3px</div>
        </div>

      </div>
    </div>
  `;
}

/** Animasyon bölümünün HTML'ini döndürür. */
function renderAnimationSection() {
  return `
    <!-- ANİMASYON -->
    <div class="settings-section">
      <h2>Animasyon</h2>
      <div class="settings-grid">

        <div class="setting-item full-col">
          <label>Hover Geçiş Hızı</label>
          <div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-top:0.3rem;">
            ${[['Kapalı','0ms'],['Anlık','60ms'],['Hızlı','120ms'],['Normal','200ms'],['Yavaş','350ms'],['Çok Yavaş','600ms']].map(([lbl,val]) =>
              `<button onclick="applyTransitionSpeed('${val}',this)"
                class="anim-preset-btn" data-val="${val}"
                style="background:var(--card);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:0.52rem;padding:0.22rem 0.6rem;border-radius:2px;cursor:pointer;letter-spacing:0.05em;">
                ${lbl}
              </button>`
            ).join('')}
          </div>
          <div style="font-size:0.5rem;color:var(--muted);margin-top:0.35rem;">Seçili: <span id="vd-transitionspeed">120ms</span></div>
        </div>

      </div>
    </div>
  `;
}

/** Tüm dinamik ayar içeriğini birleştirip DOM'a yazar. */
function buildSettingsDynamicContent() {
  const dyn = document.getElementById('settings-dynamic-content'); if (!dyn) return;
  dyn.innerHTML =
    renderAppearanceSection() +
    renderCardSection() +
    renderListSection() +
    renderAnimationSection();

  const l = getList(AppState.settingsListId);
  const lbl = document.getElementById('custom-tier-list-label');
  if (lbl && l) lbl.textContent = '— ' + l.name;
  const cfl = document.getElementById('custom-fields-list-label');
  if (cfl && l) cfl.textContent = '— ' + l.name;

  renderThemePresets();
}

/** Tema preset butonlarını render eder. */
function renderThemePresets() {
  const wrap = document.getElementById('theme-presets-wrap'); if (!wrap) return;
  wrap.innerHTML = '';
  Object.entries(THEME_PRESETS).forEach(([name, colors]) => {
    const btn = document.createElement('button');
    btn.style.cssText = `
      display:flex;align-items:center;gap:0.35rem;
      background:var(--card);border:1px solid var(--border);
      color:var(--text);font-family:inherit;font-size:0.6rem;
      letter-spacing:0.06em;padding:0.3rem 0.65rem;border-radius:3px;
      cursor:pointer;transition:border-color 0.2s,color 0.2s;
    `;
    const swatchRow = document.createElement('span');
    swatchRow.style.cssText = 'display:flex;gap:2px;';
    ['col-bg','col-accent','col-text'].forEach(key => {
      const dot = document.createElement('span');
      dot.style.cssText = `width:8px;height:8px;border-radius:50%;background:${colors[key]};display:inline-block;`;
      swatchRow.appendChild(dot);
    });
    btn.appendChild(swatchRow);
    btn.appendChild(document.createTextNode(name));
    btn.onmouseenter = () => { btn.style.borderColor = 'var(--accent)'; btn.style.color = 'var(--accent)'; };
    btn.onmouseleave = () => { btn.style.borderColor = 'var(--border)'; btn.style.color = 'var(--text)'; };
    btn.addEventListener('click', () => applyThemePreset(colors));
    wrap.appendChild(btn);
  });
}

/** Seçili tema preset'ini uygular. */
function applyThemePreset(colors) {
  const cssMap = { 'col-bg': 'bg', 'col-surface': 'surface', 'col-card': 'card', 'col-border': 'border', 'col-text': 'text', 'col-accent': 'accent' };
  Object.entries(colors).forEach(([key, val]) => {
    const domKey = cssMap[key];
    if (domKey) {
      applyColorSetting(domKey, val);
      const el = document.getElementById(key); if (el) el.value = val;
    }
  });
  markSettingsDirty();
}

// ─────────────────────────────────────────
//  LIST MANAGEMENT PANEL
// ─────────────────────────────────────────
/** Liste yönetim panelini (yeniden adlandır, sil) render eder. */
function renderListMgmtPanel() {
  const c = document.getElementById('list-mgmt-panel'); if (!c) return;
  c.innerHTML = '';
  lists.forEach(l => {
    const item = document.createElement('div'); item.className = 'list-mgmt-item';
    if (l.id === 'main') {
      item.innerHTML = `<span class="lmi-name" style="color:var(--accent)">★ Ana Liste</span><span class="lmi-count">${l.entries.length} anime</span>`;
    } else {
      item.innerHTML = `<input class="inline-rename" value="${escHtml(l.name)}" onblur="renameList('${l.id}',this.value)" onkeydown="if(event.key==='Enter')this.blur()"><span class="lmi-count">${l.entries.length} anime</span><button class="btn-lmi danger" style="margin-left:auto;" onclick="deleteList('${l.id}')">Sil</button>`;
    }
    c.appendChild(item);
  });
}

// ─────────────────────────────────────────
//  SETTINGS LOAD / APPLY
// ─────────────────────────────────────────
/** Ayarlar UI'ını verilen liste ID'sine göre doldurur. */
function loadSettingsUI(listId) {
  const s = Object.assign({}, getSettings(listId), _settingsDraft || {});
  const colorMap = { 'col-bg': 'bg', 'col-surface': 'surface', 'col-card': 'card', 'col-border': 'border', 'col-text': 'text', 'col-accent': 'accent' };
  Object.entries(colorMap).forEach(([elId, key]) => {
    const el = document.getElementById(elId); if (el) el.value = s['col-' + key] || DEFAULT_SETTINGS['col-' + key];
  });
  ['nav','modal','card','surface','border','tag'].forEach(k => {
    const el = document.getElementById('op-' + k), vd = document.getElementById('vd-' + k);
    if (el) { el.value = s['op-' + k] || DEFAULT_SETTINGS['op-' + k] || 100; if (vd) vd.textContent = '%' + el.value; }
  });
  const satEl = document.getElementById('ui-sat'), briEl = document.getElementById('ui-bri');
  if (satEl) { satEl.value = s['ui-sat'] || 100; document.getElementById('vd-sat').textContent = '%' + satEl.value; }
  if (briEl) { briEl.value = s['ui-bri'] || 100; document.getElementById('vd-bri').textContent = '%' + briEl.value; }
  const bgOpEl = document.getElementById('bg-opacity');
  if (bgOpEl) { bgOpEl.value = s.bgOpacity || 18; document.getElementById('vd-bgop').textContent = '%' + bgOpEl.value; }
  const fontSel = document.getElementById('font-select'); if (fontSel) { fontSel.value = s.font || 'Inconsolata'; }
  const fontSearchEl = document.getElementById('font-search'); if (fontSearchEl) fontSearchEl.value = '';
  filterFontList('');
  const fontSizeEl = document.getElementById('font-size-range');
  if (fontSizeEl) { fontSizeEl.value = s.fontSize || 14; const vd = document.getElementById('vd-fontsize'); if (vd) vd.textContent = fontSizeEl.value + 'px'; }
  const bgUrlInp = document.getElementById('bg-img-url'); if (bgUrlInp) bgUrlInp.value = s.bgImg || '';
  updateBgDropPreview(s.bgImg);
  const tierGapEl = document.getElementById('tier-gap');
  if (tierGapEl) { tierGapEl.value = s.tierGap !== undefined ? s.tierGap : 8; const vd = document.getElementById('vd-tiergap'); if (vd) vd.textContent = tierGapEl.value + 'px'; }

  // Kart & Görünüm
  const sliders = [
    ['card-radius','cardRadius','vd-cardradius',3,'px'],
    ['card-width','cardWidth','vd-cardwidth',80,'px'],
    ['card-height','cardHeight','vd-cardheight',112,'px'],
    ['card-shadow','cardShadow','vd-cardshadow',12,'px'],
    ['card-hover-bright','cardHoverBright','vd-cardhoverbright',140,'%'],
    ['card-hover-lift','cardHoverLift','vd-cardhoverlift',2,'px'],
    ['tag-pad-x','tagPadX','vd-tagpadx',6,'px'],
    ['tag-pad-y','tagPadY','vd-tagpady',3,'px'],
  ];
  sliders.forEach(([id, key, vdId, def, unit]) => {
    const el = document.getElementById(id); if (!el) return;
    el.value = s[key] !== undefined ? s[key] : def;
    const vd = document.getElementById(vdId); if (vd) vd.textContent = el.value + unit;
  });
  const imgPosEl = document.getElementById('card-img-pos'); if (imgPosEl) imgPosEl.value = s.cardImgPos || 'top';
  const imgFitEl = document.getElementById('card-img-fit'); if (imgFitEl) imgFitEl.value = s.cardImgFit || 'cover';

  // Liste & Sıralama
  const defSortEl = document.getElementById('default-sort'); if (defSortEl) defSortEl.value = s.sortMode || 'added';
  const tagShapeEl = document.getElementById('tag-shape-global'); if (tagShapeEl) tagShapeEl.value = s.tagShapeGlobal || '2px';

  // Animasyon
  const speedVal = s.transitionSpeed || '120ms';
  const vdSpeed = document.getElementById('vd-transitionspeed'); if (vdSpeed) vdSpeed.textContent = speedVal;
  document.querySelectorAll('.anim-preset-btn').forEach(btn => {
    btn.style.borderColor = btn.dataset.val === speedVal ? 'var(--accent)' : 'var(--border)';
    btn.style.color       = btn.dataset.val === speedVal ? 'var(--accent)' : 'var(--text)';
  });

  applyAllSettingsToDOM(s);
}

/** Tüm ayarları CSS değişkenleri ve DOM üzerinden anında uygular. */
function applyAllSettingsToDOM(s) {
  const r = document.documentElement.style;
  r.setProperty('--bg',      s['col-bg']      || DEFAULT_SETTINGS['col-bg']);
  r.setProperty('--surface', s['col-surface'] || DEFAULT_SETTINGS['col-surface']);
  r.setProperty('--card',    s['col-card']    || DEFAULT_SETTINGS['col-card']);
  r.setProperty('--border',  s['col-border']  || DEFAULT_SETTINGS['col-border']);
  r.setProperty('--text',    s['col-text']    || DEFAULT_SETTINGS['col-text']);
  r.setProperty('--accent',  s['col-accent']  || DEFAULT_SETTINGS['col-accent']);
  r.setProperty('--nav-opacity',     ((s['op-nav']     || 90)  / 100).toFixed(2));
  r.setProperty('--modal-opacity',   ((s['op-modal']   || 100) / 100).toFixed(2));
  r.setProperty('--card-opacity',    ((s['op-card']    || 100) / 100).toFixed(2));
  r.setProperty('--surface-opacity', ((s['op-surface'] || 100) / 100).toFixed(2));
  r.setProperty('--border-opacity',  ((s['op-border']  || 100) / 100).toFixed(2));
  r.setProperty('--tag-opacity',     ((s['op-tag']     || 100) / 100).toFixed(2));
  r.setProperty('--ui-saturation',   (s['ui-sat'] || 100) + '%');
  r.setProperty('--ui-brightness',   (s['ui-bri'] || 100) + '%');
  const font = s.font || 'Inconsolata';
  loadGoogleFont(font);
  document.body.style.fontFamily = `'${font}',monospace`;
  document.documentElement.style.setProperty('--base-font-size', (s.fontSize || 14) + 'px');
  const fp = document.getElementById('font-preview'); if (fp) fp.style.fontFamily = `'${font}',monospace`;
  const bgLayer = document.getElementById('bg-layer');
  bgLayer.style.backgroundImage = s.bgImg ? `url("${s.bgImg}")` : 'none';
  bgLayer.style.opacity = (s.bgOpacity || 18) / 100;
  const tc = document.getElementById('tiers-container');
  if (tc) tc.style.gap = (s.tierGap !== undefined ? s.tierGap : 8) + 'px';

  // Kart & görünüm CSS değişkenleri
  r.setProperty('--card-radius',       (s.cardRadius      !== undefined ? s.cardRadius      : 3)   + 'px');
  r.setProperty('--card-shadow-blur',  (s.cardShadow      !== undefined ? s.cardShadow      : 12)  + 'px');
  r.setProperty('--card-hover-bright', (s.cardHoverBright !== undefined ? s.cardHoverBright : 140) + '%');
  r.setProperty('--card-hover-lift',   (s.cardHoverLift   !== undefined ? s.cardHoverLift   : 2)   + 'px');
  r.setProperty('--card-img-w',        (s.cardWidth       !== undefined ? s.cardWidth       : 80)  + 'px');
  r.setProperty('--card-img-h',        (s.cardHeight      !== undefined ? s.cardHeight      : 112) + 'px');
  r.setProperty('--card-img-pos',       s.cardImgPos  || 'top');
  r.setProperty('--card-img-fit',       s.cardImgFit  || 'cover');
  r.setProperty('--tag-shape-global',   s.tagShapeGlobal || '2px');
  r.setProperty('--tag-pad-x',         (s.tagPadX !== undefined ? s.tagPadX : 6) + 'px');
  r.setProperty('--tag-pad-y',         (s.tagPadY !== undefined ? s.tagPadY : 3) + 'px');
  // Animasyon hızı
  r.setProperty('--transition-speed',   s.transitionSpeed || '120ms');
}

/**
 * Ayarı draft'a kaydeder; aynı zamanda _lastAppliedListId'yi sıfırlar
 * böylece bir sonraki render'da ayarlar yeniden uygulanır.
 */
function saveSetting(key, value) {
  if (!_settingsDraft) _settingsDraft = {};
  _settingsDraft[key] = value;
  AppState._lastAppliedListId = null;
  markSettingsDirty();
}

/** Renk ayarını CSS değişkenine ve draft'a yazar. */
function applyColorSetting(key, value) {
  const cssMap = { bg: '--bg', surface: '--surface', card: '--card', border: '--border', text: '--text', accent: '--accent' };
  document.documentElement.style.setProperty(cssMap[key] || ('--' + key), value);
  saveSetting('col-' + key, value);
}

/** Şeffaflık/doygunluk/parlaklık ayarını CSS değişkenine ve draft'a yazar. */
function applyOpacitySetting(key, value) {
  const v = parseInt(value);
  const cssMap = { nav: '--nav-opacity', modal: '--modal-opacity', card: '--card-opacity', surface: '--surface-opacity', border: '--border-opacity', tag: '--tag-opacity' };
  const dispMap = { nav: 'vd-nav', modal: 'vd-modal', card: 'vd-card', surface: 'vd-surface', border: 'vd-border', tag: 'vd-tag', sat: 'vd-sat', bri: 'vd-bri' };
  if (cssMap[key]) document.documentElement.style.setProperty(cssMap[key], (v / 100).toFixed(2));
  if (key === 'sat') document.documentElement.style.setProperty('--ui-saturation', v + '%');
  if (key === 'bri') document.documentElement.style.setProperty('--ui-brightness', v + '%');
  const dispEl = document.getElementById(dispMap[key]); if (dispEl) dispEl.textContent = '%' + v;
  const sKey = (key === 'sat') ? 'ui-sat' : (key === 'bri') ? 'ui-bri' : 'op-' + key;
  saveSetting(sKey, v);
}

// ─── Kart & Görünüm ───
/** Kart görünüm slider ayarını uygular. */
function applyCardSetting(key, value, inputEl, unit) {
  const v = parseInt(value);
  const cssMap = {
    cardRadius:       '--card-radius',
    cardShadow:       '--card-shadow-blur',
    cardHoverBright:  '--card-hover-bright',
    cardHoverLift:    '--card-hover-lift',
    cardWidth:        '--card-img-w',
    cardHeight:       '--card-img-h',
  };
  const vdMap = {
    cardRadius:'vd-cardradius', cardShadow:'vd-cardshadow',
    cardHoverBright:'vd-cardhoverbright', cardHoverLift:'vd-cardhoverlift',
    cardWidth:'vd-cardwidth', cardHeight:'vd-cardheight',
  };
  if (cssMap[key]) document.documentElement.style.setProperty(cssMap[key], v + unit);
  const vd = document.getElementById(vdMap[key]); if (vd) vd.textContent = v + unit;
  saveSetting(key, v);
}

/** Kart görünüm select ayarını (pos, fit) uygular. */
function applyCardSelectSetting(key, value) {
  const cssMap = { cardImgPos: '--card-img-pos', cardImgFit: '--card-img-fit' };
  if (cssMap[key]) document.documentElement.style.setProperty(cssMap[key], value);
  saveSetting(key, value);
}

// ─── Liste & Sıralama ───
/** Varsayılan sıralama modunu uygular; aktif liste de aynıysa anında render eder. */
function applyDefaultSort(value) {
  const l = getList(AppState.settingsListId); if (!l) return;
  saveSetting('sortMode', value);
  if (AppState.activeListId === AppState.settingsListId) {
    const al = getList(AppState.activeListId);
    if (al) { al.settings.sortMode = value; saveData(); }
    renderTierPage(false);
  }
}

/** Etiket şeklini (global) uygular. */
function applyTagShapeGlobal(value) {
  document.documentElement.style.setProperty('--tag-shape-global', value);
  saveSetting('tagShapeGlobal', value);
}

/** Etiket iç boşluğunu (yatay veya dikey) uygular. */
function applyTagPad(axis, value, inputEl) {
  const v = parseInt(value);
  if (axis === 'x') {
    document.documentElement.style.setProperty('--tag-pad-x', v + 'px');
    const vd = document.getElementById('vd-tagpadx'); if (vd) vd.textContent = v + 'px';
    saveSetting('tagPadX', v);
  } else {
    document.documentElement.style.setProperty('--tag-pad-y', v + 'px');
    const vd = document.getElementById('vd-tagpady'); if (vd) vd.textContent = v + 'px';
    saveSetting('tagPadY', v);
  }
}

// ─── Animasyon ───
/** Geçiş hız ayarını uygular ve seçili butonu vurgular. */
function applyTransitionSpeed(value, btn) {
  document.documentElement.style.setProperty('--transition-speed', value);
  const vd = document.getElementById('vd-transitionspeed'); if (vd) vd.textContent = value;
  document.querySelectorAll('.anim-preset-btn').forEach(b => {
    b.style.borderColor = b === btn ? 'var(--accent)' : 'var(--border)';
    b.style.color       = b === btn ? 'var(--accent)' : 'var(--text)';
  });
  saveSetting('transitionSpeed', value);
}

/** Tier'lar arası boşluk ayarını uygular. */
function applyTierGapSetting(value) {
  const v = parseInt(value);
  const dispEl = document.getElementById('vd-tiergap'); if (dispEl) dispEl.textContent = v + 'px';
  const tc = document.getElementById('tiers-container'); if (tc) tc.style.gap = v + 'px';
  saveSetting('tierGap', v);
}

/** Seçili fontu yükler ve uygular. */
function applyFontSetting() {
  const fontSel = document.getElementById('font-select'); if (!fontSel) return;
  const font = fontSel.value;
  loadGoogleFont(font);
  document.body.style.fontFamily = `'${font}',monospace`;
  const fp = document.getElementById('font-preview'); if (fp) fp.style.fontFamily = `'${font}',monospace`;
  saveSetting('font', font);
}

/** Font listesini arama sorgusuna göre filtreler. */
function filterFontList(query) {
  const sel = document.getElementById('font-select'); if (!sel) return;
  const q = query.trim().toLowerCase();
  Array.from(sel.options).forEach(opt => {
    opt.style.display = (!q || opt.value.toLowerCase().includes(q)) ? '' : 'none';
  });
  if (sel.options[sel.selectedIndex] && sel.options[sel.selectedIndex].style.display === 'none') {
    const first = Array.from(sel.options).find(o => o.style.display !== 'none');
    if (first) { sel.value = first.value; applyFontSetting(); }
  }
}

/** Font boyutu ayarını uygular. */
function applyFontSizeSetting(value) {
  const v = parseInt(value);
  const vd = document.getElementById('vd-fontsize'); if (vd) vd.textContent = v + 'px';
  document.documentElement.style.setProperty('--base-font-size', v + 'px');
  saveSetting('fontSize', v);
}

/** Google Font stylesheet'ini dinamik olarak yükler. */
function loadGoogleFont(name) {
  if (!name) return;
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@400;600;700&display=swap`;
  let el = document.getElementById('extra-gfont');
  if (!el) { el = document.createElement('link'); el.id = 'extra-gfont'; el.rel = 'stylesheet'; document.head.appendChild(el); }
  el.href = url;
}

/** Arka plan görsel URL'sini uygular. */
function applyBgUrlSetting() {
  const url = document.getElementById('bg-img-url').value.trim();
  saveSetting('bgImg', url || null);
  applyAllSettingsToDOM(Object.assign({}, getSettings(AppState.settingsListId), _settingsDraft || {}));
  updateBgDropPreview(url);
}

/** Arka plan görselini temizler. */
function clearBg() {
  document.getElementById('bg-img-url').value = '';
  saveSetting('bgImg', null);
  applyAllSettingsToDOM(Object.assign({}, getSettings(AppState.settingsListId), _settingsDraft || {}));
  updateBgDropPreview(null);
}

/** Arka plan opaklığını uygular. */
function applyBgOpacity() {
  const v = document.getElementById('bg-opacity').value;
  document.getElementById('vd-bgop').textContent = '%' + v;
  document.getElementById('bg-layer').style.opacity = v / 100;
  saveSetting('bgOpacity', parseInt(v));
}

/** Arka plan önizleme alanını günceller. */
function updateBgDropPreview(imgData) {
  const prev = document.getElementById('bg-preview-img'), lbl = document.getElementById('bg-drop-label');
  if (imgData) { prev.src = imgData; prev.style.display = 'block'; lbl.style.display = 'none'; }
  else { prev.style.display = 'none'; lbl.style.display = 'block'; lbl.textContent = '🖼 URL girildiğinde önizleme görünecek'; }
}

/** Varsayılan ayarlara sıfırlama için onay diyaloğunu gösterir. */
function confirmResetDefaults() {
  showConfirm('Varsayılana Dön', 'Seçili listenin renk, font ve şeffaflık ayarları sıfırlanacak. Animeler ve özel katmanlar korunacak.', () => {
    const l = getList(AppState.settingsListId); if (!l) return;
    const bgImg = l.settings.bgImg || null;
    const ct    = l.customTiers || [];
    const cf    = l.customFields || [];
    l.settings    = { ...DEFAULT_SETTINGS, bgImg };
    l.customTiers = ct; l.customFields = cf;
    _settingsDraft = null; saveData(true); loadSettingsUI(AppState.settingsListId);
    const bar = document.getElementById('settings-save-bar'); if (bar) bar.style.display = 'none';
  });
}

// ─────────────────────────────────────────
//  CUSTOM FIELD MANAGER
// ─────────────────────────────────────────
/** Özel alan yöneticisini render eder. */
function renderCustomFieldsManager() {
  const l = getList(AppState.settingsListId);
  const c = document.getElementById('custom-fields-builder'); if (!c || !l) return;
  c.innerHTML = '';
  if (!l.customFields) l.customFields = [];
  if (!l.customFields.length) {
    c.innerHTML = `<div style="font-size:0.62rem;color:var(--muted);opacity:0.5;padding:0.5rem 0;text-align:center;">Henüz özel alan yok.</div>`;
    return;
  }
  l.customFields.forEach((field, i) => {
    const item = document.createElement('div');
    item.style.cssText = 'background:var(--card);border:1px solid var(--border);border-radius:4px;padding:0.65rem 0.75rem;display:flex;flex-direction:column;gap:0.5rem;margin-bottom:0.4rem;';

    const row1 = document.createElement('div');
    row1.style.cssText = 'display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;';
    row1.innerHTML = `
      <span style="font-size:0.55rem;color:var(--muted);min-width:36px;">Alan Adı</span>
      <input type="text" value="${escHtml(field.label)}" placeholder="örn: Stüdyo"
        style="flex:1;min-width:90px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:0.75rem;padding:0.28rem 0.5rem;border-radius:2px;outline:none;"
        oninput="updateCustomField(${i},'label',this.value)">
      <span style="font-size:0.55rem;color:var(--muted);">Tür</span>
      <select onchange="updateCustomField(${i},'type',this.value)"
        style="background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:0.72rem;padding:0.28rem 0.4rem;border-radius:2px;outline:none;cursor:pointer;">
        <option value="text"   ${field.type === 'text'   ? 'selected' : ''}>Metin</option>
        <option value="number" ${field.type === 'number' ? 'selected' : ''}>Sayı</option>
        <option value="select" ${field.type === 'select' ? 'selected' : ''}>Seçenek</option>
      </select>
      <label style="display:flex;align-items:center;gap:0.3rem;font-size:0.58rem;color:var(--muted);cursor:pointer;">
        <input type="checkbox" ${field.required ? 'checked' : ''}
          style="accent-color:var(--accent);width:12px;height:12px;"
          onchange="updateCustomField(${i},'required',this.checked)"> Zorunlu
      </label>
      <button onclick="deleteCustomField(${i})"
        style="background:transparent;border:1px solid #ff444460;color:#ff6060;font-size:0.58rem;padding:0.18rem 0.45rem;border-radius:2px;cursor:pointer;font-family:inherit;margin-left:auto;">
        Sil
      </button>
    `;
    item.appendChild(row1);

    if (field.type === 'text' || field.type === 'number') {
      const row2 = document.createElement('div');
      row2.style.cssText = 'display:flex;align-items:center;gap:0.6rem;';
      row2.innerHTML = `
        <span style="font-size:0.55rem;color:var(--muted);min-width:36px;">İpucu</span>
        <input type="text" value="${escHtml(field.placeholder || '')}" placeholder="örn: Madhouse"
          style="flex:1;background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:0.72rem;padding:0.22rem 0.45rem;border-radius:2px;outline:none;"
          oninput="updateCustomField(${i},'placeholder',this.value)">
      `;
      item.appendChild(row2);
    }

    if (field.type === 'select') {
      const row3 = document.createElement('div');
      row3.style.cssText = 'display:flex;align-items:flex-start;gap:0.6rem;';
      row3.innerHTML = `
        <span style="font-size:0.55rem;color:var(--muted);min-width:36px;padding-top:0.3rem;">Seçenekler</span>
        <div style="flex:1;">
          <textarea
            style="width:100%;background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:0.72rem;padding:0.3rem 0.45rem;border-radius:2px;outline:none;min-height:50px;resize:vertical;"
            placeholder="Her satıra bir seçenek"
            oninput="updateCustomFieldOptions(${i},this.value)"
          >${(field.options || []).join('\n')}</textarea>
          <div style="font-size:0.5rem;color:var(--muted);margin-top:0.2rem;opacity:0.6;">Her satır = bir seçenek</div>
        </div>
      `;
      item.appendChild(row3);
    }

    c.appendChild(item);
  });
}

/** Yeni özel alan ekler. */
function addCustomField() {
  const l = getList(AppState.settingsListId); if (!l) return;
  if (!l.customFields) l.customFields = [];
  if (l.customFields.length >= 10) { showInfo('Limit', 'Liste başına en fazla 10 özel alan eklenebilir.'); return; }
  l.customFields.push({ id: 'cf-' + Date.now(), label: 'Yeni Alan', type: 'text', required: false, placeholder: '', options: [] });
  saveData(); renderCustomFieldsManager();
}

/** Özel alan özelliğini günceller. */
function updateCustomField(i, key, val) {
  const l = getList(AppState.settingsListId); if (!l || !l.customFields) return;
  l.customFields[i][key] = val; saveData(); renderCustomFieldsManager();
}

/** Seçenek tipi alan için seçenekleri günceller. */
function updateCustomFieldOptions(i, rawText) {
  const l = getList(AppState.settingsListId); if (!l || !l.customFields) return;
  l.customFields[i].options = rawText.split('\n').map(s => s.trim()).filter(Boolean);
  saveData();
}

/** Özel alanı siler. */
function deleteCustomField(i) {
  showConfirm('Alanı Sil', 'Bu özel alan ve tüm animelerdeki değerleri silinecek.', () => {
    const l = getList(AppState.settingsListId); if (!l || !l.customFields) return;
    const fieldId = l.customFields[i].id;
    l.customFields.splice(i, 1);
    l.entries.forEach(e => { if (e.customFieldValues) delete e.customFieldValues[fieldId]; });
    saveData(); renderCustomFieldsManager();
  });
}

// ─────────────────────────────────────────
//  CUSTOM TIER BUILDER — TAB YARDIMCILARI
// ─────────────────────────────────────────

/**
 * Tier gelişmiş ayarları için Header tab HTML'ini döndürür.
 * @param {object} t - Tier nesnesi
 * @param {number} i - Tier dizin numarası
 * @returns {string}
 */
function buildHeaderTab(t, i) {
  return `
    <div class="adv-item adv-full-col"><label>Header Banner URL</label>
      <div class="adv-url-row">
        <input type="text" value="${escHtml(t.headerBannerImg || '')}" placeholder="https://..." oninput="updateTierField(${i},'headerBannerImg',this.value)">
        ${t.headerBannerImg ? `<img class="adv-banner-prev" src="${t.headerBannerImg}" onerror="this.style.display='none'">` : '<span style="font-size:0.5rem;color:var(--muted);flex-shrink:0;opacity:0.4">Yok</span>'}
      </div>
    </div>
    <div class="adv-item adv-full-col"><label><input type="checkbox" ${t.headerBannerFull ? 'checked' : ''} onchange="updateTierField(${i},'headerBannerFull',this.checked)" style="accent-color:var(--accent);width:12px;height:12px;"> &nbsp;Banner tüm header'ı kaplasın</label></div>
    <div class="adv-item"><label>Header Rengi</label><div style="display:flex;gap:0.3rem;align-items:center;"><input type="color" value="${t.headerBg || '#0e0e1a'}" oninput="updateTierField(${i},'headerBg',this.value)" style="flex:1;"><button class="adv-clear" onclick="updateTierField(${i},'headerBg','')">Temizle</button></div></div>
    <div class="adv-item"><label>Banner Sığdırma</label><select onchange="updateTierField(${i},'headerBannerFit',this.value)"><option value="cover" ${t.headerBannerFit === 'cover' ? 'selected' : ''}>Cover</option><option value="contain" ${t.headerBannerFit === 'contain' ? 'selected' : ''}>Contain</option><option value="fill" ${t.headerBannerFit === 'fill' ? 'selected' : ''}>Fill</option></select></div>
    <div class="adv-item"><label>Yükseklik — ${t.headerHeight || 45}px</label><input type="range" min="30" max="200" value="${t.headerHeight || 45}" oninput="updateTierField(${i},'headerHeight',parseFloat(this.value));this.previousElementSibling.textContent='Yükseklik — '+this.value+'px'"></div>
    <div class="adv-item"><label>Genişlik — ${t.headerMinWidth || 0}%</label><input type="range" min="0" max="100" value="${t.headerMinWidth || 0}" oninput="updateTierField(${i},'headerMinWidth',parseFloat(this.value));this.previousElementSibling.textContent='Genişlik — '+this.value+'%'"></div>
    <div class="adv-item"><label>Doygunluk — ${t.headerBannerSaturation || 100}%</label><input type="range" min="0" max="200" value="${t.headerBannerSaturation || 100}" oninput="updateTierField(${i},'headerBannerSaturation',parseFloat(this.value));this.previousElementSibling.textContent='Doygunluk — '+this.value+'%'"></div>
    <div class="adv-item"><label>Parlaklık — ${t.headerBannerBrightness || 100}%</label><input type="range" min="20" max="200" value="${t.headerBannerBrightness || 100}" oninput="updateTierField(${i},'headerBannerBrightness',parseFloat(this.value));this.previousElementSibling.textContent='Parlaklık — '+this.value+'%'"></div>
    <div class="adv-item"><label>Blur — ${t.headerBannerBlur || 0}px</label><input type="range" min="0" max="20" value="${t.headerBannerBlur || 0}" oninput="updateTierField(${i},'headerBannerBlur',parseFloat(this.value));this.previousElementSibling.textContent='Blur — '+this.value+'px'"></div>
    <div class="adv-item"><label>Hizalama</label><select onchange="updateTierField(${i},'headerAlign',this.value)"><option value="flex-start" ${(t.headerAlign || 'flex-start') === 'flex-start' ? 'selected' : ''}>Sol</option><option value="center" ${t.headerAlign === 'center' ? 'selected' : ''}>Orta</option><option value="flex-end" ${t.headerAlign === 'flex-end' ? 'selected' : ''}>Sağ</option></select></div>
    <div class="adv-item"><label>Header Şekli</label><select onchange="updateTierField(${i},'headerShape',this.value)"><option value="0px" ${(t.headerShape || '0px') === '0px' ? 'selected' : ''}>Keskin</option><option value="4px" ${t.headerShape === '4px' ? 'selected' : ''}>Hafif Yuvarlak</option><option value="8px" ${t.headerShape === '8px' ? 'selected' : ''}>Yuvarlak</option><option value="12px" ${t.headerShape === '12px' ? 'selected' : ''}>Çok Yuvarlak</option><option value="50%" ${t.headerShape === '50%' ? 'selected' : ''}>Tam Yuvarlak</option></select></div>
    <div class="adv-item"><label>Yazı Boyutu — ${t.nameFontSize || 0.72}rem</label><input type="range" min="0.5" max="1.5" step="0.05" value="${t.nameFontSize || 0.72}" oninput="updateTierField(${i},'nameFontSize',parseFloat(this.value));this.previousElementSibling.textContent='Yazı Boyutu — '+parseFloat(this.value).toFixed(2)+'rem'"></div>
    <!-- GRADIENT -->
    <div class="adv-item adv-full-col" style="border-top:1px solid var(--border);padding-top:0.5rem;margin-top:0.2rem;">
      <label style="display:flex;align-items:center;gap:0.4rem;cursor:pointer;">
        <input type="checkbox" ${t.headerGradientEnabled ? 'checked' : ''} onchange="updateTierField(${i},'headerGradientEnabled',this.checked)" style="accent-color:var(--accent);width:12px;height:12px;">
        &nbsp;🎨 Gradient Header
      </label>
    </div>
    ${t.headerGradientEnabled ? `
    <div class="adv-item"><label>Renk 1</label><input type="color" value="${t.headerGradientColor1 || '#7c3aed'}" oninput="updateTierField(${i},'headerGradientColor1',this.value)"></div>
    <div class="adv-item"><label>Renk 2</label><input type="color" value="${t.headerGradientColor2 || '#2563eb'}" oninput="updateTierField(${i},'headerGradientColor2',this.value)"></div>
    <div class="adv-item adv-full-col"><label>Açı — ${t.headerGradientAngle || 135}°</label><input type="range" min="0" max="360" value="${t.headerGradientAngle || 135}" oninput="updateTierField(${i},'headerGradientAngle',parseFloat(this.value));this.previousElementSibling.textContent='Açı — '+this.value+'°'"></div>
    <div class="adv-item adv-full-col" style="font-size:0.48rem;color:var(--muted);display:flex;gap:0.4rem;flex-wrap:wrap;">
      <button onclick="updateTierField(${i},'headerGradientColor1','#7c3aed');updateTierField(${i},'headerGradientColor2','#2563eb')" style="background:linear-gradient(135deg,#7c3aed,#2563eb);border:none;color:#fff;font-size:0.48rem;padding:0.2rem 0.5rem;border-radius:2px;cursor:pointer;">Mor→Mavi</button>
      <button onclick="updateTierField(${i},'headerGradientColor1','#f97316');updateTierField(${i},'headerGradientColor2','#dc2626')" style="background:linear-gradient(135deg,#f97316,#dc2626);border:none;color:#fff;font-size:0.48rem;padding:0.2rem 0.5rem;border-radius:2px;cursor:pointer;">Turuncu→Kırmızı</button>
      <button onclick="updateTierField(${i},'headerGradientColor1','#06b6d4');updateTierField(${i},'headerGradientColor2','#6366f1')" style="background:linear-gradient(135deg,#06b6d4,#6366f1);border:none;color:#fff;font-size:0.48rem;padding:0.2rem 0.5rem;border-radius:2px;cursor:pointer;">Cyan→İndigo</button>
      <button onclick="updateTierField(${i},'headerGradientColor1','#10b981');updateTierField(${i},'headerGradientColor2','#fbbf24')" style="background:linear-gradient(135deg,#10b981,#fbbf24);border:none;color:#000;font-size:0.48rem;padding:0.2rem 0.5rem;border-radius:2px;cursor:pointer;">Yeşil→Sarı</button>
    </div>` : ''}
    <!-- SAYAÇ -->
    <div class="adv-item adv-full-col" style="border-top:1px solid var(--border);padding-top:0.5rem;margin-top:0.2rem;">
      <label style="display:flex;align-items:center;gap:0.4rem;cursor:pointer;">
        <input type="checkbox" ${t.headerCountEnabled ? 'checked' : ''} onchange="updateTierField(${i},'headerCountEnabled',this.checked)" style="accent-color:var(--accent);width:12px;height:12px;">
        &nbsp;🔢 Header'da Anime Sayısı
      </label>
    </div>
    <!-- GLOW -->
    <div class="adv-item adv-full-col" style="border-top:1px solid var(--border);padding-top:0.5rem;margin-top:0.2rem;">
      <label style="display:flex;align-items:center;gap:0.4rem;cursor:pointer;">
        <input type="checkbox" ${t.headerGlowEnabled ? 'checked' : ''} onchange="updateTierField(${i},'headerGlowEnabled',this.checked)" style="accent-color:var(--accent);width:12px;height:12px;">
        &nbsp;✨ İsim Glow Efekti
      </label>
    </div>
    ${t.headerGlowEnabled ? `
    <div class="adv-item adv-full-col"><label>Glow Yoğunluğu — ${t.headerGlowIntensity || 8}px</label><input type="range" min="1" max="30" value="${t.headerGlowIntensity || 8}" oninput="updateTierField(${i},'headerGlowIntensity',parseFloat(this.value));this.previousElementSibling.textContent='Glow Yoğunluğu — '+this.value+'px'"></div>` : ''}
  `;
}

/**
 * Tier gelişmiş ayarları için Body tab HTML'ini döndürür.
 * @param {object} t - Tier nesnesi
 * @param {number} i - Tier dizin numarası
 * @returns {string}
 */
function buildBodyTab(t, i) {
  return `
    <div class="adv-item adv-full-col"><label>Gövde Banner URL</label><div class="adv-url-row"><input type="text" value="${escHtml(t.bodyBannerImg || '')}" placeholder="https://..." oninput="updateTierField(${i},'bodyBannerImg',this.value)">${t.bodyBannerImg ? `<img class="adv-banner-prev" src="${t.bodyBannerImg}" onerror="this.style.display='none'">` : '<span style="font-size:0.5rem;color:var(--muted);flex-shrink:0;opacity:0.4">Yok</span>'}</div></div>
    <div class="adv-item"><label>Gövde Rengi</label><div style="display:flex;gap:0.3rem;align-items:center;"><input type="color" value="${t.bodyBg || '#131320'}" oninput="updateTierField(${i},'bodyBg',this.value)" style="flex:1;"><button class="adv-clear" onclick="updateTierField(${i},'bodyBg','')">Temizle</button></div></div>
    <div class="adv-item"><label>Banner Sığdırma</label><select onchange="updateTierField(${i},'bodyBannerFit',this.value)"><option value="cover" ${(t.bodyBannerFit || 'cover') === 'cover' ? 'selected' : ''}>Cover</option><option value="contain" ${t.bodyBannerFit === 'contain' ? 'selected' : ''}>Contain</option><option value="repeat" ${t.bodyBannerFit === 'repeat' ? 'selected' : ''}>Tekrarla</option></select></div>
    <div class="adv-item"><label>Banner Opaklığı — ${t.bodyBannerOpacity || 40}%</label><input type="range" min="5" max="100" value="${t.bodyBannerOpacity || 40}" oninput="updateTierField(${i},'bodyBannerOpacity',parseFloat(this.value));this.previousElementSibling.textContent='Banner Opaklığı — '+this.value+'%'"></div>
    <div class="adv-item"><label>Parlaklık — ${t.bodyBannerBrightness || 100}%</label><input type="range" min="20" max="200" value="${t.bodyBannerBrightness || 100}" oninput="updateTierField(${i},'bodyBannerBrightness',parseFloat(this.value));this.previousElementSibling.textContent='Parlaklık — '+this.value+'%'"></div>
    <div class="adv-item"><label>Blur — ${t.bodyBannerBlur || 0}px</label><input type="range" min="0" max="20" value="${t.bodyBannerBlur || 0}" oninput="updateTierField(${i},'bodyBannerBlur',parseFloat(this.value));this.previousElementSibling.textContent='Blur — '+this.value+'px'"></div>
    <div class="adv-item"><label>Min Yükseklik — ${t.bodyMinHeight || 48}px</label><input type="range" min="20" max="300" value="${t.bodyMinHeight || 48}" oninput="updateTierField(${i},'bodyMinHeight',parseFloat(this.value));this.previousElementSibling.textContent='Min Yükseklik — '+this.value+'px'"></div>
    <div class="adv-item"><label>Etiket Boşluğu — ${t.tagGap || 5}px</label><input type="range" min="0" max="24" value="${t.tagGap || 5}" oninput="updateTierField(${i},'tagGap',parseFloat(this.value));this.previousElementSibling.textContent='Etiket Boşluğu — '+this.value+'px'"></div>
    <div class="adv-item"><label>Çizgi Şeffaflığı — ${t.borderOpacity !== undefined ? t.borderOpacity : 100}%</label><input type="range" min="0" max="100" value="${t.borderOpacity !== undefined ? t.borderOpacity : 100}" oninput="updateTierField(${i},'borderOpacity',parseFloat(this.value));this.previousElementSibling.textContent='Çizgi Şeffaflığı — '+this.value+'%'"></div>
    <div class="adv-item adv-full-col" style="border-top:1px solid var(--border);padding-top:0.6rem;margin-top:0.2rem;">
      <label style="margin-bottom:0.4rem;display:block;">Gövde Şekli (border-radius)</label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.35rem 0.5rem;margin-bottom:0.4rem;">
        ${['Sol Üst','Sağ Üst','Sağ Alt','Sol Alt'].map((lbl, ci) => {
          const corners = (t.bodyShape || '0px 0px 0px 0px').split(/\s+/);
          while (corners.length < 4) corners.push('0px');
          const raw = parseInt(corners[ci]) || 0;
          return `<div style="display:flex;flex-direction:column;gap:0.15rem;">
            <span style="font-size:0.45rem;color:var(--muted);text-transform:uppercase;">${lbl}</span>
            <div style="display:flex;align-items:center;gap:0.25rem;">
              <input type="range" min="0" max="50" value="${raw}" style="flex:1;"
                oninput="updateBodyShapeCorner(${i},${ci},this.value);this.nextElementSibling.textContent=this.value+'px'">
              <span style="font-size:0.5rem;color:var(--muted);min-width:26px;">${raw}px</span>
            </div>
          </div>`;
        }).join('')}
      </div>
      <div style="display:flex;gap:0.3rem;flex-wrap:wrap;margin-top:0.2rem;">
        <button onclick="setBodyShapePreset(${i},'0px 0px 0px 0px')" style="background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:0.48rem;padding:0.18rem 0.5rem;border-radius:2px;cursor:pointer;">Keskin</button>
        <button onclick="setBodyShapePreset(${i},'4px 4px 4px 4px')" style="background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:0.48rem;padding:0.18rem 0.5rem;border-radius:2px;cursor:pointer;">Hafif</button>
        <button onclick="setBodyShapePreset(${i},'8px 8px 8px 8px')" style="background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:0.48rem;padding:0.18rem 0.5rem;border-radius:2px;cursor:pointer;">Yuvarlak</button>
        <button onclick="setBodyShapePreset(${i},'0px 0px 12px 12px')" style="background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:0.48rem;padding:0.18rem 0.5rem;border-radius:2px;cursor:pointer;">Alt Yuvarlak</button>
        <button onclick="setBodyShapePreset(${i},'12px 12px 0px 0px')" style="background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:0.48rem;padding:0.18rem 0.5rem;border-radius:2px;cursor:pointer;">Üst Yuvarlak</button>
        <button onclick="setBodyShapePreset(${i},'20px 20px 20px 20px')" style="background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:0.48rem;padding:0.18rem 0.5rem;border-radius:2px;cursor:pointer;">Çok Yuvarlak</button>
      </div>
    </div>
    <div class="adv-item"><label>Etiket Şekli</label><select onchange="updateTierField(${i},'tagShape',this.value)"><option value="2px" ${(t.tagShape || '2px') === '2px' ? 'selected' : ''}>Varsayılan</option><option value="0px" ${t.tagShape === '0px' ? 'selected' : ''}>Keskin</option><option value="4px" ${t.tagShape === '4px' ? 'selected' : ''}>Hafif</option><option value="8px" ${t.tagShape === '8px' ? 'selected' : ''}>Yuvarlak</option><option value="50px" ${t.tagShape === '50px' ? 'selected' : ''}>Hap</option><option value="50%" ${t.tagShape === '50%' ? 'selected' : ''}>Tam Yuvarlak</option></select></div>
    <!-- COMPACT MOD -->
    <div class="adv-item adv-full-col" style="border-top:1px solid var(--border);padding-top:0.5rem;margin-top:0.2rem;">
      <label style="display:flex;align-items:center;gap:0.4rem;cursor:pointer;">
        <input type="checkbox" ${t.compactMode ? 'checked' : ''} onchange="updateTierField(${i},'compactMode',this.checked)" style="accent-color:var(--accent);width:12px;height:12px;">
        &nbsp;↔ Compact Mod (Yatay Scroll, Tek Satır)
      </label>
    </div>
    <!-- GRID MOD -->
    <div class="adv-item adv-full-col" style="border-top:1px solid var(--border);padding-top:0.5rem;margin-top:0.2rem;">
      <label style="display:flex;align-items:center;gap:0.4rem;cursor:pointer;">
        <input type="checkbox" ${t.gridMode ? 'checked' : ''} onchange="updateTierField(${i},'gridMode',this.checked)" style="accent-color:var(--accent);width:12px;height:12px;">
        &nbsp;⊞ Grid Modu
      </label>
    </div>
    ${t.gridMode ? `<div class="adv-item adv-full-col"><label>Sütun Sayısı — ${t.gridCols || 4}</label><input type="range" min="2" max="10" step="1" value="${t.gridCols || 4}" oninput="updateTierField(${i},'gridCols',parseFloat(this.value));this.previousElementSibling.textContent='Sütun Sayısı — '+this.value"></div>` : ''}
    <!-- AYRAÇ -->
    <div class="adv-item adv-full-col" style="border-top:1px solid var(--border);padding-top:0.5rem;margin-top:0.2rem;">
      <label>🔲 Katman Altı Ayraç</label>
      <select onchange="updateTierField(${i},'dividerStyle',this.value)" style="width:100%;margin-top:0.2rem;background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:0.65rem;padding:0.2rem 0.4rem;border-radius:2px;outline:none;">
        <option value="none" ${(t.dividerStyle || 'none') === 'none' ? 'selected' : ''}>Yok</option>
        <option value="line" ${t.dividerStyle === 'line' ? 'selected' : ''}>İnce Çizgi</option>
        <option value="gradient" ${t.dividerStyle === 'gradient' ? 'selected' : ''}>Gradient Çizgi</option>
        <option value="band" ${t.dividerStyle === 'band' ? 'selected' : ''}>Görsel Bant</option>
        <option value="gap" ${t.dividerStyle === 'gap' ? 'selected' : ''}>Büyük Boşluk</option>
      </select>
    </div>
    <!-- RENK YANSITMA -->
    <div class="adv-item adv-full-col" style="border-top:1px solid var(--border);padding-top:0.5rem;margin-top:0.2rem;">
      <label style="display:flex;align-items:center;gap:0.4rem;cursor:pointer;">
        <input type="checkbox" ${t.bodyColorReflect ? 'checked' : ''} onchange="updateTierField(${i},'bodyColorReflect',this.checked)" style="accent-color:var(--accent);width:12px;height:12px;">
        &nbsp;🎨 Katman Rengi Body'ye Yansısın
      </label>
    </div>
    <!-- SIRALAMA YÖNÜ -->
    <div class="adv-item adv-full-col" style="border-top:1px solid var(--border);padding-top:0.5rem;margin-top:0.2rem;">
      <label>↔ İçerik Hizalaması</label>
      <select onchange="updateTierField(${i},'bodyJustify',this.value)" style="width:100%;margin-top:0.2rem;background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:0.65rem;padding:0.2rem 0.4rem;border-radius:2px;outline:none;">
        <option value="flex-start" ${(t.bodyJustify || 'flex-start') === 'flex-start' ? 'selected' : ''}>Soldan Başla</option>
        <option value="flex-end" ${t.bodyJustify === 'flex-end' ? 'selected' : ''}>Sağdan Başla</option>
        <option value="center" ${t.bodyJustify === 'center' ? 'selected' : ''}>Ortadan Başla</option>
        <option value="space-between" ${t.bodyJustify === 'space-between' ? 'selected' : ''}>Eşit Dağıt</option>
        <option value="space-around" ${t.bodyJustify === 'space-around' ? 'selected' : ''}>Etrafta Dağıt</option>
      </select>
    </div>
    <div class="adv-item"><label>Sol Dolgu — ${t.bodyPaddingLeft || 0}px</label><input type="range" min="0" max="200" step="4" value="${t.bodyPaddingLeft || 0}" oninput="updateTierField(${i},'bodyPaddingLeft',parseFloat(this.value));this.previousElementSibling.textContent='Sol Dolgu — '+this.value+'px'"></div>
    <div class="adv-item"><label>Sağ Dolgu — ${t.bodyPaddingRight || 0}px</label><input type="range" min="0" max="200" step="4" value="${t.bodyPaddingRight || 0}" oninput="updateTierField(${i},'bodyPaddingRight',parseFloat(this.value));this.previousElementSibling.textContent='Sağ Dolgu — '+this.value+'px'"></div>
  `;
}

/**
 * Tier gelişmiş ayarları için General tab HTML'ini döndürür.
 * @param {object} t - Tier nesnesi
 * @param {number} i - Tier dizin numarası
 * @returns {string}
 */
function buildGeneralTab(t, i) {
  return `
    <div class="adv-item"><label>Kenarlık Rengi</label><div style="display:flex;gap:0.3rem;align-items:center;"><input type="color" value="${t.borderColor || '#1f1f35'}" oninput="updateTierField(${i},'borderColor',this.value)" style="flex:1;"><button class="adv-clear" onclick="updateTierField(${i},'borderColor','')">Temizle</button></div></div>
    <div class="adv-item"><label>Köşe Yuvarlaklığı — ${t.tierBorderRadius || 4}px</label><input type="range" min="0" max="24" value="${t.tierBorderRadius || 4}" oninput="updateTierField(${i},'tierBorderRadius',parseFloat(this.value));this.previousElementSibling.textContent='Köşe Yuvarlaklığı — '+this.value+'px'"></div>
  `;
}

/**
 * Tier gelişmiş ayarları için Layout tab HTML'ini döndürür.
 * Serbest konumlandırma (freeLayout) ve canvas boyutu ayarları içerir.
 * @param {object} t - Tier nesnesi
 * @param {number} i - Tier dizin numarası
 * @returns {string}
 */
function buildLayoutTab(t, i) {
  return `
    <div class="adv-item adv-full-col" style="border-bottom:1px solid var(--border);padding-bottom:0.6rem;margin-bottom:0.4rem;">
      <label style="display:flex;align-items:center;gap:0.4rem;cursor:pointer;">
        <input type="checkbox" ${t.freeLayout ? 'checked' : ''}
          onchange="updateTierField(${i},'freeLayout',this.checked)"
          style="accent-color:var(--accent);width:12px;height:12px;">
        &nbsp;🗺 Serbest Konumlandırma
      </label>
      <div style="font-size:0.48rem;color:var(--muted);margin-top:0.25rem;opacity:0.7;">
        Aktifken tier wrapper'ına data-freelayout attribute eklenir. Normal layout korunur.
      </div>
    </div>
    ${t.freeLayout ? `
    <div class="adv-item"><label>Canvas Genişliği — ${t.canvasW || 900}px</label>
      <input type="range" min="400" max="2400" step="50" value="${t.canvasW || 900}"
        oninput="updateTierField(${i},'canvasW',parseFloat(this.value));this.previousElementSibling.textContent='Canvas Genişliği — '+this.value+'px'">
    </div>
    <div class="adv-item"><label>Canvas Yüksekliği — ${t.canvasH || 300}px</label>
      <input type="range" min="100" max="1200" step="20" value="${t.canvasH || 300}"
        oninput="updateTierField(${i},'canvasH',parseFloat(this.value));this.previousElementSibling.textContent='Canvas Yüksekliği — '+this.value+'px'">
    </div>
    <div class="adv-item adv-full-col" style="margin-top:0.4rem;">
      <button
        onclick="showInfo('Yakında','Yakında: Sürükle-bırak editör')"
        style="width:100%;background:var(--surface);border:1px solid var(--accent);color:var(--accent);font-family:inherit;font-size:0.62rem;padding:0.4rem 0.8rem;border-radius:3px;cursor:pointer;letter-spacing:0.06em;transition:opacity 0.15s;">
        ✏ Editörü Aç
      </button>
    </div>` : `
    <div style="font-size:0.58rem;color:var(--muted);opacity:0.5;text-align:center;padding:0.8rem 0;">
      Serbest konumlandırmayı etkinleştir ve editörü kullan.
    </div>`}
  `;
}

// ─────────────────────────────────────────
//  CUSTOM TIER BUILDER
// ─────────────────────────────────────────
/** Özel katman listesini (emoji, isim, renk, gelişmiş ayarlar) render eder. */
function renderCustomTierBuilder() {
  const l = getList(AppState.settingsListId); if (!l) return;
  const c = document.getElementById('custom-tier-builder'); if (!c) return;
  c.innerHTML = '';

  // Tab CSS (bir kere inject et)
  if (!document.getElementById('adv-tab-style')) {
    const style = document.createElement('style'); style.id = 'adv-tab-style';
    style.textContent = `
      .adv-tabs{display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:0.8rem;}
      .adv-tab-btn{background:transparent;border:none;border-bottom:2px solid transparent;color:var(--muted);font-family:inherit;font-size:0.6rem;letter-spacing:0.08em;text-transform:uppercase;padding:0.4rem 0.9rem;cursor:pointer;transition:color 0.15s,border-color 0.15s;}
      .adv-tab-btn.active{color:var(--accent);border-bottom-color:var(--accent);}
      .adv-tab-btn:hover:not(.active){color:var(--text);}
      .adv-tab-panel{display:none;}
      .adv-tab-panel.active{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:0.6rem;}
      .adv-item{display:flex;flex-direction:column;gap:0.25rem;}
      .adv-item label{font-size:0.5rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;}
      .adv-item select,.adv-item input[type=text],.adv-item input[type=range],.adv-item input[type=color]{background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:0.65rem;padding:0.2rem 0.4rem;border-radius:2px;outline:none;width:100%;}
      .adv-item input[type=range]{padding:0.1rem 0;}
      .adv-item input[type=color]{padding:2px;height:28px;}
      .adv-item .adv-clear{font-size:0.48rem;color:#ff6060;cursor:pointer;border:none;background:none;padding:0;font-family:inherit;text-decoration:underline;}
      .adv-url-row{display:flex;gap:0.3rem;align-items:center;}
      .adv-url-row input{flex:1;}
      .adv-banner-prev{width:48px;height:32px;object-fit:cover;border-radius:2px;border:1px solid var(--border);display:block;flex-shrink:0;}
      .adv-full-col{grid-column:1/-1;}
    `;
    document.head.appendChild(style);
  }

  (l.customTiers || []).forEach((t, i) => {
    // Migration render sırasında değil, loadData'da yapılıyor.
    // Ancak addCustomTier ile yeni eklenen tier'larda eksik alan olabilir;
    // bu yüzden sadece undefined kontrolü yaparak varsayılan ataması yapılır.
    // (Tam migration storage.js → migrateTier'da.)

    const isAdvOpen = t._advOpen || false;
    const activeTab = t._advTab  || 'header';
    const isHidden  = t.hidden   || false;

    const item = document.createElement('div'); item.className = 'custom-tier-item';
    if (isHidden) item.style.opacity = '0.45';

    // Temel satır
    const basicRow = document.createElement('div');
    basicRow.style.cssText = 'display:flex;align-items:center;gap:0.7rem;width:100%;flex-wrap:wrap;';
    basicRow.innerHTML = `
      <div class="tier-order-btns">
        <button class="tier-order-btn" onclick="moveTier(${i},-1)" title="Yukarı">▲</button>
        <button class="tier-order-btn" onclick="moveTier(${i},1)" title="Aşağı">▼</button>
      </div>
      <span class="cti-label">Emoji</span>
      <input class="cti-input emoji" type="text" value="${escHtml(t.emoji || '⭐')}" maxlength="4" oninput="updateTierField(${i},'emoji',this.value)">
      <span class="cti-label">İsim</span>
      <input class="cti-input name" type="text" value="${escHtml(t.name || '')}" placeholder="Katman adı" oninput="updateTierField(${i},'name',this.value)">
      <span class="cti-label">Renk</span>
      <input class="cti-color" type="color" value="${t.color || '#e040fb'}" oninput="updateTierField(${i},'color',this.value)">
      <!-- Görünürlük toggle -->
      <button title="${isHidden ? 'Katmanı Göster' : 'Katmanı Gizle'}"
        onclick="toggleTierVisibility(${i})"
        style="background:transparent;border:1px solid ${isHidden ? '#ff8c00' : 'var(--border)'};color:${isHidden ? '#ff8c00' : 'var(--muted)'};font-family:inherit;font-size:0.6rem;padding:0.18rem 0.45rem;border-radius:2px;cursor:pointer;flex-shrink:0;transition:all 0.2s;">
        ${isHidden ? '👁 Göster' : '🙈 Gizle'}
      </button>
      <button class="btn-del-tier" onclick="deleteTier(${i})">Sil</button>
    `;
    item.appendChild(basicRow);

    const toggle = document.createElement('div');
    toggle.className = 'advanced-settings-toggle';
    toggle.textContent = isAdvOpen ? '▲ İleri Düzey Ayarları Kapat' : '▼ İleri Düzey Ayarlar';
    toggle.addEventListener('click', () => toggleAdvTier(i));
    item.appendChild(toggle);

    if (isAdvOpen) {
      const advWrap = document.createElement('div');
      advWrap.style.cssText = 'margin-top:0.7rem;padding:0.8rem;background:rgba(0,0,0,0.25);border-radius:4px;border:1px solid var(--border);';

      const tabsEl = document.createElement('div'); tabsEl.className = 'adv-tabs';
      tabsEl.innerHTML = `
        <button class="adv-tab-btn ${activeTab === 'header'  ? 'active' : ''}" onclick="setAdvTab(${i},'header')">🎴 Header</button>
        <button class="adv-tab-btn ${activeTab === 'body'    ? 'active' : ''}" onclick="setAdvTab(${i},'body')">📦 Gövde</button>
        <button class="adv-tab-btn ${activeTab === 'general' ? 'active' : ''}" onclick="setAdvTab(${i},'general')">⚙ Genel</button>
        <button class="adv-tab-btn ${activeTab === 'layout'  ? 'active' : ''}" onclick="setAdvTab(${i},'layout')">🗺 Layout</button>
      `;
      advWrap.appendChild(tabsEl);

      // HEADER TAB
      const headerPanel = document.createElement('div');
      headerPanel.className = 'adv-tab-panel' + (activeTab === 'header' ? ' active' : '');
      headerPanel.innerHTML = buildHeaderTab(t, i);
      advWrap.appendChild(headerPanel);

      // BODY TAB
      const bodyPanel = document.createElement('div');
      bodyPanel.className = 'adv-tab-panel' + (activeTab === 'body' ? ' active' : '');
      bodyPanel.innerHTML = buildBodyTab(t, i);
      advWrap.appendChild(bodyPanel);

      // GENERAL TAB
      const generalPanel = document.createElement('div');
      generalPanel.className = 'adv-tab-panel' + (activeTab === 'general' ? ' active' : '');
      generalPanel.innerHTML = buildGeneralTab(t, i);
      advWrap.appendChild(generalPanel);

      // LAYOUT TAB
      const layoutPanel = document.createElement('div');
      layoutPanel.className = 'adv-tab-panel' + (activeTab === 'layout' ? ' active' : '');
      layoutPanel.innerHTML = buildLayoutTab(t, i);
      advWrap.appendChild(layoutPanel);

      item.appendChild(advWrap);
    }

    c.appendChild(item);
  });
}

/** Katmanın görünürlüğünü tersine çevirir. */
function toggleTierVisibility(i) {
  const l = getList(AppState.settingsListId); if (!l) return;
  l.customTiers[i].hidden = !l.customTiers[i].hidden;
  saveData(); renderCustomTierBuilder(); renderTierPage();
}

/** Tier gelişmiş ayarlar aktif tabını değiştirir. */
function setAdvTab(i, tab) {
  const l = getList(AppState.settingsListId); if (!l) return;
  l.customTiers[i]._advTab = tab; renderCustomTierBuilder();
}

/** Tier gelişmiş ayarlar panelini açıp kapatır. */
function toggleAdvTier(i) {
  const l = getList(AppState.settingsListId); if (!l) return;
  l.customTiers[i]._advOpen = !l.customTiers[i]._advOpen; renderCustomTierBuilder();
}

/** Tier alanını günceller; sayısal anahtarlar için parseFloat uygular. */
function updateTierField(i, key, val) {
  const l = getList(AppState.settingsListId); if (!l) return;
  const numericKeys = ['headerHeight','nameFontSize','tierBorderRadius','bannerBlur','bannerBrightness',
    'bodyBannerBlur','bodyBannerBrightness','bodyBannerOpacity','headerBannerSaturation',
    'bodyMinHeight','tagGap','borderOpacity','headerMinWidth',
    'headerGradientAngle','headerGlowIntensity','bodyPaddingLeft','bodyPaddingRight','gridCols',
    'canvasW','canvasH'];
  if (numericKeys.includes(key)) val = parseFloat(val);
  l.customTiers[i][key] = val; saveData(); renderCustomTierBuilder(); renderTierPage();
}

/** Gövde şeklinin belirtilen köşesini günceller. */
function updateBodyShapeCorner(tierIdx, cornerIdx, value) {
  const l = getList(AppState.settingsListId); if (!l) return;
  const t = l.customTiers[tierIdx]; if (!t) return;
  const corners = (t.bodyShape || '0px 0px 0px 0px').split(/\s+/);
  while (corners.length < 4) corners.push('0px');
  corners[cornerIdx] = parseInt(value) + 'px';
  t.bodyShape = corners.join(' ');
  saveData(); renderCustomTierBuilder(); renderTierPage();
}

/** Gövde şeklini preset değeriyle ayarlar. */
function setBodyShapePreset(tierIdx, value) {
  const l = getList(AppState.settingsListId); if (!l) return;
  if (l.customTiers[tierIdx]) l.customTiers[tierIdx].bodyShape = value;
  saveData(); renderCustomTierBuilder(); renderTierPage();
}

/** Tier'ı listede yukarı veya aşağı taşır. */
function moveTier(i, dir) {
  const l = getList(AppState.settingsListId); if (!l) return;
  const tiers = l.customTiers, j = i + dir;
  if (j < 0 || j >= tiers.length) return;
  [tiers[i], tiers[j]] = [tiers[j], tiers[i]];
  if (l.id === 'main' && l.tierLayout) {
    const idA = tiers[j].id, idB = tiers[i].id;
    const ia = l.tierLayout.findIndex(x => x.type === 'custom' && x.id === idA);
    const ib = l.tierLayout.findIndex(x => x.type === 'custom' && x.id === idB);
    if (ia > -1 && ib > -1) [l.tierLayout[ia], l.tierLayout[ib]] = [l.tierLayout[ib], l.tierLayout[ia]];
  }
  saveData(); renderCustomTierBuilder(); renderTierPage();
}

/** Yeni özel katman ekler. */
function addCustomTier() {
  const l = getList(AppState.settingsListId); if (!l) return;
  l.customTiers.push({
    id: 'ct-' + Date.now(), name: 'Yeni Katman', emoji: '⭐', color: '#e040fb',
    headerBannerImg: null, headerBannerFull: false, headerBannerFit: 'cover',
    headerBannerSaturation: 100, headerBannerBrightness: 100, headerBannerBlur: 0,
    headerBg: '', headerHeight: 45, headerAlign: 'flex-start', headerShape: '0px 0px 0px 0px',
    bodyBannerImg: null, bodyBannerFit: 'cover', bodyBannerBlur: 0,
    bodyBannerBrightness: 100, bodyBannerOpacity: 40,
    bodyBg: '', bodyShape: '0px 0px 4px 4px',
    tagShape: '2px', bodyMinHeight: 48, tagGap: 5, borderOpacity: 100,
    headerMinWidth: 0, nameFontSize: 0.72, borderColor: '', tierBorderRadius: 4,
    bannerImg: null, bannerMode: 'header', bannerFit: 'cover',
    bannerBlur: 0, bannerBrightness: 100, hidden: false,
    headerGradientEnabled: false, headerGradientColor1: '#7c3aed', headerGradientColor2: '#2563eb', headerGradientAngle: 135,
    headerCountEnabled: false,
    compactMode: false,
    headerGlowEnabled: false, headerGlowIntensity: 8,
    dividerStyle: 'none',
    bodyColorReflect: false,
    bodyJustify: 'flex-start', bodyPaddingLeft: 0, bodyPaddingRight: 0,
    gridMode: false, gridCols: 4,
    // Serbest konumlandırma
    freeLayout: false, canvasW: 900, canvasH: 300,
    headerBox: { x: 0, y: 0, w: 900, h: 60 },
    bodyBox:   { x: 0, y: 60, w: 900, h: 240 },
  });
  saveData(); renderCustomTierBuilder(); renderTierPage();
}

/** Katmanı siler ve ilgili entry referanslarını temizler. */
function deleteTier(i) {
  showConfirm('Katmanı Sil', 'Bu katmanı silmek istiyor musun?', () => {
    const l = getList(AppState.settingsListId); if (!l) return;
    const id = l.customTiers[i].id;
    l.customTiers.splice(i, 1);
    l.entries.forEach(e => { if (e.customLayers) e.customLayers = e.customLayers.filter(x => x !== id); });
    saveData(); renderCustomTierBuilder(); renderTierPage();
  });
}

// ─────────────────────────────────────────
//  IMPORT / EXPORT
// ─────────────────────────────────────────
/** Tüm listeleri JSON olarak dışa aktarır. */
function exportJSON() {
  const data = JSON.stringify(lists, null, 2);
  const blob  = new Blob([data], { type: 'application/json' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href = url; a.download = 'anime-liste-yedek-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showInfo('Export Tamam', 'Tüm listeler JSON olarak indirildi.');
}

/** JSON dosyasından liste verilerini içe aktarır. */
function importJSON(event) {
  const file = event.target.files[0]; if (!file) return;
  const inputEl = event.target;
  showConfirm('JSON Yükle', 'Mevcut tüm veriler silinecek. Önce yedek aldın mı?', () => {
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!Array.isArray(parsed)) throw new Error('Geçersiz format');
        parsed.forEach(l => { if (!l.id || !l.name) throw new Error('Eksik alan'); });
        lists = parsed;
        lists.forEach(l => {
          if (!l.settings)      l.settings = {};
          if (!l.customTiers)   l.customTiers = [];
          if (!l.entries)       l.entries = [];
          if (!l.starTierOrder) l.starTierOrder = [5,4,3,2,1];
          if (!l.customFields)  l.customFields = [];
          l.customTiers.forEach(t => migrateTier(t));
        });
        saveData(true);
        AppState.activeListId = lists[0]?.id || 'main';
        AppState.settingsListId = AppState.activeListId;
        switchPage(AppState.currentPage);
        showInfo('Import Tamam', parsed.length + ' liste başarıyla yüklendi.');
      } catch (e) { showInfo('Hata', 'Dosya okunamadı: ' + e.message); }
    };
    reader.readAsText(file);
    inputEl.value = '';
  });
}

/** Seçili listeyi okunabilir metin formatında dışa aktarır. */
function exportReadable() {
  const l = getList(AppState.settingsListId); if (!l) { showInfo('Hata', 'Önce bir liste seç.'); return; }
  const lines = ['# ' + l.name + ' — Anime Liste Export', '# Tarih: ' + new Date().toLocaleDateString('tr-TR'), '# Toplam: ' + l.entries.length + ' anime', ''];
  l.entries.forEach(e => {
    lines.push('== ' + e.name + ' ==');
    lines.push('Başlık: ' + (e.title || ''));
    lines.push('İzlenme: ' + (e.watched || ''));
    lines.push('Puan: ' + Number(e.score).toFixed(1));
    if (e.tagColor) lines.push('Renk: ' + e.tagColor);
    if (e.img) lines.push('Görsel URL: ' + e.img);
    lines.push('Açıklama: ' + (e.desc || '').replace(/\n/g, ' '));
    if (l.customFields && e.customFieldValues) {
      l.customFields.forEach(cf => {
        const val = e.customFieldValues[cf.id];
        if (val !== undefined && val !== '') lines.push(cf.label + ': ' + val);
      });
    }
    lines.push('---'); lines.push('');
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = l.name.replace(/\s+/g, '-').toLowerCase() + '-' + new Date().toISOString().slice(0, 10) + '.txt';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showInfo('Export Tamam', l.entries.length + ' anime düzenli olarak indirildi.');
}

/** Okunabilir metin formatındaki dosyadan entry'leri içe aktarır. */
function importReadable(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const text = ev.target.result;
    const entries = [];
    const blocks = text.split(/^---$/m);
    blocks.forEach(block => {
      const nameMatch = block.match(/^==\s*(.+?)\s*==/m); if (!nameMatch) return;
      const name = nameMatch[1].trim();
      const get = key => { const re = new RegExp('^' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':\\s*(.+)$', 'm'); const m = block.match(re); return m ? m[1].trim() : ''; };
      const title   = get('Başlık'), watched = get('İzlenme'), scoreRaw = get('Puan');
      const score   = parseFloat(scoreRaw), color = get('Renk'), imgUrl = get('Görsel URL'), desc = get('Açıklama');
      if (!name || !title || !watched || isNaN(score) || !desc) return;
      entries.push({ id: genId('imp'), name, title, watched, score: Math.min(5, Math.max(0, Math.round(score * 10) / 10)), desc, tagColor: color || null, img: imgUrl || null });
    });
    if (!entries.length) { showInfo('Import Hata', 'Geçerli entry bulunamadı. Format doğru mu?'); return; }
    const l = getList(AppState.settingsListId); if (!l) { showInfo('Hata', 'Hedef liste bulunamadı.'); return; }
    showConfirm('Düzenli Import', entries.length + ' entry "' + l.name + '" listesine eklenecek. Devam et?', () => {
      l.entries.push(...entries); saveData();
      if (AppState.activeListId === AppState.settingsListId) renderTierPage();
      showInfo('Import Tamam', entries.length + ' anime başarıyla eklendi.');
    });
  };
  reader.readAsText(file); event.target.value = '';
}

/** Tüm verileri sıfırlamak için onay ister. */
function factoryReset() {
  showConfirm('⚠ Tüm Verileri Sıfırla', 'Tüm listeler, animeler, katmanlar ve ayarlar kalıcı olarak silinecek. Emin misin?', () => {
    localStorage.removeItem('al2-lists'); location.reload();
  });
}
