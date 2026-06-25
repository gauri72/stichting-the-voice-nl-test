import HeroSectionRenderer from "./sections/HeroSectionRenderer.jsx";
import BreadcrumbHeroRenderer from "./sections/BreadcrumbHeroRenderer.jsx";
import TextSectionRenderer from "./sections/TextSectionRenderer.jsx";
import ImageTextRenderer from "./sections/ImageTextRenderer.jsx";
import CardGridRenderer from "./sections/CardGridRenderer.jsx";
import FeatureCardsRenderer from "./sections/FeatureCardsRenderer.jsx";
import StatisticsRenderer from "./sections/StatisticsRenderer.jsx";
import CtaBannerRenderer from "./sections/CtaBannerRenderer.jsx";
import TestimonialsRenderer from "./sections/TestimonialsRenderer.jsx";
import EventSliderRenderer from "./sections/EventSliderRenderer.jsx";
import FeaturedEventsRenderer from "./sections/FeaturedEventsRenderer.jsx";
import GalleryRenderer from "./sections/GalleryRenderer.jsx";
import FaqRenderer from "./sections/FaqRenderer.jsx";
import SponsorLogosRenderer from "./sections/SponsorLogosRenderer.jsx";
import CustomHtmlRenderer from "./sections/CustomHtmlRenderer.jsx";
import TeamMembersSectionRenderer from "./sections/TeamMembersSectionRenderer.jsx";
import GenericSectionRenderer from "./sections/GenericSectionRenderer.jsx";
import EditableSectionOverlay from "./EditableSectionOverlay.jsx";
import { SECTION_TYPE_LABELS } from "../../utils/pagesAdmin.js";
import useIsMobileViewport from "../../hooks/useIsMobileViewport.js";
import "../../styles/cms-page.css";

const RENDERERS = {
  hero: HeroSectionRenderer,
  breadcrumb_hero: BreadcrumbHeroRenderer,
  text: TextSectionRenderer,
  image_text: ImageTextRenderer,
  card_grid: CardGridRenderer,
  feature_cards: FeatureCardsRenderer,
  statistics: StatisticsRenderer,
  cta_banner: CtaBannerRenderer,
  testimonials: TestimonialsRenderer,
  event_slider: EventSliderRenderer,
  featured_events: FeaturedEventsRenderer,
  gallery: GalleryRenderer,
  faq: FaqRenderer,
  sponsor_logos: SponsorLogosRenderer,
  custom_html: CustomHtmlRenderer,
  team_members: TeamMembersSectionRenderer,
};

export default function PageSectionRenderer({
  sections = [],
  preview = false,
  editable = false,
  selectedSectionId = null,
  onSelectSection,
  forceMobile = null,
}) {
  const viewportIsMobile = useIsMobileViewport();
  const isMobile = forceMobile === null ? viewportIsMobile : forceMobile;

  if (!sections.length) return null;

  const visibleSections = sections.filter((s) => !(isMobile && s.settings?.mobileVisible === false));

  return (
    <div className={`cms-page${preview ? " cms-page--preview" : ""}`}>
      {visibleSections.map((section) => {
        const Renderer = RENDERERS[section.sectionType] || GenericSectionRenderer;
        const rendered = <Renderer key={section.sectionId} section={section} preview={preview} />;

        if (!editable) return rendered;

        return (
          <EditableSectionOverlay
            key={section.sectionId}
            section={section}
            label={section.title || SECTION_TYPE_LABELS[section.sectionType] || section.sectionType}
            selected={selectedSectionId === section.sectionId}
            onSelect={onSelectSection}
          >
            {rendered}
          </EditableSectionOverlay>
        );
      })}
    </div>
  );
}
