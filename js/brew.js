'use strict';

// =====================================================================
// Ilustração isométrica (estação de preparo) e vista superior do filtro
// =====================================================================

// Projeção isométrica: (x, y) no plano da bancada, z para cima
const ISO_OX = 195;
const ISO_OY = 112;
const isoP = (x, y, z) => [ISO_OX + (x - y) * 0.866, ISO_OY + (x + y) * 0.5 - (z || 0)];
const isoPts = (list) => list.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');

// Caixa isométrica com as três faces visíveis
function isoBox(x, y, z, w, d, hh, cTop, cLeft, cRight) {
  const face = (list, color) => '<polygon points="' + isoPts(list) + '" fill="' + color + '" stroke="' + color +
    '" stroke-width="2" stroke-linejoin="round"/>';
  return face([isoP(x, y + d, z + hh), isoP(x + w, y + d, z + hh), isoP(x + w, y + d, z), isoP(x, y + d, z)], cLeft) +
    face([isoP(x + w, y, z + hh), isoP(x + w, y + d, z + hh), isoP(x + w, y + d, z), isoP(x + w, y, z)], cRight) +
    face([isoP(x, y, z + hh), isoP(x + w, y, z + hh), isoP(x + w, y + d, z + hh), isoP(x, y + d, z + hh)], cTop);
}

// ---------- Arte de cada método ----------
// Todos os conjuntos ficam centrados em x = 195, apoiados na balança (y ≈ 183)
// e com a boca em y ≈ 81, de modo que a mesma chaleira serve a todos.

const CX = 195;
const EK = 0.575; // achatamento das elipses na vista isométrica
const n1 = (n) => String(Math.round(n * 10) / 10);

const ell = (cy, rx, fill, extra, ry) => '<ellipse cx="195" cy="' + n1(cy) + '" rx="' + n1(rx) + '" ry="' + n1(ry || rx * EK) +
  '" fill="' + fill + '"' + (extra || '') + '/>';

// Tronco de cone: boca em yT (raio rT), fundo em yB (raio rB)
const frustum = (yT, rT, yB, rB, fill, extra) => '<path d="M' + n1(CX - rT) + ' ' + yT + ' L' + n1(CX - rB) + ' ' + yB +
  ' A' + n1(rB) + ' ' + n1(rB * EK) + ' 0 0 0 ' + n1(CX + rB) + ' ' + yB + ' L' + n1(CX + rT) + ' ' + yT + ' Z" fill="' + fill + '"' +
  (extra || '') + '/>';

// Sombra na metade direita de um tronco de cone
const frustumShade = (yT, rT, yB, rB, op) => '<path d="M195 ' + yT + ' L' + n1(CX + rT) + ' ' + yT + ' L' + n1(CX + rB) + ' ' + yB +
  ' A' + n1(rB) + ' ' + n1(rB * EK) + ' 0 0 1 195 ' + n1(yB + rB * EK) + ' Z" fill="rgba(40,28,18,' + op + ')"/>';

const GLASS = ' fill="rgba(255,255,255,.26)" stroke="rgba(255,255,255,.8)" stroke-width="1.5"';
const shine = (d, w) => '<path d="' + d + '" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="' + (w || 3) + '" stroke-linecap="round"/>';

// Recipientes onde o café se acumula: fundo em bottom, sobe até rise, raio de rB a rT
const SERVER = { bottom: 181, rise: 40, rB: 33.6, rT: 25.9 };
const CUP = { bottom: 180, rise: 28, rB: 18, rT: 21 };
const CHEMEX = { bottom: 180, rise: 36, rB: 34, rT: 17.5 };
const PRESS = { bottom: 180, rise: 84, rB: 25, rT: 25 };

// Café dentro do recipiente para um nível de 0 a 1
function vesselFill(v, level) {
  const yB = v.bottom;
  const yT = yB - v.rise * level;
  const rb = v.rB;
  const rt = v.rB + (v.rT - v.rB) * level;
  const k = 0.58;
  const f = (n) => n.toFixed(1);
  return {
    d: 'M' + f(CX - rt) + ' ' + f(yT) + ' L' + f(CX - rb) + ' ' + f(yB) + ' A' + f(rb) + ' ' + f(rb * k) +
      ' 0 0 0 ' + f(CX + rb) + ' ' + f(yB) + ' L' + f(CX + rt) + ' ' + f(yT) + ' Z',
    cy: f(yT), rx: f(rt), ry: f(rt * k),
  };
}

// Com ids = true os elementos animados ganham id e começam vazios
function coffeeSVG(v, ids, level) {
  const c = vesselFill(v, ids ? 0 : level);
  const hide = ids ? ' opacity="0"' : '';
  return '<path' + (ids ? ' id="sc-coffee"' : '') + ' d="' + c.d + '" fill="#4A2C1C"' + hide + '/>' +
    '<ellipse' + (ids ? ' id="sc-coffee-top"' : '') + ' cx="195" cy="' + c.cy + '" rx="' + c.rx + '" ry="' + c.ry +
    '" fill="#6B4129"' + hide + '/>';
}

const dripSVG = (ids, y, dist) => (ids
  ? '<g id="sc-drip" class="drip" style="--drip:' + dist + 'px"><circle cx="195" cy="' + y + '" r="2.2"/><circle cx="195" cy="' + y + '" r="2.2"/></g>'
  : '');

// Filtro visto por dentro e leito de café
const paperSVG = (y, rx, ry, color) => ell(y, rx, color || '#E4D6BC', '', ry) +
  '<path d="M' + n1(CX - rx) + ' ' + y + ' A' + rx + ' ' + ry + ' 0 0 1 ' + n1(CX + rx) + ' ' + y + ' A' + rx + ' ' + n1(ry * 0.77) +
  ' 0 0 0 ' + n1(CX - rx) + ' ' + y + ' Z" fill="rgba(70,52,34,.16)"/>';
const bedSVG = (ids, y, rx, ry) => ell(y, rx, '#5B3B29', '', ry) +
  ell(y, rx, '#2E1C12', (ids ? ' id="sc-pool"' : '') + ' opacity="0"', ry);

// Servidor de vidro com alça
function serverSVG(ids) {
  return '<path d="M220 141 C246 141 246 173 227 173" fill="none" stroke="#2C2F2B" stroke-width="5" stroke-linecap="round"/>' +
    coffeeSVG(SERVER, ids, 0.55) + dripSVG(ids, 134, 40) +
    '<path d="M169 131 L159 183 A36 21 0 0 0 231 183 L221 131 Z"' + GLASS + '/>' +
    shine('M166.5 146 L161 178');
}

// Copo de vidro baixo
function cupSVG(ids, dripY) {
  return coffeeSVG(CUP, ids, 0.6) + dripSVG(ids, dripY, 172 - dripY) +
    '<path d="M172 146 L176 181 A19 11 0 0 0 214 181 L218 146 Z"' + GLASS + '/>' +
    shine('M176 153 L178.5 176', 2.5);
}

