
import { Hono } from "hono"
import { SwarmManager } from "../../swarm/manager"
import { PermissionNext } from "../../permission/next"
import { z } from "zod"
import { validator } from "hono-openapi"
import { HiveMemory } from "../../swarm/memory"
import { ToolRegistry } from "../../tool/registry"

export const SwarmRoutes = () => {
  const app = new Hono()

  app.post(
    "/api/mode",
    validator(
      "json",
      z.object({
        unrestricted: z.boolean(),
      })
    ),
    async (c) => {
      const { unrestricted } = c.req.valid("json")
      PermissionNext.setUnrestricted(unrestricted)
      return c.json({ success: true, unrestricted })
    }
  )

  app.post(
    "/api/spawn",
    validator(
      "json",
      z.object({
        count: z.number().min(1).max(10000),
        prompt: z.string(),
        agent: z.string().optional(),
      })
    ),
    async (c) => {
      const input = c.req.valid("json")
      const nodes = await SwarmManager.spawn(input)
      return c.json({ success: true, count: nodes.length })
    }
  )

  app.get("/api/status", async (c) => {
    return c.json({
      unrestricted: PermissionNext.unrestricted,
      nodes: SwarmManager.list(),
      blackboard: SwarmManager.getBlackboard(),
    })
  })

  app.get("/api/memory", async (c) => {
    // List all memories (simple implementation)
    const memories = await HiveMemory.recall("");
    return c.json({ memories })
  })

  app.get("/api/tools", async (c) => {
    const ids = await ToolRegistry.ids()
    return c.json({ tools: ids })
  })

  app.get("/", async (c) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Opencode Swarm Dashboard</title>
    <style>
        :root {
            --bg: #0f172a;
            --fg: #e2e8f0;
            --primary: #3b82f6;
            --card: #1e293b;
        }
        body {
            background: var(--bg);
            color: var(--fg);
            font-family: -apple-system, system-ui, sans-serif;
            margin: 0;
            padding: 2rem;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }
        h1 { margin: 0; }
        .card {
            background: var(--card);
            padding: 1.5rem;
            border-radius: 0.5rem;
            margin-bottom: 1rem;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 1rem;
        }
        .node {
            background: #334155;
            padding: 1rem;
            border-radius: 0.25rem;
            border-left: 4px solid var(--primary);
        }
        .node.busy { border-color: #eab308; }
        .node.error { border-color: #ef4444; }
        .node.idle { border-color: #22c55e; }

        button {
            background: var(--primary);
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 0.25rem;
            cursor: pointer;
            font-size: 1rem;
        }
        button:hover { opacity: 0.9; }
        input, textarea, select {
            background: #0f172a;
            border: 1px solid #334155;
            color: white;
            padding: 0.5rem;
            border-radius: 0.25rem;
            width: 100%;
            margin-bottom: 0.5rem;
            box-sizing: border-box;
        }
        .switch {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        pre {
            background: #000;
            padding: 1rem;
            overflow: auto;
        }
        .tabs {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        .tab {
            background: #334155;
            padding: 0.5rem 1rem;
            border-radius: 0.25rem;
            cursor: pointer;
        }
        .tab.active {
            background: var(--primary);
        }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .memory-item {
            border-bottom: 1px solid #334155;
            padding: 0.5rem 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Swarm Control Center</h1>
            <div class="switch">
                <input type="checkbox" id="mode-toggle">
                <label for="mode-toggle">UNRESTRICTED MODE</label>
            </div>
        </header>

        <div class="tabs">
            <div class="tab active" onclick="showTab('control')">Control</div>
            <div class="tab" onclick="showTab('memory')">Hive Mind</div>
            <div class="tab" onclick="showTab('tools')">Dynamic Tools</div>
        </div>

        <div id="control" class="tab-content active">
            <div class="card">
                <h2>Spawn Agents</h2>
                <div style="display: flex; gap: 1rem;">
                    <div style="flex: 1;">
                        <label>Agent Count</label>
                        <input type="number" id="spawn-count" value="5" min="1" max="10000">
                    </div>
                    <div style="flex: 1;">
                        <label>Agent Type</label>
                        <select id="spawn-type">
                            <option value="build">Build</option>
                            <option value="plan">Plan</option>
                            <option value="explore">Explore</option>
                        </select>
                    </div>
                </div>
                <label>Mission Prompt</label>
                <textarea id="spawn-prompt" rows="3" placeholder="Enter task for the swarm..."></textarea>
                <button onclick="spawn()">Deploy Swarm</button>
            </div>

            <div class="card">
                <h2>Blackboard (Shared Memory)</h2>
                <pre id="blackboard">{}</pre>
            </div>

            <div class="grid" id="nodes-grid">
                <!-- Nodes will be injected here -->
            </div>
        </div>

        <div id="memory" class="tab-content">
            <div class="card">
                <h2>Hive Mind Knowledge Base</h2>
                <button onclick="fetchMemory()">Refresh Memory</button>
                <div id="memory-list"></div>
            </div>
        </div>

        <div id="tools" class="tab-content">
            <div class="card">
                <h2>Available Tools</h2>
                <button onclick="fetchTools()">Refresh Tools</button>
                <ul id="tools-list"></ul>
            </div>
        </div>
    </div>

    <script>
        const API_BASE = '/swarm/api';

        function showTab(id) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
            document.getElementById(id).classList.add('active');
            event.target.classList.add('active');

            if (id === 'memory') fetchMemory();
            if (id === 'tools') fetchTools();
        }

        async function fetchStatus() {
            try {
                const res = await fetch(API_BASE + '/status');
                const data = await res.json();

                document.getElementById('mode-toggle').checked = data.unrestricted;
                document.getElementById('blackboard').textContent = JSON.stringify(data.blackboard, null, 2);

                const grid = document.getElementById('nodes-grid');
                grid.innerHTML = data.nodes.map(node => \`
                    <div class="node \${node.status}">
                        <h3>\${node.role}</h3>
                        <div>ID: \${node.sessionID.slice(0,8)}...</div>
                        <div>Status: <strong>\${node.status.toUpperCase()}</strong></div>
                        <div>Active: \${new Date(node.lastActive).toLocaleTimeString()}</div>
                    </div>
                \`).join('');

            } catch (e) {
                console.error("Failed to fetch status", e);
            }
        }

        async function fetchMemory() {
            const res = await fetch(API_BASE + '/memory');
            const data = await res.json();
            const list = document.getElementById('memory-list');
            list.innerHTML = data.memories.map(m => \`
                <div class="memory-item">
                    <strong>\${m.topic}</strong> (ID: \${m.id})<br>
                    <small>By: \${m.author || 'Unknown'} | \${new Date(m.timestamp).toLocaleString()}</small>
                    <p>\${m.content}</p>
                    <div>\${(m.tags || []).map(t => \`<span style="background:#475569;padding:2px 6px;border-radius:4px;font-size:0.8em;margin-right:4px;">\${t}</span>\`).join('')}</div>
                </div>
            \`).join('');
        }

        async function fetchTools() {
            const res = await fetch(API_BASE + '/tools');
            const data = await res.json();
            const list = document.getElementById('tools-list');
            list.innerHTML = data.tools.map(t => \`<li>\${t}</li>\`).join('');
        }

        async function toggleMode(e) {
            await fetch(API_BASE + '/mode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ unrestricted: e.target.checked })
            });
            fetchStatus();
        }

        async function spawn() {
            const count = parseInt(document.getElementById('spawn-count').value);
            const type = document.getElementById('spawn-type').value;
            const prompt = document.getElementById('spawn-prompt').value;

            if (!prompt) return alert("Please enter a prompt");

            await fetch(API_BASE + '/spawn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count, prompt, agent: type })
            });

            fetchStatus();
        }

        document.getElementById('mode-toggle').addEventListener('change', toggleMode);

        // Poll for updates if control tab is active
        setInterval(() => {
            if (document.getElementById('control').classList.contains('active')) fetchStatus();
        }, 2000);
        fetchStatus();
    </script>
</body>
</html>
    `;
    return c.html(html);
  })

  return app
}
