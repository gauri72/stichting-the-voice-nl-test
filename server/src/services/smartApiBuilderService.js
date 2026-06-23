import crypto from "crypto";
import ApiIntegration from "../models/ApiIntegration.js";
import ApiCredential from "../models/ApiCredential.js";
import ApiEndpoint from "../models/ApiEndpoint.js";
import ApiFieldMapping from "../models/ApiFieldMapping.js";
import ApiExecutionLog from "../models/ApiExecutionLog.js";
import ApiWebhookEvent from "../models/ApiWebhookEvent.js";
import {
  INTEGRATION_TEMPLATES,
  API_TRIGGERS,
  API_BUILDER_CATEGORIES,
  API_AUTH_TYPES,
  API_CONNECTION_TYPES,
  API_HTTP_METHODS,
  API_ENVIRONMENTS,
  API_INTEGRATION_STATUSES,
  SMART_API_AUDIT_ACTIONS,
  canActivateEnvironment,
} from "../config/smartApiConfig.js";
import { encryptSecret, decryptSecret, maskSecret, isEncryptedValue } from "../utils/secretEncryption.js";
import { assertSafeOutboundUrl, maskSensitiveObject, maskSensitiveText, sanitizeHeaders } from "../utils/smartApiSecurity.js";
import { executeApiRequest, checkRateLimit } from "./smartApiExecutionService.js";
import { logAdminAction } from "./adminAuditService.js";

const MASK_SENTINEL = "••••••••";

function throwStatus(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

function slugifyKey(name) {
  const base = String(name || "integration")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || `integration-${crypto.randomBytes(4).toString("hex")}`;
}

async function uniqueIntegrationKey(name) {
  let key = slugifyKey(name);
  let suffix = 0;
  while (await ApiIntegration.exists({ integrationKey: key })) {
    suffix += 1;
    key = `${slugifyKey(name)}-${suffix}`;
  }
  return key;
}

function formatCredentialForAdmin(doc) {
  return {
    id: doc._id.toString(),
    credentialKey: doc.credentialKey,
    maskedHint: doc.maskedHint || (doc.encryptedValue ? MASK_SENTINEL : ""),
    isSet: Boolean(doc.encryptedValue),
  };
}

function formatEndpoint(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    method: doc.method,
    path: doc.path,
    headers: doc.headers || {},
    queryParams: doc.queryParams || {},
    bodyTemplate: doc.bodyTemplate || "",
    sortOrder: doc.sortOrder ?? 0,
  };
}

function formatMapping(doc) {
  return {
    id: doc._id.toString(),
    direction: doc.direction,
    sourcePath: doc.sourcePath,
    targetPath: doc.targetPath,
    description: doc.description || "",
  };
}

async function loadIntegrationBundle(integrationId) {
  const integration = await ApiIntegration.findById(integrationId).lean();
  if (!integration) throwStatus("Integration not found.", 404);

  const [credentials, endpoints, fieldMappings] = await Promise.all([
    ApiCredential.find({ integrationId }).lean(),
    ApiEndpoint.find({ integrationId }).sort({ sortOrder: 1, createdAt: 1 }).lean(),
    ApiFieldMapping.find({ integrationId }).lean(),
  ]);

  return { integration, credentials, endpoints, fieldMappings };
}

function formatIntegration(integration, credentials, endpoints, fieldMappings, { includeWebhookSecret = false } = {}) {
  const webhookSecretSet = Boolean(integration.webhookSecret);
  return {
    id: integration._id.toString(),
    integrationKey: integration.integrationKey,
    name: integration.name,
    category: integration.category,
    description: integration.description,
    baseUrl: integration.baseUrl,
    environment: integration.environment,
    status: integration.status,
    connectionType: integration.connectionType,
    authType: integration.authType,
    templateId: integration.templateId || "",
    triggers: integration.triggers || [],
    oauthConfig: integration.oauthConfig || {},
    sampleResponse: integration.sampleResponse || null,
    webhookSecretSet,
    webhookSecret: includeWebhookSecret ? undefined : undefined,
    credentials: credentials.map(formatCredentialForAdmin),
    endpoints: endpoints.map(formatEndpoint),
    fieldMappings: fieldMappings.map(formatMapping),
    webhookUrl: `/api/webhooks/custom/${integration.integrationKey}`,
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt,
  };
}

