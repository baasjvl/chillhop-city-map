"use client";

import { useEffect, useState } from "react";
import type { NotablePoint } from "@/lib/types";
import { getTypeColor, getStatusColor } from "@/lib/colors";

interface DetailPanelProps {
  point: NotablePoint | null;
  onClose: () => void;
}

export default function DetailPanel({ point, onClose }: DetailPanelProps) {
  const [pageContent, setPageContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    if (!point) {
      setPageContent(null);
      return;
    }

    setLoadingContent(true);
    setPageContent(null);

    fetch(`/api/page-content/${point.id}`)
      .then((r) => r.json())
      .then((data) => setPageContent(data.content || ""))
      .catch(() => setPageContent(null))
      .finally(() => setLoadingContent(false));
  }, [point?.id]);

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
        {/* Type & Status row */}
        <div style={{ display: "flex", gap: 12 }}>
          {point.type && (
            <div style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: typeColor }} />
              {point.type}
            </div>
          )}
          {point.status && (
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
          )}
        </div>

        {/* Engagement Layers */}
        {point.engagementLayers.length > 0 && (
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
        )}

        {/* Tags */}
        {point.tags.length > 0 && (
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
        )}

        {/* Description */}
        {point.description && (
          <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-muted)" }}>
            {point.description}
          </div>
        )}

        {/* Divider before page content */}
        <div style={{ height: 1, background: "var(--panel-border)" }} />

        {/* Page content */}
        {loadingContent && (
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Loading content...
          </div>
        )}
        {!loadingContent && pageContent && (
          <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {pageContent}
          </div>
        )}
        {!loadingContent && pageContent === "" && (
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
            No content on this page yet.
          </div>
        )}

        {/* Coordinates */}
        {point.x !== null && point.y !== null && (
          <div>
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
