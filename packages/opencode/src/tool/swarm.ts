
import { z } from "zod";
import { SwarmManager } from "../swarm/manager";
import { Tool } from "./tool";

export const ReadBlackboardTool = Tool.define("read_blackboard", {
  description: "Read a value from the shared Swarm Blackboard (memory). Use this to get information shared by other agents.",
  parameters: z.object({
    key: z.string().describe("The key to read from the blackboard"),
  }),
  execute: async ({ key }) => {
    const blackboard = SwarmManager.getBlackboard();
    const value = blackboard[key];
    if (value === undefined) {
      return {
        title: "Read Blackboard",
        output: "Key not found in blackboard.",
        metadata: {}
      };
    }
    return {
      title: "Read Blackboard",
      output: JSON.stringify(value),
      metadata: {}
    };
  },
});

export const WriteBlackboardTool = Tool.define("write_blackboard", {
  description: "Write a value to the shared Swarm Blackboard (memory). Use this to share information with other agents.",
  parameters: z.object({
    key: z.string().describe("The key to write to"),
    value: z.any().describe("The value to store (will be stringified)"),
  }),
  execute: async ({ key, value }) => {
    SwarmManager.updateBlackboard(key, value);
    return {
      title: "Write Blackboard",
      output: `Successfully wrote to key '${key}'.`,
      metadata: {}
    };
  },
});
