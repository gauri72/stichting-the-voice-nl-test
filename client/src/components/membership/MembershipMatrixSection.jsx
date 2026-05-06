import "../../styles/membership-matrix-section.css";

const rows = [
  {
    feature: "All 4 Flagship Events In A Year",
    family: "100% Free",
    single: "100% Free",
    privileged: "10% Discount",
    vownl: "1 Free Event",
  },
  {
    feature: "Partner Ticket For All 4 Flagship Events",
    family: "100% Free",
    single: "10% Discount",
    privileged: "10% Discount",
    vownl: "15% Discount",
  },
  {
    feature: "Reserved Seats",
    family: "Reserved Premium Seats",
    single: "Reserved Premium Seats",
    privileged: "Reserved Privileged Seats",
    vownl: "Priority Block",
  },
  {
    feature: "Child Ticket (max 2)",
    family: "50% Discount",
    single: "50% Discount",
    privileged: "25% Discount",
    vownl: "30% Discount",
  },
  {
    feature: "Welcome Kit",
    family: "included",
    single: "included",
    privileged: "not-included",
    vownl: "included",
  },
  {
    feature: "Sponsors Offers (Partner Benefits)",
    family: "included",
    single: "included",
    privileged: "included",
    vownl: "included",
  },
  {
    feature: "Lounge Access During Events",
    family: "included",
    single: "included",
    privileged: "included",
    vownl: "included",
  },
  {
    feature: "Celebrity Priority Meetup (Invite Only)",
    family: "included",
    single: "included",
    privileged: "included",
    vownl: "not-included",
  },
  {
    feature: "Price",
    family: "250€",
    single: "150€",
    privileged: "25€",
    vownl: "75€",
  },
];

function Cell({ value }) {
  if (value === "included") return <span className="membership-matrix__status-icon status--ok" aria-label="Included">✔</span>;
  if (value === "not-included") return <span className="membership-matrix__status-icon status--no" aria-label="Not included">✖</span>;
  return <span className="membership-matrix__text">{value}</span>;
}

export default function MembershipMatrixSection() {
  return (
    <section className="membership-matrix" aria-labelledby="membership-matrix-title">
      <div className="membership-matrix__container">
        <div className="membership-matrix__heading">
          <span className="membership-matrix__heading-line" aria-hidden="true" />
          <h2 id="membership-matrix-title" className="membership-matrix__title">
            Membership Plan Matrix
          </h2>
          <span className="membership-matrix__heading-line" aria-hidden="true" />
        </div>

        <div className="membership-matrix__table-wrap">
          <table className="membership-matrix__table">
            <thead>
              <tr>
                <th className="membership-matrix__col-head membership-matrix__col-head--feature">Features</th>
                <th className="membership-matrix__col-head">Premium Family Membership</th>
                <th className="membership-matrix__col-head">Premium Single Membership</th>
                <th className="membership-matrix__col-head">Privileged Membership</th>
                <th className="membership-matrix__col-head">VOWNL Membership</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.feature}>
                  <th scope="row" className="membership-matrix__feature-cell">
                    <span className="membership-matrix__feature-label">{row.feature}</span>
                  </th>
                  <td className="membership-matrix__col-cell">
                    <Cell value={row.family} />
                  </td>
                  <td className="membership-matrix__col-cell">
                    <Cell value={row.single} />
                  </td>
                  <td className="membership-matrix__col-cell">
                    <Cell value={row.privileged} />
                  </td>
                  <td className="membership-matrix__col-cell">
                    <Cell value={row.vownl} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
