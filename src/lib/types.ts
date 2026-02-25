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

export interface MapPin {
  id: string;
  name: string;
  type: string | null;
  status: string | null;
  x: number;
  y: number;
}

export type PlacementRequest = {
  pageId: string;
  x: number;
  y: number;
};
