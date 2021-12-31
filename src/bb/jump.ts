import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'
import {buildConnectionString, getPath} from './pathfinder.js'
import {runCmd} from './utils.js'

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  if (ns.args.length < 1) return

  const target = ns.args[0] as string

  const path = await getPath(ns, target)
  const cmd = buildConnectionString(path)

  runCmd(cmd)
}

export function autocomplete({servers}: {servers: string[]}): string[] {
  return servers
}
