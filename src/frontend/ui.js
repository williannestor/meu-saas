function el(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);

  Object.entries(attrs).forEach(([key, value]) => {
    if (key === "class") {
      element.className = value;
      return;
    }
    if (key === "style" && typeof value === "object") {
      Object.assign(element.style, value);
      return;
    }
    if (key.startsWith("on") && typeof value === "function") {
      element.addEventListener(key.slice(2).toLowerCase(), value);
      return;
    }
    element.setAttribute(key, value);
  });

  const fragment = document.createDocumentFragment();
  children.forEach((child) => {
    fragment.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  });
  element.appendChild(fragment);

  return element;
}

function text(content) {
  return document.createTextNode(content);
}

function findBy(selector, root = document) {
  return root.querySelector(selector);
}

function findAllBy(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

function clear(container) {
  container.textContent = "";
}

function setHtml(container, html) {
  container.textContent = html;
}

function esc(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

module.exports = {
  el,
  text,
  findBy,
  findAllBy,
  clear,
  setHtml,
  esc
};
