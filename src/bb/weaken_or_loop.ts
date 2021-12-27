import { NS } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions";

const silentCmds = [
    'getServerMaxMoney',
    'getServerMinSecurityLevel',
    'getServerSecurityLevel',
    'getServerMoneyAvailable',
    'weaken',
    'grow',
    'hack',
]

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
    let hostname: string;
    if(ns.args.length == 1)
        hostname = ns.args[0] as string
    else
        hostname = ns.getHostname();

    for(const cmd of silentCmds) ns.disableLog(cmd)

    const maxMon = ns.getServerMaxMoney(hostname)
    const minSec = ns.getServerMinSecurityLevel(hostname)

    let growing = false
    let hacking = true

    if(maxMon > 0) {
        for(;;) {
            const curSec = ns.getServerSecurityLevel(hostname)
            while((1 - (minSec / curSec)) >= 0.1) await ns.weaken(hostname)

            const curMon = ns.getServerMoneyAvailable(hostname)
            if((curMon / maxMon) <= 0.01 && !growing) {  // lower threshold
                growing = true
                hacking = false
            } else if ((curMon / maxMon) >= 0.5 && !hacking) { // upper threshold
                hacking = true
                growing = false
            }

            if (growing) await ns.grow(hostname)

            // const hackChance = ns.hackAnalyzeChance(hostname)
            // while(hackChance <= 0.75) await ns.weaken(hostname)

            if (hacking) await ns.hack(hostname)
        }
    } else {
        for(;;) {
            await ns.weaken(hostname)
        }
    }
}
