'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface FrameProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function Frame({ children, className, style }: FrameProps) {
  const [contentRef, setContentRef] = useState<HTMLIFrameElement | null>(null);
  const mountNode = contentRef?.contentWindow?.document?.body;

  useEffect(() => {
    if (!contentRef) return;
    const doc = contentRef.contentWindow?.document;
    if (!doc) return;

    const head = doc.head;
    const parentHead = document.head;

    // Copy all style sheets and style elements from host window to iframe
    const copyStyles = () => {
      const parentStyles = Array.from(parentHead.querySelectorAll('link[rel="stylesheet"], style'));
      const iframeStyles = Array.from(head.querySelectorAll('link[rel="stylesheet"], style'));

      const iframeMap = new Map<string, Element>();
      iframeStyles.forEach((el) => {
        const key = el.tagName === 'LINK' 
          ? `link:${el.getAttribute('href')}` 
          : `style:${el.textContent}`;
        iframeMap.set(key, el);
      });

      const targetNodes: Element[] = [];

      parentStyles.forEach((styleEl) => {
        const key = styleEl.tagName === 'LINK'
          ? `link:${styleEl.getAttribute('href')}`
          : `style:${styleEl.textContent}`;

        const existing = iframeMap.get(key);
        if (existing) {
          targetNodes.push(existing);
          iframeMap.delete(key);
        } else {
          const cloned = styleEl.cloneNode(true) as Element;
          targetNodes.push(cloned);
        }
      });

      iframeMap.forEach((el) => {
        el.remove();
      });

      targetNodes.forEach((node, index) => {
        const currentAtIdx = head.children[index];
        if (currentAtIdx !== node) {
          head.insertBefore(node, currentAtIdx || null);
        }
      });
    };

    copyStyles();

    let timer: NodeJS.Timeout;
    const debouncedCopyStyles = () => {
      clearTimeout(timer);
      timer = setTimeout(copyStyles, 100);
    };

    // Re-copy on host styles mutation (for style updates during dev)
    const observer = new MutationObserver(debouncedCopyStyles);
    observer.observe(parentHead, { childList: true, subtree: true });

    // Sync theme class names (e.g. for tailwind themes)
    doc.documentElement.className = document.documentElement.className;
    doc.body.className = document.body.className + " bg-transparent m-0 p-0 overflow-x-hidden";

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [contentRef]);

  return (
    <iframe
      ref={setContentRef}
      className={className}
      style={{ border: 'none', width: '100%', height: '100%', ...style }}
    >
      {mountNode && createPortal(children, mountNode)}
    </iframe>
  );
}
