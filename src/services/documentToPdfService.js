
import mammoth from "mammoth/mammoth.browser";
import * as XLSX from "xlsx";
import DOMPurify from "dompurify";

/* -------------------------------------------------------------------------- */
/*  Configuration                                                             */
/* -------------------------------------------------------------------------- */

const SUPPORTED_FORMATS = ["docx", "txt", "html", "htm", "csv", "xlsx"];
const FORMAT_LABEL = "DOCX, TXT, HTML, CSV and XLSX";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

// Spreadsheet rendering limits keep the browser responsive on huge files
const MAX_ROWS_PER_SHEET = 5000;
const MAX_COLUMNS_PER_SHEET = 100;

// Remote images in uploaded HTML can leak the reader's IP, so they are
// removed by default. Images embedded in the file (data URIs) are kept.
const ALLOW_REMOTE_IMAGES = false;

const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04]; // DOCX and XLSX are ZIP files
const SAFE_IMAGE_SRC = /^data:image\/(png|jpe?g|gif|webp|bmp);base64,/i;
const SAFE_LINK = /^(https?:|mailto:|tel:|#)/i;
const NUMERIC_CELL = /^[-+(]?[$€£₹]?\s?\d[\d,.\s]*%?\)?$/;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const getExtension = (filename) => {
  const name = String(filename).trim().toLowerCase();
  const dot = name.lastIndexOf(".");
  // "no-extension" and ".gitignore" both count as having no extension
  return dot > 0 ? name.slice(dot + 1) : "";
};

const ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};

const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (char) => ESCAPE_MAP[char]);

const formatMb = (bytes) => `${(bytes / (1024 * 1024)).toFixed(0)} MB`;

const validateContent = (content, message) => {
  if (typeof content !== "string" || !content.trim()) {
    throw new Error(message);
  }
  return content;
};

// DOCX and XLSX must be real ZIP packages. This catches renamed .doc/.xls
// files and corrupted uploads before the parser throws a cryptic error.
const assertZipPackage = async (file, label) => {
  const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const isZip = ZIP_SIGNATURE.every((byte, i) => header[i] === byte);

  if (!isZip) {
    throw new Error(
      `This file is not a valid ${label} document. Older .doc and .xls files are not supported. Save it as ${label} and try again.`
    );
  }
};

/* -------------------------------------------------------------------------- */
/*  Sanitizing                                                                */
/* -------------------------------------------------------------------------- */

let purifier = null;

const getPurifier = () => {
  if (purifier) return purifier;

  // A private instance, so these hooks never affect other DOMPurify users
  purifier = DOMPurify(window);

  purifier.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      const href = node.getAttribute("href");

      if (href && !SAFE_LINK.test(href.trim())) {
        node.removeAttribute("href");
      }

      if (node.getAttribute("href") && !node.getAttribute("href").startsWith("#")) {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer nofollow");
      }
    }

    if (node.tagName === "IMG") {
      const src = (node.getAttribute("src") || "").trim();
      const allowed =
        SAFE_IMAGE_SRC.test(src) || (ALLOW_REMOTE_IMAGES && /^https:/i.test(src));

      if (!allowed) {
        node.remove();
      } else {
        node.setAttribute("loading", "lazy");
        node.setAttribute("decoding", "async");
        if (!node.hasAttribute("alt")) node.setAttribute("alt", "");
      }
    }
  });

  return purifier;
};

const sanitizeHtml = (html) =>
  getPurifier().sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: [
      "script", "style", "iframe", "object", "embed", "form", "input",
      "button", "textarea", "select", "link", "meta", "base", "svg", "math",
    ],
    FORBID_ATTR: ["style", "srcset", "formaction"],
  });

/* -------------------------------------------------------------------------- */
/*  Converters                                                                */
/*  Each one returns { html, warnings }                                       */
/* -------------------------------------------------------------------------- */

// DOCX ---------------------------------------------------------------------

