import {
  getFeaturedEvents,
  getUpcomingEvents,
  getEventShorts,
  getCalendarMonth,
} from "../services/eventExperienceService.js";
import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[event-experience]" });
}

export async function getFeaturedEventsHandler(req, res) {
  try {
    const events = await getFeaturedEvents({ limit: req.query.limit });
    return res.status(200).json({ events });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getUpcomingEventsHandler(req, res) {
  try {
    const data = await getUpcomingEvents({
      page: req.query.page,
      pageSize: req.query.pageSize,
      category: req.query.category,
      priceFilter: req.query.priceFilter,
      location: req.query.location,
      hasVideo: req.query.hasVideo,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      search: req.query.search,
      sort: req.query.sort,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getEventShortsHandler(req, res) {
  try {
    const data = await getEventShorts();
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=180");
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getCalendarHandler(req, res) {
  try {
    const data = await getCalendarMonth({ year: req.query.year, month: req.query.month });
    res.setHeader("Cache-Control", "public, max-age=120, stale-while-revalidate=300");
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
}
