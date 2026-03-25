export interface NotablePoint {
  id: string;
  name: string;
  description: string;
  defaultResponse: string;
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
  isLocationView: boolean;
  x: number | null;
  y: number | null;
  addedBy: string;
  createdTime: string;
  notionUrl: string;
}

export interface Character {
  id: string;
  name: string;
  status: string | null;
  routinesRaw: string;
  notionUrl: string;
}

export interface RoutineStop {
  time: string; // "HH:MM"
  location: string; // POI name or "x,y"
  tags: string[]; // ["sleep", "inside", "work", etc.]
  /** Resolved coordinates (filled in at render time) */
  x?: number;
  y?: number;
}

export interface RoutineSchedule {
  label: string; // "default", "rain", "monday", etc.
  stops: RoutineStop[];
}

export type ViewMode = "pois" | "tags" | "routines";
