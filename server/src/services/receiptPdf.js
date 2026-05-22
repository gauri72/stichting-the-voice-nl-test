import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import { getCoverageForTier } from "../config/sponsorshipCoverage.js";
import { resolveDonationPublicContactEmail } from "../config/donationPublicContact.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HEADER_LOGO_PATH = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "client",
  "src",
  "assets",
  "header-logo.png"
);

const COLORS = {
  pageBg: "#EDF5F7",
  navy: "#002147",
  deepNavy: "#003848",
  teal: "#008080",
  /** Footer / bar anchor: dark teal–navy from brand */
  footerBar: "#084d69",
  border: "#E5EEEE",
  panel: "#FBFEFE",
  /** Light panel fill for donation receipt blocks */
  panelDonation: "#eef4f7",
  label: "#111111",
  black: "#000000",
  muted: "#666666",
  text: "#17314b",
  white: "#ffffff",
  /** Footer links on donation receipt */
  footerLime: "#c8f5a8",
  /** Donation header corner — “TOMORROW” */
  tomorrowLime: "#d8f28c"
};

const FONTS = {
  body: "Helvetica",
  bold: "Helvetica-Bold",
  title: "Times-Bold"
};

const FOOTER_BAR_HEIGHT = 36;
const FOOTER_DONATION_HEIGHT = 50;

/** Tier blurbs aligned with donation thank-you email / receipt design */
const DONATION_RECEIPT_SUPPORT_ROWS = [
  {
    amount: "€25",
    tier: "Supporter",
    description: "Helps cover essential operational costs."
  },
  {
    amount: "€50",
    tier: "Friend",
    description: "Supports programs that empower communities through arts and culture."
  },
  {
    amount: "€100",
    tier: "Champion",
    description: "Enables impactful events that inspire, educate, and bring people together."
  },
  {
    amount: "€250",
    tier: "Patron",
    description: "Supports larger initiatives and helps expand our reach worldwide."
  },
  {
    amount: "€500+",
    tier: "Visionary",
    description: "Makes a transformative impact and helps shape a better future."
  }
];

const CARD_INSET_X = 32;
const CARD_INSET_Y = 16;
const RADIUS = 4;

/** @returns {{ w: number, h: number } | null} */
function pngDimensions(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    if (buf.length < 24 || buf.toString("ascii", 1, 4) !== "PNG") return null;
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  } catch {
    return null;
  }
}

function logoDimensions() {
  if (!fs.existsSync(HEADER_LOGO_PATH)) return { path: null, width: 0, height: 0 };
  const png = pngDimensions(HEADER_LOGO_PATH);
  const height = 48;
  const width = png && png.h ? (png.w / png.h) * height : height;
  return { path: HEADER_LOGO_PATH, width, height };
}

function fillHorizontalGradient(doc, x, y, w, h, leftColor, rightColor) {
  const gradient = doc.linearGradient(x, y, x + w, y);
  gradient.stop(0, leftColor).stop(1, rightColor);
  doc.fill(gradient);
}

function getCard(doc) {
  return {
    x: CARD_INSET_X,
    y: CARD_INSET_Y,
    w: doc.page.width - CARD_INSET_X * 2,
    h: doc.page.height - CARD_INSET_Y * 2
  };
}

function drawPageChrome(doc) {
  const card = getCard(doc);
  doc.save();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.pageBg);
  doc.roundedRect(card.x, card.y, card.w, card.h, 8).fill(COLORS.white);
  doc.restore();
}

function drawHeaderCorner(doc) {
  const card = getCard(doc);
  const cardRight = card.x + card.w;
  const w = 258;
  const h = 78;
  const x = cardRight - w;
  const y = card.y;
  const r = 8;

  doc.save();
  doc
    .moveTo(x, y)
    .lineTo(cardRight - r, y)
    .quadraticCurveTo(cardRight, y, cardRight, y + r)
    .lineTo(cardRight, y + h)
    .lineTo(x + 62, y + h)
    .bezierCurveTo(x + 22, y + h, x, y + 52, x, y + 16)
    .lineTo(x, y)
    .closePath();
  fillHorizontalGradient(doc, x, y, w, h, COLORS.deepNavy, COLORS.teal);
  doc.restore();
}

