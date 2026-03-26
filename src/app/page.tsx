"use client";

import { useEffect, useState, useCallback } from "react";
import type { NotablePoint, MapTag, Character, ViewMode, RoutineStop } from "@/lib/types";
import { parseRoutines, serializeRoutines, resolveStops } from "@/lib/routines";
import Toolbar from "@/components/Toolbar";
import Sidebar from "@/components/Sidebar";
import TagsSidebar from "@/components/TagsSidebar";
import RoutinesSidebar from "@/components/RoutinesSidebar";
import MapCanvas from "@/components/MapCanvas";
import DetailPanel from "@/components/DetailPanel";

export default function Home() {
  const [points, setPoints] = useState<NotablePoint[]>([]);
  const [tags, setTags] = useState<MapTag[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [dbOptions, setDbOptions] = useState<{ types: string[]; statuses: string[] }>({ types: [], statuses: [] });
  const [dbTagTypes, setDbTagTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("pois");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedKind, setSelectedKind] = useState<"poi" | "tag" | null>(null);
  const [placingId, setPlacingId] = useState<string | null>(null);
  const [placingKind, setPlacingKind] = useState<"poi" | "tag" | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [showPoisInTagView, setShowPoisInTagView] = useState(false);

  // Routines state
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [selectedScheduleLabel, setSelectedScheduleLabel] = useState("default");
  const [addingStop, setAddingStop] = useState(false);
  const [pendingStopCoord, setPendingStopCoord] = useState<{ x: number; y: number; poiName: string | null } | null>(null);
  const [pendingStopTime, setPendingStopTime] = useState("08:00");
  const [pendingStopTags, setPendingStopTags] = useState<string[]>([]);

  // === Data fetching ===
  const fetchPoints = useCallback(async (refresh = false) => {
    try {
      const res = await fetch(refresh ? "/api/notable-points?refresh=true" : "/api/notable-points");
      if (res.ok) {
        const data = await res.json();
        setPoints(data.points);
        if (data.options) setDbOptions(data.options);
      }
    } catch (err) { console.error("Failed to fetch points:", err); }
  }, []);

  const fetchTags = useCallback(async (refresh = false) => {
    try {
      const res = await fetch(refresh ? "/api/map-tags?refresh=true" : "/api/map-tags");
      if (res.ok) {
        const data = await res.json();
        setTags(data.tags);
        if (data.tagTypes) setDbTagTypes(data.tagTypes);
      }
    } catch (err) { console.error("Failed to fetch tags:", err); }
  }, []);

  const fetchCharacters = useCallback(async (refresh = false) => {
    try {
      const res = await fetch(refresh ? "/api/characters?refresh=true" : "/api/characters");
      if (res.ok) {
        const data = await res.json();
        setCharacters(data.characters);
      }
    } catch (err) { console.error("Failed to fetch characters:", err); }
  }, []);

  useEffect(() => {
    fetch("/api/auth").then((r) => r.json()).then((data) => {
      if (data.authenticated) { setIsAuthenticated(true); setAuthorName(data.name); }
    });
    Promise.all([fetchPoints(), fetchTags(), fetchCharacters()]).finally(() => setLoading(false));
  }, [fetchPoints, fetchTags, fetchCharacters]);

  const handleRefresh = () => { fetchPoints(true); fetchTags(true); fetchCharacters(true); };

  const handleLogin = async (name: string, password: string): Promise<boolean> => {
    const res = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, password }) });
    if (res.ok) { setIsAuthenticated(true); setAuthorName(name); return true; }
    return false;
  };

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setIsAuthenticated(false);
    setAuthorName("");
  };

  // === Selection ===
  const selectPoi = (id: string | null) => { setSelectedId(id); setSelectedKind(id ? "poi" : null); };
  const selectTag = (id: string | null) => { setSelectedId(id); setSelectedKind(id ? "tag" : null); };

  // === POI handlers ===
  const handlePlacePin = async (id: string, x: number, y: number) => {
    if (placingKind === "tag") return handlePlaceTag(id, x, y);
    const prev = points;
    setPoints((pts) => pts.map((p) => (p.id === id ? { ...p, x, y } : p)));
    setPlacingId(null); setPlacingKind(null); selectPoi(id);
    try {
      const res = await fetch("/api/place", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId: id, x, y }) });
      if (!res.ok) { setPoints(prev); }
    } catch { setPoints(prev); }
  };

  const handleCreatePoint = async (name: string) => {
    try {
      const res = await fetch("/api/create-point", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      if (res.ok) { const point = await res.json(); setPoints((pts) => [...pts, point]); }
      else { const data = await res.json(); alert(data.error || "Failed to create entry"); }
    } catch { alert("Failed to create entry"); }
  };

  const handleUpdatePoint = async (id: string, updates: { description?: string; defaultResponse?: string }) => {
    const prev = points;
    setPoints((pts) => pts.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    try {
      const res = await fetch("/api/update-point", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId: id, ...updates }) });
      if (!res.ok) setPoints(prev);
    } catch { setPoints(prev); }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const prev = points;
    setPoints((pts) => pts.map((p) => (p.id === id ? { ...p, status } : p)));
    try {
      const res = await fetch("/api/update-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId: id, status }) });
      if (!res.ok) setPoints(prev);
    } catch { setPoints(prev); }
  };

  const handleRemovePin = async (id: string) => {
    const prev = points;
    setPoints((pts) => pts.map((p) => (p.id === id ? { ...p, x: null, y: null } : p)));
    if (selectedId === id) selectPoi(null);
    try {
      const res = await fetch("/api/place", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId: id, x: null, y: null }) });
      if (!res.ok) setPoints(prev);
    } catch { setPoints(prev); }
  };

  // === Tag handlers ===
  const handlePlaceTag = async (id: string, x: number, y: number) => {
    const prev = tags;
    setTags((ts) => ts.map((t) => (t.id === id ? { ...t, x, y } : t)));
    setPlacingId(null); setPlacingKind(null); selectTag(id);
    try {
      const res = await fetch("/api/place", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId: id, x, y }) });
      if (!res.ok) setTags(prev);
    } catch { setTags(prev); }
  };

  const handleCreateTag = async (name: string, tagType: string) => {
    try {
      const res = await fetch("/api/create-tag", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, tagType, addedBy: authorName }) });
      if (res.ok) { const tag = await res.json(); setTags((ts) => [...ts, tag]); }
      else { const data = await res.json(); alert(data.error || "Failed to create tag"); }
    } catch { alert("Failed to create tag"); }
  };

  const handleUpdateTag = async (id: string, updates: { done?: boolean; tagType?: string; name?: string }) => {
    const prev = tags;
    setTags((ts) => ts.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    try {
      const res = await fetch("/api/update-tag", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId: id, ...updates }) });
      if (!res.ok) setTags(prev);
    } catch { setTags(prev); }
  };

  const handleDeleteTag = async (id: string) => {
    const prev = tags;
    setTags((ts) => ts.filter((t) => t.id !== id));
    if (selectedId === id) selectTag(null);
    try {
      const res = await fetch("/api/delete-tag", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId: id }) });
      if (!res.ok) setTags(prev);
    } catch { setTags(prev); }
  };

  const handleRemoveTag = async (id: string) => {
    const prev = tags;
    setTags((ts) => ts.map((t) => (t.id === id ? { ...t, x: null, y: null } : t)));
    if (selectedId === id) selectTag(null);
    try {
      const res = await fetch("/api/place", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId: id, x: null, y: null }) });
      if (!res.ok) setTags(prev);
    } catch { setTags(prev); }
  };

  // === Routine handlers ===
  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId) ?? null;
  const currentSchedules = selectedCharacter ? parseRoutines(selectedCharacter.routinesRaw) : [];
  const activeSchedule = currentSchedules.find((s) => s.label === selectedScheduleLabel) ?? null;
  const resolvedRoutineStops = activeSchedule ? resolveStops(activeSchedule.stops, points) : [];

  const handleAddSchedule = (label: string) => {
    if (!selectedCharacter) return;
    const schedules = parseRoutines(selectedCharacter.routinesRaw);
    if (schedules.find((s) => s.label === label)) return;
    schedules.push({ label, stops: [] });
    const newRaw = serializeRoutines(schedules);
    setCharacters((cs) => cs.map((c) => c.id === selectedCharacter.id ? { ...c, routinesRaw: newRaw } : c));
    setSelectedScheduleLabel(label);
  };

  const handleRemoveStop = (index: number) => {
    if (!selectedCharacter || !activeSchedule) return;
    const schedules = parseRoutines(selectedCharacter.routinesRaw);
    const schedule = schedules.find((s) => s.label === selectedScheduleLabel);
    if (!schedule) return;
    schedule.stops.splice(index, 1);
    const newRaw = serializeRoutines(schedules);
    setCharacters((cs) => cs.map((c) => c.id === selectedCharacter.id ? { ...c, routinesRaw: newRaw } : c));
  };

  const handleEditStop = (index: number, updates: Partial<RoutineStop>) => {
    if (!selectedCharacter || !activeSchedule) return;
    const schedules = parseRoutines(selectedCharacter.routinesRaw);
    const schedule = schedules.find((s) => s.label === selectedScheduleLabel);
    if (!schedule || !schedule.stops[index]) return;
    Object.assign(schedule.stops[index], updates);
    if (updates.time) schedule.stops.sort((a, b) => a.time.localeCompare(b.time));
    const newRaw = serializeRoutines(schedules);
    setCharacters((cs) => cs.map((c) => c.id === selectedCharacter.id ? { ...c, routinesRaw: newRaw } : c));
  };

  const handleReorderSchedules = (newLabels: string[]) => {
    if (!selectedCharacter) return;
    const schedules = parseRoutines(selectedCharacter.routinesRaw);
    const reordered = newLabels.map((l) => schedules.find((s) => s.label === l)!).filter(Boolean);
    const newRaw = serializeRoutines(reordered);
    setCharacters((cs) => cs.map((c) => c.id === selectedCharacter.id ? { ...c, routinesRaw: newRaw } : c));
  };

  const handleRoutineMapClick = (x: number, y: number, nearestPoi: NotablePoint | null) => {
    setPendingStopCoord({
      x: nearestPoi?.x ?? x,
      y: nearestPoi?.y ?? y,
      poiName: nearestPoi?.name ?? null,
    });
    setPendingStopTime("08:00");
    setPendingStopTags([]);
    setAddingStop(false);
  };

  const handleConfirmStop = () => {
    if (!pendingStopCoord || !selectedCharacter || !activeSchedule) return;
    const location = pendingStopCoord.poiName ?? `${pendingStopCoord.x.toFixed(4)},${pendingStopCoord.y.toFixed(4)}`;
    const newStop: RoutineStop = { time: pendingStopTime, location, tags: pendingStopTags };

    const schedules = parseRoutines(selectedCharacter.routinesRaw);
    const schedule = schedules.find((s) => s.label === selectedScheduleLabel);
    if (!schedule) return;
    schedule.stops.push(newStop);
    schedule.stops.sort((a, b) => a.time.localeCompare(b.time));
    const newRaw = serializeRoutines(schedules);
    setCharacters((cs) => cs.map((c) => c.id === selectedCharacter.id ? { ...c, routinesRaw: newRaw } : c));
    setPendingStopCoord(null);
  };

  const handleSaveRoutine = async () => {
    if (!selectedCharacter) return;
    try {
      const res = await fetch("/api/update-routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: selectedCharacter.id, routines: selectedCharacter.routinesRaw }),
      });
      if (!res.ok) alert("Failed to save routine");
    } catch { alert("Failed to save routine"); }
  };

  // === Placement mode ===
  const handleStartPlacePoi = (id: string) => {
    if (!isAuthenticated) { alert("Sign in to place pins"); return; }
    setPlacingId(id); setPlacingKind("poi"); setSelectedId(null); setSelectedKind(null);
  };

  const handleStartPlaceTag = (id: string) => {
    if (!isAuthenticated) { alert("Sign in to place tags"); return; }
    setPlacingId(id); setPlacingKind("tag"); setSelectedId(null); setSelectedKind(null);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setSelectedId(null); setSelectedKind(null); setPlacingId(null); setPlacingKind(null);
    setAddingStop(false); setPendingStopCoord(null);
  };

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (addingStop) { setAddingStop(false); return; }
        if (pendingStopCoord) { setPendingStopCoord(null); return; }
        if (placingId) { setPlacingId(null); setPlacingKind(null); return; }
        if (selectedId) { setSelectedId(null); setSelectedKind(null); }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [placingId, selectedId, addingStop, pendingStopCoord]);

  const selectedPoint = selectedKind === "poi" ? (points.find((p) => p.id === selectedId) ?? null) : null;
  const selectedTagItem = selectedKind === "tag" ? (tags.find((t) => t.id === selectedId) ?? null) : null;
  const ghostPoints = (viewMode === "tags" && showPoisInTagView) || viewMode === "routines" ? points : [];

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 14 }}>
        Loading map data...
      </div>
    );
  }

  return (
    <>
      <Toolbar
        isAuthenticated={isAuthenticated}
        authorName={authorName}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onRefresh={handleRefresh}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {viewMode === "pois" && (
        <Sidebar
          points={points} dbTypes={dbOptions.types} dbStatuses={dbOptions.statuses}
          selectedId={selectedId} placingId={placingId} isOpen={sidebarOpen}
          isAuthenticated={isAuthenticated}
          onToggle={() => setSidebarOpen(!sidebarOpen)} onSelectPin={selectPoi}
          onStartPlace={handleStartPlacePoi} onCreatePoint={handleCreatePoint}
          onRemovePin={handleRemovePin}
        />
      )}
      {viewMode === "tags" && (
        <TagsSidebar
          tags={tags} dbTagTypes={dbTagTypes} selectedId={selectedId}
          placingId={placingId} isOpen={sidebarOpen} isAuthenticated={isAuthenticated}
          showPois={showPoisInTagView}
          onToggle={() => setSidebarOpen(!sidebarOpen)} onSelectTag={selectTag}
          onStartPlace={handleStartPlaceTag} onCreateTag={handleCreateTag}
          onRemoveTag={handleRemoveTag} onTogglePois={() => setShowPoisInTagView(!showPoisInTagView)}
        />
      )}
      {viewMode === "routines" && (
        <RoutinesSidebar
          characters={characters} points={points}
          selectedCharacterId={selectedCharacterId}
          selectedScheduleLabel={selectedScheduleLabel}
          isOpen={sidebarOpen} isAuthenticated={isAuthenticated} addingStop={addingStop}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onSelectCharacter={setSelectedCharacterId}
          onSelectSchedule={setSelectedScheduleLabel}
          onStartAddStop={() => setAddingStop(true)}
          onAddSchedule={handleAddSchedule}
          onRemoveStop={handleRemoveStop}
          onEditStop={handleEditStop}
          onReorderSchedules={handleReorderSchedules}
          onSaveRoutine={handleSaveRoutine}
        />
      )}

      <MapCanvas
        points={viewMode === "pois" ? points : []}
        tags={viewMode === "tags" ? tags : []}
        ghostPoints={ghostPoints}
        routineStops={viewMode === "routines" ? resolvedRoutineStops : []}
        selectedId={selectedId}
        placingId={placingId}
        onSelectPin={viewMode === "pois" ? selectPoi : selectTag}
        onPlacePin={handlePlacePin}
        onRoutineMapClick={handleRoutineMapClick}
        addingRoutineStop={addingStop}
        sidebarOpen={sidebarOpen}
      />

      {selectedPoint && (
        <DetailPanel
          point={selectedPoint} dbStatuses={dbOptions.statuses}
          onClose={() => selectPoi(null)}
          onStartPlace={isAuthenticated ? handleStartPlacePoi : undefined}
          onUpdateStatus={isAuthenticated ? handleUpdateStatus : undefined}
          onUpdatePoint={isAuthenticated ? handleUpdatePoint : undefined}
        />
      )}
      {selectedTagItem && (
        <DetailPanel
          point={null} tag={selectedTagItem} dbStatuses={[]} dbTagTypes={dbTagTypes}
          onClose={() => selectTag(null)}
          onStartPlace={isAuthenticated ? handleStartPlaceTag : undefined}
          onUpdateTag={isAuthenticated ? handleUpdateTag : undefined}
          onDeleteTag={isAuthenticated ? handleDeleteTag : undefined}
        />
      )}
      {viewMode === "routines" && selectedCharacter && (
        <DetailPanel
          point={null}
          character={selectedCharacter}
          dbStatuses={[]}
          onClose={() => setSelectedCharacterId(null)}
        />
      )}

      {/* Add stop dialog */}
      {pendingStopCoord && (
        <div style={{
          position: "fixed", bottom: 60, left: "50%", transform: "translateX(-50%)",
          background: "var(--panel)", border: "1px solid var(--panel-border)",
          borderRadius: 10, padding: 16, zIndex: 200, display: "flex", gap: 12, alignItems: "center",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {pendingStopCoord.poiName ? (
              <span>Snapped to <strong style={{ color: "#F5A855" }}>{pendingStopCoord.poiName}</strong></span>
            ) : (
              <span>Custom location</span>
            )}
          </div>
          <input
            type="time"
            value={pendingStopTime}
            onChange={(e) => setPendingStopTime(e.target.value)}
            style={{
              background: "rgba(58, 50, 38, 0.2)", border: "1px solid var(--panel-border)",
              color: "var(--text)", padding: "4px 8px", borderRadius: 6, fontSize: 12,
              fontFamily: "inherit",
            }}
          />
          <div style={{ display: "flex", gap: 4 }}>
            {["inside", "sleep", "work", "idle"].map((tag) => (
              <button key={tag} onClick={() => {
                setPendingStopTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
              }} style={{
                padding: "3px 8px", borderRadius: 10, fontSize: 10, cursor: "pointer", fontFamily: "inherit",
                background: pendingStopTags.includes(tag) ? "rgba(245,168,85,0.2)" : "transparent",
                border: pendingStopTags.includes(tag) ? "1px solid #F5A855" : "1px solid var(--panel-border)",
                color: pendingStopTags.includes(tag) ? "#F5A855" : "var(--text-muted)",
              }}>
                {tag}
              </button>
            ))}
          </div>
          <button onClick={handleConfirmStop} style={{
            background: "#F5A855", border: "none", color: "#3A3226",
            padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            Add
          </button>
          <button onClick={() => setPendingStopCoord(null)} style={{
            background: "transparent", border: "1px solid var(--panel-border)",
            color: "var(--text-muted)", padding: "6px 10px", borderRadius: 6, fontSize: 12,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            Cancel
          </button>
        </div>
      )}

      {/* Adding stop indicator */}
      {addingStop && !pendingStopCoord && (
        <div style={{
          position: "fixed", bottom: 12, left: "50%", transform: "translateX(-50%)",
          background: "rgba(245, 168, 85, 0.9)", color: "#3A3226", padding: "8px 16px",
          borderRadius: 6, fontSize: 13, fontWeight: 600, zIndex: 200,
        }}>
          Click on the map to add a stop — press Esc to cancel
        </div>
      )}
    </>
  );
}
