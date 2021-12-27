import { NS } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions";
import { rootedHackableServers } from "./utils.js";

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
    const filename = ns.args[0] as string

    if (filename.length == 0) return
    if (!ns.fileExists(filename)) return

    const rootedServers = rootedHackableServers(ns)
    ns.tprint(rootedServers)
    for(const serv of rootedServers) {
        // ns.tprint(ns.sprintf("spreading for %s", serv))
        ns.killall(serv)
        // ns.tprint(ns.sprintf("killed everything on %s", serv))
        await ns.scp(filename, 'home', serv)
        // ns.tprint(ns.sprintf("copied %s to %s", filename, serv))
        const threads = Math.floor(ns.getServerMaxRam(serv)/ns.getScriptRam(filename, serv))
        // ns.tprint(ns.sprintf("can run with %d threads on %s", threads.toString(), serv))
        const pid = ns.exec(filename, serv, threads)
        if(pid == 0) ns.tprint(ns.sprintf("something went wrong on %s", serv))
    }
}
