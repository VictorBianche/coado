'use strict';

// ---------- Navegação ----------

let navStack = [{ name: 'tabs' }];
let currentTab = 'recipes';
let leaveHook = null; // limpeza da tela atual (timers etc.)

function go(route) {
  navStack.push(route);
  render();
}

function back() {
  if (navStack.length > 1) navStack.pop();
  render();
}

function render(keepScroll) {
  if (leaveHook) {
    const hook = leaveHook;
    leaveHook = null;
    hook();
  }
  const route = navStack[navStack.length - 1];
  const y = window.scrollY;
  document.getElementById('app').replaceChildren(SCREENS[route.name](route));
  window.scrollTo(0, keepScroll === true ? y : 0);
}

// ---------- Componentes ----------

const svgIcon = (inner) => '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" ' +
  'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';

const ICON = {
  back: svgIcon('<path d="M15 5l-7 7 7 7"/>'),
  close: svgIcon('<path d="M6 6l12 12M18 6L6 18"/>'),
  plus: svgIcon('<path d="M12 5v14M5 12h14"/>'),
  up: svgIcon('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  down: svgIcon('<path d="M12 5v14M6 13l6 6 6-6"/>'),
  play: svgIcon('<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>'),
  pause: svgIcon('<path d="M8.5 5.5v13M15.5 5.5v13" stroke-width="3"/>'),
  next: svgIcon('<path d="M6 5.5v13l9.5-6.5z" fill="currentColor"/><path d="M18.5 5.5v13"/>'),
  prev: svgIcon('<path d="M18 5.5v13L8.5 12z" fill="currentColor"/><path d="M5.5 5.5v13"/>'),
  drop: svgIcon('<path d="M12 3.5c3.2 4.2 5.5 7 5.5 10a5.5 5.5 0 0 1-11 0c0-3 2.3-5.8 5.5-10z"/>'),
  clock: svgIcon('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  star: svgIcon('<path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="currentColor"/>'),
};

// o.hero substitui a barra de título (usado na tela inicial)
function page(o) {
  return h('div', { class: 'page' + (o.cls ? ' ' + o.cls : '') },
    o.hero || h('header', { class: 'topbar' + (o.onBack ? '' : ' topbar-root') },
      o.onBack ? h('button', { class: 'icon-btn', 'aria-label': 'Voltar', onclick: o.onBack, html: ICON.back }) : '',
      h('h1', null, o.title),
      o.action || (o.onBack ? h('span', { class: 'topbar-spacer' }) : '')),
    h('main', { class: 'content' }, o.body),
    o.footer);
}

const emptyMsg = (text) => h('p', { class: 'empty' }, text);

function field(label, control, hint) {
  return h('label', { class: 'field' },
    h('span', { class: 'field-label' }, label),
    control,
    hint ? h('small', { class: 'muted' }, hint) : '');
}

function select(options, value, attrs) {
  return h('select', Object.assign({}, attrs, { value: value == null ? '' : value }),
    options.map((o) => h('option', { value: o[0] }, o[1])));
}

// Campo de texto ligado a uma propriedade de um objeto de rascunho
function textInput(obj, key, attrs) {
  return h('input', Object.assign({
    type: 'text',
    value: obj[key] == null ? '' : obj[key],
    oninput: (e) => { obj[key] = e.target.value; },
  }, attrs));
}

// Campo numérico (aceita vírgula) ligado a um rascunho
function numInput(obj, key, onChange, attrs) {
  return h('input', Object.assign({
    type: 'text',
    inputmode: 'decimal',
    value: obj[key] == null || obj[key] === '' ? '' : fmtG(obj[key]),
    oninput: (e) => {
      obj[key] = Math.max(0, num(e.target.value, 0));
      if (onChange) onChange();
    },
  }, attrs));
}

const addButton = (onclick) => h('button', { class: 'icon-btn filled', 'aria-label': 'Adicionar', onclick: onclick, html: ICON.plus });

const methodKind = (id) => {
  const m = byId(state.methods, id);
  return m ? m.kind : '';
};
const methodLabel = (id) => {
  const m = byId(state.methods, id);
  return m ? m.name : 'Sem método';
};

const beanOptions = () => [['', 'Nenhum']].concat(
  state.beans.map((b) => [b.id, b.name + ' (' + fmtG(b.stockG) + ' g)']));

function daysSince(dateStr) {
  const t = new Date(dateStr + 'T00:00:00').getTime();
  return Number.isFinite(t) ? Math.floor((Date.now() - t) / 86400000) : null;
}

// ---------- Abas ----------

const TABS = [
  ['recipes', 'Receitas', svgIcon('<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5v2.5M12 3.5v2.5"/>')],
  ['beans', 'Grãos', svgIcon('<ellipse cx="12" cy="12" rx="6" ry="8.5" transform="rotate(30 12 12)"/><path d="M15.5 5c-5 3.5 1.5 9-7 14"/>')],
  ['methods', 'Métodos', svgIcon('<path d="M4 6h16l-5 9H9z"/><path d="M9 15v2.5h6V15M12 17.5V21"/>')],
  ['history', 'Histórico', svgIcon('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>')],
  ['settings', 'Ajustes', svgIcon('<path d="M4 7h16M4 12h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="currentColor"/><circle cx="15" cy="12" r="2" fill="currentColor"/><circle cx="10" cy="17" r="2" fill="currentColor"/>')],
];

const TAB_VIEWS = {
  recipes: () => ({
    hero: h('header', { class: 'home-hero' },
      h('div', { class: 'kicker' }, 'The Coffee Lab'),
      h('h1', null, 'O que vamos coar hoje?')),
    body: [
      sectionHead('Grãos disponíveis', 'Ver todos', () => { currentTab = 'beans'; render(); }),
      h('div', { class: 'strip' },
        state.beans.length
          ? state.beans.map((b) => h('button', { class: 'chip-card', onclick: () => go({ name: 'beanEdit', id: b.id }) },
            h('span', { class: 'chip-title' }, b.name),
            h('span', { class: 'chip-value' + (b.stockG < 30 ? ' low' : '') }, fmtG(b.stockG) + ' g')))
          : h('button', { class: 'chip-card dashed', onclick: () => go({ name: 'beanEdit' }) },
            h('span', { class: 'chip-title' }, 'Cadastrar grão'),
            h('span', { class: 'muted' }, 'Acompanhe seu estoque'))),
      sectionHead('Métodos', 'Ver todos', () => { currentTab = 'methods'; render(); }),
      h('div', { class: 'strip' },
        state.methods.map((m) => h('button', { class: 'pill', onclick: () => go({ name: 'methodEdit', id: m.id }) }, m.name)),
        h('button', { class: 'pill dashed', onclick: () => go({ name: 'methodEdit' }) }, '+ Método')),
      h('div', { class: 'section-head' },
        h('h2', { class: 'section-title' }, 'Receitas'),
        addButton(() => go({ name: 'recipeEdit' }))),
      state.recipes.length
        ? state.recipes.map((r) => {
          const tl = buildTimeline(r, r.coffeeG);
          return h('button', { class: 'card card-btn recipe-card', onclick: () => go({ name: 'recipe', id: r.id }) },
            h('span', { class: 'thumb', html: miniBrewer(methodKind(r.methodId)) }),
            h('span', { class: 'grow' },
              h('span', { class: 'kicker' }, methodLabel(r.methodId)),
              h('span', { class: 'card-title serif' }, r.name),
              h('span', { class: 'card-meta' }, fmtG(r.coffeeG) + ' g · ' + tl.totalG + ' g · ' +
                fmtRatio(r.coffeeG, tl.totalG) + ' · ' + fmtTime(tl.totalS))),
            h('span', { class: 'chev', html: ICON.back }));
        })
        : emptyMsg('Nenhuma receita ainda. Toque em + para criar a primeira.'),
    ],
  }),

  beans: () => ({
    title: 'Grãos',
    action: addButton(() => go({ name: 'beanEdit' })),
    body: state.beans.length
      ? state.beans.map((b) => {
        const days = b.roastDate ? daysSince(b.roastDate) : null;
        const sub = [b.roaster, days != null && days >= 0 ? 'torrado há ' + days + (days === 1 ? ' dia' : ' dias') : '']
          .filter(Boolean).join(' · ');
        return h('button', { class: 'card card-btn row', onclick: () => go({ name: 'beanEdit', id: b.id }) },
          h('div', { class: 'grow' },
            h('div', { class: 'card-title' }, b.name),
            sub ? h('div', { class: 'muted' }, sub) : '',
            b.notes ? h('div', { class: 'card-meta' }, b.notes) : ''),
          h('span', { class: 'badge' + (b.stockG < 30 ? ' low' : '') }, fmtG(b.stockG) + ' g'));
      })
      : emptyMsg('Cadastre os grãos que você tem em casa para acompanhar o estoque.'),
  }),

  methods: () => ({
    title: 'Métodos',
    action: addButton(() => go({ name: 'methodEdit' })),
    body: state.methods.length
      ? state.methods.map((m) => {
        const used = state.recipes.filter((r) => r.methodId === m.id).length;
        return h('button', { class: 'card card-btn method-card', onclick: () => go({ name: 'methodEdit', id: m.id }) },
          h('span', { class: 'thumb', html: miniBrewer(m.kind) }),
          h('span', { class: 'grow' },
            h('span', { class: 'card-title' }, m.name),
            h('span', { class: 'muted' }, [METHOD_KINDS[m.kind] || '', m.filter ? 'filtro de ' + m.filter.toLowerCase() : '']
              .filter(Boolean).join(' · ')),
            h('span', { class: 'card-meta' }, used === 1 ? '1 receita' : used + ' receitas')),
          h('span', { class: 'chev', html: ICON.back }));
      })
      : emptyMsg('Cadastre os métodos de preparo que você tem disponíveis.'),
  }),

  history: () => ({
    title: 'Histórico',
    body: state.logs.length
      ? state.logs.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).map((l) =>
        h('div', { class: 'card' },
          h('div', { class: 'row' },
            h('div', { class: 'grow' },
              h('div', { class: 'card-title' }, l.recipeName),
              h('div', { class: 'muted' }, new Date(l.date).toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
              }))),
            h('button', {
              class: 'mini-btn', 'aria-label': 'Apagar registro',
              onclick: () => {
                if (!confirm('Apagar este registro do histórico?')) return;
                state.logs = state.logs.filter((x) => x.id !== l.id);
                save();
                render(true);
              },
              html: ICON.close,
            })),
          h('div', { class: 'card-meta' }, (l.beanName ? l.beanName + ' · ' : '') + fmtG(l.coffeeG) + ' g café · ' +
            l.waterG + ' g água · ' + fmtTime(l.totalS)),
          l.rating ? h('div', { class: 'rating' }, [1, 2, 3, 4, 5].map((n) => h('span', { class: n <= l.rating ? 'on' : '', html: ICON.star }))) : '',
          l.notes ? h('p', { class: 'note' }, l.notes) : ''))
      : emptyMsg('Os cafés que você preparar com o guia aparecem aqui.'),
  }),

  settings: () => ({
    title: 'Ajustes',
    body: [
      h('div', { class: 'card' },
        h('label', { class: 'check' },
          h('input', {
            type: 'checkbox', checked: state.settings.sound,
            onchange: (e) => { state.settings.sound = e.target.checked; save(); },
          }),
          h('span', null, 'Avisos sonoros na troca de etapa')),
        h('small', { class: 'muted' }, 'No iPhone, o som não toca com o modo silencioso ativado.')),
      h('div', { class: 'card' },
        h('div', { class: 'card-title' }, 'Backup'),
        h('p', { class: 'muted' }, 'Os dados ficam só neste aparelho. Exporte um backup de vez em quando — ' +
          'se o app for removido da tela de início, os dados são apagados.'),
        h('div', { class: 'btn-col' },
          h('button', { class: 'btn', onclick: exportBackup }, 'Exportar backup'),
          h('button', { class: 'btn', onclick: importBackup }, 'Importar backup'))),
      h('div', { class: 'card' },
        h('div', { class: 'card-title' }, 'Instalar no iPhone'),
        h('p', { class: 'muted' }, 'Abra este endereço no Safari, toque em Compartilhar e escolha ' +
          '“Adicionar à Tela de Início”. Depois disso o app funciona sem internet.')),
    ],
  }),
};

