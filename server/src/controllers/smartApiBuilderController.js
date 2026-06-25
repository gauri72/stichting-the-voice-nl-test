import {
  getApiBuilderConfig,
  listIntegrations,
  getIntegrationById,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  activateIntegration,
  deactivateIntegration,
  testIntegration,
  listExecutionLogs,
  getExecutionLogById,
  retryExecutionLog,
  resolveExecutionLog,
} from "../services/smartApiBuilderService.js";

import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[api-builder]" });
}

export async function getConfig(req, res) {
  try {
    return res.json(getApiBuilderConfig());
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listIntegrationsAdmin(req, res) {
  try {
    const integrations = await listIntegrations();
    return res.json({ integrations });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getIntegrationAdmin(req, res) {
  try {
    const integration = await getIntegrationById(req.params.id);
    return res.json({ integration });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createIntegrationAdmin(req, res) {
  try {
    const integration = await createIntegration(req.body || {}, req.admin);
    return res.status(201).json({ integration });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchIntegrationAdmin(req, res) {
  try {
    const integration = await updateIntegration(req.params.id, req.body || {}, req.admin);
    return res.json({ integration });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteIntegrationAdmin(req, res) {
  try {
    const result = await deleteIntegration(req.params.id, req.admin);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function testIntegrationAdmin(req, res) {
  try {
    const result = await testIntegration(req.params.id, req.body || {}, req.admin);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function activateIntegrationAdmin(req, res) {
  try {
    const integration = await activateIntegration(req.params.id, req.admin);
    return res.json({ integration });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deactivateIntegrationAdmin(req, res) {
  try {
    const integration = await deactivateIntegration(req.params.id, req.admin);
    return res.json({ integration });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listLogsAdmin(req, res) {
  try {
    const logs = await listExecutionLogs(req.query || {});
    return res.json({ logs });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getLogAdmin(req, res) {
  try {
    const log = await getExecutionLogById(req.params.id);
    return res.json({ log });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function retryLogAdmin(req, res) {
  try {
    const log = await retryExecutionLog(req.params.id, req.admin);
    return res.json({ log });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function resolveLogAdmin(req, res) {
  try {
    const log = await resolveExecutionLog(req.params.id, req.admin);
    return res.json({ log });
  } catch (error) {
    return handleError(res, error);
  }
}