function drawHeaderBanner(doc) {
  const top = CARD_INSET_Y + 20;
  const leftM = doc.page.margins.left;
  const card = getCard(doc);
  const cardRight = card.x + card.w;

  drawHeaderCorner(doc);

  const { path: logoPath, width: logoW, height: logoH } = logoDimensions();
  let textX = leftM;
  if (logoPath) {
    doc.image(logoPath, leftM, top, { height: logoH });
    textX = leftM + logoW + 10;
  }

  const line1Size = 12;
  const line2Size = 13.5;
  const textBlockH = line1Size * 1.15 + line2Size * 1.15;
  const textY = top + Math.max(0, (logoPath ? logoH : 36) - textBlockH) / 2;

  doc
    .fillColor(COLORS.black)
    .font(FONTS.bold)
    .fontSize(line1Size)
    .text("STICHTING", textX, textY, { width: 190 });

  doc
    .fillColor(COLORS.teal)
    .font(FONTS.bold)
    .fontSize(line2Size)
    .text("THE V.O.I.C.E. NL", textX, textY + line1Size * 1.25, { width: 210 });

  const blobTextW = 128;
  const blobTextX = cardRight - blobTextW - 28;
  const blobTextTop = CARD_INSET_Y + 22;

  doc
    .fillColor(COLORS.white)
    .font(FONTS.bold)
    .fontSize(7)
    .text("PARTNER WITH US.", blobTextX, blobTextTop, {
      width: blobTextW,
      align: "right",
      lineGap: 0,
      characterSpacing: 0.35
    });

  doc
    .fillColor(COLORS.white)
    .font(FONTS.bold)
    .fontSize(6.4)
    .text("CREATE LASTING IMPACT.", blobTextX, blobTextTop + 12, {
      width: blobTextW,
      align: "right",
      lineGap: 0,
      characterSpacing: 0.35
    });

  doc.y = CARD_INSET_Y + 104;
}

function drawTitle(doc, title, subtitle) {
  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;

  doc
    .fillColor(COLORS.black)
    .font(FONTS.title)
    .fontSize(26)
    .text(title, left, doc.y, { width, align: "left" });

  if (subtitle) {
    doc.moveDown(0.1);
    doc
      .fillColor(COLORS.muted)
      .font(FONTS.body)
      .fontSize(9)
      .text(subtitle, left, doc.y, { width, align: "left", lineGap: 1 });
  }

  doc.moveDown(0.65);
}

function drawInfoText(doc, x, y, w, label, value) {
  const safeValue = value && String(value).trim() ? String(value) : "-";

  doc
    .fillColor(COLORS.label)
    .font(FONTS.bold)
    .fontSize(8.6)
    .text(label, x, y, { width: w });

  doc
    .fillColor(COLORS.teal)
    .font(FONTS.bold)
    .fontSize(9.2)
    .text(safeValue, x, y + 11, { width: w });
}

/** @returns {number} box height */
function drawLabeledBox(doc, x, y, w, h, label, value) {
  const padX = 12;
  const safeValue = value && String(value).trim() ? String(value) : "-";

  doc
    .roundedRect(x, y, w, h, RADIUS)
    .lineWidth(0.9)
    .strokeColor(COLORS.border)
    .stroke();

  drawInfoText(doc, x + padX, y + 10, w - padX * 2, label, safeValue);

  return h;
}

function drawReceiptDetailsGrid(doc, payload) {
  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;
  const rowH = 43;
  const colW = width / 2;
  const totalH = rowH * 3;
  const y0 = doc.y;

  const rows = [
    [
      { label: "Receipt No:", value: payload.receiptNumber },
      { label: "Sponsorship Amount:", value: payload.sponsorshipAmount }
    ],
    [
      { label: "Receipt Date:", value: payload.paymentDate },
      { label: "Sponsorship Tier:", value: payload.sponsorshipTier }
    ],
    [
      { label: "Payment Reference:", value: payload.stripePaymentId },
      { label: "Payment Method:", value: payload.paymentMethod }
    ]
  ];

  doc
    .roundedRect(left, y0, width, totalH, RADIUS)
    .lineWidth(0.9)
    .strokeColor(COLORS.border)
    .stroke();

  doc
    .moveTo(left + colW, y0)
    .lineTo(left + colW, y0 + totalH)
    .lineWidth(0.55)
    .strokeColor(COLORS.border)
    .stroke();

  for (let i = 1; i < rows.length; i += 1) {
    const y = y0 + rowH * i;
    doc
      .moveTo(left, y)
      .lineTo(left + width, y)
      .lineWidth(0.55)
      .strokeColor(COLORS.border)
      .stroke();
  }

  rows.forEach((pair, rowIdx) => {
    const y = y0 + rowIdx * rowH + 10;
    drawInfoText(doc, left + 14, y, colW - 28, pair[0].label, pair[0].value);
    drawInfoText(doc, left + colW + 14, y, colW - 28, pair[1].label, pair[1].value);
  });

  doc.y = y0 + totalH + 11;
}

