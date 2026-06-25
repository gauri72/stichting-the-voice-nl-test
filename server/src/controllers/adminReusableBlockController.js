import {
  listReusableBlocks,
  getReusableBlock,
  createReusableBlock,
  updateReusableBlockDraft,
  publishReusableBlock,
  deleteReusableBlock,
} from "../services/reusableBlockService.js";

import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[component-library]" });
}

export async function listReusableBlocksAdmin(req, res) {
  try {
    return res.json({ blocks: await listReusableBlocks() });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getReusableBlockAdmin(req, res) {
  try {
    return res.json(await getReusableBlock(req.params.blockId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createReusableBlockAdmin(req, res) {
  try {
    return res.status(201).json(await createReusableBlock(req.body, req.admin?.id));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateReusableBlockAdmin(req, res) {
  try {
    if (req.body?.publish) {
      return res.json(await publishReusableBlock(req.params.blockId, req.admin?.id));
    }
    return res.json(await updateReusableBlockDraft(req.params.blockId, req.body, req.admin?.id));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteReusableBlockAdmin(req, res) {
  try {
    await deleteReusableBlock(req.params.blockId, req.admin?.id);
    return res.status(204).send();
  } catch (error) {
    return handleError(res, error);
  }
}
