// // /**
// //  * pdfToWord.js
// //  *
// //  * Converts a PDF into an editable Word (.docx) file, fully in the browser.
// //  *
// //  * Install:   npm i pdfjs-dist docx
// //  *
// //  * Usage:
// //  *   import { convertPdfToWord } from "../services/pdfToWord";
// //  *
// //  *   const docx = await convertPdfToWord(file, { password }, (p) => setProgress(p));
// //  *   // docx is a File named "<original>.docx"
// //  *
// //  * What it rebuilds: headings, paragraphs (re-flowed), bold/italic, bullet and
// //  * numbered lists, tables, centered/right-aligned lines, indents, page size and
// //  * margins. It removes repeated headers, footers and page numbers.
// //  *
// //  * What it cannot do: reproduce pixel-exact layout, embedded images, vector
// //  * graphics or form fields. Scanned PDFs need OCR (see the `ocr` option).
// //  */
// // import { recognizePdfPage } from "./ocrService";
// // import * as pdfjsLib from "pdfjs-dist";
// // import {
// //   AlignmentType,
// //   Document,
// //   HeadingLevel,
// //   LevelFormat,
// //   Packer,
// //   Paragraph,
// //   Tab,
// //   Table,
// //   TableCell,
// //   TableRow,
// //   TextRun,
// //     WidthType,
// //   ImageRun,
// // } from "docx";

// // // Vite/Webpack 5 resolve this URL at build time. For pdfjs-dist v3 use ".min.js".
// // pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
// //   "pdfjs-dist/build/pdf.worker.min.mjs",
// //   import.meta.url
// // ).toString();

// // /* -------------------------------------------------------------------------- */
// // /*  Configuration                                                             */
// // /* -------------------------------------------------------------------------- */
// // async function renderPageImage(page) {
// //   const viewport = page.getViewport({ scale: 1.5 });

// //   const canvas = document.createElement("canvas");
// //   const context = canvas.getContext("2d");

// //   canvas.width = Math.ceil(viewport.width);
// //   canvas.height = Math.ceil(viewport.height);

// //   try {
// //     await page.render({
// //       canvasContext: context,
// //       viewport,
// //     }).promise;

// //     const blob = await new Promise((resolve, reject) => {
// //       canvas.toBlob((result) => {
// //         if (result) resolve(result);
// //         else reject(new Error("Unable to render PDF page image."));
// //       }, "image/png");
// //     });

// //     return new Uint8Array(await blob.arrayBuffer());
// //   } finally {
// //     canvas.width = 0;
// //     canvas.height = 0;
// //   }
// // }
// // const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
// // const MAX_PAGES = 300;
// // const MIN_CHARS_FOR_TEXT_PAGE = 10;

// // const DEFAULT_OPTIONS = {
// //   password: undefined, // for protected PDFs
// //   preservePageBreaks: false, // false = reflowable, easier to edit
// //   removeHeadersFooters: true,
// //   ocr: null, // async (canvas, pageNumber) => string, for scanned pages
// //   signal: undefined, // AbortSignal to cancel
// // };

// // const BODY_FONT = "Calibri";
// // const BODY_SIZE_HALF_POINTS = 22; // 11 pt
// // const HEADING_SIZES = { 1: 36, 2: 30, 3: 26 }; // half-points

// // const BOLD_RE = /bold|black|heavy|semibold|demi/i;
// // const ITALIC_RE = /italic|oblique/i;
// // const PAGE_NUMBER_RE =
// //   /^(?:page\s*)?\d{1,3}(?:\s*(?:of|\/)\s*\d{1,3})?$|^[-–—]\s*\d{1,3}\s*[-–—]$/i;
// // const BULLET_RE =
// //   /^(?:[•●○◦▪■□◆◇‣∙·▫➢➤✓✔*–—-]\s+|[\uF000-\uF0FF]\s*)/;
// // const NUMBERED_RE =
// //   /^(?:\(?\d{1,3}[.)]|\(?[a-z][.)]|\(?(?:i{1,3}|iv|vi{0,3}|ix|x)[.)])\s+(?=\S)/;
// // const LIGATURES = {
// //   "\uFB00": "ff", "\uFB01": "fi", "\uFB02": "fl", "\uFB03": "ffi",
// //   "\uFB04": "ffl", "\uFB05": "st", "\uFB06": "st",
// // };

// // /* -------------------------------------------------------------------------- */
// // /*  Small helpers                                                             */
// // /* -------------------------------------------------------------------------- */

// // const toTwips = (points) => Math.round(points * 20);
// // const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
// // const yieldToUi = () => new Promise((resolve) => setTimeout(resolve, 0));

// // const cleanText = (text) =>
// //   text
// //     .replace(/[\uFB00-\uFB06]/g, (c) => LIGATURES[c])
// //     // control characters are illegal in Word's XML
// //     .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\uFFFE\uFFFF]/g, "")
// //     .replace(/\u00A0/g, " ");

// // const endsSentence = (text) => /[.!?:;。]["”’')\]]*$/.test(text.trim());
// // const startsLowercase = (text) => /^\p{Ll}/u.test(text.trim());

// // const percentile = (sorted, p) =>
// //   sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] : 0;

// // const median = (values) => {
// //   if (!values.length) return 0;
// //   const sorted = [...values].sort((a, b) => a - b);
// //   return sorted[Math.floor(sorted.length / 2)];
// // };

// // const throwIfAborted = (signal) => {
// //   if (signal?.aborted) {
// //     throw new DOMException("Conversion cancelled.", "AbortError");
// //   }
// // };

// // const mapPdfError = (error) => {
// //   if (error?.name === "PasswordException") {
// //     const incorrect = error.code === 2;
// //     const err = new Error(
// //       incorrect
// //         ? "The password is incorrect. Try again."
// //         : "This PDF is password protected. Enter the password to continue."
// //     );
// //     err.code = incorrect ? "PASSWORD_INCORRECT" : "PASSWORD_REQUIRED";
// //     return err;
// //   }
// //   if (error?.name === "InvalidPDFException") {
// //     return new Error("This file is not a valid PDF, or it is damaged.");
// //   }
// //   if (error?.name === "AbortError") return error;
// //   return new Error(`Unable to read this PDF: ${error?.message || "unknown error"}`, {
// //     cause: error,
// //   });
// // };

// // /* -------------------------------------------------------------------------- */
// // /*  Step 1: extract positioned text from each page                            */
// // /* -------------------------------------------------------------------------- */

// // const resolveFontStyle = (page, fontName, cache) => {
// //   if (cache.has(fontName)) return cache.get(fontName);

// //   let style = {
// //     bold: BOLD_RE.test(fontName),
// //     italic: ITALIC_RE.test(fontName),
// //   };

// //   try {
// //     if (page.commonObjs.has(fontName)) {
// //       const font = page.commonObjs.get(fontName);
// //       const names = `${font?.name ?? ""} ${font?.fallbackName ?? ""}`;
// //       style = {
// //         bold: Boolean(font?.bold || font?.black) || BOLD_RE.test(names),
// //         italic: Boolean(font?.italic) || ITALIC_RE.test(names),
// //       };
// //       cache.set(fontName, style); // cache only when the real font was found
// //     }
// //   } catch {
// //     /* fall back to the name-based guess */
// //   }

// //   return style;
// // };

// // const sameStyle = (a, b) =>
// //   a.bold === b.bold && a.italic === b.italic && Math.abs(a.size - b.size) < 0.6;

// // const pushRun = (runs, run) => {
// //   const last = runs[runs.length - 1];
// //   if (last && sameStyle(last, run)) last.text += run.text;
// //   else runs.push({ ...run });
// // };

// // const trimRuns = (runs) => {
// //   while (runs.length && !runs[0].text.trimStart()) runs.shift();
// //   while (runs.length && !runs[runs.length - 1].text.trimEnd()) runs.pop();
// //   if (runs.length) {
// //     runs[0].text = runs[0].text.trimStart();
// //     runs[runs.length - 1].text = runs[runs.length - 1].text.trimEnd();
// //   }
// //   return runs;
// // };

// // const dominantSize = (runs) => {
// //   const weights = new Map();
// //   runs.forEach((r) => {
// //     const key = Math.round(r.size * 2) / 2;
// //     weights.set(key, (weights.get(key) || 0) + r.text.trim().length);
// //   });
// //   let best = 0;
// //   let bestWeight = -1;
// //   weights.forEach((weight, size) => {
// //     if (weight > bestWeight) {
// //       best = size;
// //       bestWeight = weight;
// //     }
// //   });
// //   return best || runs[0]?.size || 10;
// // };

// // // Splits one visual line into segments wherever there is a wide horizontal gap
// // // (table cells and column gutters).
// // const buildSegments = (items) => {
// //   const segments = [];
// //   let current = null;
// //   let prev = null;

// //   for (const item of items) {
// //     const gap = prev ? item.x - (prev.x + prev.width) : 0;
// //     const threshold = Math.max(9, 1.6 * Math.max(item.size, prev?.size ?? 0));

// //     if (!current || gap > threshold) {
// //       current = { x: item.x, right: item.x, runs: [] };
// //       segments.push(current);
// //     }

// //     let text = item.text;
// //     const lastRun = current.runs[current.runs.length - 1];
// //     if (
// //       lastRun &&
// //       gap > 0.15 * item.size &&
// //       !/\s$/.test(lastRun.text) &&
// //       !/^\s/.test(text)
// //     ) {
// //       text = ` ${text}`;
// //     }

// //     pushRun(current.runs, {
// //       text,
// //       bold: item.bold,
// //       italic: item.italic,
// //       size: item.size,
// //     });
// //     current.right = Math.max(current.right, item.x + item.width);
// //     prev = item;
// //   }

// //   return segments
// //     .map((seg) => {
// //       trimRuns(seg.runs);
// //       return { ...seg, size: dominantSize(seg.runs) };
// //     })
// //     .filter((seg) => seg.runs.length);
// // };

// // const makeLine = (segments, yTop, pageIndex, pageWidth) => {
// //   const runs = [];

// //   segments.forEach((seg, i) => {
// //     if (i > 0) {
// //       const gap = seg.x - segments[i - 1].right;
// //       const separator = gap >= 4 * seg.size ? "\t" : " ";
// //       pushRun(runs, { text: separator, bold: false, italic: false, size: seg.size });
// //     }
// //     seg.runs.forEach((r) => pushRun(runs, r));
// //   });

// //   const visible = runs.filter((r) => r.text.trim());

// //   return {
// //     segments,
// //     runs,
// //     text: runs.map((r) => r.text).join(""),
// //     yTop,
// //     page: pageIndex,
// //     pageWidth,
// //     left: segments[0].x,
// //     right: segments[segments.length - 1].right,
// //     size: dominantSize(runs),
// //     bold: visible.length > 0 && visible.every((r) => r.bold),
// //   };
// // };

// // const extractPage = async (page, pageIndex, fontCache) => {
// //   const viewport = page.getViewport({ scale: 1 });

