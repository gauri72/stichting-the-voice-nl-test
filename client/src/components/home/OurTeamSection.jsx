import "../../styles/our-team.css";
import team1 from "../../assets/Home/team/team-1.png";
import team2 from "../../assets/Home/team/team-2.png";
import team3 from "../../assets/Home/team/team-3.png";
import team4 from "../../assets/Home/team/team-4.png";
import team5 from "../../assets/Home/team/team-5.png";
import team6 from "../../assets/Home/team/team-6.png";
import team7 from "../../assets/Home/team/team-7.png";
import team8 from "../../assets/Home/team/team-8.png";
import team9 from "../../assets/Home/team/team-9.png";
import team10 from "../../assets/Home/team/team-10.png";
import team11 from "../../assets/Home/team/team-11.png";
import team12 from "../../assets/Home/team/team-12.png";
import team13 from "../../assets/Home/team/team-13.png";

const teamMembers = [
  { name: "Shivam Joshi", role: "President", image: team1 },
  { name: "Rajendra Rade", role: "Treasurer", image: team2 },
  { name: "Saurabh Sharma", role: "Secretary", image: team3 },
  { name: "Rucha Naik", role: "Executive Board Member", image: team4 },
  { name: "Kirtee Kulkarni", role: "Social Media Manager", image: team5 },
  { name: "Sreedevi Mahadevan", role: "Executive Board Member", image: team6 },
  { name: "Aditya Wankhade", role: "Event Manager", image: team7 },
  { name: "Priyanka Bhide", role: "Executive Board Member", image: team8 },
  { name: "Yazhini Sivakumar", role: "Event Management Team", image: team9 },
  { name: "Dr. Manasi Mohri", role: "PR Manager", image: team10 },
  { name: "Shivani Trifaley", role: "PR Manager", image: team11 },
  { name: "Anshika Singh", role: "PR Manager", image: team12 },
  { name: "Parth Upadhyay", role: "PR Manager", image: team13 }
];

export default function OurTeamSection() {
  return (
    <section className="our-team-section" aria-labelledby="our-team-title">
      <div className="our-team-inner">
        <h2 id="our-team-title" className="our-team-title">
          Our Team
        </h2>

        <div className="our-team-grid" role="list" aria-label="Our team members">
          {teamMembers.map(({ name, role, image }) => (
            <article key={name} className="our-team-card" role="listitem">
              <div className="our-team-photo-wrap">
                <img className="our-team-photo" src={image} alt={name} loading="lazy" />
              </div>
              <h3>{name}</h3>
              <p>{role}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
