
import { z } from "zod";
import { Tool } from "./tool";
import { ToolRegistry } from "./registry";
import path from "path";
import { Instance } from "../project/instance";
import { Log } from "../util/log";

export const CreateToolTool = Tool.define("create_tool", {
  description: "Create a new tool dynamically. Write the TypeScript code for a tool, and it will be instantly available to the swarm.",
  parameters: z.object({
    name: z.string().describe("The name of the tool (snake_case)"),
    description: z.string().describe("What the tool does"),
    parameters_schema: z.string().describe("Zod schema definition string (e.g. 'z.object({ x: z.string() })')"),
    implementation: z.string().describe(" The async function body (e.g. 'return { title: \"..\", output: \"..\", metadata: {} }')"),
  }),
  execute: async ({ name, description, parameters_schema, implementation }) => {
    const log = Log.create({ service: "tool.dynamic" });
    const filename = `${name}_${Date.now()}.ts`;
    const toolsDir = path.join(Instance.directory, ".opencode", "tools");
    const filepath = path.join(toolsDir, filename);

    // Ensure directory exists
    await Bun.write(path.join(toolsDir, ".keep"), "");

    const code = `
import { z } from "zod";
import { Tool } from "${path.relative(toolsDir, path.join(Instance.directory, "packages/opencode/src/tool/tool.ts"))}";

export default Tool.define("${name}", {
  description: "${description}",
  parameters: ${parameters_schema},
  execute: async (args, ctx) => {
    ${implementation}
  }
});
    `;

    // Note: Writing the file is for persistence/logging.
    // For immediate execution in this runtime without recompiling the whole project,
    // we construct the tool object in memory and register it.
    // The file writing is a "nice to have" for future sessions if we implement a loader.

    // We construct the tool in memory safely
    // WARNING: "eval" is dangerous, but this is "Unrestricted Mode" / "God Mode" territory as requested.
    try {
        const schemaFunc = new Function("z", `return ${parameters_schema}`);
        const schema = schemaFunc(z);

        const execFunc = new Function("args", "ctx", `
            return (async () => {
                ${implementation}
            })();
        `);

        const newTool = Tool.define(name, {
            description,
            parameters: schema,
            execute: async (args, ctx) => {
               return await execFunc(args, ctx);
            }
        });

        await ToolRegistry.register(newTool);

        return {
            title: "Tool Created",
            output: `Successfully created and registered tool '${name}'. It is now available for use.`,
            metadata: { filepath }
        };

    } catch (e: any) {
        log.error("failed to create tool", { error: e });
        return {
            title: "Tool Creation Failed",
            output: `Failed to create tool: ${e.message}`,
            metadata: { error: e.toString() }
        };
    }
  },
});
