import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'
import {planMoney, planXp} from './plan.js'
import {rankAll} from './rank.js'

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  const perc = ns.args[0] as number
  const gpc = ns.args[1] as number
  const top = (await rankAll(ns))[0]
  const p = planMoney(ns, top, perc, gpc)
  ns.tprint(top)
  ns.tprint(p)
  // planXp(ns, 'home', 1000)
}

function calculateGainedFavor(rep: number): number {
  return 1 + Math.log((rep + 25000) / 25000) / Math.log(1.02)
}
