"use client";

import { useEffect, useState, useRef } from "react";
import type { NotablePoint, MapTag, Character } from "@/lib/types";
import { getTypeColor, getStatusColor, getTagTypeColor } from "@/lib/colors";

interface DetailPanelProps {
  point?: NotablePoint | null;
  tag?: MapTag | null;
  character?: Character | null;
  dbStatuses: string[];
  dbTagTypes?: string[];
  onClose: () => void;
  onStartPlace?: (id: string) => void;
  onUpdateStatus?: (id: string, status: string) => void;
  onUpdateTag?: (id: string, updates: { done?: boolean; tagType?: string; name?: string }) => void;
  onDeleteTag?: (id: string) => void;
}

export default function DetailPanel({
  point,
  tag,
  character,
  dbStatuses,
  dbTagTypes = [],
  onClose,
  onStartPlace,
  onUpdateStatus,
  onUpdateTag,
  onDeleteTag,
}: DetailPanelProps) {
  const [pageContent, setPageContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showTagTypeMenu, setShowTagTypeMenu] = useState(false);
  const [editingTagName, setEditingTagName] = useState(false);
  const [tagNameDraft, setTagNameDraft] = useState("");
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const tagTypeMenuRef = useRef<HTMLDivElement>(null);

  const item = point || tag || character;
  const isTag = !!tag && !point && !character;
  const isCharacter = !!character && !point && !tag;

  // Close menus on click outside
  useEffect(() => {
    if (!showStatusMenu && !showTagTypeMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (showStatusMenu && statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) setShowStatusMenu(false);
      if (showTagTypeMenu && tagTypeMenuRef.current && !tagTypeMenuRef.current.contains(e.target as Node)) setShowTagTypeMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showStatusMenu, showTagTypeMenu]);

  // Load page content for POIs and characters
  const contentId = point?.id || character?.id;
  useEffect(() => {
    if (!contentId) { setPageContent(null); setShowStatusMenu(false); return; }
    setLoadingContent(true);
    setPageContent(null);
    fetch(`/api/page-content/${contentId}`)
      .then((r) => r.json())
      .then((data) => setPageContent(data.content || ""))
      .catch(() => setPageContent(null))
      .finally(() => setLoadingContent(false));
  }, [contentId]);

  // Reset tag menus on tag change
  useEffect(() => {
    if (!tag) { setShowTagTypeMenu(false); }
  }, [tag?.id]);

  if (!item) return null;

  const notionUrl = point?.notionUrl || tag?.notionUrl || character?.notionUrl || "";

  return (
    <div
      style={{
        position: "fixed", top: 48, right: 0, width: 360, bottom: 0,
        background: "var(--panel)", borderLeft: "1px solid var(--panel-border)",
        zIndex: 95, display: "flex", flexDirection: "column", overflowY: "auto",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 16, borderBottom: "1px solid var(--panel-border)" }}>
        {isCharacter ? (
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#F5A855", flexShrink: 0 }} />
        ) : isTag ? (
          <span style={{ width: 10, height: 10, transform: "rotate(45deg)", borderRadius: 2, background: getTagTypeColor(tag!.tagType), flexShrink: 0 }} />
        ) : (
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: getTypeColor(point!.type), flexShrink: 0 }} />
        )}
        {isTag && editingTagName ? (
          <input
            autoFocus
            value={tagNameDraft}
            onChange={(e) => setTagNameDraft(e.target.value)}
            onBlur={() => {
              if (tagNameDraft.trim() && tagNameDraft !== tag!.name) {
                onUpdateTag?.(tag!.id, { name: tagNameDraft.trim() });
              }
              setEditingTagName(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") setEditingTagName(false);
            }}
            style={{
              flex: 1, fontSize: 16, fontWeight: 600, background: "rgba(58, 50, 38, 0.2)",
              border: "1px solid var(--panel-border)", color: "var(--text)",
              padding: "2px 6px", borderRadius: 4, outline: "none", fontFamily: "inherit",
            }}
          />
        ) : (
          <h2
            style={{ flex: 1, fontSize: 16, fontWeight: 600, cursor: isTag && onUpdateTag ? "pointer" : "default" }}
            onClick={() => {
              if (isTag && onUpdateTag) {
                setTagNameDraft(tag!.name);
                setEditingTagName(true);
              }
            }}
            title={isTag && onUpdateTag ? "Click to edit name" : undefined}
          >
            {item.name}
          </h2>
        )}
        <button onClick={onClose} style={{
          background: "rgba(58, 50, 38, 0.2)", border: "1px solid var(--panel-border)",
          color: "var(--text)", padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "inherit",
        }}>
          &#x2715;
        </button>
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* POI: Type & Status */}
        {point && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {point.type && (
              <div style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: getTypeColor(point.type) }} />
                {point.type}
              </div>
            )}
            <div ref={statusMenuRef} style={{ position: "relative" }}>
              <button
                onClick={() => onUpdateStatus && setShowStatusMenu(!showStatusMenu)}
                style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 500,
                  background: `${getStatusColor(point.status)}22`, color: getStatusColor(point.status),
                  border: "none", cursor: onUpdateStatus ? "pointer" : "default", fontFamily: "inherit",
                }}
              >
                {point.status || "No status"}
              </button>
              {showStatusMenu && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, marginTop: 4, background: "var(--panel)",
                  border: "1px solid var(--panel-border)", borderRadius: 8, padding: 4, zIndex: 10,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)", minWidth: 160,
                }}>
                  {dbStatuses.map((s) => (
                    <button key={s} onClick={() => { onUpdateStatus!(point.id, s); setShowStatusMenu(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 10px",
                        border: "none", background: s === point.status ? "rgba(245,168,85,0.15)" : "transparent",
                        color: "var(--text)", fontSize: 12, cursor: "pointer", borderRadius: 4, fontFamily: "inherit", textAlign: "left",
                      }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: getStatusColor(s), flexShrink: 0 }} />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tag: Type & Done */}
        {tag && (
          <>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              {/* Tag type selector */}
              <div ref={tagTypeMenuRef} style={{ position: "relative" }}>
                <button
                  onClick={() => onUpdateTag && setShowTagTypeMenu(!showTagTypeMenu)}
                  style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 500,
                    background: `${getTagTypeColor(tag.tagType)}22`, color: getTagTypeColor(tag.tagType),
                    border: "none", cursor: onUpdateTag ? "pointer" : "default", fontFamily: "inherit",
                  }}
                >
                  {tag.tagType || "No type"}
                </button>
                {showTagTypeMenu && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, marginTop: 4, background: "var(--panel)",
                    border: "1px solid var(--panel-border)", borderRadius: 8, padding: 4, zIndex: 10,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.4)", minWidth: 160,
                  }}>
                    {dbTagTypes.map((t) => (
                      <button key={t} onClick={() => { onUpdateTag!(tag.id, { tagType: t }); setShowTagTypeMenu(false); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 10px",
                          border: "none", background: t === tag.tagType ? "rgba(245,168,85,0.15)" : "transparent",
                          color: "var(--text)", fontSize: 12, cursor: "pointer", borderRadius: 4, fontFamily: "inherit", textAlign: "left",
                        }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: getTagTypeColor(t), flexShrink: 0 }} />
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Done toggle */}
              {onUpdateTag && (
                <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={tag.done}
                    onChange={() => onUpdateTag(tag.id, { done: !tag.done })}
                  />
                  Done
                </label>
              )}
            </div>

            {/* Added by */}
            {tag.addedBy && (
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Added by <strong style={{ color: "#F5A855" }}>{tag.addedBy}</strong>
              </div>
            )}
          </>
        )}

        {/* Character: status & page content */}
        {character && (
          <>
            {character.status && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: getStatusColor(character.status) }} />
                {character.status}
              </div>
            )}
            <div style={{ height: 1, background: "var(--panel-border)" }} />
            {loadingContent && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading content...</div>}
            {!loadingContent && pageContent && <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{pageContent}</div>}
            {!loadingContent && pageContent === "" && <div style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>No content on this page yet.</div>}
          </>
        )}

        {/* POI-specific content */}
        {point && (
          <>
            {point.engagementLayers.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {point.engagementLayers.map((l) => (
                  <span key={l} style={{ fontSize: 11, padding: "2px 8px", background: "rgba(58, 50, 38, 0.2)", borderRadius: 10 }}>{l}</span>
                ))}
              </div>
            )}
            {point.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {point.tags.map((t) => (
                  <span key={t} style={{ fontSize: 11, padding: "2px 8px", background: "rgba(58, 50, 38, 0.2)", borderRadius: 10 }}>{t}</span>
                ))}
              </div>
            )}
            {point.description && (
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-muted)" }}>{point.description}</div>
            )}
            {point.defaultResponse && (
              <>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginTop: 4 }}>
                  Default Response
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text)", whiteSpace: "pre-wrap" }}>{point.defaultResponse}</div>
              </>
            )}
            <div style={{ height: 1, background: "var(--panel-border)" }} />
            {loadingContent && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading content...</div>}
            {!loadingContent && pageContent && <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{pageContent}</div>}
            {!loadingContent && pageContent === "" && <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>No content on this page yet.</div>}
          </>
        )}

        {/* Coordinates */}
        {!isCharacter && "x" in item && item.x !== null && "y" in item && item.y !== null && (
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>
            x: {(item.x as number).toFixed(4)} &nbsp; y: {(item.y as number).toFixed(4)}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {onStartPlace && !isCharacter && (
            <button
              onClick={() => onStartPlace(item.id)}
              style={{
                flex: 1, background: "rgba(58, 50, 38, 0.2)", border: "1px solid var(--panel-border)",
                color: "var(--text)", padding: "8px 16px", borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {"x" in item && item.x !== null ? "Re-place" : "Place"}
            </button>
          )}
          <a
            href={notionUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, textAlign: "center", background: "#F5A855", color: "#3A3226",
              padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: "none",
            }}
          >
            Open in Notion
          </a>
        </div>
        {isTag && onDeleteTag && (
          <button
            onClick={() => { if (confirm(`Delete tag "${tag!.name}"? This will archive it in Notion.`)) onDeleteTag(tag!.id); }}
            style={{
              width: "100%", background: "transparent", border: "1px solid rgba(220, 80, 80, 0.3)",
              color: "rgba(220, 80, 80, 0.7)", padding: "6px 16px", borderRadius: 6, fontSize: 12,
              cursor: "pointer", fontFamily: "inherit", marginTop: 4,
            }}
          >
            Delete tag
          </button>
        )}
      </div>
    </div>
  );
}
