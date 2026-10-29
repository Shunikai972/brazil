/** Tiny hyperscript: el('div.foo.bar', { style: {...}, on: {click}, html }, children) */
export function el(tag, props = {}, children = []) {
  const [name, ...classes] = tag.split('.');
  const node = document.createElement(name || 'div');
  if (classes.length) node.className = classes.join(' ');
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null) continue;
    if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'on') for (const [ev, fn] of Object.entries(v)) node.addEventListener(ev, fn);
    else if (k === 'class') node.className += (node.className ? ' ' : '') + v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k in node && typeof v !== 'string') node[k] = v;
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) if (c != null) node.append(c);
  return node;
}

const SVGNS = 'http://www.w3.org/2000/svg';
export function svg(tag, attrs = {}, children = []) {
  const node = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) node.setAttribute(k, v);
  for (const c of [].concat(children)) if (c != null) node.append(c);
  return node;
}

/**
 * Splits the text of an element into per-character spans (words kept together so lines wrap
 * naturally). Returns the char spans.
 */
export function splitChars(node, text = node.textContent) {
  node.textContent = '';
  node.setAttribute('aria-label', text);
  const chars = [];
  const words = text.split(/(\s+)/);
  for (const w of words) {
    if (!w) continue;
    if (/^\s+$/.test(w)) {
      node.append(document.createTextNode(' '));
      continue;
    }
    const word = el('span.w', { 'aria-hidden': 'true' });
    for (const ch of Array.from(w)) {
      const c = el('span.ch', { text: ch });
      word.append(c);
      chars.push(c);
    }
    node.append(word);
  }
  return chars;
}

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const FLAG_RE = /(\u{1F1E7}\u{1F1F7}|\u{1F1EB}\u{1F1F7})/u;
const BR = '\u{1F1E7}\u{1F1F7}';
const FR = '\u{1F1EB}\u{1F1F7}';

/** Replaces 🇧🇷 / 🇫🇷 emoji with tiny drawn flags (Windows has no flag emoji glyphs). */
export function flagify(root) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const hits = [];
  while (walker.nextNode()) if (FLAG_RE.test(walker.currentNode.nodeValue)) hits.push(walker.currentNode);
  for (const node of hits) {
    const frag = document.createDocumentFragment();
    node.nodeValue.split(FLAG_RE).forEach((part) => {
      if (part === BR) frag.append(el('i.flg.br', { 'aria-label': 'Brasil' }));
      else if (part === FR) frag.append(el('i.flg.fr', { 'aria-label': 'França' }));
      else if (part) frag.append(document.createTextNode(part));
    });
    node.replaceWith(frag);
  }
}