async function upsertCredentials(integrationId, credentialsInput = []) {
  if (!Array.isArray(credentialsInput)) return;
  for (const item of credentialsInput) {
    const key = String(item.credentialKey || item.key || "").trim();
    if (!key) continue;
    const rawValue = item.value ?? item.encryptedValue;
    if (rawValue === undefined || rawValue === null || rawValue === "" || rawValue === MASK_SENTINEL) continue;

    const encryptedValue = isEncryptedValue(rawValue) ? rawValue : encryptSecret(rawValue);
    await ApiCredential.findOneAndUpdate(
      { integrationId, credentialKey: key },
      {
        encryptedValue,
        maskedHint: maskSecret(isEncryptedValue(rawValue) ? decryptSecret(rawValue) : rawValue),
      },
      { upsert: true, new: true }
    );
  }
}

async function replaceEndpoints(integrationId, endpointsInput = []) {
  await ApiEndpoint.deleteMany({ integrationId });
  if (!Array.isArray(endpointsInput) || !endpointsInput.length) return;
  await ApiEndpoint.insertMany(
    endpointsInput.map((ep, index) => ({
      integrationId,
      name: String(ep.name || `Endpoint ${index + 1}`).slice(0, 120),
      method: ep.method || "GET",
      path: ep.path || "/",
      headers: ep.headers || {},
      queryParams: ep.queryParams || {},
      bodyTemplate: ep.bodyTemplate || "",
      sortOrder: ep.sortOrder ?? index,
    }))
  );
}

async function replaceFieldMappings(integrationId, mappingsInput = []) {
  await ApiFieldMapping.deleteMany({ integrationId });
  if (!Array.isArray(mappingsInput) || !mappingsInput.length) return;
  await ApiFieldMapping.insertMany(
    mappingsInput.map((m) => ({
      integrationId,
      direction: m.direction === "request" ? "request" : "response",
      sourcePath: String(m.sourcePath || "").slice(0, 300),
      targetPath: String(m.targetPath || "").slice(0, 300),
      description: String(m.description || "").slice(0, 500),
    }))
  );
}

export function getApiBuilderConfig() {
  return {
    categories: API_BUILDER_CATEGORIES,
    authTypes: API_AUTH_TYPES,
    connectionTypes: API_CONNECTION_TYPES,
    httpMethods: API_HTTP_METHODS,
    environments: API_ENVIRONMENTS,
    statuses: API_INTEGRATION_STATUSES,
    triggers: API_TRIGGERS,
    templates: Object.values(INTEGRATION_TEMPLATES),
  };
}

export function getTemplateById(templateId) {
  return INTEGRATION_TEMPLATES[templateId] || null;
}

export async function listIntegrations() {
  const rows = await ApiIntegration.find().sort({ updatedAt: -1 }).lean();
  const result = [];
  for (const integration of rows) {
    const [credentials, endpoints, fieldMappings] = await Promise.all([
      ApiCredential.find({ integrationId: integration._id }).lean(),
      ApiEndpoint.find({ integrationId: integration._id }).sort({ sortOrder: 1 }).lean(),
      ApiFieldMapping.find({ integrationId: integration._id }).lean(),
    ]);
    result.push(formatIntegration(integration, credentials, endpoints, fieldMappings));
  }
  return result;
}

export async function getIntegrationById(id) {
  const bundle = await loadIntegrationBundle(id);
  return formatIntegration(bundle.integration, bundle.credentials, bundle.endpoints, bundle.fieldMappings);
}

