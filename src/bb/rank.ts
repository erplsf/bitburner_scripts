import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'
import {rootedHackableServers} from './utils.js'

export async function rankAll(ns: NS): Promise<string[]> {
  const servs = await rootedHackableServers(ns)
  const ranks: [string, number][] = servs.map((host) => [
    host,
    rankOne(ns, host),
  ])
  ranks
    .sort((a, b) => {
      return a[1] - b[1]
    })
    .reverse()
  return ranks.filter((pair) => pair[1] != 0).map((pair) => pair[0])
}

export async function weakestServer(ns: NS): Promise<string> {
  const servs = await rootedHackableServers(ns)
  const ranks: [string, number][] = servs.map((host) => [
    host,
    ns.getServerMinSecurityLevel(host),
  ])
  ranks.sort((a, b) => {
    return a[1] - b[1]
  })
  return ranks[0][0]
}

function rankOne(ns: NS, host: string): number {
  const minSec = ns.getServerMinSecurityLevel(host)
  const curSec = ns.getServerSecurityLevel(host)
  const secCorrectionFactor = minSec / curSec
  const wT = Math.ceil(ns.getWeakenTime(host))
  const mM = ns.getServerMaxMoney(host)
  const cTH = ns.hackAnalyzeChance(host)
  return Math.ceil((mM / (wT * secCorrectionFactor)) * cTH)
}
