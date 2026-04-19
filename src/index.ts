import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

import {
  searchVenuesDescription,
  searchVenuesInputShape,
  runSearchVenues,
} from './tools/search-venues.js';
import {
  getVenueDescription,
  getVenueInputShape,
  runGetVenue,
} from './tools/get-venue.js';
import {
  getVenueCategoriesDescription,
  getVenueCategoriesInputShape,
  runGetVenueCategories,
} from './tools/get-venue-categories.js';
import {
  getVenuesNearbyDescription,
  getVenuesNearbyInputShape,
  runGetVenuesNearby,
} from './tools/get-venues-nearby.js';

const PORT = Number(process.env.PORT ?? 8080);
const PUBLIC_URL = process.env.PUBLIC_URL ?? 'https://mcp.plateful.uk';

const SERVER_NAME = 'Plateful UK Hospitality';
const SERVER_VERSION = '1.0.0';
const SERVER_DESCRIPTION =
  'Discover restaurants, bars, cafés and hospitality venues across the UK. ' +
  'Search by location, cuisine, category. Real-time opening hours and availability.';

function jsonTextResult(payload: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

function errorResult(message: string) {
  return {
    isError: true,
    content: [
      {
        type: 'text' as const,
        text: message,
      },
    ],
  };
}

function buildMcpServer(): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } }
  );

  server.registerTool(
    'search_venues',
    {
      title: 'Search venues',
      description: searchVenuesDescription,
      inputSchema: searchVenuesInputShape,
    },
    async (args) => {
      try {
        return jsonTextResult(await runSearchVenues(args));
      } catch (err) {
        return errorResult((err as Error).message);
      }
    }
  );

  server.registerTool(
    'get_venue',
    {
      title: 'Get venue details',
      description: getVenueDescription,
      inputSchema: getVenueInputShape,
    },
    async (args) => {
      try {
        return jsonTextResult(await runGetVenue(args));
      } catch (err) {
        return errorResult((err as Error).message);
      }
    }
  );

  server.registerTool(
    'get_venue_categories',
    {
      title: 'List venue categories',
      description: getVenueCategoriesDescription,
      inputSchema: getVenueCategoriesInputShape,
    },
    async () => {
      try {
        return jsonTextResult(await runGetVenueCategories());
      } catch (err) {
        return errorResult((err as Error).message);
      }
    }
  );

  server.registerTool(
    'get_venues_nearby',
    {
      title: 'Find venues nearby',
      description: getVenuesNearbyDescription,
      inputSchema: getVenuesNearbyInputShape,
    },
    async (args) => {
      try {
        return jsonTextResult(await runGetVenuesNearby(args));
      } catch (err) {
        return errorResult((err as Error).message);
      }
    }
  );

  return server;
}

function serverCard() {
  return {
    name: SERVER_NAME,
    description: SERVER_DESCRIPTION,
    url: PUBLIC_URL,
    transport: {
      type: 'streamable-http',
      url: `${PUBLIC_URL}/mcp`,
    },
    tools: [
      {
        name: 'search_venues',
        description: 'Search for UK hospitality venues by name, cuisine, or keyword',
      },
      {
        name: 'get_venue',
        description: 'Get detailed info about a specific venue including opening hours',
      },
      {
        name: 'get_venue_categories',
        description: 'List available venue categories',
      },
      {
        name: 'get_venues_nearby',
        description: 'Find venues near a location',
      },
    ],
    contact: 'chris@plateful.uk',
    version: SERVER_VERSION,
  };
}

function landingPageHtml(): string {
  const cardUrl = `${PUBLIC_URL}/.well-known/mcp/server.json`;
  const config = {
    mcpServers: {
      plateful: {
        url: `${PUBLIC_URL}/mcp`,
      },
    },
  };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Plateful MCP Server — UK Hospitality Discovery for AI Agents</title>
  <style>
    :root { color-scheme: light dark; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      max-width: 760px;
      margin: 3rem auto;
      padding: 0 1.25rem;
      line-height: 1.55;
    }
    h1 { margin-bottom: 0.25rem; }
    p.lede { color: #555; margin-top: 0; }
    pre {
      background: #0f172a;
      color: #e2e8f0;
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 13px;
    }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    a { color: #0f62fe; }
  </style>
</head>
<body>
  <h1>Plateful MCP Server</h1>
  <p class="lede">UK Hospitality Discovery for AI Agents</p>

  <p>
    This is a public Model Context Protocol (MCP) server that lets AI agents
    discover UK restaurants, bars, cafés and other hospitality venues. No
    authentication is required — just connect and query.
  </p>

  <h2>Discovery</h2>
  <p>
    Server card: <a href="/.well-known/mcp/server.json"><code>${cardUrl}</code></a>
  </p>

  <h2>Connect from Claude Desktop</h2>
  <p>Add the following block to your <code>claude_desktop_config.json</code>:</p>
  <pre><code>${JSON.stringify(config, null, 2)}</code></pre>

  <h2>Available tools</h2>
  <ul>
    <li><code>search_venues</code> — search venues by name, cuisine, or keyword</li>
    <li><code>get_venue</code> — full details for a single venue, including opening hours</li>
    <li><code>get_venue_categories</code> — list filter categories</li>
    <li><code>get_venues_nearby</code> — find venues near a latitude / longitude</li>
  </ul>

  <p>Learn more at <a href="https://plateful.uk">plateful.uk</a>.</p>
</body>
</html>`;
}

async function handleMcpRequest(req: Request, res: Response): Promise<void> {
  const server = buildMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  res.on('close', () => {
    void transport.close().catch(() => {});
    void server.close().catch(() => {});
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] MCP request failed:`, err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
}

function methodNotAllowed(_req: Request, res: Response) {
  res.status(405).json({
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message: 'Method not allowed. This MCP server is stateless; use POST /mcp.',
    },
    id: null,
  });
}

function main() {
  const app = express();
  app.use(cors({ origin: '*', exposedHeaders: ['Mcp-Session-Id'] }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/', (_req, res) => {
    res.type('html').send(landingPageHtml());
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/.well-known/mcp/server.json', (_req, res) => {
    res.json(serverCard());
  });

  app.post('/mcp', (req, res) => {
    void handleMcpRequest(req, res);
  });
  app.get('/mcp', methodNotAllowed);
  app.delete('/mcp', methodNotAllowed);

  app.use((req, res) => {
    res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
  });

  app.listen(PORT, () => {
    console.log(
      `[${new Date().toISOString()}] Plateful Public MCP Server listening on port ${PORT}`
    );
    console.log(`Laravel API: ${process.env.LARAVEL_API_URL ?? 'https://api.plateful.uk/api'}`);
    console.log(`Public URL: ${PUBLIC_URL}`);
  });
}

main();
