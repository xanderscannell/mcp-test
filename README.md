# MCP Plugin Template

A GitHub template for packaging any MCP server as an installable Claude Code plugin. Zero dependencies — just Node.js.

## For plugin authors

### 1. Use this template

Click **"Use this template"** on GitHub to create your own repo.

### 2. Add your MCP server

Edit `server/index.js` — add tools and resources to the objects at the top of the file. The included server implements the MCP protocol directly with no dependencies.

If you need npm packages, add them to `package.json` and see [Adding dependencies](#adding-dependencies) below.

### 3. Fill in the placeholders

Search for `YOUR_` across the repo and replace:

| Placeholder        | Where                                       | What                              |
|--------------------|---------------------------------------------|-----------------------------------|
| `YOUR_PLUGIN_NAME` | `plugin.json`, `.mcp.json`, `package.json`, `server/index.js` | Your plugin's name (kebab-case)   |
| `YOUR_DESCRIPTION` | `plugin.json`                               | What your plugin does             |
| `YOUR_NAME`        | `plugin.json`                               | Your name                         |
| `YOUR_EMAIL`       | `plugin.json`                               | Your email                        |
| `YOUR_USERNAME`    | `plugin.json`                               | Your GitHub username              |
| `YOUR_REPO`        | `plugin.json`                               | Your GitHub repo name             |

### 4. Distribute

Share your repo — users install the plugin directly from the GitHub URL.

> **Important:** The plugin is read from the repository's default branch. Make sure your changes are merged to `main`/`master` before distributing.

## For users installing a plugin built from this template

**VS Code:** Type `/plugins` in the Claude Code prompt box, then add the plugin's GitHub repo URL.

**CLI:**
```bash
claude plugin add https://github.com/AUTHOR/REPO
```

## How it works

```
your-plugin/
├── .claude-plugin/
│   └── plugin.json       # Plugin metadata
├── .mcp.json             # MCP server declaration
├── server/
│   └── index.js          # Your MCP server (edit this)
├── package.json          # Plugin metadata
└── README.md
```

- `.mcp.json` tells Claude Code to start your server via `node server/index.js`
- The server implements the MCP protocol (JSON-RPC over stdio) with no external dependencies
- `${CLAUDE_PLUGIN_ROOT}` points to the plugin's install directory

## Adding dependencies

If your server needs npm packages:

1. Add them to `package.json`
2. Create `hooks/hooks.json` with a `SessionStart` hook to auto-install them:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "diff -q \"${CLAUDE_PLUGIN_ROOT}/package.json\" \"${CLAUDE_PLUGIN_DATA}/package.json\" >/dev/null 2>&1 || (cd \"${CLAUDE_PLUGIN_DATA}\" && cp \"${CLAUDE_PLUGIN_ROOT}/package.json\" . && npm install --production) || rm -f \"${CLAUDE_PLUGIN_DATA}/package.json\""
          }
        ]
      }
    ]
  }
}
```

3. Add `NODE_PATH` to `.mcp.json` so your server can find the installed modules:

```json
{
  "mcpServers": {
    "your-plugin": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/server/index.js"],
      "env": {
        "NODE_PATH": "${CLAUDE_PLUGIN_DATA}/node_modules"
      }
    }
  }
}
```
