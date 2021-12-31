import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'

// const silentCmds = [
//     'weaken',
// ]

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  const host = ns.args[0] as string

  // for(const cmd of silentCmds) ns.disableLog(cmd)
  // ns.clearLog()

  for (;;) await ns.weaken(host)
}
