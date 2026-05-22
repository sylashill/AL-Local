// ═══════════════════════════════════════════════════════════════
//  storage.js — localStorage veri katmanı
//  Görev: Veriyi oku/yaz, liste al, ayar al, varsayılan değerler
// ═══════════════════════════════════════════════════════════════

const DEFAULT_SETTINGS = {
  font: 'Inconsolata',
  fontSize: 14,
  'col-bg': '#08080f', 'col-surface': '#0e0e1a', 'col-card': '#131320',
  'col-border': '#1f1f35', 'col-text': '#ddddf5', 'col-accent': '#e040fb',
  'op-nav': 90, 'op-modal': 100, 'op-card': 100, 'op-surface': 100,
  'op-border': 100, 'op-tag': 100, 'ui-sat': 100, 'ui-bri': 100,
  bgOpacity: 18, bgImg: null,
  sortMode: 'added',
  tierGap: 8,
  // Kart & Görünüm
  cardRadius: 3, cardWidth: 80, cardHeight: 112,
  cardShadow: 12, cardHoverBright: 140, cardHoverLift: 2,
  cardImgPos: 'top', cardImgFit: 'cover',
  // Liste & Sıralama
  tagShapeGlobal: '2px', tagPadX: 6, tagPadY: 3,
  // Animasyon
  transitionSpeed: '120ms',
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
  'Inconsolata','Share Tech Mono','Major Mono Display','Syne Mono','VT323','Courier Prime',
  'Source Code Pro','Fira Code','JetBrains Mono','Space Mono','Roboto Mono','Ubuntu Mono',
  'IBM Plex Mono','Cutive Mono','Nova Mono','Anonymous Pro','Overpass Mono','DM Mono',
  'Zen Kaku Gothic New','Orbitron','Rajdhani','Exo 2','Oxanium','Chakra Petch',
  'Audiowide','Electrolize','Michroma','Aldrich','Russo One','Exo','Play',
  'Titillium Web','Barlow','Barlow Condensed','Teko','Saira','Saira Condensed',
  'Cinzel','Cinzel Decorative','Press Start 2P','Silkscreen','Special Elite',
  'Permanent Marker','Bebas Neue','Black Han Sans','Raleway','Righteous',
  'Poiret One','Comfortaa','Nunito','Quicksand','Varela Round',
  'Noto Sans JP','Noto Serif JP','BIZ UDGothic','Zen Kurenaido','Stick',
  'Playfair Display','Cormorant Garamond','Libre Baskerville','Crimson Text',
  'IM Fell English','Cardo',
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
/** Veriyi localStorage'a yazar; immediate=true ise debounce olmadan anında kaydeder. */
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

/** Özel katman nesnesine eksik alanları migration ile ekler (yalnızca loadData sırasında çalışır). */
function migrateTier(t) {
  if (t.headerBannerImg === undefined)        t.headerBannerImg = t.bannerImg || null;
  if (t.headerBannerFull === undefined)       t.headerBannerFull = false;
  if (t.headerBannerFit === undefined)        t.headerBannerFit = t.bannerFit || 'cover';
  if (t.headerBannerSaturation === undefined) t.headerBannerSaturation = 100;
  if (t.headerBannerBrightness === undefined) t.headerBannerBrightness = t.bannerBrightness || 100;
  if (t.headerBannerBlur === undefined)       t.headerBannerBlur = t.bannerBlur || 0;
  if (t.bodyBannerImg === undefined)          t.bodyBannerImg = null;
  if (t.bodyBannerFit === undefined)          t.bodyBannerFit = 'cover';
  if (t.bodyBannerBlur === undefined)         t.bodyBannerBlur = 0;
  if (t.bodyBannerBrightness === undefined)   t.bodyBannerBrightness = 100;
  if (t.bodyBannerOpacity === undefined)      t.bodyBannerOpacity = 40;
  if (t.bodyShape === undefined)              t.bodyShape = '0px 0px 4px 4px';
  if (t.headerShape === undefined)            t.headerShape = '0px';
  if (t.tagShape === undefined)               t.tagShape = '2px';
  if (t.bodyMinHeight === undefined)          t.bodyMinHeight = 48;
  if (t.tagGap === undefined)                 t.tagGap = 5;
  if (t.borderOpacity === undefined)          t.borderOpacity = 100;
  if (t.headerMinWidth === undefined)         t.headerMinWidth = 0;
  if (t.hidden === undefined)                 t.hidden = false;
  if (t.headerGradientEnabled === undefined)  t.headerGradientEnabled = false;
  if (t.headerGradientColor1 === undefined)   t.headerGradientColor1 = '#7c3aed';
  if (t.headerGradientColor2 === undefined)   t.headerGradientColor2 = '#2563eb';
  if (t.headerGradientAngle === undefined)    t.headerGradientAngle = 135;
  if (t.headerCountEnabled === undefined)     t.headerCountEnabled = false;
  if (t.compactMode === undefined)            t.compactMode = false;
  if (t.headerGlowEnabled === undefined)      t.headerGlowEnabled = false;
  if (t.headerGlowIntensity === undefined)    t.headerGlowIntensity = 8;
  if (t.dividerStyle === undefined)           t.dividerStyle = 'none';
  if (t.bodyColorReflect === undefined)       t.bodyColorReflect = false;
  if (t.bodyJustify === undefined)            t.bodyJustify = 'flex-start';
  if (t.bodyPaddingLeft === undefined)        t.bodyPaddingLeft = 0;
  if (t.bodyPaddingRight === undefined)       t.bodyPaddingRight = 0;
  if (t.gridMode === undefined)               t.gridMode = false;
  if (t.gridCols === undefined)               t.gridCols = 4;
  // Serbest konumlandırma alanları
  if (t.freeLayout === undefined)             t.freeLayout = false;
  if (t.canvasW === undefined)               t.canvasW = 900;
  if (t.canvasH === undefined)               t.canvasH = 300;
  if (t.headerBox === undefined)             t.headerBox = { x: 0, y: 0, w: 900, h: 60 };
  if (t.bodyBox === undefined)               t.bodyBox   = { x: 0, y: 60, w: 900, h: 240 };
  // Bütünleşik Banner Hizalama — pozisyon kontrolleri
  if (t.headerBannerPosX === undefined)      t.headerBannerPosX = 50;
  if (t.headerBannerPosY === undefined)      t.headerBannerPosY = 0;
  if (t.bodyBannerPosX === undefined)        t.bodyBannerPosX = 50;
  if (t.bodyBannerPosY === undefined)        t.bodyBannerPosY = 0;
  // Bütünleşik Mod toggle
  if (t.linkedBanner === undefined)          t.linkedBanner = false;
}

/** localStorage'dan listeleri yükler; eksik alanları migration ile tamamlar. */
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
    if (!l.customFields)  l.customFields = [];
    // Her tier'ı migrate et — sadece yükleme sırasında bir kez çalışır
    l.customTiers.forEach(t => migrateTier(t));
  });
}

/** Belirtilen id'ye sahip listeyi döndürür; bulunamazsa null döner. */
function getList(id) { return lists.find(l => l.id === id) || null; }

/** Belirtilen liste için ayarları DEFAULT_SETTINGS ile birleştirilmiş olarak döndürür. */
function getSettings(listId) {
  const l = getList(listId);
  if (!l) return { ...DEFAULT_SETTINGS };
  return Object.assign({}, DEFAULT_SETTINGS, l.settings);
}
