import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'
import {buildConnectionString, getPath} from './pathfinder.js'
import {cheat, runCmd} from './utils.js'

const hosts = ['CSEC', 'avmnite-02h', 'I.I.I.I', 'run4theh111z']

export async function main(ns: NS): Promise<void> {
  for (const host of hosts) {
    if (
      ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(host) &&
      !ns.getServer(host).backdoorInstalled
    ) {
      const path = await getPath(ns, host)
      runCmd(buildConnectionString(path))
      runCmd('backdoor')
      while (
        (cheat.doc.getElementById('terminal-input') as HTMLInputElement)
          .disabled
      )
        await ns.sleep(100)
    }
  }
}
