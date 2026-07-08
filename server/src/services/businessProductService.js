import BusinessProduct from "../models/BusinessProduct.js";
import BusinessProfile from "../models/BusinessProfile.js";

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

async function assertOwnership(businessId, userId) {
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
  return business;
}

export async function listProducts(businessId) {
  return BusinessProduct.find({ businessId, isAvailable: true }).sort({ isFeatured: -1, sortOrder: 1 }).lean();
}

export async function createProduct(userId, businessId, data) {
  await assertOwnership(businessId, userId);

  const baseSlug = generateSlug(data.name);
  const slug = await makeUniqueProductSlug(businessId, baseSlug);

  const product = await BusinessProduct.create({
    businessId,
    name: data.name,
    slug,
    description: data.description || "",
    type: data.type || "service",
    imageUrls: data.imageUrls || [],
    priceMinor: data.priceMinor,
    currency: data.currency || "eur",
    stockCount: data.stockCount ?? null,
    isAvailable: data.isAvailable !== false,
    isFeatured: data.isFeatured || false,
    variants: data.variants || [],
    tags: data.tags || [],
    deliveryInfo: data.deliveryInfo || "",
    sortOrder: data.sortOrder || 0,
  });

  return product;
}

export async function updateProduct(userId, productId, data) {
  const product = await BusinessProduct.findById(productId);
  if (!product) {
    const err = new Error("Product not found.");
    err.status = 404;
    throw err;
  }
  await assertOwnership(product.businessId, userId);

  const allowed = [
    "name", "description", "type", "imageUrls", "priceMinor",
    "stockCount", "isAvailable", "isFeatured", "variants", "tags",
    "deliveryInfo", "sortOrder",
  ];
  for (const key of allowed) {
    if (data[key] !== undefined) product[key] = data[key];
  }

  await product.save();
  return product;
}

export async function deleteProduct(userId, productId) {
  const product = await BusinessProduct.findById(productId);
  if (!product) {
    const err = new Error("Product not found.");
    err.status = 404;
    throw err;
  }
  await assertOwnership(product.businessId, userId);
  await product.deleteOne();
}

export async function reorderProducts(userId, businessId, orderedIds) {
  await assertOwnership(businessId, userId);
  const ops = orderedIds.map((id, index) => ({
    updateOne: { filter: { _id: id, businessId }, update: { $set: { sortOrder: index } } },
  }));
  await BusinessProduct.bulkWrite(ops);
}

// Admin version — no ownership check
export async function adminListProducts(businessId) {
  return BusinessProduct.find({ businessId }).sort({ isFeatured: -1, sortOrder: 1 }).lean();
}

export async function adminUpdateProduct(productId, data) {
  const product = await BusinessProduct.findByIdAndUpdate(productId, { $set: data }, { new: true, runValidators: true });
  if (!product) {
    const err = new Error("Product not found.");
    err.status = 404;
    throw err;
  }
  return product;
}
