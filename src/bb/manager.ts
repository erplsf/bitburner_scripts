import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'
import {allFactionsJoined} from './factions.js'
import {getUniqueServers} from './pathfinder.js'
import {progs as programs} from './progs_manager.js'
import {pServsMaxed} from './pserv_manager'

const progs = programs.map((pair) => pair[0])

const keepRamForProgs = [
  'sync.js',
  'progs_manager.js',
  'factions.js',
  'rooter.js',
  'pserv_manager.js',
  'hs_manager.js',
]

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  const host = ns.getHostname()
  // ns.disableLog('ALL')
  ns.rm('servers.db.txt')
  let allRooted = false
  let allBought = false
  let pMaxed = false
  let allFactions = false
  for (;;) {
    // calculate ram to hold
    let keepMemFree = 0
    for (const prog of keepRamForProgs) {
      if (ns.ps(host).filter((pi) => pi.filename === prog).length === 0) {
        keepMemFree += ns.getScriptRam(prog)
      }
    }

    // syncer
    if (ns.ps(host).filter((pi) => pi.filename === 'sync.js').length === 0) {
      ns.run('sync.js', 1, Date.now().toString())
    }

    // prog_manager
    if (
      !allBought &&
      progs.map((fn) => ns.fileExists(fn)).filter((b) => !b).length !== 0
    )
      ns.run('progs_manager.js')
    else {
      allBought = true
    }

    // factions
    if (!allFactions) {
      if (!allFactionsJoined(ns)) {
        ns.run('factions.js')
      } else {
        allFactions = true
      }
    }

    // rooter
    if (!allRooted) {
      const rootedSet = new Set(
        (await getUniqueServers(ns))
          .filter((host) => ns.serverExists(host))
          .map((host) => ns.hasRootAccess(host))
      )
      if (rootedSet.size !== 1) {
        ns.run('rooter.js')
      } else {
        allRooted = true
      }
    }

    // scheduler
    if (
      ns.ps(host).filter((pi) => pi.filename === 'scheduler.js').length === 0
    ) {
      if (ns.getServerMaxRam(host) > 32) {
        ns.run('scheduler.js', 1, false, keepMemFree)
      } else {
        ns.run('scheduler.js', 1, true, keepMemFree)
      }
    }

    // pserv_manager
    if (!pMaxed) {
      if (
        ns.ps(host).filter((pi) => pi.filename === 'pserv_manager.js')
          .length === 0
      ) {
        if (pServsMaxed(ns)) {
          pMaxed = true
        } else {
          ns.run('pserv_manager.js')
        }
      }
    }

    // hs_manager
    if (
      ns.ps(host).filter((pi) => pi.filename === 'hs_manager.js').length === 0
    ) {
      ns.run('hs_manager.js')
    }

    await ns.sleep(1 * 1000)
  }
}
