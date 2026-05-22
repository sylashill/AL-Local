// ═══════════════════════════════════════════════════════════════
//  utils.js — Yardımcı fonksiyonlar + DragEngine
// ═══════════════════════════════════════════════════════════════

/** Benzersiz bir ID üretir; prefix ile başlar. */
function genId(prefix = 'e') {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

/** HTML özel karakterlerini güvenli şekilde kaçış karakterlerine dönüştürür. */
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}

/** HEX renk kodunu "r,g,b" formatına dönüştürür. */
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

/** HSL değerlerini HEX renk koduna dönüştürür. */
function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// ── Puan/Yıldız hesaplama ──
/** Verilen puana göre yıldız sayısını döndürür. */
function getTier(score) {
  for (const t of STAR_TIERS) if (score >= t.min && score < t.max) return t.stars;
  return 1;
}

/** Yıldız sayısına karşılık gelen rengi döndürür. */
function getTierColor(stars) {
  return (STAR_TIERS.find(t => t.stars === stars) || { color: '#888' }).color;
}

/** Yıldız sayısına göre STAR_TIERS_BASE kaydını döndürür. */
function getStarTierByStars(stars) {
  return STAR_TIERS_BASE.find(t => t.stars === stars);
}

/** Kısmi yıldız HTML'i oluşturur; kesirli puanları destekler. */
function partialStarsHtml(score, color, size = '0.9rem') {
  const c    = Math.max(0, Math.min(5, score));
  const full = Math.floor(c);
  const frac = c - full;
  let h = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= full) {
      h += `<span style="color:${color};font-size:${size};line-height:1">★</span>`;
    } else if (i === full + 1 && frac > 0.01) {
      const p = Math.round(frac * 100);
      h += `<span style="position:relative;display:inline-block;font-size:${size};line-height:1"><span style="color:#2a2a3a">★</span><span style="position:absolute;left:0;top:0;overflow:hidden;width:${p}%;color:${color};white-space:nowrap;line-height:1">★</span></span>`;
    } else {
      h += `<span style="color:#2a2a3a;font-size:${size};line-height:1">★</span>`;
    }
  }
  return h;
}

/** Ham puan string'ini sayıya çevirir; geçersizse NaN döner. */
function parseScore(raw) {
  const v = parseFloat(String(raw).replace(',', '.'));
  return isNaN(v) ? NaN : Math.round(v * 10) / 10;
}

// ── Entry sıralama ──
/** Entry dizisini verilen moda göre sıralar; orijinal diziyi değiştirmez. */
function sortEntries(entries, mode) {
  const arr = [...entries];
  switch (mode) {
    case 'name':         return arr.sort((a, b) => (a.name  || '').localeCompare(b.name  || '', 'tr'));
    case 'title':        return arr.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'tr'));
    case 'score-desc':   return arr.sort((a, b) => b.score - a.score);
    case 'score-asc':    return arr.sort((a, b) => a.score - b.score);
    case 'watched-asc':  return arr.sort((a, b) => (a.watched || '').localeCompare(b.watched || '', 'tr'));
    case 'watched-desc': return arr.sort((a, b) => (b.watched || '').localeCompare(a.watched || '', 'tr'));
    default:             return arr; // 'added'
  }
}

// ── Arama/filtre eşleşme ──
/** Entry'nin arama sorgusuna uyup uymadığını kontrol eder. */
function entryMatchesQuery(e, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const fields = [e.name, e.title, e.desc, e.watched];
  // custom field değerlerini de ekle
  if (e.customFieldValues) {
    Object.values(e.customFieldValues).forEach(v => fields.push(String(v || '')));
  }
  return fields.some(f => f && f.toLowerCase().includes(q));
}

