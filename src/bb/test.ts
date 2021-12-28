import { NS } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions";
import { getRams } from "./scheduler.js";

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
    ns.tprint(getRams(ns))
}
