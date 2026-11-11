'use strict';

// ---------- Utilidades ----------

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// Segundos -> "m:ss"
function fmtTime(s) {
  s = Math.max(0, Math.round(s));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

// Número com no máximo uma casa decimal e vírgula: 12.5 -> "12,5"
function fmtG(n) {
  return String(Math.round(n * 10) / 10).replace('.', ',');
}

// Texto digitado -> número (aceita vírgula)
function num(v, fallback) {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : (fallback === undefined ? 0 : fallback);
}

const byId = (list, id) => list.find((x) => x.id === id) || null;

// Cria elementos: h('div', { class: 'x', onclick: fn }, filhos...)
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  const add = (k) => {
    if (k == null || k === false || k === true || k === '') return;
    if (Array.isArray(k)) k.forEach(add);
    else el.appendChild(k instanceof Node ? k : document.createTextNode(String(k)));
  };
  add(kids);
  const a = attrs || {};
  for (const k in a) {
    const v = a[k];
    if (v == null || v === false) continue;
    if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'value') el.value = v;
    else if (k === 'checked' || k === 'disabled') el[k] = true;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  return el;
}

// ---------- Domínio ----------

const METHOD_KINDS = {
  v60: 'V60',
  kalita: 'Kalita Wave',
  melitta: 'Melitta',
  clever: 'Clever',
  chemex: 'Chemex',
  pano: 'Coador de pano',
  aeropress: 'AeroPress',
  prensa: 'Prensa francesa',
  outro: 'Outro',
};

const STEP_KINDS = {
  bloom: 'Pré-infusão',
  despejo: 'Despejo',
  espera: 'Espera',
  mexer: 'Mexer',
  girar: 'Girar o dripper',
  acao: 'Ação',
};

const PATTERNS = {
  '': 'Livre',
  centro: 'No centro',
  espiral: 'Em espiral',
  circulos: 'Em círculos',
  bordas: 'Pelas bordas',
};

const hasWater = (kind) => kind === 'bloom' || kind === 'despejo';

function newStep(kind, durationS, waterG, pattern, note) {
  return {
    id: uid(),
    kind: kind,
    durationS: durationS,
    waterG: hasWater(kind) ? (waterG || 0) : 0,
    pattern: hasWater(kind) ? (pattern || '') : '',
    note: note || '',
  };
}

// Calcula a linha do tempo de uma receita para uma dose de café.
// A água de cada passo escala junto com a dose.
function buildTimeline(recipe, coffeeG) {
  const scale = recipe.coffeeG > 0 && coffeeG > 0 ? coffeeG / recipe.coffeeG : 1;
  let t = 0;
  let w = 0;
  const steps = (recipe.steps || []).map((s) => {
    const dur = Math.max(0, Number(s.durationS) || 0);
    const addG = hasWater(s.kind) ? Math.round((Number(s.waterG) || 0) * scale) : 0;
    const o = Object.assign({}, s, {
      durationS: dur,
      start: t,
      end: t + dur,
      addG: addG,
      fromG: w,
      toG: w + addG,
    });
    t = o.end;
    w = o.toG;
    return o;
  });
  return { steps: steps, totalS: t, totalG: w };
}

// Índice do passo ativo no instante t (ou steps.length se já acabou)
function stepIndexAt(tl, t) {
  for (let i = 0; i < tl.steps.length; i++) {
    if (t < tl.steps[i].end) return i;
  }
  return tl.steps.length;
}

function fmtRatio(coffeeG, waterG) {
  return coffeeG > 0 && waterG > 0 ? '1:' + fmtG(waterG / coffeeG) : '—';
}

// ---------- Estado e armazenamento ----------

const STORAGE_KEY = 'coado:v1';

