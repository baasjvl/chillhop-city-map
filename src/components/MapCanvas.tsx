"use client";

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type MouseEvent,
} from "react";
import type { NotablePoint } from "@/lib/types";
import { getTypeColor } from "@/lib/colors";

interface MapCanvasProps {
  points: NotablePoint[];
  selectedId: string | null;
  placingId: string | null;
  onSelectPin: (id: string | null) => void;
  onPlacePin: (id: string, x: number, y: number) => void;
  sidebarOpen: boolean;
}

const PIN_RADIUS = 7;
const PIN_RADIUS_HOVER = 9;
const LABEL_OFFSET = 16;

export default function MapCanvas({
  points,
  selectedId,
  placingId,
  onSelectPin,
  onPlacePin,
  sidebarOpen,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

  // Pan/zoom state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Hover state
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Cursor position for placement preview
  const [cursorMapPos, setCursorMapPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Fit map to container (height-fit, horizontally centered)
  const fitToView = useCallback(() => {
    if (!containerRef.current || imgSize.w === 0 || imgSize.h === 0) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    if (ch === 0 || cw === 0) return;
    const fitScale = ch / imgSize.h;
    setScale(fitScale);
    setPan({ x: (cw - imgSize.w * fitScale) / 2, y: 0 });
  }, [imgSize]);

  // Load map image
  useEffect(() => {
    const img = new Image();
    img.src = "/maps/city-macro.jpg";
    img.onload = () => {
      imgRef.current = img;
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      setImgLoaded(true);
    };
  }, []);

  // Fit to viewport on load and re-fit on container resize
  useEffect(() => {
    if (!imgLoaded) return;

    // Initial fit (wait for layout)
    const tryFit = () => {
      if (!containerRef.current) return;
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      if (ch === 0 || cw === 0) {
        requestAnimationFrame(tryFit);
        return;
      }
      fitToView();
    };
    requestAnimationFrame(tryFit);

    // Re-fit on container resize (window resize, sidebar toggle, etc.)
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      fitToView();
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [imgLoaded, fitToView]);

  // Screen coords -> normalized map coords (0-1)
  const screenToMap = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      const imgX = (clientX - rect.left - pan.x) / scale;
      const imgY = (clientY - rect.top - pan.y) / scale;
      return {
        x: imgX / imgSize.w,
        y: imgY / imgSize.h,
      };
    },
    [pan, scale, imgSize]
  );

  // Find pin at screen position
  const findPinAt = useCallback(
    (clientX: number, clientY: number): NotablePoint | null => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      const screenX = clientX - rect.left;
      const screenY = clientY - rect.top;

      const placed = points.filter((p) => p.x !== null && p.y !== null);
      // Check in reverse order (top pins first)
      for (let i = placed.length - 1; i >= 0; i--) {
        const p = placed[i];
        const px = p.x! * imgSize.w * scale + pan.x;
        const py = p.y! * imgSize.h * scale + pan.y;
        const dist = Math.sqrt((screenX - px) ** 2 + (screenY - py) ** 2);
        if (dist <= PIN_RADIUS_HOVER + 4) return p;
      }
      return null;
    },
    [points, pan, scale, imgSize]
  );

  // Mouse handlers
  const handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;

    if (placingId) {
      const pos = screenToMap(e.clientX, e.clientY);
      if (pos && pos.x >= 0 && pos.x <= 1 && pos.y >= 0 && pos.y <= 1) {
        onPlacePin(placingId, pos.x, pos.y);
      }
      return;
    }

    const pin = findPinAt(e.clientX, e.clientY);
    if (pin) {
      onSelectPin(pin.id);
      return;
    }

    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isPanning) {
      setPan({
        x: panStartRef.current.panX + (e.clientX - panStartRef.current.x),
        y: panStartRef.current.panY + (e.clientY - panStartRef.current.y),
      });
      return;
    }

    if (placingId) {
      const pos = screenToMap(e.clientX, e.clientY);
      setCursorMapPos(pos);
      return;
    }

    const pin = findPinAt(e.clientX, e.clientY);
    setHoveredId(pin?.id ?? null);
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const oldScale = scale;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(Math.max(scale * delta, 0.1), 10);

      setPan({
        x: mx - (mx - pan.x) * (newScale / oldScale),
        y: my - (my - pan.y) * (newScale / oldScale),
      });
      setScale(newScale);
    },
    [scale, pan]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Click outside to deselect
  const handleContainerClick = (e: MouseEvent) => {
    if (placingId) return;
    const pin = findPinAt(e.clientX, e.clientY);
    if (!pin && !isPanning) {
      onSelectPin(null);
    }
  };

  // Determine cursor style
  let cursor = "grab";
  if (isPanning) cursor = "grabbing";
  if (placingId) cursor = "crosshair";
  if (hoveredId && !placingId) cursor = "pointer";

  const placed = points.filter((p) => p.x !== null && p.y !== null);

  return (
    <div
      ref={containerRef}
      className="fixed top-12 bottom-0 right-0 overflow-hidden"
      style={{
        left: sidebarOpen ? 300 : 0,
        cursor,
        transition: "left 0.2s ease",
        background: "#1a1612",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleContainerClick}
    >
      {/* Map image */}
      {imgLoaded && (
        <div
          style={{
            position: "absolute",
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgRef.current?.src}
            alt="City map"
            width={imgSize.w}
            height={imgSize.h}
            draggable={false}
            style={{ display: "block", userSelect: "none" }}
          />

          {/* Pins */}
          {placed.map((p) => {
            const isSelected = p.id === selectedId;
            const isHovered = p.id === hoveredId;
            const color = getTypeColor(p.type);
            const r = isSelected || isHovered ? PIN_RADIUS_HOVER : PIN_RADIUS;

            return (
              <div
                key={p.id}
                style={{
                  position: "absolute",
                  left: p.x! * imgSize.w,
                  top: p.y! * imgSize.h,
                  transform: `translate(-50%, -50%)`,
                  zIndex: isSelected ? 20 : isHovered ? 15 : 10,
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    width: r * 2,
                    height: r * 2,
                    borderRadius: "50%",
                    background: color,
                    border: "2px solid rgba(255,255,255,0.9)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                    transition: "width 0.1s, height 0.1s",
                  }}
                />
                {(isHovered || isSelected) && (
                  <div
                    style={{
                      position: "absolute",
                      top: LABEL_OFFSET,
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: 11,
                      whiteSpace: "nowrap",
                      background: "rgba(58, 50, 38, 0.9)",
                      padding: "2px 8px",
                      borderRadius: 4,
                      color: "#F5F0E8",
                      pointerEvents: "none",
                    }}
                  >
                    {p.name}
                  </div>
                )}
              </div>
            );
          })}

          {/* Placement preview */}
          {placingId && cursorMapPos && (
            <div
              style={{
                position: "absolute",
                left: cursorMapPos.x * imgSize.w,
                top: cursorMapPos.y * imgSize.h,
                transform: "translate(-50%, -50%)",
                zIndex: 30,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "rgba(245, 168, 85, 0.6)",
                  border: "2px dashed #F5A855",
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Zoom indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          background: "rgba(58, 50, 38, 0.8)",
          padding: "4px 10px",
          borderRadius: 4,
          fontSize: 11,
          color: "rgba(245, 240, 232, 0.5)",
        }}
      >
        {Math.round(scale * 100)}%
      </div>

      {/* Placement mode indicator */}
      {placingId && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(245, 168, 85, 0.9)",
            color: "#3A3226",
            padding: "8px 16px",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Click on the map to place pin — press Esc to cancel
        </div>
      )}
    </div>
  );
}
