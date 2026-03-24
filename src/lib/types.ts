export interface NotablePoint {
  id: string;
  name: string;
  description: string;
  type: string | null;
  status: string | null;
  engagementLayers: string[];
  tags: string[];
  x: number | null;
  y: number | null;
  zoomMin: number | null;
  notionUrl: string;
}

export interface MapTag {
  id: string;
  name: string;
  tagType: string | null;
  done: boolean;
  x: number | null;
  y: number | null;
  addedBy: string;
  createdTime: string;
  notionUrl: string;
}

export type ViewMode = "pois" | "tags";
