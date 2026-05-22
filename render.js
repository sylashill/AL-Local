// ═══════════════════════════════════════════════════════════════
//  render.js — UI render fonksiyonları
//  Görev: Tier sayfası render, anime tag oluşturma,
//         top nav, arama/sıralama, tier layout yönetimi
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────
//  TOP NAV
// ─────────────────────────────────────────
/** Üst navigasyon sekmelerini render eder. */
function renderTopNav() {
  const nav = document.getElementById('top-nav');
  if (!nav) return;
  nav.innerHTML = '';

  lists.forEach(l => {
    const isActive = AppState.currentPage === 'liste' && AppState.activeListId === l.id;
    const tab = document.createElement('button');
    tab.className = 'nav-tab' + (isActive ? ' active' : '');
    tab.textContent = l.name;
    tab.addEventListener('click', () => switchTab(l.id));
    nav.appendChild(tab);
  });

  if (lists.length < 10) {
    const nb = document.createElement('button');
    nb.className = 'nav-tab-new';
    nb.textContent = '＋';
    nb.title = 'Yeni Liste';
    nb.addEventListener('click', createNewList);
    nav.appendChild(nb);
  }

  const settingsTab = document.createElement('button');
  settingsTab.className = 'nav-tab' + (AppState.currentPage === 'settings' ? ' active' : '');
  settingsTab.textContent = 'Ayarlar';
  settingsTab.addEventListener('click', () => switchTab('settings'));
  nav.appendChild(settingsTab);
}

// ─────────────────────────────────────────
//  ARAMA / SIRALAMA BARINI RENDER ET
// ─────────────────────────────────────────
/** Arama ve sıralama çubuğunu render eder ya da varsa kaldırıp yeniden oluşturur. */
function renderSearchBar() {
  const existing = document.getElementById('search-sort-bar');
  if (existing) existing.remove();

  const l = getList(AppState.activeListId);
  if (!l) return;

  const settings = getSettings(AppState.activeListId);
  const bar = document.createElement('div');
  bar.id = 'search-sort-bar';
  bar.className = 'search-sort-bar';

  // Arama input'u
  const searchWrap = document.createElement('div');
  searchWrap.className = 'search-wrap';
  searchWrap.innerHTML = `
    <span class="search-icon">🔍</span>
    <input
      type="text"
      id="search-input"
      class="search-input"
      placeholder="Anime ara…"
      value="${escHtml(AppState.filterQuery)}"
      autocomplete="off"
    >
    <button class="search-clear ${AppState.filterQuery ? 'visible' : ''}" id="search-clear-btn" title="Temizle">✕</button>
  `;
  bar.appendChild(searchWrap);

  // Sıralama seçici
  const sortWrap = document.createElement('div');
  sortWrap.className = 'sort-wrap';
  const sortMode = settings.sortMode || 'added';
  sortWrap.innerHTML = `
    <label class="sort-label">Sırala</label>
    <select class="sort-select" id="sort-select">
      <option value="added"        ${sortMode === 'added'        ? 'selected' : ''}>Eklenme</option>
      <option value="name"         ${sortMode === 'name'         ? 'selected' : ''}>A–Z İsim</option>
      <option value="title"        ${sortMode === 'title'        ? 'selected' : ''}>A–Z Başlık</option>
      <option value="score-desc"   ${sortMode === 'score-desc'   ? 'selected' : ''}>Puan ↓</option>
      <option value="score-asc"    ${sortMode === 'score-asc'    ? 'selected' : ''}>Puan ↑</option>
      <option value="watched-asc"  ${sortMode === 'watched-asc'  ? 'selected' : ''}>İzlenme ↑</option>
      <option value="watched-desc" ${sortMode === 'watched-desc' ? 'selected' : ''}>İzlenme ↓</option>
    </select>
  `;
  bar.appendChild(sortWrap);

  // Entry sayısı özeti
  const countEl = document.createElement('div');
  countEl.id = 'entry-count-badge';
  countEl.className = 'entry-count-badge';
  const total = l.entries.length;
  const shown = AppState.filterQuery
    ? l.entries.filter(e => entryMatchesQuery(e, AppState.filterQuery)).length
    : total;
  countEl.textContent = AppState.filterQuery
    ? `${shown} / ${total} anime`
    : `${total} anime`;
  bar.appendChild(countEl);

  // DOM'a ekle
  const tiersCont = document.getElementById('tiers-container');
  tiersCont.parentNode.insertBefore(bar, tiersCont);

  // Event listener'lar
  const inp = document.getElementById('search-input');
  const clearBtn = document.getElementById('search-clear-btn');

  inp.addEventListener('input', () => {
    AppState.filterQuery = inp.value;
    clearBtn.classList.toggle('visible', !!inp.value);
    renderTierPage(false);
  });

  clearBtn.addEventListener('click', () => {
    AppState.filterQuery = '';
    inp.value = '';
    clearBtn.classList.remove('visible');
    renderTierPage(false);
  });

  document.getElementById('sort-select').addEventListener('change', e => {
    const l2 = getList(AppState.activeListId);
    if (l2) {
      l2.settings.sortMode = e.target.value;
      saveData();
    }
    renderTierPage(false);
  });
}