// //   // Loading the operator list makes the real font names available
// //   await page.getOperatorList().catch(() => {});
// //   const content = await page.getTextContent();

// //   const items = [];

// //   for (const raw of content.items) {
// //     if (!("str" in raw) || !raw.str) continue;

// //     // Convert to viewport space so rotated pages are handled correctly
// //     const t = pdfjsLib.Util.transform(viewport.transform, raw.transform);
// //     const size = Math.hypot(t[2], t[3]) || raw.height;

// //     // Skip rotated text (watermarks, side labels) and invalid sizes
// //     if (!size || Math.abs(t[1]) > 0.5 * Math.abs(t[0])) continue;

// //     const x = t[4];
// //     const yTop = t[5];
// //     if (x < -5 || x > viewport.width + 5 || yTop < 0 || yTop > viewport.height) continue;

// //     const text = cleanText(raw.str);
// //     if (!text) continue;

// //     const { bold, italic } = resolveFontStyle(page, raw.fontName, fontCache);
// //     items.push({ text, x, yTop, size, width: raw.width * viewport.scale, bold, italic });
// //   }

// //   // Group items into visual lines, top to bottom
// //   items.sort((a, b) => a.yTop - b.yTop || a.x - b.x);

// //   const grouped = [];
// //   for (const item of items) {
// //     const last = grouped[grouped.length - 1];
// //     const tolerance = last ? Math.max(2, 0.45 * Math.max(item.size, last.size)) : 0;

// //     if (last && Math.abs(item.yTop - last.yTop) <= tolerance) {
// //       last.items.push(item);
// //       if (item.size > last.size) {
// //         last.size = item.size;
// //         last.yTop = item.yTop;
// //       }
// //     } else {
// //       grouped.push({ yTop: item.yTop, size: item.size, items: [item] });
// //     }
// //   }

// //   const lines = [];
// //   for (const group of grouped) {
// //     group.items.sort((a, b) => a.x - b.x);
// //     const segments = buildSegments(group.items);
// //     if (!segments.length) continue;
// //     lines.push(makeLine(segments, group.yTop, pageIndex, viewport.width));
// //   }
// //   lines.sort((a, b) => a.yTop - b.yTop);

// //   const charCount = lines.reduce((sum, l) => sum + l.text.replace(/\s/g, "").length, 0);

// //   return {
// //     index: pageIndex,
// //     width: viewport.width,
// //     height: viewport.height,
// //     lines,
// //     charCount,
// //     ocrParagraphs: null,
// //   };
// // };

// // const runOcr = async (page, ocr) => {
// //   const viewport = page.getViewport({ scale: 2 });
// //   const canvas = document.createElement("canvas");
// //   canvas.width = Math.ceil(viewport.width);
// //   canvas.height = Math.ceil(viewport.height);

// //   try {
// //     await page.render({
// //       canvasContext: canvas.getContext("2d"),
// //       viewport,
// //       canvas,
// //     }).promise;

// //   const lines = await recognizePdfPage(canvas);

// // const text = lines.join("\n");

// // return text
// //   .replace(/\r\n?/g, "\n")
// //   .split(/\n{2,}/)
// //   .map((block) => cleanText(block).replace(/\s*\n\s*/g, " ").trim())
// //   .filter(Boolean);
// //   } finally {
// //     canvas.width = 0;
// //     canvas.height = 0;
// //   }
// // };

// // /* -------------------------------------------------------------------------- */
// // /*  Step 2: clean up and analyse the whole document                           */
// // /* -------------------------------------------------------------------------- */

// // const removeHeadersAndFooters = (pages) => {
// //   if (pages.length < 2) return 0;

// //   const zone = 0.09; // top and bottom 9% of the page
// //   const inZone = (line, page) =>
// //     line.yTop < page.height * zone || line.yTop > page.height * (1 - zone);
// //   const keyOf = (line) =>
// //     line.text.toLowerCase().replace(/\d+/g, "#").replace(/\s+/g, " ").trim();

// //   const counts = new Map();
// //   pages.forEach((page) => {
// //     const seen = new Set();
// //     page.lines.forEach((line) => {
// //       if (!inZone(line, page)) return;
// //       const key = keyOf(line);
// //       if (!seen.has(key)) {
// //         seen.add(key);
// //         counts.set(key, (counts.get(key) || 0) + 1);
// //       }
// //     });
// //   });

// //   const threshold = Math.max(2, Math.ceil(pages.length * 0.5));
// //   let removed = 0;

// //   pages.forEach((page) => {
// //     page.lines = page.lines.filter((line) => {
// //       if (!inZone(line, page)) return true;
// //       const isPageNumber = PAGE_NUMBER_RE.test(line.text.trim());
// //       const isRepeated = pages.length >= 3 && counts.get(keyOf(line)) >= threshold;
// //       if (isPageNumber || isRepeated) {
// //         removed += 1;
// //         return false;
// //       }
// //       return true;
// //     });
// //   });

// //   return removed;
// // };

// // const analyseDocument = (pages) => {
// //   const lines = pages.flatMap((p) => p.lines);

// //   // Body font size = the size that carries the most characters
// //   const weights = new Map();
// //   lines.forEach((l) => {
// //     const key = Math.round(l.size * 2) / 2;
// //     weights.set(key, (weights.get(key) || 0) + l.text.length);
// //   });
// //   let bodySize = 11;
// //   let bestWeight = -1;
// //   weights.forEach((weight, size) => {
// //     if (weight > bestWeight) {
// //       bodySize = size;
// //       bestWeight = weight;
// //     }
// //   });

// //   const bodyLines = lines.filter((l) => Math.abs(l.size - bodySize) <= 0.6);
// //   const reference = bodyLines.length ? bodyLines : lines;
// //   const lefts = reference.map((l) => l.left).sort((a, b) => a - b);
// //   const rights = reference.map((l) => l.right).sort((a, b) => a - b);

// //   // Typical distance between consecutive lines of the same paragraph
// //   const pitches = [];
// //   pages.forEach((page) => {
// //     for (let i = 1; i < page.lines.length; i += 1) {
// //       const gap = page.lines[i].yTop - page.lines[i - 1].yTop;
// //       if (gap > 0.8 * bodySize && gap < 2.2 * bodySize) pitches.push(gap);
// //     }
// //   });

// //   const bulletLefts = lines
// //     .filter((l) => BULLET_RE.test(l.text))
// //     .map((l) => l.left);

// //   return {
// //     bodySize,
// //     textLeft: percentile(lefts, 0.08),
// //     textRight: percentile(rights, 0.92),
// //     pitch: median(pitches) || bodySize * 1.2,
// //     listLeft: bulletLefts.length ? Math.min(...bulletLefts) : 0,
// //   };
// // };

// // /* -------------------------------------------------------------------------- */
// // /*  Step 3: detect tables and columns, then build paragraphs                  */
// // /* -------------------------------------------------------------------------- */

// // const structurePage = (page) => {
// //   const blocks = [];

// //   if (page.ocrParagraphs?.length) {
// //     blocks.push({
// //       type: "ocr",
// //       paragraphs: page.ocrParagraphs,
// //       page: page.index,
// //     });

// //     return blocks;
// //   }

// //   const { lines } = page;
// //   let i = 0;

// //   while (i < lines.length) {
// //     const line = lines[i];

// //     if (line.segments.length >= 2) {
// //       const starts = line.segments.map((s) => s.x);
// //       let j = i + 1;
// //       while (
// //         j < lines.length &&
// //         lines[j].segments.length === starts.length &&
// //         lines[j].segments.every((s, k) => Math.abs(s.x - starts[k]) <= 12)
// //       ) {
// //         j += 1;
// //       }

// //       const rows = lines.slice(i, j);

// //       if (rows.length >= 2) {
// //         const lengths = rows.flatMap((r) =>
// //           r.segments.map((s) => s.runs.map((run) => run.text).join("").length)
// //         );
// //         const averageLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;

// //         if (rows.length >= 3 && averageLength >= 35) {
// //           // Long text in side-by-side blocks = newspaper columns.
// //           // Emit the left column first, then the next one.
// //           for (let k = 0; k < starts.length; k += 1) {
// //             rows.forEach((row) => {
// //               blocks.push({
// //                 type: "line",
// //                 line: makeLine([row.segments[k]], row.yTop, row.page, row.pageWidth),
// //               });
// //             });
// //           }
// //         } else {
// //           blocks.push({ type: "table", rows, starts, page: page.index, width: page.width });
// //         }

// //         i = j;
// //         continue;
// //       }
// //     }

// //     blocks.push({ type: "line", line });
// //     i += 1;
// //   }

// //   return blocks;
// // };

// // const classifyHeading = (line, prev, next, marker, stats) => {
// //   if (marker || line.text.trim().length < 2) return 0;

// //   const ratio = line.size / stats.bodySize;

// //   if (ratio >= 1.15 && line.text.length <= 160) {
// //     return ratio >= 1.6 ? 1 : ratio >= 1.3 ? 2 : 3;
// //   }

// //   // Short bold line standing on its own = section heading
// //   if (
// //     line.bold &&
// //     ratio >= 0.92 &&
// //     ratio < 1.15 &&
// //     line.segments.length === 1 &&
// //     line.text.length <= 80 &&
// //     !/[.,;]$/.test(line.text.trim())
// //   ) {
// //     const spaceBefore =
// //       !prev || prev.page !== line.page || line.yTop - prev.yTop > stats.pitch * 1.2;
// //     const spaceAfter =
// //       !next || next.page !== line.page || next.yTop - line.yTop > stats.pitch * 1.2;
// //     if (spaceBefore && spaceAfter) return 3;
// //   }

// //   return 0;
// // };

// // const matchMarker = (text) => {
// //   const bullet = text.match(BULLET_RE);
// //   if (bullet) return { type: "bullet", length: bullet[0].length };
// //   const numbered = text.match(NUMBERED_RE);
// //   if (numbered) return { type: "numbered", length: numbered[0].length };
// //   return null;
// // };

// // // Removes the first `length` characters from the runs (used for bullet markers)
// // const stripLeading = (runs, length) => {
// //   const copy = runs.map((r) => ({ ...r }));
// //   let remaining = length;
// //   while (remaining > 0 && copy.length) {
// //     if (copy[0].text.length <= remaining) {
// //       remaining -= copy[0].text.length;
// //       copy.shift();
// //     } else {
// //       copy[0].text = copy[0].text.slice(remaining);
// //       remaining = 0;
// //     }
// //   }
// //   if (copy[0]) copy[0].text = copy[0].text.trimStart();
// //   return copy;
// // };

// // // "1. Title" becomes "1.<tab>Title" so the hanging indent lines up
// // const tabAfterNumber = (runs, length) => {
// //   const copy = runs.map((r) => ({ ...r }));
// //   if (copy[0] && copy[0].text.length >= length) {
// //     copy[0].text = `${copy[0].text.slice(0, length).trimEnd()}\t${copy[0].text.slice(length)}`;
// //   }
// //   return copy;
// // };

