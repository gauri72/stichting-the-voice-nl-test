function handleError(res, error) {
  const status = error.status || 500;
  if (status >= 500) console.error("[admin-settings]", error);
  return res.status(status).json({ error: error.message || "Something went wrong." });
}

function clientIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "";
}

export async function getAllSettings(req, res) {
  try {
    const { getAllSettingsSummary } = await import("../services/settingsService.js");
    const settings = await getAllSettingsSummary();
    return res.json({ settings });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getCategorySettings(req, res) {
  try {
    const { getCategorySettings } = await import("../services/settingsService.js");
    const settings = await getCategorySettings(req.params.category);
    return res.json({ category: req.params.category, settings });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchCategorySettings(req, res) {
  try {
    const { updateCategorySettings } = await import("../services/settingsService.js");
    const { loadStripeSecretsFromSettings } = await import("../services/stripe.js");

    if (["stripe", "bank", "payment"].includes(req.params.category) && req.body?.confirm !== true) {
      return res.status(400).json({
        error: "Confirmation required for financial settings changes.",
        requireConfirm: true,
      });
    }

    const settings = await updateCategorySettings(
      req.params.category,
      req.body,
      req.admin?.id,
      clientIp(req)
    );

    if (req.params.category === "stripe") {
      await loadStripeSecretsFromSettings();
    }

    return res.json({ category: req.params.category, settings });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getStripeSettings(req, res) {
  try {
    const { getStripeSettings } = await import("../services/stripeSettingsService.js");
    const settings = await getStripeSettings(true);
    return res.json({ settings });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchStripeSettings(req, res) {
  req.params.category = "stripe";
  if (req.body?.confirm !== true) {
    return res.status(400).json({ error: "Confirmation required.", requireConfirm: true });
  }
  return patchCategorySettings(req, res);
}

export async function testStripeConnection(req, res) {
  try {
    const { testStripeConnection } = await import("../services/stripeSettingsService.js");
    const result = await testStripeConnection();
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function verifyStripeWebhook(req, res) {
  try {
    const { verifyStripeWebhook } = await import("../services/stripeSettingsService.js");
    const result = await verifyStripeWebhook();
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function syncStripeBank(req, res) {
  try {
    const { syncStripeBankAccount } = await import("../services/stripeSettingsService.js");
    const result = await syncStripeBankAccount(req.admin?.id);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getBankSettings(req, res) {
  try {
    const { getBankSettings } = await import("../services/bankSettingsService.js");
    const settings = await getBankSettings();
    return res.json({ settings });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchBankSettings(req, res) {
  req.params.category = "bank";
  if (req.body?.confirm !== true) {
    return res.status(400).json({ error: "Confirmation required.", requireConfirm: true });
  }
  return patchCategorySettings(req, res);
}

export async function getEmailProviderSettings(req, res) {
  try {
    const { getEmailProviderSettings } = await import("../services/emailProviderSettingsService.js");
    const settings = await getEmailProviderSettings(true);
    return res.json({ settings });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchEmailProviderSettings(req, res) {
  req.params.category = "email_provider";
  return patchCategorySettings(req, res);
}

export async function testEmailProvider(req, res) {
  try {
    const { testEmailProvider } = await import("../services/emailProviderSettingsService.js");
    const result = await testEmailProvider({ to: req.body?.to, adminId: req.admin?.id });
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listEmailTemplates(req, res) {
  try {
    const { listEmailTemplates } = await import("../services/emailTemplateService.js");
    const templates = await listEmailTemplates();
    return res.json({ templates });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getEmailTemplate(req, res) {
  try {
    const { getEmailTemplateById } = await import("../services/emailTemplateService.js");
    const template = await getEmailTemplateById(req.params.id);
    return res.json({ template });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchEmailTemplate(req, res) {
  try {
    const { updateEmailTemplate } = await import("../services/emailTemplateService.js");
    const template = await updateEmailTemplate(req.params.id, req.body, req.admin?.id);
    return res.json({ template });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function previewEmailTemplate(req, res) {
  try {
    const { previewEmailTemplate } = await import("../services/emailTemplateService.js");
    const preview = await previewEmailTemplate(req.params.id, req.body?.vars || {});
    return res.json({ preview });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function sendTestEmailTemplate(req, res) {
  try {
    const { previewEmailTemplate } = await import("../services/emailTemplateService.js");
    const { testEmailProvider } = await import("../services/emailProviderSettingsService.js");
    const { isMailerConfigured, getSmtpTransporter, getMailFromAddress } = await import(
      "../services/smtpTransport.js"
    );

    const to = req.body?.to;
    if (!to) return res.status(400).json({ error: "Recipient email is required." });
    if (!isMailerConfigured()) return res.status(400).json({ error: "Email provider not configured." });

    const { html, subject } = await previewEmailTemplate(req.params.id, req.body?.vars || {});
    const transport = getSmtpTransporter();
    await transport.sendMail({
      from: getMailFromAddress(),
      to,
      subject: `[TEST] ${subject}`,
      html,
    });
    return res.json({ ok: true, sentTo: to });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function restoreEmailTemplate(req, res) {
  try {
    const { restoreEmailTemplateDefault } = await import("../services/emailTemplateService.js");
    const template = await restoreEmailTemplateDefault(req.params.id, req.admin?.id);
    return res.json({ template });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getPdfTemplates(req, res) {
  try {
    const { getCategorySettings } = await import("../services/settingsService.js");
    const { PDF_TEMPLATE_TYPES } = await import("../config/settingsConfig.js");
    const stored = await getCategorySettings("pdf_templates");
    const templates = {};
    for (const type of PDF_TEMPLATE_TYPES) {
      templates[type] = stored[type] || {
        logoUrl: "",
        footerText: "",
        copyrightText: "",
        contactDetails: "",
        termsText: "",
        colorTheme: "teal",
        signatureText: "",
        layoutStyle: "standard",
      };
    }
    return res.json({ templates });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchPdfTemplate(req, res) {
  try {
    const { updateCategorySettings } = await import("../services/settingsService.js");
    const { getCategorySettings } = await import("../services/settingsService.js");
    const current = await getCategorySettings("pdf_templates");
    const next = { ...current, [req.params.id]: { ...(current[req.params.id] || {}), ...req.body } };
    const settings = await updateCategorySettings("pdf_templates", next, req.admin?.id, clientIp(req));
    return res.json({ template: settings[req.params.id] });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getSettingsConfig(req, res) {
  try {
    const {
      SETTINGS_CATEGORIES,
      EMAIL_TEMPLATE_TYPES,
      EMAIL_TEMPLATE_VARIABLES,
      PDF_TEMPLATE_TYPES,
    } = await import("../config/settingsConfig.js");
    return res.json({
      categories: SETTINGS_CATEGORIES,
      emailTemplateTypes: EMAIL_TEMPLATE_TYPES,
      emailTemplateVariables: EMAIL_TEMPLATE_VARIABLES,
      pdfTemplateTypes: PDF_TEMPLATE_TYPES,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getAuditLogs(req, res) {
  try {
    const { listAuditLogs } = await import("../services/settingsService.js");
    const logs = await listAuditLogs({
      limit: Number(req.query.limit) || 50,
      category: req.query.category,
    });
    return res.json({ logs });
  } catch (error) {
    return handleError(res, error);
  }
}
