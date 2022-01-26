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
  buyProgsIfNeeded(ns)
}

export function buyProgsIfNeeded(ns: NS): boolean {
  const boughtProgs = []
  if (ns.getPlayer().tor) {
    const sFiles = ns.getOwnedSourceFiles()
    const sf4 = sFiles.find((sf) => sf.n === 4)
    for (const [fn, cost] of progs) {
      if (!ns.fileExists(fn) && ns.getServerMoneyAvailable('home') >= cost) {
        if (sf4) {
          boughtProgs.push(ns.purchaseProgram(fn))
        } else {
          runCmd(`home;buy ${fn}`)
          boughtProgs.push(true)
        }
      }
    }
  }
  return boughtProgs.some((b) => b)
}
