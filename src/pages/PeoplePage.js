import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopNav from "../components/layout/TopNav";
import PersonModal from "../components/people/PersonModal";
import { useApp } from "../context/AppContext";
import { getInitials } from "../utils/helpers";
import { useAppBackNavigation } from "../utils/useAppBackNavigation";
import { deletePerson } from "../api/people";
import {
  Users,
  Search,
  Plus,
  ArrowLeft,
  Cake,
  Edit2,
  Trash2,
  Tag,
  Phone,
  Mail,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import "../styles/global.css";
import "../styles/pages.css";

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
  "linear-gradient(135deg, #10B981 0%, #047857 100%)",
  "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
  "linear-gradient(135deg, #F59E0B 0%, #B45309 100%)",
  "linear-gradient(135deg, #EC4899 0%, #BE185D 100%)",
  "linear-gradient(135deg, #06B6D4 0%, #0E7490 100%)",
  "linear-gradient(135deg, #6366F1 0%, #4338CA 100%)",
];

function getAvatarBackground(name) {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

function formatBirthdayDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function PeoplePage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const goBack = useAppBackNavigation("/home");

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const peopleList = state.people || [];

  const filtered = peopleList.filter((p) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.relationship && p.relationship.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.phone && p.phone.toLowerCase().includes(q))
    );
  });

  const handleOpenAdd = () => {
    setEditingPerson(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (e, person) => {
    e.stopPropagation();
    setEditingPerson(person);
    setModalOpen(true);
  };

  const handleDeleteClick = (e, personId) => {
    e.stopPropagation();
    setDeleteConfirmId(personId);
  };

  const confirmDelete = async (e) => {
    e.stopPropagation();
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      await deletePerson(deleteConfirmId);
      dispatch({ type: "DELETE_PERSON", payload: deleteConfirmId });
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Failed to delete person:", err);
      alert("Failed to delete person. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="app">
      <TopNav />
      <div className="main-content people-page">
        {/* Header Navigation & Search Bar */}
        <div className="page-header-row people-header-row">
          <button className="back-btn" onClick={goBack} aria-label="Go back">
            <ArrowLeft size={16} strokeWidth={1.5} />
          </button>

          <div className="people-search-container">
            <Search size={16} className="search-icon" />
            <input
              className="people-search-input"
              placeholder="Search by name, relationship, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <button
            type="button"
            className="btn btn-primary add-person-btn"
            onClick={handleOpenAdd}
          >
            <Plus size={16} strokeWidth={2} />
            <span>Add Person</span>
          </button>
        </div>

        {/* Section Heading & Counter */}
        <div className="people-section-header">
          <div className="people-title-group">
            <div className="people-title-icon-badge">
              <Users size={20} strokeWidth={1.75} />
            </div>
            <h1 className="people-title">People & Connections</h1>
            <span className="people-count-pill">{peopleList.length}</span>
          </div>
        </div>

        {/* Delete Confirmation Modal / Banner */}
        {deleteConfirmId && (
          <div className="delete-confirm-banner">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Trash2 size={18} style={{ color: "#EF4444" }} />
              <span>Are you sure you want to delete this person?</span>
            </div>
            <div className="delete-confirm-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        )}

        {/* People Grid or Empty State */}
        {filtered.length === 0 ? (
          <div className="empty-state people-empty-state">
            <div className="empty-state-icon">
              <Users size={48} strokeWidth={1.5} />
            </div>
            <p className="empty-state-title">
              {search ? "No matching people found" : "No people saved yet"}
            </p>
            <p className="empty-state-text">
              {search
                ? `No people matched "${search}". Try searching for another name or relationship.`
                : "Add friends, colleagues, mentors, or family members to remember important facts, notes, and milestones."}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 18 }}
              onClick={handleOpenAdd}
            >
              <Plus size={16} strokeWidth={2} />
              <span>Add Your First Person</span>
            </button>
          </div>
        ) : (
          <div className="people-cards-grid">
            {filtered.map((person) => {
              const bg = getAvatarBackground(person.name);
              const birthdayFormatted = formatBirthdayDate(person.birthday);
              const relationshipTag = person.relationship || "Contact";

              return (
                <div
                  key={person.id}
                  className="person-profile-card"
                  onClick={() => navigate(`/people/${person.id}`)}
                >
                  {/* Top Row: Avatar, Name & Actions */}
                  <div className="person-card-top">
                    <div
                      className="person-avatar-circle"
                      style={{ background: bg }}
                    >
                      {getInitials(person.name)}
                    </div>

                    <div className="person-header-details">
                      <h3 className="person-card-fullname">{person.name}</h3>
                      <span className="person-relationship-tag">
                        <Tag size={11} strokeWidth={1.75} />
                        <span>{relationshipTag}</span>
                      </span>
                    </div>

                    {/* Action Triggers */}
                    <div className="person-card-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="person-action-btn edit-btn"
                        onClick={(e) => handleOpenEdit(e, person)}
                        title="Edit person"
                        aria-label={`Edit ${person.name}`}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="person-action-btn delete-btn"
                        onClick={(e) => handleDeleteClick(e, person.id)}
                        title="Delete person"
                        aria-label={`Delete ${person.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Notes / Details Preview */}
                  <div className="person-card-notes-preview">
                    {person.notes ? (
                      <p className="person-notes-text">{person.notes}</p>
                    ) : (
                      <p className="person-notes-empty">No notes recorded yet</p>
                    )}
                  </div>

                  {/* Bottom Row / Badges */}
                  <div className="person-card-footer">
                    <div className="person-footer-badges">
                      {birthdayFormatted && (
                        <span className="person-pill-badge birthday-badge">
                          <Cake size={12} strokeWidth={2} />
                          <span>{birthdayFormatted}</span>
                        </span>
                      )}

                      {person.relatedMemoryIds?.length > 0 && (
                        <span className="person-pill-badge memories-badge">
                          <Sparkles size={11} />
                          <span>
                            {person.relatedMemoryIds.length} memor
                            {person.relatedMemoryIds.length === 1 ? "y" : "ies"}
                          </span>
                        </span>
                      )}

                      {person.phone && (
                        <span className="person-pill-badge contact-badge" title={person.phone}>
                          <Phone size={11} />
                          <span>{person.phone}</span>
                        </span>
                      )}
                    </div>

                    <span className="person-card-detail-link">
                      <ChevronRight size={16} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Person Modal */}
      <PersonModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        person={editingPerson}
      />
    </div>
  );
}
