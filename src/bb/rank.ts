import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'
import {rootedHackableServers} from './utils.js'

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  const ms = await rankAllForMoney(ns)
  ns.tprint('ranks for money:')
  ns.tprint(ms)

  const xps = await rankAllForXp(ns)
  ns.tprint('ranks for xp')
  ns.tprint(xps)
}

export async function rankAllForMoney(ns: NS): Promise<string[]> {
  const servs = await rootedHackableServers(ns)
  if (ns.fileExists('formulas.exe', 'home')) {
    return rate(ns, servs, rankOneWithFormulasForMoney)
  } else {
    return rate(ns, servs, rankOneForMoney)
  }
}

function rate(ns: NS, servers: string[], rf: RatingFunction): string[] {
  return servers
    .map((host) => [host, rf(ns, host)] as [string, number])
    .slice()
    .sort((a: Ranking, b: Ranking) => {
      return a[1] - b[1]
    })
    .reverse()
    .map((pair) => pair[0])
}

type Ranking = [string, number]
type RatingFunction = (ns: NS, host: string) => number

export async function rankAllForXp(ns: NS): Promise<string[]> {
  const servs = await rootedHackableServers(ns)
  if (ns.fileExists('formulas.exe', 'home')) {
    return rate(ns, servs, rankOneWithFormulasForXp)
  } else {
    return rate(ns, servs, rankOneForXp)
  }
}

function rankOneForXp(ns: NS, host: string): number {
  const minSec = ns.getServerMinSecurityLevel(host)
  const gT = ns.getGrowTime(host)
  return Math.ceil((1 / gT) * (1 / minSec))
}

function rankOneWithFormulasForXp(ns: NS, host: string): number {
  const p = ns.getPlayer()
  const s = ns.getServer(host)
  s.hackDifficulty = s.minDifficulty
  const gT = ns.formulas.hacking.growTime(s, p)
  return Math.ceil((1 / gT) * (1 / s.minDifficulty))
}

function rankOneForMoney(ns: NS, host: string): number {
  const minSec = ns.getServerMinSecurityLevel(host)
  const curSec = ns.getServerSecurityLevel(host)
  const secCorrectionFactor = minSec / curSec
  const wT = Math.ceil(ns.getWeakenTime(host))
  const mM = ns.getServerMaxMoney(host)
  const hC = ns.hackAnalyzeChance(host)
  return Math.ceil(mM * (1 / wT) * secCorrectionFactor * hC)
}

function rankOneWithFormulasForMoney(ns: NS, host: string): number {
  const p = ns.getPlayer()
  const s = ns.getServer(host)
  const pow = s.hackDifficulty / s.minDifficulty - 1
  const timeToPrime = Math.pow(ns.formulas.hacking.weakenTime(s, p), pow)
  // if (host === 'rho-construction') {
  //   ns.tprint(host)
  //   ns.tprint(pow)
  //   ns.tprint(timeToPrime)
  // }
  s.hackDifficulty = s.minDifficulty
  const hT = ns.formulas.hacking.hackTime(s, p)
  const hC = ns.formulas.hacking.hackChance(s, p)
  return Math.ceil((s.moneyMax * (1 / hT) * hC) / timeToPrime)
}
