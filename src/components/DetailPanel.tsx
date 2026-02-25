"use client";

import type { NotablePoint } from "@/lib/types";
import { getTypeColor, getStatusColor } from "@/lib/colors";

interface DetailPanelProps {
  point: NotablePoint | null;
  onClose: () => void;
}

export default function DetailPanel({ point, onClose }: DetailPanelProps) {
  if (!point) return null;

  const typeColor = getTypeColor(point.type);
  const statusColor = getStatusColor(point.status);

  return (
    <div
      style={{
        position: "fixed",
        top: 48,
        right: 0,
        width: 360,
        bottom: 0,
        background: "var(--panel)",
        borderLeft: "1px solid var(--panel-border)",
        zIndex: 95,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: 16,
          borderBottom: "1px solid var(--panel-border)",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: typeColor,
            flexShrink: 0,
          }}
        />
        <h2 style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>
          {point.name}
        </h2>
        <button
          onClick={onClose}
          style={{
            background: "rgba(58, 50, 38, 0.2)",
            border: "1px solid var(--panel-border)",
            color: "var(--text)",
            padding: "4px 10px",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
            fontFamily: "inherit",
          }}
        >
          &#x2715;
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Type */}
        {point.type && (
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 4 }}>
              Type
            </div>
            <div style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: typeColor }} />
              {point.type}
            </div>
          </div>
        )}

        {/* Status */}
        {point.status && (
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 4 }}>
              Status
            </div>
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 10,
                fontWeight: 500,
                background: `${statusColor}22`,
                color: statusColor,
              }}
            >
              {point.status}
            </span>
          </div>
        )}

        {/* Description */}
        {point.description && (
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 4 }}>
              Description
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              {point.description}
            </div>
          </div>
        )}

        {/* Engagement Layers */}
        {point.engagementLayers.length > 0 && (
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 4 }}>
              Engagement Layer
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {point.engagementLayers.map((l) => (
                <span
                  key={l}
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    background: "rgba(58, 50, 38, 0.2)",
                    borderRadius: 10,
                  }}
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {point.tags.length > 0 && (
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 4 }}>
              Tags
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {point.tags.map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    background: "rgba(58, 50, 38, 0.2)",
                    borderRadius: 10,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Coordinates */}
        {point.x !== null && point.y !== null && (
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 4 }}>
              Coordinates
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>
              x: {point.x.toFixed(4)} &nbsp; y: {point.y.toFixed(4)}
            </div>
          </div>
        )}

        {/* Open in Notion */}
        <a
          href={point.notionUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            textAlign: "center",
            background: "#F5A855",
            color: "#3A3226",
            padding: "8px 16px",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            marginTop: 8,
          }}
        >
          Open in Notion
        </a>
      </div>
    </div>
  );
}
