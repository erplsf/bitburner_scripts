import { NS } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions";

const silentCmds = [
    'hack',
    'sleep',
]

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
    const host = ns.args[0] as string
    const wait = ns.args[1] as number

    // for(const cmd of silentCmds) ns.disableLog(cmd)
    ns.clearLog()

    await ns.sleep(wait)
    await ns.hack(host)
}
