'use strict';

const STORAGE_KEY = 'silownia_tracker_v1';
const PROFILES_KEY = 'betternm_profiles_v1';
const ACTIVE_KEY = 'betternm_active_v1';
const THEME_KEY = 'betternm_theme_v1';
const ACCENT_KEY = 'betternm_accent_v1';
const MASCOT_KEY = 'betternm_mascot_v1';
const FEEDBACK_KEY = 'betternm_feedback_v1';
const SEEN_KEY = 'betternm_seen_v1';
const DATA_PREFIX = 'betternm_data_v1_';

const FEEDBACK_URL = 'https://silownia-feedback.dzeppetto9.workers.dev/api/feedback';

const APP_VERSION = 'beta 0.15';

const RELEASE_NOTES = {
  version: 'beta 0.15',
  changes: [
    'Ćwiczenia w treningu można zwijać/rozwijać (nagłówek) i oznaczać jako „zrobione” — to trafia też do zapisu',
    'Smart podpowiedź ciężaru: liczy 1RM (wzór Epleya) i proponuje progres ~2,5% po domkniętym treningu',
    'Historia pomiarów w Zdrowiu jako lista rozwijana (dotknij datę, by zobaczyć szczegóły)',
    'Statystyki miesiąca pokazują najczęstsze mięśnie (na podstawie zaznaczonych w treningu)',
    'Nowość w Ustawieniach → Trening: auto-start stopera odpoczynku po wpisaniu serii (opcja)',
    'Nowość w Ustawieniach → Trening: auto-wpisanie sugerowanego ciężaru do serii z rozpiski (opcja)',
    'Przypomnienie o zawodach na dzień przed startem',
    'Motyw „Auto” w Ustawieniach → Wygląd — jasny w dzień, ciemny w nocy',
    'Import ze Stravy: wgraj plik z eksportu (activities.csv, .gpx lub .tcx) — biegi i jazdy trafią do kalendarza',
    'Przycisk zgłaszania uwag (flaga) obok ustawień w nagłówku',
    'Poprawka: kafelek kolorów akcentu w równych odstępach'
  ]
};

const ACCENTS = {
  orange: { label: 'Pomarańczowy', color: '#fc4c02' },
  red: { label: 'Czerwony', color: '#ef4444' },
  pink: { label: 'Różowy', color: '#ec4899' },
  blue: { label: 'Niebieski', color: '#38bdf8' },
  green: { label: 'Zielony', color: '#34d399' },
  purple: { label: 'Fioletowy', color: '#a78bfa' },
  yellow: { label: 'Żółty', color: '#fdb515' },
  teal: { label: 'Turkusowy', color: '#2dd4bf' }
};

const DEFAULT_PROFILES = [
  { id: 'maciek', name: 'Maciek' },
  { id: 'natalia', name: 'Natalia' }
];

function hasLegacyData() {
  try {
    if (localStorage.getItem(STORAGE_KEY)) return true;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf(DATA_PREFIX) === 0) return true;
    }
  } catch (e) {}
  return false;
}

function defaultProfiles() {
  const defs = JSON.parse(JSON.stringify(DEFAULT_PROFILES));
  if (hasLegacyData()) {
    saveProfiles(defs);
    return defs;
  }
  return [];
}
function getProfiles() {
  try {
    const p = JSON.parse(localStorage.getItem(PROFILES_KEY) || 'null');
    if (Array.isArray(p) && p.length && p.every(x => x && x.id && x.name)) return p;
  } catch (e) {}
  return defaultProfiles();
}
function saveProfiles(profiles) {
  try { localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles)); } catch (e) {}
}
function activeProfile() {
  const p = getProfiles();
  if (!p.length) return { id: '', name: '' };
  const id = localStorage.getItem(ACTIVE_KEY);
  return p.find(x => x.id === id) || p[0];
}
function setActiveProfileId(id) { try { localStorage.setItem(ACTIVE_KEY, id); } catch (e) {} }
function profileDataKey(id) { return DATA_PREFIX + id; }

function getTheme() { return localStorage.getItem(THEME_KEY) || 'dark'; }
function effectiveTheme(mode) {
  const m = mode || getTheme();
  if (m !== 'auto') return m === 'light' ? 'light' : 'dark';
  const h = new Date().getHours();
  return (h >= 7 && h < 20) ? 'light' : 'dark';
}
function applyTheme(theme) {
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  const eff = effectiveTheme(theme);
  document.documentElement.setAttribute('data-theme', eff);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', eff === 'light' ? '#ffffff' : '#0f0f13');
  const d = document.getElementById('theme-dark');
  const l = document.getElementById('theme-light');
  const a = document.getElementById('theme-auto');
  if (d) d.classList.toggle('active', theme === 'dark');
  if (l) l.classList.toggle('active', theme === 'light');
  if (a) a.classList.toggle('active', theme === 'auto');
  applyAccent(getAccent());
}

function getAccent() {
  const v = localStorage.getItem(ACCENT_KEY);
  if (v && ACCENTS[v]) return v;
  return effectiveTheme() === 'light' ? 'pink' : 'purple';
}
function applyAccent(accent) {
  try { localStorage.setItem(ACCENT_KEY, accent); } catch (e) {}
  document.documentElement.setAttribute('data-accent', accent);
  const row = document.getElementById('accent-swatches');
  if (!row) return;
  const btns = row.querySelectorAll('.accent-swatch');
  btns.forEach(b => b.classList.toggle('active', b.dataset.accent === accent));
}
function renderAccentSwatches() {
  const row = document.getElementById('accent-swatches');
  if (!row) return;
  row.innerHTML = Object.keys(ACCENTS).map(k => {
    const a = ACCENTS[k];
    return '<div class="accent-item"><button class="accent-swatch" data-accent="' + k +
      '" style="background:' + a.color + '" aria-label="' + a.label + '"></button>' +
      '<span class="accent-swatch-label">' + a.label + '</span></div>';
  }).join('');
  applyAccent(getAccent());
}

function getMascot() { return localStorage.getItem(MASCOT_KEY) || 'none'; }
function applyMascot(m) {
  try { localStorage.setItem(MASCOT_KEY, m); } catch (e) {}
  document.documentElement.setAttribute('data-mascot', m === 'jamnik' ? 'jamnik' : 'none');
  const j = document.getElementById('mascot-jamnik');
  const n = document.getElementById('mascot-none');
  if (j) j.classList.toggle('active', m === 'jamnik');
  if (n) n.classList.toggle('active', m !== 'jamnik');
}

const RUN_TYPES = { 'easy-run': 'Easy Run', 'long-run': 'Long Run', 'podbiegi': 'Podbiegi' };

const RUN_LETTERS = { 'easy-run': 'E', 'long-run': 'L', 'podbiegi': 'T' };

const RUN_DISTANCES = [1, 2, 5, 8, 10, 15, 21];

const PLAN_ICONS = {
  'plecy-biceps': 'back',
  'klatka-barki': 'chest',
  'nogi': 'legs',
  'plyometria': 'bolt'
};

const ICONS = {
  shoe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17h17l.8-2.5-6.3-2L13 9H8.5L5 12 4 17z"/><path d="M4 17v3h16l1.5-1.5"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="2"/><path d="M12 6v16"/><path d="M6 9c0-2 2-3.5 6-3.5S18 7 18 9c0 4-6 6-6 6s-6-2-6-6z"/></svg>',
  chest: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="2"/><path d="M12 6v3"/><path d="M6 10c0-2 2.5-3.5 6-3.5S18 8 18 10c0 4-6 6-6 6s-6-2-6-6z"/><path d="M9 11l1.5 2M15 11l-1.5 2"/></svg>',
  legs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2v18"/><path d="M15 2v18"/><path d="M6 20h6"/><path d="M12 20h6"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/></svg>',
  dumbbell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5v11M17.5 6.5v11"/><path d="M3.5 9v6M20.5 9v6"/><path d="M6.5 12h11"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c.5 3-1 4.5-2 6-1.5 2.2-3 4-3 7a5 5 0 0 0 10 0c0-2-.8-3.6-2-5.2-1.3 1.5-2.3 2.4-3.4 2.9 1-3.5.9-7 0-10.7z"/><path d="M12 3c-1.3 3.5-2 7.5-2 10 0 1.7 1.3 3 3 3s3-1.3 3-3c0-2.5-.7-5.5-2-8.5"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4c3-2 6 2 9 0s6 1 6 1v9c-3-1-6 1-9-1s-6 0-6 0"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  bike: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>'
};

function icon(name) { return ICONS[name] || ICONS.dumbbell; }

function jamnikSVG(size) {
  size = size || 44;
  return '<svg class="jamnik-ico" width="' + size + '" height="' + Math.round(size * 0.55) + '" viewBox="0 0 120 66" fill="currentColor" aria-hidden="true">' +
    '<rect x="40" y="20" width="58" height="17" rx="8.5"/>' +
    '<path d="M94 26 q16 -1 19 -15" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>' +
    '<circle cx="32" cy="23" r="11"/>' +
    '<rect x="9" y="25" width="22" height="10" rx="5"/>' +
    '<path d="M28 13 q-7 -7 4 -7 q7 0 3 9 q-1 3 -7 1z"/>' +
    '<circle cx="9" cy="29" r="2.4"/>' +
    '<rect x="46" y="37" width="7" height="16" rx="3.5"/>' +
    '<rect x="60" y="37" width="7" height="16" rx="3.5"/>' +
    '<rect x="74" y="37" width="7" height="16" rx="3.5"/>' +
    '<rect x="88" y="37" width="7" height="16" rx="3.5"/></svg>';
}

function mascotOn() { return getMascot() === 'jamnik'; }

const MONTHS = ['styczeń','luty','marzec','kwiecień','maj','czerwiec','lipiec','sierpień','wrzesień','październik','listopad','grudzień'];
const DOWS = ['Pn','Wt','Śr','Cz','Pt','So','Nd'];

const DEFAULT_PLANS = [
  { id: 'plecy-biceps', name: 'Plecy + Biceps', category: 'silownia', desc: '', tags: ['plecy', 'biceps'], exercises: [
    'Ściąganie drążka wyciągu górnego do klatki (Lat Pulldown)',
    'Odwrotne rozpiętki na maszynie (Reverse Pec Deck)',
    'Wiosłowanie sztangą w opadzie tułowia (Bent-Over Barbell Row)',
    'Ściąganie linki jednorącz w klęku (Kneeling Single-Arm High-to-Low Cable Pulldown)',
    'Uginanie ramion na linkach (Cable Bicep Curl)'
  ]},
  { id: 'nogi', name: 'Nogi', category: 'silownia', desc: '', tags: ['nogi', 'posladki', 'lydki'], exercises: [
    'Przysiad ze sztangą + wyskoki (Barbell Squat + Jump Squats)',
    'Hip Thrust ze sztangą (Barbell Hip Thrust)',
    'Przysiady bułgarskie (Bulgarian Split Squats)',
    'Wspięcia na palce siedząc (Seated Calf Raise)',
    'Prostowanie nóg na maszynie / Zginanie nóg siedząc (Leg Extension / Seated Leg Curl)',
    'Martwy ciąg rumuński na Smithie (Smith Machine RDL)'
  ]},
  { id: 'klatka-barki', name: 'Klatka + Barki', category: 'silownia', desc: '', tags: ['klatka', 'barki', 'triceps'], exercises: [
    'Wyciskanie sztangi na ławce płaskiej (Barbell Bench Press)',
    'Rozpiętki na maszynie (Pec Deck Fly)',
    'Unoszenie ramion bokiem (Modified Lateral Raises)',
    'Prostowanie ramion na triceps (Cable Triceps Pushdown)',
    'Dipy na poręczach (Dips)'
  ]},
  { id: 'plyometria', name: 'Plyometria + Stabilizacja', category: 'silownia', desc: '', tags: ['nogi', 'posladki', 'brzuch'], exercises: [
    'Naprzemienne boczne przeskoki jednonóż (Alternating Lateral Single-Leg Hops)',
    'Przeskoki w wykroku (Jumping Lunges)',
    'Sprężyste podskoki jednonóż (Single-Leg Pogo Hops)',
    'Przysiad wykroczny (Split Squat)',
    'Wspięcia na palce jednonóż (Single-Leg Calf Raises)',
    'Martwy ciąg rumuński jednonóż (Single-Leg RDL)',
    'Przysiady kozackie (Cossack Squats)',
    'Most biodrowy jednonóż (Single-Leg Glute Bridges)',
    '„Allahy” na wyciągu (Kneeling Cable Crunch)',
    'Deska kopenhaska (Copenhagen Plank)',
    'Ćwiczenie na mięśnie skośne (Oblique Core Exercise)'
  ]},
  { id: 'easy-run', name: 'Easy Run', category: 'bieganie', desc: 'Swobodny bieg w spokojnym tempie.', exercises: [] },
  { id: 'long-run', name: 'Long Run', category: 'bieganie', desc: 'Długi spokojny wybieganie.', exercises: [] },
  { id: 'podbiegi', name: 'Podbiegi', category: 'bieganie', desc: 'Bieg z podbiegami i interwałami.', exercises: [] }
];

const MUSCLE_TAGS = [
  { key: 'plecy', label: 'Plecy' },
  { key: 'klatka', label: 'Klatka' },
  { key: 'barki', label: 'Barki' },
  { key: 'biceps', label: 'Biceps' },
  { key: 'triceps', label: 'Triceps' },
  { key: 'przedramiona', label: 'Przedramiona' },
  { key: 'nogi', label: 'Nogi' },
  { key: 'posladki', label: 'Pośladki' },
  { key: 'tylek', label: 'Tyłek' },
  { key: 'lydki', label: 'Łydki' },
  { key: 'brzuch', label: 'Brzuch' }
];

function muscleTag(key) { return MUSCLE_TAGS.find(t => t.key === key); }
function muscleTagLabel(key) { const t = muscleTag(key); return t ? t.label : key; }
function planTags(p) { return Array.isArray(p.tags) ? p.tags : []; }

function defaultData() {
  return {
    plans: JSON.parse(JSON.stringify(DEFAULT_PLANS)),
    logs: [],
    runs: [],
    bikes: [],
    health: [],
    races: [],
    photos: [],
    goal: {}
  };
}

let data = load();

function normalizeData(d) {
  if (!Array.isArray(d.runs)) d.runs = [];
  if (!Array.isArray(d.bikes)) d.bikes = [];
  if (!Array.isArray(d.health)) d.health = [];
  if (!Array.isArray(d.races)) d.races = [];
  if (!Array.isArray(d.photos)) d.photos = [];
  if (!d.goal || typeof d.goal !== 'object') d.goal = {};
  return d;
}

function load() {
  const key = profileDataKey(activeProfile().id);
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      const d = JSON.parse(raw);
      if (d && Array.isArray(d.plans) && Array.isArray(d.logs)) return normalizeData(d);
    } catch (e) {}
    const bk = tryBackup(activeProfile().id, key);
    if (bk) return bk;
  } else {
    const bk = tryBackup(activeProfile().id, key);
    if (bk) return bk;
  }
  try {
    const legacyRaw = localStorage.getItem(STORAGE_KEY);
    if (legacyRaw) {
      const d = JSON.parse(legacyRaw);
      if (d && Array.isArray(d.plans) && Array.isArray(d.logs)) {
        localStorage.setItem(key, legacyRaw);
        return normalizeData(d);
      }
    }
  } catch (e) {}
  return defaultData();
}

function tryBackup(id, key) {
  const bkRaw = localStorage.getItem(backupKey(id));
  if (!bkRaw) return null;
  try {
    const bk = JSON.parse(bkRaw);
    if (bk && Array.isArray(bk.plans) && Array.isArray(bk.logs)) {
      localStorage.setItem(key, bkRaw);
      setTimeout(() => toast('Dane odzyskane z kopii bezpieczeństwa'), 300);
      return normalizeData(bk);
    }
  } catch (e) {}
  return null;
}

function migratePlans(d) {
  let changed = false;
  const back = { id: 'plecy-biceps', old: ['Martwy ciąg','Wiosłowanie sztangą w opadzie','Podciąganie na drążku','Wiosłowanie hantlem','Przyciąganie linki wyciągu do brzucha','Uginanie ramion ze sztangą','Uginanie ramion z hantlami na modlitewniku','Młotki hantlami'] };
  const chest = { id: 'klatka-barki', old: ['Wyciskanie sztangi leżąc','Wyciskanie sztangi na skosie','Rozpiętki hantlami','Pompki','Wyciskanie żołnierskie sztangi','Unoszenie hantli bokiem','Unoszenie hantli przed siebie','Odwrotne rozpiętki'] };
  const legs = { id: 'nogi', old: ['Przysiad ze sztangą','Wyciskanie nogami na suwnicy','Prostowanie nóg na maszynie','Uginanie nóg leżąc','Wykroki z hantlami','Martwy ciąg rumuński','Wspięcia na palce'] };
  const plyo = { id: 'plyometria', old: ['Skoki na skrzynię','Burpees','Sprinty','Przysiady z wyskokiem','Pompki z klaśnięciem','Pajacyki'] };
  [back, chest, legs, plyo].forEach(m => {
    const def = DEFAULT_PLANS.find(p => p.id === m.id);
    const stored = d.plans.find(p => p.id === m.id);
    if (def && stored && JSON.stringify(stored.exercises) === JSON.stringify(m.old)) {
      stored.exercises = def.exercises.slice();
      changed = true;
    }
  });
  return changed;
}

if (migratePlans(data)) save();

function backupKey(id) { return DATA_PREFIX + id + '_bk'; }

function save() {
  try {
    const k = profileDataKey(activeProfile().id);
    localStorage.setItem(k, JSON.stringify(data));
    localStorage.setItem(backupKey(activeProfile().id), JSON.stringify(data));
  }
  catch (e) { toast('Błąd zapisu danych!'); }
}

const state = {
  tab: 'kalendarz',
  calYear: 0,
  calMonth: 0,
  dayDate: null,
  current: {
    mode: 'new', category: 'silownia', planId: null, tags: [], date: todayStr(), name: '', kcal: '', notes: '',
    exercises: [], runType: 'easy-run', duration: '', distance: '', speed: '', hr: '', zone: '', splits: {}
  },
  editLogId: null,
  editRunId: null,
  editBikeId: null,
  editHealthId: null,
  healthOpen: {},
  editRaceId: null,
  sumYear: 0,
  sumMonth: 0,
  prog: { ex: '', mode: 'volume', run: 'easy-run', metric: 'weight', km: 5, prEx: '' },
  pinEntry: '',
  planFilter: [],
  planOpen: {},
  renameProfileId: null,
  restOpen: false,
  musclesOpen: false
};

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function pad(n) { return String(n).padStart(2, '0'); }
function dateStr(y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); }
function todayStr() { const n = new Date(); return dateStr(n.getFullYear(), n.getMonth(), n.getDate()); }
function num(v) { const f = parseFloat(String(v).replace(',', '.')); return isNaN(f) ? 0 : f; }
function fmtNum(v) { return Number.isInteger(v) ? String(v) : String(Math.round(v * 10) / 10); }
function shortDate(ds) { return ds.slice(5); }
function dateDiffDays(a, b) {
  const pa = String(a).split('-'), pb = String(b).split('-');
  const da = new Date(+pa[0], +pa[1] - 1, +pa[2]);
  const db = new Date(+pb[0], +pb[1] - 1, +pb[2]);
  return Math.round((db - da) / 86400000);
}
function fmtLongDate(ds) {
  const p = ds.split('-');
  const dt = new Date(+p[0], +p[1] - 1, +p[2]);
  const week = ['niedziela','poniedziałek','wtorek','środa','czwartek','piątek','sobota'];
  return week[dt.getDay()] + ', ' + +p[2] + ' ' + MONTHS[+p[1] - 1] + ' ' + p[0];
}
function formatPace(minPerKm) {
  const total = Math.round(minPerKm * 60);
  return Math.floor(total / 60) + ':' + pad(total % 60);
}
function paceText(duration, distance) {
  if (duration > 0 && distance > 0) return formatPace(duration / distance) + ' /km';
  return '';
}
function timeToMin(str) {
  str = String(str || '').trim();
  if (!str) return 0;
  const parts = str.split(':').map(x => num(x));
  if (parts.some(isNaN)) return 0;
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] + parts[1] / 60;
  return parts[0] * 60 + parts[1] + parts[2] / 60;
}
function durToMin(str) {
  str = String(str || '').trim();
  if (!str) return 0;
  const parts = str.split(':').map(x => num(x));
  if (parts.some(isNaN)) return 0;
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 60 + parts[1] + parts[2] / 60;
}
function minToText(min) {
  if (!min) return '';
  const total = Math.round(min * 60);
  return Math.floor(total / 60) + ':' + pad(total % 60);
}
function formatDur(min) {
  min = Math.round(min);
  if (min >= 60) {
    return Math.floor(min / 60) + 'h ' + pad(min % 60) + 'm';
  }
  return min + ' min';
}
function runStatHtml(r) {
  const d = num(r.distance), t = num(r.duration), hr = num(r.hr);
  const zoneHtml = r.zone ? '<div class="run-zone z' + r.zone + '">Strefa ' + r.zone + '</div>' : '';
  return '<div class="run-stats small">' +
    '<div class="run-stat"><span class="rs-val">' + (d > 0 ? fmtNum(d) + ' km' : '—') + '</span><span class="rs-lbl">Dystans</span></div>' +
    '<div class="run-stat"><span class="rs-val">' + (t > 0 ? formatDur(t) : '—') + '</span><span class="rs-lbl">Czas</span></div>' +
    '<div class="run-stat"><span class="rs-val">' + (paceText(t, d) || '—') + '</span><span class="rs-lbl">Tempo</span></div>' +
    '<div class="run-stat"><span class="rs-val">' + (hr > 0 ? fmtNum(hr) + ' bpm' : '—') + '</span><span class="rs-lbl">Tętno</span></div></div>' + zoneHtml +
    (num(r.kcal) > 0 ? '<div class="entry-kcal">' + fmtNum(r.kcal) + ' kcal</div>' : '');
}

