// ═══════════════════════════════════════════════════════════════
//  storage.js — localStorage veri katmanı
//  Görev: Veriyi oku/yaz, liste al, ayar al, varsayılan değerler
// ═══════════════════════════════════════════════════════════════

const DEFAULT_SETTINGS = {
  font: 'Inconsolata',
  'col-bg': '#08080f', 'col-surface': '#0e0e1a', 'col-card': '#131320',
  'col-border': '#1f1f35', 'col-text': '#ddddf5', 'col-accent': '#e040fb',
  'op-nav': 90, 'op-modal': 100, 'op-card': 100, 'op-surface': 100,
  'op-border': 100, 'op-tag': 100, 'ui-sat': 100, 'ui-bri': 100,
  bgOpacity: 18, bgImg: null,
  sortMode: 'added',   // 'added' | 'name' | 'score-asc' | 'score-desc'
  tierGap: 8,          // tier blokları arası boşluk (px)
};

const STAR_TIERS_BASE = [
  { stars: 5, min: 4.5, max: 5.01, color: '#ffd700' },
  { stars: 4, min: 3.5, max: 4.5,  color: '#c8a800' },
  { stars: 3, min: 2.5, max: 3.5,  color: '#8a7000' },
  { stars: 2, min: 1.5, max: 2.5,  color: '#806040' },
  { stars: 1, min: 0,   max: 1.5,  color: '#604020' },
];
const STAR_TIERS = STAR_TIERS_BASE; // alias

const GOOGLE_FONTS = [
  // Sans Serif
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Source Sans Pro', 'Oswald', 'Raleway', 'Ubuntu', 
  'Nunito', 'Quicksand', 'Work Sans', 'Kanit', 'Rubik', 'Prompt', 'Muli', 'Titillium Web', 'Barlow', 'Heebo',
  // Serif
  'Merriweather', 'Playfair Display', 'Lora', 'PT Serif', 'Libre Baskerville', 'Crimson Text', 'Cormorant Garamond', 'Noto Serif', 'Arvo', 'EB Garamond',
  // Monospace
  'Inconsolata', 'Fira Code', 'Source Code Pro', 'JetBrains Mono', 'Space Mono', 'Roboto Mono', 'Ubuntu Mono', 'IBM Plex Mono', 'Courier Prime', 'Share Tech Mono',
  // Display & Sci-Fi
  'Orbitron', 'Exo 2', 'Audiowide', 'Russo One', 'Rajdhani', 'Oxanium', 'Chakra Petch', 'Michroma', 'Electrolize', 'Aldrich',
  'Space Grotesk', 'Syncopate', 'Staatliches', 'Bebas Neue', 'Archivo Black', 'Righteous', 'Cinzel', 'Cinzel Decorative',
  // Handwritten & Decorative
  'Pacifico', 'Dancing Script', 'Caveat', 'Permanent Marker', 'Satisfy', 'Courgette', 'Great Vibes', 'Sacramento', 'Yellowtail', 'Shadows Into Light',
  'Comfortaa', 'Varela Round', 'Fredoka One', 'Patrick Hand', 'Amatic SC', 'Indie Flower', 'Gloria Hallelujah', 'Special Elite', 'Press Start 2P', 'Silkscreen',
  // International & Japanese
  'Noto Sans JP', 'Noto Serif JP', 'Zen Kaku Gothic New', 'BIZ UDGothic', 'Sawarabi Gothic', 'M PLUS 1p', 'Kosugi Maru', 'Zen Kurenaido', 'Stick', 'Kaisei Tokumin',
  // More Modern & Clean
  'Manrope', 'Be Vietnam Pro', 'Outfit', 'Plus Jakarta Sans', 'Sora', 'Lexend', 'Urbanist', 'Public Sans', 'Sen', 'Jost',
  // More Display
  'Abril Fatface', 'Alfa Slab One', 'Bungee', 'Carter One', 'Fascinate', 'Luckiest Guy', 'Monoton', 'Shojumaru', 'Unica One', 'Vampiro One'
];

// Hızlı tema preset'leri
const THEME_PRESETS = {
  'Varsayılan':   { 'col-bg':'#08080f','col-surface':'#0e0e1a','col-card':'#131320','col-border':'#1f1f35','col-text':'#ddddf5','col-accent':'#e040fb' },
  'Okyanus':      { 'col-bg':'#050d1a','col-surface':'#091525','col-card':'#0d1e30','col-border':'#1a3045','col-text':'#c8e0f5','col-accent':'#00b4d8' },
  'Ember':        { 'col-bg':'#0f0800','col-surface':'#1a0e00','col-card':'#221200','col-border':'#3d2200','col-text':'#f5ddc8','col-accent':'#ff6b00' },
  'Orman':        { 'col-bg':'#030f05','col-surface':'#071a0b','col-card':'#0c2410','col-border':'#163d1f','col-text':'#c5e8cc','col-accent':'#4caf50' },
  'Kırmızı Ay':   { 'col-bg':'#0f0303','col-surface':'#1a0606','col-card':'#220a0a','col-border':'#3d1414','col-text':'#f5c8c8','col-accent':'#ef5350' },
  'Altın':        { 'col-bg':'#0a0800','col-surface':'#15110000','col-card':'#1c1600','col-border':'#3d2e00','col-text':'#f5e8c5','col-accent':'#ffd600' },
};

// ── Ana veri değişkeni ──
let lists = [];

// ── Tek merkezli uygulama durumu ──
const AppState = {
  currentPage:      'liste',
  activeListId:     'main',
  settingsListId:   'main',
  viewMode:         'text',
  filterQuery:      '',
  detailEntryId:    null,
  detailListId:     null,
  editEntryId:      null,
  formListId:       null,
  formImg:          null,
  formTagColor:     null,
  formLayerIds:     [],
  layersPickerOpen: false,
  confirmCb:        null,
  copiedEntry:      null,
  _lastAppliedListId: null,
};

// ── Settings draft ──
let _settingsDraft = null;
let _settingsListSelected = false;

// ── Save debounce ──
let _saveTimer = null;
function saveData(immediate = false) {
  if (immediate) {
    localStorage.setItem('al2-lists', JSON.stringify(lists));
    return;
  }
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    localStorage.setItem('al2-lists', JSON.stringify(lists));
  }, 300);
}

function loadData() {
  const raw = localStorage.getItem('al2-lists');
  if (raw) {
    try { lists = JSON.parse(raw); } catch (e) { lists = []; }
  }
  if (!lists.length) {
    lists = [{ id: 'main', name: 'Ana Liste', entries: [], customTiers: [], settings: {}, starTierOrder: [5,4,3,2,1], tierLayout: [], customFields: [] }];
  }
  lists.forEach(l => {
    if (!l.settings)      l.settings = {};
    if (!l.customTiers)   l.customTiers = [];
    if (!l.starTierOrder) l.starTierOrder = [5,4,3,2,1];
    if (!l.customFields)  l.customFields = [];  // YENİ: custom field desteği
  });
}

function getList(id) { return lists.find(l => l.id === id) || null; }

function getSettings(listId) {
  const l = getList(listId);
  if (!l) return { ...DEFAULT_SETTINGS };
  return Object.assign({}, DEFAULT_SETTINGS, l.settings);
}
