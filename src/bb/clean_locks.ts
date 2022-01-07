import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  const regex = /\.s\..*/
  const files = ns.ls(ns.getHostname())
  for (const file of files) {
    if (file.match(regex)) ns.rm(file)
  }
}