export async function createIntegration(payload, admin) {
  const name = String(payload.name || "").trim();
  if (!name) throwStatus("Integration name is required.");

  const template = payload.templateId ? getTemplateById(payload.templateId) : null;
  const integrationKey = await uniqueIntegrationKey(name);

  const integration = await ApiIntegration.create({
    integrationKey,
    name,
    category: payload.category || template?.category || "custom",
    description: payload.description || template?.description || "",
    baseUrl: payload.baseUrl || template?.baseUrl || "",
    environment: payload.environment === "live" ? "live" : "test",
    status: "draft",
    connectionType: payload.connectionType || template?.connectionType || "rest",
    authType: payload.authType || template?.authType || "none",
    templateId: payload.templateId || template?.id || "",
    triggers: Array.isArray(payload.triggers) ? payload.triggers : [],
    oauthConfig: payload.oauthConfig || {},
    createdBy: admin?.id || null,
    updatedBy: admin?.id || null,
  });

  if (payload.webhookSecret) {
    integration.webhookSecret = encryptSecret(payload.webhookSecret);
    await integration.save();
  }

  await upsertCredentials(integration._id, payload.credentials);
  await replaceEndpoints(integration._id, payload.endpoints || template?.endpoints || []);
  await replaceFieldMappings(integration._id, payload.fieldMappings || []);

  await logAdminAction({
    adminId: admin?.id,
    action: SMART_API_AUDIT_ACTIONS.INTEGRATION_CREATED,
    targetType: "api_integration",
    targetId: integration._id.toString(),
    summary: `Created API integration "${name}"`,
    detail: { integrationKey, category: integration.category },
  });

  return getIntegrationById(integration._id);
}

export async function updateIntegration(id, payload, admin) {
  const integration = await ApiIntegration.findById(id);
  if (!integration) throwStatus("Integration not found.", 404);

  const fields = ["name", "category", "description", "baseUrl", "connectionType", "authType", "templateId"];
  for (const field of fields) {
    if (payload[field] !== undefined) integration[field] = String(payload[field] ?? "").slice(0, field === "description" ? 2000 : 500);
  }
  if (payload.environment !== undefined) integration.environment = payload.environment === "live" ? "live" : "test";
  if (payload.status !== undefined) integration.status = payload.status;
  if (Array.isArray(payload.triggers)) integration.triggers = payload.triggers;
  if (payload.oauthConfig) integration.oauthConfig = payload.oauthConfig;
  if (payload.sampleResponse !== undefined) integration.sampleResponse = payload.sampleResponse;

  if (payload.webhookSecret && payload.webhookSecret !== MASK_SENTINEL) {
    integration.webhookSecret = encryptSecret(payload.webhookSecret);
  }

  integration.updatedBy = admin?.id || null;
  await integration.save();

  if (payload.credentials) await upsertCredentials(integration._id, payload.credentials);
  if (payload.endpoints) await replaceEndpoints(integration._id, payload.endpoints);
  if (payload.fieldMappings) await replaceFieldMappings(integration._id, payload.fieldMappings);

  await logAdminAction({
    adminId: admin?.id,
    action: SMART_API_AUDIT_ACTIONS.INTEGRATION_UPDATED,
    targetType: "api_integration",
    targetId: integration._id.toString(),
    summary: `Updated API integration "${integration.name}"`,
  });

  return getIntegrationById(integration._id);
}

export async function deleteIntegration(id, admin) {
  const integration = await ApiIntegration.findById(id);
  if (!integration) throwStatus("Integration not found.", 404);

  await Promise.all([
    ApiCredential.deleteMany({ integrationId: id }),
    ApiEndpoint.deleteMany({ integrationId: id }),
    ApiFieldMapping.deleteMany({ integrationId: id }),
    ApiExecutionLog.deleteMany({ integrationId: id }),
    ApiWebhookEvent.deleteMany({ integrationId: id }),
    ApiIntegration.findByIdAndDelete(id),
  ]);

  await logAdminAction({
    adminId: admin?.id,
    action: SMART_API_AUDIT_ACTIONS.INTEGRATION_DELETED,
    targetType: "api_integration",
    targetId: id,
    summary: `Deleted API integration "${integration.name}"`,
  });

  return { deleted: true, id };
}

export async function activateIntegration(id, admin) {
  const integration = await ApiIntegration.findById(id);
  if (!integration) throwStatus("Integration not found.", 404);
  if (!canActivateEnvironment(admin?.role, integration.environment)) {
    throwStatus("Only Super Admin can activate live integrations.", 403);
  }

  integration.status = "active";
  integration.updatedBy = admin?.id || null;
  await integration.save();

  await logAdminAction({
    adminId: admin?.id,
    action: SMART_API_AUDIT_ACTIONS.INTEGRATION_ACTIVATED,
    targetType: "api_integration",
    targetId: id,
    summary: `Activated integration "${integration.name}" (${integration.environment})`,
  });

  return getIntegrationById(id);
}