// ─────────────────────────────────────────
//  TIER LAYOUT
// ─────────────────────────────────────────
/** Tier sırasını listedeki durumla senkronize eder; eksik girişleri ekler, silinenleri çıkarır. */
function syncTierLayout(l) {
  if (!l.tierLayout) l.tierLayout = [];
  let changed = false;
  [5, 4, 3, 2, 1].forEach(s => {
    if (!l.tierLayout.find(x => x.type === 'star' && x.stars === s)) {
      l.tierLayout.push({ type: 'star', stars: s });
      changed = true;
    }
  });
  l.customTiers.forEach(t => {
    if (!l.tierLayout.find(x => x.type === 'custom' && x.id === t.id)) {
      l.tierLayout.push({ type: 'custom', id: t.id });
      changed = true;
    }
  });
  const oldLen = l.tierLayout.length;
  l.tierLayout = l.tierLayout.filter(x => {
    if (x.type === 'star') return true;
    return !!l.customTiers.find(t => t.id === x.id);
  });
  if (changed || l.tierLayout.length !== oldLen) saveData();
}

/** Listedeki tier'ları görüntüleme sırasına göre döndürür. */
function getOrderedTiers(l) {
  if (!l) return [];
  if (l.id !== 'main')
    return l.customTiers.map((t, i) => ({ type: 'custom', tier: t, listIndex: i }));
  syncTierLayout(l);
  return l.tierLayout.map((item, i) => {
    if (item.type === 'star') return { type: 'star', tier: getStarTierByStars(item.stars), layoutIndex: i };
    const ct = l.customTiers.find(t => t.id === item.id);
    return ct ? { type: 'custom', tier: ct, layoutIndex: i } : null;
  }).filter(Boolean);
}

/** Belirtilen tier'ı listede yukarı veya aşağı taşır. */
function moveTierInList(listId, layoutIndex, dir) {
  const l = getList(listId); if (!l) return;
  const isMain = l.id === 'main';
  if (isMain) {
    if (!l.tierLayout || !l.tierLayout.length) getOrderedTiers(l);
    const arr = l.tierLayout; const j = layoutIndex + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[layoutIndex], arr[j]] = [arr[j], arr[layoutIndex]];
  } else {
    const arr = l.customTiers; const j = layoutIndex + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[layoutIndex], arr[j]] = [arr[j], arr[layoutIndex]];
  }
  saveData(); renderTierPage();
}

/** Tier taşıma butonu oluşturur. */
function makeMoveBtn(text, title, onclick, hidden) {
  const btn = document.createElement('button');
  btn.className = 'tier-move-btn';
  btn.title = title; btn.textContent = text;
  btn.style.cssText = 'position:absolute;top:6px;z-index:5;background:var(--surface);border:1px solid var(--border);color:var(--muted);font-size:0.5rem;padding:0.1rem 0.32rem;border-radius:2px;cursor:pointer;line-height:1.3;transition:color 0.15s,opacity 0.15s;opacity:0.55;';
  btn.onmouseenter = () => { btn.style.opacity = '1'; btn.style.color = 'var(--accent)'; };
  btn.onmouseleave = () => { btn.style.opacity = '0.55'; btn.style.color = 'var(--muted)'; };
  if (hidden) btn.style.visibility = 'hidden';
  btn.onclick = onclick;
  return btn;
}

// ─────────────────────────────────────────
//  ANİME TAG — FİLTRE STRING YARDIMCILARI
// ─────────────────────────────────────────

