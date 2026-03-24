"use client";

import { useState } from "react";
import type { NotablePoint } from "@/lib/types";
import { getTypeColor, TYPE_COLORS } from "@/lib/colors";

const ALL_STATUSES = [
  "Placeholder",
  "WIP",
  "Ready for Review",
  "Ready to Implement",
  "Implemented",
];

const STATUS_COLORS: Record<string, string> = {
  Placeholder: "#9E8E7E",
  WIP: "#E8C05A",
  "Ready for Review": "#5AADE8",
  "Ready to Implement": "#E89A5A",
  Implemented: "#6BBF6B",
};

interface SidebarProps {
  points: NotablePoint[];
  selectedId: string | null;
  placingId: string | null;
  isOpen: boolean;
  isAuthenticated: boolean;
  onToggle: () => void;
  onSelectPin: (id: string) => void;
  onStartPlace: (id: string) => void;
  onCreatePoint: (name: string) => void;
}

export default function Sidebar({
  points,
  selectedId,
  placingId,
  isOpen,
  isAuthenticated,
  onToggle,
  onSelectPin,
  onStartPlace,
  onCreatePoint,
}: SidebarProps) {
  const [activeTypes, setActiveTypes] = useState<Set<string>>(
    new Set(Object.keys(TYPE_COLORS))
  );
  const [activeStatuses, setActiveStatuses] = useState<Set<string>>(
    new Set(ALL_STATUSES)
  );
  const [searchText, setSearchText] = useState("");
  const [newPointName, setNewPointName] = useState("");
  const [showNewPoint, setShowNewPoint] = useState(false);

  const toggleType = (type: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const toggleStatus = (status: string) => {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const placed = points.filter((p) => p.x !== null && p.y !== null);
  const unplaced = points.filter((p) => p.x === null || p.y === null);

  const filterPoint = (p: NotablePoint) => {
    if (p.type && !activeTypes.has(p.type)) return false;
    if (p.status && !activeStatuses.has(p.status)) return false;
    if (!p.status && !activeStatuses.has("Placeholder")) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      const inName = p.name.toLowerCase().includes(q);
      const inTags = p.tags.some((t) => t.toLowerCase().includes(q));
      const inDesc = p.description.toLowerCase().includes(q);
      if (!inName && !inTags && !inDesc) return false;
    }
    return true;
  };

  const filteredPlaced = placed.filter(filterPoint);
  const filteredUnplaced = unplaced.filter(filterPoint);

  const handleCreatePoint = () => {
    if (!newPointName.trim()) return;
    onCreatePoint(newPointName.trim());
    setNewPointName("");
    setShowNewPoint(false);
  };

  return (
    <>
      {/* Toggle button */}
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

      {/* Sidebar panel */}
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
        {/* Type filters */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--panel-border)" }}>
          <h3 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8 }}>
            Types
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {Object.entries(TYPE_COLORS).map(([type, color]) => {
              const active = activeTypes.has(type);
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
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: color,
                    }}
                  />
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status filters */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--panel-border)" }}>
          <h3 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8 }}>
            Status
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ALL_STATUSES.map((status) => {
              const active = activeStatuses.has(status);
              const color = STATUS_COLORS[status] ?? "var(--text-muted)";
              return (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
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
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: color,
                    }}
                  />
                  {status}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--panel-border)" }}>
          <input
            type="text"
            placeholder="Search pins..."
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

        {/* Add new entry */}
        {isAuthenticated && (
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--panel-border)" }}>
            {showNewPoint ? (
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="text"
                  placeholder="Entry name..."
                  value={newPointName}
                  onChange={(e) => setNewPointName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreatePoint()}
                  autoFocus
                  style={{
                    flex: 1,
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
                <button
                  onClick={handleCreatePoint}
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
                  onClick={() => { setShowNewPoint(false); setNewPointName(""); }}
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
            ) : (
              <button
                onClick={() => setShowNewPoint(true)}
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
                + Add new entry
              </button>
            )}
          </div>
        )}

        {/* Unplaced items */}
        {filteredUnplaced.length > 0 && (
          <div style={{ borderBottom: "1px solid var(--panel-border)" }}>
            <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#F5A855" }}>
                Unplaced ({filteredUnplaced.length})
              </h3>
            </div>
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {filteredUnplaced.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontSize: 13,
                    background: placingId === p.id ? "rgba(245, 168, 85, 0.15)" : "transparent",
                  }}
                  onClick={() => onStartPlace(p.id)}
                  title="Click to place on map"
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: getTypeColor(p.type),
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </span>
                  <span style={{ fontSize: 10, color: "#F5A855", flexShrink: 0 }}>
                    place
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Placed pins list */}
        <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--panel-border)" }}>
          <h3 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
            Pins <span style={{ fontWeight: 400 }}>({filteredPlaced.length}/{placed.length})</span>
          </h3>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filteredPlaced.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              {placed.length === 0 ? "No pins placed yet." : "No pins match filters."}
            </div>
          ) : (
            filteredPlaced.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectPin(p.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontSize: 13,
                  background: p.id === selectedId ? "rgba(245, 168, 85, 0.15)" : "transparent",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: getTypeColor(p.type),
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.name}
                </span>
                {p.status && (
                  <span style={{ fontSize: 10, color: STATUS_COLORS[p.status] ?? "var(--text-muted)", flexShrink: 0 }}>
                    {p.status}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
