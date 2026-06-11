import { useState, useEffect, useCallback } from "react";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconUser,
  IconMail,
  IconPhone,
  IconAlertCircle,
  IconBrandGoogle,
  IconCircleCheck,
  IconHourglassLow,
} from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import "../../styles/admin-users-page.css";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  authProvider: "Email",
  isVerified: true,
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const endpoint = searchQuery.trim()
        ? `/api/admin/users?search=${encodeURIComponent(searchQuery.trim())}`
        : "/api/admin/users";
      const payload = await apiFetch(endpoint, { headers: adminAuthHeaders() });
      setUsers(payload.users || []);
    } catch (err) {
      setError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleEdit = (user) => {
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || "",
      authProvider: user.authProvider,
      isVerified: user.isVerified,
    });
    setError("");
    setEditId(user.id);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitLoading(true);

    try {
      const method = editId ? "PUT" : "POST";
      const endpoint = editId ? `/api/admin/users/${editId}` : "/api/admin/users";

      await apiFetch(endpoint, {
        method,
        headers: adminAuthHeaders(),
        body: JSON.stringify(form),
      });

      setForm(EMPTY_FORM);
      setEditId(null);
      setModalOpen(false);
      await loadUsers();
    } catch (err) {
      setError(err.message || "Failed to save user.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCloseModal = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setModalOpen(false);
  };

  return (
    <AdminLayout
      pageTitle="User Management"
      pageSubtitle="Create, search, and update users registered in the system."
    >
      <div className="admin-users">
        <div className="admin-users__header-actions">
          <div className="admin-users__search">
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <IconSearch size={18} className="admin-users__search-icon" />
          </div>

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
            Create User
          </button>
        </div>

        {error ? (
          <div className="admin-upload-error-alert" style={{ marginBottom: "20px" }}>
            <IconAlertCircle size={18} />
            <span>{error}</span>
          </div>
        ) : null}

        {loading ? (
          <p className="admin-broadcast__status">Loading users list…</p>
        ) : users.length === 0 ? (
          <p className="admin-broadcast__status">No users found matching query.</p>
        ) : (
          <div className="admin-users__table-container">
            <table className="admin-users__table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email Address</th>
                  <th>Phone Number</th>
                  <th>Auth Provider</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-users__user-profile">
                        <div className="admin-users__avatar">
                          {user.firstName[0]}
                          {user.lastName[0]}
                        </div>
                        <div>
                          <p className="admin-users__user-name">
                            {user.firstName} {user.lastName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="admin-users__email">
                        <IconMail size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                        {user.email}
                      </span>
                    </td>
                    <td>
                      {user.phone ? (
                        <span className="admin-users__phone">
                          <IconPhone size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                          {user.phone}
                        </span>
                      ) : (
                        <span className="admin-users__muted-text">—</span>
                      )}
                    </td>
                    <td>
                      {user.authProvider === "Google" ? (
                        <span className="admin-users__badge-google">
                          <IconBrandGoogle size={12} style={{ marginRight: "4px" }} />
                          Google
                        </span>
                      ) : (
                        <span className="admin-users__badge-email">Email</span>
                      )}
                    </td>
                    <td>
                      {user.isVerified ? (
                        <span className="admin-users__status-verified">
                          <IconCircleCheck size={14} style={{ marginRight: "4px" }} />
                          Verified
                        </span>
                      ) : (
                        <span className="admin-users__status-pending">
                          <IconHourglassLow size={14} style={{ marginRight: "4px" }} />
                          Pending
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="admin-users__date">
                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-users__edit-btn"
                        onClick={() => handleEdit(user)}
                        aria-label="Edit user"
                      >
                        <IconEdit size={16} />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen ? (
        <div className="admin-broadcast-modal" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
          <div className="admin-broadcast-modal__panel">
            <div className="admin-broadcast-modal__head">
              <h2 id="user-modal-title">{editId ? "Edit User Details" : "Create New User"}</h2>
              <button
                type="button"
                onClick={handleCloseModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form className="admin-broadcast-modal__body" onSubmit={handleSubmit}>
              <div className="admin-users__form-grid">
                <label>
                  First Name
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gaaa"
                    value={form.firstName}
                    onChange={(e) => setForm((c) => ({ ...c, firstName: e.target.value }))}
                    maxLength={80}
                    disabled={submitLoading}
                  />
                </label>

                <label>
                  Last Name
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kolr"
                    value={form.lastName}
                    onChange={(e) => setForm((c) => ({ ...c, lastName: e.target.value }))}
                    maxLength={80}
                    disabled={submitLoading}
                  />
                </label>
              </div>

              <label>
                Email Address
                <input
                  type="email"
                  required
                  placeholder="e.g. kk@gmail.com"
                  value={form.email}
                  onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                  maxLength={120}
                  disabled={submitLoading}
                />
              </label>

              <label>
                Phone Number (optional)
                <input
                  type="text"
                  placeholder="e.g. 9307000009"
                  value={form.phone}
                  onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
                  maxLength={40}
                  disabled={submitLoading}
                />
              </label>

              <label>
                Authentication Provider
                <select
                  value={form.authProvider}
                  onChange={(e) => setForm((c) => ({ ...c, authProvider: e.target.value }))}
                  disabled={submitLoading}
                  className="admin-users__select"
                >
                  <option value="Email">Email</option>
                  <option value="Google">Google</option>
                </select>
              </label>

              <div className="admin-discounts__toggle-container" onClick={() => setForm((c) => ({ ...c, isVerified: !c.isVerified }))}>
                <div
                  className={`admin-discounts__toggle${
                    form.isVerified ? " admin-discounts__toggle--active" : ""
                  }`}
                >
                  <div className="admin-discounts__toggle-handle" />
                </div>
                <span className="admin-upload-label" style={{ cursor: "pointer" }}>
                  Account Verified (Allows direct sign-in)
                </span>
              </div>

              <div className="admin-broadcast-modal__actions">
                <button
                  type="button"
                  className="admin-broadcast__ghost-btn"
                  onClick={handleCloseModal}
                  disabled={submitLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-broadcast__primary-btn"
                  disabled={submitLoading}
                >
                  Save User Record
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
