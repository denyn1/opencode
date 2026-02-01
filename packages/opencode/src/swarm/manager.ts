
import { Session } from "../session";
import { SessionPrompt } from "../session/prompt";
import { Bus } from "../bus";
import { Identifier } from "../id/id";
import { Log } from "../util/log";
import { z } from "zod";
import { AGENT_WORKFLOW_PROMPT } from "./prompt";

export namespace SwarmManager {
  const log = Log.create({ service: "swarm.manager" });

  export type AgentNode = {
    sessionID: string;
    status: "idle" | "busy" | "error";
    role: string;
    lastActive: number;
  };

  const state = {
    nodes: new Map<string, AgentNode>(),
    // Shared memory "Blackboard" for agents
    blackboard: new Map<string, any>(),
  };

  export const Event = {
    Spawned: "swarm.spawned",
    Message: "swarm.message",
    BlackboardUpdate: "swarm.blackboard.update",
  };

  export async function spawn(input: { count: number; prompt: string; agent?: string }) {
    log.info("spawning agents", input);
    const promises = [];
    for (let i = 0; i < input.count; i++) {
      promises.push(spawnSingle(input.prompt, input.agent));
    }
    return Promise.all(promises);
  }

  async function spawnSingle(prompt: string, agentType: string = "build") {
    const session = await Session.create({
      title: `Swarm Agent - ${agentType}`,
    });

    const node: AgentNode = {
      sessionID: session.id,
      status: "busy",
      role: agentType,
      lastActive: Date.now(),
    };
    state.nodes.set(session.id, node);

    // Trigger the initial prompt with the workflow system instruction
    // We don't await the full loop here to allow parallel execution
    SessionPrompt.prompt({
      sessionID: session.id,
      parts: [{ type: "text", text: prompt }],
      agent: agentType,
      system: AGENT_WORKFLOW_PROMPT,
    }).catch((e) => {
        log.error("agent crashed", { sessionID: session.id, error: e });
        const n = state.nodes.get(session.id);
        if (n) n.status = "error";
    });

    return node;
  }

  export function list() {
    return Array.from(state.nodes.values());
  }

  export function getBlackboard() {
    return Object.fromEntries(state.blackboard);
  }

  export function updateBlackboard(key: string, value: any) {
    state.blackboard.set(key, value);
    // Notify all agents (conceptually - in reality we just emit an event listeners can pick up)
    // In a real "thousands of agents" scenario, this might need a more robust pub/sub.
  }

  // Method to clear swarm for testing
  export function reset() {
    state.nodes.clear();
    state.blackboard.clear();
  }
}
