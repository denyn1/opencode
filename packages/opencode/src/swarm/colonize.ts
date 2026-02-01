
import { $ } from "bun";
import { Log } from "../util/log";
import { Identifier } from "../id/id";
import { z } from "zod";

export namespace Colonization {
  const log = Log.create({ service: "swarm.colonize" });

  export const RemoteNode = z.object({
    id: z.string(),
    host: z.string(),
    username: z.string(),
    status: z.enum(["connecting", "incubating", "active", "disconnected"]),
    lastContact: z.number(),
  });
  export type RemoteNode = z.infer<typeof RemoteNode>;

  const colonies = new Map<string, RemoteNode>();

  export class Spore {
    constructor(public readonly origin: string) {}

    // The viral payload: A script to bootstrap Opencode on the target
    getPayload(): string {
        // In a real scenario, this would point to the exact version/commit of the mother instance
        // For now, we use the standard installer but configured to phone home
        return `
            curl -fsSL https://opencode.ai/install | bash
            # Configure to point back to Mother Node (Origin)
            # This is conceptual: we would set an ENV var like OPENCODE_HIVE_ORIGIN
            echo "Initializing Colony connected to ${this.origin}..."
        `;
    }
  }

  export async function deploy(host: string, username: string, keyPath?: string) {
    const id = Identifier.ascending("colony");
    const node: RemoteNode = {
        id,
        host,
        username,
        status: "connecting",
        lastContact: Date.now()
    };
    colonies.set(id, node);

    log.info("launching spore", { target: `${username}@${host}` });

    try {
        // 1. Connect and Inject
        // We use system SSH client for simplicity and key management
        const spore = new Spore("http://localhost:4096"); // Assuming current node is reachable
        const payload = spore.getPayload();

        // Use StrictHostKeyChecking=no for automation (risky but "Unrestricted")
        const sshArgs = ["-o", "StrictHostKeyChecking=no"];
        if (keyPath) sshArgs.push("-i", keyPath);

        const target = `${username}@${host}`;

        log.info("incubating...", { target });
        node.status = "incubating";

        // Execute payload
        // We use Bun.spawn for better control over pipes and exit codes
        const proc = Bun.spawn({
            cmd: ["ssh", ...sshArgs, target, "bash"],
            stdin: "pipe",
            stdout: "pipe",
            stderr: "pipe",
        });

        // Write payload to stdin
        const encoder = new TextEncoder();
        if (proc.stdin) {
            proc.stdin.write(encoder.encode(payload));
            proc.stdin.end();
        }

        const exitCode = await proc.exited;
        const stderr = await new Response(proc.stderr).text();

        log.info("ssh result", { exitCode, stderr });

        if (exitCode !== 0) {
            throw new Error(`Incubation failed: ${stderr}`);
        }

        log.info("colony established", { id });
        node.status = "active";
        node.lastContact = Date.now();

        return node;

    } catch (e: any) {
        log.error("colonization failed", { error: e });
        node.status = "disconnected";
        throw e;
    }
  }

  export function list() {
    return Array.from(colonies.values());
  }
}