function planById(id) { return data.plans.find(p => p.id === id); }
function gymPlans() { return data.plans.filter(p => p.category === 'silownia'); }
function runPlans() { return data.plans.filter(p => p.category === 'bieganie'); }

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add('hidden'), 2200);
}

/* ==================== NAVIGATION ==================== */

function showTab(name) {
  state.tab = name;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.tab').forEach(s => s.classList.toggle('active', s.id === 'tab-' + name));
  if (name === 'kalendarz') renderCalendar();
  if (name === 'rozpiska') renderPlans();
  if (name === 'trening') renderTraining();
  if (name === 'postep') renderProgress();
  if (name === 'zdrowie') renderHealth();
  if (name === 'zawody') renderRaces();
  window.scrollTo(0, 0);
}

/* ==================== MODALS ==================== */

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

document.querySelectorAll('.modal-overlay').forEach(ov => {
  ov.addEventListener('click', e => {
    if (e.target === ov) ov.classList.add('hidden');
  });
  ov.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => ov.classList.add('hidden')));
});

/* ==================== PROFILE ==================== */

function updateProfileBadge() {
  const b = document.getElementById('btn-profile');
  if (!b) return;
  const p = activeProfile();
  b.textContent = (p.name.trim().charAt(0) || '?').toUpperCase();
  b.title = 'Profil: ' + p.name;
  const meta = document.getElementById('settings-current-profile');
  if (meta) meta.textContent = 'Aktywny profil: ' + p.name + ' (osobna baza danych)';
}

function renderProfileScreen() {
  const list = document.getElementById('profile-list');
  if (!list) return;
  const profiles = getProfiles();
  const current = activeProfile();
  const first = profiles.length === 0;
  list.innerHTML = profiles.map(p => {
    const initial = (p.name.trim().charAt(0) || '?').toUpperCase();
    return '<div class="profile-item' + (p.id === current.id ? ' active' : '') + '">' +
      '<button type="button" class="profile-main" data-profile="' + esc(p.id) + '">' +
      '<span class="profile-avatar">' + esc(initial) + '</span>' +
      '<span class="profile-name">' + esc(p.name) + '</span>' +
      '<span class="profile-check">' + (p.id === current.id ? '&#10003;' : '') + '</span>' +
      '</button>' +
      '<button type="button" class="mini-btn profile-edit" data-rename="' + esc(p.id) + '" title="Zmień nazwę profilu">&#9998;</button>' +
      '</div>';
  }).join('');
  const addWrap = document.getElementById('profile-add-wrap');
  const addBtn = document.getElementById('profile-add-btn');
  const sub = document.getElementById('profile-sub');
  if (first) {
    addWrap.classList.remove('hidden');
    if (addBtn) addBtn.classList.add('hidden');
    if (sub) sub.textContent = 'Stwórz swój profil, aby rozpocząć';
    setTimeout(() => { const inp = document.getElementById('profile-new-name'); if (inp) inp.focus(); }, 80);
  } else {
    addWrap.classList.add('hidden');
    if (addBtn) addBtn.classList.remove('hidden');
    if (sub) sub.textContent = 'Wybierz profil, aby kontynuować';
  }
  const meta = document.getElementById('profile-screen-meta');
  if (meta) {
    if (first) {
      meta.textContent = 'Nie masz jeszcze żadnego profilu — utwórz pierwszy.';
    } else if (profiles.length === 1) {
      meta.textContent = '1 profil na tym urządzeniu';
    } else if (profiles.length % 10 >= 2 && profiles.length % 10 <= 4 && (profiles.length % 100 < 12 || profiles.length % 100 > 14)) {
      meta.textContent = profiles.length + ' profile na tym urządzeniu';
    } else {
      meta.textContent = profiles.length + ' profili na tym urządzeniu';
    }
  }
}

function openProfileScreen() {
  renderProfileScreen();
  document.getElementById('profile-screen').classList.remove('hidden');
}

function closeProfileScreen() {
  document.getElementById('profile-screen').classList.add('hidden');
}

function switchProfile(id) {
  setActiveProfileId(id);
  data = load();
  if (migratePlans(data)) save();
  state.dayDate = null;
  updateProfileBadge();
  closeProfileScreen();
  showTab('kalendarz');
  toast('Profil: ' + activeProfile().name);
  if (profileHasPin(activeProfile())) openLockScreen();
}

function createProfile() {
  const input = document.getElementById('profile-new-name');
  const name = input.value.trim();
  if (!name) { toast('Podaj nazwę profilu'); input.focus(); return; }
  const profiles = getProfiles();
  const id = uid();
  profiles.push({ id, name });
  saveProfiles(profiles);
  input.value = '';
  document.getElementById('profile-add-wrap').classList.add('hidden');
  document.getElementById('profile-add-btn').classList.remove('hidden');
  switchProfile(id);
}

function startRenameProfile(id) {
  const p = getProfiles().find(x => x.id === id);
  if (!p) return;
  state.renameProfileId = id;
  const input = document.getElementById('profile-rename-input');
  input.value = p.name;
  document.getElementById('profile-rename-wrap').classList.remove('hidden');
  input.focus();
  input.select();
}

function cancelRenameProfile() {
  state.renameProfileId = null;
  document.getElementById('profile-rename-wrap').classList.add('hidden');
}

function saveRenameProfile() {
  const input = document.getElementById('profile-rename-input');
  const name = input.value.trim();
  if (!name) { toast('Podaj nazwę profilu'); input.focus(); return; }
  const profiles = getProfiles();
  const p = profiles.find(x => x.id === state.renameProfileId);
  if (!p) return;
  p.name = name;
  saveProfiles(profiles);
  if (activeProfile().id === p.id) updateProfileBadge();
  toast('Nazwa profilu zmieniona');
  cancelRenameProfile();
  renderProfileScreen();
}

/* ==================== KALENDARZ ==================== */

function markersForDay(ds) {
  const marks = [];
  data.runs.filter(r => r.date === ds).forEach(r => {
    marks.push('<span class="run-mark" title="' + (RUN_TYPES[r.type] || r.type) + '">' +
      '<span class="run-ico">' + icon('shoe') + '</span><b class="run-ltr">' + (RUN_LETTERS[r.type] || 'R') + '</b></span>');
  });
  data.logs.forEach(l => {
    if (l.date !== ds) return;
    const pi = PLAN_ICONS[l.planId] || 'dumbbell';
    marks.push('<span class="gym-mark ' + pi + '" title="' + esc(l.title || '') + '">' + icon(pi) + '</span>');
  });
  if (data.health.some(h => h.date === ds)) marks.push('<span class="health-mark" title="Zdrowie"></span>');
  if (data.races.some(r => r.date === ds)) marks.push('<span class="race-mark" title="Zawody: ' + esc((data.races.find(r => r.date === ds) || {}).name || '') + '">' + icon('flag') + '</span>');
  if (marks.length > 3) {
    const extra = marks.length - 2;
    marks.splice(2, extra, '<span class="cal-more" title="Jeszcze ' + extra + ' wpisów">+' + extra + '</span>');
  }
  return marks.join('');
}

function renderCalendar() {
  const y = state.calYear, m = state.calMonth;
  document.getElementById('cal-title').textContent = MONTHS[m] + ' ' + y;
  const first = new Date(y, m, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const today = todayStr();
  let html = DOWS.map(d => '<div class="cal-dow">' + d + '</div>').join('');
  for (let i = 0; i < offset; i++) html += '<div class="cal-day empty"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = dateStr(y, m, d);
    const isToday = ds === today;
    const trained = data.logs.some(l => l.date === ds) || data.runs.some(r => r.date === ds);
    html += '<div class="cal-day' + (isToday ? ' today' : '') + (trained ? ' trained' : '') + '" data-d="' + ds + '">' +
      '<span class="day-num">' + d + '</span>' +
      '<span class="cal-marks">' + markersForDay(ds) + '</span></div>';
  }
  document.getElementById('cal-grid').innerHTML = html;
  renderStreak();
  renderMonthStats();
  renderDailyTips();
}