// // const appendLine = (paragraph, line, stats) => {
// //   let runs = line.runs.map((r) => ({ ...r }));

// //   if (paragraph.lines.length === 0) {
// //     const marker = paragraph.marker;
// //     if (marker?.type === "bullet") runs = stripLeading(runs, marker.length);
// //     if (marker?.type === "numbered") runs = tabAfterNumber(runs, marker.length);
// //   }

// //   if (paragraph.runs.length) {
// //     const last = paragraph.runs[paragraph.runs.length - 1];
// //     const joinsHyphen =
// //       /\p{L}-$/u.test(last.text) && startsLowercase(line.text) && !paragraph.heading;

// //     if (joinsHyphen) {
// //       last.text = last.text.slice(0, -1);
// //     } else {
// //       pushRun(paragraph.runs, { ...last, text: " " });
// //     }
// //   }

// //   runs.forEach((r) => pushRun(paragraph.runs, r));
// //   paragraph.lines.push(line);
// //   paragraph.lastText = line.text;
// //   return paragraph;
// // };

// // const buildElements = (blocks, stats, options) => {
// //   const elements = [];
// //   let current = null;
// //   let prev = null;

// //   const flush = () => {
// //     if (current) {
// //       elements.push(current);
// //       current = null;
// //     }
// //   };

// //   blocks.forEach((block, index) => {
// //     if (block.type === "table") {
// //       flush();
// //       elements.push(block);
// //       prev = null;
// //       return;
// //     }

// //     if (block.type === "ocr") {
// //       flush();
// //       block.paragraphs.forEach((text, i) => {
// //         elements.push({
// //           kind: "paragraph",
// //           page: block.page,
// //           plain: true,
// //           heading: 0,
// //           list: null,
// //           runs: [{ text, bold: false, italic: false, size: stats.bodySize }],
// //           lines: [],
// //           firstOfPage: i === 0,
// //         });
// //       });
// //       prev = null;
// //       return;
// //     }

// //     const { line } = block;
// //     const next = blocks[index + 1]?.type === "line" ? blocks[index + 1].line : null;
// //     const marker = matchMarker(line.text);
// //     const headingLevel = classifyHeading(line, prev, next, marker, stats);

// //     const gap = prev && prev.page === line.page ? line.yTop - prev.yTop : null;
// //     const sameFlow = gap !== null && gap > 0;

// //     let startNew = true;

// //     if (current) {
// //       if (headingLevel) {
// //         startNew = !(
// //           current.heading === headingLevel &&
// //           sameFlow &&
// //           gap <= line.size * 1.6
// //         );
// //       } else if (current.heading || marker) {
// //         startNew = true;
// //       } else if (current.list) {
// //         startNew = !(
// //           sameFlow &&
// //           gap <= stats.pitch * 1.45 &&
// //           line.left >= current.firstLeft - 2
// //         );
// //       } else if (sameFlow) {
// //         const indentJump = line.left - prev.left > 8 && prev.left <= stats.textLeft + 4;
// //         const shortPrevLine =
// //           prev.right < stats.textRight - 0.15 * (stats.textRight - stats.textLeft);
// //         const sizeChange = Math.abs(line.size - prev.size) > 0.2 * stats.bodySize;

// //         startNew =
// //           gap > stats.pitch * 1.45 ||
// //           indentJump ||
// //           sizeChange ||
// //           (shortPrevLine && endsSentence(prev.text));
// //       } else {
// //         // New page or new column: join only if the sentence clearly continues
// //         const pageBreakAllowed = !options.preservePageBreaks || prev?.page === line.page;
// //         const continues =
// //           !endsSentence(current.lastText) &&
// //           (startsLowercase(line.text) || /[,-]$/.test(current.lastText.trim()));
// //         startNew = !(pageBreakAllowed && continues);
// //       }
// //     }

// //     if (startNew) {
// //       flush();
// //       current = {
// //         kind: "paragraph",
// //         page: line.page,
// //         heading: headingLevel,
// //         list: marker?.type ?? null,
// //         marker,
// //         firstLeft: line.left,
// //         runs: [],
// //         lines: [],
// //         lastText: "",
// //         firstOfPage: !prev || prev.page !== line.page,
// //       };
// //     }

// //     appendLine(current, line, stats);
// //     prev = line;
// //   });

// //   flush();
// //   return elements;
// // };

// // /* -------------------------------------------------------------------------- */
// // /*  Step 4: build the Word document                                           */
// // /* -------------------------------------------------------------------------- */

// // const makeTextRuns = (runs, stats, isHeading) => {
// //   const out = [];

// //   runs.forEach((run) => {
// //     const parts = run.text.split("\t");
// //     const children = [];
// //     parts.forEach((part, i) => {
// //       if (i > 0) children.push(new Tab());
// //       if (part) children.push(part);
// //     });
// //     if (!children.length) return;

// //     const options = { children };
// //     if (!isHeading && run.bold) options.bold = true;
// //     if (run.italic) options.italics = true;

// //     if (!isHeading && stats.bodySize && run.size) {
// //       const ratio = run.size / stats.bodySize;
// //       if (Math.abs(ratio - 1) > 0.15) {
// //         options.size = clamp(Math.round((BODY_SIZE_HALF_POINTS / 2) * ratio * 2), 12, 72);
// //       }
// //     }

// //     out.push(new TextRun(options));
// //   });

// //   return out;
// // };

// // const alignmentFor = (lines, stats) => {
// //   if (!lines.length) return undefined;

// //   const width = stats.textRight - stats.textLeft;

// //   const centered = lines.every((l) => {
// //     const center = (l.left + l.right) / 2;
// //     return (
// //       Math.abs(center - l.pageWidth / 2) < l.pageWidth * 0.03 &&
// //       l.left - stats.textLeft > l.pageWidth * 0.06 &&
// //       stats.textRight - l.right > l.pageWidth * 0.06
// //     );
// //   });
// //   if (centered) return AlignmentType.CENTER;

// //   if (
// //     lines.length === 1 &&
// //     lines[0].right >= stats.textRight - 4 &&
// //     lines[0].left - stats.textLeft > 0.4 * width
// //   ) {
// //     return AlignmentType.RIGHT;
// //   }

// //   return undefined;
// // };

// // const indentFor = (lines, stats) => {
// //   if (!lines.length) return undefined;

// //   const baseLeft = lines.length > 1 ? lines[1].left : lines[0].left;
// //   const left = baseLeft - stats.textLeft;
// //   const firstLine = lines.length > 1 ? lines[0].left - baseLeft : 0;

// //   const indent = {};
// //   if (left >= 12) indent.left = toTwips(Math.min(left, 240));
// //   if (firstLine >= 8) indent.firstLine = toTwips(Math.min(firstLine, 72));

// //   return Object.keys(indent).length ? indent : undefined;
// // };

// // const toParagraph = (element, stats, pageBreakBefore) => {
// //   const isHeading = Boolean(element.heading);
// //   const children = makeTextRuns(element.runs, stats, isHeading);
// //   const base = { children, pageBreakBefore: pageBreakBefore || undefined };

// //   if (element.plain) return new Paragraph(base);

// //   if (isHeading) {
// //     return new Paragraph({
// //       ...base,
// //       heading: [null, HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][
// //         element.heading
// //       ],
// //       alignment: alignmentFor(element.lines, stats),
// //     });
// //   }

// //   if (element.list === "bullet") {
// //     const offset = element.firstLeft - (stats.listLeft || element.firstLeft);
// //     const level = clamp(Math.round(offset / 18), 0, 2);
// //     return new Paragraph({ ...base, numbering: { reference: "bullets", level } });
// //   }

// //   if (element.list === "numbered") {
// //     return new Paragraph({ ...base, indent: { left: 720, hanging: 360 } });
// //   }

// //   const alignment = alignmentFor(element.lines, stats);

// //   return new Paragraph({
// //     ...base,
// //     alignment,
// //     indent: alignment ? undefined : indentFor(element.lines, stats),
// //   });
// // };

// // const toTable = (block, stats, contentWidth) => {
// //   const starts = block.starts;
// //   const rightEdge = Math.max(...block.rows.map((r) => r.right));

// //   const rawWidths = starts.map((start, i) =>
// //     Math.max(24, (i < starts.length - 1 ? starts[i + 1] : rightEdge) - start)
// //   );
// //   const total = rawWidths.reduce((a, b) => a + b, 0);
// //   const widths = rawWidths.map((w) => Math.max(400, Math.round((w / total) * contentWidth)));
// //   const tableWidth = widths.reduce((a, b) => a + b, 0);

// //   const rows = block.rows.map(
// //     (row) =>
// //       new TableRow({
// //         cantSplit: true,
// //         children: row.segments.map((segment, i) => {
// //           const text = segment.runs.map((r) => r.text).join("").trim();
// //           const isNumber = /^[\d.,%$€£₹()\-\s]+$/.test(text);

// //           return new TableCell({
// //             width: { size: widths[i], type: WidthType.DXA },
// //             margins: { top: 40, bottom: 40, left: 80, right: 80 },
// //             children: [
// //               new Paragraph({
// //                 children: makeTextRuns(segment.runs, stats, false),
// //                 alignment: isNumber ? AlignmentType.RIGHT : undefined,
// //                 spacing: { after: 0 },
// //               }),
// //             ],
// //           });
// //         }),
// //       })
// //   );

// //   return new Table({
// //     width: { size: tableWidth, type: WidthType.DXA },
// //     columnWidths: widths,
// //     rows,
// //   });
// // };

// // const buildDocument = ({ elements, stats, firstPage, title, options }) => {
// //   const marginLeft = clamp(stats.textLeft || 72, 36, 108);
// //   const marginRight = clamp(firstPage.width - (stats.textRight || 540), 36, 108);
// //   const contentWidth = toTwips(firstPage.width - marginLeft - marginRight);

// //   const children = [];
// //   let lastPage = -1;

// //   elements.forEach((element) => {
// //     const isNewPage = element.page !== lastPage;
// //     const breakBefore = options.preservePageBreaks && isNewPage && lastPage !== -1;
// //     lastPage = element.page;

// //     if (element.type === "table") {
// //       if (breakBefore) children.push(new Paragraph({ pageBreakBefore: true }));
// //       children.push(toTable(element, stats, contentWidth));
// //       children.push(new Paragraph({ spacing: { after: 120 } })); // keeps tables apart
// //       return;
// //     }

// //     if (!element.runs.some((r) => r.text.trim())) return;
// //     children.push(toParagraph(element, stats, breakBefore));
// //   });

// //   const bulletLevel = (level, symbol) => ({
// //     level,
// //     format: LevelFormat.BULLET,
// //     text: symbol,
// //     alignment: AlignmentType.LEFT,
// //     style: { paragraph: { indent: { left: 720 * (level + 1), hanging: 360 } } },
// //   });

