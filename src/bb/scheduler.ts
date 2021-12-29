import { NS } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions";
import { rootedServers } from "./utils.js";
import { costs, Entry, plan, Plan } from "./plan.js";
import { spread } from "./spreader.js";
import { rankAll } from "./rank.js";

const freeRamOnHome = 16
const files = [
    'hack.js',
    'weaken.js',
    'grow.js',
]

const typeMap = {
    'hack': 'hack.js',
    'weaken': 'weaken.js',
    'grow': 'grow.js',
}

const perc = 0.1

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
    const ranks = rankAll(ns)
    const servs = getRams(ns)
    const plans = ranks.map(s => plan(ns, s, perc))
    await scheduleAll(ns, servs, plans)
}

async function scheduleAll(ns: NS, servers: Server[], plans: Plan[]): Promise<void> {
    await prepareServers(ns, servers)
    while (plans.length > 0 && servers.length > 0) {
        const totalFreeRam = servers.map(p => p[1]).reduce((a, b) => a + b, 0)
        const plan = plans.shift() as Plan
        // ns.tprint(ns.sprintf("free / total: %s / %s", totalFreeRam.toString(), plan.totalRam.toString()))
        if (totalFreeRam < plan.totalRam) break // TODO: break or continue? break will only schedule top ones, continue will fill all
        ns.toast(ns.sprintf("scheduling for %s", plan.target), 'info')
        while(plan.entries.length > 0) {
            const entry = plan.entries.shift() as Entry
            // ns.tprint(entry)
            schedule(ns, servers, entry, plan.target)
        }
    }
}

function schedule(ns: NS, servers: Server[], entry: Entry, host: string): boolean {
    const minRam = Math.min(costs.weaken, costs.grow, costs.hack)
    let ramLeftToSchedule = entry.threads * costs[entry.type]
    while(ramLeftToSchedule > 0 && servers.length > 0) {
        if(servers[0][1] < minRam) {
            servers.shift()
            continue
        }
        const server = servers[0] as Server
        // ns.tprint(ns.sprintf("s: %s", server[0]))
        const t = Math.floor(server[1] / costs[entry.type])
        // ns.tprint(ns.sprintf("t: %s", t.toString()))
        const totalCost = t * costs[entry.type]
        const pid = ns.exec(typeMap[entry.type], server[0], t, host, entry.offset)
        if(pid == 0) ns.tprint(ns.sprintf("something went wrong on %s", server[0]))
        server[1] -= totalCost
        entry.threads -= t
        ramLeftToSchedule = entry.threads * costs[entry.type]
    }
    if(ramLeftToSchedule > 0)
        return false
    else
        return true
}

async function prepareServers(ns: NS, servers: Server[]): Promise<void> {
    for(const [name] of servers) {
        // if(name != 'home') ns.killall(name)
        await spread(ns, 'home', name, ...files)
    }
}

export function getRams(ns: NS): Server[] {
    const servs = rootedServers(ns)
    const rams: [string, number][] = servs.map(host => freeRamOnServ(ns, host)).filter(pair => pair[1] != 0)
    rams.sort((a, b) => a[1] - b[1])
    return rams
}

function freeRamOnServ(ns: NS, host: string): Server {
    return [host, ns.getServerMaxRam(host)-ns.getServerUsedRam(host)]
}

type Server = [string, number]
