"use client";

import { useState, useMemo } from "react";
import type { NotablePoint } from "@/lib/types";
import { getTypeColor, getStatusColor } from "@/lib/colors";

const HIDDEN_BY_DEFAULT = new Set(["Postponed", "Archived"]);

interface SidebarProps {
  points: NotablePoint[];
  dbTypes: string[];
  dbStatuses: string[];
  selectedId: string | null;
  placingId: string | null;
  isOpen: boolean;
  isAuthenticated: boolean;
  onToggle: () => void;
  onSelectPin: (id: string) => void;
  onStartPlace: (id: string) => void;
  onCreatePoint: (name: string) => void;
  onRemovePin: (id: string) => void;
}

export default function Sidebar({
  points,
  dbTypes,
  dbStatuses,
  selectedId,
  placingId,
  isOpen,
  isAuthenticated,
  onToggle,
  onSelectPin,
  onStartPlace,
  onCreatePoint,
  onRemovePin,
}: SidebarProps) {
  // Use schema-provided options, fall back to data-derived
  const allTypes = useMemo(() => {
    if (dbTypes.length > 0) return dbTypes;
    const set = new Set<string>();
    points.forEach((p) => { if (p.type) set.add(p.type); });
    return [...set].sort();
  }, [dbTypes, points]);

  const allStatuses = useMemo(() => {
    if (dbStatuses.length > 0) return dbStatuses;
    const set = new Set<string>();
    points.forEach((p) => { if (p.status) set.add(p.status); });
    return [...set].sort();
  }, [dbStatuses, points]);

  const [activeTypes, setActiveTypes] = useState<Set<string> | null>(null);
  const [activeStatuses, setActiveStatuses] = useState<Set<string> | null>(null);

  // Lazy init: all types on, statuses on except hidden-by-default
  const effectiveTypes = activeTypes ?? new Set(allTypes);
  const effectiveStatuses = activeStatuses ?? new Set(allStatuses.filter((s) => !HIDDEN_BY_DEFAULT.has(s)));

  const [showTypes, setShowTypes] = useState(false);
  const [showStatuses, setShowStatuses] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [newPointName, setNewPointName] = useState("");
  const [showNewPoint, setShowNewPoint] = useState(false);

  const toggleType = (type: string) => {
    setActiveTypes((prev) => {
      const base = prev ?? new Set(allTypes);
      const next = new Set(base);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const toggleStatus = (status: string) => {
    setActiveStatuses((prev) => {
      const base = prev ?? new Set(allStatuses.filter((s) => !HIDDEN_BY_DEFAULT.has(s)));
      const next = new Set(base);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const placed = points.filter((p) => p.x !== null && p.y !== null);
  const unplaced = points.filter((p) => p.x === null || p.y === null);

  const filterPoint = (p: NotablePoint) => {
    if (p.type && !effectiveTypes.has(p.type)) return false;
    if (!p.type && effectiveTypes.size < allTypes.length) return false;
    if (p.status && !effectiveStatuses.has(p.status)) return false;
    if (!p.status && effectiveStatuses.size < allStatuses.length) return false;
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

  // Count how many filters are active vs total
  const typeFilterLabel = `Types (${effectiveTypes.size}/${allTypes.length})`;
  const statusFilterLabel = `Status (${effectiveStatuses.size}/${allStatuses.length})`;

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
        {/* Filters section */}
        <div style={{ borderBottom: "1px solid var(--panel-border)" }}>
          <h3 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", padding: "12px 16px 0" }}>
            Filters
          </h3>

          {/* Types dropdown */}
          <div style={{ padding: "8px 16px" }}>
            <button
              onClick={() => setShowTypes(!showTypes)}
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
              {typeFilterLabel}
              <span style={{ fontSize: 10 }}>{showTypes ? "\u25B2" : "\u25BC"}</span>
            </button>
            {showTypes && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 8 }}>
                {allTypes.map((type) => {
                  const active = effectiveTypes.has(type);
                  const color = getTypeColor(type);
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
          </div>

          {/* Statuses dropdown */}
          <div style={{ padding: "0 16px 12px" }}>
            <button
              onClick={() => setShowStatuses(!showStatuses)}
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
              {statusFilterLabel}
              <span style={{ fontSize: 10 }}>{showStatuses ? "\u25B2" : "\u25BC"}</span>
            </button>
            {showStatuses && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 8 }}>
                {allStatuses.map((status) => {
                  const active = effectiveStatuses.has(status);
                  const color = getStatusColor(status);
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
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                      {status}
                    </button>
                  );
                })}
              </div>
            )}
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
                    background: selectedId === p.id ? "rgba(245, 168, 85, 0.15)" : placingId === p.id ? "rgba(245, 168, 85, 0.1)" : "transparent",
                  }}
                  onClick={() => onSelectPin(p.id)}
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
                  <span
                    onClick={(e) => { e.stopPropagation(); onStartPlace(p.id); }}
                    style={{ fontSize: 10, color: "#F5A855", flexShrink: 0, cursor: "pointer" }}
                    title="Click to place on map"
                  >
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
                  <span style={{ fontSize: 10, color: getStatusColor(p.status), flexShrink: 0 }}>
                    {p.status}
                  </span>
                )}
                {isAuthenticated && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemovePin(p.id);
                    }}
                    title="Remove pin from map"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)",
                      fontSize: 10,
                      cursor: "pointer",
                      padding: "2px 4px",
                      flexShrink: 0,
                      opacity: 0.5,
                      fontFamily: "inherit",
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
