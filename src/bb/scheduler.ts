import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'
import {costs, Entry, planMoney, msPad, ramPercForXpGrind} from './plan.js'
import {spread} from './spreader.js'
import {rankAllForMoney, rankAllForXp} from './rank.js'
import {rootedServers} from './utils.js'
import {nsFilename} from './pserv_manager.js'

const freeRamOnHome = 16
const files = ['hack.js', 'weaken.js', 'grow.js']

const typeMap = {
  hack: 'hack.js',
  weaken: 'weaken.js',
  grow: 'grow.js',
}

const desiredPerc = 0.5
const desiredGrowth = 2 // TODO: fix, does nothing atm // growth rate of original money

const minPerc = 0.01
const minGpc = 1

// https://www.desmos.com/calculator/ixh9vqpfic
const a = 1.5
const b = 24

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  ns.disableLog('ALL')
  // ns.enableLog('sleep')
  const once = ns.args[0] as boolean
  await scheduleAll(ns, once)
}

// TODO: implement better automatic lowering of targets
async function scheduleAll(ns: NS, once = false): Promise<void> {
  let gpc = desiredGrowth // growth rate of original money
  do {
    const ranks = await rankAllForMoney(ns)
    const servers = await getFreeRams(ns)
    await prepareServers(ns, servers)
    // const percForXpGrind = ramPercForXpGrind(ns, a, b)
    const totalTotalFreeRam = servers
      .map((p) => p.freeRam)
      .reduce((a, b) => a + b, 0)
    let totalFreeRam = totalTotalFreeRam
    // let totalFreeRam = totalTotalFreeRam * (1 - percForXpGrind)
    // ns.tprint(
    //   ns.sprintf(
    //     'free / total - %s, xp / total - %s',
    //     (totalFreeRam / totalTotalFreeRam).toFixed(2),
    //     percForXpGrind.toFixed(2)
    //   )
    // )
    // ns.tprint(ns.sprintf('server count %s', servers.length.toString()))
    // ns.tprint(ns.sprintf('ranks count %s', ranks.length.toString()))

    while (ranks.length > 0 && servers.length > 0) {
      let perc = desiredPerc
      const host = ranks[0]
      const fn = '.s.' + host + '.txt'

      // ns.tprint(ns.sprintf('host %s', host))

      if (timestampFresh(ns, fn)) {
        // ns.tprint(ns.sprintf('timestamp fresh, breaking: %s', host))
        ranks.shift()
        continue
        // break // break stops the whole scheduling, continue allows to fill with lower targets
      }
      // ns.tprint(ns.sprintf('pre-scheduling for %s', host))

      let p = planMoney(ns, host, perc, gpc)
      // if (totalFreeRam < p.totalRam) {
      //   ranks.shift()
      //   continue
      // }
      while (totalFreeRam < p.totalRam) {
        perc = Math.max(0.01, perc * 0.5)
        p = planMoney(ns, host, perc, gpc)
        if (perc === minPerc && totalFreeRam < p.totalRam) break
      } // TODO: better system, deduplicate code, implement plan downscaling

      while (totalFreeRam < p.totalRam) {
        gpc = Math.max(1, gpc * 0.5)
        p = planMoney(ns, host, perc, gpc)
        if (gpc === minGpc && totalFreeRam < p.totalRam) break
      } // TODO: better system, deduplicate code, implement plan downscaling

      if (perc === minPerc && gpc === minGpc && totalFreeRam < p.totalRam) {
        // ns.tprint('perc too small for ' + host)
        ranks.shift()
        continue
      }

      const maxCycleCount = Math.floor(p.cycleTime / msPad)
      if (maxCycleCount === 0) {
        ranks.shift()
        continue
        // break // break stops the whole scheduling, continue allows to fill with lower targets
      }
      // ns.tprint('maxCycles ' + maxCycleCount)

      let realCycleCount = 0 // TODO: refactor out into calculated value, not counted
      for (let cI = 0; cI < maxCycleCount; cI++) {
        if (totalFreeRam < p.totalRam) break
        p.entries.forEach((entry) => {
          totalFreeRam -= schedule(ns, servers, entry, p.target, msPad * cI)
        })
        realCycleCount++
      }
      if (realCycleCount === 0) {
        ranks.shift()
        continue
      }
      // ns.tprint('realCycles ' + realCycleCount)

      // ns.toast(
      //   ns.sprintf(
      //     'scheduling %s cycles for %s',
      //     realCycleCount.toString(),
      //     p.target
      //   ),
      //   'info',
      //   1000
      // )
      const targetTime = Date.now() + p.cycleTime // TODO: wtf? why it doesn't need to be bigger
      // ns.tprint("targetTime: "+targetTime)
      await writeTimestamp(ns, fn, targetTime)

      // if (totalFreeRam < p.totalRam) break

      // ns.toast(ns.sprintf("scheduling for %s", p.target), 'info')
      ranks.shift()
    }

    // ns.tprint(ns.sprintf('ramLeft: %s', totalFreeRam.toString()))

    // ns.toast('finished scheduling')

    // ns.tprint('ranks after: ' + ranks.length)
    // ns.tprint(ranks)
    if (ranks.length === 0 && ns.getHackingLevel() > 500) {
      const target = (await rankAllForXp(ns))[0]
      // const sleepTime = ns.getGrowTime(target)
      scheduleXpGrind(
        ns,
        servers,
        {
          type: 'grow',
          threads: 0,
          startOffset: 0,
          startTimestamp: 0,
          duration: 0,
          endTimestamp: 0,
        },
        target
      )
      // await ns.sleep(Math.max(sleepTime - 1000, 0))
    }
    await ns.sleep(1000)
  } while (!once)
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
  ramLeftToSchedule = entry.threads * costs[entry.type]
  // ns.tprint('threads before the loop: ' + entry.threads)
  while (ramLeftToSchedule > 0 && servers.length > 0 && entry.threads > 0) {
    if (parseFloat(servers[0].freeRam.toFixed(2)) <= costs[entry.type]) {
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
    t = Math.max(Math.min(t, entry.threads), 0)

    // ns.tprint(ns.sprintf("t: %s", t.toString()))
    const totalCost = t * costs[entry.type]
    const pid = ns.exec(
      typeMap[entry.type],
      server.name,
      t,
      host,
      entry.startOffset + cycleOffset
      // Date.now()
    )
    if (pid === 0) {
      // ns.tprint(ns.sprintf("something went wrong on %s", server[0]))
      return usedRam
    }
    usedRam += totalCost
    server.freeRam -= totalCost
    entry.threads -= t
    ramLeftToSchedule = entry.threads * costs[entry.type]
  }
  return usedRam
}

function scheduleXpGrind(
  ns: NS,
  servers: Server[],
  entry: Entry,
  host: string
): void {
  for (const server of servers) {
    const t = Math.max(Math.floor(server.freeRam / costs[entry.type]), 0)
    if (t === 0) continue

    ns.exec(typeMap[entry.type], server.name, t, host, entry.startOffset)
  }
}

async function prepareServers(ns: NS, servers: Server[]): Promise<void> {
  for (const serv of servers) {
    // if(name != 'home') ns.killall(name)
    await spread(ns, 'home', serv.name, ...files)
  }
}

export function freeRamOnServ(ns: NS, host: string): Server {
  if (host === 'home')
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
    if (Date.now() >= timestamp) {
      ns.rm(fn)
      return false
    } else {
      return true
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

export async function getFreeRams(ns: NS): Promise<Server[]> {
  const servs = await rootedServers(ns)
  const rams: Server[] = servs
    .filter((host) => !ns.fileExists(nsFilename, host))
    .map((host) => freeRamOnServ(ns, host))
    .filter((pair) => pair.freeRam !== 0)
  rams.sort((a, b) => a.freeRam - b.freeRam)
  return rams
}

export type Server = {name: string; freeRam: number}