// ═══════════════════════════════════════════════════════════════
//  DragEngine — Genel amaçlı sürükle-bırak ve yeniden boyutlandırma altyapısı
//  Pointer Events API kullanır; touch + mouse birlikte çalışır.
// ═══════════════════════════════════════════════════════════════
const DragEngine = (() => {
  // Her element için kayıtlı listener'ları saklar: WeakMap<element, { listeners, resizeListeners }>
  const _registry = new WeakMap();

  /**
   * Verilen değeri gridSnap pikselinin katına yuvarlar.
   * @param {number} val   - Yuvarlanacak değer
   * @param {number} snap  - Izgara boyutu (≤0 ise yuvarlama yapılmaz)
   * @returns {number}
   */
  function _snap(val, snap) {
    if (!snap || snap <= 0) return val;
    return Math.round(val / snap) * snap;
  }

  /**
   * Değeri [min, max] aralığına sıkıştırır; min/max undefined ise sınır uygulanmaz.
   * @param {number} val
   * @param {number|undefined} min
   * @param {number|undefined} max
   * @returns {number}
   */
  function _clamp(val, min, max) {
    if (min !== undefined && val < min) val = min;
    if (max !== undefined && val > max) val = max;
    return val;
  }

  /**
   * Bir elementi sürüklenebilir yapar.
   * @param {HTMLElement} element  - Hareket ettirilecek DOM elementi
   * @param {HTMLElement} handle   - Sürükleme tutacağı (element veya onun child'ı)
   * @param {function({dx,dy,x,y}):void} onMove  - Her sürükleme adımında çağrılır
   * @param {function({x,y}):void}       onEnd   - Sürükleme bitince çağrılır
   * @param {{ minX?:number, minY?:number, maxX?:number, maxY?:number, gridSnap?:number }} [options]
   */
  function makeDraggable(element, handle, onMove, onEnd, options = {}) {
    const { minX, minY, maxX, maxY, gridSnap = 0 } = options;

    let startX = 0, startY = 0;
    let lastX  = 0, lastY  = 0;
    let dragging = false;

    function onPointerDown(e) {
      if (e.button !== undefined && e.button !== 0) return; // sadece sol tık / tek parmak
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      lastX  = startX;
      lastY  = startY;
      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (!dragging) return;
      const rawX = _clamp(_snap(e.clientX, gridSnap), minX, maxX);
      const rawY = _clamp(_snap(e.clientY, gridSnap), minY, maxY);
      const dx = rawX - lastX;
      const dy = rawY - lastY;
      lastX = rawX;
      lastY = rawY;
      if (onMove) onMove({ dx, dy, x: rawX, y: rawY });
    }

    function onPointerUp(e) {
      if (!dragging) return;
      dragging = false;
      if (onEnd) onEnd({ x: lastX, y: lastY });
    }

    handle.style.touchAction = 'none'; // pointer events için gerekli
    handle.addEventListener('pointerdown', onPointerDown);
    handle.addEventListener('pointermove', onPointerMove);
    handle.addEventListener('pointerup',   onPointerUp);
    handle.addEventListener('pointercancel', onPointerUp);

    // Kayıt
    if (!_registry.has(element)) _registry.set(element, { listeners: [], resizeListeners: [] });
    _registry.get(element).listeners.push({ handle, onPointerDown, onPointerMove, onPointerUp });
  }

  /**
   * Bir elementi 8 yönlü yeniden boyutlandırılabilir yapar.
   * Her kenar/köşe için otomatik olarak resize tutacakları oluşturur.
   * @param {HTMLElement} element  - Boyutlandırılacak element
   * @param {function({w,h,x,y}):void} onResize  - Her boyut değişiminde çağrılır
   * @param {{ minW?:number, minH?:number, maxW?:number, maxH?:number, gridSnap?:number }} [options]
   */
  function makeResizable(element, onResize, options = {}) {
    const { minW = 40, minH = 20, maxW, maxH, gridSnap = 0 } = options;

    // 8 yön tanımı: [isim, imleç, yatay çarpan, dikey çarpan]
    const directions = [
      ['n',  'n-resize',   0, -1],
      ['s',  's-resize',   0,  1],
      ['e',  'e-resize',   1,  0],
      ['w',  'w-resize',  -1,  0],
      ['ne', 'ne-resize',  1, -1],
      ['nw', 'nw-resize', -1, -1],
      ['se', 'se-resize',  1,  1],
      ['sw', 'sw-resize', -1,  1],
    ];

    const handleEls = [];

    directions.forEach(([dir, cursor, hMul, vMul]) => {
      const h = document.createElement('div');
      h.dataset.resizeDir = dir;
      const isCorner = dir.length === 2;
      const size = isCorner ? '12px' : '6px';
      const pos  = {
        n:  { top: '0',  left: '50%', transform: 'translateX(-50%)', width: '60%', height: size },
        s:  { bottom: '0', left: '50%', transform: 'translateX(-50%)', width: '60%', height: size },
        e:  { right: '0', top: '50%',  transform: 'translateY(-50%)', height: '60%', width: size },
        w:  { left: '0',  top: '50%',  transform: 'translateY(-50%)', height: '60%', width: size },
        ne: { top: '0',   right: '0',  width: size, height: size },
        nw: { top: '0',   left: '0',   width: size, height: size },
        se: { bottom: '0',right: '0',  width: size, height: size },
        sw: { bottom: '0',left: '0',   width: size, height: size },
      }[dir];

      Object.assign(h.style, {
        position: 'absolute',
        cursor,
        zIndex: '10',
        boxSizing: 'border-box',
        touchAction: 'none',
        ...pos,
      });

      let startX = 0, startY = 0;
      let startW = 0, startH = 0;
      let startLeft = 0, startTop = 0;
      let resizing = false;

      h.addEventListener('pointerdown', e => {
        resizing = true;
        startX    = e.clientX;
        startY    = e.clientY;
        const rect = element.getBoundingClientRect();
        startW    = rect.width;
        startH    = rect.height;
        startLeft = parseFloat(element.style.left) || 0;
        startTop  = parseFloat(element.style.top)  || 0;
        h.setPointerCapture(e.pointerId);
        e.preventDefault();
        e.stopPropagation();
      });

      h.addEventListener('pointermove', e => {
        if (!resizing) return;
        const dx = _snap(e.clientX - startX, gridSnap);
        const dy = _snap(e.clientY - startY, gridSnap);

        let newW = _clamp(startW + dx * hMul, minW, maxW);
        let newH = _clamp(startH + dy * vMul, minH, maxH);
        let newX = startLeft;
        let newY = startTop;

        // Sol/yukarı kenarda hareket edince pozisyon da değişmeli
        if (hMul === -1) newX = startLeft + (startW - newW);
        if (vMul === -1) newY = startTop  + (startH - newH);

        if (onResize) onResize({ w: newW, h: newH, x: newX, y: newY });
      });

      h.addEventListener('pointerup',     () => { resizing = false; });
      h.addEventListener('pointercancel', () => { resizing = false; });

      element.appendChild(h);
      handleEls.push(h);
    });

    if (!_registry.has(element)) _registry.set(element, { listeners: [], resizeListeners: [] });
    _registry.get(element).resizeListeners.push(...handleEls);
  }

  /**
   * Bir element için makeDraggable / makeResizable ile eklenen tüm listener'ları ve
   * tutacak elementlerini temizler.
   * @param {HTMLElement} element
   */
  function destroy(element) {
    const rec = _registry.get(element);
    if (!rec) return;
    rec.listeners.forEach(({ handle, onPointerDown, onPointerMove, onPointerUp }) => {
      handle.removeEventListener('pointerdown',   onPointerDown);
      handle.removeEventListener('pointermove',   onPointerMove);
      handle.removeEventListener('pointerup',     onPointerUp);
      handle.removeEventListener('pointercancel', onPointerUp);
    });
    rec.resizeListeners.forEach(h => { if (h.parentNode) h.parentNode.removeChild(h); });
    _registry.delete(element);
  }

  return { makeDraggable, makeResizable, destroy };
})();
