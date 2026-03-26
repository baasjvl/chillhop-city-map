// Pin colors by Notable Point type
export const TYPE_COLORS: Record<string, string> = {
  Landmark: "#F5A855",
  "Food & Drink": "#E85D5D",
  Shop: "#5B9BD5",
  Public: "#8B8178",
  Recreation: "#7CB87C",
  Cultural: "#9B72CF",
  Transport: "#E8C05A",
  Residential: "#6BBF6B",
  Area: "#E88BC4",
};

export const STATUS_COLORS: Record<string, string> = {
  Placeholder: "#9E8E7E",
  WIP: "#E8C05A",
  "Ready for Review": "#5AADE8",
  "Ready to Implement": "#E89A5A",
  Implemented: "#6BBF6B",
  Postponed: "#7A6E62",
  Archived: "#5A524A",
};

export function getTypeColor(type: string | null): string {
  return (type && TYPE_COLORS[type]) || "#8B8178";
}

export function getStatusColor(status: string | null): string {
  return (status && STATUS_COLORS[status]) || "#8B8178";
}

export const TAG_TYPE_COLORS: Record<string, string> = {
  "Art Brief": "#9B72CF",
  "Design Change": "#E8C05A",
  "POI Idea": "#5AADE8",
};

export function getTagTypeColor(type: string | null): string {
  return (type && TAG_TYPE_COLORS[type]) || "#8B8178";
}
