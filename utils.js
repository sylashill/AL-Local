// ═══════════════════════════════════════════════════════════════
//  utils.js — Yardımcı fonksiyonlar
// ═══════════════════════════════════════════════════════════════

function genId(prefix = 'e') {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

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
function getTier(score) {
  for (const t of STAR_TIERS) if (score >= t.min && score < t.max) return t.stars;
  return 1;
}

function getTierColor(stars) {
  return (STAR_TIERS.find(t => t.stars === stars) || { color: '#888' }).color;
}

function getStarTierByStars(stars) {
  return STAR_TIERS_BASE.find(t => t.stars === stars);
}

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

function parseScore(raw) {
  const v = parseFloat(String(raw).replace(',', '.'));
  return isNaN(v) ? NaN : Math.round(v * 10) / 10;
}

// ── Entry sıralama ──
function sortEntries(entries, mode) {
  const arr = [...entries];
  switch (mode) {
    case 'name':       return arr.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    case 'score-desc': return arr.sort((a, b) => b.score - a.score);
    case 'score-asc':  return arr.sort((a, b) => a.score - b.score);
    default:           return arr; // 'added' — ekleme sırası
  }
}

// ── Arama/filtre eşleşme ──
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