function weekStart(ds) {
  const p = ds.split('-');
  const dt = new Date(+p[0], +p[1] - 1, +p[2]);
  const day = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - day);
  return dateStr(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

function weekStreakCount() {
  const weeks = new Set();
  data.logs.forEach(l => weeks.add(weekStart(l.date)));
  data.runs.forEach(r => weeks.add(weekStart(r.date)));
  let streak = 0;
  let w = weekStart(todayStr());
  while (weeks.has(w)) {
    streak++;
    const p = w.split('-');
    const dt = new Date(+p[0], +p[1] - 1, +p[2]);
    dt.setDate(dt.getDate() - 7);
    w = dateStr(dt.getFullYear(), dt.getMonth(), dt.getDate());
  }
  return streak;
}

function renderStreak() {
  const el = document.getElementById('cal-streak');
  if (!el) return;
  const streak = weekStreakCount();
  const label = streak === 0 ? 'Brak aktywnego tygodnia' :
    streak === 1 ? 'tydzień z rzędu' :
    streak <= 4 ? 'tygodnie z rzędu' : 'tygodni z rzędu';
  el.innerHTML = '<div class="streak-card' + (streak > 0 ? ' on' : '') + '">' +
    '<span class="streak-flame">' + icon('flame') + '</span>' +
    '<div class="streak-info"><b class="streak-num">' + streak + '</b>' +
    '<span class="streak-lbl">' + label + '</span></div></div>';
}

function monthRange(y, m) {
  const days = new Date(y, m + 1, 0).getDate();
  return { start: dateStr(y, m, 1), end: dateStr(y, m, days) };
}

function renderMonthStats() {
  const el = document.getElementById('month-stats');
  if (!el) return;
  const y = state.calYear, m = state.calMonth;
  const r = monthRange(y, m);
  const inR = x => x.date >= r.start && x.date <= r.end;
  const logs = data.logs.filter(inR);
  const runs = data.runs.filter(inR);
  const days = new Set();
  logs.forEach(l => days.add(l.date));
  runs.forEach(rr => days.add(rr.date));
  let dist = 0, dur = 0, vol = 0;
  runs.forEach(rr => { dist += num(rr.distance); dur += num(rr.duration); });
  logs.forEach(l => l.exercises.forEach(ex => ex.sets.forEach(s => vol += num(s.w) * num(s.r))));
  const musc = new Map();
  logs.forEach(l => (l.tags || []).forEach(k => musc.set(k, (musc.get(k) || 0) + 1)));
  const topMusc = Array.from(musc.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([k, c]) => muscleTagLabel(k) + ' (' + c + ')').join(' · ');
  el.innerHTML = '<div class="card"><h3>Statystyki ' + MONTHS[m] + ' ' + y + '</h3>' +
    '<div class="stat-grid">' +
    statCell(days.size, 'Dni treningowe') +
    statCell(logs.length, 'Treningi siłowe') +
    statCell(runs.length, 'Biegi') +
    statCell(dist > 0 ? fmtNum(dist) + ' km' : '—', 'Dystans biegania') +
    statCell(dur > 0 ? formatDur(dur) : '—', 'Czas biegania') +
    statCell(vol > 0 ? fmtNum(vol) + ' kg' : '—', 'Objętość siłowa') +
    '</div>' +
    (topMusc ? '<div class="stat-musc">Najczęstsze mięśnie: ' + topMusc + '</div>' : '') +
    '</div>';
}

function statCell(val, lbl) {
  return '<div class="stat-card"><div class="stat-val">' + val + '</div><div class="stat-lbl">' + lbl + '</div></div>';
}

function renderDailyTips() {
  const el = document.getElementById('daily-tips');
  if (!el) return;
  const tips = dailyTips();
  el.innerHTML = '<div class="card tips-card"><div class="tips-head">' + icon('flame') + '<h3>Wskazówki na dziś</h3></div>' +
    '<ul>' + tips.map(t => '<li>' + t + '</li>').join('') + '</ul></div>';
}

function dailyTips() {
  const tips = [];
  const today = todayStr();
  if (data.logs.some(l => l.date === today) || data.runs.some(r => r.date === today)) {
    tips.push('Dziś już trenowałeś — dobra robota! Teraz regeneracja.');
  }
  let cons = 0;
  const dt = new Date();
  while (true) {
    const ds = dateStr(dt.getFullYear(), dt.getMonth(), dt.getDate());
    if (!(data.logs.some(l => l.date === ds) || data.runs.some(r => r.date === ds))) break;
    cons++;
    dt.setDate(dt.getDate() - 1);
  }
  if (cons >= 3) tips.push(cons + ' dni treningowych z rzędu — rozważ lżejszy dzień albo odpoczynek.');
  const lastLog = data.logs.slice().sort((a, b) => a.date > b.date ? -1 : 1)[0];
  if (lastLog) {
    const gap = dateDiffDays(lastLog.date, today);
    if (gap >= 5) tips.push('Brak siłowni od ' + gap + ' dni — warto zaplanować trening.');
  }
  const lastRun = data.runs.slice().sort((a, b) => a.date > b.date ? -1 : 1)[0];
  if (lastRun) {
    const gap = dateDiffDays(lastRun.date, today);
    if (gap >= 7) tips.push('Ostatni bieg ' + gap + ' dni temu — czas na easy run.');
    if (gap <= 3 && lastRun.type === 'long-run') tips.push('Po long runie regeneracja — wystarczy lekka aktywność.');
  } else if (!lastLog) {
    tips.push('Zacznij od dzisiejszego treningu — pierwszy krok jest najważniejszy.');
  }
  const now = new Date();
  const cur = monthRange(now.getFullYear(), now.getMonth());
  const prev = monthRange(now.getFullYear(), now.getMonth() - 1 < 0 ? 11 : now.getMonth() - 1);
  const paceAvg = runs => {
    const arr = runs.filter(r => num(r.distance) > 0 && num(r.duration) > 0);
    if (!arr.length) return 0;
    return arr.reduce((s, r) => s + num(r.duration) / 60 / num(r.distance), 0) / arr.length;
  };
  const curP = paceAvg(data.runs.filter(r => r.date >= cur.start && r.date <= cur.end));
  const prevP = paceAvg(data.runs.filter(r => r.date >= prev.start && r.date <= prev.end));
  if (curP > 0 && prevP > 0) {
    const ch = Math.round(((prevP - curP) / prevP) * 100);
    if (ch >= 3) tips.push('Tempo w tym miesiącu szybsze o ' + ch + '% niż w poprzednim — świetnie!');
    if (ch <= -3) tips.push('Tempo w tym miesiącu wolniejsze o ' + Math.abs(ch) + '% — może znów coś za szybko?');
  }
  const wSeries = data.health.filter(h => num(h.weight) > 0).sort((a, b) => a.date < b.date ? -1 : 1);
  if (wSeries.length >= 4) {
    const recent = wSeries.slice(-4);
    const a = recent[0].weight, b = recent[recent.length - 1].weight;
    if (num(b) > num(a) && num(b) - num(a) >= 1) tips.push('Waga rośnie od ' + shortDate(recent[0].date) + ' — sprawdź bilans.');
  }
  const nextRace = data.races.filter(r => r.date >= today).sort((a, b) => a.date < b.date ? -1 : 1)[0];
  if (nextRace) {
    const d = dateDiffDays(today, nextRace.date);
    const dayTxt = d === 0 ? 'dziś' : d === 1 ? 'jutro' : 'za ' + d + ' dni';
    tips.push('Nadchodzą zawody: ' + nextRace.name + ' (' + dayTxt + ').');
  }
  if (!tips.length) tips.push('Brak aktywnego tygodnia — wróć do treningów!');
  if (mascotOn()) {
    const jtips = [
      'Jamniczek wierci ogonem — czas na trening!',
      'Jamniczek mówi: seria za serią, ogon do góry.',
      'Jamniczek radzi: zacznij lekko, a skończysz mocno.',
      'Jamniczek czeka na wspólny trening. Chodź!',
      'Jamniczek przypomina: regeneracja to też trening.'
    ];
    tips.unshift(jtips[new Date().getDate() % jtips.length]);
  }
  return tips.slice(0, 4);
}

function kcalHtml(v) {
  const k = num(v);
  return k > 0 ? '<div class="entry-kcal">' + fmtNum(k) + ' kcal</div>' : '';
}

function gymMetaHtml(l) {
  const parts = [];
  if (num(l.duration) > 0) parts.push('Czas ' + formatDur(num(l.duration)));
  if (num(l.kcal) > 0) parts.push(fmtNum(l.kcal) + ' kcal');
  return parts.length ? '<div class="entry-kcal">' + parts.join(' · ') + '</div>' : '';
}

function entryBox(tag, title, body, notes, kind, id) {
  return '<div class="entry"><div class="entry-head">' +
    '<span class="e-title">' + title + '</span>' +
    '<span class="e-tag ' + tag + '">' + (tag === 'gym' ? 'Siłownia' : tag === 'run' ? 'Bieganie' : tag === 'race' ? 'Zawody' : 'Zdrowie') + '</span></div>' +
    '<div class="entry-body">' + body + '</div>' +
    (notes ? '<div class="entry-notes">' + esc(notes) + '</div>' : '') +
    '<div class="entry-actions">' +
    (kind === 'log' || kind === 'run' ? '<button class="mini-btn" data-repeat="' + kind + ':' + id + '" title="Powtórz trening">Powtórz</button>' : '') +
    '<button class="mini-btn" data-edit="' + kind + ':' + id + '" title="Edytuj">Edytuj</button>' +
    '<button class="mini-btn" data-del="' + kind + ':' + id + '" title="Usuń">Usuń</button>' +
    '</div></div>';
}

function repeatEntry(kind, id) {
  if (kind === 'log') {
    const log = data.logs.find(l => l.id === id);
    if (!log) return;
    state.current.mode = 'new';
    state.editLogId = null;
    state.editRunId = null;
    state.current.category = 'silownia';
    state.current.planId = log.planId || (gymPlans()[0] && gymPlans()[0].id);
    state.current.tags = Array.isArray(log.tags) ? log.tags.slice() : (log.planId ? planTags(planById(log.planId)).slice() : []);
    state.current.date = todayStr();
    state.current.name = log.name || '';
    state.current.kcal = '';
    state.current.notes = log.notes || '';
    state.current.exercises = JSON.parse(JSON.stringify(log.exercises));
    closeModal('modal-day');
    showTab('trening');
    toast('Trening gotowy do powtórzenia');
  }
  if (kind === 'run') {
    const run = data.runs.find(r => r.id === id);
    if (!run) return;
    state.current.mode = 'new';
    state.editLogId = null;
    state.editRunId = null;
    state.current.category = 'bieganie';
    state.current.runType = run.type;
    state.current.date = todayStr();
    state.current.duration = run.duration;
    state.current.distance = run.distance;
    state.current.hr = run.hr || '';
    state.current.zone = run.zone || '';
    state.current.splits = run.splits || {};
    state.current.name = run.name || '';
    state.current.kcal = '';
    state.current.notes = run.notes || '';
    closeModal('modal-day');
    showTab('trening');
    toast('Trening gotowy do powtórzenia');
  }
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function dayEntriesHtml(ds) {
  const logs = data.logs.filter(l => l.date === ds);
  const runs = data.runs.filter(r => r.date === ds);
  const health = data.health.filter(h => h.date === ds);
  const races = data.races.filter(r => r.date === ds);
  let html = '';
  logs.forEach(l => {
    let ex = '';
    l.exercises.forEach(e => {
      const sets = e.sets.map(s => (s.w ? fmtNum(s.w) + 'kg' : '?') + ' × ' + (s.r || '?')).join(', ');
      ex += '<div class="ex-line"><span class="ex-name">' + esc(e.name) + '</span><span class="ex-sets">' + esc(sets) + '</span></div>';
    });
    html += entryBox('gym', esc(l.title), ex + gymMetaHtml(l), l.notes, 'log', l.id);
  });
  runs.forEach(r => {
    html += entryBox('run', esc(r.name || RUN_TYPES[r.type] || r.type), runStatHtml(r), r.notes, 'run', r.id);
  });
  health.forEach(h => {
    const parts = [];
    if (h.weight) parts.push('Waga ' + fmtNum(h.weight) + ' kg');
    if (h.bodyFat) parts.push('BF ' + fmtNum(h.bodyFat) + '%');
    if (h.muscle) parts.push('Mięśnie ' + fmtNum(h.muscle) + ' kg');
    if (h.fat) parts.push('Tłuszcz ' + fmtNum(h.fat) + ' kg');
    html += entryBox('health', 'Statystyki', esc(parts.join(' · ')), '', 'health', h.id);
  });
  races.forEach(r => {
    const st = RACE_STATUSES.find(s => s.id === r.status) || RACE_STATUSES[0];
    const parts = [];
    if (r.city) parts.push(esc(r.city));
    if (r.dist) parts.push(fmtNum(r.dist) + ' km');
    if (r.result) parts.push('wynik <b>' + esc(r.result) + '</b>');
    const body = '<span class="race-status ' + (r.status === 'ukonczony' ? 'fin' : r.status === 'zapisany' ? 'signed' : '') + '">' + st.label + '</span>' +
      (parts.length ? '<div class="race-meta">' + parts.join(' · ') + '</div>' : '');
    html += entryBox('race', 'Zawody: ' + esc(r.name), body, r.notes, 'race', r.id);
  });
  if (!html) html = '<div class="chart-empty">Brak wpisów tego dnia.</div>';
  return html;
}

function refreshDayModal() {
  document.getElementById('modal-day-title').textContent = fmtLongDate(state.dayDate);
  document.getElementById('modal-day-content').innerHTML = dayEntriesHtml(state.dayDate);
}

function openDay(ds) {
  state.dayDate = ds;
  refreshDayModal();
  openModal('modal-day');
}

function deleteEntry(kind, id) {
  if (!confirm('Na pewno usunąć ten wpis?')) return;
  if (kind === 'log') data.logs = data.logs.filter(l => l.id !== id);
  if (kind === 'run') data.runs = data.runs.filter(r => r.id !== id);
  if (kind === 'health') data.health = data.health.filter(h => h.id !== id);
  if (kind === 'race') data.races = data.races.filter(r => r.id !== id);
  save();
  toast('Usunięto');
  renderCalendar();
  if (kind === 'health') renderHealth();
  if (kind === 'race') renderRaces();
  if (state.dayDate) {
    const modal = document.getElementById('modal-day');
    if (!modal.classList.contains('hidden')) refreshDayModal();
  }
}

function startEdit(kind, id) {
  if (kind === 'log') {
    const log = data.logs.find(l => l.id === id);
    if (!log) return;
    state.editLogId = id;
    state.current.mode = 'edit';
    state.current.category = 'silownia';
    state.current.planId = log.planId || (gymPlans()[0] && gymPlans()[0].id);
    state.current.tags = Array.isArray(log.tags) ? log.tags.slice() : (log.planId ? planTags(planById(log.planId)).slice() : []);
    state.current.date = log.date;
    state.current.name = log.name || '';
    state.current.duration = log.duration || '';
    state.current.kcal = log.kcal === undefined || log.kcal === null ? '' : log.kcal;
    state.current.notes = log.notes || '';
    state.current.exercises = JSON.parse(JSON.stringify(log.exercises));
    closeModal('modal-day');
    showTab('trening');
  }
  if (kind === 'run') {
    const run = data.runs.find(r => r.id === id);
    if (!run) return;
    state.editRunId = id;
    state.current.mode = 'edit';
    state.current.category = 'bieganie';
    state.current.runType = run.type;
    state.current.date = run.date;
    state.current.duration = run.duration;
    state.current.distance = run.distance;
    state.current.hr = run.hr || '';
    state.current.zone = run.zone || '';
    state.current.splits = run.splits || {};
    state.current.name = run.name || '';
    state.current.kcal = run.kcal === undefined || run.kcal === null ? '' : run.kcal;
    state.current.notes = run.notes || '';
    closeModal('modal-day');
    showTab('trening');
  }
  if (kind === 'health') {
    const h = data.health.find(x => x.id === id);
    if (!h) return;
    state.editHealthId = id;
    closeModal('modal-day');
    showTab('zdrowie');
    fillHealthForm(h);
  }
  if (kind === 'race') {
    if (!data.races.some(r => r.id === id)) return;
    state.editRaceId = id;
    closeModal('modal-day');
    showTab('zawody');
  }
}

/* ==================== ROZPISKA ==================== */

function renderPlans() {
  const wrap = document.getElementById('plan-list');
  let html = '';
  const silownia = gymPlans();
  const bieganie = runPlans();
  html += '<h3 class="tab-subtitle">Siłownia</h3>';

  const usedTags = MUSCLE_TAGS.filter(t => silownia.some(p => planTags(p).includes(t.key)));
  const filter = state.planFilter || [];
  const filtered = filter.length
    ? silownia.filter(p => planTags(p).some(k => filter.includes(k)))
    : silownia;

  if (usedTags.length) {
    html += '<div class="chips plan-filters">' +
      '<button class="chip' + (filter.length === 0 ? ' active' : '') + '" data-plan-filter="__all">Wszystkie</button>' +
      usedTags.map(t => '<button class="chip' + (filter.includes(t.key) ? ' active' : '') + '" data-plan-filter="' + t.key + '">' + esc(t.label) + '</button>').join('') +
      '</div>';
  }
  if (!filtered.length) {
    html += '<div class="chart-empty">' + (filter.length ? 'Brak planów dla wybranych kategorii mięśni.' : 'Brak planów siłowych.') + '</div>';
  }
  filtered.forEach(p => {
    const tagHtml = planTags(p).map(k => '<span class="badge tag">' + esc(muscleTagLabel(k)) + '</span>').join('');
    const isOpen = !!state.planOpen[p.id];
    html += '<div class="card plan-gym plan-acc' + (isOpen ? ' open' : '') + '">' +
      '<button type="button" class="plan-acc-head" data-plan-toggle="' + esc(p.id) + '">' +
      '<span class="plan-acc-title"><b>' + esc(p.name) + '</b><span class="badge gym">Siłownia</span></span>' +
      (tagHtml ? '<span class="plan-tags">' + tagHtml + '</span>' : '') +
      '<span class="plan-acc-count">' + p.exercises.length + ' ćw.</span>' +
      '<svg class="set-chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>' +
      '</button>' +
      '<div class="plan-acc-body">' +
      '<ol class="ex-list">' + p.exercises.map(e => '<li>' + esc(e) + '</li>').join('') + '</ol>' +
      '<div class="plan-actions">' +
      '<button class="btn primary small" data-startplan="' + esc(p.id) + '">Rozpocznij trening</button>' +
      '<button class="btn secondary small" data-editplan="' + esc(p.id) + '">Edytuj</button>' +
      '<button class="btn danger small" data-delplan="' + esc(p.id) + '">Usuń</button>' +
      '</div></div></div>';
  });
  html += '<h3 class="tab-subtitle">Bieganie</h3>';
  bieganie.forEach(p => {
    html += '<div class="card plan-run"><h3>' + esc(p.name) + '<span class="badge run">Bieganie</span></h3>' +
      '<p class="field-hint">' + esc(p.desc) + '</p></div>';
  });
  wrap.innerHTML = html;
}

function toggleExerciseList() {
  const box = document.getElementById('exercise-list');
  const btn = document.getElementById('ex-list-toggle');
  if (!box) return;
  const hidden = box.classList.contains('hidden');
  if (hidden) renderExerciseList();
  box.classList.toggle('hidden');
  if (btn) btn.textContent = hidden ? 'Ukryj listę ćwiczeń' : 'Lista ćwiczeń';
}

function renderExerciseList() {
  const box = document.getElementById('exercise-list');
  if (!box) return;
  const used = MUSCLE_TAGS.filter(t => gymPlans().some(p => planTags(p).includes(t.key)));
  if (!used.length) {
    box.innerHTML = '<div class="card"><h3>Lista ćwiczeń</h3><div class="chart-empty">Brak ćwiczeń — dodaj rozpiskę siłową.</div></div>';
    return;
  }
  let html = '<div class="card"><h3>Lista ćwiczeń</h3>' +
    '<p class="field-hint">Kliknij ćwiczenie, aby dodać je do treningu. Wszystkie ćwiczenia z rozpiski pogrupowane po partiach mięśniowych.</p>';
  used.forEach(t => {
    const names = [];
    gymPlans().forEach(p => {
      if (planTags(p).includes(t.key)) {
        p.exercises.forEach(n => { if (!names.includes(n)) names.push(n); });
      }
    });
    if (!names.length) return;
    html += '<h4 class="ex-part">' + esc(t.label) + '</h4>' +
      '<ol class="ex-list ex-list-click">' + names.map(n =>
        '<li><button type="button" class="ex-add-row" data-ex-add="' + esc(n) + '" data-ex-tag="' + t.key + '">' +
        '<span class="ex-add-name">' + esc(n) + '</span>' +
        '<span class="ex-add-chip">+ Dodaj</span></button></li>'
      ).join('') + '</ol>';
  });
  html += '</div>';
  box.innerHTML = html;
}

function openPlanEdit(planId) {
  const p = planById(planId);
  if (!p) return;
  document.getElementById('plan-edit-title').textContent = 'Edytuj: ' + p.name;
  document.getElementById('plan-edit-name').value = p.name;
  document.getElementById('plan-edit-cat').value = p.category === 'bieganie' ? 'bieganie' : 'silownia';
  document.getElementById('plan-edit-desc').value = p.desc || '';
  document.getElementById('plan-edit-text').value = (p.exercises || []).join('\n');
  document.getElementById('plan-edit-text').dataset.plan = planId;
  setPlanTagPicker(p);
  const del = document.getElementById('plan-edit-delete');
  if (del) { del.style.display = ''; del.dataset.plan = planId; }
  openModal('modal-plan-edit');
}

function openPlanAdd() {
  document.getElementById('plan-edit-title').textContent = 'Dodaj rozpiskę';
  document.getElementById('plan-edit-name').value = '';
  document.getElementById('plan-edit-cat').value = 'silownia';
  document.getElementById('plan-edit-desc').value = '';
  document.getElementById('plan-edit-text').value = '';
  document.getElementById('plan-edit-text').dataset.plan = '';
  setPlanTagPicker(null);
  const del = document.getElementById('plan-edit-delete');
  if (del) { del.style.display = 'none'; del.dataset.plan = ''; }
  openModal('modal-plan-edit');
}

function renderPlanTagPicker() {
  const box = document.getElementById('plan-tags-list');
  if (!box) return;
  box.innerHTML = MUSCLE_TAGS.map(t =>
    '<button type="button" class="chip tag-chip" data-tag="' + t.key + '">' + esc(t.label) + '</button>'
  ).join('');
}

function setPlanTagPicker(plan) {
  renderPlanTagPicker();
  const tags = plan ? planTags(plan) : [];
  const box = document.getElementById('plan-tags-list');
  if (box) box.querySelectorAll('[data-tag]').forEach(b => b.classList.toggle('active', tags.includes(b.dataset.tag)));
  syncPlanTagPicker();
}

function syncPlanTagPicker() {
  const box = document.getElementById('plan-tags-box');
  if (!box) return;
  const cat = document.getElementById('plan-edit-cat').value;
  box.classList.toggle('hidden', cat !== 'silownia');
}

function selectedPlanTags() {
  const box = document.getElementById('plan-tags-list');
  if (!box) return [];
  const out = [];
  box.querySelectorAll('[data-tag].active').forEach(b => out.push(b.dataset.tag));
  return out;
}

function savePlanFromModal() {
  const name = document.getElementById('plan-edit-name').value.trim();
  const cat = document.getElementById('plan-edit-cat').value === 'bieganie' ? 'bieganie' : 'silownia';
  const desc = document.getElementById('plan-edit-desc').value.trim();
  const exercises = document.getElementById('plan-edit-text').value.split('\n').map(s => s.trim()).filter(Boolean);
  const tags = cat === 'silownia' ? selectedPlanTags() : [];
  if (!name) { toast('Podaj nazwę rozpiska'); return; }
  const existingId = document.getElementById('plan-edit-text').dataset.plan;
  const existing = existingId ? planById(existingId) : null;
  if (existing) {
    existing.name = name;
    existing.category = cat;
    existing.desc = desc;
    existing.exercises = exercises;
    existing.tags = tags;
  } else {
    data.plans.push({ id: 'custom-' + uid(), name: name, category: cat, desc: desc, tags: tags, exercises: exercises });
  }
  save();
  closeModal('modal-plan-edit');
  renderPlans();
  toast(existing ? 'Rozpiska zaktualizowana' : 'Rozpiska dodana');
}

function deletePlan(planId) {
  const p = planById(planId);
  if (!p) return;
  if (!confirm('Usunąć rozpiskę „' + p.name + '"?')) return;
  data.plans = data.plans.filter(x => x.id !== planId);
  save();
  closeModal('modal-plan-edit');
  renderPlans();
  toast('Rozpiska usunięta');
}

function suggestedFillWeight(name) {
  const last = lastResultFor(name);
  const sug = last ? suggestWeight(last.sets) : null;
  return sug ? String(sug) : '';
}

function startPlanWorkout(planId) {
  const p = planById(planId);
  if (!p) return;
  state.current.mode = 'new';
  state.editLogId = null;
  state.editRunId = null;
  state.current.category = 'silownia';
  state.current.planId = p.id;
  state.current.tags = planTags(p).slice();
  state.current.date = todayStr();
  state.current.notes = '';
  state.current.duration = '';
  state.current.distance = '';
  const fill = getTrainingPrefs().progFill;
  state.current.exercises = p.exercises.map(name => ({ name: name, sets: [{ w: fill ? suggestedFillWeight(name) : '', r: '' }] }));
  showTab('trening');
  toast('Rozpiska załadowana — wypełnij serie');
}

function loadPlanIntoWorkout(planId) {
  const p = planById(planId);
  if (!p) return;
  state.current.planId = p.id;
  (planTags(p)).forEach(k => { if (!state.current.tags.includes(k)) state.current.tags.push(k); });
  const existing = state.current.exercises.map(e => e.name);
  const fill = getTrainingPrefs().progFill;
  p.exercises.forEach(name => {
    if (!existing.includes(name)) state.current.exercises.push({ name: name, sets: [{ w: fill ? suggestedFillWeight(name) : '', r: '' }] });
  });
}

function clearPlanFromWorkout() {
  state.current.planId = null;
}

function openPlanPick() {
  const list = document.getElementById('plan-pick-list');
  const plans = gymPlans();
  list.innerHTML = plans.length
    ? plans.map(p => '<button class="plan-pick" data-plan-pick="' + p.id + '"><span class="pp-name">' + esc(p.name) + '</span>' +
        (planTags(p).length ? '<span class="plan-tags">' + planTags(p).map(k => '<span class="badge tag">' + esc(muscleTagLabel(k)) + '</span>').join('') + '</span>' : '') +
        '</button>').join('')
    : '<div class="chart-empty">Brak rozpiski siłowej. Dodaj ją w zakładce Rozpiska.</div>';
  openModal('modal-add-plan');
}

function lastResultFor(name) {
  let best = null;
  for (let i = data.logs.length - 1; i >= 0; i--) {
    const l = data.logs[i];
    const ex = l.exercises.find(e => e.name === name);
    if (ex && ex.sets.length) {
      const txt = ex.sets.map(s => (s.w ? fmtNum(s.w) + 'kg × ' + (s.r || '?') : '?' )).join(' · ');
      return { date: l.date, text: txt, sets: ex.sets };
    }
  }
  return best;
}

function suggestWeight(sets) {
  let bestW = 0, bestR = 0;
  (sets || []).forEach(s => {
    const w = num(s.w), r = num(s.r);
    if (w > bestW) { bestW = w; bestR = r; }
  });
  if (bestW <= 0 || bestR < 5 || bestR >= 40) return null;
  return Math.ceil((bestW + 2.5) * 2) / 2;
}

/* ==================== TRENING ==================== */

function resetCurrent() {
  state.editLogId = null;
  state.editRunId = null;
  state.editBikeId = null;
  state.current.mode = 'new';
  state.current.name = '';
  state.current.kcal = '';
  state.current.notes = '';
  state.current.planId = null;
  state.current.tags = [];
  state.current.exercises = [];
  state.current.duration = '';
  state.current.distance = '';
  state.current.speed = '';
  state.current.hr = '';
  state.current.zone = '';
  state.current.splits = {};
}

function renderTraining() {
  const wrap = document.getElementById('training-form');
  const c = state.current;
  let html = '<div class="chips">' +
    '<button class="chip' + (c.category === 'silownia' ? ' active' : '') + '" data-cat="silownia">Siłownia</button>' +
    '<button class="chip' + (c.category === 'bieganie' ? ' active' : '') + '" data-cat="bieganie">Bieganie</button>' +
    '<button class="chip' + (c.category === 'rower' ? ' active' : '') + '" data-cat="rower">Rower</button></div>';

  if (c.category === 'silownia') {
    html += '<div class="rest-acc muscle-acc' + (state.musclesOpen ? ' open' : '') + '">' +
      '<div class="ra-head" data-muscles-toggle>' +
      icon('dumbbell') +
      '<span class="ra-title">Mięśnie, które ćwiczysz</span>' +
      '<span class="ra-status' + (c.tags.length ? ' active' : '') + '" id="musc-count">' + (c.tags.length ? c.tags.length + ' zaznacz.' : 'wybierz') + '</span>' +
      '<span class="ra-chev">' + icon('chev') + '</span></div>' +
      '<div class="ra-body"><div class="chips plan-filters">' + MUSCLE_TAGS.map(t =>
        '<button class="chip' + (c.tags.includes(t.key) ? ' active' : '') + '" data-tag="' + t.key + '">' + esc(t.label) + '</button>'
      ).join('') + '</div></div></div>';

    const selPlan = c.planId ? planById(c.planId) : null;
    html += '<div class="form-row plan-row"><div><button class="btn secondary small" id="add-plan-btn">+ Dodaj ćwiczenia z rozpiski</button></div>' +
      (selPlan ? '<div class="plan-loaded">' + icon('dumbbell') + '<span>' + esc(selPlan.name) + '</span>' +
        '<button class="mini-btn" data-act="clear-plan" title="Wyczyść rozpiskę">✕</button></div>' : '') +
      '</div>';

    if (!c.exercises.length) {
      html += '<div class="chart-empty">Dodaj ćwiczenia — wybierz rozpiskę albo wpisz własne.</div>';
    }
    c.exercises.forEach((ex, i) => {
      const done = !!ex.done;
      const open = ex.open !== false;
      const last = lastResultFor(ex.name);
      const sug = last ? suggestWeight(last.sets) : null;
      const setCount = (ex.sets || []).filter(s => s.w !== '' || s.r !== '').length;
      html += '<div class="ex-block' + (done ? ' done' : '') + (open ? ' open' : '') + '">' +
        '<div class="ex-head" data-ex-toggle="' + i + '">' +
        '<span class="ex-chev">' + icon('chev') + '</span>' +
        '<span class="ex-name">' + (i + 1) + '. ' + esc(ex.name) + '</span>' +
        (done ? '<span class="ex-done-badge">✓ zrobione</span>' : (setCount ? '<span class="ex-count">' + setCount + ' ser.</span>' : '')) +
        '<span class="ex-actions">' +
        '<button class="mini-btn" data-act="toggle-done" data-ex="' + i + '">' + (done ? 'Wznów' : 'Zakończ') + '</button>' +
        '<button class="mini-btn" data-act="del-ex" data-ex="' + i + '">Usuń</button></span>' +
        '</div>';
      html += '<div class="ex-body">';
      if (last) {
        html += '<div class="last-results">Ostatnio: <b>' + esc(last.text) + '</b><span class="lr-date"> ' + shortDate(last.date) + '</span>' +
          (sug ? '<div class="suggest">Propozycja ciężaru: <b>' + fmtNum(sug) + ' kg</b></div>' : '') + '</div>';
      }
      ex.sets.forEach((s, j) => {
        html += '<div class="set-row"><span class="set-num">' + (j + 1) + '</span>' +
          '<input class="inp-w" type="number" step="any" inputmode="decimal" placeholder="kg" data-k="w" data-ex="' + i + '" data-se="' + j + '" value="' + (s.w !== undefined && s.w !== '' ? s.w : '') + '">' +
          '<input class="inp-r" type="number" step="any" inputmode="numeric" placeholder="powt." data-k="r" data-ex="' + i + '" data-se="' + j + '" value="' + (s.r !== undefined && s.r !== '' ? s.r : '') + '">' +
          '<button class="icon-btn" data-act="del-set" data-ex="' + i + '" data-se="' + j + '">✕</button></div>';
      });
      html += '<div class="set-hint">kg × powtórzenia</div>' +
        '<button class="add-set" data-act="add-set" data-ex="' + i + '">+ Dodaj serię</button>' +
        '</div></div>';
    });
    html += '<div class="form-actions">' +
      '<button class="btn secondary" id="add-ex-btn">+ Dodaj ćwiczenie</button>' +
      (c.exercises.length ? '<button class="btn danger" id="clear-ex-btn">Wyczyść wszystkie</button>' : '') +
      '</div>';
    html += '<div class="form-row"><div><label class="field-label">Czas treningu (min)</label>' +
      '<input id="training-duration" type="number" step="any" inputmode="decimal" placeholder="np. 60" value="' + esc(c.duration === '' || c.duration === null || c.duration === undefined ? '' : c.duration) + '"></div></div>';
  } else if (c.category === 'rower') {
    html += '<div class="form-row"><div><label class="field-label">Czas (min)</label>' +
      '<input id="bike-duration" type="text" inputmode="decimal" value="' + esc(c.duration) + '" placeholder="np. 60 lub 1:30"></div>' +
      '<div><label class="field-label">Dystans (km)</label>' +
      '<input id="bike-distance" type="number" step="any" inputmode="decimal" value="' + esc(c.distance) + '" placeholder="np. 25"></div></div>';
    html += '<div class="form-row"><div><label class="field-label">Śr. prędkość (km/h)</label>' +
      '<input id="bike-speed" type="number" step="any" inputmode="decimal" value="' + esc(c.speed) + '" placeholder="np. 25"></div>' +
      '<div><label class="field-label">Śr. tętno (bpm)</label>' +
      '<input id="bike-hr" type="number" step="any" inputmode="numeric" value="' + esc(c.hr) + '" placeholder="np. 145"></div></div>';
    html += '<div class="form-row"><div><label class="field-label">Strefa tętna</label>' +
      '<select id="bike-zone"><option value="">—</option>' +
      [1,2,3,4,5].map(z => '<option value="' + z + '"' + (String(c.zone) === String(z) ? ' selected' : '') + '>Strefa ' + z + '</option>').join('') +
      '</select></div></div>';
    html += '<div class="run-stats" id="bike-stats">' +
      '<div class="run-stat"><span class="rs-val" id="bs-dur">—</span><span class="rs-lbl">Czas</span></div>' +
      '<div class="run-stat"><span class="rs-val" id="bs-dist">—</span><span class="rs-lbl">Dystans</span></div>' +
      '<div class="run-stat"><span class="rs-val" id="bs-speed">—</span><span class="rs-lbl">Śr. prędkość</span></div></div>';
  } else {
    html += '<div class="chips">' + Object.keys(RUN_TYPES).map(t =>
      '<button class="chip' + (c.runType === t ? ' active' : '') + '" data-run="' + t + '">' + RUN_TYPES[t] + '</button>'
    ).join('') + '</div>';
    html += '<div class="form-row"><div><label class="field-label">Czas (min)</label>' +
      '<input id="run-duration" type="text" inputmode="decimal" value="' + esc(c.duration) + '" placeholder="np. 45 lub 1:30"></div>' +
      '<div><label class="field-label">Dystans (km)</label>' +
      '<input id="run-distance" type="number" step="any" inputmode="decimal" value="' + esc(c.distance) + '" placeholder="np. 7,5"></div></div>';
    html += '<div class="form-row"><div><label class="field-label">Śr. tętno (bpm)</label>' +
      '<input id="run-hr" type="number" step="any" inputmode="numeric" value="' + esc(c.hr) + '" placeholder="np. 155"></div>' +
      '<div><label class="field-label">Strefa tętna</label>' +
      '<select id="run-zone"><option value="">—</option>' +
      [1,2,3,4,5].map(z => '<option value="' + z + '"' + (String(c.zone) === String(z) ? ' selected' : '') + '>Strefa ' + z + '</option>').join('') +
      '</select></div></div>';
    html += '<div class="field-label">Międzyczasy (opcjonalnie)</div>' +
      '<div id="run-splits"></div>';
    html += '<div class="run-stats" id="run-stats">' +
      '<div class="run-stat"><span class="rs-val" id="rs-dur">—</span><span class="rs-lbl">Czas</span></div>' +
      '<div class="run-stat"><span class="rs-val" id="rs-dist">—</span><span class="rs-lbl">Dystans</span></div>' +
      '<div class="run-stat"><span class="rs-val" id="rs-pace">—</span><span class="rs-lbl">Tempo</span></div></div>';
  }

  const nameHint = c.category === 'silownia'
    ? ((planById(c.planId) && planById(c.planId).name) || 'np. Trening siłowy')
    : c.category === 'rower'
      ? 'np. Trening rowerowy'
      : (RUN_TYPES[c.runType] || 'np. Trening biegowy');
  html += '<div class="form-row"><div><label class="field-label">Data</label>' +
    '<input id="training-date" type="date" value="' + c.date + '"></div>' +
    '<div><label class="field-label">Kalorie (kcal)</label>' +
    '<input id="training-kcal" type="number" step="any" inputmode="numeric" value="' + esc(c.kcal === '' || c.kcal === null || c.kcal === undefined ? '' : c.kcal) + '" placeholder="np. 450"></div></div>' +
    '<div class="form-row"><div><label class="field-label">Nazwa treningu</label>' +
    '<input id="training-name" type="text" value="' + esc(c.name || '') + '" placeholder="' + esc(nameHint) + '"></div>' +
    '<div><label class="field-label">Notatki (opcjonalnie)</label>' +
    '<input id="training-notes" type="text" value="' + esc(c.notes) + '" placeholder="np. ciężki trening"></div></div>';

  html += '<div class="form-actions">';
  if (c.mode === 'edit') html += '<button class="btn secondary" id="btn-cancel-edit">Anuluj</button>';
  html += '<button class="btn primary" id="btn-save-training">' + (c.mode === 'edit' ? 'Zapisz zmiany' : 'Zapisz trening') + '</button></div>';

  if (c.category === 'silownia') html += workoutTimerHtml() + restTimerHtml();

  wrap.innerHTML = html;
  if (c.category === 'bieganie') updateRunStats();
  if (c.category === 'rower') updateBikeStats();
}

function renderRunSplits() {
  const box = document.getElementById('run-splits');
  if (!box) return;
  const c = state.current;
  const dist = num(c.distance);
  const dists = RUN_DISTANCES.filter(d => dist === 0 || d <= dist);
  if (!dists.length) {
    box.innerHTML = '<div class="field-hint">Podaj dystans — pojawią się pola czasów na 1, 2, 5, 8, 10, 15, 21 km.</div>';
    return;
  }
  let html = '<div class="form-row">';
  dists.forEach(d => {
    html += '<div><label class="field-label">' + d + ' km</label>' +
      '<input type="text" inputmode="decimal" placeholder="min:sec" id="run-split-' + d + '" value="' + esc(c.splits[d] || '') + '"></div>';
  });
  html += '</div>';
  box.innerHTML = html;
}

function updateRunStats() {
  const el = document.getElementById('run-stats');
  if (!el) return;
  const d = num(document.getElementById('run-distance').value);
  const t = durToMin(document.getElementById('run-duration').value);
  document.getElementById('rs-dur').textContent = t > 0 ? formatDur(t) : '—';
  document.getElementById('rs-dist').textContent = d > 0 ? fmtNum(d) + ' km' : '—';
  document.getElementById('rs-pace').textContent = paceText(t, d) || '—';
  renderRunSplits();
}

function updateBikeStats() {
  const el = document.getElementById('bike-stats');
  if (!el) return;
  const d = num(document.getElementById('bike-distance').value);
  const t = durToMin(document.getElementById('bike-duration').value);
  let sp = num(document.getElementById('bike-speed').value);
  if (!sp && d > 0 && t > 0) sp = Math.round((d / (t / 60)) * 10) / 10;
  document.getElementById('bs-dur').textContent = t > 0 ? formatDur(t) : '—';
  document.getElementById('bs-dist').textContent = d > 0 ? fmtNum(d) + ' km' : '—';
  document.getElementById('bs-speed').textContent = sp > 0 ? fmtNum(sp) + ' km/h' : '—';
}

function addSet(exIdx) {
  state.current.exercises[exIdx].sets.push({ w: '', r: '' });
  renderTraining();
}
function delSet(exIdx, seIdx) {
  state.current.exercises[exIdx].sets.splice(seIdx, 1);
  renderTraining();
}
function delEx(exIdx) {
  state.current.exercises.splice(exIdx, 1);
  renderTraining();
}
function toggleExDone(exIdx) {
  const ex = state.current.exercises[exIdx];
  if (!ex) return;
  ex.done = !ex.done;
  if (ex.done) ex.open = false;
  else ex.open = true;
  renderTraining();
}
function clearAllExercises() {
  if (!state.current.exercises.length) return;
  if (!confirm('Usunąć wszystkie ćwiczenia z tego treningu?')) return;
  state.current.exercises = [];
  renderTraining();
}

/* ==================== TIMER ODPOCZYNKU ==================== */

const restTimer = { total: 60, left: 0, timer: null };

function restTimeText() {
  if (restTimer.left > 0) {
    return Math.floor(restTimer.left / 60) + ':' + pad(restTimer.left % 60);
  }
  return Math.floor(restTimer.total / 60) + ':' + pad(restTimer.total % 60);
}

function startRest(dur) {
  if (restTimer.timer) { clearInterval(restTimer.timer); restTimer.timer = null; }
  restTimer.total = dur;
  restTimer.left = dur;
  restTimer.timer = setInterval(() => {
    restTimer.left--;
    updateRestDisplay();
    if (restTimer.left <= 0) {
      stopRest();
      restBeep();
    }
  }, 1000);
  updateRestDisplay();
}

function stopRest() {
  if (restTimer.timer) { clearInterval(restTimer.timer); restTimer.timer = null; }
  restTimer.left = 0;
  updateRestDisplay();
}

function updateRestDisplay() {
  const el = document.getElementById('rt-time');
  if (el) {
    el.textContent = restTimeText();
    el.classList.toggle('running', restTimer.timer !== null);
  }
  const start = document.getElementById('rt-start');
  if (start) start.textContent = restTimer.timer ? 'Restart' : 'Start';
  const st = document.getElementById('ra-status');
  if (st) {
    st.textContent = restTimer.timer ? restTimeText() : restTimer.total + 's';
    st.classList.toggle('running', restTimer.timer !== null);
  }
}

function restBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.3].forEach(off => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine'; o.frequency.value = 880;
      const t = ctx.currentTime + off;
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.start(t); o.stop(t + 0.24);
    });
  } catch (e) {}
  if (navigator.vibrate) navigator.vibrate([250, 150, 250]);
}