// Dripper cônico sobre o servidor (V60 e genérico)
function coneSVG(ids, c) {
  return serverSVG(ids) +
    ell(132.5, 32, c.baseDark, '', 18.5) + ell(129, 32, c.base, '', 18.5) +
    (c.handle ? '<path d="M236 94 C258 96 256 118 226 116" fill="none" stroke="' + c.handle + '" stroke-width="5" stroke-linecap="round"/>' : '') +
    '<path d="M149 81 L185 127 A10 6 0 0 0 205 127 L241 81 Z" fill="' + c.body + '"/>' +
    '<path d="M195 81 L241 81 L205 127 A10 6 0 0 1 195 133 Z" fill="rgba(70,52,34,.13)"/>' +
    ell(81, 46, c.rim, ' stroke="' + c.edge + '" stroke-width="1.2"', 26.5) +
    paperSVG(82, 41.5, 23.5) + bedSVG(ids, 89, 31, 17.5);
}

// Melitta: corpo em cunha, com nervuras, sobre um prato largo
function melittaSVG(ids) {
  let ribs = '';
  [-0.78, -0.5, -0.2, 0.2, 0.5, 0.78].forEach((f) => {
    const q = Math.sqrt(1 - f * f);
    ribs += '<path d="M' + n1(CX + f * 44) + ' ' + n1(80 + 25 * q) + ' L' + n1(CX + f * 19) + ' ' + n1(124 + 3 * q) + '"/>';
  });
  return serverSVG(ids) +
    ell(133, 34, '#6E3826') + ell(129.5, 34, '#A65C40') +
    '<path d="M234 90 C256 92 254 114 223 113" fill="none" stroke="#7C412C" stroke-width="5.5" stroke-linecap="round"/>' +
    '<path d="M151 80 L176 124 Q195 130 214 124 L239 80 Z" fill="#8C4A33"/>' +
    '<path d="M195 80 L239 80 L214 124 Q205 127 195 127 Z" fill="rgba(40,20,10,.2)"/>' +
    '<g fill="none" stroke="rgba(40,20,10,.22)" stroke-width="1.6" stroke-linecap="round">' + ribs + '</g>' +
    ell(80, 44, '#A65C40', ' stroke="#6E3826" stroke-width="1.2"', 25) +
    paperSVG(81, 40, 22.5) +
    '<path d="M195 59 L195 76" stroke="#CDBB98" stroke-width="1.6" stroke-linecap="round"/>' +
    bedSVG(ids, 89, 30, 13);
}

// Kalita Wave: aço, fundo chato e filtro ondulado
function kalitaSVG(ids) {
  const pts = [];
  let pleats = '';
  const N = 20;
  for (let i = 0; i < N * 2; i++) {
    const a = (i / (N * 2)) * 2 * Math.PI;
    const r = i % 2 ? 0.93 : 1.06;
    const x = CX + 41 * r * Math.cos(a);
    const y = 80 + 23.6 * r * Math.sin(a);
    pts.push(n1(x) + ',' + n1(y));
    if (i % 2) pleats += '<path d="M' + n1(x) + ' ' + n1(y) + ' L' + n1(CX + 29 * Math.cos(a)) + ' ' + n1(89 + 16.5 * Math.sin(a)) + '"/>';
  }
  return serverSVG(ids) +
    ell(132.5, 34, '#9FA39E') + ell(130, 34, '#D5D8D3') +
    '<path d="M232 90 C250 90 250 114 226 116" fill="none" stroke="#B4B8B3" stroke-width="4.5" stroke-linecap="round"/>' +
    frustum(81, 42, 123, 25, '#C9CCC8') + frustumShade(81, 42, 123, 25, 0.16) +
    shine('M160 90 L175 121', 3) +
    ell(81, 42, '#E3E6E1', ' stroke="#AEB2AD" stroke-width="1.2"') +
    '<polygon points="' + pts.join(' ') + '" fill="#F3EBDB" stroke="#D8CBB0" stroke-width="1" stroke-linejoin="round"/>' +
    '<g fill="none" stroke="#D8CBB0" stroke-width=".9">' + pleats + '</g>' +
    '<path d="M157 81 A38 22 0 0 1 233 81 A38 17 0 0 0 157 81 Z" fill="rgba(70,52,34,.12)"/>' +
    bedSVG(ids, 90, 28, 16);
}

// Clever: cone fumê de imersão, com colar largo na base
function cleverSVG(ids) {
  return serverSVG(ids) +
    ell(133, 31, '#2B2521') +
    '<path d="M164 124 L164 133 A31 17.8 0 0 0 226 133 L226 124 Z" fill="#3A322C"/>' +
    ell(124, 31, '#51463E') +
    '<path d="M236 88 C254 88 254 120 225 119" fill="none" stroke="#6B5548" stroke-width="6" stroke-linecap="round"/>' +
    frustum(79, 44, 123, 22, '#85695A') + frustumShade(79, 44, 123, 22, 0.2) +
    shine('M161 90 L178 120', 3).replace('.75', '.3') +
    ell(79, 44, '#9A7D6C', ' stroke="#6B5548" stroke-width="1.2"') +
    paperSVG(80, 40.5, 23) + bedSVG(ids, 88, 33, 18.5);
}

// Chemex: peça única de vidro com colar de madeira
function chemexSVG(ids) {
  return coffeeSVG(CHEMEX, ids, 0.6) + dripSVG(ids, 143, 30) +
    // filtro de papel visto através do vidro
    '<path d="M158 83 L186 127 Q195 131 204 127 L232 83 Z" fill="#EFE6D3"/>' +
    '<path d="M195 83 L232 83 L204 127 Q200 129 195 129 Z" fill="rgba(70,52,34,.12)"/>' +
    '<path d="M155 81 L183 128 L159 181 A36 21 0 0 0 231 181 L207 128 L235 81 Z"' + GLASS + '/>' +
    shine('M176 148 L164 176') +
    // colar de madeira e tira de couro
    '<path d="M175 114 A20 8 0 0 0 215 114 L207 128 L214 142 A19 9 0 0 1 176 142 L183 128 Z" fill="#A8754E"/>' +
    '<path d="M195 122 A20 8 0 0 0 215 114 L207 128 L214 142 A19 9 0 0 1 195 151 Z" fill="rgba(40,28,18,.2)"/>' +
    '<path d="M183 128 Q195 138 207 128" fill="none" stroke="#5E3A24" stroke-width="2.2" stroke-linecap="round"/>' +
    '<circle cx="195" cy="134.5" r="3.2" fill="#5E3A24"/>' +
    ell(81, 40, 'rgba(255,255,255,.35)', ' stroke="rgba(255,255,255,.9)" stroke-width="1.5"') +
    paperSVG(82, 36.5, 21) + bedSVG(ids, 89, 28, 16);
}

