import * as adminDiscountService from "../services/adminDiscountRuleService.js";
import * as adminCatalogService from "../services/adminDiscountCatalogService.js";
import DiscountCode from "../models/DiscountCode.js";
import User from "../models/User.js";
import {
  sendPersonalCodeCreatedEmail,
  sendReferralCodeCreatedEmail,
} from "../services/discountMailer.js";

function handleError(res, error) {
  const status = error.status || 500;
  const message = error.message || "Something went wrong.";
  if (status >= 500) console.error("[admin-discounts]", error);
  return res.status(status).json({ error: message });
}

export async function getDashboard(req, res) {
  try {
    const stats = await adminDiscountService.getDashboardStats();
    return res.status(200).json({ stats });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listDiscounts(req, res) {
  try {
    const discounts = await adminCatalogService.listAllDiscountsForAdmin(req.query);
    return res.status(200).json({ discounts });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getDiscount(req, res) {
  try {
    const { kind, id } = adminCatalogService.parseCatalogId(req.params.id);
    if (kind === "legacy") {
      const data = await adminCatalogService.getLegacyDiscountDetail(id);
      return res.status(200).json(data);
    }
    if (kind === "voucher") {
      const data = await adminCatalogService.getVoucherDiscountDetail(id);
      return res.status(200).json(data);
    }
    const data = await adminDiscountService.getDiscountRuleById(id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createDiscount(req, res) {
  try {
    const discount = await adminDiscountService.createDiscountRule(req.body, req.admin?.id);
    const { type, assignedEmail, referrerEmail, code, discountValue, expiryDate } = req.body || {};

    if (type === "personalized_code" && assignedEmail) {
      sendPersonalCodeCreatedEmail({
        email: assignedEmail,
        discountCode: code,
        discountValue: `${discountValue}${req.body.discountType === "percentage" ? "%" : " EUR"}`,
        expiryDate: expiryDate ? new Date(expiryDate).toLocaleDateString("nl-NL") : "",
      }).catch(() => {});
    }
    if (type === "referral_code" && referrerEmail) {
      sendReferralCodeCreatedEmail({
        email: referrerEmail,
        discountCode: code,
      }).catch(() => {});
    }

    return res.status(201).json({ discount });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateDiscount(req, res) {
  try {
    const discount = await adminDiscountService.updateDiscountRule(req.params.id, req.body, req.admin?.id);
    return res.status(200).json({ discount });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteDiscount(req, res) {
  try {
    await adminDiscountService.deleteDiscountRule(req.params.id, req.admin?.id);
    return res.status(200).json({ ok: true });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function pauseDiscount(req, res) {
  try {
    const discount = await adminDiscountService.pauseDiscountRule(req.params.id, req.admin?.id);
    return res.status(200).json({ discount });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function activateDiscount(req, res) {
  try {
    const discount = await adminDiscountService.activateDiscountRule(req.params.id, req.admin?.id);
    return res.status(200).json({ discount });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function duplicateDiscount(req, res) {
  try {
    const discount = await adminDiscountService.duplicateDiscountRule(req.params.id, req.admin?.id);
    return res.status(200).json({ discount });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getUsage(req, res) {
  try {
    const usages = await adminDiscountService.getDiscountUsage(req.params.id, req.query);
    return res.status(200).json({ usages });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function exportUsage(req, res) {
  try {
    const csv = await adminDiscountService.exportDiscountUsage(req.query);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="discount-usage-export.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function syncDiscounts(req, res) {
  try {
    const result = await adminDiscountService.syncDefaultMemberDiscounts(req.admin?.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listUsers(req, res) {
  try {
    const users = await adminDiscountService.listUsersForAssignment();
    return res.status(200).json({ users });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listEvents(req, res) {
  try {
    const events = await adminDiscountService.listEventsForEligibility();
    return res.status(200).json({ events });
  } catch (error) {
    return handleError(res, error);
  }
}

/** Legacy DiscountCode endpoints for backward compatibility */
export async function listLegacyDiscounts(req, res) {
  try {
    const discounts = await DiscountCode.find({})
      .sort({ createdAt: -1 })
      .populate("assignedUsers", "firstName lastName email")
      .lean();

    return res.status(200).json({
      discounts: discounts.map((d) => ({
        catalogId: `legacy:${d._id.toString()}`,
        id: d._id.toString(),
        recordKind: "legacy",
        name: d.name,
        description: d.description,
        code: d.code,
        discountValue: d.discountValue,
        discountLabel: `${d.discountValue}%`,
        isGlobal: d.isGlobal,
        status: d.status || "active",
        visibleToUsers: d.visibleToUsers !== false,
        showOnDashboard: d.showOnDashboard !== false,
        source: d.source || "legacy",
        type: "legacy_code",
        startsAt: d.startsAt,
        expiresAt: d.expiresAt,
        assignedUsers: (d.assignedUsers || []).map((u) => ({
          id: u._id.toString(),
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
        })),
        createdAt: d.createdAt,
        isLegacy: true,
      })),
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createLegacyDiscount(req, res) {
  try {
    const { name, description, code, discountValue, isGlobal, assignedUsers } = req.body || {};
    if (!name?.trim() || !description?.trim() || !code?.trim() || discountValue === undefined) {
      return res.status(400).json({ error: "Name, description, code, and discount value are required." });
    }
    const cleanCode = code.trim();
    const existing = await DiscountCode.findOne({ code: cleanCode }).select("_id").lean();
    if (existing) return res.status(400).json({ error: `Discount code '${cleanCode}' already exists.` });

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

export async function listReferrals(req, res) {
  try {
    const referrals = await adminDiscountService.listReferrals(req.query);
    return res.status(200).json({ referrals });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function approveReferral(req, res) {
  try {
    const reward = await adminDiscountService.approveReferralReward(req.params.id, req.admin?.id);
    return res.status(200).json({ reward });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function markReferralPaid(req, res) {
  try {
    const reward = await adminDiscountService.markReferralRewardPaid(req.params.id, req.admin?.id);
    return res.status(200).json({ reward });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function cancelReferral(req, res) {
  try {
    const reward = await adminDiscountService.cancelReferralReward(req.params.id, req.admin?.id);
    return res.status(200).json({ reward });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateCatalogDiscount(req, res) {
  try {
    const discount = await adminCatalogService.updateCatalogDiscount(
      req.params.catalogId,
      req.body || {},
      req.admin?.id,
    );
    return res.status(200).json({ discount });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function hideCatalogDiscount(req, res) {
  try {
    const discount = await adminCatalogService.hideCatalogDiscountFromDashboard(
      req.params.catalogId,
      req.admin?.id,
    );
    return res.status(200).json({ discount });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function archiveCatalogDiscount(req, res) {
  try {
    const discount = await adminCatalogService.archiveCatalogDiscount(
      req.params.catalogId,
      req.admin?.id,
    );
    return res.status(200).json({ discount });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteCatalogDiscount(req, res) {
  try {
    const result = await adminCatalogService.deleteCatalogDiscount(req.params.catalogId, req.admin?.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function bulkArchiveLegacyDiscounts(req, res) {
  try {
    const result = await adminCatalogService.bulkArchiveLegacyEventDiscounts(req.admin?.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}
