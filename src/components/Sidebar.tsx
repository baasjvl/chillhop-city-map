"use client";

import { useState } from "react";
import type { NotablePoint } from "@/lib/types";
import { getTypeColor, TYPE_COLORS } from "@/lib/colors";

interface SidebarProps {
  points: NotablePoint[];
  selectedId: string | null;
  placingId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelectPin: (id: string) => void;
  onStartPlace: (id: string) => void;
}

export default function Sidebar({
  points,
  selectedId,
  placingId,
  isOpen,
  onToggle,
  onSelectPin,
  onStartPlace,
}: SidebarProps) {
  const [activeTypes, setActiveTypes] = useState<Set<string>>(
    new Set(Object.keys(TYPE_COLORS))
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchText, setSearchText] = useState("");

  const toggleType = (type: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const placed = points.filter((p) => p.x !== null && p.y !== null);
  const unplaced = points.filter((p) => p.x === null || p.y === null);

  const filterPoint = (p: NotablePoint) => {
    if (p.type && !activeTypes.has(p.type)) return false;
    if (
      statusFilter !== "all" &&
      statusFilter === "unimplemented" &&
      p.status === "Implemented"
    )
      return false;
    if (statusFilter !== "all" && statusFilter !== "unimplemented" && p.status !== statusFilter)
      return false;
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

        {/* Search & status filter */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--panel-border)", display: "flex", flexDirection: "column", gap: 8 }}>
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
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: "100%",
              background: "rgba(58, 50, 38, 0.2)",
              border: "1px solid var(--panel-border)",
              color: "var(--text)",
              padding: "6px 10px",
              borderRadius: 6,
              fontSize: 12,
              fontFamily: "inherit",
            }}
          >
            <option value="all">All statuses</option>
            <option value="unimplemented">Not implemented</option>
            <option value="WIP">WIP</option>
            <option value="Ready for Review">Ready for Review</option>
            <option value="Ready to Implement">Ready to Implement</option>
            <option value="Implemented">Implemented</option>
          </select>
        </div>

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
                {p.status === "Implemented" && (
                  <span style={{ fontSize: 10, color: "#6BBF6B", flexShrink: 0 }}>
                    Done
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