const DOCX_STYLE_MAP = [
  "p[style-name='Title'] => h1.doc-title:fresh",
  "p[style-name='Subtitle'] => p.doc-subtitle:fresh",
  "p[style-name='Quote'] => blockquote:fresh",
  "p[style-name='Intense Quote'] => blockquote.intense:fresh",
  "p[style-name='Code'] => pre:separator('\\n')",
  "r[style-name='Strong'] => strong",
  "r[style-name='Emphasis'] => em",
  "u => u",
];
const preserveDocxPageBreaks = (html) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Preserve explicit page-break elements
  doc.querySelectorAll(
    '[style*="page-break-before"], [style*="break-before"]'
  ).forEach((element) => {
    element.classList.add("docx-page-break");
  });

  return doc.body.innerHTML;
};
const convertDocx = async (file) => {
  await assertZipPackage(file, "DOCX");

  try {
    const arrayBuffer = await file.arrayBuffer();

    const result = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        styleMap: DOCX_STYLE_MAP,
        // Embed images so they display without any external requests
        convertImage: mammoth.images.imgElement((image) =>
          image.read("base64").then((data) => ({
            src: `data:${image.contentType};base64,${data}`,
          }))
        ),
      }
    );

  const html = validateContent(
  preserveDocxPageBreaks(result.value),
  "No readable content found in this DOCX file."
);

    const warnings = [
      ...new Set(
        result.messages
          .filter((m) => m.type === "warning")
          .map((m) => m.message)
      ),
    ];

    return { html: `<article class="document-body">${html}</article>`, warnings };
  } catch (error) {
    throw new Error(
      `DOCX conversion failed: ${error?.message || "the file may be damaged."}`,
      { cause: error }
    );
  }
};

// TXT ----------------------------------------------------------------------

const convertTxt = async (file) => {
  const raw = await file.text();

  const text = raw
    .replace(/\r\n?/g, "\n") // normalise line endings
    .replace(/\u0000/g, "") // strip null bytes
    .replace(/^\uFEFF/, ""); // strip byte-order mark

  validateContent(text, "The text document is empty.");

  // "pdf-document" is kept for compatibility with existing styles
  return {
    html: `<article class="pdf-document plain-text-document"><pre class="plain-text">${escapeHtml(
      text
    )}</pre></article>`,
    warnings: [],
  };
};

// HTML ---------------------------------------------------------------------

const convertHtml = async (file) => {
  const source = await file.text();
  validateContent(source, "The HTML document is empty.");

  const parsed = new DOMParser().parseFromString(source, "text/html");

  if (!parsed.body) {
    throw new Error("Unable to read the HTML document.");
  }

  // Remove content that is never useful in a preview, before sanitizing
  parsed.body
    .querySelectorAll("script, style, link, meta, noscript, template")
    .forEach((el) => el.remove());

  // Keep the page title as a heading when the body has none
  const title = parsed.title?.trim();
  const hasHeading = parsed.body.querySelector("h1, h2");
  const titleHtml =
    title && !hasHeading ? `<h1 class="doc-title">${escapeHtml(title)}</h1>` : "";

  return {
    html: `<article class="document-body">${titleHtml}${parsed.body.innerHTML}</article>`,
    warnings: ["Page styles and scripts in HTML files are not shown."],
  };
};

// CSV and XLSX -------------------------------------------------------------

