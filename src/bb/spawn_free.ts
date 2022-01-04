import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'

const freeRam = 16

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  const filename = ns.args.shift() as string
  const ourCost = ns.getScriptRam(ns.getScriptName())
  const baseRam = ns.getScriptRam(filename)
  const total = ns.getServerMaxRam('home')
  const used = ns.getServerUsedRam('home')
  const threads = Math.floor((total + ourCost - used - freeRam) / baseRam)
  if (threads == 0) return
  ns.toast(
    ns.sprintf(
      'will spawn %s with %d threads after exiting',
      filename,
      threads.toString()
    )
  )
  ns.spawn(filename, threads, ...(ns.args as string[]))
}
