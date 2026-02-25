# Chillhop City Map — PRD

**Status:** Draft
**Last updated:** Feb 25, 2026

## Problem

The Chillhop City team creates lore, locations, NPCs, quests, and storylines in Notion — but has no way to see where things live spatially on the city map. Liz writes surface lore snippets that need to be tied to coordinates. Patrick and Maxime need to know what goes where. There's no shared coordinate system.

## Solution

An interactive web map that visualizes Notion content spatially. Notion remains the source of truth for all content. The map is a read + placement layer:

- **Read** content from Notion databases and display as pins, areas, and paths on the city map
- **Place** unpositioned Notion entries by dragging them onto the map (writes coordinates back to Notion)
- **Filter** by type, status, tags, zoom level
- **Share** via URL — anyone with the link can view, authenticated users can place/move things

## Users

| User | Role on map |
|------|-------------|
| Bas | View + place. Primary spatial decision-maker. |
| Liz | View + place. Positions lore and narrative content she writes in Notion. |
| Team (Patrick, Maxime, Tim, Jeoffrey, Darius) | View. Check what's placed where, implementation status, spatial context. |

## Core Concepts

### Entity Types

| Type | Visual | Notion source | Description |
|------|--------|---------------|-------------|
| **District** | Semi-transparent polygon overlay | `Districts` database | Named city areas (Midtown, Salt Bay, Oldtown). Boundaries drawn on map. |
| **Location** | Pin (large) | `Locations` database | Places you can "enter" in the city — ship café, galleries, fruit tree, tramwalk. |
| **Notable Point** | Pin (small) | `Notable Points` database | Specific spots: landmarks, venues, businesses, infrastructure, etc. Categorized by physical type + engagement layer. Can be tied to quests, storylines. |
| **Routine** | Path (line between points) | `Routines` database | NPC movement paths — the skateboarding turtle's daily route, Humanist commuter paths. Defined as ordered sequence of waypoints. |

### What's NOT on the map

Storylines, species profiles, and other narrative content that isn't spatially anchored. These live in Notion only but can be **referenced** by map entities (e.g., a Notable Point links to the "Old vs New" storyline page).

### Relationships

- Notable Points can reference a Location (e.g., "inside the ship café")
- Notable Points can reference a Storyline (e.g., "part of Old vs New arc")
- Routines connect multiple Notable Points or Locations as waypoints
- All entities belong to a District (inferred from position or explicit)

## Data Architecture

### Source of truth: Notion

All content AND coordinates live in Notion. The map reads from Notion and writes back only coordinate/spatial data.

### Notion Database Specifications

**Note:** Content properties (Name, Description, Tags, Relations, etc.) are suggestions and will be fine-tuned during Notion setup. The properties the map depends on are **locked** — these are marked with a `*` and must exist for the map to function: coordinates (X, Y), spatial data (Boundary, Waypoints), Status, and Zoom Min.

#### Districts

| Property | Type | Description |
|----------|------|-------------|
| Name | Title | District name (e.g., "Midtown") |
| Description | Rich text | Brief description of the district |
| Color | Select | Overlay color (options: each district gets a distinct color) |
| Boundary | Rich text | JSON array of polygon points: `[{"x": 0.12, "y": 0.34}, ...]` (normalized 0–1 relative to map image) |
| Status | Select | `WIP`, `Ready for Review`, `Ready to Implement`, `Implemented` |
| Tags | Multi-select | Freeform tags |

#### Locations

| Property | Type | Description |
|----------|------|-------------|
| Name | Title | Location name (e.g., "Ship Café") |
| Description | Rich text | What this place is, narrative summary |
| District | Relation → Districts | Which district this belongs to |
| Type | Select | `Café/Bar`, `Cultural`, `Landmark`, `Residential`, `Commercial`, `Nature`, `Infrastructure` |
| X | Number | Horizontal position (0–1, normalized to map width) |
| Y | Number | Vertical position (0–1, normalized to map height) |
| Status | Select | `WIP`, `Ready for Review`, `Ready to Implement`, `Implemented` |
| Alpha | Checkbox | Included in alpha scope |
| Tags | Multi-select | Freeform tags |

#### Notable Points