function drawSponsorRow(doc, payload) {
  ensureSpace(doc, 44);
  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;
  const rowH = 41;
  const colW = width / 3;
  const y0 = doc.y;
  const cells = [
    { label: "Sponsor Name:", value: payload.sponsorName },
    { label: "Company Name:", value: payload.companyName },
    { label: "Sponsor Email:", value: payload.sponsorEmail }
  ];

  doc
    .roundedRect(left, y0, width, rowH, RADIUS)
    .lineWidth(0.9)
    .strokeColor(COLORS.border)
    .stroke();

  for (let i = 1; i < 3; i += 1) {
    const x = left + colW * i;
    doc
      .moveTo(x, y0)
      .lineTo(x, y0 + rowH)
      .lineWidth(0.55)
      .strokeColor(COLORS.border)
      .stroke();
  }

  cells.forEach((cell, idx) => {
    drawInfoText(doc, left + colW * idx + 12, y0 + 10, colW - 24, cell.label, cell.value);
  });

  doc.y = y0 + rowH + 10;
}

function drawConfirmationBlock(doc) {
  ensureSpace(doc, 42);
  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;
  const msg =
    "This receipt confirms that Stichting The V.O.I.C.E. NL has received the sponsorship contribution described above with thanks and appreciation.";

  doc
    .font(FONTS.body)
    .fontSize(8.6)
    .fillColor(COLORS.black)
    .text(msg, left, doc.y, {
      width,
      align: "left",
      lineGap: 2
    });
  doc.moveDown(0.55);
}

function drawHeaderBannerDonation(doc) {
  const top = CARD_INSET_Y + 20;
  const leftM = doc.page.margins.left;
  const card = getCard(doc);
  const cardRight = card.x + card.w;

  drawHeaderCorner(doc);

  const { path: logoPath, width: logoW, height: logoH } = logoDimensions();
  let textX = leftM;
  if (logoPath) {
    doc.image(logoPath, leftM, top, { height: logoH });
    textX = leftM + logoW + 10;
  }

  const line1Size = 12;
  const line2Size = 13.5;
  const textBlockH = line1Size * 1.15 + line2Size * 1.15;
  const textY = top + Math.max(0, (logoPath ? logoH : 36) - textBlockH) / 2;

  doc
    .fillColor(COLORS.black)
    .font(FONTS.bold)
    .fontSize(line1Size)
    .text("STICHTING", textX, textY, { width: 190 });

  doc
    .fillColor(COLORS.teal)
    .font(FONTS.bold)
    .fontSize(line2Size)
    .text("THE V.O.I.C.E. NL", textX, textY + line1Size * 1.25, { width: 210 });

  const blobTextW = 142;
  const blobTextX = cardRight - blobTextW - 22;
  const blobTextTop = CARD_INSET_Y + 22;

  doc
    .fillColor(COLORS.white)
    .font(FONTS.bold)
    .fontSize(6.2)
    .text("ARTS. CULTURE. COMMUNITY.", blobTextX, blobTextTop, {
      width: blobTextW,
      align: "right",
      lineGap: 0,
      characterSpacing: 0.25
    });

  doc
    .fillColor(COLORS.tomorrowLime)
    .font(FONTS.bold)
    .fontSize(7.4)
    .text("TOMORROW", blobTextX, blobTextTop + 13, {
      width: blobTextW,
      align: "right",
      lineGap: 0,
      characterSpacing: 0.35
    });

  doc.y = CARD_INSET_Y + 104;
}

function strokeDashedHLine(doc, x1, x2, y) {
  doc.save();
  doc.dash(4, { space: 3 });
  doc
    .moveTo(x1, y)
    .lineTo(x2, y)
    .lineWidth(0.55)
    .strokeColor(COLORS.border)
    .stroke();
  doc.restore();
}

