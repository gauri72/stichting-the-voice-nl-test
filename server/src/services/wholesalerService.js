import WholesalerProfile from "../models/WholesalerProfile.js";

export async function registerWholesaler(userId, data) {
  const existing = await WholesalerProfile.findOne({ userId });
  if (existing) {
    const err = new Error("You already have a wholesaler account.");
    err.status = 409;
    throw err;
  }

  const profile = await WholesalerProfile.create({
    userId,
    companyName: data.companyName,
    companyType: data.companyType,
    kvkNumber: data.kvkNumber || "",
    vatNumber: data.vatNumber || "",
    contactEmail: data.contactEmail || "",
    contactPhone: data.contactPhone || "",
    address: {
      street: data.address?.street || "",
      city: data.address?.city || "",
      postcode: data.address?.postcode || "",
      country: data.address?.country || "NL",
    },
    website: data.website || "",
    status: "pending",
  });

  return profile;
}

export async function getWholesalerStatus(userId) {
  const profile = await WholesalerProfile.findOne({ userId }).lean();
  if (!profile) return { registered: false, status: null };
  return {
    registered: true,
    status: profile.status,
    companyName: profile.companyName,
    profileId: profile._id.toString(),
  };
}

export async function getMyWholesalerProfile(userId) {
  const profile = await WholesalerProfile.findOne({ userId }).lean();
  if (!profile) {
    const err = new Error("Wholesaler profile not found.");
    err.status = 404;
    throw err;
  }
  return profile;
}

export async function updateMyWholesalerProfile(userId, data) {
  const profile = await WholesalerProfile.findOne({ userId });
  if (!profile) {
    const err = new Error("Wholesaler profile not found.");
    err.status = 404;
    throw err;
  }

  const allowed = ["companyName", "contactEmail", "contactPhone", "website", "vatNumber"];
  for (const key of allowed) {
    if (data[key] !== undefined) profile[key] = data[key];
  }
  if (data.address) {
    Object.assign(profile.address, data.address);
  }

  await profile.save();
  return profile;
}

export async function reorderFromPastOrder(userId, orderId) {
  // Import inline to avoid circular deps at module load
  const { default: BusinessOrder } = await import("../models/BusinessOrder.js");
  const { default: BusinessProduct } = await import("../models/BusinessProduct.js");

  const wholesaler = await WholesalerProfile.findOne({ userId });
  if (!wholesaler || wholesaler.status !== "approved") {
    const err = new Error("Approved wholesaler account required.");
    err.status = 403;
    throw err;
  }

  const order = await BusinessOrder.findOne({ _id: orderId, customerId: userId }).lean();
  if (!order) {
    const err = new Error("Order not found.");
    err.status = 404;
    throw err;
  }

  // Validate items are still available
  const cartItems = [];
  for (const item of order.items) {
    const product = await BusinessProduct.findOne({ _id: item.productId, isAvailable: true }).lean();
    if (product) {
      cartItems.push({
        productId: item.productId.toString(),
        name: product.name,
        type: product.type,
        priceMinor: product.priceMinor,
        currency: product.currency,
        quantity: item.quantity,
        variant: item.variant || "",
        imageUrl: product.imageUrls?.[0] || "",
      });
    }
  }

  return {
    businessId: order.businessId.toString(),
    businessName: order.businessName,
    items: cartItems,
    sourceOrderId: orderId,
  };
}

// --- Admin functions ---

export async function adminListWholesalers({ status, search, page = 1, pageSize = 20 } = {}) {
  const filter = {};
  if (status) filter.status = status;
  if (search) filter.companyName = { $regex: search, $options: "i" };

  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    WholesalerProfile.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate("userId", "firstName lastName email")
      .lean(),
    WholesalerProfile.countDocuments(filter),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function adminUpdateWholesaler(profileId, adminId, { action, notes }) {
  const profile = await WholesalerProfile.findById(profileId);
  if (!profile) {
    const err = new Error("Wholesaler profile not found.");
    err.status = 404;
    throw err;
  }

  if (action === "approve") {
    profile.status = "approved";
    profile.approvedBy = adminId;
    profile.approvedAt = new Date();
  } else if (action === "reject" || action === "suspend") {
    profile.status = action === "reject" ? "pending" : "suspended";
  }

  if (notes !== undefined) profile.notes = notes;
  await profile.save();
  return profile;
}
