/**
 * pdfjs-dist worker configuration for Vite.
 *
 * pdfjs uses a Web Worker for rendering. Without this, getDocument() throws
 * a worker-load error in the browser even though jsdom tests may not surface
 * it. Vite's `?url` suffix bundles the worker file as a static asset and
 * returns its public URL.
 *
 * Side-effect import: `import './pdf-worker';` from any module that calls
 * pdfjs APIs.
 */
import { GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;
