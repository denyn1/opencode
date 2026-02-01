
import { Bus } from "../bus";
import { FileWatcher } from "../file/watcher";
import { Bio } from "./bio";
import { Log } from "../util/log";

export namespace BioSensors {
  const log = Log.create({ service: "swarm.sensors" });

  export class FileSense implements Bio.Sense {
    public id: string;
    public type = "file_watcher";
    private pattern: string;
    private unsub: (() => void) | undefined;

    constructor(id: string, pattern: string) {
      this.id = id;
      this.pattern = pattern;
    }

    attach(callback: (impulse: Bio.NerveImpulse) => void): void {
      log.info("attaching file sense", { pattern: this.pattern });
      // Subscribe to global file watcher events
      this.unsub = Bus.subscribe(FileWatcher.Event.Updated, (event) => {
        // Simple string includes check for now, can be upgraded to glob
        if (event.properties.file.includes(this.pattern)) {
            callback({
                type: "sensory",
                source: `file:${event.properties.file}`,
                signal: event.properties,
                priority: 10
            });
        }
      });
    }

    detach(): void {
      if (this.unsub) {
        this.unsub();
        this.unsub = undefined;
      }
    }
  }
}
