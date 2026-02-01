
import { Storage } from "../storage/storage";
import { Identifier } from "../id/id";
import { z } from "zod";
import { Instance } from "../project/instance";

export namespace HiveMemory {
  export const Concept = z.object({
    id: z.string(),
    topic: z.string(),
    content: z.string(),
    tags: z.array(z.string()).optional(),
    author: z.string().optional(),
    timestamp: z.number(),
  });
  export type Concept = z.infer<typeof Concept>;

  export async function remember(input: { topic: string; content: string; tags?: string[]; author?: string }) {
    const id = Identifier.ascending("hive");
    const concept: Concept = {
      id,
      topic: input.topic,
      content: input.content,
      tags: input.tags,
      author: input.author,
      timestamp: Date.now(),
    };
    // Use project ID "global" or specific? Using project ID for now.
    await Storage.write(["hive", Instance.project.id, id], concept);
    return concept;
  }

  export async function recall(query: string) {
    // Simple scan for now (O(N)). For "thousands" of agents/memories, we'd need a Vector DB or FTS.
    // Given constraints, we iterate.
    const results: Concept[] = [];
    const files = await Storage.list(["hive", Instance.project.id]);

    for (const file of files) {
      const concept = await Storage.read<Concept>(file);
      // Basic keyword match
      if (
        concept.topic.includes(query) ||
        concept.content.includes(query) ||
        concept.tags?.some(t => t.includes(query))
      ) {
        results.push(concept);
      }
    }
    return results;
  }
}