| Property | Type | Description |
|----------|------|-------------|
| Name | Title | Point name (e.g., "Old fisherman's bench") |
| Description | Rich text | Lore text, interaction description |
| Location | Relation → Locations | If this point is inside a specific location |
| District | Relation → Districts | Which district |
| Storyline | Relation → Storylines | Connected storyline(s), if any |
| Category | Select | `Landmark`, `Venue`, `Business`, `Shop / Market`, `Cultural`, `Infrastructure`, `Residential`, `Nature` |
| Engagement Layer | Multi-select | `Ambient`, `Exploration`, `Observation`, `Deep Discovery` |
| X | Number | Horizontal position (0–1) |
| Y | Number | Vertical position (0–1) |
| Status | Select | `WIP`, `Ready for Review`, `Ready to Implement`, `Implemented` |
| Author | Person | Who created this entry |
| Tags | Multi-select | Freeform tags |
| Zoom Min | Number | Minimum zoom level to show this pin (optional — for decluttering) |

#### Routines

| Property | Type | Description |
|----------|------|-------------|
| Name | Title | Routine name (e.g., "Skateboarding turtle daily route") |
| Description | Rich text | What happens along this path |
| NPC | Rich text | Character name or species |
| Waypoints | Rich text | JSON array of waypoints: `[{"x": 0.2, "y": 0.4, "label": "pier"}, ...]` |
| Time | Select | `Morning`, `Midday`, `Afternoon`, `Evening`, `Night`, `All Day` |
| District | Relation → Districts | Primary district |
| Status | Select | `WIP`, `Ready for Review`, `Ready to Implement`, `Implemented` |
| Tags | Multi-select | Freeform tags |

#### Storylines (reference only — not rendered on map)

| Property | Type | Description |
|----------|------|-------------|
| Name | Title | Storyline name (e.g., "Old vs New") |
| Description | Rich text | Arc summary |
| Size | Select | `Major`, `Minor`, `Backstory` |
| Tags | Multi-select | Freeform tags |

### Coordinate System

All positions are **normalized to the map image dimensions** (0–1 range for both x and y). This means:

- `x: 0` = left edge, `x: 1` = right edge
- `y: 0` = top edge, `y: 1` = bottom edge
- If the map image is replaced with a same-aspect-ratio image, all pins stay in the correct position
- If the aspect ratio changes, coordinates need recalibration (this should be rare — keep map images the same dimensions)

## Features

### Map Canvas

