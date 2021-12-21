import { NS } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions";

export async function main(ns: NS): Promise<void> {
    ns.tprint(ns.args[0]);
    await ns.hack(ns.args[0].toString());
}
