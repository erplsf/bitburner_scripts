import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'
import {planMoney} from './plan.js'
import {rankAllForMoney} from './rank.js'

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  const perc = ns.args[0] as number
  const gpc = ns.args[1] as number
  const top = (await rankAllForMoney(ns))[0]
  const p = planMoney(ns, top, perc, gpc)
  ns.tprint(top)
  ns.tprint(p)
}