function sectionHead(title, linkLabel, onLink) {
  return h('div', { class: 'section-head' },
    h('h2', { class: 'section-title' }, title),
    h('button', { class: 'link-btn', onclick: onLink }, linkLabel));
}

function tabsScreen() {
  const v = TAB_VIEWS[currentTab]();
  return page({
    cls: 'has-tabbar',
    hero: v.hero,
    title: v.title,
    action: v.action,
    body: v.body,
    footer: h('nav', { class: 'tabbar' }, TABS.map((t) =>
      h('button', {
        class: 'tab' + (t[0] === currentTab ? ' active' : ''),
        onclick: () => { currentTab = t[0]; render(); },
      }, h('span', { class: 'tab-icon', html: t[2] }), h('span', null, t[1])))),
  });
}

// ---------- Backup ----------

async function exportBackup() {
  const name = 'coado-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  try {
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file] });
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return; // usuário cancelou
  }
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function importBackup() {
  const input = h('input', { type: 'file', accept: 'application/json,.json' });
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let data = null;
      try { data = JSON.parse(String(reader.result)); } catch (e) { data = null; }
      if (!data || !Array.isArray(data.recipes) || !Array.isArray(data.beans) || !Array.isArray(data.methods)) {
        alert('Este arquivo não é um backup válido do The Coffee Lab.');
        return;
      }
      if (!confirm('Substituir todos os dados atuais pelo backup?')) return;
      state = normalizeState(data);
      save();
      render();
    };
    reader.readAsText(file);
  });
  input.click();
}