const buildTable = (rows) => {
  const columnCount = Math.min(
    MAX_COLUMNS_PER_SHEET,
    rows.reduce((max, row) => Math.max(max, row.length), 0)
  );

  const normalise = (row) =>
    Array.from({ length: columnCount }, (_, i) => String(row[i] ?? "").trim());

  const [header, ...body] = rows.map(normalise);

  const headCells = header
    .map((cell) => `<th scope="col">${escapeHtml(cell)}</th>`)
    .join("");

  const bodyRows = body
    .map((row) => {
      const cells = row
        .map((cell) => {
          const cls = NUMERIC_CELL.test(cell) ? ' class="num"' : "";
          return `<td${cls}>${escapeHtml(cell)}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<div class="table-wrap"><table><thead><tr>${headCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
};

const convertSpreadsheet = async (file, extension) => {
  let workbook;

  try {
    if (extension === "xlsx") {
      await assertZipPackage(file, "XLSX");
      workbook = XLSX.read(await file.arrayBuffer(), {
        type: "array",
        cellDates: true,
      });
    } else {
      // Reading CSV as text keeps UTF-8 characters (and Indian-language text) intact
      const text = (await file.text()).replace(/^\uFEFF/, "");
      workbook = XLSX.read(text, { type: "string", cellDates: true });
    }
  } catch (error) {
    if (error?.message?.startsWith("This file is not")) throw error;
    throw new Error(
      `Spreadsheet conversion failed: ${error?.message || "the file may be damaged."}`,
      { cause: error }
    );
  }

  if (!workbook.SheetNames.length) {
    throw new Error("No worksheets found in this document.");
  }

  const warnings = [];
  const hiddenFlags = workbook.Workbook?.Sheets ?? [];
  const sections = [];

  workbook.SheetNames.forEach((sheetName, index) => {
    if (hiddenFlags[index]?.Hidden) return; // skip hidden sheets

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet || !worksheet["!ref"]) return;

    // raw:false returns values as formatted in the file (dates, currency, %)
    const allRows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: false,
      dateNF: "yyyy-mm-dd",
    });

    if (!allRows.length) return;

    let rows = allRows;

    if (allRows.length > MAX_ROWS_PER_SHEET) {
      rows = allRows.slice(0, MAX_ROWS_PER_SHEET);
      warnings.push(
        `"${sheetName}" has ${allRows.length.toLocaleString()} rows. Only the first ${MAX_ROWS_PER_SHEET.toLocaleString()} are shown.`
      );
    }

    if (rows.some((row) => row.length > MAX_COLUMNS_PER_SHEET)) {
      warnings.push(
        `"${sheetName}" has more than ${MAX_COLUMNS_PER_SHEET} columns. Extra columns are hidden.`
      );
    }

    // CSV files have a single anonymous sheet, so no heading is needed
    const heading =
      extension === "xlsx" ? `<h2>${escapeHtml(sheetName)}</h2>` : "";

    sections.push(
      `<section class="spreadsheet-section">${heading}${buildTable(rows)}</section>`
    );
  });

  const html = validateContent(
    sections.join('<div class="sheet-separator"></div>'),
    "No readable spreadsheet data found."
  );

  return { html, warnings };
};

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Converts a file to sanitized HTML and reports anything that was skipped.
 * @returns {Promise<{ html: string, warnings: string[], format: string }>}
 */
export const convertDocumentDetailed = async (file) => {
  if (!file || typeof file.name !== "string") {
    throw new Error("Please select a valid document.");
  }

  if (file.size === 0) {
    throw new Error("The selected document is empty.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `This file is ${formatMb(file.size)}. The limit is ${formatMb(MAX_FILE_SIZE)}.`
    );
  }

  const extension = getExtension(file.name);

  if (!SUPPORTED_FORMATS.includes(extension)) {
    const shown = extension ? `.${extension}` : "files without an extension";
    throw new Error(`Unsupported format: ${shown}. Supported formats: ${FORMAT_LABEL}.`);
  }

  let converted;

  switch (extension) {
    case "docx":
      converted = await convertDocx(file);
      break;
    case "txt":
      converted = await convertTxt(file);
      break;
    case "html":
    case "htm":
      converted = await convertHtml(file);
      break;
    case "csv":
    case "xlsx":
      converted = await convertSpreadsheet(file, extension);
      break;
    default:
      throw new Error("Unsupported document format.");
  }

  const html = validateContent(
    sanitizeHtml(converted.html),
    "No readable content found in this document."
  );

  return { html, warnings: converted.warnings, format: extension };
};

/**
 * Backwards-compatible helper: returns only the sanitized HTML string.
 */
export const convertDocumentToHtml = async (file) => {
  const { html } = await convertDocumentDetailed(file);
  return html;
};
