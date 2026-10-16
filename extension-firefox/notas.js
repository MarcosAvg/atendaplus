(() => {
  "use strict";

  const marker = "data-atenda-fecha-nota";
  const normalize = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
  let notes = [];
  let generation = 0;
  let scheduled = false;

  function serviceFor(url) {
    try {
      const parsed = new URL(url, location.href);
      if (parsed.origin !== location.origin) return null;
      return parsed.pathname.match(/^\/ws\/api\/MesaAyudaServicioNotas\/Listar\/(\d+)\/?$/)?.[1] ?? null;
    } catch {
      return null;
    }
  }

  // Keep the server's wall-clock time; the timestamp has no timezone offset.
  function formatTimestamp(value) {
    const match = typeof value === "string" && value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/);
    if (!match) return null;
    const [, year, month, day, hour, minute, second] = match;
    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
  }

  function render() {
    scheduled = false;
    observer.disconnect();
    try {
      document.querySelectorAll(`[${marker}]`).forEach((element) => element.remove());
      document.querySelectorAll('[id="scrollspy-nested"] h5').forEach((heading) => {
        const description = heading.nextElementSibling;
        const date = description?.nextElementSibling;
        if (description?.tagName !== "P" || date?.tagName !== "P") return;
        const matches = notes.filter((note) =>
          normalize(note.nombreUsuario) === normalize(heading.textContent) &&
          normalize(note.descripcion) === normalize(description.textContent) &&
          note.fechaCreacion.slice(0, 10) === normalize(date.textContent)
        );
        // Identical comments cannot be safely distinguished without a DOM ID.
        if (matches.length !== 1) return;
        const note = matches[0];
        const formatted = formatTimestamp(note.fechaCreacion);
        if (!formatted) return;
        const label = document.createElement("button");
        label.type = "button";
        label.setAttribute(marker, String(note.idServicioNota));
        label.textContent = ` · ${formatted}`;
        label.title = "Copiar fecha y hora de creación";
        label.setAttribute("aria-label", `Copiar fecha y hora: ${formatted}`);
        label.style.cssText = "font-family:inherit;font-size:0.75em;font-weight:400;color:#595959;white-space:nowrap;background:none;border:0;padding:2px 4px;cursor:pointer;text-decoration:underline;";
        let feedbackTimer;
        label.addEventListener("click", async (event) => {
          event.preventDefault();
          event.stopPropagation();
          clearTimeout(feedbackTimer);
          try {
            await navigator.clipboard.writeText(formatted);
            label.textContent = ` · ${formatted} ✓ Copiado`;
            label.setAttribute("aria-label", "Fecha y hora copiadas");
          } catch {
            label.textContent = ` · ${formatted} (No se pudo copiar)`;
            label.setAttribute("aria-label", "No se pudo copiar la fecha y hora");
          }
          feedbackTimer = setTimeout(() => {
            label.textContent = ` · ${formatted}`;
            label.setAttribute("aria-label", `Copiar fecha y hora: ${formatted}`);
          }, 1800);
        });
        heading.append(label);
      });
    } finally {
      observer.observe(document, { childList: true, subtree: true, characterData: true });
    }
  }

  function scheduleRender() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(render);
  }

  const observer = new MutationObserver((records) => {
    // Keep copy feedback intact; only changes from the platform require rendering.
    if (records.some((record) => {
      const element = record.target.nodeType === 1 ? record.target : record.target.parentElement;
      return !element?.closest(`[${marker}]`);
    })) scheduleRender();
  });
  observer.observe(document, { childList: true, subtree: true, characterData: true });

  function startRequest() {
    notes = [];
    scheduleRender();
    return ++generation;
  }

  function receive(payload, service, requestGeneration) {
    if (requestGeneration !== generation || !Array.isArray(payload)) return;
    notes = payload.filter((note) => note &&
      String(note.idServicio) === service && note.activo !== false &&
      typeof note.nombreUsuario === "string" && typeof note.descripcion === "string" &&
      formatTimestamp(note.fechaCreacion)
    );
    scheduleRender();
  }

  // Observe only the site's existing requests; do not issue extra API calls.
  const originalFetch = window.fetch;
  if (originalFetch) {
    window.fetch = function (...args) {
      const input = args[0];
      const service = serviceFor(typeof input === "string" || input instanceof URL ? input : input?.url);
      const requestGeneration = service ? startRequest() : null;
      const pending = Reflect.apply(originalFetch, this, args);
      if (service) {
        pending.then((response) => {
          if (response.ok) return response.clone().json().then((payload) => receive(payload, service, requestGeneration));
        }).catch(() => {});
      }
      return pending;
    };
  }

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  const services = new WeakMap();
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    const result = Reflect.apply(originalOpen, this, [method, url, ...rest]);
    services.set(this, serviceFor(url));
    return result;
  };
  XMLHttpRequest.prototype.send = function (...args) {
    const service = services.get(this);
    if (service) {
      const requestGeneration = startRequest();
      this.addEventListener("load", () => {
        if (this.status < 200 || this.status >= 300) return;
        try {
          const payload = this.responseType === "json" ? this.response : JSON.parse(this.responseText);
          receive(payload, service, requestGeneration);
        } catch {
          // Unsupported or non-JSON responses must not affect the platform.
        }
      }, { once: true });
    }
    return Reflect.apply(originalSend, this, args);
  };
})();