/* ==================== STOPER TRENINGU ==================== */

const workoutClock = { seconds: 0, timer: null, startedAt: null };

function fmtClock(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return h + ':' + pad(m) + ':' + pad(s);
  return m + ':' + pad(s);
}

function workoutClockTotal() {
  return workoutClock.startedAt !== null
    ? workoutClock.seconds + Math.floor((Date.now() - workoutClock.startedAt) / 1000)
    : workoutClock.seconds;
}

function workoutClockTick() {
  const el = document.getElementById('wt-time');
  if (el) {
    el.textContent = fmtClock(workoutClockTotal());
    el.classList.add('running');
  }
}

function toggleWorkoutClock() {
  if (workoutClock.startedAt !== null) {
    workoutClock.seconds = workoutClockTotal();
    workoutClock.startedAt = null;
    if (workoutClock.timer) { clearInterval(workoutClock.timer); workoutClock.timer = null; }
  } else {
    workoutClock.startedAt = Date.now();
    workoutClock.timer = setInterval(workoutClockTick, 1000);
    workoutClockTick();
  }
  const el = document.getElementById('wt-toggle');
  if (el) el.textContent = workoutClock.startedAt !== null ? 'Stop' : 'Start';
  const t = document.getElementById('wt-time');
  if (t) t.classList.toggle('running', workoutClock.startedAt !== null);
}

function resetWorkoutClock() {
  if (workoutClock.timer) { clearInterval(workoutClock.timer); workoutClock.timer = null; }
  workoutClock.seconds = 0;
  workoutClock.startedAt = null;
  const el = document.getElementById('wt-toggle');
  if (el) el.textContent = 'Start';
  const t = document.getElementById('wt-time');
  if (t) { t.textContent = fmtClock(0); t.classList.remove('running'); }
}

function refreshWorkoutClock() {
  if (workoutClock.startedAt !== null) workoutClockTick();
}

document.addEventListener('visibilitychange', refreshWorkoutClock);

function workoutTimerHtml() {
  const running = workoutClock.startedAt !== null;
  return '<div class="workout-timer' + (running ? ' running' : '') + '">' +
    '<span class="wt-label">' + icon('clock') + ' Czas treningu</span>' +
    '<span class="wt-time" id="wt-time">' + fmtClock(workoutClockTotal()) + '</span>' +
    '<span class="wt-actions">' +
    '<button class="btn primary small" id="wt-toggle">' + (running ? 'Stop' : 'Start') + '</button>' +
    '<button class="btn secondary small" id="wt-reset">Wyzeruj</button>' +
    '</span></div>';
}

function restTimerHtml() {
  return '<div class="rest-acc' + (state.restOpen ? ' open' : '') + '">' +
    '<div class="ra-head" data-rest-toggle>' +
    icon('clock') +
    '<span class="ra-title">Stoper odpoczynku</span>' +
    '<span class="ra-status" id="ra-status">' + (restTimer.timer ? restTimeText() : restTimer.total + 's') + '</span>' +
    '<span class="ra-chev">' + icon('chev') + '</span></div>' +
    '<div class="ra-body">' +
    '<div class="rt-time" id="rt-time">' + restTimeText() + '</div>' +
    '<div class="chips">' + [60, 90, 120, 180, 240].map(s =>
      '<button class="chip rt-chip' + (restTimer.total === s ? ' active' : '') + '" data-rt="' + s + '">' + s + 's</button>').join('') + '</div>' +
    '<div class="form-actions"><button class="btn primary" id="rt-start">' + (restTimer.timer ? 'Restart' : 'Start') + '</button>' +
    '<button class="btn secondary" id="rt-stop">Stop</button></div></div></div>';
}

function openAddExercise() {
  const sel = document.getElementById('add-ex-select');
  const existing = state.current.exercises.map(e => e.name);
  let opts = '<option value="__custom">— Własna nazwa —</option>';
  gymPlans().forEach(p => {
    const names = p.exercises.filter(n => !existing.includes(n));
    if (!names.length) return;
    opts += '<optgroup label="' + esc(p.name) + '">';
    names.forEach(n => { opts += '<option value="' + esc(n) + '">' + esc(n) + '</option>'; });
    opts += '</optgroup>';
  });
  sel.innerHTML = opts;
  document.getElementById('add-ex-custom-wrap').classList.toggle('hidden', sel.value !== '__custom');
  document.getElementById('add-ex-custom').value = '';
  openModal('modal-add-exercise');
}

function confirmAddExercise() {
  const sel = document.getElementById('add-ex-select');
  const custom = document.getElementById('add-ex-custom').value.trim();
  let name = sel.value;
  if (name === '__custom') {
    if (!custom) { toast('Podaj nazwę ćwiczenia'); return; }
    name = custom;
  }
  if (!name) return;
  state.current.exercises.push({ name: name, sets: [{ w: '', r: '' }] });
  closeModal('modal-add-exercise');
  renderTraining();
}

function addExerciseFromList(name, tag) {
  if (!name) return;
  const c = state.current;
  if (c.category !== 'silownia') {
    c.category = 'silownia';
    c.planId = null;
    c.tags = [];
    c.exercises = [];
  }
  if (tag && !c.tags.includes(tag)) c.tags.push(tag);
  c.mode = 'new';
  if (c.exercises.some(e => e.name === name)) {
    showTab('trening');
    toast('Ćwiczenie już jest w treningu');
    return;
  }
  c.exercises.push({ name: name, sets: [{ w: '', r: '' }] });
  showTab('trening');
  toast('Dodano: ' + name);
}

function saveTraining() {
  const c = state.current;
  const date = document.getElementById('training-date').value || todayStr();
  const name = document.getElementById('training-name').value.trim();
  const kcal = num(document.getElementById('training-kcal').value);
  const notes = document.getElementById('training-notes').value.trim();

  if (c.category === 'silownia') {
    const exercises = c.exercises
      .map(ex => ({ name: ex.name, done: !!ex.done, sets: ex.sets.filter(s => s.w !== '' || s.r !== '') }))
      .filter(ex => ex.sets.length > 0);
    if (!exercises.length) { toast('Dodaj przynajmniej jedną serię'); return; }
    const plan = planById(c.planId);
    const title = name || (plan ? plan.name : 'Trening');
    const durInput = num(document.getElementById('training-duration').value);
    const swMin = workoutClockTotal() >= 30 ? Math.round(workoutClockTotal() / 60) : 0;
    const duration = durInput > 0 ? durInput : swMin;
    if (state.editLogId) {
      const log = data.logs.find(l => l.id === state.editLogId);
      if (log) {
        log.date = date; log.planId = c.planId; log.title = title; log.kcal = kcal; log.notes = notes; log.exercises = exercises;
        log.tags = c.tags.slice();
        if (duration > 0) log.duration = duration;
      }
    } else {
      data.logs.push({ id: uid(), date: date, planId: c.planId, title: title, kcal: kcal, notes: notes, exercises: exercises, tags: c.tags.slice(), duration: duration });
    }
    save();
    toast('Zapisano trening siłowy');
    resetWorkoutClock();
  } else if (c.category === 'rower') {
    const duration = durToMin(document.getElementById('bike-duration').value);
    const distance = num(document.getElementById('bike-distance').value);
    let speed = num(document.getElementById('bike-speed').value);
    const hr = num(document.getElementById('bike-hr').value);
    const zone = document.getElementById('bike-zone').value;
    if (!duration && !distance) { toast('Podaj czas lub dystans'); return; }
    if (!speed && distance > 0 && duration > 0) speed = Math.round((distance / (duration / 60)) * 10) / 10;
    if (state.editBikeId) {
      const bike = data.bikes.find(b => b.id === state.editBikeId);
      if (bike) {
        bike.date = date; bike.duration = duration; bike.distance = distance; bike.speed = speed; bike.hr = hr; bike.zone = zone; bike.name = name; bike.kcal = kcal; bike.notes = notes;
      }
    } else {
      data.bikes.push({ id: uid(), date: date, duration: duration, distance: distance, speed: speed, hr: hr, zone: zone, name: name, kcal: kcal, notes: notes });
    }
    save();
    toast('Zapisano trening rowerowy');
  } else {
    const duration = durToMin(document.getElementById('run-duration').value);
    const distance = num(document.getElementById('run-distance').value);
    const hr = num(document.getElementById('run-hr').value);
    const zone = document.getElementById('run-zone').value;
    if (!duration && !distance) { toast('Podaj czas lub dystans'); return; }
    const splits = {};
    RUN_DISTANCES.forEach(d => {
      const el = document.getElementById('run-split-' + d);
      const v = el ? el.value.trim() : '';
      if (v) splits[d] = v;
    });
    if (state.editRunId) {
      const run = data.runs.find(r => r.id === state.editRunId);
      if (run) {
        run.date = date; run.type = c.runType; run.duration = duration; run.distance = distance; run.hr = hr; run.zone = zone; run.splits = splits; run.name = name; run.kcal = kcal; run.notes = notes;
      }
    } else {
      data.runs.push({ id: uid(), date: date, type: c.runType, duration: duration, distance: distance, hr: hr, zone: zone, splits: splits, name: name, kcal: kcal, notes: notes });
    }
    save();
    toast('Zapisano trening biegowy');
  }

  resetCurrent();
  showTab('kalendarz');
}

/* ==================== POSTĘP ==================== */

function allExerciseNames() {
  const names = new Set();
  data.plans.forEach(p => p.exercises.forEach(e => names.add(e)));
  data.logs.forEach(l => l.exercises.forEach(e => names.add(e.name)));
  return Array.from(names).sort();
}

function gymSeries(name, mode) {
  const map = new Map();
  let best = { w: 0, r: 0, date: '' };
  data.logs.forEach(l => {
    l.exercises.forEach(ex => {
      if (ex.name !== name) return;
      let vol = 0, maxW = 0, maxReps = 0;
      ex.sets.forEach(s => {
        const w = num(s.w), r = num(s.r);
        vol += w * r;
        if (w > maxW) { maxW = w; maxReps = r; }
      });
      if (maxW > best.w) { best = { w: maxW, r: maxReps, date: l.date }; }
      if (vol === 0 && maxW === 0) return;
      const prev = map.get(l.date) || { vol: 0, maxW: 0 };
      prev.vol += vol;
      if (maxW > prev.maxW) prev.maxW = maxW;
      map.set(l.date, prev);
    });
  });
  const arr = Array.from(map.entries()).sort((a, b) => a[0] < b[0] ? -1 : 1)
    .map(([date, v]) => ({ date: date, y: mode === 'volume' ? v.vol : v.maxW }));
  return { arr: arr, best: best };
}

function runSeries(type) {
  const map = new Map();
  data.runs.filter(r => r.type === type).forEach(r => {
    map.set(r.date, (map.get(r.date) || 0) + num(r.distance));
  });
  return Array.from(map.entries()).sort((a, b) => a[0] < b[0] ? -1 : 1).map(([date, y]) => ({ date, y }));
}

function gymSessions(name) {
  const out = [];
  data.logs.forEach(l => {
    l.exercises.forEach(ex => {
      if (ex.name !== name) return;
      let vol = 0, maxW = 0;
      ex.sets.forEach(s => {
        const w = num(s.w), r = num(s.r);
        vol += w * r;
        if (w > maxW) maxW = w;
      });
      if (vol === 0 && maxW === 0) return;
      out.push({ date: l.date, sets: ex.sets, vol: vol, maxW: maxW });
    });
  });
  return out.sort((a, b) => a.date < b.date ? -1 : 1);
}

function runSessions(type) {
  return data.runs.filter(r => r.type === type)
    .map(r => ({ date: r.date, dist: num(r.distance), dur: num(r.duration), hr: r.hr || 0, zone: r.zone || '', splits: r.splits || {} }))
    .sort((a, b) => a.date < b.date ? -1 : 1);
}

function runDistanceTimes(type, km) {
  const out = [];
  data.runs.filter(r => r.type === type).forEach(r => {
    const d = num(r.distance), t = num(r.duration);
    let min = 0;
    if (r.splits && r.splits[km]) {
      min = timeToMin(r.splits[km]);
    } else if (d >= km && t > 0) {
      min = (t / 60) * (km / d);
    }
    if (min > 0) out.push({ date: r.date, y: min });
  });
  return out.sort((a, b) => a.date < b.date ? -1 : 1);
}

function healthSeries(metric) {
  const map = new Map();
  data.health.filter(h => h[metric]).forEach(h => map.set(h.date, num(h[metric])));
  return Array.from(map.entries()).sort((a, b) => a[0] < b[0] ? -1 : 1).map(([date, y]) => ({ date, y }));
}

/* ==================== PODSUMOWANIE PROFILU ==================== */

function summaryYears() {
  const ys = new Set();
  const add = ds => { const p = String(ds).split('-'); if (p.length === 3 && +p[0]) ys.add(+p[0]); };
  data.logs.forEach(l => add(l.date));
  data.runs.forEach(r => add(r.date));
  data.health.forEach(h => add(h.date));
  data.races.forEach(r => add(r.date));
  if (!ys.size) ys.add(new Date().getFullYear());
  return Array.from(ys).sort((a, b) => b - a);
}

function summaryRange(y, m) {
  if (m === 0) return { start: y + '-01-01', end: y + '-12-31' };
  const days = new Date(y, m, 0).getDate();
  return { start: dateStr(y, m - 1, 1), end: dateStr(y, m - 1, days) };
}

function renderSummary() {
  const box = document.getElementById('summary-box');
  if (!box) return;
  if (!state.sumYear) {
    const n = new Date();
    state.sumYear = n.getFullYear();
    state.sumMonth = n.getMonth() + 1;
  }
  const years = summaryYears();
  const y = state.sumYear, m = state.sumMonth;
  const r = summaryRange(y, m);
  const inR = x => x.date >= r.start && x.date <= r.end;
  const logs = data.logs.filter(inR);
  const runs = data.runs.filter(inR);
  const health = data.health.filter(inR).sort((a, b) => a.date < b.date ? -1 : 1);
  const days = new Set();
  logs.forEach(l => days.add(l.date));
  runs.forEach(rr => days.add(rr.date));
  let dist = 0, dur = 0, vol = 0, weeksSet = new Set();
  runs.forEach(rr => { dist += num(rr.distance); dur += num(rr.duration); weeksSet.add(weekStart(rr.date)); });
  logs.forEach(l => { weeksSet.add(weekStart(l.date)); l.exercises.forEach(ex => ex.sets.forEach(s => vol += num(s.w) * num(s.r))); });
  const weekCnt = weeksSet.size;
  const wFirst = health[0], wLast = health[health.length - 1];

  let html = '<div class="card"><h3>Podsumowanie profilu</h3>' +
    '<div class="sum-sel"><select id="sum-year">' +
    years.map(yy => '<option value="' + yy + '"' + (yy === y ? ' selected' : '') + '>' + yy + '</option>').join('') + '</select>' +
    '<select id="sum-month">' +
    '<option value="0"' + (m === 0 ? ' selected' : '') + '>Cały rok</option>' +
    MONTHS.map((mn, i) => '<option value="' + (i + 1) + '"' + (m === i + 1 ? ' selected' : '') + '>' + mn + '</option>').join('') + '</select></div>' +
    '<div class="stat-grid">' +
    statCell(days.size, 'Dni treningowe') +
    statCell(logs.length, 'Treningi siłowe') +
    statCell(runs.length, 'Biegi') +
    statCell(dist > 0 ? fmtNum(dist) + ' km' : '—', 'Dystans biegania') +
    statCell(dur > 0 ? formatDur(dur) : '—', 'Czas biegania') +
    statCell(vol > 0 ? fmtNum(vol) + ' kg' : '—', 'Objętość siłowa') +
    statCell(weekCnt, 'Aktywne tygodnie') +
    statCell((weekCnt ? Math.round((days.size / weekCnt) * 10) / 10 : 0), 'Dni/tydzień śr.') +
    statCell(wFirst && wLast ? fmtNum(num(wFirst.weight)) + ' → ' + fmtNum(num(wLast.weight)) + ' kg' : '—', 'Waga start → koniec') +
    '</div></div>';
  box.innerHTML = html;
}

