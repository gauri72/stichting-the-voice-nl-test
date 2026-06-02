import VolunteerForm from "./VolunteerForm";
import "../../styles/volunteer-page.css";

export default function VolunteerPage() {
  return (
    <section className="volunteer-page" aria-labelledby="volunteer-page-title">
      <div className="volunteer-page__inner">
        <h1 id="volunteer-page-title" className="volunteer-page__title">
          Fill This Form to Volunteer
        </h1>
        <VolunteerForm />
      </div>
    </section>
  );
}
