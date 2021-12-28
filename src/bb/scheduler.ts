import { NS } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions";
import { rootedServers } from "./utils.js";

function getRams(ns: NS): [string, number][] {
    const servs = rootedServers(ns)
    const rams: [string, number][] = servs.map(host => [host, ns.getServerMaxRam(host)])
    return rams
}
