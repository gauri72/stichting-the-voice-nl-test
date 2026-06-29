import { Link } from "react-router-dom";
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
  return (
    <Link to="/" className="voice-v-mark-link" aria-label="Stichting The V.O.I.C.E. NL — go to homepage">
      <img src={voiceVMark} alt="" className="voice-v-mark-link__img" aria-hidden="true" />
    </Link>
  );
}
