"use client";

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchContentRef,
} from "react-zoom-pan-pinch";
import type { NotablePoint, MapTag, RoutineStop } from "@/lib/types";
import { getTypeColor, getTagTypeColor } from "@/lib/colors";
import { getPoiIcon, getTagIcon } from "@/lib/icons";

interface Pinnable {
  id: string;
  x: number;
  y: number;
  kind: "poi" | "tag";
}

interface MapCanvasProps {
  points: NotablePoint[];
  tags?: MapTag[];
  ghostPoints?: NotablePoint[];
  routineStops?: RoutineStop[];
  selectedId: string | null;
  placingId: string | null;
  onSelectPin: (id: string | null) => void;
  onPlacePin: (id: string, x: number, y: number) => void;
  onRoutineMapClick?: (x: number, y: number, nearestPoi: NotablePoint | null) => void;
  addingRoutineStop?: boolean;
  sidebarOpen: boolean;
}

const PIN_SIZE = 28;
const PIN_SIZE_HOVER = 34;
const TAG_SIZE = 22;
const TAG_SIZE_HOVER = 26;
const LABEL_OFFSET = 20;
const DRAG_THRESHOLD = 5;

export default function MapCanvas({
  points,
  tags = [],
  ghostPoints = [],
  routineStops = [],
  selectedId,
  placingId,
  onSelectPin,
  onPlacePin,
  onRoutineMapClick,
  addingRoutineStop = false,
  sidebarOpen,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchContentRef>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [containerWidth, setContainerWidth] = useState(0);
  const [mapImage, setMapImage] = useState("/maps/city-macro.jpg");

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [cursorMapPos, setCursorMapPos] = useState<{ x: number; y: number } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingPos, setDraggingPos] = useState<{ x: number; y: number } | null>(null);

  const transformStateRef = useRef({ scale: 1, positionX: 0, positionY: 0 });
  const [transformState, setTransformState] = useState({ scale: 1, positionX: 0, positionY: 0 });
  const initialScaleRef = useRef(1);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const selectedFromMapRef = useRef(false);

  // Build combined interactive pin list
  const allPins: Pinnable[] = [
    ...points.filter((p) => p.x !== null && p.y !== null).map((p) => ({ id: p.id, x: p.x!, y: p.y!, kind: "poi" as const })),
    ...tags.filter((t) => t.x !== null && t.y !== null).map((t) => ({ id: t.id, x: t.x!, y: t.y!, kind: "tag" as const })),
  ];

  // Load map config, then map image
  useEffect(() => {
    fetch("/maps/config.json")
      .then((r) => r.json())
      .then((config: { image: string }) => {
        setMapImage(config.image);
        const img = new Image();
        img.src = config.image;
        img.onload = () => {
          setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
          setImgLoaded(true);
        };
      })
      .catch(() => {
        const img = new Image();
        img.src = "/maps/city-macro.jpg";
        img.onload = () => {
          setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
          setImgLoaded(true);
        };
      });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      if (width > 0) { setContainerWidth(width); observer.disconnect(); }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const ready = imgLoaded && containerWidth > 0;
  const initialScale = ready ? containerWidth / imgSize.w : 1;

  useEffect(() => {
    if (ready) initialScaleRef.current = initialScale;
  }, [ready, initialScale]);

  // Zoom to selected pin from sidebar
  useEffect(() => {
    if (!selectedId || !transformRef.current) return;
    if (selectedFromMapRef.current) { selectedFromMapRef.current = false; return; }
    const pin = allPins.find((p) => p.id === selectedId);
    if (!pin) return;
    const wrapper = transformRef.current.instance.wrapperComponent;
    if (!wrapper) return;
    const ww = wrapper.clientWidth;
    const wh = wrapper.clientHeight;
    const currentScale = transformStateRef.current.scale;
    const targetScale = Math.max(currentScale, initialScaleRef.current * 1.5);
    const posX = ww / 2 - pin.x * imgSize.w * targetScale;
    const posY = wh / 2 - pin.y * imgSize.h * targetScale;
    transformRef.current.setTransform(posX, posY, targetScale, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, imgSize]);

  const screenToMap = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const { scale, positionX, positionY } = transformStateRef.current;
    return {
      x: (clientX - rect.left - positionX) / scale / imgSize.w,
      y: (clientY - rect.top - positionY) / scale / imgSize.h,
    };
  }, [imgSize]);

  const findPinAt = useCallback((clientX: number, clientY: number): Pinnable | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;
    const { scale, positionX, positionY } = transformStateRef.current;
    const boost = 1 + Math.max(0, Math.log2(scale)) * 0.2;
    for (let i = allPins.length - 1; i >= 0; i--) {
      const p = allPins[i];
      const px = p.x * imgSize.w * scale + positionX;
      const py = p.y * imgSize.h * scale + positionY;

      if (p.kind === "poi") {
        // Marker shape: anchor is at bottom tip, round part is above
        const markerH = PIN_SIZE_HOVER * 1.3 * boost;
        const markerW = PIN_SIZE_HOVER * boost;
        // Check if click is within the marker bounding box
        const dx = Math.abs(relX - px);
        const dy = py - relY; // positive = above anchor (inside marker)
        if (dx <= markerW / 2 + 4 && dy >= -4 && dy <= markerH + 4) return p;
      } else {
        // Diamond tag: centered on the point
        const hitR = TAG_SIZE_HOVER / 2 * boost + 4;
        const dist = Math.sqrt((relX - px) ** 2 + (relY - py) ** 2);
        if (dist <= hitR) return p;
      }
    }
    return null;
  }, [allPins, imgSize]);

  const handleMouseDown = (e: ReactMouseEvent) => {
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    if (placingId) return;
    const pin = findPinAt(e.clientX, e.clientY);
    if (pin && pin.id === selectedId) {
      setDraggingId(pin.id);
      setDraggingPos({ x: pin.x, y: pin.y });
    }
  };

  const handleMouseMove = (e: ReactMouseEvent) => {
    if (draggingId) {
      const pos = screenToMap(e.clientX, e.clientY);
      if (pos) setDraggingPos({ x: Math.max(0, Math.min(1, pos.x)), y: Math.max(0, Math.min(1, pos.y)) });
      return;
    }
    if (placingId) { setCursorMapPos(screenToMap(e.clientX, e.clientY)); return; }
    const pin = findPinAt(e.clientX, e.clientY);
    if (pin) { setHoveredId(pin.id); return; }
    // Check ghost POI pins for hover (label only, not interactive)
    if (ghostPoints.length > 0 && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      const { scale, positionX, positionY } = transformStateRef.current;
      const boost = 1 + Math.max(0, Math.log2(scale)) * 0.2;
      const markerH = PIN_SIZE * 1.3 * boost;
      const markerW = PIN_SIZE * boost;
      for (let i = ghostPoints.length - 1; i >= 0; i--) {
        const gp = ghostPoints[i];
        if (gp.x === null || gp.y === null) continue;
        const px = gp.x * imgSize.w * scale + positionX;
        const py = gp.y * imgSize.h * scale + positionY;
        const dx = Math.abs(relX - px);
        const dy = py - relY;
        if (dx <= markerW / 2 + 4 && dy >= -4 && dy <= markerH + 4) {
          setHoveredId(gp.id);
          return;
        }
      }
    }
    setHoveredId(null);
  };

  const handleMouseUp = () => {
    if (draggingId && draggingPos) {
      const pin = allPins.find((p) => p.id === draggingId);
      if (pin) {
        const { scale } = transformStateRef.current;
        const dx = (draggingPos.x - pin.x) * imgSize.w * scale;
        const dy = (draggingPos.y - pin.y) * imgSize.h * scale;
        if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
          onPlacePin(draggingId, draggingPos.x, draggingPos.y);
        }
      }
      setDraggingId(null);
      setDraggingPos(null);
    }
  };

  const handleMouseLeave = () => {
    if (draggingId) { setDraggingId(null); setDraggingPos(null); }
  };

  const handleClick = (e: ReactMouseEvent) => {
    if (mouseDownPosRef.current) {
      const dx = e.clientX - mouseDownPosRef.current.x;
      const dy = e.clientY - mouseDownPosRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) return;
    }
    if (addingRoutineStop && onRoutineMapClick) {
      const pos = screenToMap(e.clientX, e.clientY);
      if (pos && pos.x >= 0 && pos.x <= 1 && pos.y >= 0 && pos.y <= 1) {
        // Find nearest POI within snap distance
        const SNAP_DIST = 0.02; // ~2% of map
        let nearest: NotablePoint | null = null;
        let nearestDist = Infinity;
        for (const p of points) {
          if (p.x === null || p.y === null) continue;
          const d = Math.sqrt((pos.x - p.x) ** 2 + (pos.y - p.y) ** 2);
          if (d < SNAP_DIST && d < nearestDist) { nearest = p; nearestDist = d; }
        }
        // Also check ghostPoints
        for (const p of ghostPoints) {
          if (p.x === null || p.y === null) continue;
          const d = Math.sqrt((pos.x - p.x) ** 2 + (pos.y - p.y) ** 2);
          if (d < SNAP_DIST && d < nearestDist) { nearest = p; nearestDist = d; }
        }
        onRoutineMapClick(pos.x, pos.y, nearest);
      }
      return;
    }
    if (placingId) {
      const pos = screenToMap(e.clientX, e.clientY);
      if (pos && pos.x >= 0 && pos.x <= 1 && pos.y >= 0 && pos.y <= 1) {
        onPlacePin(placingId, pos.x, pos.y);
      }
      return;
    }
    const pin = findPinAt(e.clientX, e.clientY);
    if (pin) selectedFromMapRef.current = true;
    onSelectPin(pin?.id ?? null);
  };

  let cursor = "grab";
  if (draggingId) cursor = "grabbing";
  if (placingId || addingRoutineStop) cursor = "crosshair";
  if (hoveredId && !placingId && !draggingId && !addingRoutineStop) cursor = "pointer";

  // Gentle scale-up when zooming in (grows ~20% per doubling of zoom past 100%)
  const pinScaleBoost = 1 + Math.max(0, Math.log2(transformState.scale)) * 0.2;

  // Helper to get screen position
  const toScreen = (x: number, y: number) => ({
    sx: x * imgSize.w * transformState.scale + transformState.positionX,
    sy: y * imgSize.h * transformState.scale + transformState.positionY,
  });

  return (
    <div
      ref={containerRef}
      className="fixed top-12 bottom-0 right-0 overflow-hidden"
      style={{ left: sidebarOpen ? 300 : 0, cursor, transition: "left 0.2s ease", background: "#1a1612" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {ready && (
        <TransformWrapper
          ref={transformRef}
          initialScale={initialScale}
          centerOnInit
          minScale={0.1}
          maxScale={10}
          smooth
          panning={{ disabled: !!draggingId }}
          velocityAnimation={{ sensitivity: 1, animationTime: 400 }}
          onTransformed={(_ref, state) => { transformStateRef.current = state; setTransformState(state); }}
        >
          <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mapImage}
              alt="City map"
              width={imgSize.w}
              height={imgSize.h}
              draggable={false}
              style={{ display: "block", userSelect: "none", maxWidth: "none" }}
            />
          </TransformComponent>
        </TransformWrapper>
      )}

      {/* Ghost POI pins (dimmed, with hover labels) */}
      {ghostPoints.filter((p) => p.x !== null && p.y !== null).map((p) => {
        const color = getTypeColor(p.type);
        const ghostW = PIN_SIZE * pinScaleBoost;
        const ghostH = ghostW * 1.3;
        const iconSize = Math.max(10, ghostW * 0.5);
        const { sx, sy } = toScreen(p.x!, p.y!);
        const isGhostHovered = p.id === hoveredId;
        return (
          <div key={`ghost-${p.id}`} style={{
            position: "absolute", left: sx, top: sy, transform: "translate(-50%, -100%)",
            zIndex: 5, pointerEvents: "none",
          }}>
            <svg width={ghostW} height={ghostH} viewBox="0 0 30 39" style={{
              filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5)) drop-shadow(0 0 4px rgba(255,255,255,0.2))",
            }}>
              <path
                d="M15 38 C15 38 1 24 1 14 A14 14 0 1 1 29 14 C29 24 15 38 15 38Z"
                fill={color}
                stroke="rgba(255,255,255,0.9)"
                strokeWidth={2}
              />
            </svg>
            <div style={{
              position: "absolute", top: ghostH * 0.02, left: 0, width: ghostW, height: ghostW,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {getPoiIcon(p.type, { size: iconSize, color: "rgba(255,255,255,0.9)" })}
            </div>
            {isGhostHovered && (
              <div style={{
                position: "absolute", top: ghostH + 4, left: "50%", transform: "translateX(-50%)",
                fontSize: 11, whiteSpace: "nowrap", background: "rgba(58, 50, 38, 0.9)",
                padding: "2px 8px", borderRadius: 4, color: "#F5F0E8", pointerEvents: "none",
              }}>
                {p.name}
              </div>
            )}
          </div>
        );
      })}

      {/* POI pins */}
      {points.filter((p) => p.x !== null && p.y !== null).map((p) => {
        const isSelected = p.id === selectedId;
        const isHovered = p.id === hoveredId;
        const isDragging = p.id === draggingId;
        const color = getTypeColor(p.type);
        const pinW = (isSelected || isHovered ? PIN_SIZE_HOVER : PIN_SIZE) * pinScaleBoost;
        const pinX = isDragging && draggingPos ? draggingPos.x : p.x!;
        const pinY = isDragging && draggingPos ? draggingPos.y : p.y!;
        const { sx, sy } = toScreen(pinX, pinY);

        const pinH = pinW * 1.3; // taller than wide for the pointed bottom
        const iconSize = Math.max(10, pinW * 0.5);

        return (
          <div key={p.id} style={{
            position: "absolute", left: sx, top: sy, transform: "translate(-50%, -100%)",
            zIndex: isDragging ? 30 : isSelected ? 20 : isHovered ? 15 : 10,
            pointerEvents: "none",
          }}>
            <svg width={pinW} height={pinH} viewBox="0 0 30 39" style={{
              filter: isDragging
                ? "drop-shadow(0 2px 4px rgba(0,0,0,0.6))"
                : "drop-shadow(0 1px 3px rgba(0,0,0,0.5)) drop-shadow(0 0 4px rgba(255,255,255,0.2))",
              opacity: isDragging ? 0.8 : 1,
              transition: "width 0.1s, height 0.1s",
            }}>
              {/* Marker shape: rounded top, pointed bottom */}
              <path
                d="M15 38 C15 38 1 24 1 14 A14 14 0 1 1 29 14 C29 24 15 38 15 38Z"
                fill={color}
                stroke="rgba(255,255,255,0.9)"
                strokeWidth={2}
              />
            </svg>
            {/* Icon centered in the round part */}
            <div style={{
              position: "absolute",
              top: pinH * 0.02,
              left: 0,
              width: pinW,
              height: pinW,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {getPoiIcon(p.type, { size: iconSize, color: "rgba(255,255,255,0.9)" })}
            </div>
            {(isHovered || isSelected) && !isDragging && (
              <div style={{
                position: "absolute", top: pinH + 4, left: "50%", transform: "translateX(-50%)",
                fontSize: 11, whiteSpace: "nowrap", background: "rgba(58, 50, 38, 0.9)",
                padding: "2px 8px", borderRadius: 4, color: "#F5F0E8", pointerEvents: "none",
              }}>
                {p.name}
              </div>
            )}
          </div>
        );
      })}

      {/* Tag pins (diamond shape) */}
      {tags.filter((t) => t.x !== null && t.y !== null).map((t) => {
        const isSelected = t.id === selectedId;
        const isHovered = t.id === hoveredId;
        const isDragging = t.id === draggingId;
        const color = getTagTypeColor(t.tagType);
        const size = (isSelected || isHovered ? TAG_SIZE_HOVER : TAG_SIZE) * pinScaleBoost;
        const pinX = isDragging && draggingPos ? draggingPos.x : t.x!;
        const pinY = isDragging && draggingPos ? draggingPos.y : t.y!;
        const { sx, sy } = toScreen(pinX, pinY);

        return (
          <div key={t.id} style={{
            position: "absolute", left: sx, top: sy, transform: "translate(-50%, -50%)",
            zIndex: isDragging ? 30 : isSelected ? 20 : isHovered ? 15 : 10,
            pointerEvents: "none",
          }}>
            <div style={{
              width: size, height: size, transform: "rotate(45deg)", borderRadius: 2,
              background: color,
              border: "2px solid rgba(255,255,255,0.9)",
              boxShadow: isDragging ? "0 2px 8px rgba(0,0,0,0.6)" : "0 1px 4px rgba(0,0,0,0.4), 0 0 6px rgba(255,255,255,0.3)",
              transition: "width 0.1s, height 0.1s",
              opacity: isDragging ? 0.8 : t.done ? 0.4 : 1,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ transform: "rotate(-45deg)", lineHeight: 0 }}>
                {getTagIcon(t.tagType, { size: Math.max(8, size * 0.6), color: "rgba(255,255,255,0.9)" })}
              </span>
            </div>
            {(isHovered || isSelected) && !isDragging && (
              <div style={{
                position: "absolute", top: LABEL_OFFSET, left: "50%", transform: "translateX(-50%)",
                fontSize: 11, whiteSpace: "nowrap", background: "rgba(58, 50, 38, 0.9)",
                padding: "2px 8px", borderRadius: 4, color: "#F5F0E8", pointerEvents: "none",
              }}>
                {t.name}
              </div>
            )}
          </div>
        );
      })}

      {/* Routine path: dotted lines + numbered stops */}
      {routineStops.length > 0 && (() => {
        const resolved = routineStops.filter((s) => s.x !== undefined && s.y !== undefined);
        if (resolved.length === 0) return null;
        return (
          <>
            {/* SVG overlay for dotted path lines */}
            <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 6 }}>
              {resolved.map((stop, i) => {
                if (i === 0) return null;
                const prev = resolved[i - 1];
                const { sx: x1, sy: y1 } = toScreen(prev.x!, prev.y!);
                const { sx: x2, sy: y2 } = toScreen(stop.x!, stop.y!);
                return (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="#F5A855" strokeWidth={2} strokeDasharray="6 4" opacity={0.7} />
                );
              })}
            </svg>
            {/* Stop markers */}
            {resolved.map((stop, i) => {
              const { sx, sy } = toScreen(stop.x!, stop.y!);
              const isInside = stop.tags.includes("inside");
              return (
                <div key={`stop-${i}`} style={{
                  position: "absolute", left: sx, top: sy, transform: "translate(-50%, -50%)",
                  zIndex: 7, pointerEvents: "none",
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: isInside ? "rgba(245, 168, 85, 0.4)" : "#F5A855",
                    border: isInside ? "2px dashed rgba(255,255,255,0.6)" : "2px solid rgba(255,255,255,0.9)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, color: isInside ? "rgba(255,255,255,0.7)" : "#3A3226",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                  }}>
                    {i + 1}
                  </div>
                  <div style={{
                    position: "absolute", top: 24, left: "50%", transform: "translateX(-50%)",
                    fontSize: 10, whiteSpace: "nowrap", background: "rgba(58, 50, 38, 0.9)",
                    padding: "1px 6px", borderRadius: 3, color: "#F5F0E8",
                  }}>
                    {stop.time} — {stop.location}
                    {stop.tags.length > 0 && ` [${stop.tags.join(", ")}]`}
                  </div>
                </div>
              );
            })}
          </>
        );
      })()}

      {/* Placement preview */}
      {placingId && cursorMapPos && (() => {
        const { sx, sy } = toScreen(cursorMapPos.x, cursorMapPos.y);
        return (
          <div style={{ position: "absolute", left: sx, top: sy, transform: "translate(-50%, -50%)", zIndex: 30, pointerEvents: "none" }}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(245, 168, 85, 0.6)", border: "2px dashed #F5A855" }} />
          </div>
        );
      })()}

      {/* Zoom indicator */}
      <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(58, 50, 38, 0.8)", padding: "4px 10px", borderRadius: 4, fontSize: 11, color: "rgba(245, 240, 232, 0.5)" }}>
        {Math.round(transformState.scale * 100)}%
      </div>

      {/* Placement mode indicator */}
      {placingId && (
        <div style={{
          position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
          background: "rgba(245, 168, 85, 0.9)", color: "#3A3226", padding: "8px 16px",
          borderRadius: 6, fontSize: 13, fontWeight: 600,
        }}>
          Click on the map to place — press Esc to cancel
        </div>
      )}
    </div>
  );
}