/**
 * Entry'nin tag elementi için CSS filter string'ini oluşturur.
 * Sadece tagSat 100'den farklıysa saturate filtresi döner; aksi halde boş string.
 * @param {object} e - Entry nesnesi
 * @returns {string}
 */
function buildTagFilterString(e) {
  const tagSat = e.tagSat !== undefined ? e.tagSat : 100;
  return tagSat !== 100 ? `saturate(${tagSat}%)` : '';
}

/**
 * Entry'nin poster/img elementi için CSS filter string'ini oluşturur.
 * Şu an için temel implementasyon; ileride parlaklık vb. eklenebilir.
 * @param {object} e - Entry nesnesi
 * @returns {string}
 */
function buildPosterFilterString(e) {
  // Gelecekte poster'a özgü filtreler buraya eklenecek
  return '';
}

// ─────────────────────────────────────────
//  TIER PAGE RENDER
// ─────────────────────────────────────────
/** Ana tier sayfasını render eder; rebuildSearchBar=false ise arama çubuğunu yeniden oluşturmaz. */
function renderTierPage(rebuildSearchBar = true) {
  const l = getList(AppState.activeListId);
  const c = document.getElementById('tiers-container');
  if (!c) return;
  c.innerHTML = '';

  if (!l) {
    c.innerHTML = `<div style="text-align:center;color:var(--muted);font-size:0.65rem;padding:2rem;opacity:0.5">Liste bulunamadı.</div>`;
    return;
  }

  if (AppState._lastAppliedListId !== AppState.activeListId) {
    applyAllSettingsToDOM(getSettings(AppState.activeListId));
    AppState._lastAppliedListId = AppState.activeListId;
  }

  if (rebuildSearchBar) renderSearchBar();
  else {
    const badge = document.getElementById('entry-count-badge');
    if (badge) {
      const total = l.entries.length;
      const shown = AppState.filterQuery
        ? l.entries.filter(e => entryMatchesQuery(e, AppState.filterQuery)).length
        : total;
      badge.textContent = AppState.filterQuery ? `${shown} / ${total} anime` : `${total} anime`;
    }
  }

  const settings   = getSettings(AppState.activeListId);
  const sortMode   = settings.sortMode || 'added';
  const filterQ    = AppState.filterQuery;
  const viewMode   = AppState.viewMode;

  // Entry'leri tier'lara dağıt
  const byStarTier   = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  const byCustomTier = {};

  const sorted = sortEntries(l.entries, sortMode);
  sorted.forEach(e => {
    if (!entryMatchesQuery(e, filterQ)) return;
    const s = getTier(e.score);
    if (byStarTier[s]) byStarTier[s].push(e);
    (e.customLayers || []).forEach(id => {
      if (!byCustomTier[id]) byCustomTier[id] = [];
      byCustomTier[id].push(e);
    });
  });

  const isMain      = l.id === 'main';
  const orderedTiers = getOrderedTiers(l);
  const total        = orderedTiers.length;

  orderedTiers.forEach((item, arrIdx) => {
    if (!item || !item.tier) return;
    if (item.tier.hidden) return;

    const tierIndex = isMain ? item.layoutIndex : arrIdx;
    const upBtn   = makeMoveBtn('▲', 'Yukarı', () => moveTierInList(AppState.activeListId, tierIndex, -1), arrIdx === 0);
    const downBtn = makeMoveBtn('▼', 'Aşağı',  () => moveTierInList(AppState.activeListId, tierIndex, 1),  arrIdx === total - 1);
    upBtn.style.right = '30px'; downBtn.style.right = '6px';

    if (item.type === 'star') {
      const t = item.tier;
      const animes = byStarTier[t.stars] || [];
      const block = document.createElement('div'); block.className = 'tier-block'; block.style.position = 'relative';
      let sl = ''; for (let i = 1; i <= 5; i++) sl += `<span style="color:${i <= t.stars ? t.color : '#2a2a3a'}">★</span>`;
      const range = t.stars === 5 ? '4.5–5.0' : t.stars === 4 ? '3.5–4.4' : t.stars === 3 ? '2.5–3.4' : t.stars === 2 ? '1.5–2.4' : '0.0–1.4';
      const hdr = document.createElement('div'); hdr.className = 'tier-header'; hdr.style.borderBottomColor = t.color + '40';
      hdr.innerHTML = `<div class="tier-stars-display">${sl}</div><div class="tier-range" style="margin-right:58px">${range}</div>`;
      block.appendChild(hdr); block.appendChild(upBtn); block.appendChild(downBtn);
      const body = document.createElement('div'); body.className = `tier-body ${viewMode}-mode`;
      if (!animes.length) { body.innerHTML = `<div class="tier-empty">— boş —</div>`; }
      else animes.forEach(e => body.appendChild(buildTag(e, t.color, AppState.activeListId)));
      block.appendChild(body); c.appendChild(block);

    } else {
      const t = item.tier;
      const animes = byCustomTier[t.id] || [];
      const block  = document.createElement('div'); block.className = 'custom-tier-block';
      const bRadius  = t.tierBorderRadius !== undefined ? t.tierBorderRadius : 4;
      const bOpacity = t.borderOpacity    !== undefined ? t.borderOpacity / 100 : 1;
      const bColor   = t.borderColor || null;
      const borderStyle = bColor
        ? `border-color:rgba(${hexToRgb(bColor)},${bOpacity});`
        : `border-color:rgba(31,31,53,${bOpacity});`;
      block.style.cssText = `position:relative; border-radius:${bRadius}px; ${borderStyle}`;

      // Serbest konumlandırma attribute'u — ileride editör bu değeri okuyacak
      if (t.freeLayout) block.dataset.freelayout = 'true';

      const hdr = document.createElement('div'); hdr.className = 'custom-tier-hdr';
      const hHeaderShape  = t.headerShape || '0px';
      const hBannerFull   = t.headerBannerFull || false;
      const hHeight       = t.headerHeight || 45;
      const hMinWidth     = t.headerMinWidth || 0;

      hdr.style.cssText = `
        border-bottom-color:${(t.color || '#888') + '40'};
        ${t.headerBg ? 'background-color:' + t.headerBg + ';' : ''}
        min-height:${hHeight}px;
        ${hMinWidth > 0 ? 'width:' + hMinWidth + '%;' : ''}
        justify-content:${t.headerAlign || 'flex-start'};
        border-radius:${hHeaderShape} ${hHeaderShape} 0 0;
        position:relative;
        overflow:hidden;
      `;

      if (t.headerBannerImg && hBannerFull) {
        const hbg = document.createElement('div');
        const sat  = t.headerBannerSaturation  !== undefined ? t.headerBannerSaturation  : 100;
        const bri  = t.headerBannerBrightness  !== undefined ? t.headerBannerBrightness  : 100;
        const blur = t.headerBannerBlur        !== undefined ? t.headerBannerBlur        : 0;
        hbg.style.cssText = `
          position:absolute;inset:0;z-index:0;
          background-image:url("${t.headerBannerImg}");
          background-size:${t.headerBannerFit || 'cover'};
          background-position:center;
          filter:saturate(${sat}%) brightness(${bri}%) blur(${blur}px);
          pointer-events:none;
        `;
        hdr.appendChild(hbg);
      }

      const hdrContent = document.createElement('div');
      hdrContent.style.cssText = 'position:relative;z-index:1;display:flex;align-items:center;gap:0.6rem;width:100%;';

      let hc = '';
      if (t.headerBannerImg && !hBannerFull) {
        const sat  = t.headerBannerSaturation !== undefined ? t.headerBannerSaturation : 100;
        const bri  = t.headerBannerBrightness !== undefined ? t.headerBannerBrightness : 100;
        const blur = t.headerBannerBlur       !== undefined ? t.headerBannerBlur       : 0;
        hc += `<img class="tier-banner-hdr" src="${t.headerBannerImg}" alt="${escHtml(t.name)}" style="filter:saturate(${sat}%) brightness(${bri}%) blur(${blur}px);">`;
      } else if (!t.headerBannerImg) {
        hc += `<span class="custom-tier-emoji">${escHtml(t.emoji || '⭐')}</span>`;
      }

      const glowStyle = (t.headerGlowEnabled && t.color)
        ? `text-shadow:0 0 ${t.headerGlowIntensity || 8}px ${t.color}, 0 0 ${(t.headerGlowIntensity || 8) * 2}px ${t.color}80;`
        : '';
      const tierEntries = byCustomTier[t.id] || [];
      const countBadge = t.headerCountEnabled
        ? `<span style="font-size:0.55rem;opacity:0.7;font-weight:700;background:${(t.color || '#888') + '22'};border:1px solid ${(t.color || '#888') + '50'};color:${t.color || '#888'};padding:0.1rem 0.4rem;border-radius:10px;flex-shrink:0;">${tierEntries.length}</span>`
        : '';
      hc += `<span class="custom-tier-name" style="color:${escHtml(t.color || 'var(--accent)')}; font-size:${t.nameFontSize || 0.72}rem; padding-right:60px; ${glowStyle}">${escHtml(t.name || 'İsimsiz')}</span>${countBadge}`;
      hdrContent.innerHTML = hc;
      hdr.appendChild(hdrContent);

      if (t.headerGradientEnabled) {
        const g1 = t.headerGradientColor1 || '#7c3aed';
        const g2 = t.headerGradientColor2 || '#2563eb';
        const ga = t.headerGradientAngle !== undefined ? t.headerGradientAngle : 135;
        hdr.style.background = `linear-gradient(${ga}deg, ${g1}, ${g2})`;
      }

      block.appendChild(hdr); block.appendChild(upBtn); block.appendChild(downBtn);

      const body = document.createElement('div'); body.className = `custom-tier-body ${viewMode}-mode`;
      const bodyShape  = t.bodyShape      || '0px';
      const bodyMinH   = t.bodyMinHeight  !== undefined ? t.bodyMinHeight : 48;
      const tagGapVal  = t.tagGap         !== undefined ? t.tagGap        : 5;
      body.style.borderRadius = bodyShape;
      body.style.minHeight    = bodyMinH + 'px';
      body.style.gap          = tagGapVal + 'px';

      if (t.compactMode) {
        body.style.flexWrap      = 'nowrap';
        body.style.overflowX     = 'auto';
        body.style.overflowY     = 'hidden';
        body.style.paddingBottom = '4px';
      }

      if (t.gridMode && !t.compactMode) {
        body.style.display             = 'grid';
        body.style.gridTemplateColumns = `repeat(${t.gridCols || 4}, 1fr)`;
      } else {
        body.style.justifyContent = t.bodyJustify || 'flex-start';
        body.style.paddingLeft    = (t.bodyPaddingLeft  || 0) + 'px';
        body.style.paddingRight   = (t.bodyPaddingRight || 0) + 'px';
      }

      if (t.bodyColorReflect && t.color) {
        const rgb = hexToRgb(t.color);
        if (rgb && !t.bodyBannerImg) {
          body.style.backgroundColor = `rgba(${rgb},0.06)`;
        }
      }

      if (t.bodyBannerImg) {
        body.style.position        = 'relative';
        body.style.backgroundColor = t.bodyBg || '';
        const bodyBg = document.createElement('div');
        bodyBg.className = 'tier-body-bg';
        const bFit = t.bodyBannerFit        || 'cover';
        const bBlur = t.bodyBannerBlur      || 0;
        const bBri  = t.bodyBannerBrightness || 100;
        const bOp   = (t.bodyBannerOpacity !== undefined ? t.bodyBannerOpacity : 40) / 100;
        bodyBg.style.cssText = `
          background-image:url("${t.bodyBannerImg}");
          background-size:${bFit === 'repeat' ? 'auto' : bFit};
          background-repeat:${bFit === 'repeat' ? 'repeat' : 'no-repeat'};
          background-position:center;
          filter:blur(${bBlur}px) brightness(${bBri}%);
          opacity:${bOp};
        `;
        body.appendChild(bodyBg);
      } else if (!t.bodyColorReflect) {
        body.style.backgroundColor = t.bodyBg || '';
      } else if (t.bodyBg) {
        body.style.backgroundColor = t.bodyBg;
      }

      const tagShapeVal = t.tagShape || '2px';
      if (!animes.length) {
        const empty = document.createElement('div'); empty.className = 'tier-empty'; empty.textContent = '— boş —'; body.appendChild(empty);
      } else {
        animes.forEach(e => body.appendChild(buildTag(e, t.color || '#888', AppState.activeListId, tagShapeVal)));
      }
      block.appendChild(body); c.appendChild(block);

      if (t.dividerStyle && t.dividerStyle !== 'none') {
        const dvd = document.createElement('div');
        const tierColor = t.color || '#888';
        if (t.dividerStyle === 'line') {
          dvd.style.cssText = `height:1px;background:var(--border);margin:0;`;
        } else if (t.dividerStyle === 'gradient') {
          dvd.style.cssText = `height:2px;background:linear-gradient(90deg, transparent, ${tierColor}, transparent);margin:0;`;
        } else if (t.dividerStyle === 'band') {
          dvd.style.cssText = `height:6px;background:linear-gradient(90deg, ${tierColor}00, ${tierColor}60, ${tierColor}00);margin:0;`;
        } else if (t.dividerStyle === 'gap') {
          dvd.style.cssText = `height:24px;`;
        }
        c.appendChild(dvd);
      }
    }
  });

  if (filterQ && !c.querySelector('.anime-tag')) {
    const msg = document.createElement('div');
    msg.style.cssText = 'text-align:center;color:var(--muted);font-size:0.65rem;padding:2rem;opacity:0.5;';
    msg.textContent = `"${filterQ}" için sonuç bulunamadı.`;
    c.appendChild(msg);
  }
}

