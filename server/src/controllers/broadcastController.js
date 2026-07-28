import {
  buildPreview,
  createTemplate,
  deleteTemplate,
  duplicateTemplate,
  getBroadcastOverview,
  getSampleUsers,
  getTemplateById,
  listRecentCampaigns,
  listTemplates,
  resolveAudience,
  sendBroadcast,
  updateTemplate,
} from "../services/broadcastService.js";
import { generateTemplateHtml, isTemplateGeneratorConfigured } from "../services/aiTemplateGeneratorService.js";
import {
  exportBroadcastRecipientsCsv,
  getBroadcastReport,
  listBroadcastHistory,
  listBroadcastLinks,
  listBroadcastRecipients,
  listLinkClickers,
} from "../services/broadcastReportService.js";
import { getPdfDownloadUrl, shouldRegeneratePdf } from "../services/broadcastPdfService.js";
import EmailBroadcast from "../models/EmailBroadcast.js";

import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[broadcast]" });
}

export async function broadcastOverview(req, res) {
  try {
    const payload = await getBroadcastOverview();
    return res.status(200).json(payload);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function broadcastTemplates(req, res) {
  try {
    const templates = await listTemplates();
    return res.status(200).json({ templates });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function broadcastCreateTemplate(req, res) {
  try {
    const { name, description, subject, htmlBody, type, tags, status, aiGenerated, aiPrompt, colorScheme } = req.body || {};
    const template = await createTemplate({
      name,
      description,
      subject,
      htmlBody,
      adminId: req.admin?.id,
      type,
      tags,
      status,
      aiGenerated,
      aiPrompt,
      colorScheme,
    });
    return res.status(201).json({ template });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function broadcastGetTemplate(req, res) {
  try {
    const template = await getTemplateById(req.params.id);
    return res.status(200).json({
      template: {
        id: template._id.toString(),
        name: template.name,
        slug: template.slug,
        description: template.description,
        subject: template.subject,
        htmlBody: template.htmlBody,
        placeholders: template.placeholders,
        isSystem: template.isSystem,
        type: template.type,
        tags: template.tags,
        status: template.status,
        aiGenerated: template.aiGenerated,
        aiPrompt: template.aiPrompt,
        colorScheme: template.colorScheme,
        usageCount: template.usageCount,
        lastUsedAt: template.lastUsedAt,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function broadcastUpdateTemplate(req, res) {
  try {
    const { name, description, subject, htmlBody, type, tags, status, colorScheme } = req.body || {};
    const template = await updateTemplate(req.params.id, { name, description, subject, htmlBody, type, tags, status, colorScheme });
    return res.status(200).json({ template });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function broadcastDuplicateTemplate(req, res) {
  try {
    const template = await duplicateTemplate(req.params.id, req.admin?.id);
    return res.status(201).json({ template });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function broadcastDeleteTemplate(req, res) {
  try {
    await deleteTemplate(req.params.id);
    return res.status(200).json({ ok: true });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function broadcastGenerateStatus(req, res) {
  return res.status(200).json({ configured: isTemplateGeneratorConfigured() });
}

export async function broadcastGenerateTemplate(req, res) {
  try {
    const { prompt, templateType, colorScheme } = req.body || {};
    const result = await generateTemplateHtml({ prompt, templateType, colorScheme });
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function broadcastSampleUsers(req, res) {
  try {
    const users = await getSampleUsers();
    return res.status(200).json({ users });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function broadcastAudienceCount(req, res) {
  try {
    const { segment } = req.query;
    const audience = await resolveAudience(segment || "all_members");
    return res.status(200).json({ segment, count: audience.length });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function broadcastPreview(req, res) {
  try {
    const { templateId, audienceSegment, sampleUserId, mergeVariables, customEmails } = req.body || {};
    if (!templateId) {
      return res.status(400).json({ error: "templateId is required." });
    }

    const preview = await buildPreview({
      templateId,
      audienceSegment: audienceSegment || "all_members",
      sampleUserId,
      mergeVariables,
      customEmails,
    });
    return res.status(200).json({ preview });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function broadcastSend(req, res) {
  try {
    const { templateId, audienceSegment, mergeVariables, customEmails, campaignName } = req.body || {};
    if (!templateId || !audienceSegment) {
      return res.status(400).json({ error: "templateId and audienceSegment are required." });
    }

    const result = await sendBroadcast({
      templateId,
      audienceSegment,
      mergeVariables,
      adminId: req.admin?.id,
      customEmails,
      campaignName,
    });
    return res.status(200).json({ broadcast: result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function broadcastCampaigns(req, res) {
  try {
    const campaigns = await listRecentCampaigns(20);
    return res.status(200).json({ campaigns });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function broadcastHistory(req, res) {
  try {
    const { page, pageSize, search, status, sender, sort } = req.query;
    const result = await listBroadcastHistory({
      page: Number(page) || 1,
      pageSize: Math.min(Number(pageSize) || 20, 100),
      search,
      status,
      sender,
      sort,
    });
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function broadcastReport(req, res) {
  try {
    const report = await getBroadcastReport(req.params.id);
    return res.status(200).json(report);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function broadcastLinks(req, res) {
  try {
    const links = await listBroadcastLinks(req.params.id);
    return res.status(200).json({ links });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function broadcastLinkClickers(req, res) {
  try {
    const clickers = await listLinkClickers(req.params.id, req.params.linkId);
    return res.status(200).json({ clickers });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function broadcastRecipients(req, res) {
  try {
    const { page, pageSize, filter } = req.query;
    const result = await listBroadcastRecipients(req.params.id, {
      page: Number(page) || 1,
      pageSize: Math.min(Number(pageSize) || 25, 200),
      filter,
    });
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function broadcastRecipientsExport(req, res) {
  try {
    const csv = await exportBroadcastRecipientsCsv(req.params.id, { filter: req.query.filter });
    res.set("Content-Type", "text/csv; charset=utf-8");
    res.set("Content-Disposition", `attachment; filename="broadcast-${req.params.id}-recipients.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function broadcastRequestPdf(req, res) {
  try {
    const broadcast = await EmailBroadcast.findById(req.params.id).select("pdfStatus pdfAsset").lean();
    if (!broadcast) return res.status(404).json({ error: "Broadcast not found." });

    const forceRegenerate = Boolean(req.body?.regenerate);
    if (forceRegenerate || shouldRegeneratePdf(broadcast)) {
      await EmailBroadcast.updateOne({ _id: req.params.id }, { $set: { pdfStatus: "queued", pdfError: "" } });
      return res.status(202).json({ pdfStatus: "queued" });
    }
    return res.status(200).json({ pdfStatus: broadcast.pdfStatus });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function broadcastPdfStatus(req, res) {
  try {
    const broadcast = await EmailBroadcast.findById(req.params.id).select("pdfStatus pdfError").lean();
    if (!broadcast) return res.status(404).json({ error: "Broadcast not found." });
    return res.status(200).json({ pdfStatus: broadcast.pdfStatus, pdfError: broadcast.pdfError });
  } catch (error) {
    return handleError(res, error);
  }
}

// Returns the signed URL as JSON rather than issuing a server-side redirect — this route
// sits behind requireAdmin (a Bearer-token check), which a plain browser navigation/<a
// href> can't satisfy. The client fetches this with its auth header, then navigates to the
// short-lived signed URL it gets back, which needs no auth of its own.
export async function broadcastDownloadPdf(req, res) {
  try {
    const url = await getPdfDownloadUrl(req.params.id);
    return res.status(200).json({ url });
  } catch (error) {
    return handleError(res, error);
  }
}
