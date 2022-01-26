import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  const perc = ns.args[0] as number
  const hToSpend = ns.hacknet.numHashes() * perc
  const bTimes = Math.floor(hToSpend / ns.hacknet.hashCost('Sell for Money'))
  for (let i = 0; i < bTimes; i++) ns.hacknet.spendHashes('Sell for Money')
}