function drawDonationReceiptDetailsGrid(doc, payload) {
  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;
  const rowH = 43;
  const colW = width / 2;
  const totalH = rowH * 3;
  const y0 = doc.y;

  const rows = [
    [
      { label: "Receipt No.:", value: payload.receiptNumber },
      { label: "Donation Amount:", value: payload.donationAmount }
    ],
    [
      { label: "Donation Date:", value: payload.paymentDate },
      { label: "Donation Level:", value: payload.donationLevel }
    ],
    [
      { label: "Transaction ID:", value: payload.stripePaymentId },
      { label: "Payment Method:", value: payload.paymentMethod }
    ]
  ];

  doc.save();
  doc.roundedRect(left, y0, width, totalH, RADIUS).fill(COLORS.panelDonation);
  doc.restore();

  doc
    .roundedRect(left, y0, width, totalH, RADIUS)
    .lineWidth(0.9)
    .strokeColor(COLORS.border)
    .stroke();

  for (let i = 1; i < rows.length; i += 1) {
    strokeDashedHLine(doc, left + 10, left + width - 10, y0 + rowH * i);
  }

  rows.forEach((pair, rowIdx) => {
    const y = y0 + rowIdx * rowH + 10;
    drawInfoText(doc, left + 14, y, colW - 28, pair[0].label, pair[0].value);
    drawInfoText(doc, left + colW + 14, y, colW - 28, pair[1].label, pair[1].value);
  });

  doc.y = y0 + totalH + 11;
}

function drawDonationDonorRow(doc, payload) {
  ensureSpace(doc, 68);
  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;

  doc.moveDown(0.15);
  doc
    .fillColor(COLORS.black)
    .font(FONTS.title)
    .fontSize(14)
    .text("Donor Information", left, doc.y, { width });
  doc.moveDown(0.35);

  const rowH = 41;
  const colW = width / 3;
  const y0 = doc.y;
  const address =
    payload.donorAddress && String(payload.donorAddress).trim()
      ? String(payload.donorAddress).trim()
      : "-";
  const cells = [
    { label: "Donor Name:", value: payload.donorName },
    { label: "Email:", value: payload.donorEmail },
    { label: "Address:", value: address }
  ];

  doc.save();
  doc.roundedRect(left, y0, width, rowH, RADIUS).fill(COLORS.panelDonation);
  doc.restore();

  doc
    .roundedRect(left, y0, width, rowH, RADIUS)
    .lineWidth(0.9)
    .strokeColor(COLORS.border)
    .stroke();

  for (let i = 1; i < 3; i += 1) {
    const x = left + colW * i;
    doc
      .moveTo(x, y0)
      .lineTo(x, y0 + rowH)
      .lineWidth(0.55)
      .strokeColor(COLORS.border)
      .stroke();
  }

  cells.forEach((cell, idx) => {
    drawInfoText(doc, left + colW * idx + 12, y0 + 10, colW - 24, cell.label, cell.value);
  });

  doc.y = y0 + rowH + 10;
}

function drawDonationConfirmationBlock(doc) {
  ensureSpace(doc, 42);
  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;
  const msg =
    "This receipt confirms that Stichting The V.O.I.C.E. NL has received the donation described above with thanks and appreciation.";

  doc
    .font(FONTS.body)
    .fontSize(8.6)
    .fillColor(COLORS.black)
    .text(msg, left, doc.y, {
      width,
      align: "center",
      lineGap: 2
    });
  doc.moveDown(0.55);
}

function drawDonationSupportsTable(doc) {
  ensureSpace(doc, 120);
  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;
  const amtW = 44;
  const tierW = 72;
  const descX = left + amtW + tierW + 8;
  const descW = width - amtW - tierW - 16;
  const padY = 7;
  const fsAmt = 8.1;
  const fsTier = 8.1;
  const fsDesc = 7.4;

  doc.moveDown(0.2);
  doc
    .fillColor(COLORS.black)
    .font(FONTS.title)
    .fontSize(16)
    .text("What Your Donation Supports", left, doc.y, { width, align: "center" });
  doc.moveDown(0.4);

  let bodyH = 0;
  DONATION_RECEIPT_SUPPORT_ROWS.forEach((row) => {
    doc.font(FONTS.body).fontSize(fsDesc);
    const hDesc = doc.heightOfString(row.description, { width: descW, lineGap: 0.35 });
    bodyH += padY * 2 + Math.max(fsAmt * 1.35, hDesc);
  });

  const tableTop = doc.y;
  doc.save();
  doc.roundedRect(left, tableTop, width, bodyH, RADIUS).fill(COLORS.panelDonation);
  doc.restore();
  doc
    .roundedRect(left, tableTop, width, bodyH, RADIUS)
    .lineWidth(0.85)
    .strokeColor(COLORS.border)
    .stroke();

  let y = tableTop;
  DONATION_RECEIPT_SUPPORT_ROWS.forEach((row, idx) => {
    if (idx > 0) {
      strokeDashedHLine(doc, left + 8, left + width - 8, y);
    }
    doc.font(FONTS.body).fontSize(fsDesc);
    const hDesc = doc.heightOfString(row.description, { width: descW, lineGap: 0.35 });
    const rowInnerH = padY * 2 + Math.max(fsAmt * 1.35, hDesc);
    const textY = y + padY;

    doc
      .fillColor(COLORS.teal)
      .font(FONTS.bold)
      .fontSize(fsAmt)
      .text(row.amount, left + 10, textY, { width: amtW - 4 });

    doc
      .fillColor(COLORS.label)
      .font(FONTS.bold)
      .fontSize(fsTier)
      .text(`| ${row.tier}`, left + amtW, textY, { width: tierW });

    doc
      .fillColor(COLORS.label)
      .font(FONTS.body)
      .fontSize(fsDesc)
      .text(row.description, descX, textY, { width: descW, lineGap: 0.35 });

    y += rowInnerH;
  });

  doc.y = tableTop + bodyH + 10;
}