// Coador de pano no suporte, sobre um copo
function panoSVG(ids) {
  return ell(186.5, 36, '#7B5335') + ell(183, 36, '#B98A5F') +
    '<path d="M162 82 L162 183 M228 82 L228 183" stroke="#2C2F2B" stroke-width="3" stroke-linecap="round"/>' +
    cupSVG(ids, 141) +
    '<path d="M162 82 C164 112 181 133 195 138 C209 133 226 112 228 82 Z" fill="#E2D2B3"/>' +
    '<path d="M170 104 C177 121 187 133 195 138 C203 133 213 121 220 104 Q195 117 170 104 Z" fill="#B08A62" opacity=".7"/>' +
    '<path d="M195 82 L228 82 C226 112 209 133 195 138 Z" fill="rgba(70,52,34,.14)"/>' +
    '<path d="M222 94 L247 104" stroke="#A8754E" stroke-width="6.5" stroke-linecap="round"/>' +
    '<path d="M222 94 L231 97.6" stroke="#2C2F2B" stroke-width="3" stroke-linecap="round"/>' +
    paperSVG(82, 33, 19, '#D9C7A6') +
    '<ellipse cx="195" cy="82" rx="33" ry="19" fill="none" stroke="#2C2F2B" stroke-width="2.6"/>' +
    bedSVG(ids, 90, 25, 14);
}

// AeroPress sobre um copo. Na miniatura aparece com o êmbolo encaixado.
function aeropressSVG(ids) {
  let marks = '';
  [96, 107, 118, 129].forEach((y) => { marks += '<circle cx="186" cy="' + y + '" r="2.7"/>'; });
  const plunger = ids ? '' :
    '<path d="M180.5 64 L180.5 82 A14.5 8.3 0 0 0 209.5 82 L209.5 64 Z" fill="#D2D5CE"/>' +
    '<path d="M195 64 L209.5 64 L209.5 82 A14.5 8.3 0 0 1 195 90.3 Z" fill="rgba(40,28,18,.16)"/>' +
    '<path d="M177 61 L177 65 A18 10.4 0 0 0 213 65 L213 61 Z" fill="#2A2C29"/>' + ell(61, 18, '#474B45');
  return cupSVG(ids, 149) +
    '<path d="M175 139 L175 146 A20 11.5 0 0 0 215 146 L215 139 Z" fill="#232522"/>' +
    ell(141, 27, '#2A2C29') + ell(138.5, 27, '#4A4E48') +
    '<path d="M178 81 L178 137 A17 9.8 0 0 0 212 137 L212 81 Z" fill="#A9ACA5"/>' +
    '<path d="M195 81 L212 81 L212 137 A17 9.8 0 0 1 195 146.8 Z" fill="rgba(40,28,18,.2)"/>' +
    shine('M181.5 92 L181.5 134', 2).replace('.75', '.5') +
    '<g fill="none" stroke="#EEEAE0" stroke-width="1.1">' + marks + '</g>' +
    ell(81, 17, '#C3C6BF', ' stroke="#8A8D86" stroke-width="1.2"') +
    ell(82, 14.5, '#6F726C') + (ids ? bedSVG(ids, 86, 12.5, 6.5) : plunger);
}

// Prensa francesa. Na cena fica aberta, com o pó no fundo; na miniatura, com a tampa.
function prensaSVG(ids) {
  const band = (y, hh) => '<path d="M167 ' + y + ' A28 16 0 0 0 223 ' + y + ' L223 ' + (y + hh) + ' A28 16 0 0 1 167 ' + (y + hh) + ' Z" fill="#C3C6C0"/>' +
    '<path d="M195 ' + (y + 16) + ' A28 16 0 0 0 223 ' + y + ' L223 ' + (y + hh) + ' A28 16 0 0 1 195 ' + (y + hh + 16) + ' Z" fill="rgba(40,28,18,.2)"/>';
  const lid = ids
    ? '<ellipse cx="195" cy="81" rx="27" ry="15.5" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.85)" stroke-width="1.5"/>'
    : '<path d="M166 77 L166 82 A29 16.6 0 0 0 224 82 L224 77 Z" fill="#9FA39E"/>' + ell(77, 29, '#D5D8D3') +
      '<path d="M195 77 L195 64" stroke="#8A8D86" stroke-width="3" stroke-linecap="round"/><circle cx="195" cy="61" r="6" fill="#1E201D"/>';
  return '<path d="M221 102 C252 102 252 162 221 162" fill="none" stroke="#1E201D" stroke-width="6.5" stroke-linecap="round"/>' +
    // pó no fundo
    '<path d="M170 174 L170 180 A25 14.4 0 0 0 220 180 L220 174 Z" fill="#3B2416"/>' + ell(174, 25, '#4E3222') +
    coffeeSVG(PRESS, ids, 0.8) +
    '<path d="M168 81 L168 181 A27 15.5 0 0 0 222 181 L222 81 Z"' + GLASS + '/>' +
    shine('M173 100 L173 160') +
    band(86, 6) + band(166, 16) +
    '<path d="M178 104.7 L178 178.7 M212 104.7 L212 178.7" stroke="#AEB2AC" stroke-width="4"/>' +
    lid;
}