// ---------- Receita: detalhe ----------

function stepRow(s, i) {
  const water = hasWater(s.kind);
  const detail = water
    ? s.addG + ' g de água · até ' + s.toG + ' g · ' + PATTERNS[s.pattern].toLowerCase()
    : s.durationS + ' s';
  return h('div', { class: 'step-row' },
    h('div', { class: 'step-num' + (water ? ' water' : '') }, String(i + 1)),
    h('div', { class: 'grow' },
      h('div', { class: 'step-name' }, STEP_KINDS[s.kind] || s.kind),
      h('div', { class: 'muted' }, detail),
      s.note ? h('div', { class: 'note' }, s.note) : ''),
    h('div', { class: 'step-time' }, fmtTime(s.start) + ' – ' + fmtTime(s.end)));
}

function recipeScreen(route) {
  const r = byId(state.recipes, route.id);
  if (!r) return page({ title: 'Receita', onBack: back, body: emptyMsg('Receita não encontrada.') });

  // Dose e grão escolhidos ficam na rota para sobreviver à ida e volta do preparo
  if (!(route.dose > 0)) route.dose = r.coffeeG;
  if (route.beanId === undefined || (route.beanId && !byId(state.beans, route.beanId))) {
    route.beanId = byId(state.beans, r.beanId) ? r.beanId : '';
  }

  const stats = h('div', { class: 'stats' });
  const warn = h('div');
  const stepsBox = h('div', { class: 'card steps' });
  const stat = (label, value) => h('div', { class: 'stat' }, h('div', { class: 'stat-value' }, value), h('div', { class: 'muted' }, label));

  function refresh() {
    const tl = buildTimeline(r, route.dose);
    stats.replaceChildren(
      stat('Café', fmtG(route.dose) + ' g'),
      stat('Água', tl.totalG + ' g'),
      stat('Proporção', fmtRatio(route.dose, tl.totalG)),
      stat('Tempo', fmtTime(tl.totalS)));
    stepsBox.replaceChildren(...(tl.steps.length ? tl.steps.map(stepRow) : [emptyMsg('Esta receita ainda não tem etapas.')]));
    const bean = byId(state.beans, route.beanId);
    warn.replaceChildren(...(bean && bean.stockG < route.dose
      ? [h('p', { class: 'warn' }, 'Estoque de ' + bean.name + ': ' + fmtG(bean.stockG) + ' g — menos que a dose.')]
      : []));
  }
  refresh();

  const info2 = [r.grind ? 'Moagem ' + r.grind.toLowerCase() : '', r.tempC ? r.tempC + ' °C' : '']
    .filter(Boolean).join(' · ');

  return page({
    cls: 'has-footer',
    title: '',
    onBack: back,
    action: h('button', { class: 'text-btn', onclick: () => go({ name: 'recipeEdit', id: r.id }) }, 'Editar'),
    body: [
      h('div', { class: 'hero-card' },
        h('div', { class: 'row' },
          h('div', { class: 'grow' },
            h('div', { class: 'kicker' }, methodLabel(r.methodId)),
            h('h1', { class: 'hero-title' }, r.name),
            h('p', { class: 'hero-info' }, info2)),
          h('div', { class: 'hero-art', html: miniBrewer(methodKind(r.methodId)) })),
        stats,
        r.notes ? h('p', { class: 'note' }, r.notes) : ''),
      h('div', { class: 'card' },
        h('div', { class: 'grid2' },
          field('Dose de café (g)', h('input', {
            type: 'text', inputmode: 'decimal', value: fmtG(route.dose),
            oninput: (e) => {
              const v = num(e.target.value, 0);
              route.dose = v > 0 ? v : r.coffeeG;
              refresh();
            },
          }), 'A água acompanha a proporção.'),
          field('Grão', select(beanOptions(), route.beanId, {
            onchange: (e) => { route.beanId = e.target.value; refresh(); },
          }))),
        warn),
      h('h2', { class: 'section-title' }, 'Etapas'),
      stepsBox,
      h('button', {
        class: 'btn ghost',
        onclick: () => {
          const copy = JSON.parse(JSON.stringify(r));
          copy.id = '';
          copy.name = r.name + ' (cópia)';
          copy.steps.forEach((s) => { s.id = uid(); });
          navStack.pop();
          go({ name: 'recipeEdit', draft: copy });
        },
      }, 'Duplicar receita'),
    ],
    footer: h('footer', { class: 'action-bar' },
      h('button', {
        class: 'btn primary', disabled: !r.steps.length,
        onclick: () => go({ name: 'brew', recipeId: r.id, dose: route.dose, beanId: route.beanId }),
      }, h('span', { class: 'btn-icon', html: ICON.play }), h('span', null, 'Iniciar guia'))),
  });
}

