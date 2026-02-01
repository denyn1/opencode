
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
      colonies: SwarmManager.listRemote(),
      blackboard: SwarmManager.getBlackboard(),
      heart: { beat: 0, bpm: 60 }, // In real app, expose SwarmManager.getHeart().beat
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
    <title>Opencode OS</title>
    <style>
        :root {
            --bg-wallpaper: url('https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=2574&auto=format&fit=crop'); /* Dark Nebula */
            --glass-bg: rgba(20, 20, 30, 0.65);
            --glass-border: rgba(255, 255, 255, 0.1);
            --text-primary: #ffffff;
            --text-secondary: rgba(255, 255, 255, 0.6);
            --accent: #0A84FF;
            --danger: #FF453A;
            --success: #32D74B;
            --warning: #FFD60A;
        }

        * { box-sizing: border-box; }

        body {
            margin: 0;
            padding: 0;
            background: var(--bg-wallpaper) no-repeat center center fixed;
            background-size: cover;
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: var(--text-primary);
            height: 100vh;
            overflow: hidden;
            user-select: none;
        }

        /* Top Menu Bar */
        #menubar {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 28px;
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            display: flex;
            align-items: center;
            padding: 0 16px;
            font-size: 13px;
            font-weight: 500;
            z-index: 1000;
        }
        .menu-item { margin-right: 16px; cursor: default; }
        .menu-item.bold { font-weight: 700; }
        .menu-right { margin-left: auto; display: flex; gap: 16px; }

        /* Desktop Area */
        #desktop {
            position: absolute;
            top: 28px;
            bottom: 80px; /* Space for dock */
            left: 0;
            right: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        /* Window (App) */
        .window {
            width: 900px;
            height: 600px;
            background: var(--glass-bg);
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
            border-radius: 12px;
            border: 1px solid var(--glass-border);
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: all 0.3s ease;
        }

        /* Window Header */
        .title-bar {
            height: 38px;
            background: rgba(255, 255, 255, 0.05);
            border-bottom: 1px solid var(--glass-border);
            display: flex;
            align-items: center;
            padding: 0 16px;
            -webkit-app-region: drag; /* Electron-like feel if wrapped */
        }
        .traffic-lights {
            display: flex;
            gap: 8px;
        }
        .light {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }
        .light.close { background: #FF5F56; }
        .light.min { background: #FFBD2E; }
        .light.max { background: #27C93F; }

        .window-title {
            flex: 1;
            text-align: center;
            font-size: 13px;
            color: var(--text-secondary);
            font-weight: 500;
            margin-right: 52px; /* Balance traffic lights */
        }

        /* Sidebar & Content Layout */
        .app-body {
            display: flex;
            flex: 1;
            overflow: hidden;
        }

        .sidebar {
            width: 200px;
            background: rgba(0, 0, 0, 0.2);
            border-right: 1px solid var(--glass-border);
            padding: 20px 10px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .nav-item {
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            color: var(--text-secondary);
            transition: 0.1s;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .nav-item:hover { background: rgba(255, 255, 255, 0.05); color: var(--text-primary); }
        .nav-item.active { background: rgba(255, 255, 255, 0.15); color: var(--text-primary); font-weight: 500; }

        .main-content {
            flex: 1;
            padding: 30px;
            overflow-y: auto;
        }

        /* UI Elements */
        h2 { margin-top: 0; font-weight: 600; font-size: 24px; margin-bottom: 20px; }

        .card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--glass-border);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
        }

        .input-group {
            margin-bottom: 15px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            font-size: 12px;
            font-weight: 600;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        input, select, textarea {
            width: 100%;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid var(--glass-border);
            border-radius: 6px;
            padding: 10px;
            color: white;
            font-family: inherit;
            font-size: 14px;
            outline: none;
        }
        input:focus, select:focus, textarea:focus {
            border-color: var(--accent);
            box-shadow: 0 0 0 2px rgba(10, 132, 255, 0.3);
        }

        button.primary {
            background: var(--accent);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: 0.1s;
            width: 100%;
        }
        button.primary:hover { background: #007AFF; }
        button.primary:active { transform: scale(0.98); }

        /* Toggle Switch (iOS style) */
        .toggle-wrapper {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 0;
        }
        .toggle {
            position: relative;
            display: inline-block;
            width: 40px;
            height: 24px;
        }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0; left: 0; right: 0; bottom: 0;
            background-color: rgba(255, 255, 255, 0.2);
            transition: .4s;
            border-radius: 24px;
        }
        .slider:before {
            position: absolute;
            content: "";
            height: 20px;
            width: 20px;
            left: 2px;
            bottom: 2px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        input:checked + .slider { background-color: var(--success); }
        input:checked + .slider:before { transform: translateX(16px); }

        /* Agent Grid */
        .agent-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 16px;
        }
        .agent-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--glass-border);
            border-radius: 8px;
            padding: 12px;
            position: relative;
        }
        .agent-status {
            position: absolute;
            top: 12px;
            right: 12px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }
        .status-busy { background: var(--warning); box-shadow: 0 0 8px var(--warning); }
        .status-idle { background: var(--success); }
        .status-error { background: var(--danger); }

        /* Dock */
        #dock {
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 24px;
            padding: 8px;
            display: flex;
            gap: 8px;
            z-index: 1000;
        }
        .dock-icon {
            width: 48px;
            height: 48px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 24px;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            color: white;
        }
        .dock-icon:hover {
            transform: scale(1.2) translateY(-10px);
            background: rgba(255, 255, 255, 0.2);
        }
        .dock-icon.active {
            background: rgba(255, 255, 255, 0.3);
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
        }
        .dock-tooltip {
            position: absolute;
            top: -30px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
        }
        .dock-icon:hover .dock-tooltip { opacity: 1; }

        /* Code block */
        pre {
            background: rgba(0, 0, 0, 0.5);
            padding: 15px;
            border-radius: 8px;
            border: 1px solid var(--glass-border);
            color: #d4d4d4;
            overflow-x: auto;
            font-family: "SF Mono", "Menlo", monospace;
            font-size: 12px;
        }

        .view-section { display: none; }
        .view-section.active { display: block; }

    </style>
</head>
<body>

    <div id="menubar">
        <div class="menu-item bold"> Opencode</div>
        <div class="menu-item">File</div>
        <div class="menu-item">Edit</div>
        <div class="menu-item">View</div>
        <div class="menu-item">Window</div>
        <div class="menu-item">Help</div>
        <div class="menu-right">
            <div class="menu-item">❤️ <span id="heartbeat">--</span> BPM</div>
            <div class="menu-item" id="clock">12:00 PM</div>
        </div>
    </div>

    <div id="desktop">
        <div class="window">
            <div class="title-bar">
                <div class="traffic-lights">
                    <div class="light close"></div>
                    <div class="light min"></div>
                    <div class="light max"></div>
                </div>
                <div class="window-title">Swarm Manager</div>
            </div>

            <div class="app-body">
                <div class="sidebar">
                    <div class="nav-item active" onclick="switchView('control')">🚀 Control Center</div>
                    <div class="nav-item" onclick="switchView('memory')">🧠 Hive Mind</div>
                    <div class="nav-item" onclick="switchView('tools')">🛠️ Dynamic Tools</div>
                    <div class="nav-item" onclick="switchView('colonies')">📡 Colonies</div>
                </div>

                <div class="main-content">

                    <!-- Control View -->
                    <div id="view-control" class="view-section active">
                        <h2>Swarm Control</h2>

                        <div class="card">
                            <div class="toggle-wrapper">
                                <label style="margin:0; cursor:pointer;" for="mode-toggle">Unrestricted "God" Mode</label>
                                <label class="toggle">
                                    <input type="checkbox" id="mode-toggle">
                                    <span class="slider"></span>
                                </label>
                            </div>
                            <small style="color: var(--text-secondary);">Disables all safety sensors. Use with caution.</small>
                        </div>

                        <div class="card">
                            <div style="display: flex; gap: 15px;">
                                <div style="flex: 1;">
                                    <label>Count</label>
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
                            <div class="input-group" style="margin-top: 15px;">
                                <label>Mission Prompt</label>
                                <textarea id="spawn-prompt" rows="3" placeholder="Describe the mission for the swarm..."></textarea>
                            </div>
                            <button class="primary" onclick="spawn()">Deploy Swarm</button>
                        </div>

                        <h3>Active Agents</h3>
                        <div class="agent-grid" id="nodes-grid"></div>

                        <h3 style="margin-top:20px;">Blackboard</h3>
                        <pre id="blackboard">{}</pre>
                    </div>

                    <!-- Memory View -->
                    <div id="view-memory" class="view-section">
                        <h2>Hive Mind Knowledge</h2>
                        <button class="primary" onclick="fetchMemory()" style="margin-bottom: 20px;">Refresh Memory</button>
                        <div id="memory-list"></div>
                    </div>

                    <!-- Tools View -->
                    <div id="view-tools" class="view-section">
                        <h2>Tool Registry</h2>
                        <button class="primary" onclick="fetchTools()" style="margin-bottom: 20px;">Refresh List</button>
                        <ul id="tools-list"></ul>
                    </div>

                    <!-- Colonies View -->
                    <div id="view-colonies" class="view-section">
                        <h2>Remote Colonies</h2>
                        <div class="card">
                            <div id="colonies-list">No active colonies. Use the 'deploy_spore' tool to expand.</div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>

    <div id="dock">
        <div class="dock-icon" onclick="switchView('control')">🚀</div>
        <div class="dock-icon" onclick="switchView('memory')">🧠</div>
        <div class="dock-icon" onclick="switchView('tools')">🛠️</div>
        <div class="dock-icon" onclick="switchView('colonies')">📡</div>
    </div>

    <script>
        const API_BASE = '/api';

        function switchView(viewId) {
            document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
            document.getElementById('view-' + viewId).classList.add('active');

            // Update sidebar
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            // Simple match for demo, better to use IDs

            if (viewId === 'memory') fetchMemory();
            if (viewId === 'tools') fetchTools();
        }

        function updateClock() {
            const now = new Date();
            document.getElementById('clock').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        setInterval(updateClock, 1000);
        updateClock();

        async function fetchStatus() {
            try {
                const res = await fetch(API_BASE + '/status');
                const data = await res.json();

                document.getElementById('mode-toggle').checked = data.unrestricted;
                document.getElementById('blackboard').textContent = JSON.stringify(data.blackboard, null, 2);
                document.getElementById('heartbeat').textContent = data.heart.bpm;

                const grid = document.getElementById('nodes-grid');
                grid.innerHTML = data.nodes.map(node => \`
                    <div class="agent-card">
                        <div class="agent-status status-\${node.status}"></div>
                        <div style="font-weight:600; margin-bottom:4px;">\${node.role}</div>
                        <div style="font-size:11px; color:var(--text-secondary); margin-bottom:8px;">\${node.sessionID.slice(0,8)}...</div>
                        <div style="font-size:10px; opacity:0.7;">ACTIVE: \${new Date(node.lastActive).toLocaleTimeString()}</div>
                    </div>
                \`).join('');

                const colList = document.getElementById('colonies-list');
                if (data.colonies && data.colonies.length > 0) {
                    colList.innerHTML = data.colonies.map(col => \`
                        <div class="memory-item">
                            <strong>\${col.username}@\${col.host}</strong> [\${col.status}] (ID: \${col.id})<br>
                            <small>Last Contact: \${new Date(col.lastContact).toLocaleString()}</small>
                        </div>
                    \`).join('');
                }
            } catch (e) {
                console.error("Failed to fetch status", e);
            }
        }

        async function fetchMemory() {
            const res = await fetch(API_BASE + '/memory');
            const data = await res.json();
            const list = document.getElementById('memory-list');
            list.innerHTML = data.memories.map(m => \`
                <div class="card">
                    <strong style="color:var(--accent);">\${m.topic}</strong> <span style="font-size:10px; float:right;">\${new Date(m.timestamp).toLocaleDateString()}</span>
                    <p style="font-size:13px; color:var(--text-secondary); margin:10px 0;">\${m.content}</p>
                    <div>\${(m.tags || []).map(t => \`<span style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;font-size:10px;margin-right:4px;">\${t}</span>\`).join('')}</div>
                </div>
            \`).join('');
        }

        async function fetchTools() {
            const res = await fetch(API_BASE + '/tools');
            const data = await res.json();
            const list = document.getElementById('tools-list');
            list.innerHTML = data.tools.map(t => \`<li style="margin-bottom:5px;">\${t}</li>\`).join('');
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

        setInterval(() => {
            if (document.getElementById('view-control').classList.contains('active')) fetchStatus();
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
