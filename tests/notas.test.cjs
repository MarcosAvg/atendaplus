const { strict: assert } = require('node:assert');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const labels = [];
const row = { author: '853223', description: 'Una nota', date: '2026-10-16' };
const heading = {
  get textContent() { return row.author + labels.map(x => x.textContent).join(''); },
  get nextElementSibling() { return { tagName: 'P', textContent: row.description, nextElementSibling: { tagName: 'P', textContent: row.date } }; },
  append(label) { labels.push(label); }
};
const document = {
  querySelectorAll(selector) { return selector.includes('h5') ? [heading] : [...labels]; },
  createElement() { return { style: {}, setAttribute() {}, addEventListener(name, callback) { this[name] = callback; }, remove() { labels.splice(labels.indexOf(this), 1); } }; }
};
class Observer { constructor(callback) { this.callback = callback; Observer.instance = this; } observe() {} disconnect() {} }
class XHR {
  open() {} send() {} addEventListener(name, cb) { this.callback = cb; }
  complete(payload) { this.status = 200; this.responseType = 'json'; this.response = payload; this.callback(); }
}
const requests = [];
const window = { fetch() { return new Promise(resolve => requests.push(resolve)); } };
let copied; let rejectCopy = false; let resetFeedback;
const navigator = { clipboard: { async writeText(text) { if (rejectCopy) throw new Error("blocked"); copied = text; } } };
const context = { navigator, setTimeout(callback) { resetFeedback = callback; }, clearTimeout() {}, window, document, MutationObserver: Observer, XMLHttpRequest: XHR, location: { href: 'https://mioficina.nl.gob.mx/web/ATENDA/Servicios/Administracion', origin: 'https://mioficina.nl.gob.mx' }, URL, queueMicrotask };
vm.runInNewContext(readFileSync('extension/notas.js', 'utf8'), context);
const endpoint = id => `https://mioficina.nl.gob.mx/ws/api/MesaAyudaServicioNotas/Listar/${id}`;
const note = (service, stamp = '2026-10-16T09:24:59.62') => ({ idServicio: service, idServicioNota: 9234, nombreUsuario: row.author, descripcion: row.description, fechaCreacion: stamp, activo: true });
const flush = () => new Promise(resolve => setImmediate(resolve));
const respond = (resolve, payload) => { const response = { ok: true, clone() { return { json: async () => payload }; } }; resolve(response); return response; };
(async () => {
  const pending = window.fetch(endpoint(3850));
  const response = respond(requests.shift(), [note(3850)]);
  assert.equal(await pending, response);
  await flush();
  assert.equal(labels[0].textContent, ' · 16/10/2026 09:24:59');
  const event = { preventDefault() {}, stopPropagation() {} };
  await labels[0].click(event);
  assert.equal(copied, '16/10/2026 09:24:59');
  assert.match(labels[0].textContent, /Copiado/);
  Observer.instance.callback([{ target: { nodeType: 1, closest() { return labels[0]; } } }]);
  await flush(); assert.match(labels[0].textContent, /Copiado/);
  resetFeedback(); assert.equal(labels[0].textContent, ' · 16/10/2026 09:24:59');
  rejectCopy = true; await labels[0].click(event);
  assert.match(labels[0].textContent, /No se pudo copiar/);
  resetFeedback(); rejectCopy = false;
  Observer.instance.callback([{ target: { nodeType: 1, closest() { return null; } } }]); await flush(); assert.equal(labels.length, 1);
  const old = window.fetch(endpoint(3850)); const oldResolve = requests.shift();
  const current = window.fetch(endpoint(3851)); const currentResolve = requests.shift();
  respond(currentResolve, [note(3851, '2026-10-16T10:11:12.327')]); await current; await flush();
  respond(oldResolve, [note(3850)]); await old; await flush();
  assert.equal(labels[0].textContent, ' · 16/10/2026 10:11:12');
  row.description = 'Otro comentario'; Observer.instance.callback([{ target: { nodeType: 1, closest() { return null; } } }]); await flush(); assert.equal(labels.length, 0);
  const xhr = new XHR(); xhr.open('GET', endpoint(3851)); xhr.send(); xhr.complete([note(3851)]); await flush();
  assert.equal(labels.length, 1);
  xhr.open('GET', endpoint(3851)); xhr.send(); xhr.complete([note(3851), { ...note(3851), idServicioNota: 9235 }]); await flush();
  assert.equal(labels.length, 0);
  console.log('OK: copiar texto exacto, confirmación, restauración, error de portapapeles, Fetch, XHR, horas sin conversión, etiquetas únicas, cambio de ticket, respuestas fuera de orden y coincidencias ambiguas.');
})().catch(error => { console.error(error); process.exitCode = 1; });
