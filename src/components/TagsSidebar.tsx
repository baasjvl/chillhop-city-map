"use client";

import { useState, useMemo } from "react";
import type { MapTag } from "@/lib/types";
import { getTagTypeColor } from "@/lib/colors";

interface TagsSidebarProps {
  tags: MapTag[];
  dbTagTypes: string[];
  selectedId: string | null;
  placingId: string | null;
  isOpen: boolean;
  isAuthenticated: boolean;
  showPois: boolean;
  onToggle: () => void;
  onSelectTag: (id: string) => void;
  onStartPlace: (id: string) => void;
  onCreateTag: (name: string, tagType: string) => void;
  onRemoveTag: (id: string) => void;
  onTogglePois: () => void;
}

export default function TagsSidebar({
  tags,
  dbTagTypes,
  selectedId,
  placingId,
  isOpen,
  isAuthenticated,
  showPois,
  onToggle,
  onSelectTag,
  onStartPlace,
  onCreateTag,
  onRemoveTag,
  onTogglePois,
}: TagsSidebarProps) {
  const allTypes = useMemo(() => {
    if (dbTagTypes.length > 0) return dbTagTypes;
    const set = new Set<string>();
    tags.forEach((t) => { if (t.tagType) set.add(t.tagType); });
    return [...set].sort();
  }, [dbTagTypes, tags]);

  const [activeTypes, setActiveTypes] = useState<Set<string> | null>(null);
  const [hideDone, setHideDone] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagType, setNewTagType] = useState(allTypes[0] || "");

  const effectiveTypes = activeTypes ?? new Set(allTypes);

  const toggleType = (type: string) => {
    setActiveTypes((prev) => {
      const base = prev ?? new Set(allTypes);
      const next = new Set(base);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const placed = tags.filter((t) => t.x !== null && t.y !== null);
  const unplaced = tags.filter((t) => t.x === null || t.y === null);

  const filterTag = (t: MapTag) => {
    if (hideDone && t.done) return false;
    if (t.tagType && !effectiveTypes.has(t.tagType)) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      if (!t.name.toLowerCase().includes(q)) return false;
    }
    return true;
  };

  const filteredPlaced = placed.filter(filterTag);
  const filteredUnplaced = unplaced.filter(filterTag);

  const handleCreate = () => {
    if (!newTagName.trim() || !newTagType) return;
    onCreateTag(newTagName.trim(), newTagType);
    setNewTagName("");
    setShowNewTag(false);
  };

  return (
    <>
      <button
        onClick={onToggle}
        style={{
          position: "fixed",
          top: 56,
          left: isOpen ? 308 : 8,
          zIndex: 91,
          background: "var(--panel)",
          border: "1px solid var(--panel-border)",
          color: "var(--text)",
          width: 28,
          height: 28,
          borderRadius: 6,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          transition: "left 0.2s ease",
        }}
      >
        &#9776;
      </button>

      <div
        style={{
          position: "fixed",
          top: 48,
          left: 0,
          width: 300,
          bottom: 0,
          background: "var(--panel)",
          borderRight: "1px solid var(--panel-border)",
          zIndex: 90,
          display: "flex",
          flexDirection: "column",
          transform: isOpen ? "translateX(0)" : "translateX(-300px)",
          transition: "transform 0.2s ease",
          overflow: "hidden",
        }}
      >
        {/* Filters */}
        <div style={{ borderBottom: "1px solid var(--panel-border)" }}>
          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Type filter dropdown */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(58, 50, 38, 0.2)",
                border: "1px solid var(--panel-border)",
                color: "var(--text)",
                padding: "6px 10px",
                borderRadius: 6,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Types ({effectiveTypes.size}/{allTypes.length})
              <span style={{ fontSize: 10 }}>{showFilters ? "\u25B2" : "\u25BC"}</span>
            </button>
            {showFilters && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {allTypes.map((type) => {
                  const active = effectiveTypes.has(type);
                  const color = getTagTypeColor(type);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 10px",
                        borderRadius: 12,
                        fontSize: 12,
                        cursor: "pointer",
                        background: active ? "rgba(58, 50, 38, 0.1)" : "transparent",
                        border: active ? `1px solid ${color}` : "1px solid transparent",
                        color: active ? color : "var(--text-muted)",
                        opacity: active ? 1 : 0.4,
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                      {type}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Hide done + Show POIs toggles */}
            <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-muted)", cursor: "pointer" }}>
                <input type="checkbox" checked={hideDone} onChange={() => setHideDone(!hideDone)} />
                Hide done
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-muted)", cursor: "pointer" }}>
                <input type="checkbox" checked={showPois} onChange={onTogglePois} />
                Show POIs
              </label>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--panel-border)" }}>
          <input
            type="text"
            placeholder="Search tags..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              width: "100%",
              background: "rgba(58, 50, 38, 0.2)",
              border: "1px solid var(--panel-border)",
              color: "var(--text)",
              padding: "6px 10px",
              borderRadius: 6,
              fontSize: 12,
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Add new tag */}
        {isAuthenticated && (
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--panel-border)" }}>
            {showNewTag ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <input
                  type="text"
                  placeholder="Tag description..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  autoFocus
                  style={{
                    background: "rgba(58, 50, 38, 0.2)",
                    border: "1px solid var(--panel-border)",
                    color: "var(--text)",
                    padding: "6px 10px",
                    borderRadius: 6,
                    fontSize: 12,
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
                <div style={{ display: "flex", gap: 6 }}>
                  <select
                    value={newTagType}
                    onChange={(e) => setNewTagType(e.target.value)}
                    style={{
                      flex: 1,
                      background: "rgba(58, 50, 38, 0.2)",
                      border: "1px solid var(--panel-border)",
                      color: "var(--text)",
                      padding: "6px 10px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontFamily: "inherit",
                    }}
                  >
                    {allTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleCreate}
                    style={{
                      background: "#F5A855",
                      border: "none",
                      color: "#3A3226",
                      padding: "6px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setShowNewTag(false); setNewTagName(""); }}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--panel-border)",
                      color: "var(--text-muted)",
                      padding: "6px 8px",
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    x
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewTag(true)}
                style={{
                  width: "100%",
                  background: "rgba(58, 50, 38, 0.2)",
                  border: "1px dashed var(--panel-border)",
                  color: "var(--text-muted)",
                  padding: "6px 10px",
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                + Add new tag
              </button>
            )}
          </div>
        )}

        {/* Unplaced tags */}
        {filteredUnplaced.length > 0 && (
          <div style={{ borderBottom: "1px solid var(--panel-border)" }}>
            <div style={{ padding: "12px 16px" }}>
              <h3 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#F5A855" }}>
                Unplaced ({filteredUnplaced.length})
              </h3>
            </div>
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {filteredUnplaced.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontSize: 13,
                    background: placingId === t.id ? "rgba(245, 168, 85, 0.15)" : "transparent",
                  }}
                  onClick={() => onStartPlace(t.id)}
                >
                  <span style={{
                    width: 8, height: 8, transform: "rotate(45deg)",
                    background: getTagTypeColor(t.tagType), flexShrink: 0,
                  }} />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.name}
                  </span>
                  <span style={{ fontSize: 10, color: "#F5A855", flexShrink: 0 }}>place</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Placed tags list */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--panel-border)" }}>
          <h3 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
            Tags <span style={{ fontWeight: 400 }}>({filteredPlaced.length}/{placed.length})</span>
          </h3>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filteredPlaced.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              {placed.length === 0 ? "No tags placed yet." : "No tags match filters."}
            </div>
          ) : (
            filteredPlaced.map((t) => (
              <div
                key={t.id}
                onClick={() => onSelectTag(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontSize: 13,
                  background: t.id === selectedId ? "rgba(245, 168, 85, 0.15)" : "transparent",
                  opacity: t.done ? 0.5 : 1,
                }}
              >
                <span style={{
                  width: 8, height: 8, transform: "rotate(45deg)",
                  background: getTagTypeColor(t.tagType), flexShrink: 0,
                }} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.name}
                </span>
                <span style={{ fontSize: 10, color: getTagTypeColor(t.tagType), flexShrink: 0 }}>
                  {t.tagType}
                </span>
                {isAuthenticated && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveTag(t.id); }}
                    title="Remove tag from map"
                    style={{
                      background: "transparent", border: "none", color: "var(--text-muted)",
                      fontSize: 10, cursor: "pointer", padding: "2px 4px", flexShrink: 0,
                      opacity: 0.5, fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
                  >
                    &#x2715;
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
