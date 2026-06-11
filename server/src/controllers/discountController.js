import DiscountCode from "../models/DiscountCode.js";

function handleError(res, error) {
  const status = error.status || 500;
  const message = error.message || "Something went wrong.";
  if (status >= 500) {
    console.error("[discounts]", error);
  }
  return res.status(status).json({ error: message });
}

export async function getCustomerDiscounts(req, res) {
  try {
    const userId = req.user._id;
    const discounts = await DiscountCode.find({
      $or: [
        { isGlobal: true },
        { assignedUsers: userId },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      discounts: discounts.map((d) => ({
        id: d._id.toString(),
        name: d.name,
        description: d.description,
        code: d.code,
        discountValue: d.discountValue,
      })),
    });
  } catch (error) {
    return handleError(res, error);
  }
}
