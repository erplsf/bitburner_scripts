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

const perc = 0.05

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
    const ranks = rankAll(ns)
    const servs = getRams(ns)
    const plans = ranks.map(s => plan(ns, s, perc))
    scheduleAll(ns, servs, plans)
}

function scheduleAll(ns: NS, servers: Server[], plans: Plan[]): void {
    prepareServers(ns, servers)
    while (plans.length > 0 && servers.length > 0) {
        const totalFreeRam = servers.map(p => p[1]).reduce((a, b) => a + b, 0)
        const plan = plans.shift() as Plan
        if (totalFreeRam < plan.totalRam) break
        let scheduled: boolean
        while(plan.entries.length > 0) {
            const entry = plan.entries.shift() as Entry
            scheduled = schedule(ns, servers, entry)
        }
    }
}

function schedule(ns: NS, servers: Server[], entry: Entry): boolean {
    const minRam = Math.min(costs.weaken, costs.grow, costs.hack)
    let ramLeftToSchedule = entry.threads * costs[entry.type]
    while(ramLeftToSchedule > 0 && servers.length > 0) {
        if(servers[0][1] < minRam) servers.shift()
        const server = servers[0] as Server
        const maxRam = ramLeftToSchedule - server[1]
        const t = Math.floor(maxRam / costs[entry.type])
        const totalCost = t * costs[entry.type]
        const pid = ns.exec(typeMap[entry.type], server[0], t)
        if(pid == 0) ns.tprint(ns.sprintf("something went wrong on %s", server[0]))
        server[1] -= totalCost
    }
    if(ramLeftToSchedule > 0)
        return false
    else
        return true
}

function prepareServers(ns: NS, servers: Server[]): void {
    for(const [name] of servers) {
        if(name != 'home') ns.killall(name)
        spread(ns, 'home', name, ...files)
    }
}

export function getRams(ns: NS): Server[] {
    const servs = rootedServers(ns)
    const rams: [string, number][] = servs.map(host => freeRamOnServ(ns, host)).filter(pair => pair[1] != 0)
    rams.sort((a, b) => a[1] - b[1])
    return rams
}

function freeRamOnServ(ns: NS, host: string): Server {
        if(host == 'home')
            return [host, ns.getServerMaxRam(host)-freeRamOnHome]
        else
            return [host, ns.getServerMaxRam(host)]
}

type Server = [string, number]