/* ==================== ODZNAKI ==================== */

function badges() {
  const b = [];
  const days = new Set();
  data.logs.forEach(l => days.add(l.date));
  data.runs.forEach(r => days.add(r.date));
  const trainDays = days.size;
  let km = 0;
  data.runs.forEach(r => km += num(r.distance));
  const gym = data.logs.length;
  const runs = data.runs.length;
  let maxW = 0;
  let est1rm = 0;
  data.logs.forEach(l => l.exercises.forEach(ex => ex.sets.forEach(s => {
    const w = num(s.w), r = num(s.r);
    if (w > maxW) maxW = w;
    if (w && r) { const e = w * (1 + r / 30); if (e > est1rm) est1rm = e; }
  })));
  let best5 = 0;
  data.runs.forEach(r => {
    const t = timeToMin((r.splits && r.splits[5]));
    if (t > 0 && (!best5 || t < best5)) best5 = t;
  });
  const half = data.runs.some(r => num(r.distance) >= 21);
  const streak = weekStreakCount();
  let minDate = null, maxDate = null;
  const touch = ds => {
    if (!minDate || ds < minDate) minDate = ds;
    if (!maxDate || ds > maxDate) maxDate = ds;
  };
  data.logs.forEach(l => touch(l.date));
  data.runs.forEach(r => touch(r.date));
  const span = (minDate && maxDate) ? dateDiffDays(minDate, maxDate) : 0;
  const monthCount = new Map();
  data.logs.forEach(l => { const k = l.date.slice(0, 7); monthCount.set(k, (monthCount.get(k) || 0) + 1); });
  data.runs.forEach(r => { const k = r.date.slice(0, 7); monthCount.set(k, (monthCount.get(k) || 0) + 1); });
  const month10 = Array.from(monthCount.values()).some(n => n >= 10);
  const add = (id, title, desc, ok) => b.push({ id, title, desc, ok });
  add('first', 'Pierwszy krok', 'Pierwszy zapisany trening', trainDays >= 1);
  add('days10', '10 dni treningu', 'Łącznie 10 dni z treningiem', trainDays >= 10);
  add('days50', '50 dni treningu', 'Łącznie 50 dni z treningiem', trainDays >= 50);
  add('days100', '100 dni treningu', 'Łącznie 100 dni z treningiem', trainDays >= 100);
  add('gym10', 'Regularny bywalec', '10 treningów siłowych', gym >= 10);
  add('gym50', 'Zaprawiony', '50 treningów siłowych', gym >= 50);
  add('run1', 'Pierwszy bieg', 'Zapisany pierwszy bieg', runs >= 1);
  add('run50', '50 km', 'Łącznie 50 km przebiegniętych', km >= 50);
  add('run100', '100 km', 'Łącznie 100 km przebiegniętych', km >= 100);
  add('run500', '500 km', 'Łącznie 500 km przebiegniętych', km >= 500);
  add('fast5', 'Szybka piątka', '5 km w mniej niż 30 minut', best5 > 0 && best5 < 30);
  add('half', 'Połówka', 'Bieg na 21 km lub więcej', half);
  add('heavy', 'Ciężko robota', 'Seria z ciężarem 100 kg lub więcej', maxW >= 100);
  add('pr', 'Rekordzista', 'Szacowany 1RM 120 kg lub więcej', est1rm >= 120);
  add('streak4', 'Rytm tygodniowy', '4 tygodnie treningowe z rzędu', streak >= 4);
  add('year', 'Wierny towarzysz', 'Treningi w odstępie przynajmniej roku', span >= 365);
  add('month10', 'Miesiąc mocy', '10+ treningów w jednym miesiącu', month10);
  add('health1', 'Świadomy ciała', 'Pierwszy pomiar zdrowia', data.health.length >= 1);
  add('photo1', 'Obserwuj postęp', 'Pierwsze zdjęcie sylwetki', data.photos.length >= 1);
  return b;
}

function renderBadges() {
  const el = document.getElementById('badges-grid');
  if (!el) return;
  const list = badges();
  el.innerHTML = list.map(b =>
    '<div class="badge-tile' + (b.ok ? ' on' : '') + '" title="' + esc(b.desc) + '">' +
    '<div class="badge-ico">' + (b.ok ? icon('star') : icon('lock')) + '</div>' +
    '<div class="badge-name">' + esc(b.title) + '</div>' +
    '<div class="badge-desc">' + esc(b.desc) + '</div></div>').join('');
}

/* ==================== PR + 1RM ==================== */

function e1rmSeries(name) {
  const map = new Map();
  data.logs.forEach(l => {
    l.exercises.forEach(ex => {
      if (ex.name !== name) return;
      let maxE = 0;
      ex.sets.forEach(s => {
        const w = num(s.w), r = num(s.r);
        if (w && r) { const e = w * (1 + r / 30); if (e > maxE) maxE = e; }
      });
      if (maxE > 0) map.set(l.date, Math.max(map.get(l.date) || 0, maxE));
    });
  });
  return Array.from(map.entries()).sort((a, b) => a[0] < b[0] ? -1 : 1).map(([date, y]) => ({ date, y }));
}

function allExercisePRs() {
  const out = [];
  data.logs.forEach(l => l.exercises.forEach(ex => {
    let bw = 0, br = 0, be = 0;
    ex.sets.forEach(s => {
      const w = num(s.w), r = num(s.r);
      if (w > bw) { bw = w; br = r; }
      if (w && r) { const e = w * (1 + r / 30); if (e > be) be = e; }
    });
    if (bw > 0) out.push({ name: ex.name, w: bw, r: br, e: Math.round(be * 10) / 10, date: l.date });
  }));
  return out;
}

function renderPR() {
  const box = document.getElementById('pr-box');
  if (!box) return;
  const names = allExerciseNames();
  const sel = state.prog.prEx || names[0];
  if (sel && state.prog.prEx !== sel) state.prog.prEx = sel;
  const prs = allExercisePRs().sort((a, b) => b.e - a.e);

  let html = '<div class="card"><h3>Rekordy i szacowany 1RM</h3>';
  html += '<label class="field-label">Ćwiczenie</label><select id="pr-ex">' +
    names.map(n => '<option value="' + esc(n) + '"' + (n === sel ? ' selected' : '') + '>' + esc(n) + '</option>').join('') + '</select>';
  html += '<div class="pr-legend"><span class="pr-lg pr-a">PR (max kg)</span><span class="pr-lg pr-b">1RM (est.)</span></div>';
  html += '<div id="chart-pr"></div>';
  html += '<div id="chart-e1"></div>';
  html += '</div>';

  html += '<div class="card"><h3>Ranking ćwiczeń</h3>';
  if (!prs.length) html += '<div class="chart-empty">Brak zarejestrowanych serii.</div>';
  else {
    const top = prs.slice(0, 8);
    html += '<div class="pr-list">' + top.map(x => {
      const maxE = prs[0].e;
      const pct = maxE > 0 ? Math.round((x.e / maxE) * 100) : 0;
      return '<div class="pr-item">' +
        '<div class="pr-rank"><span class="pr-name">' + esc(x.name) + '</span><span class="pr-sub">' + shortDate(x.date) + '</span></div>' +
        '<div class="pr-right"><span class="pr-val">' + fmtNum(x.w) + ' × ' + fmtNum(x.r) + '</span>' +
        '<span class="pr-e1rm">' + fmtNum(x.e) + ' kg (1RM)</span></div>' +
        '<div class="pr-bar"><div style="width:' + pct + '%"></div></div></div>';
    }).join('') + '</div>';
  }
  html += '</div>';

  box.innerHTML = html;

  if (names.length) {
    const prS = gymSeries(sel, 'weight').arr;
    const e1 = e1rmSeries(sel);
    renderChart('chart-pr', prS.map(x => ({ label: shortDate(x.date), y: x.y })), '#ff6b35');
    renderChart('chart-e1', e1.map(x => ({ label: shortDate(x.date), y: x.y })), '#38bdf8');
  }
}

/* ==================== PREDYKCJE (Riegel) ==================== */

function riegelPrediction(min, d1, d2) {
  return min * Math.pow(d2 / d1, 1.06);
}

function renderPredictions() {
  const el = document.getElementById('prediction-box');
  if (!el) return;
  const runs = data.runs
    .filter(r => num(r.duration) > 0 && num(r.distance) >= 1)
    .sort((a, b) => a.date > b.date ? -1 : 1);
  if (!runs.length) {
    el.innerHTML = '<div class="chart-empty">Dodaj bieg z czasem i dystansem, aby zobaczyć predykcje czasów.</div>';
    return;
  }
  const r = runs[0];
  const min = num(r.duration) / 60;
  const d = num(r.distance);
  const targets = [5, 10, 21, 42];
  el.innerHTML = '<div class="cmp-box"><div class="cmp-title">Na podstawie: ' + fmtNum(d) + ' km w ' + minToText(min) +
    ' (tempo ' + formatPace(min / d) + '/km · ' + shortDate(r.date) + ')</div>' +
    '<div class="pred-grid">' + targets.map(t => {
      const p = riegelPrediction(min, d, t);
      return '<div class="pred-item"><div class="pred-dist">' + t + ' km</div>' +
        '<div class="pred-time">' + minToText(p) + '</div>' +
        '<div class="pred-pace">' + formatPace(p / t) + '/km</div></div>';
    }).join('') + '</div>' +
    '<div class="pred-note">Wzór Riegla — szacunek, nie gwarancja. Tempo wyścigowe może być inne niż treningowe.</div></div>';
}

function renderProgress() {
  const wrap = document.getElementById('progress-form');
  const exNames = allExerciseNames();
  const p = state.prog;
  renderSummary();
  renderBadges();
  renderPR();

  let html = '<div class="card"><h3>Siłownia — ćwiczenie</h3>';
  html += '<label class="field-label">Ćwiczenie</label><select id="prog-ex">' +
    exNames.map(n => '<option value="' + esc(n) + '"' + (n === p.ex ? ' selected' : '') + '>' + esc(n) + '</option>').join('') + '</select>';
  html += '<label class="field-label">Pokaż</label><div class="chips">' +
    '<button class="chip' + (p.mode === 'volume' ? ' active' : '') + '" data-prog-mode="volume">Objętość (kg)</button>' +
    '<button class="chip' + (p.mode === 'weight' ? ' active' : '') + '" data-prog-mode="weight">Ciężar (max)</button></div>';
  html += '<div id="chart-gym"></div></div>';

  html += '<div class="card"><h3>Bieganie — czas na dystansie</h3>';
  html += '<label class="field-label">Typ treningu</label><select id="prog-run">' +
    Object.keys(RUN_TYPES).map(t => '<option value="' + t + '"' + (t === p.run ? ' selected' : '') + '>' + RUN_TYPES[t] + '</option>').join('') + '</select>';
  html += '<label class="field-label">Dystans</label><div class="chips">' +
    RUN_DISTANCES.map(d => '<button class="chip' + (Number(p.km) === d ? ' active' : '') + '" data-prog-km="' + d + '">' + d + ' km</button>').join('') + '</div>';
  html += '<div id="chart-run"></div></div>';

  const metrics = [
    { id: 'weight', label: 'Waga (kg)', color: '#ff6b35' },
    { id: 'bodyFat', label: 'Body fat (%)', color: '#38bdf8' },
    { id: 'muscle', label: 'Mięśnie (kg)', color: '#4ade80' },
    { id: 'fat', label: 'Tłuszcz (kg)', color: '#f59e0b' }
  ];
  html += '<div class="card"><h3>Zdrowie</h3>';
  html += '<label class="field-label">Parametr</label><select id="prog-health">' +
    metrics.map(m => '<option value="' + m.id + '"' + (m.id === p.metric ? ' selected' : '') + '>' + m.label + '</option>').join('') + '</select>';
  html += '<div id="chart-health"></div></div>';

  html += '<div class="card"><h3>Bieganie — predykcje czasów</h3>' +
    '<div id="prediction-box"></div></div>';

  wrap.innerHTML = html;

  renderPredictions();

  const name = p.ex || exNames[0];
  if (name) {
    if (p.ex !== name) { state.prog.ex = name; }
    const gs = gymSeries(name, p.mode);
    renderChart('chart-gym', gs.arr.map(x => ({ label: shortDate(x.date), y: x.y })), '#ff6b35');
    const last = gs.arr[gs.arr.length - 1];
    html = '<div class="stat-row">' +
      '<div class="stat-card"><div class="stat-val">' + (last ? fmtNum(last.y) : '—') + '</div><div class="stat-lbl">' + (p.mode === 'volume' ? 'Ostatnia objętość (kg)' : 'Ostatni max ciężar (kg)') + '</div></div>' +
      '<div class="stat-card"><div class="stat-val">' + gs.arr.length + '</div><div class="stat-lbl">Treningi z tym ćw.</div></div>' +
      '<div class="stat-card"><div class="stat-val">' + (gs.best.w ? fmtNum(gs.best.w) + ' × ' + fmtNum(gs.best.r) : '—') + '</div><div class="stat-lbl">Najlepsza seria</div></div></div>';
    const statWrap = document.createElement('div');
    statWrap.innerHTML = html;
    document.getElementById('chart-gym').appendChild(statWrap);

    const sess = gymSessions(name);
    if (sess.length) {
      let cmpHtml = '';
      if (sess.length >= 2) {
        const mid = Math.ceil(sess.length / 2);
        const old = sess.slice(0, mid), now = sess.slice(mid);
        const avg = a => a.reduce((s, x) => s + x, 0) / a.length;
        const oW = avg(old.map(x => x.maxW)), nW = avg(now.map(x => x.maxW));
        const oV = avg(old.map(x => x.vol)), nV = avg(now.map(x => x.vol));
        const pW = oW > 0 ? Math.round(((nW - oW) / oW) * 100) : null;
        const pV = oV > 0 ? Math.round(((nV - oV) / oV) * 100) : null;
        const rng = a => shortDate(a[0].date) + ' – ' + shortDate(a[a.length - 1].date);
        const pctHtml = (p) => p === null ? '' : '<div class="cmp-delta ' + (p >= 0 ? 'up' : 'down') + '">' + (p >= 0 ? '+' : '') + p + '%</div>';
        cmpHtml = '<div class="cmp-box"><div class="cmp-title">Kiedyś vs teraz</div>' +
          '<div class="cmp-row">' +
          '<div class="cmp-col"><div class="cmp-lbl">Kiedyś · ' + rng(old) + '</div><div class="cmp-val">' + fmtNum(oW) + ' kg</div><div class="cmp-sub">śr. max ciężar</div></div>' +
          '<div class="cmp-arrow">→</div>' +
          '<div class="cmp-col"><div class="cmp-lbl">Teraz · ' + rng(now) + '</div><div class="cmp-val">' + fmtNum(nW) + ' kg</div><div class="cmp-sub">śr. max ciężar</div></div>' +
          '</div>' + pctHtml(pW) +
          '<div class="cmp-row"><div class="cmp-col"><div class="cmp-val">' + fmtNum(oV) + ' kg</div><div class="cmp-sub">śr. objętość</div></div>' +
          '<div class="cmp-arrow">→</div>' +
          '<div class="cmp-col"><div class="cmp-val">' + fmtNum(nV) + ' kg</div><div class="cmp-sub">śr. objętość</div></div></div>' +
          pctHtml(pV) + '</div>';
      }
      const histRows = sess.slice().reverse().map(x => {
        const setsTxt = x.sets.map(s => (s.w ? fmtNum(s.w) + 'kg' : '?') + ' × ' + (s.r || '?')).join(', ');
        return '<div class="hist-item"><div class="hist-date">' + shortDate(x.date) + '</div><div class="hist-sets">' + setsTxt + '</div><div class="hist-vol">' + fmtNum(x.vol) + ' kg</div></div>';
      }).join('');
      html = cmpHtml + '<div class="hist-box"><div class="hist-title">Historia ćwiczenia · ' + sess.length + ' treningów</div><div class="hist-list">' + histRows + '</div></div>';
      const histWrap = document.createElement('div');
      histWrap.innerHTML = html;
      document.getElementById('chart-gym').appendChild(histWrap);
    }
  } else {
    document.getElementById('chart-gym').innerHTML = '<div class="chart-empty">Brak ćwiczeń.</div>';
  }

  const km = Number(p.km) || 5;
  const tSeries = runDistanceTimes(p.run, km);
  renderChart('chart-run', tSeries.map(x => ({ label: shortDate(x.date), y: x.y })), '#38bdf8');
  const best = tSeries.reduce((a, x) => (x.y < a || a === 0) ? x.y : a, 0);
  const last = tSeries[tSeries.length - 1];
  html = '<div class="stat-row">' +
    '<div class="stat-card"><div class="stat-val">' + (best ? minToText(best) : '—') + '</div><div class="stat-lbl">Najlepszy czas ' + km + ' km</div></div>' +
    '<div class="stat-card"><div class="stat-val">' + (last ? minToText(last.y) : '—') + '</div><div class="stat-lbl">Ostatni czas</div></div>' +
    '<div class="stat-card"><div class="stat-val">' + tSeries.length + '</div><div class="stat-lbl">Pomiary</div></div></div>';
  const statWrap2 = document.createElement('div');
  statWrap2.innerHTML = html;
  document.getElementById('chart-run').appendChild(statWrap2);

  const runs = runSessions(p.run);
  if (runs.length) {
    let cmpHtml = '';
    if (tSeries.length >= 2) {
      const mid = Math.ceil(tSeries.length / 2);
      const old = tSeries.slice(0, mid), now = tSeries.slice(mid);
      const avg = a => a.reduce((s, x) => s + x.y, 0) / a.length;
      const oT = avg(old), nT = avg(now);
      const pT = oT > 0 ? Math.round(((nT - oT) / oT) * 100) : null;
      const rng = a => shortDate(a[0].date) + ' – ' + shortDate(a[a.length - 1].date);
      cmpHtml = '<div class="cmp-box"><div class="cmp-title">Kiedyś vs teraz · ' + km + ' km</div>' +
        '<div class="cmp-row">' +
        '<div class="cmp-col"><div class="cmp-lbl">Kiedyś · ' + rng(old) + '</div><div class="cmp-val">' + minToText(oT) + '</div><div class="cmp-sub">śr. czas</div></div>' +
        '<div class="cmp-arrow">→</div>' +
        '<div class="cmp-col"><div class="cmp-lbl">Teraz · ' + rng(now) + '</div><div class="cmp-val">' + minToText(nT) + '</div><div class="cmp-sub">śr. czas</div></div>' +
        '</div>' + (pT === null ? '' : '<div class="cmp-delta ' + (pT <= 0 ? 'up' : 'down') + '">' + (pT <= 0 ? '' : '+') + pT + '%</div>') +
        '</div>';
    }
    const histRows = runs.slice().reverse().map(r => {
      const pace = paceText(r.dur, r.dist) || '—';
      const hrTxt = r.hr ? ' · ' + fmtNum(r.hr) + ' bpm' : '';
      const zoneTxt = r.zone ? ' · strefa ' + r.zone : '';
      const splitTxt = r.splits && r.splits[km] ? ' · ' + km + 'km ' + r.splits[km] : '';
      return '<div class="hist-item"><div class="hist-date">' + shortDate(r.date) + '</div><div class="hist-sets">' + fmtNum(r.dist) + ' km · ' + formatDur(r.dur) + hrTxt + zoneTxt + splitTxt + '</div><div class="hist-vol">' + pace + '</div></div>';
    }).join('');
    html = cmpHtml + '<div class="hist-box"><div class="hist-title">Historia biegów · ' + runs.length + ' treningów</div><div class="hist-list">' + histRows + '</div></div>';
    const histWrap2 = document.createElement('div');
    histWrap2.innerHTML = html;
    document.getElementById('chart-run').appendChild(histWrap2);
  }

  const hs = healthSeries(p.metric);
  renderChart('chart-health', hs.map(x => ({ label: shortDate(x.date), y: x.y })), '#4ade80');
  const latest = hs[hs.length - 1];
  const prev = hs[hs.length - 2];
  let delta = '—';
  if (latest && prev) {
    const d = latest.y - prev.y;
    delta = (d > 0 ? '+' : '') + fmtNum(d);
  }
  html = '<div class="stat-row">' +
    '<div class="stat-card"><div class="stat-val">' + (latest ? fmtNum(latest.y) : '—') + '</div><div class="stat-lbl">Ostatni pomiar</div></div>' +
    '<div class="stat-card"><div class="stat-val">' + delta + '</div><div class="stat-lbl">Zmiana</div></div></div>';
  const statWrap3 = document.createElement('div');
  statWrap3.innerHTML = html;
  document.getElementById('chart-health').appendChild(statWrap3);
}

/* ==================== WYKRESY ==================== */

