import type { RoutineSchedule, RoutineStop, NotablePoint } from "./types";

/**
 * Parse routine text into structured schedules.
 *
 * Format:
 *   label:
 *   HH:MM Location name [tag1] [tag2]
 *   HH:MM 0.65,0.48 [tag1]
 */
export function parseRoutines(raw: string): RoutineSchedule[] {
  const schedules: RoutineSchedule[] = [];
  let current: RoutineSchedule | null = null;

  for (const rawLine of raw.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    // Schedule label line: "default:", "rain:", "monday:", etc.
    const labelMatch = line.match(/^([a-z_]+):$/i);
    if (labelMatch) {
      current = { label: labelMatch[1].toLowerCase(), stops: [] };
      schedules.push(current);
      continue;
    }

    // Stop line: "HH:MM location [tags]"
    const stopMatch = line.match(/^(\d{1,2}:\d{2})\s+(.+)$/);
    if (!stopMatch || !current) continue;

    const time = stopMatch[1].padStart(5, "0"); // "8:00" -> "08:00"
    let rest = stopMatch[2];

    // Extract tags: [sleep], [inside], [work], [idle], etc.
    const tags: string[] = [];
    rest = rest.replace(/\[([^\]]+)\]/g, (_, tag) => {
      tags.push(tag.trim().toLowerCase());
      return "";
    }).trim();

    const location = rest;
    if (!location) continue;

    current.stops.push({ time, location, tags });
  }

  return schedules;
}

/** Serialize schedules back to text format. */
export function serializeRoutines(schedules: RoutineSchedule[]): string {
  return schedules
    .map((s) => {
      const lines = [`${s.label}:`];
      for (const stop of s.stops) {
        let line = `${stop.time} ${stop.location}`;
        for (const tag of stop.tags) {
          line += ` [${tag}]`;
        }
        lines.push(line);
      }
      return lines.join("\n");
    })
    .join("\n\n");
}

/** Check if a location string is a coordinate pair. */
export function isCoordinate(location: string): boolean {
  return /^\d+\.?\d*,\s*\d+\.?\d*$/.test(location);
}

/** Parse a coordinate string "x,y" into numbers. */
export function parseCoordinate(location: string): { x: number; y: number } | null {
  const match = location.match(/^(\d+\.?\d*),\s*(\d+\.?\d*)$/);
  if (!match) return null;
  return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
}

/** Resolve stop locations to coordinates using POI list. */
export function resolveStops(
  stops: RoutineStop[],
  points: NotablePoint[]
): RoutineStop[] {
  return stops.map((stop) => {
    // Try coordinate first
    const coord = parseCoordinate(stop.location);
    if (coord) {
      return { ...stop, x: coord.x, y: coord.y };
    }
    // Try POI name match (case-insensitive)
    const poi = points.find(
      (p) => p.name.toLowerCase() === stop.location.toLowerCase() && p.x !== null && p.y !== null
    );
    if (poi) {
      return { ...stop, x: poi.x!, y: poi.y! };
    }
    return stop; // unresolved
  });
}

/** Get the active schedule for given conditions (simplified: just pick by label). */
export function getSchedule(
  schedules: RoutineSchedule[],
  label: string
): RoutineSchedule | null {
  return schedules.find((s) => s.label === label) ?? null;
}

/** Find the current stop at a given time (HH:MM). Returns the most recent stop at or before the time. */
export function getStopAtTime(stops: RoutineStop[], time: string): RoutineStop | null {
  const timeMinutes = parseTime(time);
  let best: RoutineStop | null = null;
  let bestMinutes = -1;

  for (const stop of stops) {
    const m = parseTime(stop.time);
    if (m <= timeMinutes && m > bestMinutes) {
      best = stop;
      bestMinutes = m;
    }
  }
  return best;
}

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
