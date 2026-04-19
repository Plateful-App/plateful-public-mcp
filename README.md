# Plateful Public MCP Server

A public [Model Context Protocol](https://modelcontextprotocol.io) server that
exposes Plateful's UK hospitality venue data to AI agents (ChatGPT, Claude,
Perplexity, agent browsers, etc.).

This server is **public and read-only**. No authentication is required. It
wraps Plateful's existing public Laravel API endpoints and presents them in
MCP format over streamable HTTP.

## Endpoints

| Path | Method | Purpose |
| --- | --- | --- |
| `/` | GET | HTML landing page with connection instructions |
| `/.well-known/mcp/server.json` | GET | MCP server discovery card |
| `/mcp` | POST | MCP streamable HTTP protocol endpoint |
| `/health` | GET | Uptime / health check |

## Tools

- **`search_venues`** — search venues by name, cuisine, or keyword, optionally
  scoped by location or category.
- **`get_venue`** — full details for a single venue, including opening hours,
  contact details and booking URL.
- **`get_venue_categories`** — list the available filter categories.
- **`get_venues_nearby`** — find venues near a given latitude / longitude.

## Configuration

All configuration is via environment variables:

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `8080` | HTTP port the server listens on |
| `LARAVEL_API_URL` | `https://api.plateful.uk/api` | Base URL of the Plateful Laravel API |
| `PUBLIC_URL` | `https://mcp.plateful.uk` | Canonical public URL, surfaced in the server card and landing page |

## Local development

```bash
pnpm install
pnpm dev          # tsx watch-less run
# or
pnpm build && pnpm start
```

Once it's running, browse to <http://localhost:8080/> for the landing page or
`curl http://localhost:8080/.well-known/mcp/server.json` for the discovery
card.

## Docker

```bash
docker build -t plateful-public-mcp .
docker run --rm -p 8080:8080 plateful-public-mcp
```

## Connecting from Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "plateful": {
      "url": "https://mcp.plateful.uk/mcp"
    }
  }
}
```