function hexToRgb(hex) {
  hex = String(hex).replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function renderChart(containerId, points, color) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!points || points.length < 2) {
    el.innerHTML = '<div class="chart-empty">Za mało danych do wykresu.<br>Zaloguj przynajmniej 2 pomiary.</div>';
    return;
  }
  const W = Math.max(280, el.clientWidth || 340);
  const H = 220;
  const padL = 48, padR = 10, padT = 14, padB = 26;
  const iw = W - padL - padR, ih = H - padT - padB;
  let min = Math.min(...points.map(x => x.y));
  let max = Math.max(...points.map(x => x.y));
  if (min === max) { min -= 1; max += 1; }
  const range = max - min;
  min -= range * 0.08; max += range * 0.08;
  const baseY = padT + ih;
  const X = i => padL + (i / (points.length - 1)) * iw;
  const Y = v => padT + ih - ((v - min) / (max - min)) * ih;
  const gid = 'grad-' + containerId;
  const rgb = hexToRgb(color).join(',');
  let grid = '';
  for (let g = 0; g <= 4; g++) {
    const gy = padT + (ih / 4) * g;
    const val = max - (max - min) * (g / 4);
    grid += '<line x1="' + padL + '" y1="' + gy.toFixed(1) + '" x2="' + (padL + iw) + '" y2="' + gy.toFixed(1) + '" stroke="#22222c" stroke-width="1"/>' +
      '<text x="' + (padL - 6) + '" y="' + (gy + 4).toFixed(1) + '" text-anchor="end" font-size="10" fill="#9a9aa8">' + fmtNum(val) + '</text>';
  }
  const step = Math.max(1, Math.ceil(points.length / 6));
  let xl = '';
  points.forEach((x, i) => {
    if (i % step === 0) xl += '<text x="' + X(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10" fill="#9a9aa8">' + x.label + '</text>';
  });
  let path = '';
  points.forEach((x, i) => { path += (i ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(x.y).toFixed(1); });
  let area = '';
  if (points.length > 0) {
    area = '<path d="' + path + 'L' + X(points.length - 1).toFixed(1) + ',' + baseY + 'L' + X(0).toFixed(1) + ',' + baseY + 'Z" fill="url(#' + gid + ')" opacity="0.9"/>';
  }
  let dots = '';
  points.forEach((x, i) => { dots += '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(x.y).toFixed(1) + '" r="3.6" fill="#0b0b10" stroke="' + color + '" stroke-width="2"/>'; });
  el.innerHTML = '<svg class="svg-chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">' +
    '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0%" stop-color="rgba(' + rgb + ',0.32)"/>' +
    '<stop offset="100%" stop-color="rgba(' + rgb + ',0.02)"/>' +
    '</linearGradient></defs>' +
    grid + area +
    '<path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' + dots + xl + '</svg>';
}

/* ==================== ZDROWIE ==================== */

function renderHealth() {
  const wrap = document.getElementById('health-form');
  const sorted = data.health.slice().sort((a, b) => a.date < b.date ? 1 : -1);
  const latest = sorted[0];

  let html = '<div class="summary-grid">';
  const metrics = [
    { id: 'weight', label: 'Waga', unit: 'kg', color: '' },
    { id: 'bodyFat', label: 'Body fat', unit: '%', color: '' },
    { id: 'muscle', label: 'Mięśnie', unit: 'kg', color: '' },
    { id: 'fat', label: 'Tłuszcz', unit: 'kg', color: '' }
  ];
  metrics.forEach(m => {
    const now = latest && latest[m.id] ? num(latest[m.id]) : null;
    const prev = sorted[1] && sorted[1][m.id] ? num(sorted[1][m.id]) : null;
    let deltaHtml = '<div class="s-delta neutral">—</div>';
    if (now !== null && prev !== null) {
      const d = Math.round((now - prev) * 10) / 10;
      const cls = d === 0 ? 'neutral' : d > 0 ? 'up' : 'down';
      const arrow = d > 0 ? '▲' : d < 0 ? '▼' : '•';
      deltaHtml = '<div class="s-delta ' + cls + '">' + arrow + ' ' + fmtNum(Math.abs(d)) + ' ' + m.unit + '</div>';
    }
    html += '<div class="summary-card"><div class="s-lbl">' + m.label + '</div>' +
      '<div class="s-val">' + (now !== null ? fmtNum(now) + ' <span style="font-size:12px;color:#9a9aa8">' + m.unit + '</span>' : '—') + '</div>' + deltaHtml + '</div>';
  });
  html += '</div>';

  html += '<div id="goal-box"></div>';

  html += '<div class="card"><h3>' + (state.editHealthId ? 'Edytuj wpis' : 'Nowy wpis') + '</h3>';
  html += '<div><label class="field-label">Data</label><input id="h-date" type="date" value="' + todayStr() + '"></div>';
  const fields = [
    { id: 'h-weight', lbl: 'Waga (kg)' },
    { id: 'h-fatpct', lbl: 'Body fat (%)' },
    { id: 'h-muscle', lbl: 'Mięśnie (kg)' },
    { id: 'h-fat', lbl: 'Tłuszcz (kg)' }
  ];
  html += '<div class="form-row"><div><label class="field-label">' + fields[0].lbl + '</label><input id="' + fields[0].id + '" type="number" step="any" inputmode="decimal" placeholder="0,0"></div>' +
    '<div><label class="field-label">' + fields[1].lbl + '</label><input id="' + fields[1].id + '" type="number" step="any" inputmode="decimal" placeholder="0,0"></div></div>';
  html += '<div class="form-row"><div><label class="field-label">' + fields[2].lbl + '</label><input id="' + fields[2].id + '" type="number" step="any" inputmode="decimal" placeholder="0,0"></div>' +
    '<div><label class="field-label">' + fields[3].lbl + '</label><input id="' + fields[3].id + '" type="number" step="any" inputmode="decimal" placeholder="0,0"></div></div>';
  html += '<div class="form-actions">';
  if (state.editHealthId) html += '<button class="btn secondary" id="btn-cancel-health">Anuluj</button>';
  html += '<button class="btn primary" id="btn-save-health">' + (state.editHealthId ? 'Zapisz zmiany' : 'Dodaj wpis') + '</button></div></div>';

  html += '<div class="card"><h3>Historia pomiarów</h3>';
  if (!sorted.length) html += '<div class="chart-empty">Brak pomiarów. Dodaj pierwszy powyżej.</div>';
  else {
    html += '<div class="health-list">' + sorted.map(h => {
      const open = !!state.healthOpen[h.id];
      const vals = [];
      if (h.weight) vals.push('Waga ' + fmtNum(h.weight) + ' kg');
      if (h.bodyFat) vals.push('BF ' + fmtNum(h.bodyFat) + '%');
      if (h.muscle) vals.push('Mięśnie ' + fmtNum(h.muscle) + ' kg');
      if (h.fat) vals.push('Tłuszcz ' + fmtNum(h.fat) + ' kg');
      return '<div class="health-item' + (open ? ' open' : '') + '">' +
        '<button type="button" class="health-head" data-health-open="' + h.id + '">' +
        '<span class="h-date">' + shortDate(h.date) + '</span>' +
        '<span class="h-summary">' + esc(vals.slice(0, 2).join(' · ') + (vals.length > 2 ? '…' : '')) + '</span>' +
        '<span class="h-chev">' + icon('chev') + '</span></button>' +
        (open ? '<div class="health-body"><div class="health-vals">' +
          vals.map(v => '<span class="hv">' + esc(v) + '</span>').join('') + '</div>' +
          '<div class="entry-actions"><button class="mini-btn" data-edit="health:' + h.id + '">Edytuj</button>' +
          '<button class="mini-btn" data-del="health:' + h.id + '">Usuń</button></div></div>' : '') +
        '</div>';
    }).join('') + '</div>';
  }
  html += '</div>';

  wrap.innerHTML = html;

  renderWeightGoal();
  renderPhotos();

  if (state.editHealthId) {
    const h = data.health.find(x => x.id === state.editHealthId);
    if (h) fillHealthForm(h);
  }
}

function fillHealthForm(h) {
  document.getElementById('h-date').value = h.date || todayStr();
  document.getElementById('h-weight').value = h.weight || '';
  document.getElementById('h-fatpct').value = h.bodyFat || '';
  document.getElementById('h-muscle').value = h.muscle || '';
  document.getElementById('h-fat').value = h.fat || '';
}

function saveHealth() {
  const date = document.getElementById('h-date').value || todayStr();
  const entry = {
    date: date,
    weight: document.getElementById('h-weight').value.trim(),
    bodyFat: document.getElementById('h-fatpct').value.trim(),
    muscle: document.getElementById('h-muscle').value.trim(),
    fat: document.getElementById('h-fat').value.trim()
  };
  const hasAny = entry.weight || entry.bodyFat || entry.muscle || entry.fat;
  if (!hasAny) { toast('Wpisz przynajmniej jedną wartość'); return; }
  if (state.editHealthId) {
    const h = data.health.find(x => x.id === state.editHealthId);
    if (h) { Object.assign(h, entry); }
    state.editHealthId = null;
  } else {
    data.health.push({ id: uid(), ...entry });
  }
  save();
  toast('Zapisano pomiary');
  renderHealth();
  renderCalendar();
}

/* ==================== CEL I PROGNOZA WAGI ==================== */

function linearTrend(points) {
  const n = points.length;
  if (n < 2) return null;
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  points.forEach(p => { sx += p.x; sy += p.y; sxy += p.x * p.y; sxx += p.x * p.x; });
  const denom = n * sxx - sx * sx;
  if (denom === 0) return null;
  const b = (n * sxy - sx * sy) / denom;
  const a = (sy - b * sx) / n;
  return { a, b };
}

function renderWeightGoal() {
  const box = document.getElementById('goal-box');
  if (!box) return;
  const wSeries = data.health.filter(h => num(h.weight) > 0).sort((a, b) => a.date < b.date ? -1 : 1);
  const goal = num(data.goal && data.goal.weight);
  const first = wSeries[0], last = wSeries[wSeries.length - 1];

  let html = '<div class="card"><h3>Cel i prognoza wagi</h3>';
  html += '<div class="goal-row"><div><label class="field-label">Docelowa waga (kg)</label>' +
    '<input id="goal-weight" type="number" step="any" inputmode="decimal" placeholder="np. 78" value="' + (goal ? goal : '') + '"></div>' +
    '<div class="goal-btn-wrap"><button class="btn secondary" id="btn-save-goal">Zapisz cel</button></div></div>';

  if (wSeries.length >= 2) {
    const cur = num(last.weight);
    if (goal > 0) {
      const pct = Math.max(0, Math.min(100, Math.round(((first.weight - cur) / (first.weight - goal)) * 100)));
      html += '<div class="goal-progress"><div class="gp-labels"><span>Start ' + fmtNum(num(first.weight)) + ' kg</span><span>Cel ' + fmtNum(goal) + ' kg</span></div>' +
        '<div class="progress-track"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="gp-cur">Obecnie ' + fmtNum(cur) + ' kg (' + pct + '% do celu)</div></div>';
    }
    const recent = wSeries.filter(h => dateDiffDays(h.date, todayStr()) <= 60);
    if (recent.length >= 2) {
      const pts = recent.map((h, i) => ({ x: dateDiffDays(recent[0].date, h.date), y: num(h.weight) }));
      const t = linearTrend(pts);
      if (t && Math.abs(t.b) > 0.001) {
        const in4w = Math.round((t.a + t.b * (pts[pts.length - 1].x + 28)) * 10) / 10;
        const trendTxt = t.b < 0 ? 'spadkowa' : 'wzrostowa';
        html += '<div class="goal-trend"><b>Trend: ' + trendTxt + '</b> (~' + fmtNum(Math.abs(Math.round(t.b * 1000) / 10)) + ' kg/tydzień).' +
          ' Prognoza za 4 tygodnie: <b>' + fmtNum(in4w) + ' kg</b>.';
        if (goal > 0) {
          const towardGoal = (t.b < 0 && cur > goal) || (t.b > 0 && cur < goal);
          const diff = Math.abs(cur - goal);
          if (towardGoal && Math.abs(t.b) > 0.005) {
            const weeks = Math.round(diff / Math.abs(t.b) / 7);
            html += ' Przy obecnym tempie cel osiągniesz za około <b>' + weeks + ' tygodni</b>.';
          } else if (Math.abs(t.b) > 0.005) {
            html += ' Obecny trend oddala Cię od celu — przemyśl plan.';
          }
        }
        html += '</div>';
      }
    }
    html += '<div class="gp-note">Prognoza liczona z pomiarów z ostatnich 60 dni.</div>';
  } else {
    html += '<div class="chart-empty">Dodaj przynajmniej 2 pomiary wagi, aby zobaczyć trend i prognozę.</div>';
  }
  html += '</div>';
  box.innerHTML = html;
}

function saveGoalWeight() {
  const v = document.getElementById('goal-weight').value.trim();
  data.goal = data.goal || {};
  data.goal.weight = v;
  save();
  toast(v ? 'Zapisano cel' : 'Usunięto cel');
  renderWeightGoal();
}

/* ==================== ZDJĘCIA SYLWETKI ==================== */

function renderPhotos() {
  const box = document.getElementById('photo-box');
  if (!box) return;
  const list = data.photos.slice().sort((a, b) => a.date < b.date ? 1 : -1);
  let html = '<div class="card"><h3>Zdjęcia sylwetki</h3>';
  html += '<p class="field-hint">Zrób zdjęcie w stałej pozie i świetle. Zdjęcia są kompresowane i zapisywane lokalnie na urządzeniu.</p>';
  html += '<div class="photo-upload"><input type="file" id="photo-file" accept="image/*">' +
    '<button class="btn primary" id="btn-photo-add">+ Dodaj zdjęcie</button></div>';
  if (!list.length) {
    html += '<div class="chart-empty">Brak zdjęć. Dodaj pierwsze, aby porównywać sylwetkę w czasie.</div>';
  } else {
    html += '<div class="photo-grid">' + list.map(p =>
      '<div class="photo-tile"><button class="photo-img" data-photo="' + p.id + '" style="background-image:url(' + p.url + ')"></button>' +
      '<div class="photo-meta"><span>' + fmtLongDate(p.date) + '</span>' +
      '<button class="mini-btn" data-del-photo="' + p.id + '">Usuń</button></div></div>').join('') + '</div>';
    html += '<p class="field-hint">Przybliżony rozmiar zdjęć: ' + Math.round(list.reduce((s, p) => s + p.url.length, 0) / 1024) + ' KB.</p>';
  }
  html += '</div>';
  box.innerHTML = html;
}

function compressImage(file, cb) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const maxW = 900;
      const scale = Math.min(1, maxW / img.width);
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      let q = 0.85, url = '';
      do {
        url = canvas.toDataURL('image/jpeg', q);
        q -= 0.08;
      } while (url.length > 210000 && q >= 0.25);
      cb(url);
    };
    img.onerror = () => cb(null);
    img.src = reader.result;
  };
  reader.onerror = () => cb(null);
  reader.readAsDataURL(file);
}

function addPhoto(file) {
  compressImage(file, url => {
    if (!url) { toast('Nie udało się wczytać zdjęcia'); return; }
    data.photos.push({ id: uid(), date: todayStr(), url: url });
    save();
    toast('Dodano zdjęcie');
    renderPhotos();
  });
}

function deletePhoto(id) {
  if (!confirm('Usunąć to zdjęcie?')) return;
  data.photos = data.photos.filter(p => p.id !== id);
  save();
  toast('Usunięto');
  renderPhotos();
}

function openPhoto(id) {
  const p = data.photos.find(x => x.id === id);
  if (!p) return;
  document.getElementById('photo-full').src = p.url;
  document.getElementById('photo-full-date').textContent = fmtLongDate(p.date);
  openModal('modal-photo');
}

/* ==================== ZAWODY ==================== */

const RACE_STATUSES = [
  { id: 'zapowiedz', label: 'Zapowiedź' },
  { id: 'zapisy', label: 'Zapisy otwarte' },
  { id: 'zapisany', label: 'Zapisany' },
  { id: 'ukonczony', label: 'Ukończone' }
];

function racesSorted() {
  return data.races.slice().sort((a, b) => a.date < b.date ? -1 : 1);
}

function renderRaces() {
  const wrap = document.getElementById('races-form');
  if (!wrap) return;
  const editing = state.editRaceId ? data.races.find(r => r.id === state.editRaceId) : null;
  const today = todayStr();

  let html = '<div class="card"><h3>' + (editing ? 'Edytuj zawody' : 'Dodaj zawody') + '</h3>';
  if (editing) html += '<div class="race-editing">Edycja: ' + esc(editing.name) + ' <button class="mini-btn" id="race-cancel-edit">Anuluj</button></div>';
  html += '<div><label class="field-label">Nazwa zawodów</label><input id="race-name" type="text" placeholder="np. Półmaraton Poznań" value="' + esc(editing ? editing.name : '') + '"></div>';
  html += '<div class="form-row"><div><label class="field-label">Data</label><input id="race-date" type="date" value="' + (editing ? editing.date : today) + '"></div>' +
    '<div><label class="field-label">Dystans (km)</label><input id="race-dist" type="number" step="any" inputmode="decimal" placeholder="np. 21,1" value="' + (editing && editing.dist ? editing.dist : '') + '"></div></div>';
  html += '<div class="chips race-dist-chips">' +
    [5, 10, 21.1, 42.2].map(d => '<button class="chip" data-dist="' + d + '">' + fmtNum(d) + ' km</button>').join('') +
    '</div>';
  html += '<div class="form-row"><div><label class="field-label">Miasto</label><input id="race-city" type="text" placeholder="np. Poznań" value="' + esc(editing ? editing.city || '' : '') + '"></div>' +
    '<div><label class="field-label">Status</label><select id="race-status">' +
    RACE_STATUSES.map(s => '<option value="' + s.id + '"' + ((editing ? editing.status : 'zapowiedz') === s.id ? ' selected' : '') + '>' + s.label + '</option>').join('') +
    '</select></div></div>';
  html += '<div><label class="field-label">Strona zapisów (link)</label><input id="race-url" type="url" placeholder="https://..." value="' + esc(editing ? editing.url || '' : '') + '"></div>';
  html += '<div class="form-row"><div><label class="field-label">Cel (czas)</label><input id="race-goal" type="text" inputmode="decimal" placeholder="np. 1:45:00" value="' + esc(editing ? editing.goal || '' : '') + '"></div>' +
    '<div><label class="field-label">Wynik (po starcie)</label><input id="race-result" type="text" inputmode="decimal" placeholder="np. 1:42:30" value="' + esc(editing ? editing.result || '' : '') + '"></div></div>';
  html += '<div><label class="field-label">Notatki</label><input id="race-notes" type="text" placeholder="np. pakiet startowy, strój" value="' + esc(editing ? editing.notes || '' : '') + '"></div>';
  html += '<div class="form-actions"><button class="btn primary" id="btn-save-race">' + (editing ? 'Zapisz zmiany' : 'Dodaj zawody') + '</button></div></div>';

  const sorted = racesSorted();
  html += '<div class="card"><h3>Lista startów</h3>';
  if (!sorted.length) html += '<div class="chart-empty">Brak zawodów. Dodaj pierwszy powyżej.</div>';
  else {
    html += '<div class="race-list">' + sorted.map(r => {
      const st = RACE_STATUSES.find(s => s.id === r.status) || RACE_STATUSES[0];
      const parts = [];
      if (r.city) parts.push(esc(r.city));
      if (r.dist) parts.push(fmtNum(r.dist) + ' km');
      if (r.goal) parts.push('cel ' + esc(r.goal));
      if (r.result) parts.push('wynik <b>' + esc(r.result) + '</b>');
      let body = parts.length ? '<div class="race-meta">' + parts.join(' · ') + '</div>' : '';
      if (r.notes) body += '<div class="entry-notes">' + esc(r.notes) + '</div>';
      if (r.url) body += '<div class="race-link"><a href="' + esc(r.url) + '" target="_blank" rel="noopener">Strona zapisów</a></div>';
      if (r.goal && r.result) {
        const g = timeToMin(r.goal), res = timeToMin(r.result);
        if (g > 0 && res > 0) {
          const diff = Math.round((res - g) * 60);
          const ok = res <= g;
          body += '<div class="race-goal-hit ' + (ok ? 'up' : 'down') + '">' + (ok ? 'Cel wyprzedzony o ' : 'Do celu brakowało ') + formatDur(Math.abs(diff) / 60) + '</div>';
        }
      }
      return '<div class="race-item' + (r.date < today ? ' past' : '') + '">' +
        '<div class="race-head">' +
        '<div class="race-date">' + fmtLongDate(r.date) + '</div>' +
        '<span class="race-status ' + (r.status === 'ukonczony' ? 'fin' : r.status === 'zapisany' ? 'signed' : '') + '">' + st.label + '</span>' +
        '<span class="entry-actions">' +
        '<button class="mini-btn" data-edit-race="' + r.id + '">Edytuj</button>' +
        '<button class="mini-btn" data-del-race="' + r.id + '">Usuń</button></span></div>' +
        '<div class="race-name">' + esc(r.name) + '</div>' + body + '</div>';
    }).join('') + '</div>';
  }
  html += '</div>';

  wrap.innerHTML = html;
}

function resetRaceForm() {
  state.editRaceId = null;
  renderRaces();
}

function saveRace() {
  const name = document.getElementById('race-name').value.trim();
  if (!name) { toast('Podaj nazwę zawodów'); return; }
  const race = {
    id: state.editRaceId || uid(),
    name: name,
    date: document.getElementById('race-date').value || todayStr(),
    dist: num(document.getElementById('race-dist').value),
    city: document.getElementById('race-city').value.trim(),
    url: document.getElementById('race-url').value.trim(),
    status: document.getElementById('race-status').value,
    goal: document.getElementById('race-goal').value.trim(),
    result: document.getElementById('race-result').value.trim(),
    notes: document.getElementById('race-notes').value.trim()
  };
  if (state.editRaceId) {
    const idx = data.races.findIndex(r => r.id === state.editRaceId);
    if (idx >= 0) data.races[idx] = race;
    toast('Zapisano zawody');
  } else {
    data.races.push(race);
    toast('Dodano zawody');
  }
  state.editRaceId = null;
  save();
  renderRaces();
  if (state.tab === 'kalendarz') renderCalendar();
}

