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
  const transformRef = useRef<ReactZoomPanPinchContentRef>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [containerHeight, setContainerHeight] = useState(0);

  // Hover state
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Cursor position for placement preview
  const [cursorMapPos, setCursorMapPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Track transform state for hit testing and zoom display
  const transformStateRef = useRef({ scale: 1, positionX: 0, positionY: 0 });
  const [displayScale, setDisplayScale] = useState(1);

  // Track mousedown position to distinguish clicks from drags
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);

  // Load map image
  useEffect(() => {
    const img = new Image();
    img.src = "/maps/city-macro.jpg";
    img.onload = () => {
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      setImgLoaded(true);
    };
  }, []);

  // Measure container height once for initial scale calculation
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const height = entries[0].contentRect.height;
      if (height > 0) {
        setContainerHeight(height);
        observer.disconnect();
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const ready = imgLoaded && containerHeight > 0;
  const initialScale = ready ? containerHeight / imgSize.h : 1;

  // Screen coords -> normalized map coords (0-1)
  const screenToMap = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      const { scale, positionX, positionY } = transformStateRef.current;
      const imgX = (clientX - rect.left - positionX) / scale;
      const imgY = (clientY - rect.top - positionY) / scale;
      return {
        x: imgX / imgSize.w,
        y: imgY / imgSize.h,
      };
    },
    [imgSize]
  );

  // Find pin at screen position
  const findPinAt = useCallback(
    (clientX: number, clientY: number): NotablePoint | null => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      const relX = clientX - rect.left;
      const relY = clientY - rect.top;
      const { scale, positionX, positionY } = transformStateRef.current;

      const placed = points.filter((p) => p.x !== null && p.y !== null);
      // Check in reverse order (top pins first)
      for (let i = placed.length - 1; i >= 0; i--) {
        const p = placed[i];
        const px = p.x! * imgSize.w * scale + positionX;
        const py = p.y! * imgSize.h * scale + positionY;
        const dist = Math.sqrt((relX - px) ** 2 + (relY - py) ** 2);
        if (dist <= PIN_RADIUS_HOVER + 4) return p;
      }
      return null;
    },
    [points, imgSize]
  );

  // Mouse handlers
  const handleMouseDown = (e: ReactMouseEvent) => {
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleClick = (e: ReactMouseEvent) => {
    // Ignore if this was a drag (panning)
    if (mouseDownPosRef.current) {
      const dx = e.clientX - mouseDownPosRef.current.x;
      const dy = e.clientY - mouseDownPosRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 5) return;
    }

    if (placingId) {
      const pos = screenToMap(e.clientX, e.clientY);
      if (pos && pos.x >= 0 && pos.x <= 1 && pos.y >= 0 && pos.y <= 1) {
        onPlacePin(placingId, pos.x, pos.y);
      }
      return;
    }

    const pin = findPinAt(e.clientX, e.clientY);
    onSelectPin(pin?.id ?? null);
  };

  const handleMouseMove = (e: ReactMouseEvent) => {
    if (placingId) {
      setCursorMapPos(screenToMap(e.clientX, e.clientY));
      return;
    }
    const pin = findPinAt(e.clientX, e.clientY);
    setHoveredId(pin?.id ?? null);
  };

  // Determine cursor style
  let cursor = "grab";
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
      onClick={handleClick}
      onMouseMove={handleMouseMove}
    >
      {ready && (
        <TransformWrapper
          ref={transformRef}
          initialScale={initialScale}
          centerOnInit
          minScale={0.1}
          maxScale={10}
          limitToBounds={false}
          smooth
          onTransformed={(_ref, state) => {
            transformStateRef.current = state;
            setDisplayScale(state.scale);
          }}
        >
          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/maps/city-macro.jpg"
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
                    transform: "translate(-50%, -50%)",
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
          </TransformComponent>
        </TransformWrapper>
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
        {Math.round(displayScale * 100)}%
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
