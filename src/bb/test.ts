import { NS } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions";
import { plan } from "./plan.js"
// import { rankAll } from "./rank.js"

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
    const perc = 0.05
    const host = ns.args[0] as string
    const p = plan(ns, host, perc)
    ns.tprint(p)
    // ns.tprint(rankAll(ns))
}