function deleteRace(id) {
  if (!confirm('Usunąć te zawody?')) return;
  data.races = data.races.filter(r => r.id !== id);
  save();
  toast('Usunięto');
  renderRaces();
  if (state.tab === 'kalendarz') renderCalendar();
}

/* ==================== USTAWIENIA / BACKUP ==================== */

function exportData() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const pname = activeProfile().name.replace(/\s+/g, '_').replace(/[^A-Za-z0-9_.-]/g, '');
  a.href = url;
  a.download = 'betternm-' + (pname || 'backup') + '-' + todayStr() + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  toast('Kopia profilu pobrana');
}

function copyText(text, ok, fail) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(ok).catch(fail);
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); ok(); } catch (e) { fail(); }
    ta.remove();
  }
}

function copyData() {
  copyText(JSON.stringify(data), () => toast('Dane skopiowane do schowka'), () => toast('Nie udało się skopiować'));
}

/* ==================== UWAGI I POPRAWKI ==================== */

function getFeedback() {
  try {
    const arr = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || 'null');
    if (Array.isArray(arr)) return arr;
  } catch (e) {}
  return [];
}
function saveFeedback(arr) {
  try { localStorage.setItem(FEEDBACK_KEY, JSON.stringify(arr)); } catch (e) {}
}
function renderFeedback() {
  const el = document.getElementById('feedback-list');
  if (!el) return;
  const arr = getFeedback();
  el.innerHTML = arr.length
    ? arr.map((t, i) => '<div class="fb-item"><span>' + esc(t) + '</span><button class="mini-btn" data-fb-del="' + i + '">Usuń</button></div>').join('')
    : '<p class="field-hint">Brak uwag — dodaj pierwszą powyżej.</p>';
}
function addFeedback() {
  const inp = document.getElementById('feedback-input');
  const t = inp.value.trim();
  if (!t) { toast('Wpisz treść uwagi'); return; }
  const arr = getFeedback();
  arr.push(t);
  saveFeedback(arr);
  inp.value = '';
  renderFeedback();
  toast('Uwaga dodana');
}
function delFeedback(i) {
  const arr = getFeedback();
  arr.splice(i, 1);
  saveFeedback(arr);
  renderFeedback();
}
function copyFeedback() {
  const arr = getFeedback();
  if (!arr.length) { toast('Brak uwag do skopiowania'); return; }
  copyText(arr.map((t, i) => (i + 1) + '. ' + t).join('\n'), () => toast('Uwagi skopiowane do schowka'), () => toast('Nie udało się skopiować'));
}
function sendFeedback() {
  const arr = getFeedback();
  if (!arr.length) { toast('Dodaj najpierw uwagę'); return; }
  const profile = activeProfile();
  const who = profile && profile.name ? profile.name : 'bez profilu';
  const body = arr.map((t, i) => (i + 1) + '. ' + t).join('\n') +
    '\n\n— wysłano z BetterNM ' + APP_VERSION + ' (profil: ' + who + ')';
  toast('Wysyłam do autora…');
  fetch(FEEDBACK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Uwagi od: ' + who,
      body: body
    })
  })
    .then(res => {
      if (res.ok) toast('Wysłano do autora — dzięki!');
      else toast('Nie udało się wysłać (błąd ' + res.status + ')');
    })
    .catch(() => toast('Błąd sieci — spróbuj później'));
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const d = JSON.parse(reader.result);
      if (!d || !Array.isArray(d.plans) || !Array.isArray(d.logs)) throw new Error('bad');
      data = normalizeData(d);
      save();
      state.dayDate = null;
      showTab('kalendarz');
      closeModal('modal-settings');
      toast('Dane przywrócone');
    } catch (e) {
      toast('Nieprawidłowy plik kopii');
    }
  };
  reader.readAsText(file);
}

/* ==================== IMPORT ZE STRAVY ==================== */

function stravaTypeToApp(type) {
  const t = String(type || '').toLowerCase();
  if (t.indexOf('ride') !== -1) return 'bike';
  if (t.indexOf('walk') !== -1 || t.indexOf('hike') !== -1 || t.indexOf('run') !== -1) return 'run';
  return null;
}

function parseStravaCSV(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (field !== '' || row.length) { row.push(field); rows.push(row); }
      field = ''; row = [];
      if (ch === '\r' && text[i + 1] === '\n') i++;
    } else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const header = rows[0].map(h => String(h).trim().toLowerCase());
  const get = (r, keys) => {
    for (let i = 0; i < keys.length; i++) {
      const j = header.indexOf(keys[i]);
      if (j >= 0 && r[j] !== undefined && r[j] !== '') return r[j];
    }
    return '';
  };
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const kind = stravaTypeToApp(get(r, ['activity type', 'type']));
    if (!kind) continue;
    const dateRaw = get(r, ['activity date', 'date']);
    const t = new Date(dateRaw);
    if (isNaN(t.getTime())) continue;
    const distM = num(get(r, ['distance']));
    const sec = num(get(r, ['moving time', 'duration', 'elapsed time']));
    if (!distM && !sec) continue;
    out.push({
      kind: kind,
      date: dateStr(t.getFullYear(), t.getMonth(), t.getDate()),
      distance: distM > 0 ? distM / 1000 : 0,
      duration: sec > 0 ? Math.round((sec / 60) * 10) / 10 : 0,
      hr: num(get(r, ['average heartrate', 'heartrate'])) || 0,
      kcal: num(get(r, ['calories'])) || 0,
      name: get(r, ['activity name', 'name']),
      notes: get(r, ['notes'])
    });
  }
  return out;
}

function haversineKm(a, b) {
  const R = 6371;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const s = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(s));
}

function parseGPX(text) {
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const pts = Array.from(doc.querySelectorAll('trkpt'));
  if (pts.length < 2) return null;
  const coords = [], times = [];
  pts.forEach(p => {
    const lat = parseFloat(p.getAttribute('lat'));
    const lon = parseFloat(p.getAttribute('lon'));
    if (!isNaN(lat) && !isNaN(lon)) coords.push([lat, lon]);
    const tm = p.querySelector('time');
    if (tm && tm.textContent) times.push(new Date(tm.textContent.trim()));
  });
  if (coords.length < 2) return null;
  let km = 0;
  for (let i = 1; i < coords.length; i++) km += haversineKm(coords[i - 1], coords[i]);
  let dur = 0;
  if (times.length >= 2 && !isNaN(times[0].getTime()) && !isNaN(times[times.length - 1].getTime())) {
    dur = (times[times.length - 1].getTime() - times[0].getTime()) / 1000;
  }
  const nm = doc.querySelector('trk name, metadata name');
  return {
    kind: 'run',
    date: dateStr(times[0].getFullYear(), times[0].getMonth(), times[0].getDate()),
    distance: Math.round(km * 1000) / 1000,
    duration: Math.round((dur / 60) * 10) / 10,
    hr: 0,
    kcal: 0,
    name: nm ? String(nm.textContent).trim() : '',
    notes: ''
  };
}

function parseTCX(text) {
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const tps = Array.from(doc.querySelectorAll('Trackpoint'));
  if (!tps.length) return null;
  const times = [];
  let distM = 0;
  tps.forEach(tp => {
    const tm = tp.querySelector('Time');
    if (tm && tm.textContent) times.push(new Date(tm.textContent.trim()));
    const dm = tp.querySelector('DistanceMeters');
    if (dm && dm.textContent) distM = parseFloat(dm.textContent);
  });
  if (!times.length) return null;
  const first = times[0], last = times[times.length - 1];
  const dur = last && !isNaN(last.getTime()) && first && !isNaN(first.getTime())
    ? (last.getTime() - first.getTime()) / 1000 : 0;
  return {
    kind: 'run',
    date: dateStr(first.getFullYear(), first.getMonth(), first.getDate()),
    distance: Math.round(distM) / 1000,
    duration: Math.round((dur / 60) * 10) / 10,
    hr: 0,
    kcal: 0,
    name: '',
    notes: ''
  };
}

function importStravaFiles(files) {
  const readers = files.map(file => new Promise(res => {
    const r = new FileReader();
    r.onload = () => res({ file: file, text: String(r.result || '') });
    r.onerror = () => res({ file: file, text: '' });
    r.readAsText(file);
  }));
  Promise.all(readers).then(results => {
    const entries = [];
    results.forEach(x => {
      const fn = String(x.file.name || '').toLowerCase();
      if (!x.text) return;
      if (fn.indexOf('.csv') !== -1) entries.push.apply(entries, parseStravaCSV(x.text));
      else if (fn.indexOf('.gpx') !== -1) { const g = parseGPX(x.text); if (g) entries.push(g); }
      else if (fn.indexOf('.tcx') !== -1) { const t = parseTCX(x.text); if (t) entries.push(t); }
    });
    if (!entries.length) { toast('Nie rozpoznano treningów w wybranych plikach'); return; }
    let addedRuns = 0, addedBikes = 0, skipped = 0;
    const batchRuns = [], batchBikes = [];
    entries.forEach(en => {
      if (!en.date) return;
      const dist = en.distance || 0;
      const dup = data.runs.some(r => r.date === en.date && Math.abs(num(r.distance) - dist) < 0.01) ||
        data.bikes.some(b => b.date === en.date && Math.abs(num(b.distance) - dist) < 0.01) ||
        (en.kind === 'bike' ? batchBikes : batchRuns).some(x => x.date === en.date && Math.abs(num(x.distance) - dist) < 0.01);
      if (dup) { skipped++; return; }
      const name = en.name || (en.kind === 'bike' ? 'Rower (Strava)' : 'Bieg (Strava)');
      if (en.kind === 'bike') {
        const speed = dist > 0 && en.duration > 0 ? Math.round((dist / (en.duration / 60)) * 10) / 10 : 0;
        data.bikes.push({ id: uid(), date: en.date, duration: en.duration, distance: dist, speed: speed, hr: en.hr, zone: '', name: name, kcal: en.kcal, notes: en.notes });
        batchBikes.push(en);
        addedBikes++;
      } else {
        data.runs.push({ id: uid(), date: en.date, type: 'easy-run', duration: en.duration, distance: dist, hr: en.hr, zone: '', splits: {}, name: name, kcal: en.kcal, notes: en.notes });
        batchRuns.push(en);
        addedRuns++;
      }
    });
    save();
    toast('Strava: dodano ' + addedRuns + ' biegów, ' + addedBikes + ' jazd' + (skipped ? ', pominięto ' + skipped + ' duplikatów' : ''));
  });
}

/* ==================== RAPORT PDF ==================== */

function printReport() {
  const root = document.getElementById('print-report');
  if (!root) return;
  const p = activeProfile();
  const today = todayStr();
  const last30 = dateStr(new Date(new Date().getTime() - 30 * 86400000).getFullYear(), new Date(new Date().getTime() - 30 * 86400000).getMonth(), new Date(new Date().getTime() - 30 * 86400000).getDate());
  const inR = x => x.date >= last30;
  const logs = data.logs.filter(inR);
  const runs = data.runs.filter(inR);
  let dist = 0, dur = 0, vol = 0, gymCnt = 0, runCnt = 0;
  runs.forEach(r => { dist += num(r.distance); dur += num(r.duration); runCnt++; });
  logs.forEach(l => { gymCnt++; l.exercises.forEach(ex => ex.sets.forEach(s => vol += num(s.w) * num(s.r))); });
  const prs = allExercisePRs().sort((a, b) => b.e - a.e).slice(0, 8);
  const races = racesSorted().filter(r => r.date >= today);
  const hLatest = data.health.slice().sort((a, b) => a.date > b.date ? -1 : 1)[0];
  const badgeCnt = badges().filter(x => x.ok).length;

  let html = '<div class="pr-head"><img src="logo.png" alt="BetterNM" class="pr-logo">' +
    '<div class="pr-title">Raport aktywności · ' + p.name + '</div>' +
    '<div class="pr-sub">Wygenerowano ' + fmtLongDate(today) + ' · ostatnie 30 dni</div></div>';
  html += '<table class="pr-stats"><tbody>' +
    '<tr><td>Treningi siłowe</td><td>' + gymCnt + '</td><td>Biegi</td><td>' + runCnt + '</td></tr>' +
    '<tr><td>Dystans biegania</td><td>' + (dist > 0 ? fmtNum(dist) + ' km' : '—') + '</td><td>Czas biegania</td><td>' + (dur > 0 ? formatDur(dur) : '—') + '</td></tr>' +
    '<tr><td>Objętość siłowa</td><td>' + (vol > 0 ? fmtNum(vol) + ' kg' : '—') + '</td><td>Odznaki</td><td>' + badgeCnt + ' / ' + badges().length + '</td></tr>' +
    '</tbody></table>';
  if (hLatest) html += '<p class="pr-latest">Ostatnie pomiary: ' +
    [hLatest.weight && 'waga ' + fmtNum(hLatest.weight) + ' kg', hLatest.bodyFat && 'BF ' + fmtNum(hLatest.bodyFat) + '%', hLatest.muscle && 'mięśnie ' + fmtNum(hLatest.muscle) + ' kg'].filter(Boolean).join(' · ') + ' (' + shortDate(hLatest.date) + ')</p>';
  if (prs.length) {
    html += '<h4>Top ćwiczenia (szacowany 1RM)</h4><ul class="pr-list-print">' +
      prs.map(x => '<li>' + esc(x.name) + ' — ' + fmtNum(x.w) + ' × ' + fmtNum(x.r) + ' (1RM ' + fmtNum(x.e) + ' kg)</li>').join('') + '</ul>';
  }
  if (races.length) {
    html += '<h4>Nadchodzące starty</h4><ul class="pr-list-print">' +
      races.map(r => '<li>' + fmtLongDate(r.date) + ' · ' + esc(r.name) + (r.dist ? ' · ' + fmtNum(r.dist) + ' km' : '') + (r.goal ? ' · cel ' + esc(r.goal) : '') + '</li>').join('') + '</ul>';
  }
  const recentRuns = data.runs.slice().sort((a, b) => a.date > b.date ? -1 : 1).slice(0, 5);
  if (recentRuns.length) {
    html += '<h4>Ostatnie biegi</h4><ul class="pr-list-print">' +
      recentRuns.map(r => '<li>' + shortDate(r.date) + ' · ' + (RUN_TYPES[r.type] || r.type) + ' · ' + fmtNum(r.distance) + ' km · ' + formatDur(num(r.duration)) + ' · tempo ' + (paceText(num(r.duration), num(r.distance)) || '—') + '</li>').join('') + '</ul>';
  }
  html += '<p class="pr-foot">BetterNM — aplikacja treningowa. Rób kopie zapasowe i trenuj regularnie!</p>';
  root.innerHTML = html;
  window.print();
}

/* ==================== USTAWIENIA TRENINGU ==================== */

function trainingKey() { return 'betternm_train_v1_' + activeProfile().id; }

function getTrainingPrefs() {
  try {
    const t = JSON.parse(localStorage.getItem(trainingKey()) || 'null');
    if (t && typeof t === 'object') return t;
  } catch (e) {}
  return { restAuto: false, progFill: false };
}

function saveTrainingPrefs(t) {
  try { localStorage.setItem(trainingKey(), JSON.stringify(t)); } catch (e) {}
}

function fillTrainingSettings() {
  const t = getTrainingPrefs();
  const ra = document.getElementById('rest-auto');
  if (ra) ra.checked = !!t.restAuto;
  const pf = document.getElementById('prog-fill');
  if (pf) pf.checked = !!t.progFill;
}

/* ==================== PRZYPOMNIENIA ==================== */

function remindKey() { return 'betternm_remind_v1_' + activeProfile().id; }

function getReminder() {
  try {
    const r = JSON.parse(localStorage.getItem(remindKey()) || 'null');
    if (r && typeof r === 'object') return r;
  } catch (e) {}
  return { enabled: false, time: '18:00', msg: 'Czas na trening!' };
}

function saveReminder(r) {
  try { localStorage.setItem(remindKey(), JSON.stringify(r)); } catch (e) {}
}

function fillReminderSettings() {
  const r = getReminder();
  const en = document.getElementById('remind-enable');
  const tm = document.getElementById('remind-time');
  const msg = document.getElementById('remind-msg');
  if (en) en.checked = !!r.enabled;
  if (tm) tm.value = r.time || '18:00';
  if (msg) msg.value = r.msg || 'Czas na trening!';
  const hint = document.getElementById('remind-hint');
  if (hint) hint.textContent = r.enabled ? 'Przypomnienie włączone.' : 'Włącz, aby aplikacja przypominała o treningu.';
}

function saveReminderSettings() {
  const en = document.getElementById('remind-enable').checked;
  const r = getReminder();
  r.enabled = en;
  r.time = document.getElementById('remind-time').value || '18:00';
  r.msg = document.getElementById('remind-msg').value.trim() || 'Czas na trening!';
  r._last = en ? (r._last || '') : '';
  saveReminder(r);
  if (en && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(() => {});
  }
  toast(en ? 'Przypomnienie włączone' : 'Przypomnienie wyłączone');
  fillReminderSettings();
}

function raceRemindKey() { return 'betternm_raceremind_v1_' + activeProfile().id; }

function checkRaceReminder() {
  if (!data.races || !data.races.length) return;
  const today = todayStr();
  if (localStorage.getItem(raceRemindKey()) === today) return;
  const tm = new Date();
  tm.setDate(tm.getDate() + 1);
  const tmStr = dateStr(tm.getFullYear(), tm.getMonth(), tm.getDate());
  const race = data.races.find(r => r.date === tmStr);
  if (!race) return;
  try { localStorage.setItem(raceRemindKey(), today); } catch (e) {}
  const msg = 'Zawody „' + race.name + '" już jutro!';
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification('BetterNM', { body: msg, icon: 'icons/icon-192.png' }); } catch (e) {}
  }
  toast(msg);
}

function reminderTick() {
  checkRaceReminder();
  const r = getReminder();
  if (!r.enabled) return;
  const n = new Date();
  const now = pad(n.getHours()) + ':' + pad(n.getMinutes());
  if (now !== r.time) return;
  if (r._last === todayStr()) return;
  r._last = todayStr();
  saveReminder(r);
  const msg = r.msg || 'Czas na trening!';
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification('BetterNM', { body: msg, icon: 'icons/icon-192.png' }); } catch (e) {}
  }
  toast('Przypomnienie: ' + msg);
}

setInterval(reminderTick, 20000);

setInterval(() => { if (getTheme() === 'auto') applyTheme('auto'); }, 60000);

/* ==================== EVENTY ==================== */

