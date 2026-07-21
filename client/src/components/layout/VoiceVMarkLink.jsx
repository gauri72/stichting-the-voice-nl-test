import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import voiceVMark from "../../assets/Home/voice-v-mark.png";
import "../../styles/voice-v-mark-link.css";

/**
 * The "V." brand mark is baked into the hero/breadcrumb background artwork
 * (same source image, reused across Home/About/Stories/Login/CMS heroes).
 * This overlays a real, independently-animatable cutout of that exact mark
 * — extracted from the source PNG via alpha masking, not redrawn — in the
 * same position, so it's a seamless visual match at rest but becomes a real
 * clickable, hoverable element on top.
 */
export default function VoiceVMarkLink() {
  const { t } = useTranslation(["common"]);
  return (
    <Link to="/" className="voice-v-mark-link" aria-label={t("common:voiceVMarkLink.ariaLabel")}>
      <img src={voiceVMark} alt="" className="voice-v-mark-link__img" aria-hidden="true" />
    </Link>
  );
}
