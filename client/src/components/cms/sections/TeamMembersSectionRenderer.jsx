import TeamMembersSlider from "../../about/TeamMembersSlider.jsx";

export default function TeamMembersSectionRenderer({ section }) {
  if (section?.isVisible === false) return null;
  return (
    <TeamMembersSlider
      sectionClassName="about-us-team-section cms-team-section"
      title={section?.title || "Our Team"}
      subtitle={section?.content?.subtitle || section?.settings?.subtitle || ""}
    />
  );
}
