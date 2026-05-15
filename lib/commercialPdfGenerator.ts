import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ICommercialInvoice } from "./models/CommercialInvoice";
import { fmt, numberToWords } from "./utils";

export async function generateCommercialInvoicePDF(invoice: ICommercialInvoice): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 30;
  const contentWidth = width - 2 * margin;

  const ty = (y: number) => height - y;

  const drawText = (text: string, x: number, y: number, size: number, fontRef = font, color = rgb(0, 0, 0)) => {
    if (text === null || text === undefined || text === "") return;
    page.drawText(String(text), { x, y: ty(y), size, font: fontRef, color });
  };

  const drawTextRight = (text: string, cellX: number, cellW: number, y: number, size: number, fontRef = font, color = rgb(0, 0, 0)) => {
    if (text === null || text === undefined || text === "") return;
    const str = String(text);
    const tw = fontRef.widthOfTextAtSize(str, size);
    page.drawText(str, { x: cellX + cellW - tw - 4, y: ty(y), size, font: fontRef, color });
  };

  const drawTextCenter = (text: string, cellX: number, cellW: number, y: number, size: number, fontRef = font, color = rgb(0, 0, 0)) => {
    if (text === null || text === undefined || text === "") return;
    const str = String(text);
    const tw = fontRef.widthOfTextAtSize(str, size);
    page.drawText(str, { x: cellX + (cellW - tw) / 2, y: ty(y), size, font: fontRef, color });
  };

  const rect = (x: number, y: number, w: number, h: number, fillColor?: ReturnType<typeof rgb>, borderColor = rgb(0, 0, 0)) => {
    page.drawRectangle({
      x, y: ty(y + h), width: w, height: h,
      ...(fillColor ? { color: fillColor } : {}),
      borderColor,
      borderWidth: 0.5,
    });
  };

  const hLine = (x: number, y: number, w: number, thickness = 0.5) => {
    page.drawLine({ start: { x, y: ty(y) }, end: { x: x + w, y: ty(y) }, thickness, color: rgb(0, 0, 0) });
  };

  const vLine = (x: number, y: number, h: number, thickness = 0.5) => {
    page.drawLine({ start: { x, y: ty(y) }, end: { x, y: ty(y + h) }, thickness, color: rgb(0, 0, 0) });
  };

  const darkGray = rgb(0.15, 0.15, 0.15);
  const lightGray = rgb(0.9, 0.9, 0.9);
  const gold = rgb(1, 0.88, 0.5); // #FFDF80 approx
  const white = rgb(1, 1, 1);
  const black = rgb(0, 0, 0);

  // --- Header ---
  let currentY = 40;

  drawTextCenter("M/s. WISHWAS TRADERS", margin, contentWidth, currentY + 18, 22, fontBold);
  currentY += 35;

  drawTextCenter("FOOD GRAIN MERCHANT", margin, contentWidth, currentY + 8, 10, fontBold);
  currentY += 15;

  drawTextCenter("GULABBAGH - 854326, PURNEA, STATE - BIHAR, CODE - 10", margin, contentWidth, currentY + 8, 9, font);
  currentY += 15;

  drawTextCenter(`PAN NO.: TLB01947/00        Mob.: 9801033100`, margin, contentWidth, currentY + 8, 9, font);
  currentY += 15;

  hLine(margin, currentY, contentWidth, 1.5);
  currentY += 15;

  // --- Buyer Info ---
  drawText(`Bill No.: ${invoice.billNo}`, margin, currentY + 10, 10, fontBold);
  drawTextRight(`Date: ${invoice.date.split('-').reverse().join('/')}`, margin, contentWidth, currentY + 10, 10, fontBold);
  currentY += 20;

  drawText(`Name: ${invoice.buyerName}`, margin, currentY + 10, 10);
  currentY += 20;

  drawText(`Address: ${invoice.buyerAddress}`, margin, currentY + 10, 10);
  currentY += 20;

  drawText(`Place of Delivery: ${invoice.placeOfDelivery || ""}`, margin, currentY + 10, 10);
  currentY += 25;

  // --- Main Table ---
  const tableTop = currentY;

  const cols = [
    { label: "Sl.\nNo.", width: 35, align: "center" },
    { label: "LORRY NO.", width: 140, align: "center" },
    { label: "BAGS", width: 50, align: "center" },
    { label: "QNTY.", width: 70, align: "center" },
    { label: "MOISTURE", width: 70, align: "center" },
    { label: "RATE", width: 50, align: "center" },
    { label: "AMOUNT\nRs.     P.", width: 120.28, align: "center" },
  ];

  const headerH = 30;
  const rowH = 20;

  // Header Box
  rect(margin, tableTop, contentWidth, headerH, darkGray);

  let cx = margin;
  for (const col of cols) {
    if (cx > margin) vLine(cx, tableTop, headerH, 0.5);
    const lines = col.label.split("\n");
    let lineY = tableTop + 12;
    for (const line of lines) {
      drawTextCenter(line, cx, col.width, lineY, 9, fontBold, white);
      lineY += 12;
    }
    cx += col.width;
  }

  currentY += headerH;

  // Lorry Rows
  const items = invoice.items || [];
  const minRows = Math.max(13, items.length); // Render at least 13 rows for standard height
  const dataBoxH = minRows * rowH;

  rect(margin, currentY, contentWidth, dataBoxH);

  cx = margin;
  for (const col of cols) {
    if (cx > margin) vLine(cx, currentY, dataBoxH, 0.5);
    cx += col.width;
  }

  let rowY = currentY;
  for (let i = 0; i < minRows; i++) {
    const item = items[i];
    if (item) {
      const ty = rowY + 14;
      drawTextCenter(`${i + 1}`, margin, cols[0].width, ty, 9);
      drawTextCenter(item.lorryNo, margin + cols[0].width, cols[1].width, ty, 9);
      drawTextCenter(String(item.bags || ""), margin + cols[0].width + cols[1].width, cols[2].width, ty, 9);
      drawTextCenter(String(item.quantity || ""), margin + cols[0].width + cols[1].width + cols[2].width, cols[3].width, ty, 9);
      drawTextCenter(String(item.moisture || ""), margin + cols[0].width + cols[1].width + cols[2].width + cols[3].width, cols[4].width, ty, 9);
      drawTextCenter(String(item.rate || ""), margin + cols[0].width + cols[1].width + cols[2].width + cols[3].width + cols[4].width, cols[5].width, ty, 9);
      drawTextCenter(fmt(item.amount || 0), margin + contentWidth - cols[6].width, cols[6].width, ty, 9);
    }
    // Horizontal line for each row except the last one which is handled by rect
    if (i > 0) {
      hLine(margin, rowY, contentWidth, 0.5);
    }
    rowY += rowH;
  }

  currentY += dataBoxH;

  // Items Totals row
  rect(margin, currentY, contentWidth, rowH, gold);
  drawTextCenter("TOTAL", margin + cols[0].width, cols[1].width, currentY + 14, 10, fontBold);
  drawTextCenter(String(invoice.totalBags || ""), margin + cols[0].width + cols[1].width, cols[2].width, currentY + 14, 10, fontBold);
  drawTextCenter(String(invoice.totalQuantity || ""), margin + cols[0].width + cols[1].width + cols[2].width, cols[3].width, currentY + 14, 10, fontBold);
  drawTextCenter(fmt(invoice.totalAmount || 0), margin + contentWidth - cols[6].width, cols[6].width, currentY + 14, 10, fontBold);

  cx = margin;
  for (const col of cols) {
    if (cx > margin) vLine(cx, currentY, rowH, 0.5);
    cx += col.width;
  }

  currentY += rowH + 15;

  // --- Two Tables (Bank Details & Quality Deduction) ---
  const leftW = 230;
  const rightW = 280;
  const leftX = margin;
  const rightX = margin + contentWidth - rightW;

  // Left: Bank Details
  rect(leftX, currentY, leftW, rowH, darkGray);
  drawTextCenter("BANK DETAILS", leftX, leftW, currentY + 14, 10, fontBold, white);
  let lY = currentY + rowH;

  const bankRows = [
    `Bank: ${invoice.bankName || ""}`,
    `Branch: ${invoice.bankBranch || ""}`,
    `A/C No.: ${invoice.bankAc || ""}`,
    `IFS Code: ${invoice.bankIfsc || ""}`
  ];

  for (const br of bankRows) {
    rect(leftX, lY, leftW, rowH);
    drawText(br, leftX + 5, lY + 14, 9);
    lY += rowH;
  }

  // Right: Quality Deduction
  rect(rightX, currentY, rightW, rowH, darkGray);
  drawTextCenter("QUALITY DEDUCTION", rightX + 5, rightW, currentY + 14, 10, fontBold, white);
  let rY = currentY + rowH;

  const dedCols = [
    { label: "", width: 80 },
    { label: "Qnty.", width: 60 },
    { label: "Rate", width: 60 },
    { label: "Net Amount", width: 80 },
  ];

  // Subheader
  rect(rightX, rY, rightW, rowH, lightGray);
  let dx = rightX;
  for (const col of dedCols) {
    if (dx > rightX) vLine(dx, rY, rowH, 0.5);
    drawTextCenter(col.label, dx, col.width, rY + 14, 9, fontBold);
    dx += col.width;
  }
  rY += rowH;

  const dedRows = [
    { key: 'moisture', label: 'Moisture' },
    { key: 'dhalta', label: 'Dhalta' },
    { key: 'labour', label: 'Labour' },
    { key: 'cutBags', label: 'Cut Bags' },
    { key: 'extra', label: 'Extra' },
  ];

  for (const row of dedRows) {
    const data = (invoice.qualityDeductions as any)?.[row.key] || {};
    rect(rightX, rY, rightW, rowH);

    dx = rightX;
    drawText(row.label, dx + 5, rY + 14, 9);
    vLine(dx + dedCols[0].width, rY, rowH, 0.5);
    vLine(dx + dedCols[0].width + dedCols[1].width, rY, rowH, 0.5);
    vLine(dx + dedCols[0].width + dedCols[1].width + dedCols[2].width, rY, rowH, 0.5);

    // Values
    if (data.quantity) drawTextCenter(String(data.quantity), dx + dedCols[0].width, dedCols[1].width, rY + 14, 9);
    if (data.rate) drawTextCenter(String(data.rate), dx + dedCols[0].width + dedCols[1].width, dedCols[2].width, rY + 14, 9);

    // For net amount, if amount is non-zero, format it. For extra, it might be negative.
    if (data.amount !== 0 && data.amount !== undefined) {
      drawTextCenter(fmt(data.amount), dx + dedCols[0].width + dedCols[1].width + dedCols[2].width, dedCols[3].width, rY + 14, 9);
    }

    rY += rowH;
  }

  // Right: Final Total Row
  rect(rightX, rY, rightW, rowH, gold);
  vLine(rightX + dedCols[0].width + dedCols[1].width, rY, rowH, 0.5);
  vLine(rightX + dedCols[0].width + dedCols[1].width + dedCols[2].width, rY, rowH, 0.5);
  drawTextCenter("TOTAL", rightX + dedCols[0].width + dedCols[1].width, dedCols[2].width, rY + 14, 10, fontBold);
  drawTextCenter(fmt(invoice.finalAmount || 0), rightX + dedCols[0].width + dedCols[1].width + dedCols[2].width, dedCols[3].width, rY + 14, 10, fontBold);

  currentY = Math.max(lY, rY + rowH);
  currentY += 15;

  // --- Bottom Line ---
  hLine(margin, currentY, contentWidth, 1.5);
  currentY += 20;

  // --- Footer ---
  drawText(`Total Rs. (In Words): `, margin, currentY + 10, 10, fontBold);
  drawText(`${numberToWords(Math.round(Math.max(0, invoice.finalAmount)))} Only`, margin + 115, currentY + 10, 10, font);
  drawTextCenter("E. & O. E.", margin + 350, 100, currentY + 10, 10, fontBold);

  currentY += 35;
  drawTextRight(`For: M/s. WISHWAS TRADERS`, margin, contentWidth, currentY, 10, fontBold);

  currentY += 45;
  drawTextRight(`Authorised Signatory`, margin, contentWidth, currentY, 10, fontBold);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
