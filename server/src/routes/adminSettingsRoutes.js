import { Router } from "express";
import {
  getAllSettings,
  getCategorySettings,
  patchCategorySettings,
  getStripeSettings,
  patchStripeSettings,
  testStripeConnection,
  verifyStripeWebhook,
  syncStripeBank,
  getBankSettings,
  patchBankSettings,
  getEmailProviderSettings,
  patchEmailProviderSettings,
  testEmailProvider,
  listEmailTemplates,
  getEmailTemplate,
  patchEmailTemplate,
  previewEmailTemplate,
  sendTestEmailTemplate,
  restoreEmailTemplate,
  getPdfTemplates,
  patchPdfTemplate,
  getSettingsConfig,
  getAuditLogs,
} from "../controllers/adminSettingsController.js";
import {
  requireSettingsRead,
  requireSettingsWrite,
  requireFinanceSettingsWrite,
  requireTemplateWrite,
} from "../middleware/settingsMiddleware.js";

const router = Router();

router.get("/config", requireSettingsRead("general"), getSettingsConfig);
router.get("/audit-logs", requireSettingsRead("security"), getAuditLogs);
router.get("/", requireSettingsRead("general"), getAllSettings);

router.get("/stripe", requireSettingsRead("stripe"), getStripeSettings);
router.patch("/stripe", requireFinanceSettingsWrite, patchStripeSettings);
router.post("/stripe/test", requireFinanceSettingsWrite, testStripeConnection);
router.post("/stripe/sync-bank", requireFinanceSettingsWrite, syncStripeBank);
router.post("/stripe/verify-webhook", requireFinanceSettingsWrite, verifyStripeWebhook);

router.get("/bank", requireSettingsRead("bank"), getBankSettings);
router.patch("/bank", requireFinanceSettingsWrite, patchBankSettings);

router.get("/email-provider", requireSettingsRead("email_provider"), getEmailProviderSettings);
router.patch("/email-provider", requireSettingsWrite("email_provider"), patchEmailProviderSettings);
router.post("/email-provider/test", requireSettingsWrite("email_provider"), testEmailProvider);

router.get("/email-templates", requireSettingsRead("general"), listEmailTemplates);
router.get("/email-templates/:id", requireSettingsRead("general"), getEmailTemplate);
router.patch("/email-templates/:id", requireTemplateWrite, patchEmailTemplate);
router.post("/email-templates/:id/preview", requireSettingsRead("general"), previewEmailTemplate);
router.post("/email-templates/:id/send-test", requireTemplateWrite, sendTestEmailTemplate);
router.post("/email-templates/:id/restore-default", requireTemplateWrite, restoreEmailTemplate);

router.get("/pdf-templates", requireSettingsRead("pdf_templates"), getPdfTemplates);
router.patch("/pdf-templates/:id", requireSettingsWrite("pdf_templates"), patchPdfTemplate);

router.get("/:category", requireSettingsRead(), getCategorySettings);
router.patch("/:category", requireSettingsWrite(), patchCategorySettings);

export default router;
