import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  if (ns.args.length != 1) return
  const regex = ns.args[0] as string
  const files = ns.ls(ns.getHostname())
  for (const file of files) {
    if (file.match(regex)) ns.rm(file)
  }
}
