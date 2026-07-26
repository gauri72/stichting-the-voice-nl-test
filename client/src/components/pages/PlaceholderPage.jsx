import { useSeo } from "../../hooks/useSeo.js";
import "../../styles/placeholder-page.css";

export default function PlaceholderPage({ title }) {
  useSeo({ title, noindex: true });

  return (
    <section className="placeholder-page" aria-labelledby="placeholder-page-title">
      <div className="placeholder-page__inner">
        <h1 id="placeholder-page-title" className="placeholder-page__title">
          {title}
        </h1>
      </div>
    </section>
  );
}
