import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'
import {costs, Entry, planMoney, msPad} from './plan.js'
import {spread} from './spreader.js'
import {rankAll, weakestServer} from './rank.js'
import {rootedServers} from './utils.js'
import {nsFilename} from './pserv_manager.js'

const freeRamOnHome = 16
const files = ['hack.js', 'weaken.js', 'grow.js']

const typeMap = {
  hack: 'hack.js',
  weaken: 'weaken.js',
  grow: 'grow.js',
}

const desiredPerc = 0.75
const desiredGrowth = 2 // growth rate of original money

const minPerc = 0.01

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  const ranks = await rankAll(ns)
  const servs = await getFreeRams(ns)
  // await scheduleAll(ns, servs, [ranks[0]])
  await scheduleAll(ns, servs, ranks)
}

// TODO: implement better automatic lowering of targets
async function scheduleAll(
  ns: NS,
  servers: Server[],
  ranks: string[]
): Promise<void> {
  await prepareServers(ns, servers)
  let perc = desiredPerc
  let gpc = desiredGrowth // growth rate of original money
  let totalFreeRam = servers.map((p) => p.freeRam).reduce((a, b) => a + b, 0)
  while (ranks.length > 0 && servers.length > 0) {
    const host = ranks[0]
    const fn = '.s.' + host + '.txt'

    if (timestampFresh(ns, fn)) {
      ranks.shift()
      break // break stops the whole scheduling, continue allows to fill with lower targets
    }

    const p = planMoney(ns, host, perc, gpc)
    const cycleCount = Math.floor(p.cycleTime / msPad)
    if (cycleCount == 0) break

    for (let cI = 0; cI < cycleCount; cI++) {
      if (totalFreeRam < p.totalRam) break
      p.entries.forEach((entry) => {
        totalFreeRam -= schedule(ns, servers, entry, p.target, msPad * cI)
      })
    }

    ns.toast(
      ns.sprintf(
        'scheduling %s cycles for %s',
        cycleCount.toString(),
        p.target
      ),
      'info',
      2000
    )
    const targetTime = Date.now() + p.cycleTime + msPad * (cycleCount - 1)
    // ns.tprint("targetTime: "+targetTime)
    await writeTimestamp(ns, fn, targetTime)

    if (totalFreeRam < p.totalRam) break

    // ns.toast(ns.sprintf("scheduling for %s", p.target), 'info')
    ranks.shift()
  }

  // ns.tprint(ns.sprintf('ramLeft: %s', totalFreeRam.toString()))

  const minServer = await weakestServer(ns)
  // ns.tprint('weakest: ' + minServer)
  schedule(ns, servers, {type: 'weaken', threads: 0, offset: 0}, minServer, 0)
}

function schedule(
  ns: NS,
  servers: Server[],
  entry: Entry,
  host: string,
  cycleOffset: number
): number {
  let usedRam = 0
  let ramLeftToSchedule: number
  if (entry.threads != 0) {
    ramLeftToSchedule = entry.threads * costs[entry.type]
  } else {
    ramLeftToSchedule = servers
      .map((serv) => serv.freeRam)
      .reduce((a, b) => a + b, 0)
  }
  // ns.tprint('threads before the loop: ' + entry.threads)
  while (ramLeftToSchedule > 0 && servers.length > 0) {
    if (parseFloat(servers[0].freeRam.toFixed(2)) <= costs[entry.type]) {
      // TODO: fix rounding
      servers.shift()
      continue
    }
    const server = servers[0] as Server
    // ns.tprint(
    //   ns.sprintf(
    //     'free %s cost %s',
    //     server.freeRam.toString(),
    //     costs[entry.type].toString()
    //   )
    // )
    let t = Math.floor(server.freeRam / costs[entry.type])
    // ns.tprint('t after first calc: ' + t)
    // ns.tprint('e: ' + JSON.stringify(entry))

    if (entry.threads != 0) {
      t = Math.max(Math.min(t, entry.threads), 0)
      // ns.tprint('t: ' + JSON.stringify(entry))
      // ns.tprint('t not zero, adjust: ' + t)
    } else {
      // ns.tprint('t: ' + t)
    }

    if (t == 0) {
      ns.tprint('freeRam: ' + server.freeRam.toFixed(2))
      ns.tprint('t: ' + JSON.stringify(entry))
      ns.tprint('t: ' + t)
    }

    // ns.tprint(ns.sprintf("t: %s", t.toString()))
    const totalCost = t * costs[entry.type]
    const pid = ns.exec(
      typeMap[entry.type],
      server.name,
      t,
      host,
      entry.offset + cycleOffset,
      Date.now()
    )
    if (pid == 0) {
      // ns.tprint(ns.sprintf("something went wrong on %s", server[0]))
      return usedRam
    }
    usedRam += totalCost
    server.freeRam -= totalCost
    if (entry.threads == t) break
    if (entry.threads != 0) entry.threads -= t
    if (entry.threads == 0) {
      ramLeftToSchedule -= totalCost
    } else {
      ramLeftToSchedule = entry.threads * costs[entry.type]
    }
  }
  return usedRam
}

async function prepareServers(ns: NS, servers: Server[]): Promise<void> {
  for (const serv of servers) {
    // if(name != 'home') ns.killall(name)
    await spread(ns, 'home', serv.name, ...files)
  }
}

export function freeRamOnServ(ns: NS, host: string): Server {
  if (host == 'home')
    return {
      name: host,
      freeRam:
        ns.getServerMaxRam(host) - ns.getServerUsedRam(host) - freeRamOnHome,
    }
  else
    return {
      name: host,
      freeRam: ns.getServerMaxRam(host) - ns.getServerUsedRam(host),
    }
}

function timestampFresh(ns: NS, fn: string): boolean {
  // ns.tprint("checking serv: " + serv)
  if (ns.fileExists(fn)) {
    const timestamp = ns.read(fn) as number
    // ns.tprint("currentTime: " + Date.now().toString())
    // ns.tprint("timeRead: " + timestamp.toString())
    if (timestamp >= Date.now()) {
      // ns.tprint("timestamp lower skipping")
      return true // TODO: break will stop until target finishes, continue will fill other plans too
    } else {
      // ns.tprint("timestamp higher, removing and running")
      ns.rm(fn)
      return false
    }
  }
  return false
}

async function writeTimestamp(
  ns: NS,
  fn: string,
  timestamp: number
): Promise<void> {
  await ns.write(fn, [timestamp.toString()], 'w')
}

async function getFreeRams(ns: NS): Promise<Server[]> {
  const servs = await rootedServers(ns)
  const rams: Server[] = servs
    .filter((host) => !ns.fileExists(nsFilename, host))
    .map((host) => freeRamOnServ(ns, host))
    .filter((pair) => pair.freeRam != 0)
  rams.sort((a, b) => a.freeRam - b.freeRam)
  return rams
}

export type Server = {name: string; freeRam: number}