// bed: alcance da chaleira sobre a boca · vessel: onde o café se acumula
// mode: 'drip' (coa direto), 'hold' (infusiona e só drena na última ação), 'steep' (fica no próprio recipiente)
// top: cores da vista superior
const TOP_PAPER = { rim: '#FAF6EE', edge: '#DDD1BC', paper: '#E4D6BC', rib: '#D2C2A4', ribs: 12 };
const BREWERS = {
  v60: {
    bed: { y: 89, rx: 24, ry: 13.5 }, vessel: SERVER, mode: 'drip', top: TOP_PAPER,
    draw: (ids) => coneSVG(ids, { body: '#F4EDE0', rim: '#FAF6EE', edge: '#DDD1BC', base: '#EFE7D8', baseDark: '#CDBFA7', handle: '#E6DCCA' }),
  },
  kalita: {
    bed: { y: 90, rx: 21, ry: 12 }, vessel: SERVER, mode: 'drip',
    top: { rim: '#E3E6E1', edge: '#AEB2AD', paper: '#F0E7D6', rib: '#D8CBB0', ribs: 20 },
    draw: kalitaSVG,
  },
  melitta: {
    bed: { y: 89, rx: 22, ry: 9.5 }, vessel: SERVER, mode: 'drip',
    top: { rim: '#A65C40', edge: '#6E3826', paper: '#E4D6BC', rib: '#D2C2A4', ribs: 12 },
    draw: melittaSVG,
  },
  clever: {
    bed: { y: 88, rx: 25, ry: 14 }, vessel: SERVER, mode: 'hold',
    top: { rim: '#9A7D6C', edge: '#6B5548', paper: '#E4D6BC', rib: '#D2C2A4', ribs: 0 },
    draw: cleverSVG,
  },
  chemex: {
    bed: { y: 89, rx: 21, ry: 12 }, vessel: CHEMEX, mode: 'drip',
    top: { rim: '#F7F4EE', edge: '#FFFFFF', paper: '#E4D6BC', rib: '#D2C2A4', ribs: 3 },
    draw: chemexSVG,
  },
  pano: {
    bed: { y: 90, rx: 19, ry: 10.5 }, vessel: CUP, mode: 'drip',
    top: { rim: '#D9C7A6', edge: '#2C2F2B', paper: '#D9C7A6', rib: '#C6B18C', ribs: 0 },
    draw: panoSVG,
  },
  aeropress: {
    bed: { y: 86, rx: 8, ry: 4 }, vessel: CUP, mode: 'hold',
    top: { rim: '#C3C6BF', edge: '#8A8D86', paper: '#6F726C', rib: '#6F726C', ribs: 0 },
    draw: aeropressSVG,
  },
  prensa: {
    bed: { y: 180, rx: 15, ry: 8.5 }, vessel: PRESS, mode: 'steep',
    surface: (level) => PRESS.bottom - PRESS.rise * level,
    top: { rim: '#D5D8D3', edge: '#AEB2AC', paper: '#E9E6DE', rib: '#E9E6DE', ribs: 0 },
    draw: prensaSVG,
  },
  outro: {
    bed: { y: 89, rx: 24, ry: 13.5 }, vessel: SERVER, mode: 'drip',
    top: { rim: '#D9A678', edge: '#A8754E', paper: '#E4D6BC', rib: '#D2C2A4', ribs: 12 },
    draw: (ids) => coneSVG(ids, { body: '#C08A5E', rim: '#D9A678', edge: '#A8754E', base: '#C08A5E', baseDark: '#8E5F3D', handle: '' }),
  },
};

const brewerOf = (kind) => (Object.prototype.hasOwnProperty.call(BREWERS, kind) ? BREWERS[kind] : BREWERS.v60);

// Miniatura do moedor (manual ou elétrico)
function miniGrinder(kind) {
  const art = kind === 'eletrico'
    ? // funil com grãos, anel de regulagem e corpo
      '<path d="M173 74 L181 110 A14 8 0 0 0 209 110 L217 74 Z" fill="#6B4129"/>' +
      '<path d="M169 62 L181 110 A14 8 0 0 0 209 110 L221 62 Z"' + GLASS + '/>' +
      ell(62, 26, 'rgba(255,255,255,.35)', ' stroke="rgba(255,255,255,.9)" stroke-width="1.5"') +
      frustum(112, 25, 180, 29, '#3F443E') + frustumShade(112, 25, 180, 29, 0.28) +
      '<path d="M170 112 L170 119 A25 14.4 0 0 0 220 119 L220 112 Z" fill="#B8794E"/>' +
      ell(112, 25, '#555B53') + ell(111, 17, '#2A2C29') +
      '<path d="M184 150 L184 172 A11 5 0 0 0 206 172 L206 150 Z" fill="#232622"/>' +
      '<circle cx="195" cy="140" r="3" fill="#D9A64E"/>'
    : // corpo de aço, copo coletor e manivela com pomo de madeira
      '<path d="M176 140 L176 178 A19 11 0 0 0 214 178 L214 140 Z" fill="#2F322E"/>' +
      '<path d="M195 140 L214 140 L214 178 A19 11 0 0 1 195 189 Z" fill="rgba(0,0,0,.22)"/>' +
      '<path d="M176 92 L176 140 A19 11 0 0 0 214 140 L214 92 Z" fill="#C9CCC8"/>' +
      '<path d="M195 92 L214 92 L214 140 A19 11 0 0 1 195 151 Z" fill="rgba(40,28,18,.18)"/>' +
      shine('M180.5 100 L180.5 134') +
      '<path d="M176 136 A19 11 0 0 0 214 136" fill="none" stroke="#8A8D86" stroke-width="1.6"/>' +
      ell(92, 19, '#E3E6E1', ' stroke="#AEB2AD" stroke-width="1.2"') + ell(91, 5, '#8A8D86') +
      '<path d="M195 90 L234 78" stroke="#AEB2AD" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M234 78 L234 68" stroke="#8A8D86" stroke-width="3" stroke-linecap="round"/>' +
      '<ellipse cx="234" cy="63" rx="7.5" ry="8.5" fill="#A8754E"/>' +
      '<path d="M234 54.5 A7.5 8.5 0 0 1 234 71.5 Z" fill="rgba(40,28,18,.2)"/>';
  return '<svg viewBox="138 50 116 158" aria-hidden="true">' +
    '<ellipse cx="195" cy="184" rx="38" ry="13" fill="rgba(0,0,0,.14)"/>' + art + '</svg>';
}

// Miniatura do método para cards e cabeçalhos
function miniBrewer(kind) {
  return '<svg viewBox="138 50 116 158" aria-hidden="true">' +
    '<ellipse cx="195" cy="184" rx="42" ry="14" fill="rgba(0,0,0,.14)"/>' + brewerOf(kind).draw(false) + '</svg>';
}

