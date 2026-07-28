import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconBell, IconCheck } from "@tabler/icons-react";
import { apiFetch, adminAuthHeaders } from "../../utils/api.js";

const POLL_MS = 30_000;
const DEFAULT_PAGE_SIZE = 8;
const EXPANDED_PAGE_SIZE = 50;

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AdminNotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await apiFetch("/api/admin/notifications/unread-count", { headers: adminAuthHeaders() });
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Silent — a failed poll shouldn't surface an error toast for a background badge.
    }
  }, []);

  const fetchNotifications = useCallback(async (pageSize) => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/admin/notifications?pageSize=${pageSize}`, { headers: adminAuthHeaders() });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Leave the last-known list in place rather than clearing it on a transient error.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const id = setInterval(fetchUnreadCount, POLL_MS);
    return () => clearInterval(id);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!open) return undefined;
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) {
      setExpanded(false);
      fetchNotifications(DEFAULT_PAGE_SIZE);
    }
  }

  async function handleViewAll() {
    setExpanded(true);
    await fetchNotifications(EXPANDED_PAGE_SIZE);
  }

  async function markRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt || new Date().toISOString() } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await apiFetch(`/api/admin/notifications/${id}/read`, { method: "POST", headers: adminAuthHeaders() });
    } catch {
      // The optimistic update stands even if the request fails — worst case a notification
      // reappears as unread on the next poll, which is a harmless inconsistency.
    }
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    setUnreadCount(0);
    try {
      await apiFetch("/api/admin/notifications/mark-all-read", { method: "POST", headers: adminAuthHeaders() });
    } catch {
      fetchUnreadCount();
    }
  }

  async function handleNotificationClick(notification) {
    if (!notification.readAt) await markRead(notification.id);
    if (notification.broadcastId) {
      setOpen(false);
      navigate(`/admin/communication/broadcasts/${notification.broadcastId}`);
    }
  }

  return (
    <div className="admin-notification-bell" ref={panelRef}>
      <button
        type="button"
        className="admin-layout__icon-btn"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        onClick={toggleOpen}
      >
        <IconBell size={20} stroke={1.8} />
        {unreadCount > 0 ? <span className="admin-layout__badge">{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
      </button>

      {open ? (
        <div className="admin-notification-bell__panel" role="menu">
          <div className="admin-notification-bell__header">
            <strong>Notifications</strong>
            {unreadCount > 0 ? (
              <button type="button" className="admin-notification-bell__mark-all" onClick={handleMarkAllRead}>
                <IconCheck size={14} /> Mark all as read
              </button>
            ) : null}
          </div>

          <div className="admin-notification-bell__list">
            {loading && notifications.length === 0 ? (
              <p className="admin-notification-bell__empty">Loading…</p>
            ) : notifications.length === 0 ? (
              <p className="admin-notification-bell__empty">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <button
                  type="button"
                  key={n.id}
                  className={`admin-notification-bell__item admin-notification-bell__item--${n.severity}${n.readAt ? "" : " admin-notification-bell__item--unread"}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <span className="admin-notification-bell__item-title">{n.title}</span>
                  <span className="admin-notification-bell__item-message">{n.message}</span>
                  <span className="admin-notification-bell__item-time">{timeAgo(n.createdAt)}</span>
                </button>
              ))
            )}
          </div>

          {!expanded ? (
            <button type="button" className="admin-notification-bell__view-all" onClick={handleViewAll}>
              View all notifications
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
