import { Router } from "express";
import {
  reportOverview,
  reportRevenue,
  reportEvents,
  reportTickets,
  reportMemberships,
  reportSponsorships,
  reportDonations,
  reportDiscounts,
  reportUsers,
  reportCheckins,
  reportFinance,
  customReportPreview,
  listReportTemplates,
  saveReportTemplate,
  updateReportTemplate,
  deleteReportTemplate,
  listScheduledReports,
  saveScheduledReport,
  exportReport,
} from "../controllers/adminReportController.js";
import { requireReportSection, requireReportExport } from "../middleware/reportMiddleware.js";

const router = Router();

router.get("/overview", requireReportSection("overview"), reportOverview);
router.get("/revenue", requireReportSection("revenue"), reportRevenue);
router.get("/events", requireReportSection("events"), reportEvents);
router.get("/tickets", requireReportSection("tickets"), reportTickets);
router.get("/memberships", requireReportSection("memberships"), reportMemberships);
router.get("/sponsorships", requireReportSection("sponsorships"), reportSponsorships);
router.get("/donations", requireReportSection("donations"), reportDonations);
router.get("/discounts", requireReportSection("discounts"), reportDiscounts);
router.get("/users", requireReportSection("users"), reportUsers);
router.get("/checkins", requireReportSection("checkins"), reportCheckins);
router.get("/finance", requireReportSection("finance"), reportFinance);

router.post("/custom/preview", requireReportSection("custom"), customReportPreview);
router.get("/custom/templates", requireReportSection("custom"), listReportTemplates);
router.post("/custom/save", requireReportSection("custom"), saveReportTemplate);
router.patch("/custom/templates/:id", requireReportSection("custom"), updateReportTemplate);
router.delete("/custom/templates/:id", requireReportSection("custom"), deleteReportTemplate);

router.get("/scheduled", requireReportSection("schedule"), listScheduledReports);
router.post("/scheduled", requireReportSection("schedule"), saveScheduledReport);

router.post("/export/pdf", requireReportExport, (req, res) => {
  req.body = { ...req.body, format: "pdf" };
  return exportReport(req, res);
});
router.post("/export/excel", requireReportExport, (req, res) => {
  req.body = { ...req.body, format: "excel" };
  return exportReport(req, res);
});
router.post("/export/csv", requireReportExport, (req, res) => {
  req.body = { ...req.body, format: "csv" };
  return exportReport(req, res);
});

export default router;
