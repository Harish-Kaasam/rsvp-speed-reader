/**
 * src/renderer/utils/pdfExtractor.js
 * Purpose: Extracts clean readable text from PDF files using PDF.js.
 *          Reconstructs reading order from coordinates, removes repeated
 *          headers/footers, joins hyphenated breaks, and normalises whitespace.
 * Exports: extractTextFromPDF (named)
 * Dependencies: pdfjs-dist
 */

// ─── Constants ────────────────────────────────────────────────────────────────
/** Minimum pages a line must repeat on to be considered a header/footer */
const HEADER_FOOTER_MIN_PAGES = 3;
/** Y-coordinate tolerance for grouping text items into lines (points) */
const LINE_Y_TOLERANCE = 2;
/** Top/bottom fraction of page height to scan for headers/footers */
const HEADER_FOOTER_MARGIN_FRACTION = 0.1;

/**
 * Extracts clean text from a PDF ArrayBuffer using PDF.js.
 * Handles multi-page docs, header/footer removal, and hyphenation.
 * @param {ArrayBuffer} arrayBuffer    - Raw PDF file bytes
 * @param {Function}    onProgress     - Called with status strings (optional)
 * @returns {Promise<string>}          - Clean extracted text with paragraph markers
 */
export async function extractTextFromPDF(arrayBuffer, onProgress) {
  // Dynamically import pdfjs-dist to allow tree-shaking
  const pdfjsLib = await import('pdfjs-dist');

  // Set worker source — use local bundled worker
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    // Try to use the bundled worker from node_modules
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).href;
  }

  onProgress?.('Loading PDF document...');

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  let pdf;
  try {
    pdf = await loadingTask.promise;
  } catch (err) {
    throw new Error(`Could not open PDF: ${err.message}`);
  }

  const numPages = pdf.numPages;
  onProgress?.(`PDF loaded — ${numPages} page${numPages !== 1 ? 's' : ''}`);

  // ─── Extract text content from each page ──────────────────────────────
  /** @type {Array<Array<{text: string, x: number, y: number, height: number}>>} */
  const allPageLines = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    onProgress?.(`Extracting page ${pageNum} of ${numPages}...`);

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    // Group items by Y coordinate into lines
    const lineMap = new Map();

    for (const item of textContent.items) {
      if (!item.str || item.str.trim() === '') continue;

      // PDF coordinate system: y=0 is bottom, we flip to top-relative
      const x = item.transform[4];
      const y = viewport.height - item.transform[5];
      const height = Math.abs(item.transform[3]) || 12;

      // Snap Y to nearest tolerance bucket
      let lineY = null;
      for (const existingY of lineMap.keys()) {
        if (Math.abs(existingY - y) <= LINE_Y_TOLERANCE) {
          lineY = existingY;
          break;
        }
      }
      if (lineY === null) {
        lineY = y;
        lineMap.set(lineY, []);
      }

      lineMap.get(lineY).push({ text: item.str, x, y, height });
    }

    // Sort lines top→bottom, items left→right within each line
    const sortedLines = Array.from(lineMap.entries())
      .sort(([ya], [yb]) => ya - yb)
      .map(([y, items]) => ({
        y,
        text: items.sort((a, b) => a.x - b.x).map(i => i.text).join(' ').trim(),
        pageHeight: viewport.height,
      }))
      .filter(l => l.text.length > 0);

    allPageLines.push(sortedLines);
  }

  // ─── Detect and remove repeated headers/footers ──────────────────────
  onProgress?.('Cleaning headers and footers...');
  const lineFrequency = new Map();

  for (const pageLines of allPageLines) {
    if (pageLines.length === 0) continue;
    const pageHeight = pageLines[0]?.pageHeight || 800;
    const headerZone = pageHeight * HEADER_FOOTER_MARGIN_FRACTION;
    const footerZone = pageHeight * (1 - HEADER_FOOTER_MARGIN_FRACTION);

    for (const line of pageLines) {
      if (line.y < headerZone || line.y > footerZone) {
        const key = line.text.toLowerCase().trim();
        lineFrequency.set(key, (lineFrequency.get(key) || 0) + 1);
      }
    }
  }

  /** @type {Set<string>} Lines that appear on 3+ pages → structural noise */
  const structuralLines = new Set(
    Array.from(lineFrequency.entries())
      .filter(([, count]) => count >= HEADER_FOOTER_MIN_PAGES)
      .map(([text]) => text)
  );

  // ─── Build clean paragraphs ───────────────────────────────────────────
  onProgress?.('Reconstructing paragraphs...');
  const paragraphs = [];
  let currentParagraph = [];
  let prevY = null;
  let prevLineHeight = 12;

  for (const pageLines of allPageLines) {
    if (pageLines.length === 0) continue;

    // Estimate average line height for this page
    const heights = pageLines.map(l => l.height || 12).filter(h => h > 0);
    const avgLineHeight = heights.length
      ? heights.reduce((a, b) => a + b, 0) / heights.length
      : 12;

    for (const line of pageLines) {
      const key = line.text.toLowerCase().trim();

      // Skip headers/footers and page numbers
      if (structuralLines.has(key)) continue;
      if (/^\d+$/.test(line.text.trim())) continue; // pure page numbers

      // Detect paragraph break: large Y gap between lines
      if (prevY !== null) {
        const gap = line.y - prevY;
        const isParaBreak = gap > avgLineHeight * 1.8;

        if (isParaBreak && currentParagraph.length > 0) {
          paragraphs.push(currentParagraph.join(' '));
          currentParagraph = [];
        }
      }

      // Join hyphenated line breaks
      const lineText = line.text.trim();
      if (currentParagraph.length > 0) {
        const lastWord = currentParagraph[currentParagraph.length - 1];
        if (lastWord.endsWith('-')) {
          // Remove hyphen and join to next word
          currentParagraph[currentParagraph.length - 1] = lastWord.slice(0, -1) + lineText;
        } else {
          currentParagraph.push(lineText);
        }
      } else {
        currentParagraph.push(lineText);
      }

      prevY = line.y;
    }

    // Page break = paragraph break
    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph.join(' '));
      currentParagraph = [];
      prevY = null;
    }
  }

  // Flush remaining
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join(' '));
  }

  // ─── Final cleanup ────────────────────────────────────────────────────
  const cleanText = paragraphs
    .map(p => p
      .replace(/\s+/g, ' ')
      .replace(/- /g, '')       // remove orphaned hyphens
      .trim()
    )
    .filter(p => p.length > 10) // remove trivially short fragments
    .join('\n\n');

  onProgress?.('Extraction complete!');
  return cleanText;
}