- **Pan and zoom** — mouse drag to pan, scroll to zoom
- **Map image** — full city screenshot as background, manually uploadable (stored in the project's `/public` directory)
- **Zoom indicator** — shows current zoom level

### Entity Rendering

- **Districts** — semi-transparent colored polygon overlays with labels
- **Locations** — larger pins with distinct icon, name label on hover
- **Notable Points** — smaller pins, color-coded by type. Some only appear at higher zoom levels (based on `Zoom Min` property)
- **Routines** — dashed lines connecting waypoints, with directional arrows

### Sidebar

- **Layers panel** — toggle visibility per entity type (Districts, Locations, Notable Points, Routines)
- **Filter by status** — show only unimplemented, show only alpha scope, etc.
- **Filter by tag** — text search across tags
- **Filter by district** — quick filter to one district
- **Unplaced items** — list of Notion entries that have no coordinates yet, grouped by type. These are items waiting to be dragged onto the map.
- **Pin list** — all placed items matching current filters, click to focus

### Detail Panel

When clicking an entity on the map:

- **Name** and **type badge**
- **Description** (summary from Notion, rendered as rich text)
- **Status badge** (color-coded: WIP → Ready for Review → Ready to Implement → Implemented)
- **Tags**
- **Related entities** (which storyline, which location it's inside)
- **Link to Notion page** — "Open in Notion" button to view/edit full content
- **Metadata** — author, district

### Placement Flow

1. Open sidebar → "Unplaced" section shows Notion entries without coordinates
2. Click an unplaced item → it attaches to cursor
3. Click on the map → pin is placed at that position
4. Coordinates are written back to Notion (x, y properties updated)
5. For districts: a polygon drawing tool (click to add vertices, close the shape)
6. For routines: click to add waypoints in sequence, confirm to save path

### Moving Existing Pins

- Authenticated users can drag placed pins to reposition them
- Coordinates update in Notion on drop

### Authentication

Simple name + password system:

- Viewers: no auth required (URL access)
- Editors (Bas, Liz): enter name + shared password to unlock placement/movement
- Password stored as environment variable on Vercel
- Session persisted via cookie or localStorage

### Map Image Management

- Map images stored in `/public/maps/`
- Admin can upload new screenshots via settings UI (or just commit to repo)
- Image dimensions should stay consistent to preserve coordinate mapping
- Future: multiple map variants (day/night) selectable via toggle

## Technical Architecture

### Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js (App Router) | Vercel-native, API routes for Notion proxy, lean |
| Frontend | React + Canvas/SVG for map | Interactive map rendering with pan/zoom |
| Styling | Tailwind CSS | Fast, utility-first, matches lean approach |
| API | Next.js Route Handlers | Proxies Notion API calls, keeps API key server-side |
| Data | Notion API | Single source of truth |
| Cache | In-memory or Vercel KV | Cache Notion responses to avoid rate limits and improve load times |
| Auth | Simple middleware | Password check, cookie-based session |
| Hosting | Vercel | Free tier sufficient, auto-deploy from GitHub |
| Map rendering | HTML Canvas or SVG | Pan/zoom with pins, polygons, paths overlaid |

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/districts` | GET | Fetch all districts from Notion |
| `/api/locations` | GET | Fetch all locations from Notion |
| `/api/notable-points` | GET | Fetch all notable points from Notion |
| `/api/routines` | GET | Fetch all routines from Notion |
| `/api/place` | POST | Write coordinates back to a Notion page (requires auth) |
| `/api/auth` | POST | Verify password, set session cookie |

### Caching Strategy

- Notion data cached for 5 minutes server-side (avoids rate limits; Notion API allows 3 requests/second)
- Manual "Refresh" button to bust cache
- Webhook or polling not needed for this scale — manual refresh is fine

### Data Flow

```
Notion databases ──(API)──→ Next.js API routes ──→ React frontend ──→ Map canvas
                                                                          │
                                                     click to place ──────┘
                                                          │
                                          POST /api/place ──→ Notion API (write x,y)
```

## Scope

### Phase 1 — MVP (build first)

- [x] Notion databases created with specified schema
- [ ] Next.js project deployed on Vercel
- [ ] Notion API integration (read all entity types)
- [ ] Interactive map with pan/zoom
- [ ] Pins rendered for Locations and Notable Points (color-coded by type)
- [ ] Sidebar with pin list and type layer toggles
- [ ] Detail panel with summary + "Open in Notion" link
- [ ] Unplaced items list in sidebar
- [ ] Click-to-place flow (writes coordinates to Notion)
- [ ] Simple password auth for editors
- [ ] Status filter (show unimplemented only)

### Phase 2 — Full featured

- [ ] District polygon overlays (draw + render)
- [ ] Routine path rendering (lines between waypoints)
- [ ] Drag to reposition existing pins
- [ ] Tag and district filters
- [ ] Zoom-level visibility for notable points
- [ ] Map image upload via UI
- [ ] Richer detail panel (rendered Notion rich text)

### Phase 3 — Nice to have

- [ ] Multiple map views (day/night toggle)
- [ ] Search across all entities
- [ ] Coordinate grid overlay for reference
- [ ] Export snapshot (for sharing outside the team)
- [ ] Notion webhook for real-time sync

## Setup Requirements

### Notion Setup

1. Create a Notion integration at https://www.notion.so/my-integrations
   - Name: "Chillhop City Map"
   - Capabilities: Read content, Update content
2. Create the 5 databases (Districts, Locations, Notable Points, Routines, Storylines) with the schema above
3. Share each database with the integration
4. Note the database IDs (from the URL) for environment variables

### Vercel Setup

Environment variables needed:

| Variable | Description |
|----------|-------------|
| `NOTION_API_KEY` | Notion integration secret |
| `NOTION_DB_DISTRICTS` | Districts database ID |
| `NOTION_DB_LOCATIONS` | Locations database ID |
| `NOTION_DB_NOTABLE_POINTS` | Notable Points database ID |
| `NOTION_DB_ROUTINES` | Routines database ID |
| `NOTION_DB_STORYLINES` | Storylines database ID |
| `EDITOR_PASSWORD` | Shared password for placement access |

### GitHub Repo

- Repo: `chillhop-city-map` under Bas's GitHub
- Auto-deploy to Vercel on push to `main`
- Map images committed to `/public/maps/`

## Design Notes

- Dark theme matching the wireframe aesthetic (dark background, warm accents, DM Sans font)
- Chillhop brand colors: cream `#F5F0E8`, orange `#F5A855`, dark `#3A3226`
- Minimal UI — the map is the star, chrome stays out of the way
- Pins should be readable at all zoom levels (fixed pixel size, not world-scaled)

## Open Questions

- Should the map support annotations/comments (e.g., "I think this lore snippet should go near the pier")? Or is that overkill — just discuss in Slack?
- Do we need per-entity edit history, or is Notion's built-in page history enough?
- Should routines show time-of-day information visually (different line styles for morning vs evening routes)?
