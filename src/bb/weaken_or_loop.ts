import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'

const silentCmds = [
  'getServerMaxMoney',
  'getServerMinSecurityLevel',
  'getServerSecurityLevel',
  'getServerMoneyAvailable',
  'weaken',
  'grow',
  'hack',
]

const secT = 0.1
const monTL = 0.15 // servers will be hacked until money is below this percentage
const monTU = 0.2 // then it will start a grow cycle until it reaches above this level again

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  let hostname: string
  if (ns.args.length == 1) hostname = ns.args[0] as string
  else hostname = ns.getHostname()

  for (const cmd of silentCmds) ns.disableLog(cmd)
  ns.clearLog()

  const maxMon = ns.getServerMaxMoney(hostname)
  const minSec = ns.getServerMinSecurityLevel(hostname)

  let growing = false
  let hacking = true

  if (maxMon > 0) {
    for (;;) {
      let curSec = ns.getServerSecurityLevel(hostname)
      let secRat = 1 - minSec / curSec

      const curMon = ns.getServerMoneyAvailable(hostname)
      const monRat = curMon / maxMon
      ns.print(
        ns.sprintf(
          'sec: %s / %s, mon: [%s <= %s <= %s]',
          secRat.toFixed(2),
          secT.toFixed(2),
          monTL.toFixed(2),
          monRat.toFixed(2),
          monTU.toFixed(2)
        )
      )

      while (secRat >= secT) {
        ns.print('w')
        await ns.weaken(hostname)
        curSec = ns.getServerSecurityLevel(hostname)
        secRat = 1 - minSec / curSec
      }

      if (monRat <= monTL && !growing) {
        // lower threshold
        growing = true
        hacking = false
      } else if (monRat >= monTU && !hacking) {
        // upper threshold
        hacking = true
        growing = false
      }

      if (growing) {
        ns.print('g')
        await ns.grow(hostname)
      }

      // const hackChance = ns.hackAnalyzeChance(hostname)
      // while(hackChance <= 0.75) await ns.weaken(hostname)

      if (hacking) {
        ns.print('h')
        await ns.hack(hostname)
      }
    }
  } else {
    for (;;) {
      ns.print('no money to steal, weaken forever')
      await ns.weaken(hostname)
    }
  }
}
