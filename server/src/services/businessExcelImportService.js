import xlsx from "xlsx";
import BusinessProduct from "../models/BusinessProduct.js";
import BusinessProfile from "../models/BusinessProfile.js";

const VALID_TYPES = ["physical", "digital", "service"];

const TEMPLATE_HEADERS = [
  "name",
  "description",
  "type",
  "priceEUR",
  "stockCount",
  "deliveryInfo",
  "isAvailable",
  "minOrderQty",
  "tier1_minQty",
  "tier1_priceEUR",
  "tier2_minQty",
  "tier2_priceEUR",
  "tags",
];

function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function makeUniqueProductSlug(businessId, base) {
  let slug = base;
  let attempt = 0;
  while (await BusinessProduct.exists({ businessId, slug })) {
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
  return slug;
}

function parseRow(row, rowNumber) {
  const errors = [];

  const name = String(row.name || "").trim();
  if (!name) errors.push("name is required");

  const type = String(row.type || "service").trim().toLowerCase();
  if (!VALID_TYPES.includes(type)) errors.push(`type must be one of: ${VALID_TYPES.join(", ")}`);

  const priceEUR = parseFloat(row.priceEUR);
  if (isNaN(priceEUR) || priceEUR < 0) errors.push("priceEUR must be a non-negative number");

  const priceMinor = Math.round(priceEUR * 100);

  const stockRaw = row.stockCount === "" || row.stockCount === undefined ? null : parseInt(row.stockCount, 10);
  const stockCount = isNaN(stockRaw) ? null : stockRaw;

  const isAvailable = String(row.isAvailable || "TRUE").trim().toUpperCase() !== "FALSE";

  const minOrderQty = Math.max(1, parseInt(row.minOrderQty, 10) || 1);

  // Parse up to 2 bulk pricing tiers
  const bulkPricingTiers = [];
  for (let i = 1; i <= 2; i++) {
    const minQtyRaw = parseInt(row[`tier${i}_minQty`], 10);
    const priceRaw = parseFloat(row[`tier${i}_priceEUR`]);
    if (!isNaN(minQtyRaw) && minQtyRaw > 0 && !isNaN(priceRaw) && priceRaw >= 0) {
      bulkPricingTiers.push({ minQty: minQtyRaw, priceMinor: Math.round(priceRaw * 100) });
    }
  }

  const tags = String(row.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return {
    valid: errors.length === 0,
    errors,
    rowNumber,
    data: {
      name,
      description: String(row.description || "").trim(),
      type,
      priceMinor,
      stockCount,
      deliveryInfo: String(row.deliveryInfo || "").trim(),
      isAvailable,
      minOrderQty,
      bulkPricingTiers,
      tags,
    },
  };
}

export async function importProductsFromExcel(userId, businessId, buffer, filename) {
  // Verify ownership
  const business = await BusinessProfile.findById(businessId).lean();
  if (!business) {
    const err = new Error("Business not found.");
    err.status = 404;
    throw err;
  }
  if (business.userId.toString() !== userId.toString()) {
    const err = new Error("Forbidden.");
    err.status = 403;
    throw err;
  }

  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

  if (rows.length === 0) {
    return { imported: 0, skipped: 0, errors: [], message: "No data rows found in the file." };
  }

  let imported = 0;
  let skipped = 0;
  const errorList = [];

  for (let i = 0; i < rows.length; i++) {
    const parsed = parseRow(rows[i], i + 2); // row 1 = header, so data starts at row 2

    if (!parsed.valid) {
      skipped += 1;
      errorList.push({ row: parsed.rowNumber, message: parsed.errors.join("; ") });
      continue;
    }

    const { data } = parsed;
    const slug = await makeUniqueProductSlug(businessId, generateSlug(data.name));

    await BusinessProduct.findOneAndUpdate(
      { businessId, slug: generateSlug(data.name) },
      {
        $set: {
          businessId,
          name: data.name,
          slug,
          description: data.description,
          type: data.type,
          priceMinor: data.priceMinor,
          stockCount: data.stockCount,
          deliveryInfo: data.deliveryInfo,
          isAvailable: data.isAvailable,
          minOrderQty: data.minOrderQty,
          bulkPricingTiers: data.bulkPricingTiers,
          tags: data.tags,
        },
        $setOnInsert: { sortOrder: 0, isFeatured: false, imageUrls: [], variants: [], currency: "eur" },
      },
      { upsert: true, new: true }
    );

    imported += 1;
  }

  // Append to business import log (keep last 20)
  await BusinessProfile.findByIdAndUpdate(businessId, {
    $push: {
      importLogs: {
        $each: [{ filename, importedAt: new Date(), importedCount: imported, errorCount: skipped }],
        $slice: -20,
      },
    },
  });

  return { imported, skipped, errors: errorList };
}

export function generateExcelTemplate() {
  const wb = xlsx.utils.book_new();
  const headerRow = TEMPLATE_HEADERS;
  const exampleRow = [
    "Organic Olive Oil 500ml",
    "Cold-pressed extra virgin olive oil from Greece",
    "physical",
    "12.50",
    "200",
    "Ships within 3 business days",
    "TRUE",
    "6",
    "12",
    "11.00",
    "48",
    "9.50",
    "olive oil,organic,food",
  ];

  const ws = xlsx.utils.aoa_to_sheet([headerRow, exampleRow]);
  xlsx.utils.book_append_sheet(wb, ws, "Products");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
}

export async function getImportHistory(userId, businessId) {
  const business = await BusinessProfile.findById(businessId, "userId importLogs").lean();
  if (!business) {
    const err = new Error("Business not found.");
    err.status = 404;
    throw err;
  }
  if (business.userId.toString() !== userId.toString()) {
    const err = new Error("Forbidden.");
    err.status = 403;
    throw err;
  }
  return [...(business.importLogs || [])].reverse(); // newest first
}
