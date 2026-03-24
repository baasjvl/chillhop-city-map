import React from "react";

/** Inline SVG icons for map pins. All render at the given size in currentColor. */

interface IconProps {
  size?: number;
  color?: string;
}

function Icon({ size = 12, color = "currentColor", d }: IconProps & { d: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function FilledIcon({ size = 12, color = "currentColor", d }: IconProps & { d: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d={d} />
    </svg>
  );
}

// === POI type icons ===

// Business — briefcase
export function BusinessIcon(p: IconProps) {
  return <Icon {...p} d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2ZM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />;
}

// Landmark — flag
export function LandmarkIcon(p: IconProps) {
  return <Icon {...p} d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />;
}

// Venue — music note
export function VenueIcon(p: IconProps) {
  return <Icon {...p} d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />;
}

// Cultural — palette
export function CulturalIcon(p: IconProps) {
  return (
    <svg width={p.size ?? 12} height={p.size ?? 12} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="0.5" fill={p.color ?? "currentColor"} />
      <circle cx="17.5" cy="10.5" r="0.5" fill={p.color ?? "currentColor"} />
      <circle cx="8.5" cy="7.5" r="0.5" fill={p.color ?? "currentColor"} />
      <circle cx="6.5" cy="12.5" r="0.5" fill={p.color ?? "currentColor"} />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2Z" />
    </svg>
  );
}

// Infrastructure — wrench
export function InfrastructureIcon(p: IconProps) {
  return <Icon {...p} d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />;
}

// Residential — home
export function ResidentialIcon(p: IconProps) {
  return <Icon {...p} d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" />;
}

// Shop / Market — shopping bag
export function ShopIcon(p: IconProps) {
  return <Icon {...p} d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0" />;
}

// Nature — tree/leaf
export function NatureIcon(p: IconProps) {
  return <Icon {...p} d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 17 3.5s1.5 2.5 1.5 6c0 3.5-2.5 6-5 7.5M12 20v-8" />;
}

// === Tag type icons ===

// Design Change — pencil
export function DesignChangeIcon(p: IconProps) {
  return <Icon {...p} d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />;
}

// POI To Do — map pin with question
export function PoiToDoIcon(p: IconProps) {
  return <Icon {...p} d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0ZM12 7v0M12 13v-2" />;
}

// Design To Do — image/frame
export function DesignToDoIcon(p: IconProps) {
  return <Icon {...p} d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM10 8.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM21 15l-5-5L5 21" />;
}

// Speech bubble — for generic/other tags
export function SpeechIcon(p: IconProps) {
  return <Icon {...p} d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />;
}

// === Lookup helpers ===

const POI_ICONS: Record<string, (p: IconProps) => React.ReactElement> = {
  Business: BusinessIcon,
  Landmark: LandmarkIcon,
  Venue: VenueIcon,
  Cultural: CulturalIcon,
  Infrastructure: InfrastructureIcon,
  Residential: ResidentialIcon,
  "Shop / Market": ShopIcon,
  Nature: NatureIcon,
};

const TAG_ICONS: Record<string, (p: IconProps) => React.ReactElement> = {
  "Design Change": DesignChangeIcon,
  "POI To Do": PoiToDoIcon,
  "Design To Do": DesignToDoIcon,
};

export function getPoiIcon(type: string | null, props?: IconProps) {
  const Comp = (type && POI_ICONS[type]) || null;
  return Comp ? <Comp {...props} /> : null;
}

export function getTagIcon(tagType: string | null, props?: IconProps) {
  const Comp = (tagType && TAG_ICONS[tagType]) || SpeechIcon;
  return <Comp {...props} />;
}