// //   const headingStyle = (id, name, size, outlineLevel) => ({
// //     id,
// //     name,
// //     basedOn: "Normal",
// //     next: "Normal",
// //     quickFormat: true,
// //     run: { font: BODY_FONT, size, bold: true },
// //     paragraph: { spacing: { before: 240, after: 120 }, outlineLevel },
// //   });

// //   return new Document({
// //     creator: "PDF to Word Converter",
// //     title: title || undefined,
// //     styles: {
// //       default: {
// //         document: {
// //           run: { font: BODY_FONT, size: BODY_SIZE_HALF_POINTS },
// //           paragraph: { spacing: { after: 120, line: 276 } },
// //         },
// //       },
// //       paragraphStyles: [
// //         headingStyle("Heading1", "Heading 1", HEADING_SIZES[1], 0),
// //         headingStyle("Heading2", "Heading 2", HEADING_SIZES[2], 1),
// //         headingStyle("Heading3", "Heading 3", HEADING_SIZES[3], 2),
// //       ],
// //     },
// //     numbering: {
// //       config: [
// //         {
// //           reference: "bullets",
// //           levels: [bulletLevel(0, "•"), bulletLevel(1, "◦"), bulletLevel(2, "▪")],
// //         },
// //       ],
// //     },
// //     sections: [
// //       {
// //         properties: {
// //           page: {
// //             size: { width: toTwips(firstPage.width), height: toTwips(firstPage.height) },
// //             margin: {
// //               top: toTwips(72),
// //               bottom: toTwips(72),
// //               left: toTwips(marginLeft),
// //               right: toTwips(marginRight),
// //             },
// //           },
// //         },
// //         children: children.length ? children : [new Paragraph("")],
// //       },
// //     ],
// //   });
// // };

// // /* -------------------------------------------------------------------------- */
// // /*  Public API                                                                */
// // /* -------------------------------------------------------------------------- */

// // const outputName = (name) => {
// //   const base = name.replace(/\.pdf$/i, "").replace(/[\\/:*?"<>|]+/g, "_").trim();
// //   return `${base || "document"}.docx`;
// // };

// // /**
// //  * Converts a PDF to a Word file and reports anything that needs review.
// //  * @returns {Promise<{ file: File, pageCount: number, warnings: string[] }>}
// //  */
// // export const convertPdfToWordDetailed = async (file, options = {}, onProgress) => {
// //   const opts = { ...DEFAULT_OPTIONS, ...options };
// //   const report = (value) => onProgress?.(clamp(Math.round(value), 0, 100));

// //   if (!file || typeof file.name !== "string") {
// //     throw new Error("Please select a valid PDF file.");
// //   }
// //   if (file.size === 0) throw new Error("The selected file is empty.");
// //   if (file.size > MAX_FILE_SIZE) {
// //     throw new Error(
// //       `This file is ${(file.size / 1048576).toFixed(0)} MB. The limit is ${MAX_FILE_SIZE / 1048576} MB.`
// //     );
// //   }
// // let loadingTask;

// //   const data = new Uint8Array(await file.arrayBuffer());
// //   const header = new TextDecoder().decode(data.slice(0, 1024));
// //   if (!header.includes("%PDF-")) {
// //     throw new Error("This file is not a valid PDF.");
// //   }

// //   throwIfAborted(opts.signal);
// //   report(1);

// //     let pdf;
// //     try {
// //   loadingTask = pdfjsLib.getDocument({
// //     data:data.slice(),
// //     password: opts.password,
// //     isEvalSupported: false,
// //     fontExtraProperties: true,
// //   });

// //   pdf = await loadingTask.promise;
// // } catch (error) {
// //   throw mapPdfError(error);
// // }finally {
// //   await loadingTask?.destroy();
// // }
// //   try {
// //     pdf = await pdfjsLib.getDocument({
// //       data,
// //       password: opts.password,
// //       isEvalSupported: false, // safer under strict Content Security Policy
// //       fontExtraProperties: true,
// //     }).promise;
// //   } catch (error) {
// //     throw mapPdfError(error);
// //   }

// //   try {
// //     const pageCount = pdf.numPages;
// //     if (pageCount > MAX_PAGES) {
// //       throw new Error(`This PDF has ${pageCount} pages. The limit is ${MAX_PAGES}.`);
// //     }

// //     const warnings = [];
// //     const pages = [];
// //     const fontCache = new Map();
// //     let emptyPages = 0;
// //     let ocrPages = 0;

// //     // Extraction takes most of the time, so it gets 0 to 85% of the progress
// //     for (let n = 1; n <= pageCount; n += 1) {
// //       throwIfAborted(opts.signal);

// //       const page = await pdf.getPage(n);
// //       try {
// //         const extracted = await extractPage(page, n - 1, fontCache);

// // // OCR for pages with little or no selectable text
// // if (extracted.charCount < MIN_CHARS_FOR_TEXT_PAGE) {
// //   extracted.ocrParagraphs = await runOcr(page, n);

// //   if (extracted.ocrParagraphs.length === 0) {
// //     console.warn(`No OCR text detected on PDF page ${n}`);
// //   }

// //   if (extracted.ocrParagraphs.length > 0) {
// //     ocrPages += 1;
// //   } else {
// //     emptyPages += 1;
// //   }
// // }

// // // Render and store the page image
// // extracted.image = await renderPageImage(page);

// // pages.push(extracted);      } finally {
// //         page.cleanup();
// //       }

// //       report(2 + (n / pageCount) * 83);
// //       await yieldToUi();
// //     }

// // if (emptyPages === pageCount) {
// //   const err = new Error(
// //     "No readable text could be extracted from this PDF, even after OCR."
// //   );
// //   err.code = "NO_TEXT_LAYER";
// //   throw err;
// // }

// // if (emptyPages > 0) {
// //   warnings.push(
// //     `${emptyPages} page(s) had no readable text, even after OCR.`
// //   );
// // }

// // if (ocrPages > 0) {
// //   warnings.push(
// //     `${ocrPages} page(s) were processed using OCR. Review recognition accuracy.`
// //   );
// // }
// //     if (opts.removeHeadersFooters) {
// //       const removed = removeHeadersAndFooters(pages);
// //       if (removed > 0) {
// //         warnings.push(`Removed ${removed} repeated header, footer or page number line(s).`);
// //       }
// //     }

// //     report(88);
// //     await yieldToUi();

// //     const stats = analyseDocument(pages);
// //     const blocks = pages.flatMap((page) => structurePage(page));
// //     const elements = buildElements(blocks, stats, opts);

// //     if (!elements.length) {
// //       throw new Error("No readable content was found in this PDF.");
// //     }

// //     const metadata = await pdf.getMetadata().catch(() => null);
// //     const title = metadata?.info?.Title?.trim();

// //     report(93);

// //     const document = buildDocument({
// //       elements,
// //       stats,
// //       firstPage: pages[0],
// //       title,
// //       options: opts,
// //     });

// //     const blob = await Packer.toBlob(document);
// //     report(100);

// //     warnings.push(
// //       "Images, drawings and exact page layout are not carried over. Review the result before sharing it."
// //     );

// //     return {
// //       file: new File([blob], outputName(file.name), {
// //         type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
// //       }),
// //       pageCount,
// //       warnings,
// //     };
// //   } finally {
// //    await loadingTask.destroy();
// //   }
// // };

// // /**
// //  * Simple helper: returns only the .docx File.
// //  * Same shape as your compressFileToZip service: (file, options, onProgress).
// //  */
// // export const convertPdfToWord = async (file, options, onProgress) => {
// //   const { file: docx } = await convertPdfToWordDetailed(file, options, onProgress);
// //   return docx;
// // };
// /**
//  * pdfToWord.js
//  *
//  * Converts a PDF into an editable Word (.docx) file, fully in the browser.
//  *
//  * Install:   npm i pdfjs-dist docx
//  *
//  * Usage:
//  *   import { convertPdfToWord } from "../services/pdfToWord";
//  *   const docx = await convertPdfToWord(file, { password }, (p) => setProgress(p));
//  *
//  * Text pages are rebuilt as real Word content (headings, paragraphs, lists,
//  * tables). Scanned pages go through OCR (./ocrService). Pages that have no
//  * readable text but do have content (photos, drawings) are inserted as
//  * images, so nothing is silently lost. Blank pages are skipped.
//  */

// import * as pdfjsLib from "pdfjs-dist";
// import {
//   AlignmentType,
//   Document,
//   HeadingLevel,
//   ImageRun,
//   LevelFormat,
//   Packer,
//   Paragraph,
//   Tab,
//   Table,
//   TableCell,
//   TableRow,
//   TextRun,
//   WidthType,
// } from "docx";
// import { recognizePdfPage } from "./ocrService";

// // Vite/Webpack 5 resolve this URL at build time. For pdfjs-dist v3 use ".min.js".
// pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
//   "pdfjs-dist/build/pdf.worker.min.mjs",
//   import.meta.url
// ).toString();

// /* -------------------------------------------------------------------------- */
// /*  Configuration                                                             */
// /* -------------------------------------------------------------------------- */

// const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
// const MAX_PAGES = 300;
// const MIN_CHARS_FOR_TEXT_PAGE = 10;

// const OCR_SCALE = 3; // 216 dpi: a good balance of accuracy and speed
// const IMAGE_SCALE = 1.5; // for pages inserted as images
// const BLANK_PIXEL_RATIO = 0.002; // under 0.2% non-white pixels = blank page

// const DEFAULT_OPTIONS = {
//   password: undefined, // for protected PDFs
//   preservePageBreaks: false, // false = reflowable, easier to edit
//   removeHeadersFooters: true,
//   ocr: true, // read scanned pages with ./ocrService. Set false to disable
//   imagesForEmptyPages: true, // insert pages with no text as images
//   signal: undefined, // AbortSignal to cancel
// };

// const BODY_FONT = "Calibri";
// const BODY_SIZE_HALF_POINTS = 22; // 11 pt
// const HEADING_SIZES = { 1: 36, 2: 30, 3: 26 }; // half-points

// const BOLD_RE = /bold|black|heavy|semibold|demi/i;
// const ITALIC_RE = /italic|oblique/i;
// const PAGE_NUMBER_RE =
//   /^(?:page\s*)?\d{1,3}(?:\s*(?:of|\/)\s*\d{1,3})?$|^[-–—]\s*\d{1,3}\s*[-–—]$/i;
// const BULLET_RE =
//   /^(?:[•●○◦▪■□◆◇‣∙·▫➢➤✓✔*–—-]\s+|[\uF000-\uF0FF]\s*)/;
// const NUMBERED_RE =
//   /^(?:\(?\d{1,3}[.)]|\(?[a-z][.)]|\(?(?:i{1,3}|iv|vi{0,3}|ix|x)[.)])\s+(?=\S)/;
// const LIGATURES = {
//   "\uFB00": "ff", "\uFB01": "fi", "\uFB02": "fl", "\uFB03": "ffi",
//   "\uFB04": "ffl", "\uFB05": "st", "\uFB06": "st",
// };

