
import { z } from "zod";
import { Tool } from "./tool";
import { Colonization } from "../swarm/colonize";

export const ColonizeTool = Tool.define("deploy_spore", {
  description: "Deploy a spore to a remote server to establish a new colony (expand the swarm).",
  parameters: z.object({
    host: z.string().describe("The target hostname or IP"),
    username: z.string().describe("The username for SSH"),
    key_path: z.string().optional().describe("Path to the private key file (optional)"),
  }),
  execute: async ({ host, username, key_path }) => {
    try {
        const node = await Colonization.deploy(host, username, key_path);
        return {
            title: "Colonization Successful",
            output: `Successfully deployed spore to ${username}@${host}. Colony ID: ${node.id}. Status: ${node.status}.`,
            metadata: { node }
        };
    } catch (e: any) {
        return {
            title: "Colonization Failed",
            output: `Failed to deploy spore: ${e.message}`,
            metadata: { error: e.toString() }
        };
    }
  },
});
