import VolunteerApplication from "../models/VolunteerApplication.js";
import VentureStudioMessage from "../models/VentureStudioMessage.js";
import { escapeRegex } from "../utils/regexUtils.js";

export async function listVolunteerApplications({ search } = {}) {
  const filter = {};
  if (search?.trim()) {
    const q = escapeRegex(search.trim());
    filter.$or = [
      { name: new RegExp(q, "i") },
      { email: new RegExp(q, "i") },
      { message: new RegExp(q, "i") },
    ];
  }
  const items = await VolunteerApplication.find(filter).sort({ createdAt: -1 }).limit(500).lean();
  return items.map((item) => ({
    id: item._id.toString(),
    name: item.name,
    email: item.email,
    phone: item.phone || "",
    message: item.message,
    createdAt: item.createdAt,
  }));
}

export async function listVentureStudioMessages({ search } = {}) {
  const filter = {};
  if (search?.trim()) {
    const q = escapeRegex(search.trim());
    filter.$or = [
      { name: new RegExp(q, "i") },
      { email: new RegExp(q, "i") },
      { subject: new RegExp(q, "i") },
      { message: new RegExp(q, "i") },
    ];
  }
  const items = await VentureStudioMessage.find(filter).sort({ createdAt: -1 }).limit(500).lean();
  return items.map((item) => ({
    id: item._id.toString(),
    name: item.name,
    email: item.email,
    subject: item.subject,
    message: item.message,
    createdAt: item.createdAt,
  }));
}
