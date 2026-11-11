/* Medición real con las mismas fuentes y tamaños para vista previa y PDF. */
(async () => {
  const metadata = JSON.parse(document.getElementById('cv-metadata').textContent);
  const pages = document.getElementById('pages');
  const sheets = [];
  function newPage() {
    const sheet = document.createElement('article');
    sheet.className = 'sheet';
    sheet.setAttribute('aria-label', `${metadata.page} ${sheets.length + 1}`);
    sheet.innerHTML = '<aside class="cv-side"><div class="cv-side-content"></div></aside><main class="cv-main"><div class="cv-main-content"></div></main>';
    const main = sheet.querySelector('.cv-main');
    if (!sheets.length) main.prepend(document.getElementById('first-header').content.cloneNode(true));
    pages.append(sheet);
    sheets.push(sheet);
    return sheet;
  }
  function fits(container) { return container.scrollHeight <= container.clientHeight + 1; }
  function target(index, selector) { while (sheets.length <= index) newPage(); return sheets[index].querySelector(selector); }
  function placeBlocks(sourceId, selector) {
    const blocks = [...document.getElementById(sourceId).content.children].map(node => node.cloneNode(true));
    let index = 0;
    for (const block of blocks) {
      let container = target(index, selector);
      container.append(block);
      if (fits(container)) continue;
      block.remove();
      if (container.childElementCount) {
        container = target(++index, selector);
        container.append(block);
        if (fits(container)) continue;
      }
      // Un bloque excepcionalmente largo se divide por sus elementos y, en el
      // caso de párrafos, por palabras. Nunca se oculta ni se achica el texto.
      block.remove();
      let fragment = block.cloneNode(false);
      container.append(fragment);
      for (const child of [...block.children]) {
        fragment.append(child);
        if (fits(container)) continue;
        child.remove();
        if (child.children.length || !child.textContent.trim()) {
          container = target(++index, selector);
          fragment = block.cloneNode(false); container.append(fragment);
          fragment.append(child);
          if (!fits(container)) throw new Error(`No se puede paginar «${block.dataset.label}». Revisá la longitud de su título o sus enlaces.`);
          continue;
        }
        const words = child.textContent.trim().split(/\s+/);
        child.remove();
        let offset = 0;
        while (offset < words.length) {
          const part = child.cloneNode(false); fragment.append(part);
          let low = 0, high = words.length - offset;
          while (low < high) {
            const middle = Math.ceil((low + high) / 2);
            part.textContent = words.slice(offset, offset + middle).join(' ');
            if (fits(container)) low = middle; else high = middle - 1;
          }
          if (!low) {
            part.remove();
            if (!fragment.children.length && container.childElementCount === 1) throw new Error(`No hay espacio para el contenido de «${block.dataset.label}».`);
            container = target(++index, selector);
            fragment = block.cloneNode(false); container.append(fragment);
            continue;
          }
          part.textContent = words.slice(offset, offset + low).join(' ');
          offset += low;
          if (offset < words.length) {
            container = target(++index, selector);
            fragment = block.cloneNode(false); container.append(fragment);
          }
        }
      }
    }
  }
  try {
    // Forzar la carga de las fuentes incluso antes de clonar los templates.
    await Promise.all(['400 12px "Hanken Grotesk"', '500 36px "Newsreader"', '400 10px "JetBrains Mono"'].map(font => document.fonts.load(font)));
    await document.fonts.ready;
    newPage();
    placeBlocks('main-source', '.cv-main-content');
    placeBlocks('side-source', '.cv-side-content');
    await Promise.all([...document.images].map(img => img.decode()));
    const overflow = [];
    for (const [index, sheet] of sheets.entries()) {
      for (const selector of ['.cv-main-content', '.cv-side-content']) {
        const container = sheet.querySelector(selector);
        if (!fits(container) || container.scrollWidth > container.clientWidth + 2 || container.getBoundingClientRect().bottom > sheet.getBoundingClientRect().bottom + 1) overflow.push(index + 1);
      }
      if (sheet.querySelector('.cv-side-content').children.length) {
        const sep = document.createElement('span');
        sep.className = 'ats-col-sep';
        sep.setAttribute('aria-hidden', 'true');
        sep.textContent = '|';
        sheet.append(sep);
      }
    }
    if (overflow.length) throw new Error(`Contenido desbordado en páginas: ${[...new Set(overflow)].join(', ')}.`);
    window.__CV_RESULT = { pages: sheets.length, revision: metadata.revision };
    window.__CV_READY = true;
    window.parent.postMessage({ type: 'cv-ready', ...window.__CV_RESULT }, window.location.origin === 'null' ? '*' : window.location.origin);
  } catch (error) {
    window.__CV_ERROR = error.message;
    const notice = document.getElementById('layout-error'); notice.hidden = false; notice.textContent = error.message;
    window.parent.postMessage({ type: 'cv-error', message: error.message }, window.location.origin === 'null' ? '*' : window.location.origin);
  }
  function fitPreview() { document.documentElement.style.setProperty('--preview-scale', Math.max(.2, Math.min(1, (window.innerWidth - 32) / 794))); }
  fitPreview(); window.addEventListener('resize', fitPreview);
})();
