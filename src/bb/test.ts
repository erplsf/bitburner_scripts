import { NS } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions";
import { plan } from "./plan.js";
import { rankAll } from "./rank.js";

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
    const top = rankAll(ns)[0]
    const p = plan(ns, top, 0.5)
    ns.tprint(top)
    ns.tprint(p)
}