function stationSVG(B) {
  const endY = B.surface ? B.surface(0) : B.bed.y;
  const grain = [34, 68, 102, 136].map((k) => {
    const a = isoP(0, k, 8);
    const b = isoP(170, k, 8);
    return '<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) +
      '" stroke="#5E3A24" stroke-width="1" opacity=".35"/>';
  }).join('');
  // visor na face frontal-esquerda da balança
  const disp = isoPts([isoP(66, 130, 21), isoP(112, 130, 21), isoP(112, 130, 11), isoP(66, 130, 11)]);
  const txt = isoP(70, 130, 12.5);

  return '<svg viewBox="0 0 390 300" role="img" aria-label="Estação de preparo">' +
    '<defs><filter id="sc-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter></defs>' +
    // sombra da tábua
    '<polygon points="' + isoPts([isoP(0, 0, -14), isoP(170, 0, -14), isoP(170, 170, -14), isoP(0, 170, -14)]) +
      '" fill="#4B3A28" opacity=".28" filter="url(#sc-blur)"/>' +
    // tábua de madeira
    isoBox(0, 0, 0, 170, 170, 8, '#9C6B47', '#7B4F33', '#644029') + grain +

    // pote de grãos
    '<ellipse cx="113" cy="178" rx="23" ry="12.5" fill="rgba(0,0,0,.2)"/>' +
    '<path d="M95 152 L95 176 A18 10.4 0 0 0 131 176 L131 152 Z" fill="#4A2E20"/>' +
    '<ellipse cx="113" cy="152" rx="18" ry="10.4" fill="#5E3B28"/>' +
    '<g fill="#7A4E35"><ellipse cx="106" cy="151" rx="3.2" ry="1.9"/><ellipse cx="116" cy="154" rx="3.2" ry="1.9"/>' +
      '<ellipse cx="121" cy="149" rx="3.2" ry="1.9"/><ellipse cx="111" cy="147" rx="3.2" ry="1.9"/>' +
      '<ellipse cx="102" cy="166" rx="3" ry="1.8"/><ellipse cx="113" cy="172" rx="3" ry="1.8"/><ellipse cx="124" cy="166" rx="3" ry="1.8"/></g>' +
    '<path d="M93.5 138 L93.5 176 A19.5 11.3 0 0 0 132.5 176 L132.5 138 Z" fill="rgba(255,255,255,.24)" stroke="rgba(255,255,255,.75)" stroke-width="1.3"/>' +
    '<path d="M92.5 131 L92.5 138 A20.5 11.8 0 0 0 133.5 138 L133.5 131 Z" fill="#A8754E"/>' +
    '<ellipse cx="113" cy="131" rx="20.5" ry="11.8" fill="#C59468"/>' +

    // balança
    '<polygon points="' + isoPts([isoP(58, 58, 8), isoP(134, 58, 8), isoP(134, 134, 8), isoP(58, 134, 8)]) + '" fill="rgba(0,0,0,.22)"/>' +
    isoBox(60, 60, 8, 70, 70, 16, '#3F443E', '#2D302C', '#232622') +
    '<polygon points="' + isoPts([isoP(65, 65, 24.4), isoP(125, 65, 24.4), isoP(125, 125, 24.4), isoP(65, 125, 24.4)]) + '" fill="#4A4F48"/>' +
    '<polygon points="' + disp + '" fill="#171916"/>' +
    '<text id="sc-scale" transform="matrix(0.866 0.5 0 1 ' + txt[0].toFixed(1) + ' ' + txt[1].toFixed(1) + ')" class="scale-text">0:00  0 g</text>' +

    // xícara
    '<ellipse cx="105" cy="203" rx="14" ry="7.5" fill="rgba(0,0,0,.2)"/>' +
    '<path d="M93 187 L95.5 201 A9 5.2 0 0 0 112.5 201 L115 187 Z" fill="#2F322E"/>' +
    '<ellipse cx="104" cy="187" rx="11" ry="6.4" fill="#444942"/>' +
    '<ellipse cx="104" cy="188" rx="8.6" ry="4.8" fill="#1E201D"/>' +

    // método de preparo
    B.draw(true) +

    // chaleira e fio de água (o grupo externo acompanha o ponto de despejo)
    '<g id="sc-kettle-pos">' +
      '<g id="sc-stream" class="stream"><path d="M195 36 L195 ' + (endY - 2) + '"/><ellipse cx="195" cy="' + endY + '" rx="5.5" ry="2.8"/></g>' +
      '<g id="sc-kettle" class="kettle rest">' +
        '<path d="M287 26 C316 22 322 62 295 64" fill="none" stroke="#1E201D" stroke-width="6" stroke-linecap="round"/>' +
        '<path d="M242 60 C218 60 226 30 204 30 Q196 30 195 35" fill="none" stroke="#2B2E2A" stroke-width="5.5" stroke-linecap="round"/>' +
        '<path d="M247 21 L239 66 A27 10 0 0 0 293 66 L285 21 Z" fill="#30332F"/>' +
        '<path d="M266 21 L285 21 L293 66 A27 10 0 0 1 266 76 Z" fill="rgba(0,0,0,.22)"/>' +
        '<path d="M250 27 L245 58" stroke="rgba(255,255,255,.14)" stroke-width="3" stroke-linecap="round"/>' +
        '<ellipse cx="266" cy="21" rx="19" ry="7.5" fill="#444842"/>' +
        '<ellipse cx="266" cy="19" rx="5.5" ry="2.6" fill="#1E201D"/>' +
      '</g>' +
    '</g>' +
    '</svg>';
}

// ---------- Trajetória do despejo ----------

const spiralTurns = (s) => Math.min(5, Math.max(2, Math.round(s.durationS / 4)));

// Posição do despejo sobre o leito, em coordenadas unitárias (-1..1).
// p = progresso da etapa (0..1); dt = segundos desde o início da etapa
function pourPos(s, p, dt) {
  let r = 0;
  let a = 0;
  if (s.pattern === 'espiral') {
    r = 0.85 * p;
    a = p * spiralTurns(s) * 2 * Math.PI;
  } else if (s.pattern === 'circulos') {
    r = 0.5;
    a = dt * (2 * Math.PI / 2.6);
  } else if (s.pattern === 'bordas') {
    r = 0.85;
    a = dt * (2 * Math.PI / 3.2);
  } else if (s.pattern === '') {
    r = 0.3;
    a = dt * (2 * Math.PI / 3);
  }
  a -= Math.PI / 2;
  return { u: r * Math.cos(a), v: r * Math.sin(a) };
}

const TV_C = 60; // centro da vista superior
const TV_R = 36; // raio do leito na vista superior

function spiralPath(s, pMax) {
  const n = Math.max(2, Math.round(90 * pMax));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const q = pourPos(s, (i / n) * pMax, 0);
    pts.push((TV_C + q.u * TV_R).toFixed(1) + ' ' + (TV_C + q.v * TV_R).toFixed(1));
  }
  return 'M' + pts.join(' L');
}

// Vista superior do filtro: a camada precisa de "onde despejar"
function topViewSVG(s, B) {
  const c = B.top;
  const water = s && hasWater(s.kind);
  let guide = '';
  if (water) {
    if (s.pattern === 'centro') {
      guide = '<circle cx="60" cy="60" r="13" class="tv-guide"/><path d="M60 41V50M60 70V79M41 60H50M70 60H79" class="tv-cross"/>';
    } else if (s.pattern === 'espiral') {
      const end = pourPos(s, 1, 0);
      guide = '<path d="' + spiralPath(s, 1) + '" class="tv-guide"/><path id="tv-trail" d="" class="tv-trail"/>' +
        '<circle cx="60" cy="60" r="3" class="tv-start"/>' +
        '<circle cx="' + (TV_C + end.u * TV_R).toFixed(1) + '" cy="' + (TV_C + end.v * TV_R).toFixed(1) + '" r="3" class="tv-end"/>';
    } else if (s.pattern === 'circulos') {
      guide = '<circle cx="60" cy="60" r="' + (TV_R * 0.5) + '" class="tv-guide"/>';
    } else if (s.pattern === 'bordas') {
      guide = '<circle cx="60" cy="60" r="' + (TV_R * 0.85).toFixed(1) + '" class="tv-guide"/>';
    } else {
      guide = '<circle cx="60" cy="60" r="' + (TV_R * 0.3).toFixed(1) + '" class="tv-guide"/>';
    }
    guide += '<circle id="tv-dot" cx="60" cy="60" r="5.5" class="tv-dot"/>';
  }
  let ribs = '';
  for (let i = 0; i < c.ribs; i++) {
    const a = (i / c.ribs) * 2 * Math.PI;
    ribs += '<line x1="' + (60 + 38 * Math.cos(a)).toFixed(1) + '" y1="' + (60 + 38 * Math.sin(a)).toFixed(1) +
      '" x2="' + (60 + 50 * Math.cos(a)).toFixed(1) + '" y2="' + (60 + 50 * Math.sin(a)).toFixed(1) + '"/>';
  }
  return '<svg viewBox="0 0 120 120" role="img" aria-label="Vista de cima">' +
    '<circle cx="60" cy="60" r="56" fill="' + c.rim + '" stroke="' + c.edge + '" stroke-width="1.5"/>' +
    '<circle cx="60" cy="60" r="50.5" fill="' + c.paper + '"/>' +
    '<g stroke="' + c.rib + '" stroke-width="1.2">' + ribs + '</g>' +
    '<circle cx="60" cy="60" r="' + TV_R + '" fill="' + (water ? '#5B3B29' : '#4A2F20') + '"/>' +
    guide + '</svg>';
}

