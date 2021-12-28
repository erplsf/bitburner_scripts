import { NS } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions";
import { rootedServers } from "./utils.js";

const freeRamOnHome = 16

export function getRams(ns: NS): [string, number][] {
    const servs = rootedServers(ns)
    const rams: [string, number][] = servs.map(host => freeRamOnServ(ns, host))
    rams.sort((a, b) => a[1] - b[1])
    return rams.filter(pair => pair[1] != 0)
}

function freeRamOnServ(ns: NS, host: string): [string, number] {
        if(host == 'home')
            return [host, ns.getServerMaxRam(host)-freeRamOnHome]
        else
            return [host, ns.getServerMaxRam(host)]
}
