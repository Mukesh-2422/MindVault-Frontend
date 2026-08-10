import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopNav from "../components/layout/TopNav";
import FAB from "../components/layout/FAB";
import { useApp } from "../context/AppContext";
import { getInitials, formatDate } from "../utils/helpers";
import { Users, Search, ChevronRight, ArrowLeft, Plus } from "lucide-react";
import "../styles/global.css";
import "../styles/pages.css";

export default function PeoplePage() {
  const navigate = useNavigate();
  const { state } = useApp();
  const [search, setSearch] = useState("");

  const filtered = state.people.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="app">
      <TopNav />
      <div className="main-content people-page">
        <div className="page-header-row">
          <button className="back-btn" onClick={() => navigate("/home")}>
            <ArrowLeft size={16} strokeWidth={1.5} />
          </button>
          <div className="people-search">
            <Search size={16} strokeWidth={1.5} />
            <input
              className="people-search-input"
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="section-header">
          <h1 className="people-title">
            <Users size={22} strokeWidth={1.5} />
            People
          </h1>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Users size={48} strokeWidth={1.5} />
            </div>
            <p className="empty-state-title">No people found</p>
            <p className="empty-state-text">
              Add people to remember your connections.
            </p>
          </div>
        ) : (
          <div className="people-grid">
            {filtered.map((person) => (
              <div
                key={person.id}
                className="person-card"
                onClick={() => navigate(`/people/${person.id}`)}
              >
                <div className="person-avatar">
                  {getInitials(person.name)}
                </div>
                <div className="person-info">
                  <p className="person-name">{person.name}</p>
                  <p className="person-last-seen">
                    {person.lastInteraction ? formatDate(person.lastInteraction) : "No interaction"}
                  </p>
                  {person.relatedMemoryIds?.length > 0 && (
                    <p className="person-memories-count">
                      {person.relatedMemoryIds.length} memory
                      {person.relatedMemoryIds.length !== 1 ? "ies" : "y"}
                    </p>
                  )}
                </div>
                <span className="person-card-arrow">
                  <ChevronRight size={18} strokeWidth={1.5} />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <FAB />
    </div>
  );
}