// /* -------------------------------------------------------------------------- */
// /*  Small helpers                                                             */
// /* -------------------------------------------------------------------------- */

// const toTwips = (points) => Math.round(points * 20);
// const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
// const yieldToUi = () => new Promise((resolve) => setTimeout(resolve, 0));

// const cleanText = (text) =>
//   text
//     .replace(/[\uFB00-\uFB06]/g, (c) => LIGATURES[c])
//     // control characters are illegal in Word's XML
//     .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\uFFFE\uFFFF]/g, "")
//     .replace(/\u00A0/g, " ");

// const endsSentence = (text) => /[.!?:;。]["”’')\]]*$/.test(text.trim());
// const startsLowercase = (text) => /^\p{Ll}/u.test(text.trim());

// const percentile = (sorted, p) =>
//   sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] : 0;

// const median = (values) => {
//   if (!values.length) return 0;
//   const sorted = [...values].sort((a, b) => a - b);
//   return sorted[Math.floor(sorted.length / 2)];
// };

// const throwIfAborted = (signal) => {
//   if (signal?.aborted) {
//     throw new DOMException("Conversion cancelled.", "AbortError");
//   }
// };

// const mapPdfError = (error) => {
//   if (error?.name === "PasswordException") {
//     const incorrect = error.code === 2;
//     const err = new Error(
//       incorrect
//         ? "The password is incorrect. Try again."
//         : "This PDF is password protected. Enter the password to continue."
//     );
//     err.code = incorrect ? "PASSWORD_INCORRECT" : "PASSWORD_REQUIRED";
//     return err;
//   }
//   if (error?.name === "InvalidPDFException") {
//     return new Error("This file is not a valid PDF, or it is damaged.");
//   }
//   if (error?.name === "AbortError") return error;
//   return new Error(`Unable to read this PDF: ${error?.message || "unknown error"}`, {
//     cause: error,
//   });
// };

// /* -------------------------------------------------------------------------- */
// /*  Page rendering (OCR and image fallback)                                   */
// /* -------------------------------------------------------------------------- */

// const renderPageToCanvas = async (page, scale) => {
//   const viewport = page.getViewport({ scale });
//   const canvas = document.createElement("canvas");
//   canvas.width = Math.ceil(viewport.width);
//   canvas.height = Math.ceil(viewport.height);

//   const context = canvas.getContext("2d", { willReadFrequently: true });
//   // White background, so transparent pages do not turn black in the PNG
//   context.fillStyle = "#ffffff";
//   context.fillRect(0, 0, canvas.width, canvas.height);

//   await page.render({ canvasContext: context, viewport, canvas }).promise;
//   return canvas;
// };

// const releaseCanvas = (canvas) => {
//   canvas.width = 0;
//   canvas.height = 0;
// };

// const isBlankCanvas = (canvas) => {
//   const { width, height } = canvas;
//   if (!width || !height) return true;

//   const { data } = canvas.getContext("2d").getImageData(0, 0, width, height);
//   let inked = 0;

//   // Check every 4th pixel, which is plenty to tell blank from not blank
//   for (let i = 0; i < data.length; i += 16) {
//     if (data[i] < 245 || data[i + 1] < 245 || data[i + 2] < 245) inked += 1;
//   }

//   return inked / (data.length / 16) < BLANK_PIXEL_RATIO;
// };

// const canvasToPng = async (canvas) => {
//   const blob = await new Promise((resolve, reject) => {
//     canvas.toBlob(
//       (result) => (result ? resolve(result) : reject(new Error("Unable to render page image."))),
//       "image/png"
//     );
//   });
//   return new Uint8Array(await blob.arrayBuffer());
// };

// // OCR engines often return one line per row without blank lines between
// // paragraphs. This rebuilds paragraph breaks from line lengths.
// const paragraphsFromLines = (text) => {
//   const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
//   if (!lines.length) return [];

//   const longest = Math.max(...lines.map((l) => l.length));
//   const paragraphs = [];
//   let current = [];

//   lines.forEach((line, i) => {
//     current.push(line);
//     const isLast = i === lines.length - 1;
//     const shortLine = line.length < longest * 0.75;
//     if (isLast || (shortLine && endsSentence(line))) {
//       paragraphs.push(current.join(" "));
//       current = [];
//     }
//   });

//   return paragraphs;
// };

// const runOcr = async (page) => {
//   const canvas = await renderPageToCanvas(page, OCR_SCALE);

//   try {
//     const raw = await recognizePdfPage(canvas);
//     const text = cleanText(Array.isArray(raw) ? raw.join("\n") : String(raw ?? ""))
//       .replace(/\r\n?/g, "\n")
//       .trim();

//     if (!text) return [];

//     // Real paragraph breaks (blank lines) win when the engine provides them
//     if (/\n\s*\n/.test(text)) {
//       return text
//         .split(/\n\s*\n/)
//         .map((block) => block.replace(/\s*\n\s*/g, " ").trim())
//         .filter(Boolean);
//     }

//     return paragraphsFromLines(text);
//   } finally {
//     releaseCanvas(canvas);
//   }
// };

// /* -------------------------------------------------------------------------- */
// /*  Step 1: extract positioned text from each page                            */
// /* -------------------------------------------------------------------------- */

// const resolveFontStyle = (page, fontName, cache) => {
//   if (cache.has(fontName)) return cache.get(fontName);

//   let style = {
//     bold: BOLD_RE.test(fontName),
//     italic: ITALIC_RE.test(fontName),
//   };

//   try {
//     if (page.commonObjs.has(fontName)) {
//       const font = page.commonObjs.get(fontName);
//       const names = `${font?.name ?? ""} ${font?.fallbackName ?? ""}`;
//       style = {
//         bold: Boolean(font?.bold || font?.black) || BOLD_RE.test(names),
//         italic: Boolean(font?.italic) || ITALIC_RE.test(names),
//       };
//       cache.set(fontName, style); // cache only when the real font was found
//     }
//   } catch {
//     /* fall back to the name-based guess */
//   }

//   return style;
// };

// const sameStyle = (a, b) =>
//   a.bold === b.bold && a.italic === b.italic && Math.abs(a.size - b.size) < 0.6;

// const pushRun = (runs, run) => {
//   const last = runs[runs.length - 1];
//   if (last && sameStyle(last, run)) last.text += run.text;
//   else runs.push({ ...run });
// };

// const trimRuns = (runs) => {
//   while (runs.length && !runs[0].text.trimStart()) runs.shift();
//   while (runs.length && !runs[runs.length - 1].text.trimEnd()) runs.pop();
//   if (runs.length) {
//     runs[0].text = runs[0].text.trimStart();
//     runs[runs.length - 1].text = runs[runs.length - 1].text.trimEnd();
//   }
//   return runs;
// };

// const dominantSize = (runs) => {
//   const weights = new Map();
//   runs.forEach((r) => {
//     const key = Math.round(r.size * 2) / 2;
//     weights.set(key, (weights.get(key) || 0) + r.text.trim().length);
//   });
//   let best = 0;
//   let bestWeight = -1;
//   weights.forEach((weight, size) => {
//     if (weight > bestWeight) {
//       best = size;
//       bestWeight = weight;
//     }
//   });
//   return best || runs[0]?.size || 10;
// };

// // Splits one visual line into segments wherever there is a wide horizontal gap
// // (table cells and column gutters).
// const buildSegments = (items) => {
//   const segments = [];
//   let current = null;
//   let prev = null;

//   for (const item of items) {
//     const gap = prev ? item.x - (prev.x + prev.width) : 0;
//     const threshold = Math.max(9, 1.6 * Math.max(item.size, prev?.size ?? 0));

//     if (!current || gap > threshold) {
//       current = { x: item.x, right: item.x, runs: [] };
//       segments.push(current);
//     }

//     let text = item.text;
//     const lastRun = current.runs[current.runs.length - 1];
//     if (
//       lastRun &&
//       gap > 0.15 * item.size &&
//       !/\s$/.test(lastRun.text) &&
//       !/^\s/.test(text)
//     ) {
//       text = ` ${text}`;
//     }

//     pushRun(current.runs, {
//       text,
//       bold: item.bold,
//       italic: item.italic,
//       size: item.size,
//     });
//     current.right = Math.max(current.right, item.x + item.width);
//     prev = item;
//   }

//   return segments
//     .map((seg) => {
//       trimRuns(seg.runs);
//       return { ...seg, size: dominantSize(seg.runs) };
//     })
//     .filter((seg) => seg.runs.length);
// };

// const makeLine = (segments, yTop, pageIndex, pageWidth) => {
//   const runs = [];

//   segments.forEach((seg, i) => {
//     if (i > 0) {
//       const gap = seg.x - segments[i - 1].right;
//       const separator = gap >= 4 * seg.size ? "\t" : " ";
//       pushRun(runs, { text: separator, bold: false, italic: false, size: seg.size });
//     }
//     seg.runs.forEach((r) => pushRun(runs, r));
//   });

//   const visible = runs.filter((r) => r.text.trim());

//   return {
//     segments,
//     runs,
//     text: runs.map((r) => r.text).join(""),
//     yTop,
//     page: pageIndex,
//     pageWidth,
//     left: segments[0].x,
//     right: segments[segments.length - 1].right,
//     size: dominantSize(runs),
//     bold: visible.length > 0 && visible.every((r) => r.bold),
//   };
// };

// const extractPage = async (page, pageIndex, fontCache) => {
//   const viewport = page.getViewport({ scale: 1 });

//   // Loading the operator list makes the real font names available. It also
//   // tells us whether the page paints any images.
//   let hasImages = false;
//   try {
//     const { OPS } = pdfjsLib;
//     const operatorList = await page.getOperatorList();
//     const imageOps = new Set([
//       OPS.paintImageXObject,
//       OPS.paintInlineImageXObject,
//       OPS.paintImageMaskXObject,
//       OPS.paintJpegXObject,
//     ]);
//     hasImages = operatorList.fnArray.some((fn) => imageOps.has(fn));
//   } catch {
//     /* not critical */
//   }

//   const content = await page.getTextContent();
//   const items = [];

//   for (const raw of content.items) {
//     if (!("str" in raw) || !raw.str) continue;

//     // Convert to viewport space so rotated pages are handled correctly
//     const t = pdfjsLib.Util.transform(viewport.transform, raw.transform);
//     const size = Math.hypot(t[2], t[3]) || raw.height;

//     // Skip rotated text (watermarks, side labels) and invalid sizes
//     if (!size || Math.abs(t[1]) > 0.5 * Math.abs(t[0])) continue;

//     const x = t[4];
//     const yTop = t[5];
//     if (x < -5 || x > viewport.width + 5 || yTop < 0 || yTop > viewport.height) continue;

//     const text = cleanText(raw.str);
//     if (!text) continue;

//     const { bold, italic } = resolveFontStyle(page, raw.fontName, fontCache);
//     items.push({ text, x, yTop, size, width: raw.width * viewport.scale, bold, italic });
//   }

