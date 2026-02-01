
import { SwarmManager } from "./manager";
import { SessionPrompt } from "../session/prompt";
import { Log } from "../util/log";
import { Bio } from "./bio";
import { Bus } from "../bus";
import { Identifier } from "../id/id";

export namespace DigitalImmunity {
  const log = Log.create({ service: "swarm.immunity" });

  export type Pathogen = {
    id: string;
    type: "syntax_error" | "test_failure" | "linter_warning";
    severity: "low" | "medium" | "critical";
    location: string; // File path
    details: string;
    detectedAt: number;
  };

  const pathogens = new Map<string, Pathogen>();

  // Specialized prompt for Leukocyte agents (White Blood Cells)
  const LEUKOCYTE_PROMPT = `
<system-instruction>
You are a LEUKOCYTE agent - a specialized unit of the Digital Immune System.
Your ONLY purpose is to fix a detected anomaly (pathogen) in the codebase.

Protocol:
1.  **Isolate:** Read the file at the reported location.
2.  **Diagnose:** Analyze the specific error details provided.
3.  **Neutralize:** Apply a precise fix to eliminate the error. Do NOT refactor unrelated code.
4.  **Verify:** Confirm the error is gone.
5.  **Terminate:** Report success and exit immediately.

You operate autonomously. Speed and precision are paramount.
</system-instruction>
`;

  export class HealthMonitor {
    constructor() {
      // Connect to the Heart to periodically flush/check pathogens
      SwarmManager.getHeart().subscribe(this.pulse.bind(this));
    }

    private pulse(pulse: Bio.Pulse) {
      // Every 10th beat (approx 10s), check for unresolved pathogens
      if (pulse.beat % 10 === 0) {
        this.deployResponse();
      }
    }

    public reportPathogen(input: Omit<Pathogen, "id" | "detectedAt">) {
      const id = Identifier.ascending("pathogen");
      const pathogen: Pathogen = {
        ...input,
        id,
        detectedAt: Date.now(),
      };

      // Debounce: Don't report if same type/location exists
      for (const p of pathogens.values()) {
        if (p.type === input.type && p.location === input.location) return;
      }

      log.warn("pathogen detected", pathogen);
      pathogens.set(id, pathogen);

      // Immediate response for critical issues
      if (pathogen.severity === "critical") {
        this.deployLeukocyte(pathogen);
      }
    }

    private deployResponse() {
      for (const [id, pathogen] of pathogens) {
        this.deployLeukocyte(pathogen);
        // Assume engaged, remove from pending queue (in real sys, wait for confirmation)
        pathogens.delete(id);
      }
    }

    private async deployLeukocyte(pathogen: Pathogen) {
      log.info("deploying leukocyte", { target: pathogen.location });

      const mission = `
PATHOGEN DETECTED:
Type: ${pathogen.type}
File: ${pathogen.location}
Details: ${pathogen.details}

MISSION: Fix this error immediately.
`;

      await SwarmManager.spawn({
        count: 1,
        prompt: mission,
        agent: "build", // Use 'build' capabilities but with 'leukocyte' instructions
        system: LEUKOCYTE_PROMPT
      });
    }
  }

  // Singleton instance
  export const System = new HealthMonitor();
}
