import { IconCheck } from "@tabler/icons-react";
import {
  MEMBERSHIP_COMPARISON_ROWS,
  MEMBERSHIP_HIGHLIGHT_TIER_ID,
  MEMBERSHIP_TIERS,
} from "../../data/membershipPlansDisplay.js";
import "../../styles/membership-comparison-table-section.css";

const TIER_KEYS = [
  "student",
  "privilegedSingle",
  "privilegedFamily",
  "premiumSingle",
  "premiumFamily",
];

/** Columns 2, 3, 4, 6 — Student, Privileged Single/Family, Premium Family */
const STANDARD_VALUE_TIERS = new Set([
  "student",
  "privilegedSingle",
  "privilegedFamily",
  "premiumFamily",
]);

function ComparisonCell({ cell, tierId }) {
  const useStandardTone = STANDARD_VALUE_TIERS.has(tierId);
  const useGoldTone = tierId === MEMBERSHIP_HIGHLIGHT_TIER_ID;

  if (!cell || cell.type === "dash") {
    return (
      <span
        className={`membership-comparison-table__dash${
          useStandardTone ? " membership-comparison-table__dash--standard" : ""
        }`}
        aria-hidden="true"
      >
        —
      </span>
    );
  }

  if (cell.type === "check") {
    const tone = useGoldTone ? "gold" : useStandardTone ? "standard" : "green";
    return (
      <span
        className={`membership-comparison-table__check membership-comparison-table__check--${tone}`}
        aria-label="Included"
      >
        <IconCheck size={18} stroke={2.5} aria-hidden />
      </span>
    );
  }

  const tone = useGoldTone ? "gold" : "standard";
  return (
    <span className={`membership-comparison-table__value membership-comparison-table__value--${tone}`}>
      {cell.value}
    </span>
  );
}

export default function MembershipComparisonTableSection() {
  return (
    <section
      id="membership-comparison"
      className="membership-comparison-table-section"
      aria-labelledby="membership-comparison-title"
    >
      <div className="membership-comparison-table-section__inner">
        <h2 id="membership-comparison-title" className="visually-hidden">
          Membership benefits comparison
        </h2>

        <div className="membership-comparison-table__wrap">
          <table className="membership-comparison-table">
            <thead>
              <tr>
                <th scope="col" className="membership-comparison-table__benefits-head">
                  Benefits
                </th>
                {MEMBERSHIP_TIERS.map((tier) => (
                  <th
                    key={tier.id}
                    scope="col"
                    className={`membership-comparison-table__tier-head membership-comparison-table__tier-head--${tier.theme}${
                      tier.id === MEMBERSHIP_HIGHLIGHT_TIER_ID
                        ? " membership-comparison-table__tier-head--highlight"
                        : ""
                    }`}
                  >
                    <span className="membership-comparison-table__tier-name">
                      {(tier.tableNameLines || [tier.name]).map((line) => (
                        <span key={line} className="membership-comparison-table__tier-name-line">
                          {line}
                        </span>
                      ))}
                    </span>
                    <span className="membership-comparison-table__tier-price">
                      {tier.price}
                      <span className="membership-comparison-table__tier-period">/year</span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEMBERSHIP_COMPARISON_ROWS.map((row) => (
                <tr key={row.benefit}>
                  <th scope="row" className="membership-comparison-table__benefit">
                    {row.benefit}
                  </th>
                  {TIER_KEYS.map((tierId) => (
                    <td
                      key={`${row.benefit}-${tierId}`}
                      className={`membership-comparison-table__cell${
                        tierId === MEMBERSHIP_HIGHLIGHT_TIER_ID
                          ? " membership-comparison-table__cell--highlight"
                          : ""
                      }`}
                    >
                      <ComparisonCell cell={row[tierId]} tierId={tierId} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