function bindEvents() {
  document.querySelectorAll('.nav-btn').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));

  const profileScreen = document.getElementById('profile-screen');
  if (profileScreen) {
    profileScreen.addEventListener('click', e => {
      const rn = e.target.closest('[data-rename]');
      if (rn) { startRenameProfile(rn.dataset.rename); return; }
      if (e.target.id === 'profile-rename-ok') { saveRenameProfile(); return; }
      if (e.target.id === 'profile-rename-cancel') { cancelRenameProfile(); return; }
      const item = e.target.closest('[data-profile]');
      if (item) { switchProfile(item.dataset.profile); return; }
      if (e.target.id === 'profile-add-btn') {
        document.getElementById('profile-add-wrap').classList.remove('hidden');
        e.target.classList.add('hidden');
        document.getElementById('profile-new-name').focus();
        return;
      }
      if (e.target.id === 'profile-add-cancel') {
        document.getElementById('profile-add-wrap').classList.add('hidden');
        document.getElementById('profile-add-btn').classList.remove('hidden');
        return;
      }
      if (e.target.id === 'profile-add-ok') { createProfile(); }
    });
    document.getElementById('profile-new-name').addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); createProfile(); }
    });
    const renameInput = document.getElementById('profile-rename-input');
    if (renameInput) renameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); saveRenameProfile(); }
    });
  }
  document.getElementById('btn-profile').addEventListener('click', openProfileScreen);

  document.getElementById('cal-prev').addEventListener('click', () => {
    state.calMonth--; if (state.calMonth < 0) { state.calMonth = 11; state.calYear--; }
    renderCalendar();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    state.calMonth++; if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; }
    renderCalendar();
  });
  document.getElementById('cal-today').addEventListener('click', () => {
    const n = new Date();
    state.calYear = n.getFullYear();
    state.calMonth = n.getMonth();
    state.dayDate = todayStr();
    renderCalendar();
  });

  document.getElementById('cal-grid').addEventListener('click', e => {
    const el = e.target.closest('.cal-day');
    if (el && el.dataset.d) openDay(el.dataset.d);
  });

  document.getElementById('modal-day-add-training').addEventListener('click', () => {
    state.current.date = state.dayDate || todayStr();
    state.current.mode = 'new';
    state.editLogId = null;
    state.editRunId = null;
    state.current.exercises = [];
    state.current.duration = '';
    state.current.distance = '';
    state.current.notes = '';
    closeModal('modal-day');
    showTab('trening');
  });
  document.getElementById('modal-day-add-health').addEventListener('click', () => {
    state.editHealthId = null;
    closeModal('modal-day');
    showTab('zdrowie');
    const el = document.getElementById('h-date');
    if (el) el.value = state.dayDate || todayStr();
  });

  document.getElementById('modal-day-content').addEventListener('click', e => {
    const rep = e.target.closest('[data-repeat]');
    if (rep) {
      const [kind, id] = rep.dataset.repeat.split(':');
      repeatEntry(kind, id);
      return;
    }
    const ed = e.target.closest('[data-edit]');
    const dl = e.target.closest('[data-del]');
    if (ed) {
      const [kind, id] = ed.dataset.edit.split(':');
      startEdit(kind, id);
    }
    if (dl) {
      const [kind, id] = dl.dataset.del.split(':');
      deleteEntry(kind, id);
    }
  });

  document.getElementById('plan-list').addEventListener('click', e => {
    const pf = e.target.closest('[data-plan-filter]');
    if (pf) {
      const key = pf.dataset.planFilter;
      if (key === '__all') {
        state.planFilter = [];
      } else {
        const cur = state.planFilter || [];
        state.planFilter = cur.includes(key) ? cur.filter(k => k !== key) : cur.concat(key);
      }
      renderPlans();
      return;
    }
    const s = e.target.closest('[data-startplan]');
    if (s) { startPlanWorkout(s.dataset.startplan); return; }
    const b = e.target.closest('[data-editplan]');
    if (b) openPlanEdit(b.dataset.editplan);
    const dp = e.target.closest('[data-delplan]');
    if (dp) { deletePlan(dp.dataset.delplan); return; }
    const tg = e.target.closest('[data-plan-toggle]');
    if (tg) {
      const id = tg.dataset.planToggle;
      state.planOpen[id] = !state.planOpen[id];
      renderPlans();
      return;
    }
  });

  document.getElementById('plan-add').addEventListener('click', openPlanAdd);
  document.getElementById('plan-edit-ok').addEventListener('click', savePlanFromModal);
  document.getElementById('plan-edit-delete').addEventListener('click', () => {
    const del = document.getElementById('plan-edit-delete');
    if (del.dataset.plan) deletePlan(del.dataset.plan);
  });
  document.getElementById('plan-edit-cat').addEventListener('change', syncPlanTagPicker);
  document.getElementById('plan-tags-list').addEventListener('click', e => {
    const tg = e.target.closest('[data-tag]');
    if (tg) { tg.classList.toggle('active'); return; }
  });

  const form = document.getElementById('training-form');
  form.addEventListener('click', e => {
    const cat = e.target.closest('[data-cat]');
    if (cat) {
      state.current.category = cat.dataset.cat;
      if (cat.dataset.cat === 'silownia') {
        state.current.planId = null;
        state.current.tags = [];
        state.current.exercises = [];
        state.current.duration = '';
      } else if (cat.dataset.cat === 'bieganie') {
        state.current.exercises = [];
      } else if (cat.dataset.cat === 'rower') {
        state.current.exercises = [];
      }
      state.editLogId = null;
      state.editRunId = null;
      state.editBikeId = null;
      state.current.mode = 'new';
      renderTraining();
      return;
    }
    const musclesToggle = e.target.closest('[data-muscles-toggle]');
    if (musclesToggle) { state.musclesOpen = !state.musclesOpen; renderTraining(); return; }
    const tag = e.target.closest('[data-tag]');
    if (tag) {
      const key = tag.dataset.tag;
      state.current.tags = state.current.tags.includes(key)
        ? state.current.tags.filter(k => k !== key)
        : state.current.tags.concat(key);
      renderTraining();
      return;
    }
    const act = e.target.closest('[data-act]');
    if (act) {
      const a = act.dataset.act;
      const ex = parseInt(act.dataset.ex, 10);
      if (a === 'add-set') addSet(ex);
      if (a === 'del-set') delSet(ex, parseInt(act.dataset.se, 10));
      if (a === 'del-ex') delEx(ex);
      if (a === 'toggle-done') toggleExDone(ex);
      if (a === 'clear-plan') { clearPlanFromWorkout(); renderTraining(); return; }
      return;
    }
    const exToggle = e.target.closest('[data-ex-toggle]');
    if (exToggle && !e.target.closest('[data-act]')) {
      const ex = parseInt(exToggle.dataset.exToggle, 10);
      const exObj = state.current.exercises[ex];
      if (exObj) { exObj.open = exObj.open === false; renderTraining(); }
      return;
    }
    const run = e.target.closest('[data-run]');
    if (run) {
      state.current.runType = run.dataset.run;
      state.editRunId = null;
      state.current.mode = 'new';
      renderTraining();
      return;
    }
    const rt = e.target.closest('[data-rt]');
    if (rt) {
      restTimer.total = Number(rt.dataset.rt);
      restTimer.left = 0;
      renderTraining();
      return;
    }
    if (e.target.id === 'rt-start') { startRest(restTimer.total); return; }
    if (e.target.id === 'rt-stop') { stopRest(); return; }
    const restToggle = e.target.closest('[data-rest-toggle]');
    if (restToggle) { state.restOpen = !state.restOpen; renderTraining(); return; }
    if (e.target.id === 'wt-toggle') { toggleWorkoutClock(); return; }
    if (e.target.id === 'wt-reset') { resetWorkoutClock(); renderTraining(); return; }
    if (e.target.id === 'add-ex-btn') { openAddExercise(); return; }
    if (e.target.id === 'clear-ex-btn') { clearAllExercises(); return; }
    if (e.target.id === 'add-plan-btn') { openPlanPick(); return; }
    if (e.target.id === 'btn-cancel-edit') {
      resetCurrent();
      showTab('kalendarz');
      return;
    }
    if (e.target.id === 'btn-save-training') { saveTraining(); return; }
  });

  form.addEventListener('input', e => {
    if (e.target.id === 'training-date') { state.current.date = e.target.value; return; }
    if (e.target.id === 'training-name') { state.current.name = e.target.value; return; }
    if (e.target.id === 'training-kcal') { state.current.kcal = e.target.value; return; }
    if (e.target.id === 'training-notes') { state.current.notes = e.target.value; return; }
    if (e.target.id === 'training-duration') { state.current.duration = e.target.value; return; }
    if (e.target.id === 'run-duration') { state.current.duration = e.target.value; updateRunStats(); return; }
    if (e.target.id === 'run-distance') { state.current.distance = e.target.value; updateRunStats(); return; }
    if (e.target.id === 'run-hr') { state.current.hr = e.target.value; return; }
    if (e.target.id === 'run-zone') { state.current.zone = e.target.value; return; }
    const m = e.target.id && e.target.id.match(/^run-split-(\d+)$/);
    if (m) { state.current.splits[m[1]] = e.target.value; return; }
    const k = e.target.dataset.k;
    if (k) {
      const ex = parseInt(e.target.dataset.ex, 10);
      const se = parseInt(e.target.dataset.se, 10);
      const c = state.current;
      if (c.exercises[ex] && c.exercises[ex].sets[se]) {
        c.exercises[ex].sets[se][k] = e.target.value;
      }
    }
  });

  form.addEventListener('change', e => {
    if (e.target.id === 'run-zone') { state.current.zone = e.target.value; return; }
    const k = e.target.dataset.k;
    if (k && e.target.value !== '' && getTrainingPrefs().restAuto && !restTimer.timer) {
      startRest(restTimer.total);
    }
  });

  document.getElementById('add-ex-ok').addEventListener('click', confirmAddExercise);
  document.getElementById('add-ex-select').addEventListener('change', e => {
    document.getElementById('add-ex-custom-wrap').classList.toggle('hidden', e.target.value !== '__custom');
  });

  document.getElementById('plan-pick-list').addEventListener('click', e => {
    const b = e.target.closest('[data-plan-pick]');
    if (!b) return;
    loadPlanIntoWorkout(b.dataset.planPick);
    closeModal('modal-add-plan');
    renderTraining();
    toast('Rozpiska dodana — mięśnie zaznaczone');
  });

  document.getElementById('ex-list-toggle').addEventListener('click', toggleExerciseList);
  document.getElementById('exercise-list').addEventListener('click', e => {
    const ex = e.target.closest('[data-ex-add]');
    if (ex) { addExerciseFromList(ex.dataset.exAdd, ex.dataset.exTag); return; }
  });

  const progressForm = document.getElementById('progress-form');
  progressForm.addEventListener('change', e => {
    if (e.target.id === 'prog-ex') { state.prog.ex = e.target.value; renderProgress(); }
    if (e.target.id === 'prog-run') { state.prog.run = e.target.value; renderProgress(); }
    if (e.target.id === 'prog-health') { state.prog.metric = e.target.value; renderProgress(); }
    if (e.target.id === 'pr-ex') { state.prog.prEx = e.target.value; renderPR(); }
  });
  progressForm.addEventListener('click', e => {
    const b = e.target.closest('[data-prog-mode]');
    if (b) { state.prog.mode = b.dataset.progMode; renderProgress(); return; }
    const kmBtn = e.target.closest('[data-prog-km]');
    if (kmBtn) { state.prog.km = Number(kmBtn.dataset.progKm); renderProgress(); }
  });

  const summaryBox = document.getElementById('summary-box');
  if (summaryBox) {
    summaryBox.addEventListener('change', e => {
      if (e.target.id === 'sum-year') { state.sumYear = Number(e.target.value); renderSummary(); }
      if (e.target.id === 'sum-month') { state.sumMonth = Number(e.target.value); renderSummary(); }
    });
  }

  document.getElementById('health-form').addEventListener('click', e => {
    if (e.target.id === 'btn-save-health') { saveHealth(); return; }
    if (e.target.id === 'btn-cancel-health') { state.editHealthId = null; renderHealth(); return; }
    if (e.target.id === 'btn-save-goal') { saveGoalWeight(); return; }
    const ed = e.target.closest('[data-edit]');
    const dl = e.target.closest('[data-del]');
    if (ed) {
      const [kind, id] = ed.dataset.edit.split(':');
      if (kind === 'health') { state.editHealthId = id; renderHealth(); }
    }
    if (dl) {
      const [kind, id] = dl.dataset.del.split(':');
      if (kind === 'health') {
        delete state.healthOpen[id];
        deleteEntry('health', id);
      }
    }
    const ho = e.target.closest('[data-health-open]');
    if (ho) {
      const id = ho.dataset.healthOpen;
      state.healthOpen[id] = !state.healthOpen[id];
      renderHealth();
    }
  });

  const photoBox = document.getElementById('photo-box');
  if (photoBox) {
    photoBox.addEventListener('click', e => {
      if (e.target.id === 'btn-photo-add') {
        const pf = document.getElementById('photo-file');
        if (pf) pf.click();
        return;
      }
      const ph = e.target.closest('[data-photo]');
      if (ph) { openPhoto(ph.dataset.photo); return; }
      const dph = e.target.closest('[data-del-photo]');
      if (dph) { deletePhoto(dph.dataset.delPhoto); return; }
    });
    photoBox.addEventListener('change', e => {
      if (e.target.id === 'photo-file') {
        const f = e.target.files && e.target.files[0];
        if (f) addPhoto(f);
        e.target.value = '';
      }
    });
  }

  const racesForm = document.getElementById('races-form');
  if (racesForm) {
    racesForm.addEventListener('click', e => {
      if (e.target.id === 'btn-save-race') { saveRace(); return; }
      if (e.target.id === 'race-cancel-edit') { resetRaceForm(); return; }
      const ds = e.target.closest('[data-dist]');
      if (ds) { document.getElementById('race-dist').value = ds.dataset.dist; return; }
      const ed = e.target.closest('[data-edit-race]');
      if (ed) { state.editRaceId = ed.dataset.editRace; renderRaces(); return; }
      const dl = e.target.closest('[data-del-race]');
      if (dl) deleteRace(dl.dataset.delRace);
    });
  }

  document.getElementById('btn-settings').addEventListener('click', () => {
    fillReminderSettings();
    fillTrainingSettings();
    renderFeedback();
    renderChangelog();
    openModal('modal-settings');
    const isNew = seenVersion() !== APP_VERSION;
    if (isNew) {
      markSeenVersion();
      refreshUpdateDot();
      const item = document.getElementById('set-nowosci');
      if (item) {
        item.classList.add('open');
        const head = item.querySelector('.set-head');
        if (head) head.setAttribute('aria-expanded', 'true');
      }
    }
  });
  document.getElementById('btn-feedback').addEventListener('click', () => {
    fillReminderSettings();
    fillTrainingSettings();
    renderFeedback();
    renderChangelog();
    openModal('modal-settings');
    const item = document.getElementById('set-feedback');
    if (item) {
      item.classList.add('open');
      const head = item.querySelector('.set-head');
      if (head) head.setAttribute('aria-expanded', 'true');
    }
    const inp = document.getElementById('feedback-input');
    if (inp) setTimeout(() => inp.focus(), 150);
  });
  document.getElementById('modal-settings').addEventListener('click', e => {
    const head = e.target.closest('.set-head');
    if (!head) return;
    const item = head.parentElement;
    const open = item.classList.toggle('open');
    head.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.getElementById('feedback-add').addEventListener('click', addFeedback);
  document.getElementById('feedback-copy').addEventListener('click', copyFeedback);
  document.getElementById('feedback-send').addEventListener('click', sendFeedback);
  document.getElementById('feedback-list').addEventListener('click', e => {
    const b = e.target.closest('[data-fb-del]');
    if (b) delFeedback(Number(b.dataset.fbDel));
  });
  document.getElementById('settings-switch-profile').addEventListener('click', () => {
    closeModal('modal-settings');
    openProfileScreen();
  });
  document.getElementById('settings-pin').addEventListener('click', openPinModal);
  document.getElementById('pin-save').addEventListener('click', savePin);
  document.getElementById('pin-remove').addEventListener('click', removePin);
  document.querySelectorAll('.pin-key').forEach(k => k.addEventListener('click', () => pinPress(k.dataset.pin)));
  document.getElementById('lock-cancel').addEventListener('click', () => {
    closeLockScreen();
    openProfileScreen();
  });
  document.getElementById('pin-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') savePin();
  });
document.getElementById('theme-auto').addEventListener('click', () => applyTheme('auto'));
document.getElementById('theme-dark').addEventListener('click', () => applyTheme('dark'));
document.getElementById('theme-light').addEventListener('click', () => applyTheme('light'));
document.getElementById('rest-auto').addEventListener('change', e => {
  const t = getTrainingPrefs();
  t.restAuto = e.target.checked;
  saveTrainingPrefs(t);
  toast(e.target.checked ? 'Auto-stoper odpoczynku włączony' : 'Auto-stoper odpoczynku wyłączony');
});
document.getElementById('prog-fill').addEventListener('change', e => {
  const t = getTrainingPrefs();
  t.progFill = e.target.checked;
  saveTrainingPrefs(t);
  toast(e.target.checked ? 'Auto-ciężary z rozpiski włączone' : 'Auto-ciężary z rozpiski wyłączone');
});
document.getElementById('accent-swatches').addEventListener('click', e => {
  const sw = e.target.closest('.accent-swatch');
  if (sw) applyAccent(sw.dataset.accent);
});
document.getElementById('mascot-jamnik').addEventListener('click', () => applyMascot('jamnik'));
document.getElementById('mascot-none').addEventListener('click', () => applyMascot('none'));
  document.getElementById('settings-export').addEventListener('click', exportData);
  document.getElementById('settings-copy').addEventListener('click', copyData);
  document.getElementById('settings-report').addEventListener('click', () => { closeModal('modal-settings'); printReport(); });
  document.getElementById('remind-save').addEventListener('click', saveReminderSettings);
  document.getElementById('settings-import').addEventListener('click', () => document.getElementById('settings-file').click());
  document.getElementById('settings-file').addEventListener('change', e => {
    if (e.target.files[0]) importData(e.target.files[0]);
    e.target.value = '';
  });
  document.getElementById('settings-strava-import').addEventListener('click', () => document.getElementById('strava-file').click());
  document.getElementById('strava-file').addEventListener('change', e => {
    if (e.target.files.length) importStravaFiles(Array.from(e.target.files));
    e.target.value = '';
  });
  document.getElementById('settings-reset').addEventListener('click', () => {
    if (confirm('Na pewno wyczyścić WSZYSTKIE dane? Tej operacji nie można cofnąć.')) {
      data = defaultData();
      save();
      state.dayDate = null;
      showTab('kalendarz');
      closeModal('modal-settings');
      toast('Dane wyczyszczone');
    }
  });
}

/* ==================== START ==================== */

let deferredPrompt = null;

function seenVersion() { return localStorage.getItem(SEEN_KEY) || ''; }
function markSeenVersion() { try { localStorage.setItem(SEEN_KEY, APP_VERSION); } catch (e) {} }

function refreshUpdateDot() {
  const b = document.getElementById('btn-settings');
  if (b) b.classList.toggle('has-update', seenVersion() !== APP_VERSION);
}

function renderChangelog() {
  const el = document.getElementById('changelog-list');
  if (!el) return;
  el.innerHTML = '<div class="changelog-ver">' + esc(APP_VERSION) + '</div>' +
    RELEASE_NOTES.changes.map(c => '<div class="changelog-item"><span class="changelog-bullet">•</span>' + esc(c) + '</div>').join('');
}

function updateApp() {
  toast('Aktualizuję aplikację…');
  let done = false;
  const reload = () => { if (!done) { done = true; location.reload(); } };
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', reload);
    navigator.serviceWorker.getRegistration().then(reg => { if (reg) reg.update(); });
    setTimeout(reload, 1500);
  } else {
    setTimeout(reload, 400);
  }
}

function setupInstall() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.getElementById('install-btn');
    if (btn) btn.classList.remove('hidden');
  });
  document.getElementById('install-btn').addEventListener('click', () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
  });
  document.getElementById('settings-update').addEventListener('click', updateApp);
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    const btn = document.getElementById('install-btn');
    if (btn) btn.classList.add('hidden');
    const hint = document.getElementById('install-hint');
    if (hint) hint.textContent = 'BetterNM jest zainstalowany — znajdziesz go na ekranie głównym.';
  });
}

function init() {
  applyTheme(getTheme());
  applyMascot(getMascot());
  renderAccentSwatches();
  renderFeedback();
  const verEl = document.getElementById('settings-version');
  if (verEl) verEl.textContent = 'BetterNM • wersja ' + APP_VERSION + ' • Autor: sepes';
  const pvEl = document.getElementById('profile-version');
  if (pvEl) pvEl.textContent = 'BetterNM • wersja ' + APP_VERSION + ' • Autor: sepes';
  const n = new Date();
  state.calYear = n.getFullYear();
  state.calMonth = n.getMonth();
  bindEvents();
  setupInstall();
  updateProfileBadge();
  updatePinButton();
  renderChangelog();
  refreshUpdateDot();
  fillReminderSettings();
  renderPlans();
  renderHealth();
  showTab('kalendarz');
  openProfileScreen();
  if ('serviceWorker' in navigator && (location.protocol === 'http:' || location.protocol === 'https:')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

/* ==================== BLOKADA PIN ==================== */

function profileHasPin(p) {
  return !!p && /^\d{4}$/.test(String(p.pin || ''));
}

function setProfilePin(pin) {
  const profiles = getProfiles();
  const p = profiles.find(x => x.id === activeProfile().id);
  if (!p) return;
  p.pin = String(pin || '');
  saveProfiles(profiles);
  renderProfileScreen();
  updatePinButton();
}

function openLockScreen() {
  const p = activeProfile();
  const nameEl = document.getElementById('lock-profile-name');
  if (nameEl) nameEl.textContent = p.name;
  state.pinEntry = '';
  renderPinDots();
  const err = document.getElementById('lock-err');
  if (err) err.classList.add('hidden');
  const lock = document.getElementById('lock-screen');
  if (lock) lock.classList.remove('hidden');
  closeModal('modal-settings');
  closeProfileScreen();
}

function closeLockScreen() {
  const lock = document.getElementById('lock-screen');
  if (lock) lock.classList.add('hidden');
}

function renderPinDots() {
  const dots = document.querySelectorAll('#pin-dots .pin-dot');
  const filled = Math.min(state.pinEntry.length, 4);
  dots.forEach((d, i) => d.classList.toggle('filled', i < filled));
}

function pinPress(key) {
  if (key === 'back') {
    state.pinEntry = state.pinEntry.slice(0, -1);
    renderPinDots();
    return;
  }
  if (!/^\d$/.test(key) || state.pinEntry.length >= 4) return;
  state.pinEntry += key;
  renderPinDots();
  if (state.pinEntry.length === 4) setTimeout(checkPin, 180);
}

function checkPin() {
  if (state.pinEntry === activeProfile().pin) {
    closeLockScreen();
    return;
  }
  const err = document.getElementById('lock-err');
  if (err) err.classList.remove('hidden');
  state.pinEntry = '';
  renderPinDots();
  const lock = document.getElementById('lock-screen');
  if (lock) {
    lock.classList.remove('shake');
    void lock.offsetWidth;
    lock.classList.add('shake');
  }
}

function updatePinButton() {
  const btn = document.getElementById('settings-pin');
  if (btn) {
    const has = profileHasPin(activeProfile());
    btn.textContent = has ? 'Zmień PIN' : 'Ustaw PIN';
    const removeBtn = document.getElementById('pin-remove');
    if (removeBtn) removeBtn.classList.toggle('hidden', !has);
    const title = document.getElementById('pin-modal-title');
    if (title) title.textContent = has ? 'Zmień PIN' : 'Ustaw PIN';
  }
}

function openPinModal() {
  document.getElementById('pin-input').value = '';
  document.getElementById('pin-confirm').value = '';
  const err = document.getElementById('pin-err');
  if (err) err.classList.add('hidden');
  updatePinButton();
  openModal('modal-pin');
  setTimeout(() => document.getElementById('pin-input').focus(), 80);
}

function savePin() {
  const a = document.getElementById('pin-input').value.trim();
  const b = document.getElementById('pin-confirm').value.trim();
  const err = document.getElementById('pin-err');
  if (!/^\d{4}$/.test(a)) {
    err.textContent = 'PIN musi mieć dokładnie 4 cyfry.';
    err.classList.remove('hidden');
    return;
  }
  if (a !== b) {
    err.textContent = 'PIN-y nie są takie same.';
    err.classList.remove('hidden');
    return;
  }
  setProfilePin(a);
  closeModal('modal-pin');
  toast('PIN ustawiony dla profilu ' + activeProfile().name);
}

function removePin() {
  setProfilePin('');
  closeModal('modal-pin');
  toast('PIN usunięty');
}

window.addEventListener('resize', () => {
  if (state.tab === 'postep') renderProgress();
});

document.addEventListener('DOMContentLoaded', init);
