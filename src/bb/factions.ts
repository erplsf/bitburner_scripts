import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'
import {buildConnectionString, getPath} from './pathfinder.js'
import {cheat, runCmd} from './utils.js'

export const factions: [string, string][] = [
  ['CSEC', 'Sector-12'],
  ['avmnite-02h', 'NiteSec'],
  ['I.I.I.I', 'The Black Hand'],
  ['run4theh111z', 'BitRunners'],
]

export async function main(ns: NS): Promise<void> {
  let anyBackdoored = false
  for (const host of factions.map((pair) => pair[0])) {
    if (
      ns.hasRootAccess(host) &&
      ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(host) &&
      !ns.getServer(host).backdoorInstalled
    ) {
      const path = await getPath(ns, host)
      if (!runCmd(buildConnectionString(path))) return
      if (!runCmd('backdoor')) return
      while (
        (cheat.doc.getElementById('terminal-input') as HTMLInputElement)
          .disabled
      )
        await ns.sleep(100)
      anyBackdoored = true
    }
  }
  if (anyBackdoored) runCmd('home')
}

export function allFactionsJoined(ns: NS): boolean {
  const joinedFactions = ns.getPlayer().factions
  return factions.every((pair) => joinedFactions.includes(pair[1]))
}
