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

const TEAM_MEMBERS = [
  { name: "Shivam Joshi", role: "President", image: team1 },
  { name: "Rajendra Rade", role: "Treasurer", image: team2 },
  { name: "Saurabh Sharma", role: "Secretary General", image: team3 },
  { name: "Rucha Naik", role: "Executive Board Member", image: team4 },
  { name: "Kirtee Kulkarni", role: "Social Media Manager", image: team5 },
  { name: "Sreedevi Mahadevan", role: "Event Manager", image: team6 },
  { name: "Aditya Wankhade", role: "Event Management Team", image: team7 },
  { name: "Priyanka Bhide", role: "Executive Board Member", image: team8 },
  { name: "Yazhini Sivakumar", role: "Event Management Team", image: team9 },
  { name: "Dr. Manasi Moharil", role: "Event Management Team", image: team10 },
  { name: "Shivani Trifaley", role: "PR Manager", image: team11 },
  { name: "Anshika Singh", role: "PR Manager", image: team12 },
  { name: "Deepti Madaram", role: "PR Manager Den Haag", image: team14 },
  { name: "Parth Upadhyay", role: "Event Management Team", image: team13 },
];

export function getTeamMembersAlphabetical() {
  return [...TEAM_MEMBERS].sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}

export default TEAM_MEMBERS;
