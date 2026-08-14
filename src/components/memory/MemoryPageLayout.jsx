import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, MoreHorizontal, Pin, Save } from "lucide-react";
import { getMemoryTypeIcon } from "../../utils/helpers";

/**
 * Shared page layout for every memory type (create / view / edit).
 *
 * This is the single source of truth for the memory-page chrome. The nav
 * structure never changes between memory types — only the memory-type icon
 * (rendered in the center) and the content rendered inside `children` do.
 *
 * Layout:
 *   [ Back ]   <memory-type icon>   [ More ⋯ ] [ Pin ] [ Cancel ] [ Save ]
 *
 *   ─────────────────────────────────────────
 *   <children />        (title, metadata, type-specific content)
 *   ─────────────────────────────────────────
 *   [ bottomToolbar ]   (optional, e.g. the type switcher)
 */
export default function MemoryPageLayout({
  type = "text",
  onBack,
  headerCenter,
  moreItems = [],
  pinned = false,
  onPin,
  showSave = true,
  onSave,
  saving = false,
  saveLabel = "Save",
  bottomToolbar,
  children,
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const centerNode = headerCenter ?? (
    <span style={{ display: "flex" }}>{getMemoryTypeIcon(type, 20)}</span>
  );

  return (
    <div className="new-memory-page">
      <nav className="memory-editor-nav">
        <div className="editor-nav-left">
          <button className="editor-nav-btn" onClick={onBack} aria-label="Go back">
            <ArrowLeft size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="editor-nav-center">{centerNode}</div>

        <div className="editor-nav-right">
          {moreItems.length > 0 && (
            <div style={{ position: "relative" }} ref={moreRef}>
              <button
                className="editor-nav-btn"
                onClick={() => setMoreOpen(!moreOpen)}
                aria-label="More options"
                aria-expanded={moreOpen}
              >
                <MoreHorizontal size={16} strokeWidth={1.5} />
              </button>
              {moreOpen && (
                <div
                  className="dropdown-menu"
                  style={{ right: 0, top: "calc(100% + 4px)", minWidth: 200 }}
                >
                  {moreItems.map((item, i) =>
                    item.divider ? (
                      <div className="dropdown-divider" key={`div-${i}`} />
                    ) : (
                      <button
                        key={item.label || i}
                        className={`dropdown-item${item.danger ? " danger" : ""}`}
                        disabled={item.disabled}
                        onClick={() => {
                          setMoreOpen(false);
                          if (item.onClick) item.onClick();
                        }}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {onPin && (
            <button
              className="editor-nav-btn"
              onClick={onPin}
              title={pinned ? "Unpin memory" : "Pin memory"}
              style={{ color: pinned ? "#EAB308" : undefined }}
              aria-label={pinned ? "Unpin" : "Pin"}
            >
              <Pin size={16} strokeWidth={1.5} />
            </button>
          )}

          {onSave && showSave && (
            <button
              className="editor-nav-btn save-btn"
              onClick={onSave}
              disabled={saving}
              aria-label="Save"
            >
              <Save size={16} strokeWidth={1.5} />
              {saving ? "Saving…" : saveLabel}
            </button>
          )}
        </div>
      </nav>

      <div className="memory-editor-content">{children}</div>

      {bottomToolbar}
    </div>
  );
}