// Biblioteca de métodos e receitas que acompanha o app. Os ids são estáveis:
// cada item é oferecido uma única vez (state.libSeen), então o que o usuário
// editar ou apagar não volta, e itens novos chegam em versões futuras.
function buildLibrary() {
  const r = (id, name, methodId, coffeeG, tempC, grind, notes, steps) =>
    ({ id: id, name: name, methodId: methodId, beanId: '', coffeeG: coffeeG, tempC: tempC, grind: grind, notes: notes, steps: steps });
  return {
    methods: [
      { id: 'lib-m-v60', name: 'V60', kind: 'v60', filter: 'Papel', notes: '' },
      { id: 'lib-m-melitta', name: 'Melitta 102', kind: 'melitta', filter: 'Papel', notes: '' },
      { id: 'lib-m-aeropress', name: 'AeroPress', kind: 'aeropress', filter: 'Papel', notes: '' },
      { id: 'lib-m-clever', name: 'Clever', kind: 'clever', filter: 'Papel', notes: '' },
      { id: 'lib-m-prensa', name: 'Prensa francesa', kind: 'prensa', filter: 'Metal', notes: '' },
    ],
    recipes: [
      r('lib-r-v60-classico', 'V60 clássico', 'lib-m-v60', 15, 93, 'Média-fina', 'Pré-infusão e dois despejos. Bom ponto de partida.', [
        newStep('bloom', 10, 45, 'espiral', 'Molhe todo o pó'),
        newStep('espera', 35, 0, '', 'Deixe o café florescer'),
        newStep('despejo', 20, 105, 'espiral'),
        newStep('espera', 25),
        newStep('despejo', 20, 100, 'circulos'),
        newStep('girar', 5, 0, '', 'Um giro leve para nivelar o leito'),
        newStep('espera', 60, 0, '', 'Aguarde drenar'),
      ]),
      r('lib-r-v60-um-despejo', 'V60 de um despejo', 'lib-m-v60', 15, 94, 'Média-fina', 'Pré-infusão e um único despejo contínuo.', [
        newStep('bloom', 10, 45, 'espiral', 'Molhe todo o pó'),
        newStep('girar', 5, 0, '', 'Gire até não sobrar pó seco'),
        newStep('espera', 30),
        newStep('despejo', 60, 205, 'circulos', 'Fluxo constante, sem parar'),
        newStep('girar', 5, 0, '', 'Um giro leve para nivelar o leito'),
        newStep('espera', 70, 0, '', 'Aguarde drenar'),
      ]),
      r('lib-r-kasuya-46', 'Tetsu Kasuya — método 4:6', 'lib-m-v60', 20, 92, 'Grossa',
        'Método de Tetsu Kasuya. Os dois primeiros despejos (40% da água) regulam acidez e doçura; os três últimos (60%) regulam a força.', [
        newStep('despejo', 10, 60, 'espiral', 'Primeiro despejo menor = mais doce; maior = mais ácido'),
        newStep('espera', 35),
        newStep('despejo', 10, 60, 'circulos'),
        newStep('espera', 35),
        newStep('despejo', 10, 60, 'circulos'),
        newStep('espera', 35),
        newStep('despejo', 10, 60, 'circulos'),
        newStep('espera', 35),
        newStep('despejo', 10, 60, 'circulos'),
        newStep('espera', 30, 0, '', 'Aguarde drenar'),
      ]),
      r('lib-r-hoffmann-v60', 'James Hoffmann — V60 definitivo', 'lib-m-v60', 30, 97, 'Média-fina',
        'Técnica de James Hoffmann para 500 g. Água recém-fervida para torras claras; mais fria para torras escuras.', [
        newStep('bloom', 10, 60, 'espiral'),
        newStep('girar', 5, 0, '', 'Gire até não sobrar pó seco'),
        newStep('espera', 30),
        newStep('despejo', 30, 240, 'circulos', 'Chegue a 60% da água até 1:15'),
        newStep('despejo', 30, 200, 'circulos', 'Fluxo um pouco mais lento'),
        newStep('mexer', 10, 0, '', 'Uma volta para cada lado com a colher, soltando o pó das paredes'),
        newStep('espera', 15),
        newStep('girar', 5, 0, '', 'Um giro leve para nivelar o leito'),
        newStep('espera', 75, 0, '', 'Aguarde drenar'),
      ]),
      r('lib-r-hoffmann-v60-1', 'James Hoffmann — V60 de 1 xícara', 'lib-m-v60', 15, 97, 'Média-fina',
        'Técnica de James Hoffmann para uma xícara: cinco despejos de 50 g.', [
        newStep('bloom', 10, 50, 'espiral'),
        newStep('girar', 5, 0, '', 'Gire até não sobrar pó seco'),
        newStep('espera', 30),
        newStep('despejo', 15, 50, 'circulos'),
        newStep('espera', 10),
        newStep('despejo', 10, 50, 'circulos'),
        newStep('espera', 10),
        newStep('despejo', 10, 50, 'circulos'),
        newStep('espera', 10),
        newStep('despejo', 10, 50, 'circulos'),
        newStep('girar', 5, 0, '', 'Um giro leve para nivelar o leito'),
        newStep('espera', 55, 0, '', 'Aguarde drenar'),
      ]),
      r('lib-r-melitta', 'Melitta do dia a dia', 'lib-m-melitta', 20, 94, 'Média', '', [
        newStep('bloom', 10, 40, 'espiral'),
        newStep('espera', 30),
        newStep('despejo', 30, 130, 'centro'),
        newStep('espera', 20),
        newStep('despejo', 30, 130, 'circulos'),
        newStep('espera', 60, 0, '', 'Aguarde drenar'),
      ]),
      r('lib-r-hoffmann-aeropress', 'James Hoffmann — AeroPress', 'lib-m-aeropress', 11, 99, 'Fina para média',
        'Técnica de James Hoffmann, na posição normal (não invertida). Para torras médias e escuras, use água mais fria.', [
        newStep('despejo', 15, 200, '', 'Molhe todo o café'),
        newStep('acao', 5, 0, '', 'Encaixe o êmbolo cerca de 1 cm'),
        newStep('espera', 100),
        newStep('girar', 5, 0, '', 'Segure o corpo e o êmbolo e gire suavemente'),
        newStep('espera', 30),
        newStep('acao', 30, 0, '', 'Pressione devagar até o fim'),
      ]),
      r('lib-r-aeropress-invertida', 'AeroPress invertida', 'lib-m-aeropress', 15, 90, 'Média-fina', 'Imersão completa com a AeroPress de cabeça para baixo.', [
        newStep('despejo', 15, 220, '', 'Molhe todo o café'),
        newStep('mexer', 10),
        newStep('espera', 65),
        newStep('acao', 10, 0, '', 'Rosqueie a tampa e vire sobre a xícara'),
        newStep('acao', 30, 0, '', 'Pressione devagar até o fim'),
      ]),
      r('lib-r-clever', 'Clever — imersão', 'lib-m-clever', 20, 94, 'Média', 'Imersão com filtro de papel: infusiona fechada e drena ao apoiar na xícara.', [
        newStep('despejo', 20, 300, '', 'Molhe todo o café'),
        newStep('mexer', 5),
        newStep('espera', 95),
        newStep('acao', 5, 0, '', 'Apoie a Clever na xícara'),
        newStep('espera', 60, 0, '', 'Aguarde drenar'),
      ]),
      r('lib-r-hoffmann-prensa', 'James Hoffmann — prensa francesa', 'lib-m-prensa', 30, 96, 'Média',
        'Técnica de James Hoffmann: paciência no lugar de força. O tempo extra deixa a borra decantar.', [
        newStep('despejo', 20, 500, '', 'Molhe todo o café'),
        newStep('espera', 220),
        newStep('mexer', 10, 0, '', 'Quebre a crosta da superfície'),
        newStep('acao', 20, 0, '', 'Retire a espuma com colheres'),
        newStep('espera', 300, 0, '', 'Deixe decantar'),
        newStep('acao', 10, 0, '', 'Desça o êmbolo só até a superfície'),
      ]),
    ],
  };
}

