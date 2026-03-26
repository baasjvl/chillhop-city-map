"use client";

import { useState } from "react";
import type { Character, RoutineStop } from "@/lib/types";
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
  onEditStop: (index: number, updates: Partial<RoutineStop>) => void;
  onReorderSchedules: (labels: string[]) => void;
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
  onEditStop,
  onReorderSchedules,
  onSaveRoutine,
}: RoutinesSidebarProps) {
  const [newScheduleLabel, setNewScheduleLabel] = useState("");
  const [showNewSchedule, setShowNewSchedule] = useState(false);
  const [editingStopIndex, setEditingStopIndex] = useState<number | null>(null);
  const [editTime, setEditTime] = useState("");
  const [editCustomTag, setEditCustomTag] = useState("");

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId) ?? null;
  const schedules = selectedCharacter ? parseRoutines(selectedCharacter.routinesRaw) : [];
  const activeSchedule = schedules.find((s) => s.label === selectedScheduleLabel) ?? null;
  const resolvedStops = activeSchedule ? resolveStops(activeSchedule.stops, points) : [];
  const scheduleLabels = schedules.map((s) => s.label);

  const handleAddSchedule = () => {
    if (!newScheduleLabel.trim()) return;
    onAddSchedule(newScheduleLabel.trim().toLowerCase());
    setNewScheduleLabel("");
    setShowNewSchedule(false);
  };

  const startEditStop = (index: number) => {
    setEditingStopIndex(index);
    setEditTime(resolvedStops[index].time);
    setEditCustomTag("");
  };

  const handleMoveSchedule = (label: string, dir: -1 | 1) => {
    const idx = scheduleLabels.indexOf(label);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= scheduleLabels.length) return;
    const newLabels = [...scheduleLabels];
    [newLabels[idx], newLabels[newIdx]] = [newLabels[newIdx], newLabels[idx]];
    onReorderSchedules(newLabels);
  };

  const toggleStopTag = (index: number, tag: string) => {
    const stop = resolvedStops[index];
    const newTags = stop.tags.includes(tag)
      ? stop.tags.filter((t) => t !== tag)
      : [...stop.tags, tag];
    onEditStop(index, { tags: newTags });
  };

  const addCustomTagToStop = (index: number) => {
    if (!editCustomTag.trim()) return;
    const stop = resolvedStops[index];
    const tag = editCustomTag.trim().toLowerCase();
    if (!stop.tags.includes(tag)) {
      onEditStop(index, { tags: [...stop.tags, tag] });
    }
    setEditCustomTag("");
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
            <h3 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8 }}>
              Characters
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {characters.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectCharacter(c.id === selectedCharacterId ? null : c.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 10px", borderRadius: 6, fontSize: 14,
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
                    <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>
                      {parseRoutines(c.routinesRaw).length} schedules
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Schedules for selected character */}
        {selectedCharacter && (
          <>
            <div style={{ borderBottom: "1px solid var(--panel-border)", padding: "12px 16px" }}>
              <h3 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8 }}>
                Schedules — {selectedCharacter.name}
              </h3>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
                Higher = higher priority (overrides lower)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {scheduleLabels.map((label, i) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button
                      onClick={() => onSelectSchedule(label)}
                      style={{
                        flex: 1, padding: "6px 10px", borderRadius: 6, fontSize: 13,
                        cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                        background: label === selectedScheduleLabel ? "rgba(245, 168, 85, 0.15)" : "transparent",
                        border: label === selectedScheduleLabel ? "1px solid #F5A855" : "1px solid var(--panel-border)",
                        color: label === selectedScheduleLabel ? "#F5A855" : "var(--text-muted)",
                      }}
                    >
                      {i + 1}. {label}
                    </button>
                    {isAuthenticated && (
                      <>
                        <button
                          onClick={() => handleMoveSchedule(label, -1)}
                          disabled={i === 0}
                          style={{
                            background: "transparent", border: "1px solid var(--panel-border)",
                            color: i === 0 ? "rgba(245,240,232,0.15)" : "var(--text-muted)",
                            padding: "4px 6px", borderRadius: 4, fontSize: 10, cursor: i === 0 ? "default" : "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          &#9650;
                        </button>
                        <button
                          onClick={() => handleMoveSchedule(label, 1)}
                          disabled={i === scheduleLabels.length - 1}
                          style={{
                            background: "transparent", border: "1px solid var(--panel-border)",
                            color: i === scheduleLabels.length - 1 ? "rgba(245,240,232,0.15)" : "var(--text-muted)",
                            padding: "4px 6px", borderRadius: 4, fontSize: 10,
                            cursor: i === scheduleLabels.length - 1 ? "default" : "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          &#9660;
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
              {isAuthenticated && !showNewSchedule && (
                <button
                  onClick={() => setShowNewSchedule(true)}
                  style={{
                    marginTop: 8, padding: "6px 10px", borderRadius: 6, fontSize: 12,
                    cursor: "pointer", fontFamily: "inherit", width: "100%",
                    background: "transparent", border: "1px dashed var(--panel-border)",
                    color: "var(--text-muted)",
                  }}
                >
                  + Add schedule
                </button>
              )}
              {showNewSchedule && (
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <input
                    type="text" placeholder="e.g. rain, monday..."
                    value={newScheduleLabel}
                    onChange={(e) => setNewScheduleLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSchedule()}
                    autoFocus
                    style={{
                      flex: 1, background: "rgba(58, 50, 38, 0.2)",
                      border: "1px solid var(--panel-border)", color: "var(--text)",
                      padding: "6px 8px", borderRadius: 6, fontSize: 13,
                      outline: "none", fontFamily: "inherit",
                    }}
                  />
                  <button onClick={handleAddSchedule} style={{
                    background: "#F5A855", border: "none", color: "#3A3226",
                    padding: "6px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>Add</button>
                </div>
              )}
            </div>

            {/* Stops list */}
            {activeSchedule && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--panel-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h3 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                    Stops ({resolvedStops.length})
                  </h3>
                  {isAuthenticated && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={onStartAddStop}
                        style={{
                          padding: "5px 10px", borderRadius: 6, fontSize: 12,
                          cursor: "pointer", fontFamily: "inherit",
                          background: addingStop ? "#F5A855" : "rgba(58, 50, 38, 0.2)",
                          color: addingStop ? "#3A3226" : "var(--text-muted)",
                          border: "1px solid var(--panel-border)",
                          fontWeight: addingStop ? 600 : 400,
                        }}
                      >
                        {addingStop ? "Click map..." : "+ Add stop"}
                      </button>
                      <button onClick={onSaveRoutine} style={{
                        padding: "5px 10px", borderRadius: 6, fontSize: 12,
                        cursor: "pointer", fontFamily: "inherit",
                        background: "#F5A855", color: "#3A3226",
                        border: "none", fontWeight: 600,
                      }}>Save</button>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {resolvedStops.length === 0 ? (
                    <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
                      No stops yet. Click &quot;+ Add stop&quot; then click on the map.
                    </div>
                  ) : (
                    resolvedStops.map((stop, i) => {
                      const isEditing = editingStopIndex === i;
                      return (
                        <div key={i} style={{
                          padding: "10px 16px", fontSize: 14,
                          borderBottom: "1px solid rgba(245,240,232,0.05)",
                          background: isEditing ? "rgba(245,168,85,0.08)" : "transparent",
                          cursor: isAuthenticated ? "pointer" : "default",
                        }}
                          onClick={() => isAuthenticated && !isEditing && startEditStop(i)}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{
                              width: 22, height: 22, borderRadius: "50%",
                              background: stop.x !== undefined ? "#F5A855" : "var(--text-muted)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 11, fontWeight: 700, color: "#3A3226", flexShrink: 0,
                            }}>{i + 1}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              {isEditing ? (
                                <input type="time" value={editTime}
                                  onChange={(e) => { setEditTime(e.target.value); onEditStop(i, { time: e.target.value }); }}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    background: "rgba(58,50,38,0.3)", border: "1px solid var(--panel-border)",
                                    color: "var(--text)", padding: "3px 6px", borderRadius: 4, fontSize: 14,
                                    fontFamily: "inherit",
                                  }}
                                />
                              ) : (
                                <span style={{ fontWeight: 500, fontSize: 14 }}>{stop.time}</span>
                              )}
                              {isEditing ? (
                              <input
                                type="text"
                                value={stop.location}
                                onChange={(e) => onEditStop(i, { location: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="POI name or x,y"
                                style={{
                                  width: "100%", background: "rgba(58,50,38,0.3)",
                                  border: "1px solid var(--panel-border)", color: "var(--text)",
                                  padding: "3px 6px", borderRadius: 4, fontSize: 12,
                                  fontFamily: "inherit", marginTop: 2, outline: "none",
                                  boxSizing: "border-box",
                                }}
                              />
                            ) : (
                              <div style={{
                                fontSize: 12, color: stop.x !== undefined ? "var(--text-muted)" : "#E85D5D",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2,
                              }}>
                                {stop.location}{stop.x === undefined && " (unresolved)"}
                              </div>
                            )}
                            </div>
                            {isAuthenticated && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onRemoveStop(i); if (isEditing) setEditingStopIndex(null); }}
                                style={{
                                  background: "transparent", border: "none",
                                  color: "var(--text-muted)", fontSize: 11, cursor: "pointer",
                                  padding: "2px 6px", flexShrink: 0, opacity: 0.5, fontFamily: "inherit",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
                              >&#x2715;</button>
                            )}
                          </div>

                          {/* Tags (always shown) */}
                          {(stop.tags.length > 0 || isEditing) && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6, marginLeft: 30 }}>
                              {stop.tags.map((tag) => (
                                <button key={tag}
                                  onClick={(e) => { e.stopPropagation(); if (isEditing) toggleStopTag(i, tag); }}
                                  style={{
                                    fontSize: 11, padding: "2px 7px", borderRadius: 8,
                                    background: "rgba(245,168,85,0.15)", color: "#F5A855",
                                    border: "1px solid rgba(245,168,85,0.3)",
                                    cursor: isEditing ? "pointer" : "default", fontFamily: "inherit",
                                  }}
                                >{tag}{isEditing && " ×"}</button>
                              ))}
                              {isEditing && (
                                <>
                                  {["inside", "sleep", "work", "idle"].filter((t) => !stop.tags.includes(t)).map((tag) => (
                                    <button key={tag}
                                      onClick={(e) => { e.stopPropagation(); toggleStopTag(i, tag); }}
                                      style={{
                                        fontSize: 11, padding: "2px 7px", borderRadius: 8,
                                        background: "transparent", color: "var(--text-muted)",
                                        border: "1px solid var(--panel-border)",
                                        cursor: "pointer", fontFamily: "inherit", opacity: 0.5,
                                      }}
                                    >{tag}</button>
                                  ))}
                                  <div style={{ display: "flex", gap: 2 }} onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="text" placeholder="custom..."
                                      value={editCustomTag}
                                      onChange={(e) => setEditCustomTag(e.target.value)}
                                      onKeyDown={(e) => { if (e.key === "Enter") addCustomTagToStop(i); }}
                                      style={{
                                        width: 70, background: "rgba(58,50,38,0.2)",
                                        border: "1px solid var(--panel-border)", color: "var(--text)",
                                        padding: "2px 6px", borderRadius: 6, fontSize: 10,
                                        outline: "none", fontFamily: "inherit",
                                      }}
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          )}

                          {isEditing && (
                            <div style={{ marginTop: 6, marginLeft: 30 }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingStopIndex(null); }}
                                style={{
                                  fontSize: 11, padding: "3px 10px", borderRadius: 6,
                                  background: "rgba(58,50,38,0.2)", border: "1px solid var(--panel-border)",
                                  color: "var(--text-muted)", cursor: "pointer", fontFamily: "inherit",
                                }}
                              >Done editing</button>
                            </div>
                          )}
                        </div>
                      );
                    })
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
