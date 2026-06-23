import { Link } from "react-router-dom";

function CtaLink({ cta }) {
  if (!cta?.visible && cta?.visible !== undefined) return null;
  if (!cta?.text) return null;
  const className = `cms-cta cms-cta--${cta.style || "primary"}`;
  if (cta.url?.startsWith("/")) {
    return <Link to={cta.url} className={className} target={cta.target}>{cta.text}</Link>;
  }
  return <a href={cta.url || "#"} className={className} target={cta.target || "_blank"} rel="noopener noreferrer">{cta.text}</a>;
}

export default function CmsCtaButtons({ ctas = [] }) {
  const visible = ctas.filter((c) => c.visible !== false && c.text);
  if (!visible.length) return null;
  return (
    <div className="cms-cta-group">
      {visible.map((cta) => <CtaLink key={cta.id} cta={cta} />)}
    </div>
  );
}
