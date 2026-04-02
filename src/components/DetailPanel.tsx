"use client";

import { useEffect, useState, useRef } from "react";
import type { NotablePoint, MapTag, Character } from "@/lib/types";
import { getTypeColor, getStatusColor, getTagTypeColor } from "@/lib/colors";

interface DetailPanelProps {
  point?: NotablePoint | null;
  tag?: MapTag | null;
  character?: Character | null;
  dbStatuses: string[];
  dbTypes?: string[];
  dbTagTypes?: string[];
  onClose: () => void;
  onStartPlace?: (id: string) => void;
  onUpdateStatus?: (id: string, status: string) => void;
  onUpdateTag?: (id: string, updates: { done?: boolean; tagType?: string; name?: string; businessIds?: string[] }) => void;
  onDeleteTag?: (id: string) => void;
  allPoints?: NotablePoint[];
  onSelectPoi?: (id: string) => void;
  onUpdatePoint?: (id: string, updates: { description?: string; defaultResponse?: string; type?: string; name?: string }) => void;
  onUpdatePageContent?: (id: string, content: string) => void;
}

export default function DetailPanel({
  point,
  tag,
  character,
  dbStatuses,
  dbTypes = [],
  dbTagTypes = [],
  onClose,
  onStartPlace,
  onUpdateStatus,
  onUpdateTag,
  onDeleteTag,
  onUpdatePoint,
  onUpdatePageContent,
  allPoints = [],
  onSelectPoi,
}: DetailPanelProps) {
  const [pageContent, setPageContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showTagTypeMenu, setShowTagTypeMenu] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [editingField, setEditingField] = useState<"defaultResponse" | null>(null);
  const [fieldDraft, setFieldDraft] = useState("");
  const [editingContent, setEditingContent] = useState(false);
  const [contentDraft, setContentDraft] = useState("");
  const [savingContent, setSavingContent] = useState(false);
  const [showBusinessMenu, setShowBusinessMenu] = useState(false);
  const [businessSearch, setBusinessSearch] = useState("");
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const tagTypeMenuRef = useRef<HTMLDivElement>(null);
  const businessMenuRef = useRef<HTMLDivElement>(null);

  const item = point || tag || character;
  const isTag = !!tag && !point && !character;
  const isCharacter = !!character && !point && !tag;

  // Close menus on click outside
  useEffect(() => {
    if (!showStatusMenu && !showTypeMenu && !showTagTypeMenu && !showBusinessMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (showStatusMenu && statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) setShowStatusMenu(false);
      if (showTypeMenu && typeMenuRef.current && !typeMenuRef.current.contains(e.target as Node)) setShowTypeMenu(false);
      if (showTagTypeMenu && tagTypeMenuRef.current && !tagTypeMenuRef.current.contains(e.target as Node)) setShowTagTypeMenu(false);
      if (showBusinessMenu && businessMenuRef.current && !businessMenuRef.current.contains(e.target as Node)) { setShowBusinessMenu(false); setBusinessSearch(""); }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showStatusMenu, showTypeMenu, showTagTypeMenu, showBusinessMenu]);

  // Load page content for POIs and characters
  const contentId = point?.id || character?.id;
  useEffect(() => {
    if (!contentId) { setPageContent(null); setShowStatusMenu(false); setEditingField(null); setEditingContent(false); return; }
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
        {editingName ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={() => {
              const trimmed = nameDraft.trim();
              if (isTag && trimmed !== tag!.name) {
                onUpdateTag?.(tag!.id, { name: trimmed });
              } else if (point && trimmed !== point.name) {
                onUpdatePoint?.(point.id, { name: trimmed });
              }
              setEditingName(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") setEditingName(false);
            }}
            style={{
              flex: 1, fontSize: 16, fontWeight: 600, background: "rgba(58, 50, 38, 0.2)",
              border: "1px solid var(--panel-border)", color: "var(--text)",
              padding: "2px 6px", borderRadius: 4, outline: "none", fontFamily: "inherit",
            }}
          />
        ) : (
          <h2
            style={{ flex: 1, fontSize: 16, fontWeight: 600, cursor: (isTag && onUpdateTag) || (!isTag && !isCharacter && onUpdatePoint) ? "pointer" : "default" }}
            onClick={() => {
              if (isTag && onUpdateTag) {
                setNameDraft(tag!.name);
                setEditingName(true);
              } else if (point && onUpdatePoint) {
                setNameDraft(point.name);
                setEditingName(true);
              }
            }}
            title={(isTag && onUpdateTag) || (point && onUpdatePoint) ? "Click to edit name" : undefined}
          >
            {item.name || ((isTag && onUpdateTag) || (point && onUpdatePoint) ? <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontWeight: 400 }}>(unnamed — click to edit)</span> : item.name)}
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
            <div ref={typeMenuRef} style={{ position: "relative" }}>
              <button
                onClick={() => onUpdatePoint && dbTypes.length > 0 && setShowTypeMenu(!showTypeMenu)}
                style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 500,
                  background: `${getTypeColor(point.type)}22`, color: getTypeColor(point.type),
                  border: "none", cursor: onUpdatePoint && dbTypes.length > 0 ? "pointer" : "default", fontFamily: "inherit",
                }}
              >
                {point.type || "No type"}
              </button>
              {showTypeMenu && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, marginTop: 4, background: "var(--panel)",
                  border: "1px solid var(--panel-border)", borderRadius: 8, padding: 4, zIndex: 10,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)", minWidth: 160,
                }}>
                  {dbTypes.map((t) => (
                    <button key={t} onClick={() => { onUpdatePoint!(point.id, { type: t }); setShowTypeMenu(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 10px",
                        border: "none", background: t === point.type ? "rgba(245,168,85,0.15)" : "transparent",
                        color: "var(--text)", fontSize: 12, cursor: "pointer", borderRadius: 4, fontFamily: "inherit", textAlign: "left",
                      }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: getTypeColor(t), flexShrink: 0 }} />
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
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

            {/* Business (linked POIs) */}
            <div>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 4 }}>
                Business
              </div>
              <div ref={businessMenuRef} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 6 }}>
                {tag.businessIds.map((bid) => {
                  const linkedPoi = allPoints.find((p) => p.id === bid);
                  if (!linkedPoi) return null;
                  return (
                    <div key={bid} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: getTypeColor(linkedPoi.type), flexShrink: 0 }} />
                      <button
                        onClick={() => onSelectPoi?.(linkedPoi.id)}
                        style={{
                          background: "none", border: "none", color: "#F5A855", fontSize: 13,
                          cursor: "pointer", fontFamily: "inherit", padding: 0, textAlign: "left",
                          textDecoration: "underline", textUnderlineOffset: 2,
                        }}
                      >
                        {linkedPoi.name}
                      </button>
                      {linkedPoi.status && (
                        <span style={{
                          fontSize: 10, padding: "1px 6px", borderRadius: 10,
                          background: `${getStatusColor(linkedPoi.status)}22`, color: getStatusColor(linkedPoi.status),
                        }}>
                          {linkedPoi.status}
                        </span>
                      )}
                      {onUpdateTag && (
                        <button
                          onClick={() => onUpdateTag(tag.id, { businessIds: tag.businessIds.filter((id) => id !== bid) })}
                          style={{
                            background: "none", border: "none", color: "var(--text-muted)",
                            cursor: "pointer", fontSize: 11, padding: "2px 4px", fontFamily: "inherit",
                          }}
                          title="Remove business link"
                        >
                          &#x2715;
                        </button>
                      )}
                    </div>
                  );
                })}
                {onUpdateTag && allPoints.length > 0 && (
                  <button
                    onClick={() => setShowBusinessMenu(!showBusinessMenu)}
                    style={{
                      fontSize: 12, padding: "4px 10px", borderRadius: 6, alignSelf: "flex-start",
                      background: "rgba(58, 50, 38, 0.2)", border: "1px solid var(--panel-border)",
                      color: "var(--text-muted)", cursor: "pointer",
                      fontFamily: "inherit", fontStyle: "italic",
                    }}
                  >
                    {tag.businessIds.length > 0 ? "+ Add another..." : "Link a business..."}
                  </button>
                )}
                {!onUpdateTag && tag.businessIds.length === 0 && (
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>No business linked</span>
                )}
                {showBusinessMenu && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, marginTop: 4, background: "var(--panel)",
                    border: "1px solid var(--panel-border)", borderRadius: 8, padding: 4, zIndex: 10,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.4)", minWidth: 220, maxHeight: 260, display: "flex", flexDirection: "column",
                  }}>
                    <input
                      autoFocus
                      placeholder="Search POIs..."
                      value={businessSearch}
                      onChange={(e) => setBusinessSearch(e.target.value)}
                      style={{
                        width: "100%", padding: "6px 8px", fontSize: 12, background: "rgba(58, 50, 38, 0.2)",
                        border: "1px solid var(--panel-border)", color: "var(--text)", borderRadius: 4,
                        outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 4,
                      }}
                    />
                    <div style={{ overflowY: "auto", maxHeight: 200 }}>
                      {allPoints
                        .filter((p) => !tag.businessIds.includes(p.id) && p.name.toLowerCase().includes(businessSearch.toLowerCase()))
                        .slice(0, 30)
                        .map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              onUpdateTag!(tag.id, { businessIds: [...tag.businessIds, p.id] });
                              setShowBusinessMenu(false);
                              setBusinessSearch("");
                            }}
                            style={{
                              display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 8px",
                              border: "none", background: "transparent", color: "var(--text)", fontSize: 12,
                              cursor: "pointer", borderRadius: 4, fontFamily: "inherit", textAlign: "left",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(245,168,85,0.1)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: getTypeColor(p.type), flexShrink: 0 }} />
                            <span style={{ flex: 1 }}>{p.name}</span>
                            {p.type && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{p.type}</span>}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
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

            {/* Default Response (editable) */}
            <div>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 4 }}>
                Default Response
              </div>
              {editingField === "defaultResponse" ? (
                <textarea
                  autoFocus
                  value={fieldDraft}
                  onChange={(e) => setFieldDraft(e.target.value)}
                  onBlur={() => {
                    if (fieldDraft !== point.defaultResponse) {
                      onUpdatePoint?.(point.id, { defaultResponse: fieldDraft });
                    }
                    setEditingField(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setEditingField(null);
                  }}
                  style={{
                    width: "100%", minHeight: 60, fontSize: 13, lineHeight: 1.5,
                    background: "rgba(58, 50, 38, 0.2)", border: "1px solid var(--panel-border)",
                    color: "var(--text)", padding: "6px 8px", borderRadius: 6, outline: "none",
                    fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                  }}
                />
              ) : (
                <div
                  onClick={() => {
                    if (onUpdatePoint) {
                      setFieldDraft(point.defaultResponse);
                      setEditingField("defaultResponse");
                    }
                  }}
                  style={{
                    fontSize: 13, lineHeight: 1.5, color: "var(--text)",
                    whiteSpace: "pre-wrap", cursor: onUpdatePoint ? "pointer" : "default",
                    fontStyle: point.defaultResponse ? "normal" : "italic",
                    padding: "2px 0", borderRadius: 4,
                  }}
                  title={onUpdatePoint ? "Click to edit" : undefined}
                >
                  {point.defaultResponse || (onUpdatePoint ? "(click to add default response)" : "No default response")}
                </div>
              )}
            </div>
            <div style={{ height: 1, background: "var(--panel-border)" }} />
            {loadingContent && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading content...</div>}
            {!loadingContent && editingContent ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <textarea
                  autoFocus
                  value={contentDraft}
                  onChange={(e) => setContentDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") { setEditingContent(false); }
                  }}
                  style={{
                    width: "100%", minHeight: 150, fontSize: 13, lineHeight: 1.6,
                    background: "rgba(58, 50, 38, 0.2)", border: "1px solid var(--panel-border)",
                    color: "var(--text)", padding: "8px 10px", borderRadius: 6, outline: "none",
                    fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    disabled={savingContent}
                    onClick={async () => {
                      if (!onUpdatePageContent) return;
                      setSavingContent(true);
                      await onUpdatePageContent(point.id, contentDraft);
                      setPageContent(contentDraft);
                      setEditingContent(false);
                      setSavingContent(false);
                    }}
                    style={{
                      background: "#F5A855", border: "none", color: "#3A3226",
                      padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                      cursor: savingContent ? "wait" : "pointer", fontFamily: "inherit",
                      opacity: savingContent ? 0.6 : 1,
                    }}
                  >
                    {savingContent ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setEditingContent(false)}
                    style={{
                      background: "transparent", border: "1px solid var(--panel-border)",
                      color: "var(--text-muted)", padding: "6px 10px", borderRadius: 6, fontSize: 12,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : !loadingContent && (
              <div
                onClick={() => {
                  if (onUpdatePageContent) {
                    setContentDraft(pageContent || "");
                    setEditingContent(true);
                  }
                }}
                style={{
                  fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap",
                  cursor: onUpdatePageContent ? "pointer" : "default",
                  fontStyle: (pageContent === "" || pageContent === null) ? "italic" : "normal",
                  color: (pageContent === "" || pageContent === null) ? "var(--text-muted)" : "var(--text)",
                  padding: "2px 0", borderRadius: 4,
                  minHeight: 20,
                }}
                title={onUpdatePageContent ? "Click to edit" : undefined}
              >
                {pageContent || (onUpdatePageContent ? "(click to add content)" : "No content on this page yet.")}
              </div>
            )}
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
            onClick={() => { if (confirm(`Delete task "${tag!.name}"? This will archive it in Notion.`)) onDeleteTag(tag!.id); }}
            style={{
              width: "100%", background: "transparent", border: "1px solid rgba(220, 80, 80, 0.3)",
              color: "rgba(220, 80, 80, 0.7)", padding: "6px 16px", borderRadius: 6, fontSize: 12,
              cursor: "pointer", fontFamily: "inherit", marginTop: 4,
            }}
          >
            Delete task
          </button>
        )}
      </div>
    </div>
  );
}
