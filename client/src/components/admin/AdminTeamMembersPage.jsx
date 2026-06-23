import { useCallback, useEffect, useRef, useState } from "react";
import { IconGripVertical, IconPencil, IconTrash } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";

const EMPTY_FORM = {
  fullName: "",
  role: "",
  designation: "",
  teamCategory: "",
  biography: "",
  linkedinUrl: "",
  email: "",
  yearsWithVoice: "",
  featured: false,
  isBoardMember: false,
  visible: true,
};

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdminTeamMembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState("");
  const [dragId, setDragId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const reorderTimer = useRef(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/admin/team-members", { headers: adminAuthHeaders() });
      setMembers(data.members || []);
    } catch (err) {
      setError(err.message || "Could not load team members.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  function openCreate() {
    setEditing("new");
    setForm(EMPTY_FORM);
  }

  function openEdit(member) {
    setEditing(member.id);
    setForm({
      fullName: member.fullName || member.name || "",
      role: member.role || "",
      designation: member.designation || "",
      teamCategory: member.teamCategory || "",
      biography: member.biography || "",
      linkedinUrl: member.linkedinUrl || "",
      email: member.email || "",
      yearsWithVoice: member.yearsWithVoice || "",
      featured: Boolean(member.featured),
      isBoardMember: Boolean(member.isBoardMember),
      visible: member.visible !== false,
    });
  }

  function closeEditor() {
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  async function saveMember(event) {
    event.preventDefault();
    setSavingId(editing);
    setError("");
    try {
      if (editing === "new") {
        await apiFetch("/api/admin/team-members", {
          method: "POST",
          headers: adminAuthHeaders(),
          body: JSON.stringify(form),
        });
        setMessage("Team member added.");
      } else {
        await apiFetch(`/api/admin/team-members/${editing}`, {
          method: "PATCH",
          headers: adminAuthHeaders(),
          body: JSON.stringify(form),
        });
        setMessage("Team member updated.");
      }
      closeEditor();
      await loadMembers();
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setSavingId("");
    }
  }

  async function deleteMember(id) {
    if (!window.confirm("Delete this team member?")) return;
    setSavingId(id);
    setError("");
    try {
      await apiFetch(`/api/admin/team-members/${id}`, { method: "DELETE", headers: adminAuthHeaders() });
      setMessage("Team member deleted.");
      await loadMembers();
    } catch (err) {
      setError(err.message || "Delete failed.");
    } finally {
      setSavingId("");
    }
  }

  async function persistOrder(nextMembers) {
    setMembers(nextMembers);
    window.clearTimeout(reorderTimer.current);
    reorderTimer.current = window.setTimeout(async () => {
      try {
        await apiFetch("/api/admin/team-members/reorder", {
          method: "POST",
          headers: adminAuthHeaders(),
          body: JSON.stringify({ order: nextMembers.map((m) => m.id) }),
        });
        setMessage("Order saved.");
      } catch (err) {
        setError(err.message || "Could not save order.");
        await loadMembers();
      }
    }, 400);
  }

  function handleDragStart(id) {
    setDragId(id);
  }

  function handleDrop(targetId) {
    if (!dragId || dragId === targetId) return;
    const ids = members.map((m) => m.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return;
    const next = [...members];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    persistOrder(next);
    setDragId(null);
  }

  async function handlePhotoUpload(id, file) {
    if (!file) return;
    setSavingId(id);
    setError("");
    try {
      const imageUrl = await readFileAsDataUrl(file);
      await apiFetch(`/api/admin/team-members/${id}/upload-photo`, {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ imageUrl }),
      });
      setMessage("Photo updated.");
      await loadMembers();
    } catch (err) {
      setError(err.message || "Photo upload failed.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <AdminLayout pageTitle="Team Members" pageSubtitle="Manage the About Us team carousel — order, bios and photos">
      <section className="admin-events__card">
        <div className="admin-events__form-actions">
          <button type="button" onClick={openCreate}>Add Team Member</button>
        </div>
      </section>

      {loading ? <p className="admin-events__hint">Loading team members…</p> : null}
      {error ? <p className="admin-events__error" role="alert">{error}</p> : null}
      {message ? <p className="admin-events__hint">{message}</p> : null}

      {editing ? (
        <section className="admin-events__card">
          <h3>{editing === "new" ? "Add Team Member" : "Edit Team Member"}</h3>
          <form className="admin-events__form-grid" onSubmit={saveMember}>
            <label>
              Full name
              <input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required />
            </label>
            <label>
              Role / Position
              <input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
            </label>
            <label>
              Designation badge
              <input value={form.designation} onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))} />
            </label>
            <label>
              Team category
              <input value={form.teamCategory} onChange={(e) => setForm((f) => ({ ...f, teamCategory: e.target.value }))} />
            </label>
            <label>
              LinkedIn URL
              <input value={form.linkedinUrl} onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))} />
            </label>
            <label>
              Email
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </label>
            <label>
              Years with V.O.I.C.E. NL
              <input value={form.yearsWithVoice} onChange={(e) => setForm((f) => ({ ...f, yearsWithVoice: e.target.value }))} placeholder="e.g. Since 2022" />
            </label>
            <label className="admin-events__checkbox">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
              Featured
            </label>
            <label className="admin-events__checkbox">
              <input type="checkbox" checked={form.isBoardMember} onChange={(e) => setForm((f) => ({ ...f, isBoardMember: e.target.checked }))} />
              Board member
            </label>
            <label className="admin-events__checkbox">
              <input type="checkbox" checked={form.visible} onChange={(e) => setForm((f) => ({ ...f, visible: e.target.checked }))} />
              Visible on public page
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Biography
              <textarea rows={5} value={form.biography} onChange={(e) => setForm((f) => ({ ...f, biography: e.target.value }))} />
            </label>
            <div className="admin-events__form-actions" style={{ gridColumn: "1 / -1" }}>
              <button type="submit" disabled={Boolean(savingId)}>Save</button>
              <button type="button" onClick={closeEditor}>Cancel</button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="admin-events__card">
        <p className="admin-events__hint">Drag rows to reorder. Order is saved automatically.</p>
        <div className="admin-cms__section-list">
          {members.map((member) => (
            <div
              key={member.id}
              className={`admin-cms__section-item${member.visible === false ? " admin-cms__section-item--hidden" : ""}`}
              draggable
              onDragStart={() => handleDragStart(member.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(member.id)}
            >
              <div className="admin-cms__section-item-main">
                <IconGripVertical size={16} className="admin-cms__drag-handle" />
                <div className="admin-cms__section-item-info">
                  <strong>{member.displayOrder}. {member.fullName || member.name}</strong>
                  <span>{member.role}{member.isBoardMember ? " · Board" : ""}{member.featured ? " · Featured" : ""}</span>
                </div>
              </div>
              <div className="admin-cms__section-item-actions">
                <label title="Upload photo">
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    disabled={savingId === member.id}
                    onChange={(e) => handlePhotoUpload(member.id, e.target.files?.[0])}
                  />
                  Photo
                </label>
                <button type="button" title="Edit" onClick={() => openEdit(member)}>
                  <IconPencil size={16} />
                </button>
                <button type="button" title="Delete" disabled={savingId === member.id} onClick={() => deleteMember(member.id)}>
                  <IconTrash size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {!loading && !members.length ? <p className="admin-events__hint">No team members yet.</p> : null}
      </section>
    </AdminLayout>
  );
}