function drawDonationNotesBox(doc, payload) {
  ensureSpace(doc, 52);
  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;
  const pad = 12;
  const title = "Notes / Tax Information / Remarks";
  const bodyRaw =
    payload.notesOptional && String(payload.notesOptional).trim()
      ? String(payload.notesOptional).trim()
      : "";
  const bodyText = bodyRaw || "—";

  doc.font(FONTS.bold).fontSize(9);
  const titleH = doc.heightOfString(title, { width: width - pad * 2 });
  doc.font(FONTS.body).fontSize(8.2);
  const bodyH = doc.heightOfString(bodyText, {
    width: width - pad * 2,
    lineGap: 1.2
  });
  const boxH = Math.max(44, pad + titleH + 6 + bodyH + pad);
  const y0 = doc.y;

  doc.save();
  doc.roundedRect(left, y0, width, boxH, RADIUS).fill(COLORS.panelDonation);
  doc.restore();
  doc
    .roundedRect(left, y0, width, boxH, RADIUS)
    .lineWidth(0.9)
    .strokeColor(COLORS.border)
    .stroke();

  doc
    .fillColor(COLORS.label)
    .font(FONTS.bold)
    .fontSize(9)
    .text(title, left + pad, y0 + pad, { width: width - pad * 2 });

  doc
    .fillColor(COLORS.teal)
    .font(FONTS.body)
    .fontSize(8.2)
    .text(bodyText, left + pad, y0 + pad + titleH + 6, {
      width: width - pad * 2,
      lineGap: 1.2
    });

  doc.y = y0 + boxH + 10;
}

function drawDonationAuthorisedBy(doc) {
  const left = doc.page.margins.left;
  doc.moveDown(0.2);
  const authTop = doc.y;
  doc.fillColor(COLORS.black).font(FONTS.bold).fontSize(8.8).text("Authorized by", left, authTop, {
    width: 200
  });

  doc.y = doc.y + 10;
  doc
    .fillColor(COLORS.teal)
    .font(FONTS.bold)
    .fontSize(9.2)
    .text("Stichting The V.O.I.C.E. NL", left, doc.y);

  doc.fillColor(COLORS.text);
}

function beginCoverageSection(doc) {
  doc.moveDown(0.15);
}

function drawCoverageHeading(doc) {
  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;

  doc
    .fillColor(COLORS.black)
    .font(FONTS.title)
    .fontSize(17)
    .text("Your Sponsorship Coverage", left, doc.y, { width, align: "center" });
  doc.moveDown(0.45);
}

function ensureSpace(doc, needed) {
  const maxY = doc.page.maxY();
  if (doc.y + needed <= maxY) return;
  // The receipt template is a one-page design; avoid creating a blank spill page.
}

function measureCoverageRowHeight(doc, tier, tierW, amountW, coverageW, sizes) {
  const vPad = sizes.vPad;
  const innerTier = tierW - 16;
  const innerAmt = amountW - 12;
  const innerCov = coverageW - 16;
  const tierFs = sizes.tierFs;
  const benFs = sizes.benFs;
  const benLineGap = sizes.benLineGap;

  doc.font(FONTS.bold).fontSize(tierFs);
  const hTier = doc.heightOfString(tier.name, { width: innerTier });
  const hAmt = doc.heightOfString(tier.amountLabel, { width: innerAmt });

  doc.font(FONTS.body).fontSize(benFs);
  const benefitsText = tier.benefits.join("; ");
  const hBen = doc.heightOfString(benefitsText, { width: innerCov, lineGap: benLineGap });

  return vPad + Math.max(hTier, hAmt, hBen) + vPad;
}