// ---------- Receita: edição ----------

function recipeEditScreen(route) {
  if (!route.draft) {
    const src = byId(state.recipes, route.id);
    route.draft = src ? JSON.parse(JSON.stringify(src)) : {
      id: '', name: '', methodId: state.methods.length ? state.methods[0].id : '', beanId: '',
      coffeeG: 15, tempC: 93, grind: '', notes: '',
      steps: [newStep('bloom', 10, 45, 'espiral'), newStep('espera', 35), newStep('despejo', 30, 205, 'espiral'), newStep('espera', 60)],
    };
  }
  const d = route.draft;
  const isNew = !d.id;
  const rangeLabels = [];
  const totals = h('div', { class: 'totals' });

  function refreshSummary() {
    const tl = buildTimeline(d, d.coffeeG);
    tl.steps.forEach((s, i) => {
      if (rangeLabels[i]) {
        rangeLabels[i].textContent = fmtTime(s.start) + ' – ' + fmtTime(s.end) + (hasWater(s.kind) ? ' · até ' + s.toG + ' g' : '');
      }
    });
    totals.textContent = 'Total: ' + tl.totalG + ' g de água · ' + fmtRatio(d.coffeeG, tl.totalG) + ' · ' + fmtTime(tl.totalS);
  }

  function move(i, delta) {
    const j = i + delta;
    if (j < 0 || j >= d.steps.length) return;
    const tmp = d.steps[i];
    d.steps[i] = d.steps[j];
    d.steps[j] = tmp;
    render(true);
  }

  function stepCard(s, i) {
    const range = h('span', { class: 'muted step-range' });
    rangeLabels[i] = range;
    const water = hasWater(s.kind);
    return h('div', { class: 'card step-card' },
      h('div', { class: 'row' },
        h('strong', null, 'Etapa ' + (i + 1)),
        range,
        h('span', { class: 'grow' }),
        h('button', { class: 'mini-btn', 'aria-label': 'Mover para cima', disabled: i === 0, onclick: () => move(i, -1), html: ICON.up }),
        h('button', { class: 'mini-btn', 'aria-label': 'Mover para baixo', disabled: i === d.steps.length - 1, onclick: () => move(i, 1), html: ICON.down }),
        h('button', {
          class: 'mini-btn', 'aria-label': 'Remover etapa', html: ICON.close,
          onclick: () => { d.steps.splice(i, 1); render(true); },
        })),
      h('div', { class: 'grid2' },
        field('Tipo', select(Object.entries(STEP_KINDS), s.kind, {
          onchange: (e) => {
            s.kind = e.target.value;
            if (!hasWater(s.kind)) { s.waterG = 0; s.pattern = ''; }
            else if (!s.pattern) s.pattern = 'espiral';
            render(true);
          },
        })),
        field('Duração (s)', numInput(s, 'durationS', refreshSummary, { inputmode: 'numeric' })),
        water ? field('Água (g)', numInput(s, 'waterG', refreshSummary)) : '',
        water ? field('Onde despejar', select(Object.entries(PATTERNS), s.pattern, {
          onchange: (e) => { s.pattern = e.target.value; },
        })) : ''),
      field('Observação', textInput(s, 'note', { placeholder: 'Opcional' })));
  }

  function saveRecipe() {
    d.name = (d.name || '').trim();
    if (!d.name) { alert('Dê um nome à receita.'); return; }
    if (!(d.coffeeG > 0)) { alert('Informe a dose de café em gramas.'); return; }
    if (!d.steps.length) { alert('Adicione pelo menos uma etapa.'); return; }
    for (let i = 0; i < d.steps.length; i++) {
      d.steps[i].durationS = Math.round(d.steps[i].durationS);
      if (!(d.steps[i].durationS >= 1)) { alert('A etapa ' + (i + 1) + ' precisa de uma duração em segundos.'); return; }
    }
    if (isNew) {
      d.id = uid();
      state.recipes.push(d);
    } else {
      state.recipes = state.recipes.map((r) => (r.id === d.id ? d : r));
    }
    save();
    navStack.pop();
    if (isNew) navStack.push({ name: 'recipe', id: d.id });
    render();
  }

  function deleteRecipe() {
    if (!confirm('Apagar a receita “' + d.name + '”?')) return;
    state.recipes = state.recipes.filter((r) => r.id !== d.id);
    save();
    navStack.pop();
    const top = navStack[navStack.length - 1];
    if (top.name === 'recipe' && top.id === d.id) navStack.pop();
    render();
  }

  const body = [
    h('div', { class: 'card' },
      field('Nome', textInput(d, 'name', { placeholder: 'Ex.: V60 de domingo' })),
      h('div', { class: 'grid2' },
        field('Método', select([['', 'Sem método']].concat(state.methods.map((m) => [m.id, m.name])), d.methodId, {
          onchange: (e) => { d.methodId = e.target.value; },
        })),
        field('Grão padrão', select(beanOptions(), byId(state.beans, d.beanId) ? d.beanId : '', {
          onchange: (e) => { d.beanId = e.target.value; },
        })),
        field('Café (g)', numInput(d, 'coffeeG', refreshSummary)),
        field('Água (°C)', numInput(d, 'tempC', null, { inputmode: 'numeric' })),
        field('Moagem', textInput(d, 'grind', { placeholder: 'Ex.: média-fina' }))),
      field('Notas', textInput(d, 'notes', { placeholder: 'Opcional' }))),
    h('h2', { class: 'section-title' }, 'Etapas'),
    d.steps.map(stepCard),
    h('button', {
      class: 'btn',
      onclick: () => {
        const last = d.steps[d.steps.length - 1];
        // Alterna naturalmente: depois de um despejo vem uma espera, e vice-versa
        d.steps.push(last && hasWater(last.kind) ? newStep('espera', 30) : newStep('despejo', 20, 50, 'espiral'));
        render(true);
      },
    }, '+ Adicionar etapa'),
    totals,
    isNew ? '' : h('button', { class: 'btn danger', onclick: deleteRecipe }, 'Apagar receita'),
  ];
  refreshSummary();

  return page({
    cls: 'has-footer',
    title: isNew ? 'Nova receita' : 'Editar receita',
    onBack: back,
    body: body,
    footer: h('footer', { class: 'action-bar' }, h('button', { class: 'btn primary', onclick: saveRecipe }, 'Salvar')),
  });
}

