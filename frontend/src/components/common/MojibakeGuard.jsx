import { useEffect } from 'react';
import { repairMojibake } from '../../utils/repairMojibake';

const TEXT_ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT']);

function repairTextNode(node) {
  const original = node.nodeValue;

  if (!original || !original.trim()) {
    return;
  }

  const fixed = repairMojibake(original);

  if (fixed !== original) {
    node.nodeValue = fixed;
  }
}

function repairElementAttributes(element) {
  TEXT_ATTRS.forEach((attr) => {
    const original = element.getAttribute(attr);

    if (!original) {
      return;
    }

    const fixed = repairMojibake(original);

    if (fixed !== original) {
      element.setAttribute(attr, fixed);
    }
  });
}

function repairNodeTree(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    repairTextNode(node);
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const element = /** @type {HTMLElement} */ (node);

  if (SKIP_TAGS.has(element.tagName)) {
    return;
  }

  repairElementAttributes(element);
  element.childNodes.forEach((child) => repairNodeTree(child));
}

export default function MojibakeGuard() {
  useEffect(() => {
    const root = document.body;

    if (!root) {
      return undefined;
    }

    repairNodeTree(root);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData') {
          repairTextNode(mutation.target);
          return;
        }

        if (mutation.type === 'attributes' && mutation.target instanceof HTMLElement) {
          repairElementAttributes(mutation.target);
          return;
        }

        mutation.addedNodes.forEach((node) => repairNodeTree(node));
      });
    });

    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: TEXT_ATTRS,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
