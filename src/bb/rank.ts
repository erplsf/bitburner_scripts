import { NS } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions";
import { rootedHackableServers } from "./utils.js";

export function rankAll(ns: NS): string[] {
    const servs = rootedHackableServers(ns)
    const ranks: [string, number][] = servs.map(host => [host, rankOne(ns, host)])
    ranks.sort((a, b) => {
        return a[1] - b[1];
    }).reverse()
    return ranks.filter(pair => pair[1] != 0).map(pair => pair[0])
}

function rankOne(ns: NS, host: string): number {
    const wT = Math.ceil(ns.getWeakenTime(host))
    const mM = ns.getServerMaxMoney(host)
    return Math.ceil(mM / wT)
}
