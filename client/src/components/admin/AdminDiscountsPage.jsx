import { useState, useEffect, useCallback } from "react";
import {
  IconPlus,
  IconTrash,
  IconSearch,
  IconX,
  IconAlertCircle,
  IconUsers,
  IconSettings,
  IconEdit,
} from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import "../../styles/admin-discounts-page.css";

const EMPTY_FORM = {
  name: "",
  description: "",
  code: "",
  discountValue: "",
  isGlobal: false,
  assignedUsers: [],
};

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const handleEdit = (discount) => {
    setForm({
      name: discount.name,
      description: discount.description,
      code: discount.code,
      discountValue: String(discount.discountValue),
      isGlobal: discount.isGlobal,
      assignedUsers: discount.assignedUsers,
    });
    setError("");
    setEditId(discount.id);
    setModalOpen(true);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [discountsPayload, usersPayload] = await Promise.all([
        apiFetch("/api/admin/discounts", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/discounts/users", { headers: adminAuthHeaders() }),
      ]);
      setDiscounts(discountsPayload.discounts || []);
      setUsers(usersPayload.users || []);
    } catch (err) {
      setError(err.message || "Could not load discounts data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this discount code?")) return;
    setError("");
    try {
      await apiFetch(`/api/admin/discounts/${id}`, {
        method: "DELETE",
        headers: adminAuthHeaders(),
      });
      setDiscounts((current) => current.filter((d) => d.id !== id));
    } catch (err) {
      setError(err.message || "Could not delete discount code.");
    }
  };

  const handleToggleGlobal = () => {
    setForm((current) => ({
      ...current,
      isGlobal: !current.isGlobal,
      assignedUsers: !current.isGlobal ? [] : current.assignedUsers,
    }));
  };

  const handleAddUser = (user) => {
    if (form.assignedUsers.some((u) => u.id === user.id)) return;
    setForm((current) => ({
      ...current,
      assignedUsers: [...current.assignedUsers, user],
    }));
    setSearchQuery("");
    setSearchOpen(false);
  };

  const handleRemoveUser = (userId) => {
    setForm((current) => ({
      ...current,
      assignedUsers: current.assignedUsers.filter((u) => u.id !== userId),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitLoading(true);

    try {
      const method = editId ? "PUT" : "POST";
      const endpoint = editId ? `/api/admin/discounts/${editId}` : "/api/admin/discounts";
      
      await apiFetch(endpoint, {
        method,
        headers: adminAuthHeaders(),
        body: JSON.stringify({
          ...form,
          assignedUsers: form.assignedUsers.map((u) => u.id),
        }),
      });

      setForm(EMPTY_FORM);
      setEditId(null);
      setModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to save discount code.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return false;
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout
      pageTitle="Discount Codes"
      pageSubtitle="Manage personalized promotions and global discount vouchers."
    >
      <div className="admin-discounts">
        <div className="admin-discounts__header-actions">
          <button
            type="button"
            className="admin-broadcast__primary-btn"
            onClick={() => {
              setForm(EMPTY_FORM);
              setError("");
              setEditId(null);
              setModalOpen(true);
            }}
          >
            <IconPlus size={18} aria-hidden />
            Generate Discount Code
          </button>
        </div>

        {error ? (
          <div className="admin-upload-error-alert" style={{ margin: 0 }}>
            <IconAlertCircle size={18} />
            <span>{error}</span>
          </div>
        ) : null}

        {loading ? (
          <p className="admin-broadcast__status">Loading discount codes…</p>
        ) : discounts.length === 0 ? (
          <p className="admin-broadcast__status">No discount codes generated yet.</p>
        ) : (
          <div className="admin-discounts__grid">
            {discounts.map((discount) => (
              <article key={discount.id} className="admin-discounts__card">
                <div className="admin-discounts__badge-value">
                  <span>{discount.discountValue}%</span>
                  <small>off</small>
                </div>
                <div className="admin-discounts__info">
                  <h3>
                    {discount.name}
                    <span className="admin-discounts__code-badge">{discount.code}</span>
                  </h3>
                  <p className="admin-discounts__desc">{discount.description}</p>
                  <p className="admin-discounts__target">
                    {discount.isGlobal ? (
                      <span className="admin-discounts__global-badge">Available to All Users</span>
                    ) : (
                      <>
                        <IconUsers size={14} style={{ color: "var(--ad-purple)" }} />
                        <strong>Assigned Users ({discount.assignedUsers.length}):</strong>
                        {discount.assignedUsers.map((u) => (
                          <span key={u.id} className="admin-discounts__target-user" title={u.email}>
                            {u.firstName} {u.lastName} ({u.email})
                          </span>
                        ))}
                        {discount.assignedUsers.length === 0 && (
                          <span style={{ fontStyle: "italic", color: "var(--ad-muted)" }}>
                            None assigned (visible to no one)
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>
                <div className="admin-discounts__actions">
                  <button
                    type="button"
                    className="admin-discounts__delete-btn"
                    style={{ border: "1px solid var(--ad-border)", color: "var(--ad-text)", marginRight: "8px" }}
                    onClick={() => handleEdit(discount)}
                    aria-label="Edit discount code"
                  >
                    <IconEdit size={18} />
                  </button>
                  <button
                    type="button"
                    className="admin-discounts__delete-btn"
                    onClick={() => handleDelete(discount.id)}
                    aria-label="Delete discount code"
                  >
                    <IconTrash size={18} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {modalOpen ? (
        <div className="admin-broadcast-modal" role="dialog" aria-modal="true" aria-labelledby="generate-discount-title">
          <div className="admin-broadcast-modal__panel">
            <div className="admin-broadcast-modal__head">
              <h2 id="generate-discount-title">{editId ? "Edit Discount Code" : "Generate Discount Code"}</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form className="admin-broadcast-modal__body" onSubmit={handleSubmit}>
              <label>
                Code (alphanumeric, unique)
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER20"
                  value={form.code}
                  onChange={(e) => setForm((c) => ({ ...c, code: e.target.value.replace(/\s/g, "") }))}
                  maxLength={40}
                  disabled={submitLoading}
                />
              </label>

              <label>
                Internal Name (friendly name)
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Summer Kickoff 20% Off"
                  value={form.name}
                  onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                  maxLength={160}
                  disabled={submitLoading}
                />
              </label>

              <label>
                Customer Description
                <input
                  type="text"
                  required
                  placeholder="e.g. Get 20% off all footwear until the end of July!"
                  value={form.description}
                  onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                  maxLength={500}
                  disabled={submitLoading}
                />
              </label>

              <label>
                Discount Percentage (%)
                <input
                  type="number"
                  required
                  placeholder="20"
                  min="1"
                  max="100"
                  value={form.discountValue}
                  onChange={(e) => setForm((c) => ({ ...c, discountValue: e.target.value }))}
                  disabled={submitLoading}
                />
              </label>

              <div className="admin-discounts__toggle-container" onClick={handleToggleGlobal}>
                <div
                  className={`admin-discounts__toggle${
                    form.isGlobal ? " admin-discounts__toggle--active" : ""
                  }`}
                >
                  <div className="admin-discounts__toggle-handle" />
                </div>
                <span className="admin-upload-label" style={{ cursor: "pointer" }}>
                  Available to All Users (Global)
                </span>
              </div>

              {!form.isGlobal ? (
                <div className="admin-discounts__user-search">
                  <span className="admin-upload-label">Assign to Users</span>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder="Type name or email to search..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSearchOpen(true);
                      }}
                      onFocus={() => setSearchOpen(true)}
                    />
                    <IconSearch
                      size={18}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--ad-muted)",
                      }}
                    />
                  </div>

                  {searchOpen && filteredUsers.length > 0 ? (
                    <div className="admin-discounts__user-dropdown">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className="admin-discounts__user-option"
                          onClick={() => handleAddUser(user)}
                        >
                          <span>
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="admin-discounts__user-option-email">{user.email}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="admin-discounts__selected-users">
                    {form.assignedUsers.map((user) => (
                      <span key={user.id} className="admin-discounts__selected-user-tag">
                        <span>
                          {user.firstName} {user.lastName} ({user.email})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(user.id)}
                          aria-label={`Remove ${user.firstName}`}
                        >
                          <IconX size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="admin-broadcast-modal__actions">
                <button
                  type="button"
                  className="admin-broadcast__ghost-btn"
                  onClick={() => setModalOpen(false)}
                  disabled={submitLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-broadcast__primary-btn"
                  disabled={submitLoading}
                >
                  Save Discount Code
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