export async function deactivateIntegration(id, admin) {
  const integration = await ApiIntegration.findById(id);
  if (!integration) throwStatus("Integration not found.", 404);

  integration.status = "inactive";
  integration.updatedBy = admin?.id || null;
  await integration.save();

  await logAdminAction({
    adminId: admin?.id,
    action: SMART_API_AUDIT_ACTIONS.INTEGRATION_DEACTIVATED,
    targetType: "api_integration",
    targetId: id,
    summary: `Deactivated integration "${integration.name}"`,
  });

  return getIntegrationById(id);
}

async function getDecryptedCredentials(integrationId) {
  const rows = await ApiCredential.find({ integrationId }).lean();
  const out = {};
  for (const row of rows) {
    if (!row.encryptedValue) continue;
    out[row.credentialKey] = decryptSecret(row.encryptedValue);
  }
  return out;
}

function buildAuthHeaders(integration, credentials, customHeaders = {}) {
  const headers = sanitizeHeaders(customHeaders);
  const authType = integration.authType;

  if (authType === "bearer" && credentials.bearerToken) {
    headers.Authorization = `Bearer ${credentials.bearerToken}`;
  } else if (authType === "api_key" && credentials.apiKey) {
    headers["X-API-Key"] = credentials.apiKey;
    if (!headers.Authorization) headers.Authorization = `Bearer ${credentials.apiKey}`;
  } else if (authType === "basic" && credentials.username && credentials.password) {
    const token = Buffer.from(`${credentials.username}:${credentials.password}`).toString("base64");
    headers.Authorization = `Basic ${token}`;
  } else if (authType === "custom" && credentials.customHeaderName && credentials.customHeaderValue) {
    headers[credentials.customHeaderName] = credentials.customHeaderValue;
  }

  return headers;
}

export async function testIntegration(id, payload, admin) {
  const bundle = await loadIntegrationBundle(id);
  const { integration, endpoints } = bundle;
  const endpointId = payload.endpointId;
  const endpoint = endpointId
    ? endpoints.find((e) => e._id.toString() === endpointId)
    : endpoints[0];

  if (!endpoint && integration.connectionType !== "webhook") {
    throwStatus("No endpoint configured for this integration.");
  }

  checkRateLimit(id);

  const credentials = await getDecryptedCredentials(id);
  const baseUrl = String(payload.baseUrl || integration.baseUrl || "").replace(/\/$/, "");
  const path = payload.path || endpoint?.path || "/";
  const method = payload.method || endpoint?.method || "GET";
  const fullUrl = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  await assertSafeOutboundUrl(fullUrl);

  const headers = buildAuthHeaders(integration, credentials, {
    ...(endpoint?.headers || {}),
    ...(payload.headers || {}),
  });

  const queryParams = { ...(endpoint?.queryParams || {}), ...(payload.queryParams || {}) };
  const body = payload.body ?? payload.bodyTemplate ?? endpoint?.bodyTemplate ?? "";

  const started = Date.now();
  let result;
  try {
    result = await executeApiRequest({ method, url: fullUrl, headers, queryParams, body });
  } catch (error) {
    const log = await ApiExecutionLog.create({
      integrationId: id,
      endpointId: endpoint?._id || null,
      integrationName: integration.name,
      endpointName: endpoint?.name || "",
      trigger: "manual_admin",
      status: "error",
      responseCode: error.status || null,
      durationMs: Date.now() - started,
      errorMessage: error.message,
      requestMeta: { method, url: fullUrl, queryParams, body: String(body || "") },
      requestMasked: maskSensitiveText(JSON.stringify({ method, url: fullUrl, headers: maskSensitiveObject(headers), queryParams, body: maskSensitiveText(String(body)) })),
      responseMasked: "",
      retryCount: 0,
    });

    await logAdminAction({
      adminId: admin?.id,
      action: SMART_API_AUDIT_ACTIONS.INTEGRATION_TESTED,
      targetType: "api_integration",
      targetId: id,
      summary: `Test failed for "${integration.name}"`,
      detail: { logId: log._id.toString(), error: error.message },
    });

    throw error;
  }

  const log = await ApiExecutionLog.create({
    integrationId: id,
    endpointId: endpoint?._id || null,
    integrationName: integration.name,
    endpointName: endpoint?.name || "",
    trigger: "manual_admin",
    status: result.ok ? "success" : "error",
    responseCode: result.status,
    durationMs: Date.now() - started,
    errorMessage: result.ok ? "" : result.statusText,
    requestMeta: { method, url: fullUrl, queryParams, body: String(body || "") },
    requestMasked: maskSensitiveText(JSON.stringify({ method, url: fullUrl, headers: maskSensitiveObject(headers), queryParams })),
    responseMasked: maskSensitiveText(result.bodyText),
    retryCount: 0,
  });

  if (payload.saveSampleResponse && result.ok) {
    try {
      integration.sampleResponse = JSON.parse(result.bodyText);
    } catch {
      integration.sampleResponse = result.bodyText;
    }
    await integration.save();
  }

  await logAdminAction({
    adminId: admin?.id,
    action: SMART_API_AUDIT_ACTIONS.INTEGRATION_TESTED,
    targetType: "api_integration",
    targetId: id,
    summary: `Tested integration "${integration.name}"`,
    detail: { logId: log._id.toString(), status: result.status },
  });

  return {
    ok: result.ok,
    status: result.status,
    statusText: result.statusText,
    durationMs: Date.now() - started,
    headers: result.headers,
    body: result.parsedBody ?? result.bodyText,
    bodyText: result.bodyText,
    logId: log._id.toString(),
    error: result.ok ? "" : result.statusText,
  };
}

