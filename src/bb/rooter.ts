import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'

import {getUniqueServers} from './pathfinder.js'

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  let servers = await getUniqueServers(ns)
  let runForever = false
  if (ns.args.length != 0 && ns.args[0] == true) {
    runForever = true
  }
  do {
    const kits = getRootkits(ns)
    servers = servers.filter(
      (server) => ns.serverExists(server) && !ns.hasRootAccess(server)
    )
    for (const server of servers) {
      if (kits.length >= ns.getServerNumPortsRequired(server)) {
        for (const kit of kits) kit(server)
        ns.nuke(server)
        const message = ns.sprintf('gained root access for: %s', server)
        ns.toast(message, 'success')
      }
    }
    if (runForever) await ns.sleep(1000)
  } while (runForever)
}

type Rootkit = (host: string) => void

function getRootkits(ns: NS): Rootkit[] {
  const kits = []
  if (ns.fileExists('brutessh.exe')) kits.push(ns.brutessh)
  if (ns.fileExists('ftpcrack.exe')) kits.push(ns.ftpcrack)
  if (ns.fileExists('httpworm.exe')) kits.push(ns.httpworm)
  if (ns.fileExists('relaysmtp.exe')) kits.push(ns.relaysmtp)
  if (ns.fileExists('sqlinject.exe')) kits.push(ns.sqlinject)
  return kits
}