// ---------- Grão: edição ----------

function beanEditScreen(route) {
  if (!route.draft) {
    const src = byId(state.beans, route.id);
    route.draft = src ? Object.assign({}, src) : { id: '', name: '', roaster: '', notes: '', roastDate: '', stockG: 250 };
  }
  const d = route.draft;
  const isNew = !d.id;

  function saveBean() {
    d.name = (d.name || '').trim();
    if (!d.name) { alert('Dê um nome ao grão.'); return; }
    if (isNew) {
      d.id = uid();
      state.beans.push(d);
    } else {
      state.beans = state.beans.map((b) => (b.id === d.id ? d : b));
    }
    save();
    back();
  }

  function deleteBean() {
    if (!confirm('Apagar “' + d.name + '”?')) return;
    state.beans = state.beans.filter((b) => b.id !== d.id);
    state.recipes.forEach((r) => { if (r.beanId === d.id) r.beanId = ''; });
    save();
    back();
  }

  return page({
    cls: 'has-footer',
    title: isNew ? 'Novo grão' : 'Editar grão',
    onBack: back,
    body: [
      h('div', { class: 'card' },
        field('Nome', textInput(d, 'name', { placeholder: 'Ex.: Catuaí Amarelo' })),
        field('Torrefação', textInput(d, 'roaster', { placeholder: 'Opcional' })),
        h('div', { class: 'grid2' },
          field('Estoque (g)', numInput(d, 'stockG')),
          field('Data da torra', textInput(d, 'roastDate', { type: 'date' }))),
        field('Origem e notas sensoriais', textInput(d, 'notes', { placeholder: 'Ex.: Sul de Minas · chocolate, caramelo' }))),
      isNew ? '' : h('button', { class: 'btn danger', onclick: deleteBean }, 'Apagar grão'),
    ],
    footer: h('footer', { class: 'action-bar' }, h('button', { class: 'btn primary', onclick: saveBean }, 'Salvar')),
  });
}