const TV_LABELS = { '': 'Despejo livre', centro: 'No centro', espiral: 'Do centro para fora', circulos: 'Em círculos', bordas: 'Pelas bordas' };

function topViewLabel(s) {
  if (!s) return 'Vista superior';
  if (hasWater(s.kind)) return TV_LABELS[s.pattern] || 'Despejo';
  if (s.kind === 'mexer') return 'Mexa o leito';
  if (s.kind === 'girar') return 'Gire o dripper';
  return 'Sem despejo';
}

function stepHeadline(s) {
  if (hasWater(s.kind)) return 'Despeje até ' + s.toG + ' g';
  if (s.kind === 'mexer') return 'Mexa suavemente';
  if (s.kind === 'girar') return 'Gire o dripper';
  if (s.kind === 'acao') return s.note || 'Ação';
  return 'Aguarde até ' + fmtTime(s.end);
}

// =====================================================================
// Brew Mode
// =====================================================================

const DRAIN_LAG = 6; // segundos entre a água cair no leito e chegar ao servidor
const RING_C = 2 * Math.PI * 42;

function brewScreen(route) {
  const recipe = byId(state.recipes, route.recipeId);
  if (!recipe || !recipe.steps.length) {
    return page({ title: 'Preparo', onBack: back, body: emptyMsg('Receita sem etapas.') });
  }
  const dose = route.dose > 0 ? route.dose : recipe.coffeeG;
  const tl = buildTimeline(recipe, dose);
  const bean = byId(state.beans, route.beanId);
  const method = byId(state.methods, recipe.methodId);
  const B = brewerOf(method ? method.kind : '');
  const grinder = byId(state.grinders, route.grinderId);
  const grindSetting = grinder && route.grind > 0 ? route.grind : '';
  const grindText = grindSetting ? fmtGrind(grindSetting, grinder.unit) + ' no ' + grinder.name : '';

  // Métodos de imersão com saída fechada só drenam a partir da última ação (apoiar na xícara, pressionar)
  let releaseAt = null;
  if (B.mode === 'hold') {
    let lastWater = -1;
    let lastAction = -1;
    tl.steps.forEach((s, i) => {
      if (hasWater(s.kind)) lastWater = i;
      if (s.kind === 'acao') lastAction = i;
    });
    if (lastAction > lastWater) releaseAt = tl.steps[lastAction].start;
  }

  let base = 0;          // segundos acumulados antes da última retomada
  let startedAt = null;  // performance.now() da última retomada (null = parado)
  let timer = null;
  let idx = -1;          // etapa exibida
  let lastTick = -1;
  let started = false;
  let done = false;
  let wake = null;

  const running = () => startedAt !== null;
  const elapsed = () => base + (running() ? (performance.now() - startedAt) / 1000 : 0);

  // Água que já deveria ter sido despejada no instante t
  function pouredAt(t) {
    if (t <= 0) return 0;
    const i = stepIndexAt(tl, t);
    if (i >= tl.steps.length) return tl.totalG;
    const s = tl.steps[i];
    const p = s.durationS > 0 ? (t - s.start) / s.durationS : 1;
    return s.fromG + s.addG * p;
  }

  // Café que já chegou ao recipiente no instante t
  function brewedAt(t) {
    if (B.mode === 'steep') return pouredAt(t);
    if (releaseAt === null) return pouredAt(t - DRAIN_LAG);
    if (t <= releaseAt) return 0;
    return tl.totalG * Math.min(1, (t - releaseAt) / Math.max(1, tl.totalS - releaseAt));
  }

  // --- Cena ---
  const scene = h('div', { class: 'scene', html: stationSVG(B) });
  const q = (sel) => scene.querySelector(sel);
  const el = {
    coffee: q('#sc-coffee'), coffeeTop: q('#sc-coffee-top'), pool: q('#sc-pool'), drip: q('#sc-drip'),
    kettlePos: q('#sc-kettle-pos'), kettle: q('#sc-kettle'), stream: q('#sc-stream'), scale: q('#sc-scale'),
    streamPath: q('#sc-stream path'), streamEnd: q('#sc-stream ellipse'),
  };
  const tvSvg = h('div', { class: 'topview-svg', html: topViewSVG(null, B) });
  const tvLabel = h('div', { class: 'topview-label' }, 'Vista superior');
  const topview = h('div', { class: 'topview' }, tvSvg, tvLabel);
  let tvDot = null;
  let tvTrail = null;

  // --- Instrução ---
  const panel = h('div', { class: 'brew-panel' });

  // --- HUD (timer + quantidades) ---
  const ring = h('div', {
    class: 'ring',
    html: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" class="ring-track"/>' +
      '<circle cx="50" cy="50" r="42" class="ring-bar" transform="rotate(-90 50 50)" stroke-dasharray="' + RING_C.toFixed(1) +
      '" stroke-dashoffset="' + RING_C.toFixed(1) + '"/></svg>',
  });
  const ringBar = ring.querySelector('.ring-bar');
  const timeEl = h('div', { class: 'ring-time' }, '0:00');
  const untilEl = h('div', { class: 'ring-sub' }, '');
  ring.appendChild(h('div', { class: 'ring-center' }, timeEl, untilEl));
  const weightEl = h('span', { class: 'hud-value' }, '0 g');
  const weightOf = h('span', { class: 'hud-of' }, '');
  const stepWater = h('div', { class: 'hud-line' });
  const totalLine = h('div', { class: 'hud-line' }, 'Total ' + tl.totalG + ' g · ' + fmtTime(tl.totalS));
  const hud = h('div', { class: 'hud', hidden: true },
    ring,
    h('div', { class: 'hud-info' },
      h('div', { class: 'hud-label' }, 'Na balança'),
      h('div', { class: 'hud-weight' }, h('span', { class: 'hud-drop', html: ICON.drop }), weightEl, weightOf),
      stepWater, totalLine));

  // --- Progresso das etapas ---
  const segEls = [];
  const segFills = [];
  const segs = h('div', { class: 'segs' }, tl.steps.map((s) => {
    const fill = h('div', { class: 'seg-fill' });
    const seg = h('div', { class: 'seg', style: 'flex:' + Math.max(1, s.durationS) + ' 1 0' }, fill);
    segFills.push(fill);
    segEls.push(seg);
    return seg;
  }));
  const nextEl = h('div', { class: 'next-step' });

  // --- Controles ---
  const prevBtn = h('button', { class: 'round-btn', 'aria-label': 'Etapa anterior', disabled: true, onclick: prevStep, html: ICON.prev });
  const playIcon = h('span', { class: 'btn-icon', html: ICON.play });
  const playLabel = h('span', null, 'Iniciar');
  const playBtn = h('button', { class: 'btn primary play', onclick: toggle }, playIcon, playLabel);
  const nextBtn = h('button', { class: 'round-btn', 'aria-label': 'Próxima etapa', disabled: true, onclick: nextStep, html: ICON.next });
  const controls = h('footer', { class: 'brew-controls' }, prevBtn, playBtn, nextBtn);

  const root = h('div', { class: 'page brew paused' },
    h('header', { class: 'topbar' },
      h('button', { class: 'icon-btn', 'aria-label': 'Fechar', onclick: exit, html: ICON.close }),
      h('div', { class: 'brew-id' },
        h('div', { class: 'kicker' }, [method ? method.name : '', bean ? bean.name : ''].filter(Boolean).join(' · ') || 'Brew Mode'),
        h('h1', null, recipe.name)),
      h('span', { class: 'topbar-spacer' })),
    h('main', { class: 'content brew-content' },
      h('div', { class: 'scene-wrap' }, scene, topview),
      panel, hud,
      h('div', { class: 'brew-progress' }, segs, nextEl)),
    controls);

  // --- Antes de começar ---
  panel.replaceChildren(
    h('div', { class: 'kicker' }, 'Antes de começar'),
    h('h2', { class: 'headline' }, 'Tudo pronto?'),
    h('ul', { class: 'prep' },
      h('li', null, h('strong', null, fmtG(dose) + ' g'), ' de café' + (recipe.grind ? ', moagem ' + recipe.grind.toLowerCase() : '') + (grindText ? ' · ' + grindText : '')),
      h('li', null, h('strong', null, tl.totalG + ' g'), ' de água' + (recipe.tempC ? ' a ' + recipe.tempC + ' °C' : '')),
      h('li', null, 'Escalde o filtro, coloque o café e zere a balança.')));
  nextEl.textContent = 'Toque em Iniciar junto com o primeiro despejo';

  function renderStep(i) {
    const s = tl.steps[i];
    const water = hasWater(s.kind);
    let detail = '';
    if (water) detail = '+' + s.addG + ' g de água até ' + fmtTime(s.end) + ' · ' + PATTERNS[s.pattern].toLowerCase();
    else if (s.kind !== 'espera') detail = 'Até ' + fmtTime(s.end);
    panel.replaceChildren(
      h('div', { class: 'kicker' }, 'Etapa ' + (i + 1) + ' de ' + tl.steps.length + ' · ' + STEP_KINDS[s.kind]),
      h('h2', { class: 'headline' + (stepHeadline(s).length > 22 ? ' long' : '') }, stepHeadline(s)),
      detail ? h('p', { class: 'detail' }, detail) : '',
      s.note && s.kind !== 'acao' ? h('p', { class: 'note' }, s.note) : '');

    untilEl.textContent = 'até ' + fmtTime(s.end);
    weightOf.textContent = 'de ' + s.toG + ' g';
    stepWater.textContent = water ? 'Nesta etapa +' + s.addG + ' g' : 'Sem água nesta etapa';

    tvSvg.innerHTML = topViewSVG(s, B);
    tvDot = tvSvg.querySelector('#tv-dot');
    tvTrail = tvSvg.querySelector('#tv-trail');
    tvLabel.textContent = topViewLabel(s);
    topview.classList.toggle('active', water);

    el.kettle.classList.toggle('rest', !water);
    el.stream.classList.toggle('on', water);
    if (!water) el.kettlePos.setAttribute('transform', '');

    segEls.forEach((seg, k) => {
      seg.classList.toggle('done', k < i);
      seg.classList.toggle('current', k === i);
    });
    const n = tl.steps[i + 1];
    nextEl.textContent = n
      ? 'Em seguida: ' + STEP_KINDS[n.kind].toLowerCase() + (hasWater(n.kind) ? ' até ' + n.toG + ' g' : '') + ' · ' + n.durationS + ' s'
      : 'Última etapa';
  }

  function setLevel(level) {
    const c = vesselFill(B.vessel, Math.min(1, Math.max(0, level)));
    const show = level > 0.004 ? '1' : '0';
    el.coffee.setAttribute('d', c.d);
    el.coffee.setAttribute('opacity', show);
    el.coffeeTop.setAttribute('cy', c.cy);
    el.coffeeTop.setAttribute('rx', c.rx);
    el.coffeeTop.setAttribute('ry', c.ry);
    el.coffeeTop.setAttribute('opacity', show);
  }

  function tick() {
    const t = elapsed();
    if (t >= tl.totalS) { finish(); return; }
    const i = stepIndexAt(tl, t);
    if (i !== idx) {
      idx = i;
      lastTick = -1;
      renderStep(i);
      if (running()) beep(880, 0.2);
    }
    const s = tl.steps[i];
    const dt = t - s.start;
    const p = s.durationS > 0 ? Math.min(1, Math.max(0, dt / s.durationS)) : 1;
    const poured = s.fromG + s.addG * p;
    const brewed = brewedAt(t);

    // HUD
    timeEl.textContent = fmtTime(Math.floor(t));
    ringBar.setAttribute('stroke-dashoffset', (RING_C * (1 - p)).toFixed(1));
    weightEl.textContent = Math.round(poured) + ' g';
    for (let k = 0; k < segFills.length; k++) {
      segFills[k].style.width = (k < i ? 100 : k === i ? p * 100 : 0) + '%';
    }

    // Cena
    el.scale.textContent = fmtTime(Math.floor(t)) + '  ' + Math.round(poured) + ' g';
    const level = tl.totalG > 0 ? 0.95 * brewed / tl.totalG : 0;
    setLevel(level);
    if (el.pool) el.pool.setAttribute('opacity', Math.min(0.7, 5 * (poured - brewed) / Math.max(1, tl.totalG)).toFixed(2));
    if (el.drip) el.drip.classList.toggle('on', poured - brewed > 0.5 && (releaseAt === null || t > releaseAt));
    if (B.surface) {
      // o fio de água acompanha a superfície do líquido
      const y = B.surface(level);
      el.streamPath.setAttribute('d', 'M195 36 L195 ' + (y - 2).toFixed(1));
      el.streamEnd.setAttribute('cy', y.toFixed(1));
    }
    if (hasWater(s.kind)) {
      const pos = pourPos(s, p, dt);
      el.kettlePos.setAttribute('transform', 'translate(' + (pos.u * B.bed.rx).toFixed(1) + ' ' + (pos.v * B.bed.ry).toFixed(1) + ')');
      if (tvDot) {
        tvDot.setAttribute('cx', (TV_C + pos.u * TV_R).toFixed(1));
        tvDot.setAttribute('cy', (TV_C + pos.v * TV_R).toFixed(1));
      }
      if (tvTrail && p > 0.01) tvTrail.setAttribute('d', spiralPath(s, p));
    }

    // Três bipes curtos antes de trocar de etapa
    const sec = Math.ceil(s.end - t);
    if (running() && sec >= 1 && sec <= 3 && sec !== lastTick && i < tl.steps.length - 1) {
      lastTick = sec;
      beep(520, 0.08);
    }
  }

  function setRunning(on) {
    if (on) {
      startedAt = performance.now();
      if (!timer) timer = setInterval(tick, 50);
      requestWake();
    } else {
      base = elapsed();
      startedAt = null;
      if (timer) { clearInterval(timer); timer = null; }
      releaseWake();
    }
    playIcon.innerHTML = on ? ICON.pause : ICON.play;
    playLabel.textContent = on ? 'Pausar' : 'Continuar';
    root.classList.toggle('paused', !on);
  }

  function toggle() {
    if (done) return;
    ensureAudio();
    if (!started) {
      started = true;
      prevBtn.disabled = false;
      nextBtn.disabled = false;
      hud.hidden = false;
    }
    setRunning(!running());
    tick();
  }

  function jumpTo(t) {
    base = t;
    if (running()) startedAt = performance.now();
    lastTick = -1;
    tick();
  }

  function nextStep() {
    if (!started || done || idx < 0) return;
    jumpTo(tl.steps[idx].end);
  }

  function prevStep() {
    if (!started || done || idx < 0) return;
    const s = tl.steps[idx];
    // Nos primeiros 2 s da etapa, volta para a etapa anterior
    jumpTo((elapsed() - s.start > 2 || idx === 0) ? s.start : tl.steps[idx - 1].start);
  }

  function finish() {
    if (done) return;
    done = true;
    if (running()) setRunning(false);
    beep(880, 0.15);
    setTimeout(() => beep(1175, 0.3), 180);

    // Cena final: servidor cheio, chaleira em repouso
    setLevel(0.95);
    if (el.pool) el.pool.setAttribute('opacity', '0');
    if (el.drip) el.drip.classList.remove('on');
    el.stream.classList.remove('on');
    el.kettle.classList.add('rest');
    el.kettlePos.setAttribute('transform', '');
    el.scale.textContent = fmtTime(tl.totalS) + '  ' + tl.totalG + ' g';
    topview.hidden = true;
    hud.hidden = true;
    controls.remove();
    root.classList.add('finished');
    segEls.forEach((seg) => { seg.classList.add('done'); seg.classList.remove('current'); });
    segFills.forEach((f) => { f.style.width = '100%'; });
    nextEl.textContent = '';

    let rating = 0;
    const starBtns = [1, 2, 3, 4, 5].map((n) =>
      h('button', { class: 'star', 'aria-label': n + ' de 5', html: ICON.star, onclick: () => { rating = rating === n ? 0 : n; paint(); } }));
    const paint = () => starBtns.forEach((b, k) => b.classList.toggle('on', k < rating));
    const notes = h('textarea', { rows: '2', placeholder: 'Como ficou? Ajustes para a próxima vez…' });
    const deduct = h('input', { type: 'checkbox', checked: true });

    panel.replaceChildren(
      h('div', { class: 'kicker' }, 'Concluído'),
      h('h2', { class: 'headline' }, 'Café pronto!'),
      h('p', { class: 'detail' }, fmtG(dose) + ' g de café · ' + tl.totalG + ' g de água · ' + fmtTime(tl.totalS) +
        (grindText ? ' · ' + fmtGrind(grindSetting, grinder.unit) : '')),
      h('div', { class: 'card finish-card' },
        h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Sua nota'), h('div', { class: 'stars' }, starBtns)),
        h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Anotações'), notes),
        bean ? h('label', { class: 'check' }, deduct,
          h('span', null, 'Descontar ' + fmtG(dose) + ' g do estoque de ' + bean.name + ' (' + fmtG(bean.stockG) + ' g)')) : ''),
      h('div', { class: 'btn-col' },
        h('button', { class: 'btn primary', onclick: saveLog }, 'Salvar no histórico'),
        h('button', { class: 'btn ghost', onclick: back }, 'Sair sem salvar')));

    function saveLog() {
      state.logs.push({
        id: uid(),
        date: new Date().toISOString(),
        recipeId: recipe.id,
        recipeName: recipe.name,
        beanId: bean ? bean.id : '',
        beanName: bean ? bean.name : '',
        grinderId: grindSetting ? grinder.id : '',
        grinderName: grindSetting ? grinder.name : '',
        grindSetting: grindSetting,
        grindUnit: grindSetting ? grinder.unit : '',
        coffeeG: dose,
        waterG: tl.totalG,
        totalS: tl.totalS,
        rating: rating,
        notes: notes.value.trim(),
      });
      if (bean && deduct.checked) {
        bean.stockG = Math.max(0, Math.round((bean.stockG - dose) * 10) / 10);
      }
      save();
      back();
    }
  }

  function exit() {
    if (started && !done && !confirm('Encerrar o preparo em andamento?')) return;
    back();
  }

  // --- Manter a tela acesa durante o preparo ---
  async function requestWake() {
    try {
      if (!('wakeLock' in navigator)) return;
      const lock = await navigator.wakeLock.request('screen');
      // Se pausou enquanto o pedido estava pendente, solta na hora
      if (running()) wake = lock;
      else lock.release().catch(() => {});
    } catch (e) { /* sem suporte ou negado */ }
  }
  function releaseWake() {
    if (wake) {
      wake.release().catch(() => {});
      wake = null;
    }
  }
  function onVisibility() {
    if (document.visibilityState === 'visible' && running()) requestWake();
  }
  document.addEventListener('visibilitychange', onVisibility);

  leaveHook = () => {
    if (timer) clearInterval(timer);
    timer = null;
    startedAt = null;
    releaseWake();
    document.removeEventListener('visibilitychange', onVisibility);
  };

  return root;
}
