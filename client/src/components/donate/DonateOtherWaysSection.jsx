import { FaArrowRightLong } from "react-icons/fa6";
import { FaGift, FaHandHoldingHeart, FaUserFriends } from "react-icons/fa";
import "../../styles/donate-section-heading.css";
import "../../styles/donate-other-ways-section.css";

const columns = [
  {
    title: "Corporate Partnerships",
    text: "Partner with us to create meaningful impact together.",
    Icon: FaHandHoldingHeart,
    href: "/sponsorship",
  },
  {
    title: "In-Kind Donations",
    text: "Support our cause by donating goods, services or resources.",
    Icon: FaGift,
    href: "mailto:info@stichtingthevoice.nl?subject=In-kind%20donation",
  },
  {
    title: "Volunteer With Us",
    text: "Give your time and skills to help our community thrive.",
    Icon: FaUserFriends,
    href: "mailto:info@stichtingthevoice.nl?subject=Volunteering",
  },
];

export default function DonateOtherWaysSection() {
  return (
    <section id="donate-other-ways" className="donate-other" aria-labelledby="donate-other-title">
      <div className="donate-other__container">
        <header className="donate-section__header">
          <div className="donate-section__heading">
            <span className="donate-section__heading-line" aria-hidden="true" />
            <h2 id="donate-other-title" className="donate-section__title">
              Other Ways to Give
            </h2>
            <span className="donate-section__heading-line" aria-hidden="true" />
          </div>
        </header>

        <div className="donate-other__grid" role="list">
          {columns.map(({ title, text, Icon, href }) => (
            <article key={title} className="donate-other__card" role="listitem">
              <span className="donate-other__icon" aria-hidden="true">
                <Icon />
              </span>
              <div className="donate-other__body">
                <h3>{title}</h3>
                <p>{text}</p>
                <a className="donate-other__link" href={href}>
                  Learn More
                  <FaArrowRightLong aria-hidden />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
