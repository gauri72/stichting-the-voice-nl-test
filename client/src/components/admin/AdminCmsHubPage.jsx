import { Link } from "react-router-dom";
import {
  IconLayout,
  IconMenu2,
  IconPalette,
  IconBoxMultiple,
  IconTemplate,
  IconSearch,
  IconHistory,
  IconSettings,
  IconPhoto,
} from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import "../../styles/admin-cms-hub.css";

const TILES = [
  {
    title: "Pages",
    description: "Edit every page visually — click any section to change it.",
    icon: IconLayout,
    to: "/admin/cms/pages",
    enabled: true,
  },
  {
    title: "Navigation",
    description: "Header, footer, mobile and dashboard menus.",
    icon: IconMenu2,
    to: "/admin/cms/navigation",
    enabled: true,
  },
  {
    title: "SEO",
    description: "All pages at a glance — meta titles, descriptions, previews.",
    icon: IconSearch,
    to: "/admin/cms/seo",
    enabled: true,
  },
  {
    title: "Audit Log",
    description: "Every CMS change — who, what, when.",
    icon: IconHistory,
    to: "/admin/cms/audit-log",
    enabled: true,
  },
  {
    title: "Design System",
    description: "Site-wide colors, fonts and spacing tokens.",
    icon: IconPalette,
    to: "/admin/cms/design-system",
    enabled: true,
  },
  {
    title: "Component Library",
    description: "Reusable blocks — edit once, update everywhere.",
    icon: IconBoxMultiple,
    to: "/admin/cms/component-library",
    enabled: true,
  },
  {
    title: "Templates",
    description: "Create new pages from ready-made layouts.",
    icon: IconTemplate,
    to: "/admin/cms/templates",
    enabled: true,
  },
  {
    title: "Media Library",
    description: "S3-backed asset library with usage tracking.",
    icon: IconPhoto,
    to: "/admin/cms/media-library",
    enabled: true,
  },
  {
    title: "Settings",
    description: "CMS roles, defaults and preferences.",
    icon: IconSettings,
    to: "#",
    enabled: false,
  },
];

export default function AdminCmsHubPage() {
  return (
    <AdminLayout pageTitle="CMS" pageSubtitle="Visually manage the V.O.I.C.E. NL website and dashboard.">
      <div className="admin-cms-hub__grid">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          const content = (
            <>
              <Icon size={28} stroke={1.5} />
              <h3>{tile.title}</h3>
              <p>{tile.description}</p>
              {tile.note ? <span className="admin-cms-hub__note">{tile.note}</span> : null}
              {!tile.enabled ? <span className="admin-cms-hub__badge">Coming soon</span> : null}
            </>
          );
          return tile.enabled ? (
            <Link key={tile.title} to={tile.to} className="admin-cms-hub__tile">
              {content}
            </Link>
          ) : (
            <div key={tile.title} className="admin-cms-hub__tile admin-cms-hub__tile--disabled">
              {content}
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
