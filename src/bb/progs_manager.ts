import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'
import {runCmd} from './utils.js'

export const progs: [string, number][] = [
  ['brutessh.exe', 500 * Math.pow(10, 3)],
  ['ftpcrack.exe', 1.5 * Math.pow(10, 6)],
  ['relaysmtp.exe', 5 * Math.pow(10, 6)],
  ['httpworm.exe', 30 * Math.pow(10, 6)],
  ['sqlinject.exe', 250 * Math.pow(10, 6)],
  ['formulas.exe', 5 * Math.pow(10, 9)],
]

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  if (ns.getPlayer().tor) {
    for (const fn of progs) {
      buyProgIfNeeded(ns, fn)
    }
  }
}

function buyProgIfNeeded(ns: NS, [progname, cost]: [string, number]): void {
  if (!ns.fileExists(progname) && ns.getServerMoneyAvailable('home') >= cost) {
    runCmd(`home;buy ${progname}`)
  }
}
