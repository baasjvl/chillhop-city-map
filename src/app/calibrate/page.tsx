"use client";

import { useEffect, useState, useRef, useCallback } from "react";

/**
 * Calibration page: the OLD map is shown as a fixed background. The NEW map
 * is overlaid on top with adjustable opacity and drag-to-position.
 * Scale is fixed (same pixel-per-unit across maps) — only offset changes.
 */

const NEW_MAP_SRC = "/maps/23032026linework.jpg";
const OLD_MAP_SRC = "/maps/city-macro.jpg";
const OLD_W = 7809;
const OLD_H = 2134;

export default function CalibratePage() {
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New map image natural size
  const [newImgSize, setNewImgSize] = useState({ w: 0, h: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);

  // Container measurement
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  // New map offset in container pixels (top-left of new map image)
  const [mapX, setMapX] = useState(0);
  const [mapY, setMapY] = useState(0);

  // Display scale (both maps rendered at the same scale, just for fitting in viewport)
  const [viewScale, setViewScale] = useState(1);

  // Drag state
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, mapX: 0, mapY: 0 });

  // Opacity of new map overlay
  const [opacity, setOpacity] = useState(0.6);

  // Reference rect: the old map fitted into the container (preserving aspect ratio)
  const getRefRect = useCallback(() => {
    const { w: cw, h: ch } = containerSize;
    const oldAspect = OLD_W / OLD_H;
    const containerAspect = cw / ch;
    let refW: number, refH: number, refX: number, refY: number;
    if (containerAspect > oldAspect) {
      refH = ch;
      refW = ch * oldAspect;
      refX = (cw - refW) / 2;
      refY = 0;
    } else {
      refW = cw;
      refH = cw / oldAspect;
      refX = 0;
      refY = (ch - refH) / 2;
    }
    return { refX, refY, refW, refH };
  }, [containerSize]);

  // Load new map image
  useEffect(() => {
    const img = new Image();
    img.src = NEW_MAP_SRC;
    img.onload = () => {
      setNewImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      setImgLoaded(true);
    };
  }, []);

  // Measure container
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setContainerSize({ w: width, h: height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Initialize: position new map so its top-left aligns with old map's top-left
  const initialized = useRef(false);
  useEffect(() => {
    if (!imgLoaded || containerSize.w === 0 || containerSize.h === 0 || initialized.current) return;
    initialized.current = true;
    const { refX, refY, refW } = getRefRect();
    // Both maps use the same pixel scale: 1 old-map-pixel = 1 new-map-pixel
    const s = refW / OLD_W;
    setViewScale(s);
    // Start with new map aligned at old map's top-left
    setMapX(refX);
    setMapY(refY);
  }, [imgLoaded, containerSize, newImgSize, getRefRect]);

  const ready = imgLoaded && containerSize.w > 0 && containerSize.h > 0;

  // Mouse handlers for dragging the new map
  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, mapX, mapY };
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setMapX(dragStart.current.mapX + dx);
    setMapY(dragStart.current.mapY + dy);
  }, []);

  const handleMouseUp = useCallback(() => {
    dragging.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Compute and save the affine transform
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const { refX, refY } = getRefRect();

      // The pixel offset of old map's origin on the new map image
      // In container space: old map starts at (refX, refY), new map starts at (mapX, mapY)
      // So old map origin is at new-map pixel: (refX - mapX) / viewScale, (refY - mapY) / viewScale
      const offsetX = (refX - mapX) / viewScale;
      const offsetY = (refY - mapY) / viewScale;

      // Affine: pin (px, py) → new map normalized coords
      // newNormX = (px * OLD_W + offsetX) / newW
      // newNormY = (py * OLD_H + offsetY) / newH
      const a = OLD_W / newImgSize.w;
      const c = offsetX / newImgSize.w;
      const e = OLD_H / newImgSize.h;
      const f = offsetY / newImgSize.h;

      const config = {
        image: NEW_MAP_SRC,
        width: newImgSize.w,
        height: newImgSize.h,
        transform: { a, b: 0, c, d: 0, e, f },
      };

      const res = await fetch("/api/map-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "DM Sans, sans-serif",
        overflow: "hidden",
        background: "#1a1612",
        color: "#F5F0E8",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          height: 48,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          background: "#2A2520",
          borderBottom: "1px solid rgba(245,240,232,0.1)",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/" style={{ color: "rgba(245,240,232,0.5)", fontSize: 13, textDecoration: "none" }}>
            &larr; Back to map
          </a>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Map Calibration</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <label style={{ fontSize: 12, color: "rgba(245,240,232,0.5)", display: "flex", alignItems: "center", gap: 8 }}>
            Opacity
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              style={{ width: 100 }}
            />
          </label>

          {error && (
            <span style={{ fontSize: 12, color: "#dc3c3c" }}>{error}</span>
          )}

          {done ? (
            <span style={{ fontSize: 13, color: "#50c878" }}>
              Saved! <a href="/" style={{ color: "#F5A855" }}>View map</a>
            </span>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving || !ready}
              style={{
                background: "#F5A855",
                color: "#2A2520",
                border: "none",
                borderRadius: 6,
                padding: "6px 16px",
                fontSize: 13,
                fontWeight: 600,
                cursor: saving ? "wait" : "pointer",
              }}
            >
              {saving ? "Saving..." : "Save & Apply"}
            </button>
          )}
        </div>
      </div>

      {/* Hint */}
      <div
        style={{
          padding: "6px 16px",
          fontSize: 12,
          color: "rgba(245,240,232,0.4)",
          background: "rgba(42,37,32,0.5)",
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        Drag the new map to align it with the current map underneath, then save.
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          cursor: "grab",
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Old map — fixed background */}
        {ready && (
          <img
            src={OLD_MAP_SRC}
            alt="Current map"
            draggable={false}
            style={{
              position: "absolute",
              left: getRefRect().refX,
              top: getRefRect().refY,
              width: OLD_W * viewScale,
              height: OLD_H * viewScale,
              userSelect: "none",
              pointerEvents: "none",
            }}
          />
        )}

        {/* New map image — draggable overlay, same pixel scale */}
        {ready && (
          <img
            src={NEW_MAP_SRC}
            alt="New map"
            draggable={false}
            style={{
              position: "absolute",
              left: mapX,
              top: mapY,
              width: newImgSize.w * viewScale,
              height: newImgSize.h * viewScale,
              opacity,
              userSelect: "none",
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </div>
  );
}
