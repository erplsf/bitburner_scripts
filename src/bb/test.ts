import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  const host = ns.args[0] as string
  const s = ns.getServer(host)
  ns.tprint(s.moneyAvailable / s.moneyMax)
}
