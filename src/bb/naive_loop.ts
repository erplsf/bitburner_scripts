import { NS } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions";
import { serverMoneyP, serverSecurityP } from "./utils";

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
    let hostname: string;
    if(ns.args.length == 1)
        hostname = ns.args[0] as string
    else
        hostname = ns.getHostname();

    for(;;) {
        const serv = ns.getServer(hostname)
        while(serverSecurityP(serv) >= 0.05) await ns.weaken(hostname)
        if(serverMoneyP(serv) <= 0.95)
            await ns.grow(hostname)
        else
            await ns.hack(hostname)
    }
}
