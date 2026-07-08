import SavedEvent from "../models/SavedEvent.js";

export async function listSavedEventIds(userId) {
  const rows = await SavedEvent.find({ userId }).select("eventId").lean();
  return rows.map((row) => row.eventId.toString());
}

export async function saveEvent(userId, eventId) {
  await SavedEvent.updateOne({ userId, eventId }, { $setOnInsert: { userId, eventId } }, { upsert: true });
}

export async function unsaveEvent(userId, eventId) {
  await SavedEvent.deleteOne({ userId, eventId });
}

export async function bulkSaveEvents(userId, eventIds) {
  if (!eventIds?.length) return;
  const ops = eventIds.map((eventId) => ({
    updateOne: {
      filter: { userId, eventId },
      update: { $setOnInsert: { userId, eventId } },
      upsert: true,
    },
  }));
  await SavedEvent.bulkWrite(ops, { ordered: false });
}