export async function listExecutionLogs(query = {}) {
  const filter = {};
  if (query.integrationId) filter.integrationId = query.integrationId;
  if (query.status && query.status !== "all") filter.status = query.status;
  if (query.resolved === "true") filter.resolved = true;
  if (query.resolved === "false") filter.resolved = false;

  const rows = await ApiExecutionLog.find(filter).sort({ requestTime: -1 }).limit(200).lean();
  return rows.map((row) => ({
    id: row._id.toString(),
    integrationId: row.integrationId?.toString(),
    endpointId: row.endpointId?.toString() || null,
    integration: row.integrationName,
    endpoint: row.endpointName,
    trigger: row.trigger,
    status: row.status,
    requestTime: row.requestTime,
    responseCode: row.responseCode,
    durationMs: row.durationMs,
    errorMessage: row.errorMessage,
    retryCount: row.retryCount,
    resolved: row.resolved,
    requestMasked: row.requestMasked,
    responseMasked: row.responseMasked,
  }));
}

export async function getExecutionLogById(id) {
  const row = await ApiExecutionLog.findById(id).lean();
  if (!row) throwStatus("Log not found.", 404);
  return {
    id: row._id.toString(),
    integrationId: row.integrationId?.toString(),
    endpointId: row.endpointId?.toString() || null,
    integration: row.integrationName,
    endpoint: row.endpointName,
    trigger: row.trigger,
    status: row.status,
    requestTime: row.requestTime,
    responseCode: row.responseCode,
    durationMs: row.durationMs,
    errorMessage: row.errorMessage,
    retryCount: row.retryCount,
    resolved: row.resolved,
    requestMasked: row.requestMasked,
    responseMasked: row.responseMasked,
  };
}

export async function retryExecutionLog(id, admin) {
  const log = await ApiExecutionLog.findById(id);
  if (!log) throwStatus("Log not found.", 404);

  const requestMeta = log.requestMeta || {};
  if (!requestMeta.url) throwStatus("Cannot retry: request metadata unavailable.");

  const bundle = await loadIntegrationBundle(log.integrationId);
  const credentials = await getDecryptedCredentials(log.integrationId);
  checkRateLimit(log.integrationId.toString());

  const headers = buildAuthHeaders(bundle.integration, credentials, {});
  const started = Date.now();

  const result = await executeApiRequest({
    method: requestMeta.method || "GET",
    url: requestMeta.url,
    headers,
    queryParams: requestMeta.queryParams || {},
    body: requestMeta.body || "",
  });

  log.retryCount += 1;
  log.status = result.ok ? "success" : "error";
  log.responseCode = result.status;
  log.durationMs = Date.now() - started;
  log.errorMessage = result.ok ? "" : result.statusText;
  log.responseMasked = maskSensitiveText(result.bodyText);
  log.requestTime = new Date();
  await log.save();

  await logAdminAction({
    adminId: admin?.id,
    action: SMART_API_AUDIT_ACTIONS.LOG_RETRIED,
    targetType: "api_execution_log",
    targetId: id,
    summary: `Retried API log for "${log.integrationName}"`,
  });

  return getExecutionLogById(id);
}