//   // Group items into visual lines, top to bottom
//   items.sort((a, b) => a.yTop - b.yTop || a.x - b.x);

//   const grouped = [];
//   for (const item of items) {
//     const last = grouped[grouped.length - 1];
//     const tolerance = last ? Math.max(2, 0.45 * Math.max(item.size, last.size)) : 0;

//     if (last && Math.abs(item.yTop - last.yTop) <= tolerance) {
//       last.items.push(item);
//       if (item.size > last.size) {
//         last.size = item.size;
//         last.yTop = item.yTop;
//       }
//     } else {
//       grouped.push({ yTop: item.yTop, size: item.size, items: [item] });
//     }
//   }

//   const lines = [];
//   for (const group of grouped) {
//     group.items.sort((a, b) => a.x - b.x);
//     const segments = buildSegments(group.items);
//     if (!segments.length) continue;
//     lines.push(makeLine(segments, group.yTop, pageIndex, viewport.width));
//   }
//   lines.sort((a, b) => a.yTop - b.yTop);

//   const charCount = lines.reduce((sum, l) => sum + l.text.replace(/\s/g, "").length, 0);

//   return {
//     index: pageIndex,
//     width: viewport.width,
//     height: viewport.height,
//     lines,
//     charCount,
//     hasImages,
//     ocrParagraphs: null,
//     image: null, // PNG bytes, set only for pages inserted as images
//   };
// };

// /* -------------------------------------------------------------------------- */
// /*  Step 2: clean up and analyse the whole document                           */
// /* -------------------------------------------------------------------------- */

// const removeHeadersAndFooters = (pages) => {
//   if (pages.length < 2) return 0;

//   const zone = 0.09; // top and bottom 9% of the page
//   const inZone = (line, page) =>
//     line.yTop < page.height * zone || line.yTop > page.height * (1 - zone);
//   const keyOf = (line) =>
//     line.text.toLowerCase().replace(/\d+/g, "#").replace(/\s+/g, " ").trim();

//   const counts = new Map();
//   pages.forEach((page) => {
//     const seen = new Set();
//     page.lines.forEach((line) => {
//       if (!inZone(line, page)) return;
//       const key = keyOf(line);
//       if (!seen.has(key)) {
//         seen.add(key);
//         counts.set(key, (counts.get(key) || 0) + 1);
//       }
//     });
//   });

//   const threshold = Math.max(2, Math.ceil(pages.length * 0.5));
//   let removed = 0;

//   pages.forEach((page) => {
//     page.lines = page.lines.filter((line) => {
//       if (!inZone(line, page)) return true;
//       const isPageNumber = PAGE_NUMBER_RE.test(line.text.trim());
//       const isRepeated = pages.length >= 3 && counts.get(keyOf(line)) >= threshold;
//       if (isPageNumber || isRepeated) {
//         removed += 1;
//         return false;
//       }
//       return true;
//     });
//   });

//   return removed;
// };

// const analyseDocument = (pages) => {
//   const lines = pages.flatMap((p) => p.lines);

//   // Body font size = the size that carries the most characters
//   const weights = new Map();
//   lines.forEach((l) => {
//     const key = Math.round(l.size * 2) / 2;
//     weights.set(key, (weights.get(key) || 0) + l.text.length);
//   });
//   let bodySize = 11;
//   let bestWeight = -1;
//   weights.forEach((weight, size) => {
//     if (weight > bestWeight) {
//       bodySize = size;
//       bestWeight = weight;
//     }
//   });

//   const bodyLines = lines.filter((l) => Math.abs(l.size - bodySize) <= 0.6);
//   const reference = bodyLines.length ? bodyLines : lines;
//   const lefts = reference.map((l) => l.left).sort((a, b) => a - b);
//   const rights = reference.map((l) => l.right).sort((a, b) => a - b);

//   // Typical distance between consecutive lines of the same paragraph
//   const pitches = [];
//   pages.forEach((page) => {
//     for (let i = 1; i < page.lines.length; i += 1) {
//       const gap = page.lines[i].yTop - page.lines[i - 1].yTop;
//       if (gap > 0.8 * bodySize && gap < 2.2 * bodySize) pitches.push(gap);
//     }
//   });

//   const bulletLefts = lines
//     .filter((l) => BULLET_RE.test(l.text))
//     .map((l) => l.left);

//   return {
//     bodySize,
//     textLeft: percentile(lefts, 0.08),
//     textRight: percentile(rights, 0.92),
//     pitch: median(pitches) || bodySize * 1.2,
//     listLeft: bulletLefts.length ? Math.min(...bulletLefts) : 0,
//   };
// };

// /* -------------------------------------------------------------------------- */
// /*  Step 3: detect tables and columns, then build paragraphs                  */
// /* -------------------------------------------------------------------------- */

// const structurePage = (page) => {
//   const blocks = [];

//   if (page.ocrParagraphs?.length) {
//     blocks.push({ type: "ocr", paragraphs: page.ocrParagraphs, page: page.index });
//     return blocks;
//   }

//   if (page.image) {
//     blocks.push({
//       type: "image",
//       data: page.image,
//       page: page.index,
//       pageWidth: page.width,
//       pageHeight: page.height,
//     });
//     return blocks;
//   }

//   const { lines } = page;
//   let i = 0;

//   while (i < lines.length) {
//     const line = lines[i];

//     if (line.segments.length >= 2) {
//       const starts = line.segments.map((s) => s.x);
//       let j = i + 1;
//       while (
//         j < lines.length &&
//         lines[j].segments.length === starts.length &&
//         lines[j].segments.every((s, k) => Math.abs(s.x - starts[k]) <= 12)
//       ) {
//         j += 1;
//       }

//       const rows = lines.slice(i, j);

//       if (rows.length >= 2) {
//         const lengths = rows.flatMap((r) =>
//           r.segments.map((s) => s.runs.map((run) => run.text).join("").length)
//         );
//         const averageLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;

//         if (rows.length >= 3 && averageLength >= 35) {
//           // Long text in side-by-side blocks = newspaper columns.
//           // Emit the left column first, then the next one.
//           for (let k = 0; k < starts.length; k += 1) {
//             rows.forEach((row) => {
//               blocks.push({
//                 type: "line",
//                 line: makeLine([row.segments[k]], row.yTop, row.page, row.pageWidth),
//               });
//             });
//           }
//         } else {
//           blocks.push({ type: "table", rows, starts, page: page.index, width: page.width });
//         }

//         i = j;
//         continue;
//       }
//     }

//     blocks.push({ type: "line", line });
//     i += 1;
//   }

//   return blocks;
// };

// const classifyHeading = (line, prev, next, marker, stats) => {
//   if (marker || line.text.trim().length < 2) return 0;

//   const ratio = line.size / stats.bodySize;

//   if (ratio >= 1.15 && line.text.length <= 160) {
//     return ratio >= 1.6 ? 1 : ratio >= 1.3 ? 2 : 3;
//   }

//   // Short bold line standing on its own = section heading
//   if (
//     line.bold &&
//     ratio >= 0.92 &&
//     ratio < 1.15 &&
//     line.segments.length === 1 &&
//     line.text.length <= 80 &&
//     !/[.,;]$/.test(line.text.trim())
//   ) {
//     const spaceBefore =
//       !prev || prev.page !== line.page || line.yTop - prev.yTop > stats.pitch * 1.2;
//     const spaceAfter =
//       !next || next.page !== line.page || next.yTop - line.yTop > stats.pitch * 1.2;
//     if (spaceBefore && spaceAfter) return 3;
//   }

//   return 0;
// };

// const matchMarker = (text) => {
//   const bullet = text.match(BULLET_RE);
//   if (bullet) return { type: "bullet", length: bullet[0].length };
//   const numbered = text.match(NUMBERED_RE);
//   if (numbered) return { type: "numbered", length: numbered[0].length };
//   return null;
// };

// // Removes the first `length` characters from the runs (used for bullet markers)
// const stripLeading = (runs, length) => {
//   const copy = runs.map((r) => ({ ...r }));
//   let remaining = length;
//   while (remaining > 0 && copy.length) {
//     if (copy[0].text.length <= remaining) {
//       remaining -= copy[0].text.length;
//       copy.shift();
//     } else {
//       copy[0].text = copy[0].text.slice(remaining);
//       remaining = 0;
//     }
//   }
//   if (copy[0]) copy[0].text = copy[0].text.trimStart();
//   return copy;
// };

// // "1. Title" becomes "1.<tab>Title" so the hanging indent lines up
// const tabAfterNumber = (runs, length) => {
//   const copy = runs.map((r) => ({ ...r }));
//   if (copy[0] && copy[0].text.length >= length) {
//     copy[0].text = `${copy[0].text.slice(0, length).trimEnd()}\t${copy[0].text.slice(length)}`;
//   }
//   return copy;
// };

// const appendLine = (paragraph, line) => {
//   let runs = line.runs.map((r) => ({ ...r }));

//   if (paragraph.lines.length === 0) {
//     const marker = paragraph.marker;
//     if (marker?.type === "bullet") runs = stripLeading(runs, marker.length);
//     if (marker?.type === "numbered") runs = tabAfterNumber(runs, marker.length);
//   }

//   if (paragraph.runs.length) {
//     const last = paragraph.runs[paragraph.runs.length - 1];
//     const joinsHyphen =
//       /\p{L}-$/u.test(last.text) && startsLowercase(line.text) && !paragraph.heading;

//     if (joinsHyphen) {
//       last.text = last.text.slice(0, -1);
//     } else {
//       pushRun(paragraph.runs, { ...last, text: " " });
//     }
//   }

//   runs.forEach((r) => pushRun(paragraph.runs, r));
//   paragraph.lines.push(line);
//   paragraph.lastText = line.text;
//   return paragraph;
// };

// const buildElements = (blocks, stats, options) => {
//   const elements = [];
//   let current = null;
//   let prev = null;

//   const flush = () => {
//     if (current) {
//       elements.push(current);
//       current = null;
//     }
//   };

//   blocks.forEach((block, index) => {
//     if (block.type === "table") {
//       flush();
//       elements.push(block);
//       prev = null;
//       return;
//     }

//     if (block.type === "image") {
//       flush();
//       elements.push({ kind: "image", ...block });
//       prev = null;
//       return;
//     }

//     if (block.type === "ocr") {
//       flush();
//       block.paragraphs.forEach((text) => {
//         elements.push({
//           kind: "paragraph",
//           page: block.page,
//           plain: true,
//           heading: 0,
//           list: null,
//           runs: [{ text, bold: false, italic: false, size: stats.bodySize }],
//           lines: [],
//         });
//       });
//       prev = null;
//       return;
//     }

//     const { line } = block;
//     const next = blocks[index + 1]?.type === "line" ? blocks[index + 1].line : null;
//     const marker = matchMarker(line.text);
//     const headingLevel = classifyHeading(line, prev, next, marker, stats);

