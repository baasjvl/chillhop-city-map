"use client";

import { useEffect, useState, useCallback } from "react";
import type { NotablePoint } from "@/lib/types";
import Toolbar from "@/components/Toolbar";
import Sidebar from "@/components/Sidebar";
import MapCanvas from "@/components/MapCanvas";
import DetailPanel from "@/components/DetailPanel";

export default function Home() {
  const [points, setPoints] = useState<NotablePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placingId, setPlacingId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authorName, setAuthorName] = useState("");

  // Fetch points from API
  const fetchPoints = useCallback(async (refresh = false) => {
    try {
      const url = refresh
        ? "/api/notable-points?refresh=true"
        : "/api/notable-points";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPoints(data);
      }
    } catch (err) {
      console.error("Failed to fetch points:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check auth status on load
  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          setIsAuthenticated(true);
          setAuthorName(data.name);
        }
      });
    fetchPoints();
  }, [fetchPoints]);

  // Handle login
  const handleLogin = async (
    name: string,
    password: string
  ): Promise<boolean> => {
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

  // Handle pin placement
  const handlePlacePin = async (id: string, x: number, y: number) => {
    try {
      const res = await fetch("/api/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: id, x, y }),
      });
      if (res.ok) {
        // Update local state immediately
        setPoints((prev) =>
          prev.map((p) => (p.id === id ? { ...p, x, y } : p))
        );
        setPlacingId(null);
        setSelectedId(id);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to place pin");
      }
    } catch (err) {
      console.error("Failed to place pin:", err);
      alert("Failed to place pin");
    }
  };

  // Start placement mode
  const handleStartPlace = (id: string) => {
    if (!isAuthenticated) {
      alert("Sign in to place pins");
      return;
    }
    setPlacingId(id);
    setSelectedId(null);
  };

  // Escape key to cancel placement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (placingId) setPlacingId(null);
        else if (selectedId) setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [placingId, selectedId]);

  const selectedPoint = points.find((p) => p.id === selectedId) ?? null;

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          fontSize: 14,
        }}
      >
        Loading map data...
      </div>
    );
  }

  return (
    <>
      <Toolbar
        isAuthenticated={isAuthenticated}
        authorName={authorName}
        onRefresh={() => fetchPoints(true)}
        onLogin={handleLogin}
      />
      <Sidebar
        points={points}
        selectedId={selectedId}
        placingId={placingId}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onSelectPin={setSelectedId}
        onStartPlace={handleStartPlace}
      />
      <MapCanvas
        points={points}
        selectedId={selectedId}
        placingId={placingId}
        onSelectPin={setSelectedId}
        onPlacePin={handlePlacePin}
        sidebarOpen={sidebarOpen}
      />
      <DetailPanel
        point={selectedPoint}
        onClose={() => setSelectedId(null)}
        onStartPlace={isAuthenticated ? handleStartPlace : undefined}
      />
    </>
  );
}