// ─────────────────────────────────────────
//  ANIME TAG
// ─────────────────────────────────────────
/** Anime tag DOM elementini oluşturur ve döndürür. */
function buildTag(e, defaultColor, listId, shape) {
  const color = e.tagColor || defaultColor;
  const tag   = document.createElement('div'); tag.className = 'anime-tag';
  tag.style.borderColor = color + '50';
  tag.style.color       = color + 'cc';
  tag.style.background  = color + '0a';

  const finalShape = e.tagShapeOverride || shape || null;
  if (finalShape) tag.style.borderRadius = finalShape;

  // Tag filter string
  const tagFilter = buildTagFilterString(e);
  if (tagFilter) tag.style.filter = tagFilter;

  const tagSize = e.tagSize !== undefined ? e.tagSize : 0.65;
  if (tagSize !== 0.65) tag.style.fontSize = tagSize + 'rem';

  tag.addEventListener('click', () => openDetail(e.id, listId));

  if (AppState.viewMode === 'img') {
    const wrap = document.createElement('div'); wrap.className = 'tag-img-wrap';
    if (finalShape) wrap.style.borderRadius = finalShape;

    // Poster filter string
    const posterFilter = buildPosterFilterString(e);
    if (posterFilter) wrap.style.filter = posterFilter;

    if (e.img) {
      const img = document.createElement('img'); img.src = e.img; img.alt = escHtml(e.name); wrap.appendChild(img);
    } else {
      wrap.innerHTML = `<div class="no-img-box"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span>No Img</span></div>`;
    }
    tag.appendChild(wrap);
  } else {
    const lbl = document.createElement('span'); lbl.className = 'tag-label'; lbl.textContent = e.name; tag.appendChild(lbl);
  }
  return tag;
}

