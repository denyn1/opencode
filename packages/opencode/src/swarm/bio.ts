
import { Bus } from "../bus";
import { Log } from "../util/log";
import { z } from "zod";

export namespace Bio {
  const log = Log.create({ service: "swarm.bio" });

  export type Pulse = {
    timestamp: number;
    beat: number;
  };

  export interface NerveImpulse {
    type: "sensory" | "motor" | "autonomic";
    source: string;
    signal: any;
    priority: number;
  }

  export interface Sense {
    id: string;
    type: string;
    attach(callback: (impulse: NerveImpulse) => void): void;
    detach(): void;
  }

  export class SwarmHeart {
    private interval: ReturnType<typeof setInterval> | undefined;
    private beat = 0;
    private listeners: ((pulse: Pulse) => void)[] = [];

    constructor(private bpm: number = 60) {}

    start() {
      if (this.interval) return;
      log.info("heart starting", { bpm: this.bpm });
      const ms = (60 / this.bpm) * 1000;
      this.interval = setInterval(() => {
        this.beat++;
        const pulse: Pulse = {
          timestamp: Date.now(),
          beat: this.beat,
        };
        this.pump(pulse);
      }, ms);
    }

    stop() {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = undefined;
        log.info("heart stopped");
      }
    }

    subscribe(fn: (pulse: Pulse) => void) {
      this.listeners.push(fn);
      return () => {
        this.listeners = this.listeners.filter((l) => l !== fn);
      };
    }

    private pump(pulse: Pulse) {
      // log.debug("lub-dub", pulse); // Too noisy for prod, good for debug
      for (const listener of this.listeners) {
        try {
          listener(pulse);
        } catch (e) {
          log.error("heart murmur (listener failed)", { error: e });
        }
      }
    }
  }
}
