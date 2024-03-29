import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'
import {rootedHackableServers} from './utils.js'

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  if (ns.args.length < 1) return

  const filename = ns.args.shift() as string

  let replace = false
  if (ns.args.length >= 2) replace = ns.args.shift() as boolean

  if (filename.length === 0) return
  if (!ns.fileExists(filename)) return

  const rootedServers = rootedHackableServers(ns)
  for (const serv of await rootedServers) {
    // ns.tprint(ns.sprintf("spreading for %s", serv))
    if (replace) {
      ns.killall(serv)
      ns.tprint(ns.sprintf('killed everything on %s', serv))
    }

    const runs = ns.scriptRunning(filename, serv)
    if (!runs) {
      await ns.scp(filename, 'home', serv)
      // ns.tprint(ns.sprintf("copied %s to %s", filename, serv))
      const threads = Math.floor(
        ns.getServerMaxRam(serv) / ns.getScriptRam(filename, serv)
      )
      // ns.tprint(ns.sprintf("can run with %d threads on %s", threads.toString(), serv))
      if (threads === 0) continue
      const pid = ns.exec(filename, serv, threads, ...ns.args)
      if (pid === 0)
        ns.toast(ns.sprintf('something went wrong on %s', serv), 'error')
      else ns.toast(ns.sprintf('started %s on %s', filename, serv), 'info')
    }
  }
}

export async function spread(
  ns: NS,
  from: string,
  to: string,
  ...files: string[]
): Promise<void> {
  for (const file of files) {
    await ns.scp(file, from, to)
  }
}
