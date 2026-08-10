import React from "react";
import { useNavigate } from "react-router-dom";
import { Pin } from "lucide-react";
import { formatDate, getMemoryTypeIcon, truncate } from "../../utils/helpers";
import { getMediaUrl } from "../../api/voice";

export default function MemoryCard({ memory }) {
  const navigate = useNavigate();

  if (!memory) return null;

  const typeIcon = getMemoryTypeIcon(memory.type, 20);

  const getPreview = () => {
    if (memory.type === "checklist" && memory.checklist) {
      const done = memory.checklist.filter((c) => c.done).length;
      return `${done}/${memory.checklist.length} completed`;
    }
    if (memory.type === "voice") {
      return `Voice note \u2022 ${memory.duration || "\u2014"}`;
    }
    if (memory.type === "image") {
      return memory.mediaUrl ? "Image attached" : "Image memory";
    }
    if (memory.type === "video") {
      return memory.mediaUrl ? "Video attached" : "Video memory";
    }
    return truncate(memory.content, 110);
  };

  return (
    <div
      className="memory-card"
      onClick={() => navigate(`/memory/${memory.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/memory/${memory.id}`)}
    >
      <div className="memory-card-header">
        <span className="memory-card-title">{memory.title}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {memory.pinned && (
            <span className="pin-icon" title="Pinned">
              <Pin size={14} strokeWidth={2} />
            </span>
          )}
          <span className="memory-card-type">{typeIcon}</span>
        </div>
      </div>

      {(memory.type === "image" || memory.type === "video") && (memory.mediaUrl || memory.mediaData) ? (
        <div style={{ marginBottom: 8, borderRadius: "var(--radius-sm)", overflow: "hidden", maxHeight: 120 }}>
          {memory.type === "image" ? (
            <img src={getMediaUrl(memory.mediaUrl || memory.mediaData)} alt={memory.title} style={{ width: "100%", height: 120, objectFit: "cover" }} />
          ) : (
            <video src={getMediaUrl(memory.mediaUrl || memory.mediaData)} style={{ width: "100%", height: 120, objectFit: "cover" }} />
          )}
        </div>
      ) : null}

      <p className="memory-card-content">{getPreview()}</p>

      <div className="memory-card-footer">
        <span className="memory-card-date">{formatDate(memory.date)}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {memory.tags && memory.tags.length > 0 && (
            <div className="memory-card-tags">
              {memory.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
              {memory.tags.length > 2 && (
                <span className="tag">+{memory.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