export async function resolveExecutionLog(id, admin) {
  const log = await ApiExecutionLog.findByIdAndUpdate(id, { resolved: true }, { new: true });
  if (!log) throwStatus("Log not found.", 404);

  await logAdminAction({
    adminId: admin?.id,
    action: SMART_API_AUDIT_ACTIONS.LOG_RESOLVED,
    targetType: "api_execution_log",
    targetId: id,
    summary: `Marked API log resolved for "${log.integrationName}"`,
  });

  return getExecutionLogById(id);
}

export async function handleIncomingWebhook(integrationKey, req) {
  const integration = await ApiIntegration.findOne({ integrationKey, status: "active" }).lean();
  if (!integration) throwStatus("Webhook integration not found or inactive.", 404);

  const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
  const signature = req.headers["x-webhook-signature"] || req.headers["x-signature"] || "";
  let signatureValid = true;

  if (integration.webhookSecret) {
    const secret = decryptSecret(integration.webhookSecret);
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    signatureValid = signature === expected || signature === `sha256=${expected}`;
  }

  const event = await ApiWebhookEvent.create({
    integrationId: integration._id,
    integrationKey,
    signatureValid,
    payloadMasked: maskSensitiveText(rawBody),
    headersMasked: maskSensitiveObject(req.headers),
    processed: false,
    errorMessage: signatureValid ? "" : "Invalid webhook signature",
  });

  await logAdminAction({
    adminId: null,
    action: SMART_API_AUDIT_ACTIONS.WEBHOOK_RECEIVED,
    targetType: "api_webhook_event",
    targetId: event._id.toString(),
    summary: `Webhook received for "${integration.name}"`,
    detail: { integrationKey, signatureValid },
  });

  if (!signatureValid) throwStatus("Invalid webhook signature.", 401);

  event.processed = true;
  await event.save();

  return { received: true, eventId: event._id.toString() };
}

/** Hook for platform triggers — executes active integrations matching trigger. */
export async function dispatchIntegrationsForTrigger(trigger, context = {}) {
  const integrations = await ApiIntegration.find({ status: "active", triggers: trigger }).lean();
  const results = [];

  for (const integration of integrations) {
    const endpoints = await ApiEndpoint.find({ integrationId: integration._id }).sort({ sortOrder: 1 }).lean();
    const endpoint = endpoints[0];
    if (!endpoint) continue;

    try {
      checkRateLimit(integration._id.toString());
      const credentials = await getDecryptedCredentials(integration._id);
      const baseUrl = integration.baseUrl.replace(/\/$/, "");
      const fullUrl = `${baseUrl}${endpoint.path.startsWith("/") ? endpoint.path : `/${endpoint.path}`}`;
      await assertSafeOutboundUrl(fullUrl);
      const headers = buildAuthHeaders(integration, credentials, endpoint.headers || {});
      const started = Date.now();
      const result = await executeApiRequest({
        method: endpoint.method,
        url: fullUrl,
        headers,
        queryParams: endpoint.queryParams || {},
        body: endpoint.bodyTemplate || "",
      });

      await ApiExecutionLog.create({
        integrationId: integration._id,
        endpointId: endpoint._id,
        integrationName: integration.name,
        endpointName: endpoint.name,
        trigger,
        status: result.ok ? "success" : "error",
        responseCode: result.status,
        durationMs: Date.now() - started,
        errorMessage: result.ok ? "" : result.statusText,
        requestMasked: maskSensitiveText(JSON.stringify({ trigger, context: maskSensitiveObject(context) })),
        responseMasked: maskSensitiveText(result.bodyText),
      });

      results.push({ integrationId: integration._id.toString(), ok: result.ok });
    } catch (error) {
      await ApiExecutionLog.create({
        integrationId: integration._id,
        endpointId: endpoint?._id || null,
        integrationName: integration.name,
        endpointName: endpoint?.name || "",
        trigger,
        status: "error",
        errorMessage: error.message,
        requestMasked: maskSensitiveText(JSON.stringify({ trigger })),
      });
      results.push({ integrationId: integration._id.toString(), ok: false, error: error.message });
    }
  }

  return results;
}