// Acrescenta ao estado os itens da biblioteca ainda não oferecidos.
// Devolve true se algo mudou.
function mergeLibrary(s) {
  const lib = buildLibrary();
  const seen = new Set(s.libSeen || []);
  const methodMap = {};
  let changed = false;
  lib.methods.forEach((m) => {
    // Reaproveita um método que o usuário já tenha do mesmo tipo
    const existing = s.methods.find((x) => x.id === m.id) || s.methods.find((x) => x.kind === m.kind);
    if (existing) {
      methodMap[m.id] = existing.id;
    } else if (!seen.has(m.id)) {
      s.methods.push(m);
      methodMap[m.id] = m.id;
    }
    if (!seen.has(m.id)) { seen.add(m.id); changed = true; }
  });
  lib.recipes.forEach((r) => {
    if (seen.has(r.id)) return;
    seen.add(r.id);
    changed = true;
    if (s.recipes.some((x) => x.name === r.name)) return;
    r.methodId = methodMap[r.methodId] || '';
    s.recipes.push(r);
  });
  s.libSeen = Array.from(seen);
  return changed;
}

function seedState() {
  const s = { beans: [], methods: [], recipes: [], logs: [], settings: { sound: true }, libSeen: [] };
  mergeLibrary(s);
  return s;
}

