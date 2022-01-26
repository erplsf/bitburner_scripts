// sing-er - Singularity Manager
import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'
import {buyProgsIfNeeded} from './progs_manager'

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  let hasTor = false
  let hasProgs = false
  for (;;) {
    // RAM first
    while (ns.getUpgradeHomeRamCost() <= ns.getServerMoneyAvailable('home'))
      ns.upgradeHomeRam()

    // TOR
    if (
      !hasTor &&
      ns.getServerMoneyAvailable('home') >= 200 * Math.pow(10, 3)
    ) {
      ns.purchaseTor()
      hasTor = true
    }

    // programs
    if (!hasProgs) {
      const noneBought = buyProgsIfNeeded(ns)
      if (noneBought) hasProgs = true
    }
  }
}
