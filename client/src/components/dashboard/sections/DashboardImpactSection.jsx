import {
  IconBulb,
  IconHeartHandshake,
  IconMicrophone2,
  IconTicket,
} from "@tabler/icons-react";
import "../../../styles/dashboard-impact-section.css";

export default function DashboardImpactSection({ overview }) {
  const items = [
    {
      id: "experiences",
      icon: <IconTicket size={26} stroke={1.75} />,
      value: overview?.events?.value ?? "0",
      label: ["Experiences", "Attended"],
      tone: "teal",
    },
    {
      id: "stories",
      icon: <IconMicrophone2 size={26} stroke={1.75} />,
      value: overview?.stories?.value ?? "0",
      label: ["Stories", "Shared"],
      tone: "blue",
    },
    {
      id: "contributions",
      icon: <IconHeartHandshake size={26} stroke={1.75} />,
      value: overview?.donations?.value ?? "€0",
      label: ["Impact", "Contributions"],
      tone: "green",
      highlight: true,
    },
    {
      id: "innovation",
      icon: <IconBulb size={26} stroke={1.75} />,
      value: overview?.sponsorships?.count ?? "0",
      label: ["Innovation", "Projects"],
      tone: "blue",
    },
  ];

  return (
    <section className="dash-impact-section" aria-labelledby="dash-impact-mobile-title">
      <h2 id="dash-impact-mobile-title" className="dash-impact-section__title">
        <span className="dash-impact-section__title-line" aria-hidden />
        Your V.O.I.C.E. NL Impact
        <span className="dash-impact-section__title-line" aria-hidden />
      </h2>
      <ul className="dash-impact-section__list">
        {items.map((item) => (
          <li
            key={item.id}
            className={`dash-impact-section__item dash-impact-section__item--${item.tone}${
              item.highlight ? " dash-impact-section__item--highlight" : ""
            }`}
          >
            <span className="dash-impact-section__ring" aria-hidden>
              {item.icon}
            </span>
            <p className="dash-impact-section__value">{item.value}</p>
            <p className="dash-impact-section__label">
              {item.label[0]}
              <br />
              {item.label[1]}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
