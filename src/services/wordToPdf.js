
import mammoth from "mammoth";
import { jsPDF } from "jspdf";

// --------------------------------------------------
// Default configuration
// --------------------------------------------------

const DEFAULT_OPTIONS = {
  margin: 20,
  fontSize: 11,
  lineHeight: 1.5,
  pageFormat: "a4",
  font: "helvetica",
  maxFileSize: 30 * 1024 * 1024,
};

// --------------------------------------------------
// Validate Word document
// --------------------------------------------------

function validateWordFile(file, options) {
  if (
    typeof File === "undefined" ||
    !(file instanceof File)
  ) {
    throw new Error("Please select a valid Word document.");
  }

  const extension = file.name
    .split(".")
    .pop()
    .toLowerCase();

  if (extension !== "docx") {
    throw new Error(
      "Only DOCX Word documents are supported."
    );
  }

  if (file.size === 0) {
    throw new Error("The selected document is empty.");
  }

  if (file.size > options.maxFileSize) {
    throw new Error(
      "File size must be less than 30 MB."
    );
  }
}

// --------------------------------------------------
// Progress callback
// --------------------------------------------------

function reportProgress(callback, current, total) {
  if (typeof callback === "function") {
    callback({
      currentPage: current,
      totalPages: total,
    });
  }
}

// --------------------------------------------------
// Extract Word HTML
// --------------------------------------------------

async function extractWordContent(file) {
  const arrayBuffer = await file.arrayBuffer();

  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      includeDefaultStyleMap: true,
      styleMap: [
        "r[style-name='Heading 1 Char'] => strong",
        "r[style-name='Heading 2 Char'] => strong",
      ],
    }
  );

  if (!result.value?.trim()) {
    throw new Error(
      "No readable content found in this Word document."
    );
  }

  return {
    html: result.value,
    messages: result.messages || [],
  };
}// --------------------------------------------------
// Convert HTML into structured text blocks
// --------------------------------------------------

function extractBlocks(html) {
  const parser = new DOMParser();

  const document = parser.parseFromString(
    html,
    "text/html"
  );

  const blocks = [];

  function getText(element) {
    return (element.textContent || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+/g, " ")
      .trim();
  }

  function walk(element) {
    for (const node of element.children) {
      const tag = node.tagName.toLowerCase();

      // Paragraphs and headings.
      if (
        tag === "p" ||
        /^h[1-6]$/.test(tag)
      ) {
        const text = getText(node);

        if (text) {
          blocks.push({
            type: "paragraph",
            text,
            heading: /^h[1-6]$/.test(tag),
            headingLevel: /^h[1-6]$/.test(tag)
              ? Number(tag[1])
              : 0,
          });
        }

        continue;
      }

      // Lists.
      if (tag === "ul" || tag === "ol") {
        const ordered = tag === "ol";

        Array.from(node.children).forEach(
          (item, index) => {
            if (item.tagName.toLowerCase() !== "li") {
              return;
            }

            const text = getText(item);

            if (text) {
              blocks.push({
                type: "list",
                text,
                ordered,
                marker: ordered
                  ? `${index + 1}.`
                  : "\u2022",
              });
            }
          }
        );

        continue;
      }

      // Tables.
      if (tag === "table") {
        const rows = Array.from(
          node.querySelectorAll("tr")
        ).map((row) => {
          return Array.from(row.children).map(
            (cell) => getText(cell)
          );
        });

        if (rows.length) {
          blocks.push({
            type: "table",
            rows,
          });
        }

        continue;
      }

      // Recursively process nested content.
      walk(node);
    }
  }

  walk(document.body);

  return blocks;
}

// --------------------------------------------------
// Apply text styling
// --------------------------------------------------

function getTextStyle(block) {
  if (block.heading) {
    return {
      fontSize: Math.max(
        13,
        19 - block.headingLevel * 1.5
      ),
      fontStyle: "bold",
      spacing: 4,
    };
  }

  return {
    fontSize: DEFAULT_OPTIONS.fontSize,
    fontStyle: "normal",
    spacing: 3,
  };
}

// --------------------------------------------------
// Create PDF
// --------------------------------------------------