function drawCoverageTable(doc, coverageTiers) {
  const tiers = Array.isArray(coverageTiers) ? coverageTiers.filter(Boolean) : [];
  if (!tiers.length) return;

  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;
  const tierW = 76;
  const amountW = 64;
  const coverageW = width - tierW - amountW;

  const sizes = {
    vPad: 8,
    tierFs: 8.4,
    benFs: 7.3,
    benLineGap: 0.4
  };
  const innerPad = sizes.vPad;

  let totalBody = 0;
  tiers.forEach((tier) => {
    totalBody += measureCoverageRowHeight(doc, tier, tierW, amountW, coverageW, sizes);
  });

  drawCoverageHeading(doc);

  const tableTop = doc.y;
  const tableH = totalBody;

  doc
    .roundedRect(left, tableTop, width, tableH, RADIUS)
    .lineWidth(0.85)
    .strokeColor(COLORS.border)
    .stroke();

  const xTier = left;
  const xAmt = left + tierW;
  const xBen = left + tierW + amountW;

  let y = tableTop;

  doc
    .moveTo(xAmt, tableTop)
    .lineTo(xAmt, tableTop + tableH)
    .lineWidth(0.65)
    .strokeColor(COLORS.border)
    .stroke();
  doc
    .moveTo(xBen, tableTop)
    .lineTo(xBen, tableTop + tableH)
    .stroke();

  tiers.forEach((tier, idx) => {
    const rowH = measureCoverageRowHeight(doc, tier, tierW, amountW, coverageW, sizes);
    const rowTop = y;

    if (idx > 0) {
      doc
        .moveTo(left, rowTop)
        .lineTo(left + width, rowTop)
        .lineWidth(0.65)
        .strokeColor(COLORS.border)
        .stroke();
    }

    const cellMid = rowTop + innerPad;

    doc
      .fillColor(COLORS.label)
      .font(FONTS.bold)
      .fontSize(sizes.tierFs)
      .text(tier.name, xTier + 8, cellMid, { width: tierW - 16 });

    doc
      .font(FONTS.bold)
      .fontSize(sizes.tierFs)
      .fillColor(COLORS.teal)
      .text(tier.amountLabel, xAmt + 6, cellMid, { width: amountW - 12 });

    doc.fillColor(COLORS.black).font(FONTS.body).fontSize(sizes.benFs);
    doc.text(tier.benefits.join("; "), xBen + 8, cellMid, {
      width: coverageW - 16,
      lineGap: sizes.benLineGap
    });

    y += rowH;
  });

  doc.y = tableTop + tableH + 12;
}

function drawUploadRequest(doc, uploadUrl) {
  doc.moveDown(0.2);

  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;
  const pad = 11;
  const title = "Sponsor Media Upload Request";
  const body =
    "Please upload high-definition logo files, media files, promotional materials, brand guidelines and approved sponsor text using the secure pCloud upload request below:";

  doc.font(FONTS.bold).fontSize(8.8).fillColor(COLORS.black);
  const titleH = doc.heightOfString(title, { width: width - pad * 2 });
  doc.font(FONTS.body).fontSize(8).fillColor(COLORS.black);
  const bodyH = doc.heightOfString(body, { width: width - pad * 2, lineGap: 1 });
  doc.font(FONTS.body).fontSize(8);
  const urlH = doc.heightOfString(uploadUrl, { width: width - pad * 2, lineGap: 1 });
  const boxH = pad * 2 + titleH + 3 + bodyH + 2 + urlH + 2;

  const y0 = doc.y;
  doc
    .roundedRect(left, y0, width, boxH, RADIUS)
    .lineWidth(0.9)
    .strokeColor(COLORS.border)
    .stroke();

  doc
    .fillColor(COLORS.black)
    .font(FONTS.bold)
    .fontSize(8.8)
    .text(title, left + pad, y0 + pad, { width: width - pad * 2 });

  doc
    .fillColor(COLORS.black)
    .font(FONTS.body)
    .fontSize(8)
    .text(body, left + pad, y0 + pad + titleH + 3, {
      width: width - pad * 2,
      lineGap: 1
    });

  const urlY = y0 + pad + titleH + 3 + bodyH + 2;
  doc
    .fillColor(COLORS.teal)
    .font(FONTS.bold)
    .fontSize(8)
    .text(uploadUrl, left + pad, urlY, {
      link: uploadUrl,
      underline: true,
      lineGap: 1,
      width: width - pad * 2
    });

  doc.fillColor(COLORS.text);
  doc.y = y0 + boxH + 12;
}

