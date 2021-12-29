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

const desiredPerc = 0.5
const desiredGrowth = 2 // growth rate of original money

const minPerc = 0.01

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
    const ranks = rankAll(ns)
    const servs = getRams(ns)
    // await scheduleAll(ns, servs, [ranks[0]])
    await scheduleAll(ns, servs, ranks)
}

// TODO: implement better automatic lowering of targets
async function scheduleAll(ns: NS, servers: Server[], ranks: string[]): Promise<void> {
    await prepareServers(ns, servers)
    let perc = desiredPerc
    let gpc = desiredGrowth // growth rate of original money
    while (ranks.length > 0 && servers.length > 0) {
        const serv = ranks[0]
        const fn = '.s.'+serv+'.txt'

        // ns.tprint("checking serv: " + serv)
        if(ns.fileExists(fn)) {
            const timestamp = ns.read(fn) as number
            // ns.tprint("currentTime: " + Date.now().toString())
            // ns.tprint("timeRead: " + timestamp.toString())
            if (timestamp >= Date.now()) {
                // ns.tprint("timestamp lower skipping")
                ranks.shift()
                break // TODO: break will stop until target finishes, continue will fill other plans too
            } else {
                // ns.tprint("timestamp higher, removing and running")
                ns.rm(fn)
            }
        }

        const totalFreeRam = servers.map(p => p[1]).reduce((a, b) => a + b, 0)
        const cTime = 0 // current
        let p = plan(ns, serv, perc, gpc)
        // ns.tprint(ns.sprintf("free / total: %s / %s", totalFreeRam.toString(), plan.totalRam.toString()))
        while (totalFreeRam < p.totalRam && perc >= minPerc) {
            perc *= 0.5
            gpc *= 0.5
            p = plan(ns, serv, perc, gpc)
            // break // TODO: break or continue? break will only schedule top ones, continue will fill all
        }
        if (perc < minPerc) break
        if (totalFreeRam < p.totalRam) break
        ns.toast(ns.sprintf("scheduling for %s", p.target), 'info')
        // ns.toast(ns.sprintf("scheduling for %s with %s %s", p.target, perc.toString(), gpc.toString()), 'info')
        while(p.entries.length > 0) {
            const entry = p.entries.shift() as Entry
            // ns.tprint(entry)
            schedule(ns, servers, entry, p.target)
        }
        const targetTime = (Date.now()+p.cycleTime).toString()
        // ns.tprint("targetTime: "+targetTime)
        await ns.write(fn, [targetTime], 'w')
        ranks.shift()
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
        const t = Math.min(Math.floor(server[1] / costs[entry.type]), entry.threads)
        // ns.tprint(ns.sprintf("t: %s", t.toString()))
        const totalCost = t * costs[entry.type]
        const pid = ns.exec(typeMap[entry.type], server[0], t, host, entry.offset, Date.now())
        if(pid == 0) {
            // ns.tprint(ns.sprintf("something went wrong on %s", server[0]))
            return false
        }
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
    if(host == 'home')
        return [host, ns.getServerMaxRam(host)-ns.getServerUsedRam(host)-freeRamOnHome]
    else
        return [host, ns.getServerMaxRam(host)-ns.getServerUsedRam(host)]
}

type Server = [string, number]
