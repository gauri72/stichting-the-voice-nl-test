import ImpactStatsBar from "../../home/ImpactStatsBar.jsx";

export default function StatisticsRenderer({ section }) {
  const { content = {} } = section;
  const stats = content.stats || [];

  if (!stats.length && section.sectionKey === "impact-stats") {
    return <ImpactStatsBar />;
  }

  return (
    <section className="cms-statistics">
      {content.heading ? <h2>{content.heading}</h2> : null}
      <div className="cms-statistics__grid">
        {stats.map((stat, i) => (
          <div key={stat.id || i} className="cms-statistics__item">
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