// Os dados vêm do armazenamento local ou de um arquivo de backup, então não são
// confiáveis: aqui cada registro é reduzido a textos e números com os tipos esperados.
const NUM_KEYS = ['stockG', 'coffeeG', 'tempC', 'durationS', 'waterG', 'totalS', 'rating'];
const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

function cleanRecord(o) {
  const out = {};
  Object.keys(o).forEach((k) => {
    if (k === '__proto__' || k === 'steps') return;
    const v = o[k];
    if (NUM_KEYS.indexOf(k) >= 0) {
      out[k] = v === '' || v == null ? '' : Math.max(0, Number(v) || 0);
    } else if (typeof v === 'string' || typeof v === 'boolean') {
      out[k] = v;
    } else {
      out[k] = typeof v === 'number' && Number.isFinite(v) ? String(v) : '';
    }
  });
  return out;
}

function normalizeState(s) {
  const list = (x) => (Array.isArray(x) ? x : []).filter((o) => o && typeof o === 'object' && !Array.isArray(o)).map(cleanRecord);
  const raw = (x) => (Array.isArray(x) ? x : []).filter((o) => o && typeof o === 'object' && !Array.isArray(o));
  return {
    beans: list(s.beans),
    methods: list(s.methods).map((m) => {
      if (!hasOwn(METHOD_KINDS, m.kind)) m.kind = 'outro';
      return m;
    }),
    recipes: raw(s.recipes).map((r) => Object.assign(cleanRecord(r), {
      steps: list(r.steps).map((st) => {
        if (!hasOwn(STEP_KINDS, st.kind)) st.kind = 'espera';
        if (!hasOwn(PATTERNS, st.pattern)) st.pattern = '';
        return st;
      }),
    })),
    logs: list(s.logs),
    settings: { sound: !(s.settings && s.settings.sound === false) },
    libSeen: (Array.isArray(s.libSeen) ? s.libSeen : []).filter((x) => typeof x === 'string'),
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = normalizeState(JSON.parse(raw));
      if (mergeLibrary(s)) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      return s;
    }
  } catch (e) { /* dados ilegíveis: começa do zero */ }
  return seedState();
}

let state = loadState();

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    alert('Não foi possível salvar os dados neste aparelho.');
  }
}

// ---------- Som ----------

let audioCtx = null;

// Precisa ser chamado dentro de um toque do usuário (exigência do iOS)
function ensureAudio() {
  if (!state.settings.sound) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!audioCtx && Ctx) audioCtx = new Ctx();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) { /* sem áudio */ }
}

function beep(freq, dur) {
  if (!state.settings.sound || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const t = audioCtx.currentTime;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  } catch (e) { /* sem áudio */ }
}