// ─────────────────────────────────────────
//  VIEW MODE
// ─────────────────────────────────────────
/** Görüntüleme modunu (metin/poster) değiştirir ve sayfayı yeniler. */
function setView(mode) {
  AppState.viewMode = mode;
  document.getElementById('btn-text').classList.toggle('active', mode === 'text');
  document.getElementById('btn-img').classList.toggle('active', mode === 'img');
  renderTierPage();
}

// ─────────────────────────────────────────
//  CONFIRM / INFO DIALOG
// ─────────────────────────────────────────
/** Onay diyalogunu gösterir; kullanıcı "Evet" derse cb çağrılır. */
function showConfirm(title, msg, cb) {
  AppState.confirmCb = cb;
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent   = msg;
  const yesBtn = document.getElementById('confirm-yes');
  yesBtn.style.display = '';
  yesBtn.onclick = () => { if (AppState.confirmCb) AppState.confirmCb(); closeConfirm(); };
  document.getElementById('confirm-overlay').classList.add('on');
}

/** Bilgi diyalogunu gösterir (yalnızca "Kapat" butonu). */
function showInfo(title, msg) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent   = msg;
  document.getElementById('confirm-yes').style.display = 'none';
  document.getElementById('confirm-overlay').classList.add('on');
}

/** Onay/bilgi diyalogunu kapatır. */
function closeConfirm() {
  AppState.confirmCb = null;
  document.getElementById('confirm-overlay').classList.remove('on');
}
