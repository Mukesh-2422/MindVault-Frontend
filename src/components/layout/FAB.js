import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, CheckSquare, Video, Mic, Image, FileText } from "lucide-react";

const FAB_ITEMS = [
  { icon: FileText, label: "Text Memory", type: "text" },
  { icon: Mic, label: "Voice Memory", type: "voice" },
  { icon: Image, label: "Image Memory", type: "image" },
  { icon: Video, label: "Video Memory", type: "video" },
  { icon: CheckSquare, label: "Checklist", type: "checklist" },
];

export default function FAB() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const fabRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (fabRef.current && !fabRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (type) => {
    setOpen(false);
    navigate(`/new?type=${type}`);
  };

  return (
    <div ref={fabRef}>
      {open && (
        <div className="fab-menu">
          {FAB_ITEMS.map((item) => (
            <button
              key={item.type}
              className="fab-item"
              onClick={() => handleSelect(item.type)}
              title={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <span className="fab-item-label">{item.label}</span>
              <span className="fab-item-btn">
                <item.icon size={20} strokeWidth={1.5} />
              </span>
            </button>
          ))}
        </div>
      )}
      <button
        className={`fab ${open ? "active" : ""}`}
        onClick={() => setOpen(!open)}
        title="Add Memory"
      >
        <Plus size={24} strokeWidth={2} />
      </button>
    </div>
  );
}