function drawAuthorisedBy(doc) {
  doc.moveDown(0.25);
  doc.fillColor(COLORS.black).font(FONTS.bold).fontSize(8.8).text("Authorized by");

  doc.moveDown(0.55);
  doc.fillColor(COLORS.teal).font(FONTS.bold).fontSize(9.2).text("Stichting The V.O.I.C.E. NL");

  doc.fillColor(COLORS.text);
}

function drawFooterBar(doc, taglineText) {
  const range = doc.bufferedPageRange();
  const line = taglineText.trim() || "THE VISION OF INTERNATIONAL CULTURAL EXCHANGE IN THE NETHERLANDS.";
  const upper = line.toUpperCase().replace(/\s+/g, " ");

  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    const card = getCard(doc);
    const y = card.y + card.h - FOOTER_BAR_HEIGHT;
    const r = 8;
    doc
      .moveTo(card.x, y)
      .lineTo(card.x + card.w, y)
      .lineTo(card.x + card.w, y + FOOTER_BAR_HEIGHT - r)
      .quadraticCurveTo(
        card.x + card.w,
        y + FOOTER_BAR_HEIGHT,
        card.x + card.w - r,
        y + FOOTER_BAR_HEIGHT
      )
      .lineTo(card.x + r, y + FOOTER_BAR_HEIGHT)
      .quadraticCurveTo(card.x, y + FOOTER_BAR_HEIGHT, card.x, y + FOOTER_BAR_HEIGHT - r)
      .lineTo(card.x, y)
      .closePath();
    fillHorizontalGradient(doc, card.x, y, card.w, FOOTER_BAR_HEIGHT, COLORS.deepNavy, COLORS.teal);
    doc
      .fillColor(COLORS.white)
      .font(FONTS.body)
      .fontSize(6.5)
      .text(upper, card.x + 28, y + 14, {
        width: card.w - 56,
        align: "center",
        lineGap: 2,
        characterSpacing: 0.4
      });
  }
}

/**
 * Donation receipt footer: website, contact email, vision statement (solid bar).
 * @param {object} doc
 * @param {{ websiteUrl?: string, contactEmail?: string }} payload
 */
