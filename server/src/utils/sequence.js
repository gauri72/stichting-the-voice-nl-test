import SequenceCounter from "../models/SequenceCounter.js";

/**
 * Atomically increments and returns the next value for a named sequence.
 * @param {string} key
 * @returns {Promise<number>}
 */
export async function getNextSequence(key) {
  const doc = await SequenceCounter.findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    { upsert: true, new: true }
  );
  return doc.value;
}
