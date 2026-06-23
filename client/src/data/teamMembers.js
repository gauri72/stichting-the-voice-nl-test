import team1 from "../assets/Home/team/team-1.png";
import team2 from "../assets/Home/team/team-2.png";
import team3 from "../assets/Home/team/team-3.png";
import team4 from "../assets/Home/team/team-4.png";
import team5 from "../assets/Home/team/team-5.png";
import team6 from "../assets/Home/team/team-6.png";
import team7 from "../assets/Home/team/team-7.png";
import team8 from "../assets/Home/team/team-8.png";
import team9 from "../assets/Home/team/team-9.png";
import team10 from "../assets/Home/team/team-10.png";
import team11 from "../assets/Home/team/team-11.png";
import team12 from "../assets/Home/team/team-12.png";
import team13 from "../assets/Home/team/team-13.png";
import team14 from "../assets/Home/team/team-14.png";

export const TEAM_IMAGE_MAP = {
  "team-1": team1,
  "team-2": team2,
  "team-3": team3,
  "team-4": team4,
  "team-5": team5,
  "team-6": team6,
  "team-7": team7,
  "team-8": team8,
  "team-9": team9,
  "team-10": team10,
  "team-11": team11,
  "team-12": team12,
  "team-13": team13,
  "team-14": team14,
};

/** Fallback roster when API is unavailable — exact display order. */
const TEAM_MEMBERS = [
  { id: "fallback-1", fullName: "Shivam Joshi", name: "Shivam Joshi", role: "President", designation: "President", teamCategory: "Executive Board", imageAssetKey: "team-1", isBoardMember: true, featured: true, displayOrder: 1 },
  { id: "fallback-2", fullName: "Rucha Naik", name: "Rucha Naik", role: "Executive Board Member", designation: "Board Member", teamCategory: "Executive Board", imageAssetKey: "team-4", isBoardMember: true, displayOrder: 2 },
  { id: "fallback-3", fullName: "Saurabh Sharma", name: "Saurabh Sharma", role: "Secretary General", designation: "Secretary General", teamCategory: "Executive Board", imageAssetKey: "team-3", isBoardMember: true, displayOrder: 3 },
  { id: "fallback-4", fullName: "Rajendra Rade", name: "Rajendra Rade", role: "Treasurer", designation: "Treasurer", teamCategory: "Executive Board", imageAssetKey: "team-2", isBoardMember: true, displayOrder: 4 },
  { id: "fallback-5", fullName: "Kirtee Kulkarni", name: "Kirtee Kulkarni", role: "Social Media Manager", designation: "Social Media", teamCategory: "Communications", imageAssetKey: "team-5", displayOrder: 5 },
  { id: "fallback-6", fullName: "Sreedevi Mahadevan", name: "Sreedevi Mahadevan", role: "Event Manager", designation: "Event Manager", teamCategory: "Events", imageAssetKey: "team-6", displayOrder: 6 },
  { id: "fallback-7", fullName: "Priyanka Bhide", name: "Priyanka Bhide", role: "Executive Board Member", designation: "Board Member", teamCategory: "Executive Board", imageAssetKey: "team-8", isBoardMember: true, displayOrder: 7 },
  { id: "fallback-8", fullName: "Deepti Madaram", name: "Deepti Madaram", role: "PR Manager Den Haag", designation: "PR Manager", teamCategory: "PR & Communications", imageAssetKey: "team-14", displayOrder: 8 },
  { id: "fallback-9", fullName: "Yazhini Sivakumar", name: "Yazhini Sivakumar", role: "Event Management Team", designation: "Events Team", teamCategory: "Events", imageAssetKey: "team-9", displayOrder: 9 },
  { id: "fallback-10", fullName: "Anshika Singh Bais", name: "Anshika Singh Bais", role: "PR Manager", designation: "PR Manager", teamCategory: "PR & Communications", imageAssetKey: "team-12", displayOrder: 10 },
  { id: "fallback-11", fullName: "Shivani Trifaley", name: "Shivani Trifaley", role: "PR Manager", designation: "PR Manager", teamCategory: "PR & Communications", imageAssetKey: "team-11", displayOrder: 11 },
  { id: "fallback-12", fullName: "Aditya Wankhade", name: "Aditya Wankhade", role: "Event Management Team", designation: "Events Team", teamCategory: "Events", imageAssetKey: "team-7", displayOrder: 12 },
  { id: "fallback-13", fullName: "Parth Upadhyay", name: "Parth Upadhyay", role: "Event Management Team", designation: "Events Team", teamCategory: "Events", imageAssetKey: "team-13", displayOrder: 13 },
  { id: "fallback-14", fullName: "Dr. Manasi Moharil", name: "Dr. Manasi Moharil", role: "Event Management Team", designation: "Events Team", teamCategory: "Events", imageAssetKey: "team-10", displayOrder: 14 },
];

export function getInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export function resolveTeamMemberImage(member) {
  if (member?.imageUrl) return member.imageUrl;
  if (member?.imageAssetKey && TEAM_IMAGE_MAP[member.imageAssetKey]) {
    return TEAM_IMAGE_MAP[member.imageAssetKey];
  }
  return null;
}

export function getFallbackTeamMembers() {
  return TEAM_MEMBERS.map((m) => ({
    ...m,
    initials: getInitials(m.fullName),
  }));
}

export default TEAM_MEMBERS;