// ---------- Método: edição ----------

function methodEditScreen(route) {
  if (!route.draft) {
    const src = byId(state.methods, route.id);
    route.draft = src ? Object.assign({}, src) : { id: '', name: '', kind: 'v60', filter: 'Papel', notes: '' };
  }
  const d = route.draft;
  const isNew = !d.id;

  function saveMethod() {
    d.name = (d.name || '').trim() || METHOD_KINDS[d.kind];
    if (isNew) {
      d.id = uid();
      state.methods.push(d);
    } else {
      state.methods = state.methods.map((m) => (m.id === d.id ? d : m));
    }
    save();
    back();
  }

  function deleteMethod() {
    const used = state.recipes.filter((r) => r.methodId === d.id).length;
    const msg = 'Apagar “' + d.name + '”?' + (used ? ' As receitas que usam este método ficam sem método.' : '');
    if (!confirm(msg)) return;
    state.methods = state.methods.filter((m) => m.id !== d.id);
    state.recipes.forEach((r) => { if (r.methodId === d.id) r.methodId = ''; });
    save();
    back();
  }

  const art = h('div', { class: 'method-art', html: miniBrewer(d.kind) });

  return page({
    cls: 'has-footer',
    title: isNew ? 'Novo método' : 'Editar método',
    onBack: back,
    body: [
      art,
      h('div', { class: 'card' },
        field('Tipo', select(Object.entries(METHOD_KINDS), d.kind, {
          onchange: (e) => { d.kind = e.target.value; art.innerHTML = miniBrewer(d.kind); },
        })),
        field('Nome', textInput(d, 'name', { placeholder: 'Ex.: V60 02 de cerâmica' }), 'Em branco, usa o nome do tipo.'),
        field('Filtro', textInput(d, 'filter', { placeholder: 'Papel, pano, metal…' })),
        field('Notas', textInput(d, 'notes', { placeholder: 'Opcional' }))),
      isNew ? '' : h('button', { class: 'btn danger', onclick: deleteMethod }, 'Apagar método'),
    ],
    footer: h('footer', { class: 'action-bar' }, h('button', { class: 'btn primary', onclick: saveMethod }, 'Salvar')),
  });
}

// ---------- Inicialização ----------

const SCREENS = {
  tabs: tabsScreen,
  recipe: recipeScreen,
  recipeEdit: recipeEditScreen,
  beanEdit: beanEditScreen,
  methodEdit: methodEditScreen,
  brew: brewScreen,
};

render();

if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
