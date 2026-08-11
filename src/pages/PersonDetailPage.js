import React from "react";
import { useParams } from "react-router-dom";
import TopNav from "../components/layout/TopNav";
import MemoryCard from "../components/memory/MemoryCard";
import { useApp } from "../context/AppContext";
import { getInitials, formatDate } from "../utils/helpers";
import { useAppBackNavigation } from "../utils/useAppBackNavigation";
import { ArrowLeft, Phone, Mail, Cake, Clock, FileText } from "lucide-react";
import "../styles/global.css";
import "../styles/pages.css";

export default function PersonDetailPage() {
  const { id } = useParams();
  const { state } = useApp();
  const goBack = useAppBackNavigation("/people");

  const person = state.people.find((p) => p.id === id);

  if (!person) {
    return (
      <div className="app">
        <TopNav />
        <div className="main-content">
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={48} strokeWidth={1.5} />
            </div>
            <p className="empty-state-title">Person not found</p>
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 16 }}
              onClick={goBack}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const relatedMemories = state.memories.filter(
    (m) =>
      !m.deleted &&
      (person.relatedMemoryIds.includes(m.id) ||
        m.relatedPerson === person.name)
  );

  const birthday = person.birthday
    ? new Date(person.birthday).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="app">
      <TopNav />
      <div className="main-content person-detail-page">
        <div style={{ paddingTop: 16 }}>
          <button className="back-btn" onClick={goBack} aria-label="Go back">
            <ArrowLeft size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="person-detail-header">
          <div className="person-detail-avatar">
            {getInitials(person.name)}
          </div>
          <h1 className="person-detail-name">{person.name}</h1>
          {person.notes && (
            <p className="person-detail-note">{person.notes}</p>
          )}
        </div>

        <div className="person-info-card">
          {person.phone && (
            <div className="person-info-row">
              <Phone size={18} strokeWidth={1.5} />
              <div>
                <p className="person-info-label">Phone</p>
                <p className="person-info-value">{person.phone}</p>
              </div>
            </div>
          )}
          {person.email && (
            <div className="person-info-row">
              <Mail size={18} strokeWidth={1.5} />
              <div>
                <p className="person-info-label">Email</p>
                <p className="person-info-value">{person.email}</p>
              </div>
            </div>
          )}
          {birthday && (
            <div className="person-info-row">
              <Cake size={18} strokeWidth={1.5} />
              <div>
                <p className="person-info-label">Birthday</p>
                <p className="person-info-value">{birthday}</p>
              </div>
            </div>
          )}
          <div className="person-info-row">
            <Clock size={18} strokeWidth={1.5} />
            <div>
              <p className="person-info-label">Last Interaction</p>
              <p className="person-info-value">
                {formatDate(person.lastInteraction)}
              </p>
            </div>
          </div>
        </div>

        {relatedMemories.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <p className="section-label">Related Memories</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {relatedMemories.map((m) => (
                <MemoryCard key={m.id} memory={m} />
              ))}
            </div>
          </div>
        )}

        {relatedMemories.length === 0 && (
          <div className="empty-state" style={{ paddingTop: 32 }}>
            <div className="empty-state-icon">
              <FileText size={48} strokeWidth={1.5} />
            </div>
            <p className="empty-state-title">No memories yet</p>
            <p className="empty-state-text">
              Add memories mentioning {person.name} and they'll appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
