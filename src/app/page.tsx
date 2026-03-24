"use client";

import { useEffect, useState, useCallback } from "react";
import type { NotablePoint, MapTag, ViewMode } from "@/lib/types";
import Toolbar from "@/components/Toolbar";
import Sidebar from "@/components/Sidebar";
import TagsSidebar from "@/components/TagsSidebar";
import MapCanvas from "@/components/MapCanvas";
import DetailPanel from "@/components/DetailPanel";

export default function Home() {
  const [points, setPoints] = useState<NotablePoint[]>([]);
  const [tags, setTags] = useState<MapTag[]>([]);
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

  // Fetch points from API
  const fetchPoints = useCallback(async (refresh = false) => {
    try {
      const url = refresh ? "/api/notable-points?refresh=true" : "/api/notable-points";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPoints(data.points);
        if (data.options) setDbOptions(data.options);
      }
    } catch (err) {
      console.error("Failed to fetch points:", err);
    }
  }, []);

  // Fetch tags from API
  const fetchTags = useCallback(async (refresh = false) => {
    try {
      const url = refresh ? "/api/map-tags?refresh=true" : "/api/map-tags";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTags(data.tags);
        if (data.tagTypes) setDbTagTypes(data.tagTypes);
      }
    } catch (err) {
      console.error("Failed to fetch tags:", err);
    }
  }, []);

  // Check auth + fetch data on load
  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          setIsAuthenticated(true);
          setAuthorName(data.name);
        }
      });
    Promise.all([fetchPoints(), fetchTags()]).finally(() => setLoading(false));
  }, [fetchPoints, fetchTags]);

  const handleRefresh = () => {
    fetchPoints(true);
    fetchTags(true);
  };

  // Handle login
  const handleLogin = async (name: string, password: string): Promise<boolean> => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });
    if (res.ok) {
      setIsAuthenticated(true);
      setAuthorName(name);
      return true;
    }
    return false;
  };

  // Select helpers
  const selectPoi = (id: string | null) => {
    setSelectedId(id);
    setSelectedKind(id ? "poi" : null);
  };

  const selectTag = (id: string | null) => {
    setSelectedId(id);
    setSelectedKind(id ? "tag" : null);
  };

  // === POI handlers ===
  const handlePlacePin = async (id: string, x: number, y: number) => {
    if (placingKind === "tag") {
      return handlePlaceTag(id, x, y);
    }
    const prev = points;
    setPoints((pts) => pts.map((p) => (p.id === id ? { ...p, x, y } : p)));
    setPlacingId(null);
    setPlacingKind(null);
    selectPoi(id);
    try {
      const res = await fetch("/api/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: id, x, y }),
      });
      if (!res.ok) {
        alert("Failed to save pin position");
        setPoints(prev);
      }
    } catch {
      setPoints(prev);
    }
  };

  const handleCreatePoint = async (name: string) => {
    try {
      const res = await fetch("/api/create-point", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const point = await res.json();
        setPoints((pts) => [...pts, point]);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create entry");
      }
    } catch {
      alert("Failed to create entry");
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const prev = points;
    setPoints((pts) => pts.map((p) => (p.id === id ? { ...p, status } : p)));
    try {
      const res = await fetch("/api/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: id, status }),
      });
      if (!res.ok) {
        setPoints(prev);
      }
    } catch {
      setPoints(prev);
    }
  };

  const handleRemovePin = async (id: string) => {
    const prev = points;
    setPoints((pts) => pts.map((p) => (p.id === id ? { ...p, x: null, y: null } : p)));
    if (selectedId === id) selectPoi(null);
    try {
      const res = await fetch("/api/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: id, x: null, y: null }),
      });
      if (!res.ok) setPoints(prev);
    } catch {
      setPoints(prev);
    }
  };

  // === Tag handlers ===
  const handlePlaceTag = async (id: string, x: number, y: number) => {
    const prev = tags;
    setTags((ts) => ts.map((t) => (t.id === id ? { ...t, x, y } : t)));
    setPlacingId(null);
    setPlacingKind(null);
    selectTag(id);
    try {
      const res = await fetch("/api/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: id, x, y }),
      });
      if (!res.ok) setTags(prev);
    } catch {
      setTags(prev);
    }
  };

  const handleCreateTag = async (name: string, tagType: string) => {
    try {
      const res = await fetch("/api/create-tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, tagType, addedBy: authorName }),
      });
      if (res.ok) {
        const tag = await res.json();
        setTags((ts) => [...ts, tag]);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create tag");
      }
    } catch {
      alert("Failed to create tag");
    }
  };

  const handleUpdateTag = async (id: string, updates: { done?: boolean; tagType?: string }) => {
    const prev = tags;
    setTags((ts) => ts.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    try {
      const res = await fetch("/api/update-tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: id, ...updates }),
      });
      if (!res.ok) setTags(prev);
    } catch {
      setTags(prev);
    }
  };

  const handleRemoveTag = async (id: string) => {
    const prev = tags;
    setTags((ts) => ts.map((t) => (t.id === id ? { ...t, x: null, y: null } : t)));
    if (selectedId === id) selectTag(null);
    try {
      const res = await fetch("/api/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: id, x: null, y: null }),
      });
      if (!res.ok) setTags(prev);
    } catch {
      setTags(prev);
    }
  };

  // Start placement mode
  const handleStartPlacePoi = (id: string) => {
    if (!isAuthenticated) { alert("Sign in to place pins"); return; }
    setPlacingId(id);
    setPlacingKind("poi");
    setSelectedId(null);
    setSelectedKind(null);
  };

  const handleStartPlaceTag = (id: string) => {
    if (!isAuthenticated) { alert("Sign in to place tags"); return; }
    setPlacingId(id);
    setPlacingKind("tag");
    setSelectedId(null);
    setSelectedKind(null);
  };

  // View mode change clears selection
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setSelectedId(null);
    setSelectedKind(null);
    setPlacingId(null);
    setPlacingKind(null);
  };

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (placingId) { setPlacingId(null); setPlacingKind(null); }
        else if (selectedId) { setSelectedId(null); setSelectedKind(null); }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [placingId, selectedId]);

  const selectedPoint = selectedKind === "poi" ? (points.find((p) => p.id === selectedId) ?? null) : null;
  const selectedTag = selectedKind === "tag" ? (tags.find((t) => t.id === selectedId) ?? null) : null;

  // Build ghost POI pins for tag view
  const ghostPoints = viewMode === "tags" && showPoisInTagView ? points : [];

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
      />
      {viewMode === "pois" ? (
        <Sidebar
          points={points}
          dbTypes={dbOptions.types}
          dbStatuses={dbOptions.statuses}
          selectedId={selectedId}
          placingId={placingId}
          isOpen={sidebarOpen}
          isAuthenticated={isAuthenticated}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onSelectPin={selectPoi}
          onStartPlace={handleStartPlacePoi}
          onCreatePoint={handleCreatePoint}
          onRemovePin={handleRemovePin}
        />
      ) : (
        <TagsSidebar
          tags={tags}
          dbTagTypes={dbTagTypes}
          selectedId={selectedId}
          placingId={placingId}
          isOpen={sidebarOpen}
          isAuthenticated={isAuthenticated}
          showPois={showPoisInTagView}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onSelectTag={selectTag}
          onStartPlace={handleStartPlaceTag}
          onCreateTag={handleCreateTag}
          onRemoveTag={handleRemoveTag}
          onTogglePois={() => setShowPoisInTagView(!showPoisInTagView)}
        />
      )}
      <MapCanvas
        points={viewMode === "pois" ? points : []}
        tags={viewMode === "tags" ? tags : []}
        ghostPoints={ghostPoints}
        selectedId={selectedId}
        placingId={placingId}
        onSelectPin={viewMode === "pois" ? selectPoi : selectTag}
        onPlacePin={handlePlacePin}
        sidebarOpen={sidebarOpen}
      />
      {selectedPoint && (
        <DetailPanel
          point={selectedPoint}
          dbStatuses={dbOptions.statuses}
          onClose={() => selectPoi(null)}
          onStartPlace={isAuthenticated ? handleStartPlacePoi : undefined}
          onUpdateStatus={isAuthenticated ? handleUpdateStatus : undefined}
        />
      )}
      {selectedTag && (
        <DetailPanel
          point={null}
          tag={selectedTag}
          dbStatuses={[]}
          dbTagTypes={dbTagTypes}
          onClose={() => selectTag(null)}
          onStartPlace={isAuthenticated ? handleStartPlaceTag : undefined}
          onUpdateTag={isAuthenticated ? handleUpdateTag : undefined}
        />
      )}
    </>
  );
}
