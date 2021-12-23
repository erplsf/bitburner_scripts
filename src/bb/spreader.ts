import { NS } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions";
import { filterServers } from "./utils.js";

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
    const rootedServers = filterServers(ns, serv => serv.hasAdminRights)
    for(const serv of rootedServers) ns.tprint(serv.hostname)
}