//     const gap = prev && prev.page === line.page ? line.yTop - prev.yTop : null;
//     const sameFlow = gap !== null && gap > 0;

//     let startNew = true;

//     if (current) {
//       if (headingLevel) {
//         startNew = !(
//           current.heading === headingLevel &&
//           sameFlow &&
//           gap <= line.size * 1.6
//         );
//       } else if (current.heading || marker) {
//         startNew = true;
//       } else if (current.list) {
//         startNew = !(
//           sameFlow &&
//           gap <= stats.pitch * 1.45 &&
//           line.left >= current.firstLeft - 2
//         );
//       } else if (sameFlow) {
//         const indentJump = line.left - prev.left > 8 && prev.left <= stats.textLeft + 4;
//         const shortPrevLine =
//           prev.right < stats.textRight - 0.15 * (stats.textRight - stats.textLeft);
//         const sizeChange = Math.abs(line.size - prev.size) > 0.2 * stats.bodySize;

//         startNew =
//           gap > stats.pitch * 1.45 ||
//           indentJump ||
//           sizeChange ||
//           (shortPrevLine && endsSentence(prev.text));
//       } else {
//         // New page or new column: join only if the sentence clearly continues
//         const pageBreakAllowed = !options.preservePageBreaks || prev?.page === line.page;
//         const continues =
//           !endsSentence(current.lastText) &&
//           (startsLowercase(line.text) || /[,-]$/.test(current.lastText.trim()));
//         startNew = !(pageBreakAllowed && continues);
//       }
//     }

//     if (startNew) {
//       flush();
//       current = {
//         kind: "paragraph",
//         page: line.page,
//         heading: headingLevel,
//         list: marker?.type ?? null,
//         marker,
//         firstLeft: line.left,
//         runs: [],
//         lines: [],
//         lastText: "",
//       };
//     }

//     appendLine(current, line);
//     prev = line;
//   });

//   flush();
//   return elements;
// };

// /* -------------------------------------------------------------------------- */
// /*  Step 4: build the Word document                                           */
// /* -------------------------------------------------------------------------- */

// const makeTextRuns = (runs, stats, isHeading) => {
//   const out = [];

//   runs.forEach((run) => {
//     const parts = run.text.split("\t");
//     const children = [];
//     parts.forEach((part, i) => {
//       if (i > 0) children.push(new Tab());
//       if (part) children.push(part);
//     });
//     if (!children.length) return;

//     const options = { children };
//     if (!isHeading && run.bold) options.bold = true;
//     if (run.italic) options.italics = true;

//     if (!isHeading && stats.bodySize && run.size) {
//       const ratio = run.size / stats.bodySize;
//       if (Math.abs(ratio - 1) > 0.15) {
//         options.size = clamp(Math.round((BODY_SIZE_HALF_POINTS / 2) * ratio * 2), 12, 72);
//       }
//     }

//     out.push(new TextRun(options));
//   });

//   return out;
// };

// const alignmentFor = (lines, stats) => {
//   if (!lines.length) return undefined;

//   const width = stats.textRight - stats.textLeft;

//   const centered = lines.every((l) => {
//     const center = (l.left + l.right) / 2;
//     return (
//       Math.abs(center - l.pageWidth / 2) < l.pageWidth * 0.03 &&
//       l.left - stats.textLeft > l.pageWidth * 0.06 &&
//       stats.textRight - l.right > l.pageWidth * 0.06
//     );
//   });
//   if (centered) return AlignmentType.CENTER;

//   if (
//     lines.length === 1 &&
//     lines[0].right >= stats.textRight - 4 &&
//     lines[0].left - stats.textLeft > 0.4 * width
//   ) {
//     return AlignmentType.RIGHT;
//   }

//   return undefined;
// };

// const indentFor = (lines, stats) => {
//   if (!lines.length) return undefined;

//   const baseLeft = lines.length > 1 ? lines[1].left : lines[0].left;
//   const left = baseLeft - stats.textLeft;
//   const firstLine = lines.length > 1 ? lines[0].left - baseLeft : 0;

//   const indent = {};
//   if (left >= 12) indent.left = toTwips(Math.min(left, 240));
//   if (firstLine >= 8) indent.firstLine = toTwips(Math.min(firstLine, 72));

//   return Object.keys(indent).length ? indent : undefined;
// };

// const toParagraph = (element, stats, pageBreakBefore) => {
//   const isHeading = Boolean(element.heading);
//   const children = makeTextRuns(element.runs, stats, isHeading);
//   const base = { children, pageBreakBefore: pageBreakBefore || undefined };

//   if (element.plain) return new Paragraph(base);

//   if (isHeading) {
//     return new Paragraph({
//       ...base,
//       heading: [null, HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][
//         element.heading
//       ],
//       alignment: alignmentFor(element.lines, stats),
//     });
//   }

//   if (element.list === "bullet") {
//     const offset = element.firstLeft - (stats.listLeft || element.firstLeft);
//     const level = clamp(Math.round(offset / 18), 0, 2);
//     return new Paragraph({ ...base, numbering: { reference: "bullets", level } });
//   }

//   if (element.list === "numbered") {
//     return new Paragraph({ ...base, indent: { left: 720, hanging: 360 } });
//   }

//   const alignment = alignmentFor(element.lines, stats);

//   return new Paragraph({
//     ...base,
//     alignment,
//     indent: alignment ? undefined : indentFor(element.lines, stats),
//   });
// };

// // A full-page image that fits inside the page margins
// const toImageParagraph = (element, contentWidth, pageHeightTwips, pageBreakBefore) => {
//   const maxWidth = contentWidth / 15; // 1 px = 15 twips
//   const maxHeight = (pageHeightTwips - 2 * toTwips(72)) / 15 - 20;

//   const naturalWidth = (element.pageWidth * 96) / 72;
//   const naturalHeight = (element.pageHeight * 96) / 72;
//   const scale = Math.min(1, maxWidth / naturalWidth, maxHeight / naturalHeight);

//   return new Paragraph({
//     alignment: AlignmentType.CENTER,
//     pageBreakBefore: pageBreakBefore || undefined,
//     spacing: { after: 0 },
//     children: [
//       new ImageRun({
//         type: "png",
//         data: element.data,
//         transformation: {
//           width: Math.round(naturalWidth * scale),
//           height: Math.round(naturalHeight * scale),
//         },
//       }),
//     ],
//   });
// };

// const toTable = (block, stats, contentWidth) => {
//   const starts = block.starts;
//   const rightEdge = Math.max(...block.rows.map((r) => r.right));

//   const rawWidths = starts.map((start, i) =>
//     Math.max(24, (i < starts.length - 1 ? starts[i + 1] : rightEdge) - start)
//   );
//   const total = rawWidths.reduce((a, b) => a + b, 0);
//   const widths = rawWidths.map((w) => Math.max(400, Math.round((w / total) * contentWidth)));
//   const tableWidth = widths.reduce((a, b) => a + b, 0);

//   const rows = block.rows.map(
//     (row) =>
//       new TableRow({
//         cantSplit: true,
//         children: row.segments.map((segment, i) => {
//           const text = segment.runs.map((r) => r.text).join("").trim();
//           const isNumber = /^[\d.,%$€£₹()\-\s]+$/.test(text);

//           return new TableCell({
//             width: { size: widths[i], type: WidthType.DXA },
//             margins: { top: 40, bottom: 40, left: 80, right: 80 },
//             children: [
//               new Paragraph({
//                 children: makeTextRuns(segment.runs, stats, false),
//                 alignment: isNumber ? AlignmentType.RIGHT : undefined,
//                 spacing: { after: 0 },
//               }),
//             ],
//           });
//         }),
//       })
//   );

//   return new Table({
//     width: { size: tableWidth, type: WidthType.DXA },
//     columnWidths: widths,
//     rows,
//   });
// };

// const buildDocument = ({ elements, stats, firstPage, title, options }) => {
//   const marginLeft = clamp(stats.textLeft || 72, 36, 108);
//   const marginRight = clamp(firstPage.width - (stats.textRight || 540), 36, 108);
//   const contentWidth = toTwips(firstPage.width - marginLeft - marginRight);
//   const pageHeightTwips = toTwips(firstPage.height);

//   const children = [];
//   let lastPage = -1;

//   elements.forEach((element) => {
//     const isNewPage = element.page !== lastPage;
//     // Image pages always start on their own page
//     const breakBefore =
//       lastPage !== -1 &&
//       isNewPage &&
//       (options.preservePageBreaks || element.kind === "image");
//     lastPage = element.page;

//     if (element.kind === "image") {
//       children.push(toImageParagraph(element, contentWidth, pageHeightTwips, breakBefore));
//       return;
//     }

//     if (element.type === "table") {
//       if (breakBefore) children.push(new Paragraph({ pageBreakBefore: true }));
//       children.push(toTable(element, stats, contentWidth));
//       children.push(new Paragraph({ spacing: { after: 120 } })); // keeps tables apart
//       return;
//     }

//     if (!element.runs.some((r) => r.text.trim())) return;
//     children.push(toParagraph(element, stats, breakBefore));
//   });

//   const bulletLevel = (level, symbol) => ({
//     level,
//     format: LevelFormat.BULLET,
//     text: symbol,
//     alignment: AlignmentType.LEFT,
//     style: { paragraph: { indent: { left: 720 * (level + 1), hanging: 360 } } },
//   });

//   const headingStyle = (id, name, size, outlineLevel) => ({
//     id,
//     name,
//     basedOn: "Normal",
//     next: "Normal",
//     quickFormat: true,
//     run: { font: BODY_FONT, size, bold: true },
//     paragraph: { spacing: { before: 240, after: 120 }, outlineLevel },
//   });

//   return new Document({
//     creator: "PDF to Word Converter",
//     title: title || undefined,
//     styles: {
//       default: {
//         document: {
//           run: { font: BODY_FONT, size: BODY_SIZE_HALF_POINTS },
//           paragraph: { spacing: { after: 120, line: 276 } },
//         },
//       },
//       paragraphStyles: [
//         headingStyle("Heading1", "Heading 1", HEADING_SIZES[1], 0),
//         headingStyle("Heading2", "Heading 2", HEADING_SIZES[2], 1),
//         headingStyle("Heading3", "Heading 3", HEADING_SIZES[3], 2),
//       ],
//     },
//     numbering: {
//       config: [
//         {
//           reference: "bullets",
//           levels: [bulletLevel(0, "•"), bulletLevel(1, "◦"), bulletLevel(2, "▪")],
//         },
//       ],
//     },
//     sections: [
//       {
//         properties: {
//           page: {
//             size: { width: toTwips(firstPage.width), height: pageHeightTwips },
//             margin: {
//               top: toTwips(72),
//               bottom: toTwips(72),
//               left: toTwips(marginLeft),
//               right: toTwips(marginRight),
//             },
//           },
//         },
//         children: children.length ? children : [new Paragraph("")],
//       },
//     ],
//   });
// };

