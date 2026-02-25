# Chillhop City Map

Interactive lore map for Chillhop City. Visualizes Notion content spatially on the city map.

## Setup

1. Create a GitHub repo and push this project
2. Set up Notion databases (see `docs/prd.md` for schema)
3. Create a Notion integration at https://www.notion.so/my-integrations
4. Deploy to Vercel and configure environment variables (see below)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NOTION_API_KEY` | Notion integration secret |
| `NOTION_DB_DISTRICTS` | Districts database ID |
| `NOTION_DB_LOCATIONS` | Locations database ID |
| `NOTION_DB_NOTABLE_POINTS` | Notable Points database ID |
| `NOTION_DB_ROUTINES` | Routines database ID |
| `NOTION_DB_STORYLINES` | Storylines database ID |
| `EDITOR_PASSWORD` | Shared password for placement access |

## Development

```bash
npm install
npm run dev
```

## Docs

- [PRD](docs/prd.md) — full product requirements
