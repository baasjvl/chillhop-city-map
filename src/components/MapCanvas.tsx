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
const DRAG_THRESHOLD = 5;

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

  // Pin dragging state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingPos, setDraggingPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Transform state — ref for hit testing, state for rendering pin overlay
  const transformStateRef = useRef({ scale: 1, positionX: 0, positionY: 0 });
  const [transformState, setTransformState] = useState({
    scale: 1,
    positionX: 0,
    positionY: 0,
  });
  const initialScaleRef = useRef(1);

  // Track mousedown position to distinguish clicks from drags
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);

  // Track whether selection came from map click (skip zoom-to)
  const selectedFromMapRef = useRef(false);

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

  useEffect(() => {
    if (ready) initialScaleRef.current = initialScale;
  }, [ready, initialScale]);

  // Zoom to selected pin when selection comes from sidebar
  useEffect(() => {
    if (!selectedId || !transformRef.current) return;
    if (selectedFromMapRef.current) {
      selectedFromMapRef.current = false;
      return;
    }
    const pin = points.find((p) => p.id === selectedId);
    if (!pin || pin.x === null || pin.y === null) return;

    // Use setTransform to center on pin (pins are outside TransformComponent)
    const wrapper = transformRef.current.instance.wrapperComponent;
    if (!wrapper) return;
    const ww = wrapper.clientWidth;
    const wh = wrapper.clientHeight;
    const currentScale = transformStateRef.current.scale;
    const targetScale = Math.max(currentScale, initialScaleRef.current * 1.5);
    const posX = ww / 2 - pin.x * imgSize.w * targetScale;
    const posY = wh / 2 - pin.y * imgSize.h * targetScale;
    transformRef.current.setTransform(posX, posY, targetScale, 300);
  }, [selectedId, points, imgSize]);

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

    if (placingId) return;

    // Only start drag on an already-selected pin (click first to select, then drag)
    const pin = findPinAt(e.clientX, e.clientY);
    if (pin && pin.id === selectedId) {
      setDraggingId(pin.id);
      setDraggingPos({ x: pin.x!, y: pin.y! });
    }
  };

  const handleMouseMove = (e: ReactMouseEvent) => {
    // Pin dragging
    if (draggingId) {
      const pos = screenToMap(e.clientX, e.clientY);
      if (pos) {
        setDraggingPos({
          x: Math.max(0, Math.min(1, pos.x)),
          y: Math.max(0, Math.min(1, pos.y)),
        });
      }
      return;
    }

    if (placingId) {
      setCursorMapPos(screenToMap(e.clientX, e.clientY));
      return;
    }

    const pin = findPinAt(e.clientX, e.clientY);
    setHoveredId(pin?.id ?? null);
  };

  const handleMouseUp = () => {
    if (draggingId && draggingPos) {
      const orig = points.find((p) => p.id === draggingId);
      if (orig && orig.x !== null && orig.y !== null) {
        const { scale } = transformStateRef.current;
        const dx = (draggingPos.x - orig.x) * imgSize.w * scale;
        const dy = (draggingPos.y - orig.y) * imgSize.h * scale;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > DRAG_THRESHOLD) {
          onPlacePin(draggingId, draggingPos.x, draggingPos.y);
        }
      }
      setDraggingId(null);
      setDraggingPos(null);
    }
  };

  const handleMouseLeave = () => {
    if (draggingId) {
      setDraggingId(null);
      setDraggingPos(null);
    }
  };

  const handleClick = (e: ReactMouseEvent) => {
    // Ignore if this was a drag
    if (mouseDownPosRef.current) {
      const dx = e.clientX - mouseDownPosRef.current.x;
      const dy = e.clientY - mouseDownPosRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) return;
    }

    if (placingId) {
      const pos = screenToMap(e.clientX, e.clientY);
      if (pos && pos.x >= 0 && pos.x <= 1 && pos.y >= 0 && pos.y <= 1) {
        onPlacePin(placingId, pos.x, pos.y);
      }
      return;
    }

    const pin = findPinAt(e.clientX, e.clientY);
    if (pin) {
      selectedFromMapRef.current = true;
    }
    onSelectPin(pin?.id ?? null);
  };

  // Determine cursor style
  let cursor = "grab";
  if (draggingId) cursor = "grabbing";
  if (placingId) cursor = "crosshair";
  if (hoveredId && !placingId && !draggingId) cursor = "pointer";

  // Pin sizing: consistent screen size, grows past 300% zoom
  const pinScaleBoost = transformState.scale > 3 ? transformState.scale / 3 : 1;

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
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Map image — inside TransformComponent for pan/zoom */}
      {ready && (
        <TransformWrapper
          ref={transformRef}
          initialScale={initialScale}
          centerOnInit
          minScale={0.1}
          maxScale={10}
          limitToBounds
          centerZoomedOut
          smooth
          panning={{
            disabled: !!draggingId,
          }}
          velocityAnimation={{
            sensitivity: 1,
            animationTime: 400,
          }}
          onTransformed={(_ref, state) => {
            transformStateRef.current = state;
            setTransformState(state);
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
          </TransformComponent>
        </TransformWrapper>
      )}

      {/* Pins — rendered as overlay using transform state for positioning */}
      {placed.map((p) => {
        const isSelected = p.id === selectedId;
        const isHovered = p.id === hoveredId;
        const isDragging = p.id === draggingId;
        const color = getTypeColor(p.type);
        const baseR = isSelected || isHovered ? PIN_RADIUS_HOVER : PIN_RADIUS;
        const r = baseR * pinScaleBoost;

        const pinX = isDragging && draggingPos ? draggingPos.x : p.x!;
        const pinY = isDragging && draggingPos ? draggingPos.y : p.y!;

        // Screen position from transform state
        const screenX =
          pinX * imgSize.w * transformState.scale + transformState.positionX;
        const screenY =
          pinY * imgSize.h * transformState.scale + transformState.positionY;

        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: screenX,
              top: screenY,
              transform: "translate(-50%, -50%)",
              zIndex: isDragging
                ? 30
                : isSelected
                  ? 20
                  : isHovered
                    ? 15
                    : 10,
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
                boxShadow: isDragging
                  ? "0 2px 8px rgba(0,0,0,0.6)"
                  : "0 1px 4px rgba(0,0,0,0.4)",
                transition: "width 0.1s, height 0.1s",
                opacity: isDragging ? 0.8 : 1,
              }}
            />
            {(isHovered || isSelected) && !isDragging && (
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
            left:
              cursorMapPos.x * imgSize.w * transformState.scale +
              transformState.positionX,
            top:
              cursorMapPos.y * imgSize.h * transformState.scale +
              transformState.positionY,
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
        {Math.round(transformState.scale * 100)}%
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
