import { NS } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions";

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
    ns.run('spreader.js', 1, 'weaken_or_loop.js')
}
