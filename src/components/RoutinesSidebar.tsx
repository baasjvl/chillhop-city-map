"use client";

import { useState } from "react";
import type { Character, RoutineSchedule, RoutineStop } from "@/lib/types";
import { parseRoutines, resolveStops } from "@/lib/routines";
import type { NotablePoint } from "@/lib/types";

interface RoutinesSidebarProps {
  characters: Character[];
  points: NotablePoint[];
  selectedCharacterId: string | null;
  selectedScheduleLabel: string;
  isOpen: boolean;
  isAuthenticated: boolean;
  addingStop: boolean;
  onToggle: () => void;
  onSelectCharacter: (id: string | null) => void;
  onSelectSchedule: (label: string) => void;
  onStartAddStop: () => void;
  onAddSchedule: (label: string) => void;
  onRemoveStop: (index: number) => void;
  onSaveRoutine: () => void;
}

export default function RoutinesSidebar({
  characters,
  points,
  selectedCharacterId,
  selectedScheduleLabel,
  isOpen,
  isAuthenticated,
  addingStop,
  onToggle,
  onSelectCharacter,
  onSelectSchedule,
  onStartAddStop,
  onAddSchedule,
  onRemoveStop,
  onSaveRoutine,
}: RoutinesSidebarProps) {
  const [newScheduleLabel, setNewScheduleLabel] = useState("");
  const [showNewSchedule, setShowNewSchedule] = useState(false);

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId) ?? null;
  const schedules = selectedCharacter ? parseRoutines(selectedCharacter.routinesRaw) : [];
  const activeSchedule = schedules.find((s) => s.label === selectedScheduleLabel) ?? null;
  const resolvedStops = activeSchedule ? resolveStops(activeSchedule.stops, points) : [];

  const handleAddSchedule = () => {
    if (!newScheduleLabel.trim()) return;
    onAddSchedule(newScheduleLabel.trim().toLowerCase());
    setNewScheduleLabel("");
    setShowNewSchedule(false);
  };

  return (
    <>
      <button
        onClick={onToggle}
        style={{
          position: "fixed", top: 56, left: isOpen ? 308 : 8, zIndex: 91,
          background: "var(--panel)", border: "1px solid var(--panel-border)",
          color: "var(--text)", width: 28, height: 28, borderRadius: 6,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, transition: "left 0.2s ease",
        }}
      >
        &#9776;
      </button>

      <div
        style={{
          position: "fixed", top: 48, left: 0, width: 300, bottom: 0,
          background: "var(--panel)", borderRight: "1px solid var(--panel-border)",
          zIndex: 90, display: "flex", flexDirection: "column",
          transform: isOpen ? "translateX(0)" : "translateX(-300px)",
          transition: "transform 0.2s ease", overflow: "hidden",
        }}
      >
        {/* Character list */}
        <div style={{ borderBottom: "1px solid var(--panel-border)" }}>
          <div style={{ padding: "12px 16px" }}>
            <h3 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8 }}>
              Characters
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {characters.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectCharacter(c.id === selectedCharacterId ? null : c.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 10px", borderRadius: 6, fontSize: 13,
                    cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                    background: c.id === selectedCharacterId ? "rgba(245, 168, 85, 0.15)" : "transparent",
                    border: "none", color: "var(--text)", width: "100%",
                  }}
                >
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: c.id === selectedCharacterId ? "#F5A855" : "var(--text-muted)",
                    flexShrink: 0,
                  }} />
                  {c.name}
                  {c.routinesRaw && (
                    <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: "auto" }}>
                      {parseRoutines(c.routinesRaw).length} schedules
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected character's schedules */}
        {selectedCharacter && (
          <>
            <div style={{ borderBottom: "1px solid var(--panel-border)", padding: "12px 16px" }}>
              <h3 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8 }}>
                Schedules — {selectedCharacter.name}
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {schedules.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => onSelectSchedule(s.label)}
                    style={{
                      padding: "4px 10px", borderRadius: 12, fontSize: 12,
                      cursor: "pointer", fontFamily: "inherit",
                      background: s.label === selectedScheduleLabel ? "rgba(245, 168, 85, 0.15)" : "transparent",
                      border: s.label === selectedScheduleLabel ? "1px solid #F5A855" : "1px solid var(--panel-border)",
                      color: s.label === selectedScheduleLabel ? "#F5A855" : "var(--text-muted)",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
                {isAuthenticated && !showNewSchedule && (
                  <button
                    onClick={() => setShowNewSchedule(true)}
                    style={{
                      padding: "4px 10px", borderRadius: 12, fontSize: 12,
                      cursor: "pointer", fontFamily: "inherit",
                      background: "transparent", border: "1px dashed var(--panel-border)",
                      color: "var(--text-muted)",
                    }}
                  >
                    +
                  </button>
                )}
              </div>
              {showNewSchedule && (
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <input
                    type="text"
                    placeholder="e.g. rain, monday..."
                    value={newScheduleLabel}
                    onChange={(e) => setNewScheduleLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSchedule()}
                    autoFocus
                    style={{
                      flex: 1, background: "rgba(58, 50, 38, 0.2)",
                      border: "1px solid var(--panel-border)", color: "var(--text)",
                      padding: "4px 8px", borderRadius: 6, fontSize: 12,
                      outline: "none", fontFamily: "inherit",
                    }}
                  />
                  <button onClick={handleAddSchedule} style={{
                    background: "#F5A855", border: "none", color: "#3A3226",
                    padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Stops list */}
            {activeSchedule && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--panel-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h3 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                    Stops ({resolvedStops.length})
                  </h3>
                  {isAuthenticated && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={onStartAddStop}
                        style={{
                          padding: "4px 10px", borderRadius: 6, fontSize: 11,
                          cursor: "pointer", fontFamily: "inherit",
                          background: addingStop ? "#F5A855" : "rgba(58, 50, 38, 0.2)",
                          color: addingStop ? "#3A3226" : "var(--text-muted)",
                          border: "1px solid var(--panel-border)",
                          fontWeight: addingStop ? 600 : 400,
                        }}
                      >
                        {addingStop ? "Click map..." : "+ Add stop"}
                      </button>
                      <button
                        onClick={onSaveRoutine}
                        style={{
                          padding: "4px 10px", borderRadius: 6, fontSize: 11,
                          cursor: "pointer", fontFamily: "inherit",
                          background: "#F5A855", color: "#3A3226",
                          border: "none", fontWeight: 600,
                        }}
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {resolvedStops.length === 0 ? (
                    <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                      No stops yet. Click &quot;+ Add stop&quot; then click on the map.
                    </div>
                  ) : (
                    resolvedStops.map((stop, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 16px", fontSize: 13,
                        borderBottom: "1px solid rgba(245,240,232,0.05)",
                      }}>
                        <span style={{
                          width: 20, height: 20, borderRadius: "50%",
                          background: stop.x !== undefined ? "#F5A855" : "var(--text-muted)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700, color: "#3A3226", flexShrink: 0,
                        }}>
                          {i + 1}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 500 }}>{stop.time}</div>
                          <div style={{
                            fontSize: 11, color: stop.x !== undefined ? "var(--text-muted)" : "#E85D5D",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {stop.location}
                            {stop.x === undefined && " (unresolved)"}
                          </div>
                          {stop.tags.length > 0 && (
                            <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                              {stop.tags.map((tag) => (
                                <span key={tag} style={{
                                  fontSize: 9, padding: "1px 5px", borderRadius: 8,
                                  background: "rgba(58, 50, 38, 0.3)", color: "var(--text-muted)",
                                }}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {isAuthenticated && (
                          <button
                            onClick={() => onRemoveStop(i)}
                            style={{
                              background: "transparent", border: "none",
                              color: "var(--text-muted)", fontSize: 10, cursor: "pointer",
                              padding: "2px 4px", flexShrink: 0, opacity: 0.5, fontFamily: "inherit",
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
            )}
          </>
        )}
      </div>
    </>
  );
}
