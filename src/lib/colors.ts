// Pin colors by Notable Point type
export const TYPE_COLORS: Record<string, string> = {
  Business: "#5B9BD5",
  Landmark: "#F5A855",
  Venue: "#E85D5D",
  Cultural: "#9B72CF",
  Infrastructure: "#8B8178",
  Residential: "#6BBF6B",
  "Shop / Market": "#E88BC4",
  Nature: "#7CB87C",
};

export const STATUS_COLORS: Record<string, string> = {
  WIP: "#8B8178",
  "Ready for Review": "#F5A855",
  "Ready to Implement": "#5B9BD5",
  Implemented: "#6BBF6B",
};

export function getTypeColor(type: string | null): string {
  return (type && TYPE_COLORS[type]) || "#8B8178";
}

export function getStatusColor(status: string | null): string {
  return (status && STATUS_COLORS[status]) || "#8B8178";
}
