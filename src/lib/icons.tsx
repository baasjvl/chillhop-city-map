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

// Landmark — flag
export function LandmarkIcon(p: IconProps) {
  return <Icon {...p} d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />;
}

// Food & Drink — coffee cup
export function FoodDrinkIcon(p: IconProps) {
  return <Icon {...p} d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4ZM6 2v3M10 2v3M14 2v3" />;
}

// Shop — shopping bag
export function ShopIcon(p: IconProps) {
  return <Icon {...p} d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0" />;
}

// Public — building with columns
export function PublicIcon(p: IconProps) {
  return <Icon {...p} d="M3 21h18M4 21V10l8-6 8 6v11M9 21v-6h6v6" />;
}

// Recreation — game controller / ball
export function RecreationIcon(p: IconProps) {
  return <Icon {...p} d="M12 12m-9 0a9 9 0 1 0 18 0 9 9 0 1 0-18 0M12 3v18M3 12h18" />;
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

// Transport — tram/rail
export function TransportIcon(p: IconProps) {
  return <Icon {...p} d="M4 15V9a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2ZM8 19l-2 3M16 19l2 3M9 9h6M9 13h6" />;
}

// Residential — home
export function ResidentialIcon(p: IconProps) {
  return <Icon {...p} d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" />;
}

// Area — map/region outline
export function AreaIcon(p: IconProps) {
  return <Icon {...p} d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4ZM8 2v16M16 6v16" />;
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
  Landmark: LandmarkIcon,
  "Food & Drink": FoodDrinkIcon,
  Shop: ShopIcon,
  Public: PublicIcon,
  Recreation: RecreationIcon,
  Cultural: CulturalIcon,
  Transport: TransportIcon,
  Residential: ResidentialIcon,
  Area: AreaIcon,
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
