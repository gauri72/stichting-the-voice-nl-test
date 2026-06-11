import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const BCRYPT_ROUNDS = 12;

function handleError(res, error) {
  const status = error.status || 500;
  const message = error.message || "Something went wrong.";
  if (status >= 500) {
    console.error("[admin-users]", error);
  }
  return res.status(status).json({ error: message });
}

// Map UI provider names to DB names
function mapProviderToDb(provider) {
  const p = String(provider || "").trim().toLowerCase();
  if (p === "email" || p === "local") return "local";
  if (p === "google") return "google";
  return "local"; // fallback
}

// Map DB provider names to UI names
function mapProviderToUi(provider) {
  if (provider === "google") return "Google";
  return "Email";
}

export async function listUsers(req, res) {
  try {
    const { search } = req.query || {};
    let query = {};

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query = {
        $or: [
          { firstName: regex },
          { lastName: regex },
          { email: regex },
          { phone: regex },
        ],
      };
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      users: users.map((u) => ({
        id: u._id.toString(),
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone || "",
        authProvider: mapProviderToUi(u.authProvider),
        isVerified: Boolean(u.isVerified),
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getUser(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id).lean();
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json({
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || "",
        authProvider: mapProviderToUi(user.authProvider),
        isVerified: Boolean(user.isVerified),
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createUser(req, res) {
  try {
    const { firstName, lastName, email, phone, authProvider, isVerified } = req.body || {};

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return res.status(400).json({ error: "First name, last name, and email are required." });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existing = await User.findOne({ email: cleanEmail }).select("_id").lean();
    if (existing) {
      return res.status(400).json({ error: `A user with email '${cleanEmail}' already exists.` });
    }

    // Since password is not required in the admin UI, we generate a secure random one
    const randomPassword = crypto.randomBytes(32).toString("hex");
    const passwordHash = await bcrypt.hash(randomPassword, BCRYPT_ROUNDS);

    const mappedProvider = mapProviderToDb(authProvider);

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: cleanEmail,
      phone: (phone || "").trim(),
      passwordHash,
      authProvider: mappedProvider,
      isVerified: isVerified !== undefined ? Boolean(isVerified) : true,
      googleId: mappedProvider === "google" ? `admin-gen-${crypto.randomBytes(8).toString("hex")}` : undefined,
    });

    return res.status(201).json({
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || "",
        authProvider: mapProviderToUi(user.authProvider),
        isVerified: Boolean(user.isVerified),
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, authProvider, isVerified } = req.body || {};

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return res.status(400).json({ error: "First name, last name, and email are required." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (cleanEmail !== user.email) {
      const existing = await User.findOne({ email: cleanEmail }).select("_id").lean();
      if (existing) {
        return res.status(400).json({ error: `A user with email '${cleanEmail}' already exists.` });
      }
    }

    const mappedProvider = mapProviderToDb(authProvider);

    user.firstName = firstName.trim();
    user.lastName = lastName.trim();
    user.email = cleanEmail;
    user.phone = (phone || "").trim();
    
    // If provider switched to google and googleId is missing, generate one
    if (mappedProvider === "google" && !user.googleId) {
      user.googleId = `admin-gen-${crypto.randomBytes(8).toString("hex")}`;
    } else if (mappedProvider === "local") {
      user.googleId = undefined;
    }
    
    user.authProvider = mappedProvider;
    user.isVerified = isVerified !== undefined ? Boolean(isVerified) : user.isVerified;

    if (!String(user.passwordHash || "").trim()) {
      user.passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), BCRYPT_ROUNDS);
    }

    await user.save();

    return res.status(200).json({
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || "",
        authProvider: mapProviderToUi(user.authProvider),
        isVerified: Boolean(user.isVerified),
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}
