import {
  buildPreview,
  createTemplate,
  deleteTemplate,
  getBroadcastOverview,
  getSampleUsers,
  listRecentCampaigns,
  listTemplates,
  resolveAudience,
  sendBroadcast,
} from "../services/broadcastService.js";

function handleError(res, error) {
  const status = error.status || 500;
  const message = error.message || "Something went wrong.";
  if (status >= 500) {
    console.error("[broadcast]", error);
  }
  return res.status(status).json({ error: message });
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
    const { name, description, subject, htmlBody } = req.body || {};
    const template = await createTemplate({
      name,
      description,
      subject,
      htmlBody,
      adminId: req.admin?.id,
    });
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
    const { templateId, audienceSegment, sampleUserId, mergeVariables } = req.body || {};
    if (!templateId) {
      return res.status(400).json({ error: "templateId is required." });
    }

    const preview = await buildPreview({
      templateId,
      audienceSegment: audienceSegment || "all_members",
      sampleUserId,
      mergeVariables,
    });
    return res.status(200).json({ preview });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function broadcastSend(req, res) {
  try {
    const { templateId, audienceSegment, mergeVariables } = req.body || {};
    if (!templateId || !audienceSegment) {
      return res.status(400).json({ error: "templateId and audienceSegment are required." });
    }

    const result = await sendBroadcast({
      templateId,
      audienceSegment,
      mergeVariables,
      adminId: req.admin?.id,
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
