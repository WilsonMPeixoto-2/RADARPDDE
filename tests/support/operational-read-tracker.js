'use strict';

// Transporte observado pelo harness, inclusive antes de latência/barreiras.
// Uma request abortada deixa de estar ativa mesmo se seu handler ainda aguarda.
function createOperationalReadTracker() {
  const active = new Set();
  const held = new Set();
  return {
    start(request) { active.add(request); },
    hold(request) { if (active.has(request)) held.add(request); },
    release(request) { held.delete(request); },
    finish(request) { active.delete(request); held.delete(request); },
    get size() { return active.size; },
    get heldCount() { return held.size; },
    get unheldCount() { return [...active].filter(request => !held.has(request)).length; }
  };
}
module.exports = { createOperationalReadTracker };
