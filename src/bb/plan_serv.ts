import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'
import {planMoney, planMoneyWithFormulas} from './plan.js'
import {rankAllForMoney} from './rank.js'

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  const host = ns.args[0] as string
  const perc = ns.args[1] as number
  const gpc = ns.args[2] as number
  const wpc = ns.args[3] as number
  const p = planMoneyWithFormulas(ns, host, perc, gpc, wpc)
  ns.tprint(host)
  ns.tprint(p)
}
