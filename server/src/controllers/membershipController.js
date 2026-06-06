import Member from "../models/Member.js";

export async function verifyMembership(req, res) {
  try {
    const token = String(req.params.token || "").trim();
    if (!token) {
      return res.status(400).json({ error: "Verification token is required." });
    }

    const member = await Member.findOne({ verificationToken: token })
      .select(
        "membershipId firstName lastName email membershipType startDate expiryDate membershipStatus"
      )
      .lean();

    if (!member) {
      return res.status(404).json({ valid: false, error: "Membership not found." });
    }

    const now = new Date();
    const isExpired = member.expiryDate && new Date(member.expiryDate) < now;
    const status = isExpired ? "expired" : member.membershipStatus;

    return res.status(200).json({
      valid: status === "active",
      membershipId: member.membershipId,
      memberName: `${member.firstName} ${member.lastName}`.trim(),
      membershipType: member.membershipType,
      email: member.email,
      startDate: member.startDate,
      expiryDate: member.expiryDate,
      membershipStatus: status
    });
  } catch (error) {
    console.error("[membership] verifyMembership error:", error);
    return res.status(500).json({ error: "Unable to verify membership." });
  }
}
