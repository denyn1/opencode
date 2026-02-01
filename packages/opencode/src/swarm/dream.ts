
import { SwarmManager } from "./manager";
import { Bio } from "./bio";
import { Bus } from "../bus";
import { MessageV2 } from "../session/message-v2";
import { Log } from "../util/log";

export namespace DreamState {
  const log = Log.create({ service: "swarm.dream" });

  let lastActivity = Date.now();
  let isDreaming = false;
  // Dream after 60 seconds of inactivity (60 beats) for demo purposes
  const IDLE_THRESHOLD_BEATS = 60;

  const DREAMER_PROMPT = `
<system-instruction>
You are the DREAMER. The system is currently idle (asleep).
Your goal is to perform "Offline Memory Consolidation" and "Codebase Hygiene".

Protocol:
1.  **Memory Optimization:** Read 'read_blackboard' and 'recall_concept' to find fragmented information. Consolidate them into clearer summaries using 'remember_concept'.
2.  **Refactoring simulation:** Propose code improvements for messy files. Do NOT apply them immediately unless they are strictly non-breaking cleanups. Write your proposals to the Blackboard under "dream:refactor_ideas".
3.  **Garbage Collection:** Identify obsolete tags or temporary files.

Work quietly. If the user returns (system wakes up), you will be terminated immediately.
</system-instruction>
`;

  export class DreamMonitor {
    constructor() {
      // Listen for heartbeat
      SwarmManager.getHeart().subscribe(this.pulse.bind(this));

      // Listen for user activity
      Bus.subscribe(MessageV2.Event.Updated, (event) => {
        if (event.properties.info.role === "user") {
            this.wakeUp();
        }
      });
    }

    private pulse(pulse: Bio.Pulse) {
      if (isDreaming) return;

      const idleMs = Date.now() - lastActivity;
      // Convert ms to rough beats (assuming 60bpm)
      const idleBeats = idleMs / 1000;

      if (idleBeats > IDLE_THRESHOLD_BEATS) {
        this.enterREM();
      }
    }

    private async enterREM() {
      log.info("entering dream state (REM cycle)");
      isDreaming = true;

      await SwarmManager.spawn({
        count: 1,
        prompt: "Begin memory consolidation cycle.",
        agent: "plan", // Use plan mode for safety
        system: DREAMER_PROMPT
      });
    }

    public wakeUp() {
      lastActivity = Date.now();
      if (isDreaming) {
        log.info("waking up from dream state");
        isDreaming = false;
        // Ideally, we should kill the dreamer agent here.
        // For now, we just reset the state; the agent will finish its current turn.
      }
    }
  }

  let monitor: DreamMonitor | undefined;
  export function init() {
    if (!monitor) monitor = new DreamMonitor();
    return monitor;
  }
}
