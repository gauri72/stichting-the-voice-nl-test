import User from "../models/User.js";
import UserLoginEvent from "../models/UserLoginEvent.js";
import { escapeRegex } from "../utils/regexUtils.js";

export async function recordLoginEvent(user, method) {
  await UserLoginEvent.create({
    userId: user._id,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email,
    method,
  });
  await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() }, $inc: { loginCount: 1 } });
}

export async function listLoginEvents({ search } = {}) {
  const filter = {};
  if (search?.trim()) {
    const q = escapeRegex(search.trim());
    filter.$or = [{ firstName: new RegExp(q, "i") }, { lastName: new RegExp(q, "i") }, { email: new RegExp(q, "i") }];
  }
  const events = await UserLoginEvent.find(filter).sort({ createdAt: -1 }).limit(500).lean();
  return events.map((e) => ({
    id: e._id.toString(),
    userId: e.userId.toString(),
    firstName: e.firstName,
    lastName: e.lastName,
    email: e.email,
    method: e.method,
    loggedInAt: e.createdAt,
  }));
}
