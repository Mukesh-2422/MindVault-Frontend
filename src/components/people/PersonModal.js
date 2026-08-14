import React, { useState, useEffect } from "react";
import { X, User, Tag, FileText, Cake, Phone, Mail, AlertCircle } from "lucide-react";
import { createPerson, updatePerson } from "../../api/people";
import { useApp } from "../../context/AppContext";

const RELATIONSHIP_PRESETS = [
  "Friend",
  "Colleague",
  "Family",
  "Mentor",
  "Client",
  "Partner",
  "Manager",
  "Acquaintance",
];

export default function PersonModal({ isOpen, onClose, person = null, onSaved }) {
  const { dispatch } = useApp();
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("Friend");
  const [customRelationship, setCustomRelationship] = useState("");
  const [notes, setNotes] = useState("");
  const [birthday, setBirthday] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isCustomRel, setIsCustomRel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (person) {
        setName(person.name || "");
        const rel = person.relationship || "Friend";
        if (RELATIONSHIP_PRESETS.includes(rel)) {
          setRelationship(rel);
          setIsCustomRel(false);
          setCustomRelationship("");
        } else {
          setRelationship("Other");
          setIsCustomRel(true);
          setCustomRelationship(rel);
        }
        setNotes(person.notes || "");
        setBirthday(person.birthday ? person.birthday.substring(0, 10) : "");
        setPhone(person.phone || "");
        setEmail(person.email || "");
      } else {
        setName("");
        setRelationship("Friend");
        setIsCustomRel(false);
        setCustomRelationship("");
        setNotes("");
        setBirthday("");
        setPhone("");
        setEmail("");
      }
      setError("");
    }
  }, [isOpen, person]);

  if (!isOpen) return null;

  const handleRelationshipSelect = (preset) => {
    setRelationship(preset);
    setIsCustomRel(false);
    setCustomRelationship("");
  };

  const handleCustomRelClick = () => {
    setIsCustomRel(true);
    setRelationship("Other");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Full name is required");
      return;
    }

    setLoading(true);
    setError("");

    const finalRelationship = isCustomRel
      ? customRelationship.trim() || "Contact"
      : relationship;

    const payload = {
      name: name.trim(),
      relationship: finalRelationship,
      notes: notes.trim(),
      birthday: birthday || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
    };

    try {
      if (person && person.id) {
        const updated = await updatePerson(person.id, payload);
        dispatch({ type: "UPDATE_PERSON", payload: updated });
        if (onSaved) onSaved(updated);
      } else {
        const created = await createPerson(payload);
        dispatch({ type: "ADD_PERSON", payload: created });
        if (onSaved) onSaved(created);
      }
      onClose();
    } catch (err) {
      console.error("Failed to save person:", err);
      setError(err?.response?.data?.error || err.message || "Failed to save person. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content person-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="person-modal-title"
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="modal-icon-badge">
              <User size={18} strokeWidth={2} />
            </div>
            <h2 id="person-modal-title" className="modal-title">
              {person ? "Edit Person" : "Add Person"}
            </h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="person-modal-form">
          {error && (
            <div className="form-error-banner">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name (Required) */}
          <div className="form-group">
            <label className="form-label" htmlFor="person-name">
              Full Name <span className="required-star">*</span>
            </label>
            <div className="input-with-icon">
              <User size={16} className="input-icon" />
              <input
                id="person-name"
                type="text"
                className="form-input"
                placeholder="e.g. Sarah Jenkins"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          {/* Relationship / Tag */}
          <div className="form-group">
            <label className="form-label">Relationship / Tag</label>
            <div className="relationship-chips-container">
              {RELATIONSHIP_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`relationship-chip ${!isCustomRel && relationship === preset ? "active" : ""}`}
                  onClick={() => handleRelationshipSelect(preset)}
                >
                  {preset}
                </button>
              ))}
              <button
                type="button"
                className={`relationship-chip ${isCustomRel ? "active" : ""}`}
                onClick={handleCustomRelClick}
              >
                Custom...
              </button>
            </div>
            {isCustomRel && (
              <div className="input-with-icon" style={{ marginTop: 8 }}>
                <Tag size={15} className="input-icon" />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter custom relationship (e.g. Gym Buddy, Investor)"
                  value={customRelationship}
                  onChange={(e) => setCustomRelationship(e.target.value)}
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Important Details & Notes */}
          <div className="form-group">
            <label className="form-label" htmlFor="person-notes">
              Important Details & Notes
            </label>
            <div className="textarea-with-icon">
              <textarea
                id="person-notes"
                className="form-textarea"
                rows={4}
                placeholder="Add key details, likes, dislikes, birthday, projects, or things to remember..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Birthday / Important Date */}
          <div className="form-row-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="person-birthday">
                Birthday / Important Date
              </label>
              <div className="input-with-icon">
                <Cake size={16} className="input-icon" />
                <input
                  id="person-birthday"
                  type="date"
                  className="form-input"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
              </div>
            </div>

            {/* Phone (Optional) */}
            <div className="form-group">
              <label className="form-label" htmlFor="person-phone">
                Phone (Optional)
              </label>
              <div className="input-with-icon">
                <Phone size={16} className="input-icon" />
                <input
                  id="person-phone"
                  type="tel"
                  className="form-input"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Email (Optional) */}
          <div className="form-group">
            <label className="form-label" htmlFor="person-email">
              Email Address (Optional)
            </label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                id="person-email"
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !name.trim()}
            >
              {loading ? "Saving..." : person ? "Save Changes" : "Save Person"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