function createPdf(blocks, options) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: options.pageFormat,
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = options.margin;
  const contentWidth = pageWidth - margin * 2;

  const bottomLimit = pageHeight - margin;

  let y = margin;
  let pageNumber = 1;

  pdf.setFont(options.font, "normal");
  pdf.setFontSize(options.fontSize);

  function addPage() {
    pdf.addPage();
    pageNumber++;
    y = margin;

    reportProgress(
      options.onProgress,
      pageNumber,
      pageNumber
    );
  }

  function checkPageBreak(height) {
    if (y + height > bottomLimit) {
      addPage();
    }
  }

  function addParagraph(
    text,
    style = {}
  ) {
    const fontSize = style.fontSize || options.fontSize;
    const fontStyle = style.fontStyle || "normal";
    const spacing = style.spacing ?? 3;

    pdf.setFont(options.font, fontStyle);
    pdf.setFontSize(fontSize);

    const lineHeight =
      fontSize * options.lineHeight * 0.3528;

    const lines = pdf.splitTextToSize(
      text,
      contentWidth
    );

    for (const line of lines) {
      checkPageBreak(lineHeight);

      pdf.text(
        line,
        margin,
        y
      );

      y += lineHeight;
    }

    y += spacing;
  }

  // ------------------------------------------------
  // Render table
  // ------------------------------------------------

  function addTable(rows) {
    if (!rows.length) return;

    const columns = Math.max(
      ...rows.map((row) => row.length)
    );

    const columnWidth = contentWidth / columns;

    const cellPadding = 2;
    const fontSize = 9;
    const lineHeight = 4.5;

    for (const row of rows) {
      const cells = Array.from(
        { length: columns },
        (_, index) => row[index] || ""
      );

      pdf.setFontSize(fontSize);

      const wrappedCells = cells.map((cell) =>
        pdf.splitTextToSize(
          cell,
          columnWidth - cellPadding * 2
        )
      );

      const maxLines = Math.max(
        ...wrappedCells.map((cell) => cell.length)
      );

      const rowHeight =
        maxLines * lineHeight + cellPadding * 2;

      checkPageBreak(rowHeight);

      let x = margin;

      cells.forEach((_, index) => {
        const lines = wrappedCells[index];

        pdf.rect(
          x,
          y,
          columnWidth,
          rowHeight
        );

        pdf.setFont(
          options.font,
          "normal"
        );

        pdf.text(
          lines,
          x + cellPadding,
          y + cellPadding + 3
        );

        x += columnWidth;
      });

      y += rowHeight;
    }

    y += 4;
  }

  // ------------------------------------------------
  // Render document blocks
  // ------------------------------------------------

  for (const block of blocks) {
    if (block.type === "paragraph") {
      const style = getTextStyle(block);

      addParagraph(
        block.text,
        style
      );

    } else if (block.type === "list") {
      const indent = 5;

      pdf.setFont(
        options.font,
        "normal"
      );

      pdf.setFontSize(options.fontSize);

      const lines = pdf.splitTextToSize(
        block.text,
        contentWidth - indent
      );

      const lineHeight =
        options.fontSize *
        options.lineHeight *
        0.3528;

      for (let index = 0; index < lines.length; index++) {
        checkPageBreak(lineHeight);

        pdf.text(
          index === 0 ? block.marker : "",
          margin,
          y
        );

        pdf.text(
          lines[index],
          margin + indent,
          y
        );

        y += lineHeight;
      }

      y += 2;

    } else if (block.type === "table") {
      addTable(block.rows);
    }
  }

  // ------------------------------------------------
  // Footer page numbers
  // ------------------------------------------------

  const totalPages = pdf.internal.getNumberOfPages();

  for (
    let page = 1;
    page <= totalPages;
    page++
  ) {
    pdf.setPage(page);

    pdf.setFont(options.font, "normal");
    pdf.setFontSize(8);

    pdf.text(
      `Page ${page} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 8,
      {
        align: "right",
      }
    );
  }

  return pdf;
}

// --------------------------------------------------
// Main conversion function
// --------------------------------------------------

export async function convertWordToPDF(
  file,
  onProgress,
  customOptions = {}
) {
  const options = {
    ...DEFAULT_OPTIONS,
    ...customOptions,
  };

  validateWordFile(file, options);

  try {
    reportProgress(onProgress, 0, 0);

    // Step 1: Extract Word content.
    const { html, messages } =
      await extractWordContent(file);

    // Step 2: Convert HTML to blocks.
    const blocks = extractBlocks(html);

    if (!blocks.length) {
      throw new Error(
        "Unable to extract readable document content."
      );
    }

    // Step 3: Generate PDF.
    const pdf = createPdf(
      blocks,
      {
        ...options,
        onProgress,
      }
    );

    // Step 4: Generate PDF Blob.
    const blob = pdf.output("blob");

    reportProgress(
      onProgress,
      1,
      1
    );

    return {
      blob,
      totalPages: pdf.internal.getNumberOfPages(),
      warnings: messages.map(
        (message) => message.message
      ),
      fileName: file.name.replace(
        /\.docx$/i,
        ".pdf"
      ),
    };

  } catch (error) {
    console.error(
      "Word to PDF conversion failed:",
      error
    );

    throw new Error(
      error.message ||
      "Unable to convert Word document to PDF."
    );
  }
}
