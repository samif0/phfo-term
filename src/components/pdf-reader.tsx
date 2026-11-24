'use client';

import { useSyncExternalStore } from 'react';
import ArrowTopRightOnSquareIcon from '@heroicons/react/24/outline/ArrowTopRightOnSquareIcon';
import './components.css';

type PdfReaderProps = {
  src: string;
  title: string;
};

// Phones and tablets either refuse to render a PDF inside a frame or show only its first page.
const TOUCH_ONLY_QUERY = '(hover: none) and (pointer: coarse)';

/** True when the link's path ends in .pdf, ignoring any query string or fragment. */
export function isPdfHref(href: string): boolean {
  return /\.pdf(?:[?#].*)?$/i.test(href.trim());
}

function subscribe(onChange: () => void) {
  const touchOnly = window.matchMedia(TOUCH_ONLY_QUERY);
  touchOnly.addEventListener('change', onChange);
  return () => touchOnly.removeEventListener('change', onChange);
}

function canEmbedPdf() {
  return navigator.pdfViewerEnabled !== false && !window.matchMedia(TOUCH_ONLY_QUERY).matches;
}

// The server cannot know, so it renders the frame-less fallback and the client upgrades it.
function canEmbedPdfOnServer() {
  return false;
}

// Fit the page to the frame's width and keep the thumbnail sidebar closed (Chrome and Firefox spell that differently).
const VIEWER_OPTIONS = 'view=FitH&navpanes=0&pagemode=none';

/** Adds the viewer options unless the link already carries its own fragment. */
function withViewerOptions(src: string) {
  return src.includes('#') ? src : `${src}#${VIEWER_OPTIONS}`;
}

export default function PdfReader({ src, title }: PdfReaderProps) {
  const canEmbed = useSyncExternalStore(subscribe, canEmbedPdf, canEmbedPdfOnServer);

  return (
    <figure className="pdf-reader">
      <figcaption className="pdf-reader-bar">
        <span className="pdf-reader-title">{title}</span>
        <a className="pdf-reader-open" href={src} target="_blank" rel="noopener noreferrer">
          open pdf
          <ArrowTopRightOnSquareIcon className="h-3 w-3" aria-hidden="true" />
        </a>
      </figcaption>
      {canEmbed && (
        <iframe className="pdf-reader-frame" src={withViewerOptions(src)} title={title} loading="lazy" />
      )}
    </figure>
  );
}
