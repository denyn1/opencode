
import { z } from "zod";
import { Tool } from "./tool";
import { HiveMemory } from "../swarm/memory";

export const RememberTool = Tool.define("remember_concept", {
  description: "Save a concept, pattern, or learning to the Hive Mind memory for long-term storage and sharing.",
  parameters: z.object({
    topic: z.string().describe("The main topic or title of the concept"),
    content: z.string().describe("The detailed content/explanation"),
    tags: z.array(z.string()).optional().describe("Tags for categorization"),
  }),
  execute: async ({ topic, content, tags }, ctx) => {
    const concept = await HiveMemory.remember({
        topic,
        content,
        tags,
        author: ctx.agent
    });
    return {
      title: "Concept Remembered",
      output: `Successfully saved concept '${topic}' to Hive Mind. ID: ${concept.id}`,
      metadata: { id: concept.id }
    };
  },
});

export const RecallTool = Tool.define("recall_concept", {
  description: "Search the Hive Mind memory for concepts related to a topic.",
  parameters: z.object({
    query: z.string().describe("Keywords to search for"),
  }),
  execute: async ({ query }) => {
    const results = await HiveMemory.recall(query);
    if (results.length === 0) {
        return {
            title: "Recall Results",
            output: "No concepts found matching the query.",
            metadata: { count: 0 }
        };
    }
    const summary = results.map(r => `[${r.topic}] (ID: ${r.id})\n${r.content}`).join("\n\n---\n\n");
    return {
      title: "Recall Results",
      output: summary,
      metadata: { count: results.length }
    };
  },
});
