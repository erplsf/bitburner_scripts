import { NS } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions";
import { runCmd } from "./utils.js";
import { find } from "./jump.js";

const hosts = [
    'CSEC',
    'avmnite-02h',
]

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
    for(const host of hosts) {
        if(ns.serverExists(host) &&
            ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(host) &&
            !ns.getServer(host).backdoorInstalled
        ) {
            const stck = find(ns, 'home', host, [], [])
            if(stck.length != 0)  {
                const cmd = stck.map(serv => `connect ${serv};`)
                cmd.push('backdoor')
                runCmd(cmd.join(''))
            }
        }
    }
}
