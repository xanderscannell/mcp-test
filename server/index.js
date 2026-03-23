// Minimal MCP server — no dependencies required.
// See the full spec at https://modelcontextprotocol.io

const SERVER_NAME = "mcp-test";
const SERVER_VERSION = "1.0.0";

// --- Define your tools here ---

const tools = {
  hello: {
    description: "A simple greeting tool",
    inputSchema: { type: "object", properties: {} },
    handler: async (params) => ({
      content: [{ type: "text", text: "Hello from your MCP plugin!" }],
    }),
  },
};

// --- Define your resources here ---

// const resources = {
//   "example://data": {
//     name: "Example",
//     description: "An example resource",
//     mimeType: "text/plain",
//     handler: async (uri) => ({
//       contents: [{ uri, text: "Example resource data" }],
//     }),
//   },
// };

// ─── MCP Protocol (JSON-RPC over stdio) ─────────────────────────

const resources = {};

function handleRequest(method, params) {
  switch (method) {
    case "initialize":
      return {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: Object.keys(tools).length > 0 ? {} : undefined,
          resources: Object.keys(resources).length > 0 ? {} : undefined,
        },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      };

    case "tools/list":
      return {
        tools: Object.entries(tools).map(([name, t]) => ({
          name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      };

    case "tools/call": {
      const tool = tools[params.name];
      if (!tool) throw { code: -32602, message: `Unknown tool: ${params.name}` };
      return tool.handler(params.arguments ?? {});
    }

    case "resources/list":
      return {
        resources: Object.entries(resources).map(([uri, r]) => ({
          uri,
          name: r.name,
          description: r.description,
          mimeType: r.mimeType,
        })),
      };

    case "resources/read": {
      const resource = resources[params.uri];
      if (!resource) throw { code: -32602, message: `Unknown resource: ${params.uri}` };
      return resource.handler(params.uri);
    }

    case "ping":
      return {};

    default:
      throw { code: -32601, message: `Method not found: ${method}` };
  }
}

function send(message) {
  const json = JSON.stringify(message);
  process.stdout.write(`${json}\n`);
}

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", async (chunk) => {
  buffer += chunk;
  const lines = buffer.split("\n");
  buffer = lines.pop();

  for (const line of lines) {
    if (!line.trim()) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
      continue;
    }

    // Notifications (no id) — nothing to respond to
    if (msg.id === undefined) continue;

    try {
      const result = await handleRequest(msg.method, msg.params ?? {});
      send({ jsonrpc: "2.0", id: msg.id, result });
    } catch (err) {
      const code = err.code ?? -32603;
      const message = err.message ?? "Internal error";
      send({ jsonrpc: "2.0", id: msg.id, error: { code, message } });
    }
  }
});
