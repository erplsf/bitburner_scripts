import { NS } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions";

const silentCmds = [
    'weaken',
]

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
    let hostname: string;
    if(ns.args.length == 1)
        hostname = ns.args[0] as string
    else
        hostname = ns.getHostname();

    for(const cmd of silentCmds) ns.disableLog(cmd)
    ns.clearLog()

    for(;;) {
        await ns.weaken(hostname)
    }
}