// /* -------------------------------------------------------------------------- */
// /*  Public API                                                                */
// /* -------------------------------------------------------------------------- */

// const outputName = (name) => {
//   const base = name.replace(/\.pdf$/i, "").replace(/[\\/:*?"<>|]+/g, "_").trim();
//   return `${base || "document"}.docx`;
// };

// /**
//  * Converts a PDF to a Word file and reports anything that needs review.
//  * @returns {Promise<{ file: File, pageCount: number, warnings: string[] }>}
//  */
// export const convertPdfToWordDetailed = async (file, options = {}, onProgress) => {
//   const opts = { ...DEFAULT_OPTIONS, ...options };
//   const report = (value) => onProgress?.(clamp(Math.round(value), 0, 100));

//   if (!file || typeof file.name !== "string") {
//     throw new Error("Please select a valid PDF file.");
//   }
//   if (file.size === 0) throw new Error("The selected file is empty.");
//   if (file.size > MAX_FILE_SIZE) {
//     throw new Error(
//       `This file is ${(file.size / 1048576).toFixed(0)} MB. The limit is ${MAX_FILE_SIZE / 1048576} MB.`
//     );
//   }

//   const data = new Uint8Array(await file.arrayBuffer());
//   const header = new TextDecoder().decode(data.slice(0, 1024));
//   if (!header.includes("%PDF-")) {
//     throw new Error("This file is not a valid PDF.");
//   }

//   throwIfAborted(opts.signal);
//   report(1);

//   // One loading task for the whole conversion. It is destroyed only at the
//   // very end, because destroying it earlier closes the document.
//   let loadingTask;
//   let pdf;

//   try {
//     loadingTask = pdfjsLib.getDocument({
//       data,
//       password: opts.password,
//       isEvalSupported: false, // safer under strict Content Security Policy
//       fontExtraProperties: true,
//     });
//     pdf = await loadingTask.promise;
//   } catch (error) {
//     await loadingTask?.destroy().catch(() => {});
//     throw mapPdfError(error);
//   }

//   try {
//     const pageCount = pdf.numPages;
//     if (pageCount > MAX_PAGES) {
//       throw new Error(`This PDF has ${pageCount} pages. The limit is ${MAX_PAGES}.`);
//     }

//     const warnings = [];
//     const pages = [];
//     const fontCache = new Map();

//     let ocrPages = 0;
//     let imagePages = 0;
//     let blankPages = 0;
//     let emptyPages = 0;
//     let graphicPages = 0; // text pages that also contain images we do not carry over
//     let ocrFailure = "";

//     // Extraction takes most of the time, so it gets 0 to 85% of the progress
//     for (let n = 1; n <= pageCount; n += 1) {
//       throwIfAborted(opts.signal);

//       const page = await pdf.getPage(n);
//       try {
//         const extracted = await extractPage(page, n - 1, fontCache);

//         if (extracted.charCount >= MIN_CHARS_FOR_TEXT_PAGE) {
//           if (extracted.hasImages) graphicPages += 1;
//         } else {
//           // Little or no selectable text: try OCR first
//           let paragraphs = [];

//           if (opts.ocr) {
//             try {
//               paragraphs = await runOcr(page);
//             } catch (ocrError) {
//               ocrFailure = ocrFailure || ocrError?.message || "OCR failed.";
//             }
//           }

//           if (paragraphs.length) {
//             extracted.ocrParagraphs = paragraphs;
//             ocrPages += 1;
//           } else if (opts.imagesForEmptyPages) {
//             // No text found. Keep the content as an image unless the page is blank.
//             const canvas = await renderPageToCanvas(page, IMAGE_SCALE);
//             try {
//               if (isBlankCanvas(canvas)) {
//                 blankPages += 1;
//               } else {
//                 extracted.image = await canvasToPng(canvas);
//                 imagePages += 1;
//               }
//             } finally {
//               releaseCanvas(canvas);
//             }
//           } else {
//             emptyPages += 1;
//           }
//         }

//         pages.push(extracted);
//       } finally {
//         page.cleanup();
//       }

//       report(2 + (n / pageCount) * 83);
//       await yieldToUi();
//     }

//     // Everything was empty and the user turned off both OCR and the image fallback
//     if (emptyPages === pageCount) {
//       const err = new Error(
//         "This PDF has no selectable text. It looks like a scanned document, so it needs OCR to be converted."
//       );
//       err.code = "NO_TEXT_LAYER";
//       throw err;
//     }

//     if (opts.removeHeadersFooters) {
//       const removed = removeHeadersAndFooters(pages);
//       if (removed > 0) {
//         warnings.push(`Removed ${removed} repeated header, footer or page number line(s).`);
//       }
//     }

//     report(88);
//     await yieldToUi();

//     const stats = analyseDocument(pages);
//     const blocks = pages.flatMap((page) => structurePage(page));
//     const elements = buildElements(blocks, stats, opts);

//     if (!elements.length) {
//       throw new Error("No readable content was found in this PDF.");
//     }

//     // Warnings: only mention what actually happened
//     if (ocrPages > 0) {
//       warnings.push(
//         `${ocrPages} scanned page(s) were read with OCR. Check names, numbers and special characters.`
//       );
//     }
//     if (imagePages > 0) {
//       warnings.push(
//         `${imagePages} page(s) had no readable text (photos or drawings), so they were inserted as images.`
//       );
//     }
//     if (blankPages > 0) {
//       warnings.push(`${blankPages} blank page(s) were skipped.`);
//     }
//     if (emptyPages > 0) {
//       warnings.push(`${emptyPages} page(s) had no readable text and were left empty.`);
//     }
//     if (graphicPages > 0) {
//       warnings.push(
//         `${graphicPages} page(s) contain images or graphics that were not carried over.`
//       );
//     }
//     if (ocrFailure) {
//       warnings.push(`OCR did not work on some pages: ${ocrFailure}`);
//     }

//     const metadata = await pdf.getMetadata().catch(() => null);
//     const title = metadata?.info?.Title?.trim();

//     report(93);

//     const document = buildDocument({
//       elements,
//       stats,
//       firstPage: pages[0],
//       title,
//       options: opts,
//     });

//     const blob = await Packer.toBlob(document);
//     report(100);

//     return {
//       file: new File([blob], outputName(file.name), {
//         type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//       }),
//       pageCount,
//       warnings,
//     };
//   } finally {
//     await loadingTask?.destroy().catch(() => {});
//   }
// };

// /**
//  * Simple helper: returns only the .docx File.
//  * Same shape as your compressFileToZip service: (file, options, onProgress).
//  */
// export const convertPdfToWord = async (file, options, onProgress) => {
//   const { file: docx } = await convertPdfToWordDetailed(file, options, onProgress);
//   return docx;
// };





import * as pdfjsLib from "pdfjs-dist";
import {
  Document,
  ImageRun,
  Paragraph,
  Packer,
} from "docx";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const RENDER_SCALE = 2;

// Word has a maximum page dimension of approximately 22 inches.
const MAX_PAGE_TWIPS = 31680;

// Convert PDF points to Word twips.
const pointsToTwips = (points) => Math.round(points * 20);

// Render one PDF page as a PNG image.
async function renderPageImage(page) {
  const viewport = page.getViewport({
    scale: RENDER_SCALE,
  });

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", {
    alpha: false,
  });

  if (!context) {
    throw new Error("Unable to create canvas context.");
  }

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  try {
    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error("Unable to generate page image."));
          }
        },
        "image/png"
      );
    });

    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

// Convert PDF pages into a DOCX document.
export async function convertPdfToWordDetailed(
  file,
  options = {},
  onProgress
) {
  if (!(file instanceof File)) {
    throw new Error("Please select a valid PDF file.");
  }

  if (file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("The selected file is not a PDF.");
  }

  const report = (percentage) => {
    if (typeof onProgress === "function") {
      onProgress(Math.round(percentage));
    }
  };

  let loadingTask;
  let pdf;

  try {
    report(1);

    const data = new Uint8Array(await file.arrayBuffer());

    loadingTask = pdfjsLib.getDocument({
      data: data.slice(),
      password: options.password || undefined,
      isEvalSupported: false,
    });

    pdf = await loadingTask.promise;

    const sections = [];
    const pageCount = pdf.numPages;

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
      const page = await pdf.getPage(pageNumber);

      try {
        report(2 + ((pageNumber - 1) / pageCount) * 85);

        // Get original page dimensions in PDF points.
        const originalViewport = page.getViewport({
          scale: 1,
        });

        let pageWidth = pointsToTwips(originalViewport.width);
        let pageHeight = pointsToTwips(originalViewport.height);

        // Scale unusually large pages to Word's supported dimensions.
        const dimensionScale = Math.min(
          1,
          MAX_PAGE_TWIPS / Math.max(pageWidth, pageHeight)
        );

        pageWidth = Math.round(pageWidth * dimensionScale);
        pageHeight = Math.round(pageHeight * dimensionScale);

        // Render the PDF page.
        const imageData = await renderPageImage(page);

        // DOCX image dimensions are expressed in pixels.
        // 15 twips = 1 pixel at 96 DPI.
        const imageWidth = pageWidth / 15;
        const imageHeight = pageHeight / 15;

        const image = new ImageRun({
          data: imageData,
          transformation: {
            width: imageWidth,
            height: imageHeight,
          },
          type: "png",
        });

        const paragraph = new Paragraph({
          spacing: {
            before: 0,
            after: 0,
            line: 240,
          },
          children: [image],
        });

        // Each PDF page gets its own Word section.
        sections.push({
          properties: {
            page: {
              size: {
                width: pageWidth,
                height: pageHeight,
              },
              margin: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
              },
            },
          },
          children: [paragraph],
        });

      } finally {
        page.cleanup();
      }

      report(2 + (pageNumber / pageCount) * 85);
    }

    report(90);

    const doc = new Document({
      creator: "PDF to Word Converter",
      title: file.name.replace(/\.pdf$/i, ""),
      description: "PDF pages converted into images",
      sections,
    });

    const blob = await Packer.toBlob(doc);

    const outputName = file.name.replace(/\.pdf$/i, "") + ".docx";

    const outputFile = new File(
      [blob],
      outputName,
      {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }
    );

    report(100);

    return {
      file: outputFile,
      pageCount,
      warnings: [
        "PDF pages are embedded as images. Text is not individually editable.",
      ],
    };

  } catch (error) {
    console.error("PDF to Word conversion failed:", error);

    if (error.name === "PasswordException") {
      throw new Error(
        "This PDF is password protected. Please enter the correct password."
      );
    }

    throw new Error(
      error.message || "Unable to convert this PDF."
    );

  } finally {
    if (loadingTask) {
      await loadingTask.destroy();
    }
  }
}

// Simple conversion function.
export async function convertPdfToWord(
  file,
  options = {},
  onProgress
) {
  const result = await convertPdfToWordDetailed(
    file,
    options,
    onProgress
  );

  return result.file;
}