function drawDonationReceiptFooter(doc, payload) {
  const websiteUrl = (payload.websiteUrl || "https://stichtingthevoice.nl").trim();
  const contactEmail = resolveDonationPublicContactEmail(payload.contactEmail);
  const range = doc.bufferedPageRange();

  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    const card = getCard(doc);
    const y = card.y + card.h - FOOTER_DONATION_HEIGHT;
    const w = card.w;
    const x = card.x;

    doc.save();
    doc.rect(x, y, w, FOOTER_DONATION_HEIGHT).fill(COLORS.footerBar);
    doc.restore();

    const colW = w / 3;
    const padX = 16;
    const topY = y + 9;
    const linkY = topY + 11;

    doc
      .fillColor(COLORS.white)
      .font(FONTS.body)
      .fontSize(6.1)
      .text("Visit Our Website", x + padX, topY, { width: colW - padX * 1.5, lineGap: 0.5 });

    doc
      .fillColor(COLORS.footerLime)
      .font(FONTS.bold)
      .fontSize(6.3)
      .text(websiteUrl, x + padX, linkY, {
        width: colW - padX * 1.5,
        link: websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`
      });

    const midX = x + colW;
    doc
      .fillColor(COLORS.white)
      .font(FONTS.body)
      .fontSize(6.1)
      .text("Email Us", midX + 6, topY, { width: colW - 20 });

    doc
      .fillColor(COLORS.footerLime)
      .font(FONTS.bold)
      .fontSize(6.3)
      .text(contactEmail, midX + 6, linkY, {
        width: colW - 20,
        link: `mailto:${contactEmail}`
      });

    const rightX = x + colW * 2 + 4;
    const rightW = colW - padX - 8;
    doc
      .fillColor(COLORS.white)
      .font(FONTS.bold)
      .fontSize(5.6)
      .text(
        "THE VISION OF INTERNATIONAL\nCULTURAL EXCHANGE IN THE\nNETHERLANDS.",
        rightX,
        topY + 1,
        {
          width: rightW,
          align: "right",
          lineGap: 1.6,
          characterSpacing: 0.28
        }
      );
  }
}

/**
 * Render the sponsorship receipt as a PDF and resolve with a Buffer.
 *
 * @param {object} payload
 * @param {string} payload.receiptNumber  e.g. "VOICE-2026-9F8E2A1B"
 * @param {string} payload.stripePaymentId
 * @param {string} payload.paymentDate    Pre-formatted date string
 * @param {string} payload.sponsorName
 * @param {string} payload.sponsorEmail
 * @param {string} payload.companyName
 * @param {string} [payload.tierId]  associate | silver | gold | platinum (omit for custom)
 * @param {string} payload.sponsorshipTier
 * @param {string} payload.sponsorshipAmount  Pre-formatted currency string
 * @param {string} payload.paymentMethod  e.g. "Card via Stripe"
 * @param {string} payload.paymentStatus  (optional; not shown on this template)
 * @param {string} payload.uploadUrl
 * @param {string} payload.contactEmail
 * @param {string} payload.orgTagline
 */
export function renderSponsorshipReceiptPdf(payload) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 44, bottom: 12, left: 56, right: 56 },
        bufferPages: true,
        info: {
          Title: `Sponsorship Receipt ${payload.receiptNumber || ""}`.trim(),
          Author: "Stichting The V.O.I.C.E. NL",
          Subject: "Sponsorship Receipt",
          Producer: "Stichting The V.O.I.C.E. NL",
          Creator: "Stichting The V.O.I.C.E. NL"
        }
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      drawPageChrome(doc);
      drawHeaderBanner(doc);

      drawTitle(
        doc,
        "Sponsorship Receipt",
        "Acknowledgement of sponsorship contribution"
      );

      drawReceiptDetailsGrid(doc, payload);
      drawSponsorRow(doc, payload);
      drawConfirmationBlock(doc);

      const coverageTier = getCoverageForTier(payload.tierId);
      if (coverageTier) {
        beginCoverageSection(doc);
        drawCoverageTable(doc, [coverageTier]);
      }
      drawUploadRequest(doc, payload.uploadUrl);
      drawAuthorisedBy(doc);

      const footerLine =
        payload.orgTagline ||
        "The vision of international cultural exchange in the Netherlands";
      drawFooterBar(doc, footerLine);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Donation receipt PDF (no sponsorship coverage or media upload block).
 *
 * @param {object} payload
 * @param {string} payload.receiptNumber
 * @param {string} payload.stripePaymentId
 * @param {string} payload.paymentDate
 * @param {string} payload.donorName
 * @param {string} payload.donorEmail
 * @param {string} payload.companyName
 * @param {string} payload.donationLevel
 * @param {string} payload.donationAmount  Pre-formatted currency string
 * @param {string} payload.paymentMethod
 * @param {string} [payload.donorAddress]  Mailing / location line for receipt
 * @param {string} [payload.notesOptional]  Notes, tax info, or remarks from donor
 * @param {string} [payload.websiteUrl]  Public site URL for footer
 * @param {string} [payload.contactEmail]  Contact email for footer
 * @param {string} [payload.orgTagline]  Unused on donation layout (kept for API symmetry)
 */
export function renderDonationReceiptPdf(payload) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 44, bottom: 12, left: 56, right: 56 },
        bufferPages: true,
        info: {
          Title: `Donation Receipt ${payload.receiptNumber || ""}`.trim(),
          Author: "Stichting The V.O.I.C.E. NL",
          Subject: "Donation Receipt",
          Producer: "Stichting The V.O.I.C.E. NL",
          Creator: "Stichting The V.O.I.C.E. NL"
        }
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      drawPageChrome(doc);
      drawHeaderBannerDonation(doc);

      drawTitle(doc, "Donation Receipt", "Acknowledgement of charitable contribution");

      drawDonationReceiptDetailsGrid(doc, payload);
      drawDonationDonorRow(doc, payload);
      drawDonationConfirmationBlock(doc);
      drawDonationSupportsTable(doc);
      drawDonationNotesBox(doc, payload);
      drawDonationAuthorisedBy(doc);

      drawDonationReceiptFooter(doc, payload);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export default renderSponsorshipReceiptPdf;
