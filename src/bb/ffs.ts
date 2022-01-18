import {
  NS,
  ProcessInfo,
} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'
import {rootedServers} from './utils.js'

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  const host = ns.args[0] as string
  const servs = await rootedServers(ns)
  let wantedScripts: ProcessInfo[] = []
  for (const serv of servs) {
    wantedScripts = wantedScripts.concat(
      ns.ps(serv).filter((pi) => pi.args[0] === host)
    )
  }
  ns.tprint(wantedScripts)
}
