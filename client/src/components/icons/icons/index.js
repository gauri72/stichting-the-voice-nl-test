// Every icon, exported both as a standalone named component (for direct
// `import { BookTickets } from "...icons"` usage) and registered in
// ICON_MAP so VIcon's `variant` prop can look it up by string key.
import BookTickets from "./BookTickets.jsx";
import PayWallet from "./PayWallet.jsx";
import EarnPoints from "./EarnPoints.jsx";
import RedeemPoints from "./RedeemPoints.jsx";
import AiAgent from "./AiAgent.jsx";
import ConfirmBooking from "./ConfirmBooking.jsx";
import TopUp from "./TopUp.jsx";
import Broadcast from "./Broadcast.jsx";
import GenerateTemplate from "./GenerateTemplate.jsx";
import SchedulePrompt from "./SchedulePrompt.jsx";
import ApplyDiscount from "./ApplyDiscount.jsx";
import ExportCsv from "./ExportCsv.jsx";
import NewChat from "./NewChat.jsx";
import SavePrompt from "./SavePrompt.jsx";
import ManageMembership from "./ManageMembership.jsx";
import ViewHistory from "./ViewHistory.jsx";
import SendBroadcast from "./SendBroadcast.jsx";
import CreateEvent from "./CreateEvent.jsx";
import PublishEvent from "./PublishEvent.jsx";
import ManageTickets from "./ManageTickets.jsx";

export {
  BookTickets,
  PayWallet,
  EarnPoints,
  RedeemPoints,
  AiAgent,
  ConfirmBooking,
  TopUp,
  Broadcast,
  GenerateTemplate,
  SchedulePrompt,
  ApplyDiscount,
  ExportCsv,
  NewChat,
  SavePrompt,
  ManageMembership,
  ViewHistory,
  SendBroadcast,
  CreateEvent,
  PublishEvent,
  ManageTickets,
};

export const ICON_MAP = {
  "book-tickets": BookTickets,
  "pay-wallet": PayWallet,
  "earn-points": EarnPoints,
  "redeem-points": RedeemPoints,
  "ai-agent": AiAgent,
  "confirm-booking": ConfirmBooking,
  "top-up": TopUp,
  broadcast: Broadcast,
  "generate-template": GenerateTemplate,
  "schedule-prompt": SchedulePrompt,
  "apply-discount": ApplyDiscount,
  "export-csv": ExportCsv,
  "new-chat": NewChat,
  "save-prompt": SavePrompt,
  "manage-membership": ManageMembership,
  "view-history": ViewHistory,
  "send-broadcast": SendBroadcast,
  "create-event": CreateEvent,
  "publish-event": PublishEvent,
  "manage-tickets": ManageTickets,
};

export const ICON_VARIANTS = Object.keys(ICON_MAP);
