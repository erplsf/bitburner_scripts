import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'
import {getUniqueServers} from './pathfinder.js'

const rooterParams = ['60', 'rooter.js']
const schedulerParams = ['10', 'scheduler.js']

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  ns.disableLog('ALL')
  for (;;) {
    // syncer
    if (ns.ps('home').filter((pi) => pi.filename == 'sync.js').length == 0) {
      ns.run('sync.js', 1, Date.now().toString())
    }

    // rooter
    const allRooted = new Set(
      (await getUniqueServers(ns)).map((host) => ns.hasRootAccess(host))
    )
    if (allRooted.size != 1) {
      ns.run('keeper.js', 1, ...rooterParams)
    } else if (allRooted.size == 1 && Array.from(allRooted)[0] == true) {
      ns.kill('keeper.js', ns.getHostname(), ...rooterParams)
    }

    // scheduler
    ns.run('keeper.js', 1, ...schedulerParams)

    await ns.sleep(10000)
  }
}
