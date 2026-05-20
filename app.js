// ═══════════════════════════════════════════════════════════════
//  app.js — Navigasyon, liste yönetimi, init
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────
//  PAGE / TAB NAVİGASYON
// ─────────────────────────────────────────
function switchTab(target) {
  if (target === 'settings') {
    AppState.currentPage = 'settings';
  } else {
    AppState.currentPage  = 'liste';
    AppState.activeListId = target;
    AppState.settingsListId = target;
    _settingsDraft = null;
    _settingsListSelected = false;
  }

  document.getElementById('page-liste').classList.toggle('active', AppState.currentPage === 'liste');
  document.getElementById('page-settings').classList.toggle('active', AppState.currentPage === 'settings');
  renderTopNav();

  if (AppState.currentPage === 'liste') {
    AppState.filterQuery = '';
    renderTierPage();
  } else {
    _settingsDraft = null;
    _settingsListSelected = false;
    const bar = document.getElementById('settings-save-bar');
    if (bar) bar.style.display = 'none';

    const ids = ['s-list-mgmt','settings-dynamic-content','settings-io-section',
                 'settings-readable-section','settings-data-divider','settings-readable-divider'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = 'none';
        if (id === 'settings-dynamic-content') el.innerHTML = '';
      }
    });
    renderSettingsPanel();
  }
}

function switchPage(page) {
  switchTab(page === 'liste' ? AppState.activeListId : 'settings');
}

function mainListOnSelect(id) { switchTab(id); }

// settings.js'deki renderListSelector no-op
function renderListSelector() {}

// ─────────────────────────────────────────
//  LİSTE YÖNETİMİ
// ─────────────────────────────────────────
function createNewList() {
  if (lists.length >= 10) { showInfo('Limit', 'Maksimum 10 liste oluşturabilirsin.'); return; }
  const id = 'list-' + Date.now();
  lists.push({
    id, name: 'Liste ' + lists.length,
    entries: [], customTiers: [], settings: {},
    starTierOrder: [5,4,3,2,1], tierLayout: [], customFields: []
  });
  saveData(true);
  switchTab(id);
}

function deleteList(id) {
  if (id === 'main') { showInfo('Silinemez', 'Ana liste silinemez.'); return; }
  showConfirm('Listeyi Sil', 'Bu listedeki tüm animeler silinecek. Devam et?', () => {
    lists = lists.filter(l => l.id !== id);
    saveData(true);
    if (AppState.activeListId === id)   AppState.activeListId   = 'main';
    if (AppState.settingsListId === id) AppState.settingsListId = 'main';
    switchTab(AppState.currentPage === 'settings' ? 'settings' : AppState.activeListId);
  });
}

function renameList(id, newName) {
  const l = getList(id);
  if (l && newName.trim()) {
    l.name = newName.trim(); saveData(); renderSettingsPanel(); renderTopNav();
  }
}

// ─────────────────────────────────────────
//  LİSTE ŞABLON SİSTEMİ
// ─────────────────────────────────────────
function exportListTemplate(listId) {
  const l = getList(listId);
  if (!l) { showInfo('Hata', 'Liste bulunamadı.'); return; }
  const template = {
    _type: 'al2-template',
    version: 1,
    name: l.name,
    settings: { ...l.settings },
    customTiers: l.customTiers.map(t => ({ ...t, _advOpen: false, _advTab: 'header' })),
    customFields: l.customFields || [],
  };
  const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = l.name.replace(/\s+/g, '-').toLowerCase() + '-sablon.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showInfo('Şablon İndirildi', '"' + l.name + '" şablonu kaydedildi. Başka bir listeye uygulayabilirsin.');
}

function importListTemplate(event, targetListId) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const tpl = JSON.parse(ev.target.result);
      if (tpl._type !== 'al2-template') throw new Error('Geçerli bir şablon dosyası değil.');
      const l = getList(targetListId);
      if (!l) throw new Error('Hedef liste bulunamadı.');
      showConfirm(
        'Şablon Uygula',
        `"${escHtml(tpl.name)}" şablonu "${escHtml(l.name)}" listesine uygulanacak. Mevcut katmanlar ve ayarlar değişecek, animeler korunacak. Devam et?`,
        () => {
          l.settings = { ...l.settings, ...tpl.settings };
          // Yeni ID'lerle katmanları ekle
          const idMap = {};
          l.customTiers = tpl.customTiers.map(t => {
            const newId = 'ct-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5);
            idMap[t.id] = newId;
            return { ...t, id: newId };
          });
          if (tpl.customFields) l.customFields = tpl.customFields;
          l.tierLayout = [];
          saveData(true);
          _lastAppliedListId = null;
          AppState._lastAppliedListId = null;
          if (AppState.activeListId === targetListId) renderTierPage();
          renderSettingsPanel();
          showInfo('Şablon Uygulandı', 'Katmanlar, özel alanlar ve görünüm ayarları güncellendi.');
        }
      );
    } catch (e) {
      showInfo('Hata', 'Şablon okunamadı: ' + e.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ─────────────────────────────────────────
//  GLOBAL EVENT LISTENER'LAR
// ─────────────────────────────────────────
['form-overlay', 'detail-overlay', 'confirm-overlay'].forEach(id => {
  document.getElementById(id).addEventListener('click', e => {
    if (e.target === e.currentTarget) {
      if (id === 'form-overlay')    closeForm();
      else if (id === 'detail-overlay') closeDetail();
      else closeConfirm();
    }
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeForm(); closeDetail(); closeConfirm(); }
  // Ctrl+F / Cmd+F → arama kutusuna odaklan
  if ((e.ctrlKey || e.metaKey) && e.key === 'f' && AppState.currentPage === 'liste') {
    e.preventDefault();
    const inp = document.getElementById('search-input');
    if (inp) inp.focus();
  }
});

// Android dokunma iyileştirmeleri
document.addEventListener('touchstart', function () {}, { passive: true });

const viewportMeta = document.querySelector('meta[name=viewport]');
if (viewportMeta) {
  window.addEventListener('resize', () => {
    const activeOverlay = document.querySelector('.overlay.on');
    if (activeOverlay) {
      const box = activeOverlay.querySelector('.modal-box, .detail-modal, .confirm-box');
      if (box) box.scrollIntoView({ block: 'nearest' });
    }
  });
}

// ─────────────────────────────────────────
//  BAŞLATMA (INIT)
// ─────────────────────────────────────────
loadData();
if (lists[0] && lists[0].id === 'main') lists[0].name = 'Ana Liste';
renderTopNav();
switchTab('main');
