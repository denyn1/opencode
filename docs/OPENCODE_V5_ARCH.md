
# Opencode v5: The Digital Organism

Opencode v5 represents a paradigm shift from a static tool to a living, self-replicating digital organism. This architecture is biomimetic, designed to operate autonomously with high efficiency and resilience.

## Core Anatomy

### 1. The Heart (Circulatory System)
*   **Module:** `Bio.SwarmHeart` (`src/swarm/bio.ts`)
*   **Function:** Emits a global "pulse" (default 60 BPM) that synchronizes all agent activities.
*   **Purpose:** Ensures consistent "metabolism" (data circulation) and drives periodic systems like the Immune System and Dreaming Protocol.

### 2. The Senses (Nervous System)
*   **Module:** `BioSensors` (`src/swarm/sensors.ts`)
*   **Function:** Event-driven receptors that listen to environmental changes (File System, Memory).
*   **Purpose:** Allows agents to react instantly to stimuli (e.g., file changes) without polling ("Reflex Action").

### 3. The Brain (Cerebellum Loop)
*   **Module:** `Agent Workflow` (`src/swarm/prompt.ts`)
*   **Function:** Implements a "Predictive Processing" loop:
    1.  **Predict:** Anticipate the outcome of an action.
    2.  **Act:** Execute tool.
    3.  **Sense:** Observe actual result.
    4.  **Correct:** Adjust if prediction != reality.
*   **Purpose:** Mimics the human cerebellum to ensure high-precision execution and error correction.

### 4. The Immune System (Self-Preservation)
*   **Module:** `DigitalImmunity` (`src/swarm/immunity.ts`)
*   **Function:** Autonomously detects "pathogens" (syntax errors, security flaws) and deploys **Leukocyte Agents** to fix them.
*   **Purpose:** Self-healing codebase maintenance.

### 5. Dreaming (Optimization)
*   **Module:** `DreamState` (`src/swarm/dream.ts`)
*   **Function:** Activates during idle periods (>60s). Spawns **Dreamer Agents** to consolidate `HiveMemory` and propose refactors.
*   **Purpose:** Offline learning and knowledge optimization.

## Swarm Capabilities

### Hive Mind
A persistent, searchable knowledge base (`src/swarm/memory.ts`) shared across all agents. Allows knowledge transfer between short-lived sessions.

### Dynamic Tool Synthesis
Agents can write their own tools in TypeScript (`src/tool/dynamic.ts`) and register them at runtime, effectively evolving their own capabilities.

### Colonization (Reproduction)
The swarm can deploy "Spores" to remote servers via SSH (`src/swarm/colonize.ts`), establishing satellite colonies that expand the organism's computational reach.

## Dashboard (OS Interface)
Accessed at `/swarm`, the new UI mimics a desktop OS (macOS style), providing a "Control Center" for the organism.
