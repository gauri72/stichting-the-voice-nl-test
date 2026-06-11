import DiscountCode from "../models/DiscountCode.js";
import User from "../models/User.js";

function handleError(res, error) {
  const status = error.status || 500;
  const message = error.message || "Something went wrong.";
  if (status >= 500) {
    console.error("[admin-discounts]", error);
  }
  return res.status(status).json({ error: message });
}

export async function listDiscounts(req, res) {
  try {
    const discounts = await DiscountCode.find({})
      .sort({ createdAt: -1 })
      .populate("assignedUsers", "firstName lastName email")
      .lean();

    return res.status(200).json({
      discounts: discounts.map((d) => ({
        id: d._id.toString(),
        name: d.name,
        description: d.description,
        code: d.code,
        discountValue: d.discountValue,
        isGlobal: d.isGlobal,
        assignedUsers: d.assignedUsers.map((u) => ({
          id: u._id.toString(),
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
        })),
        createdAt: d.createdAt,
      })),
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createDiscount(req, res) {
  try {
    const { name, description, code, discountValue, isGlobal, assignedUsers } = req.body || {};

    if (!name?.trim() || !description?.trim() || !code?.trim() || discountValue === undefined) {
      return res.status(400).json({ error: "Name, description, code, and discount value are required." });
    }

    const cleanCode = code.trim();

    const existing = await DiscountCode.findOne({ code: cleanCode }).select("_id").lean();
    if (existing) {
      return res.status(400).json({ error: `Discount code '${cleanCode}' already exists.` });
    }

    const discount = await DiscountCode.create({
      name: name.trim(),
      description: description.trim(),
      code: cleanCode,
      discountValue: Number(discountValue),
      isGlobal: Boolean(isGlobal),
      assignedUsers: isGlobal ? [] : (Array.isArray(assignedUsers) ? assignedUsers : []),
      createdBy: req.admin?.id || null,
    });

    return res.status(201).json({ discount });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteDiscount(req, res) {
  try {
    const { id } = req.params;
    const discount = await DiscountCode.findById(id);
    if (!discount) {
      return res.status(404).json({ error: "Discount code not found." });
    }
    await discount.deleteOne();
    return res.status(200).json({ ok: true });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateDiscount(req, res) {
  try {
    const { id } = req.params;
    const { name, description, code, discountValue, isGlobal, assignedUsers } = req.body || {};

    if (!name?.trim() || !description?.trim() || !code?.trim() || discountValue === undefined) {
      return res.status(400).json({ error: "Name, description, code, and discount value are required." });
    }

    const discount = await DiscountCode.findById(id);
    if (!discount) {
      return res.status(404).json({ error: "Discount code not found." });
    }

    const cleanCode = code.trim();

    // Check if the code is being changed and is already taken
    if (cleanCode !== discount.code) {
      const existing = await DiscountCode.findOne({ code: cleanCode }).select("_id").lean();
      if (existing) {
        return res.status(400).json({ error: `Discount code '${cleanCode}' already exists.` });
      }
    }

    discount.name = name.trim();
    discount.description = description.trim();
    discount.code = cleanCode;
    discount.discountValue = Number(discountValue);
    discount.isGlobal = Boolean(isGlobal);
    discount.assignedUsers = isGlobal ? [] : (Array.isArray(assignedUsers) ? assignedUsers : []);

    await discount.save();

    return res.status(200).json({ discount });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listUsers(req, res) {
  try {
    const users = await User.find({})
      .sort({ firstName: 1 })
      .select("firstName lastName email")
      .lean();

    return res.status(200).json({
      users: users.map((u) => ({
        id: u._id.toString(),
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
      })),
    });
  } catch (error) {
    return handleError(res, error);
  }
}
