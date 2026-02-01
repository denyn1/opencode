
import { Server } from "../src/server/server";

async function run() {
    console.log("Verifying Swarm Routes...");
    const app = Server.App();

    // Check Dashboard Route
    const resDash = await app.request("/swarm");
    if (resDash.status !== 200) throw new Error("Dashboard route failed");

    const html = await resDash.text();
    if (!html.includes("Colonies")) throw new Error("Dashboard missing Colonies tab");

    // Check API Status Route
    const resApi = await app.request("/swarm/api/status");
    const json = await resApi.json();

    if (!Array.isArray(json.colonies)) throw new Error("Status JSON missing colonies array");

    console.log("Verified");
    process.exit(0);
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
