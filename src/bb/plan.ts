import {receiveMessageOnPort} from 'worker_threads'
import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'

const wpt = 0.05 // weaken security decrease per thread
const gpt = 0.004 // grow security decrease per thread
const hpt = 0.002 // hack security decrease per thread

export const costs = {
  weaken: 1.75,
  grow: 1.75,
  hack: 1.7,
}

export const msPad = 200 // padding between finishes in ms

export function planMoney(
  ns: NS,
  host: string,
  perc: number,
  gpc: number,
  wpc = 0.1
): Plan {
  if (ns.fileExists('formulas.exe', 'home')) {
    return planMoneyWithFormulas(ns, host, perc, gpc, wpc)
  } else {
    return planMoneyWithoutFormulas(ns, host, perc, gpc)
  }
}

export function planSecDec(ns: NS, host: string, perc: number): Plan {
  const p = ns.getPlayer()
  const s = ns.getServer(host)
  const secDiff = s.hackDifficulty - s.minDifficulty
  const secDecrease = Math.round(secDiff * perc)
  const wT = secDecrease / wpt
  const wTime = ns.formulas.hacking.weakenTime(s, p)

  const fw: Entry = {
    type: 'weaken',
    threads: wT,
    startOffset: 0,
    startTimestamp: Date.now(),
    duration: wTime,
    endTimestamp: Date.now() + wTime,
  }

  const plan: Plan = {
    totalRam: fw.threads * costs[fw.type],
    entries: [fw],
    cycleTime: wTime,
    target: host,
  }
  return plan
}

export function planMoneyWithFormulas(
  ns: NS,
  host: string,
  perc: number,
  gpc: number,
  wpc: number
): Plan {
  perc = Math.min(perc, 1 - Number.EPSILON)
  gpc = Math.max(gpc, 1)
  wpc = Math.max(wpc, 0)

  const p = ns.getPlayer()
  const s = ns.getServer(host)
  // s.hackDifficulty = s.minDifficulty
  // s.moneyAvailable = s.moneyMax

  const hackedS = s
  hackedS.moneyAvailable *= 1 - perc

  const secScale = s.minDifficulty / s.hackDifficulty
  const moneyScale = s.moneyAvailable / s.moneyMax

  const ppt = ns.formulas.hacking.hackPercent(s, p)
  let htWanted: number
  let gMult: number
  if (ppt === 0) {
    // zero chance to hack, turn to priming
    htWanted = 0
    gMult = 0
  } else {
    htWanted = Math.max(Math.floor((perc / ppt) * moneyScale * secScale), 1)
    gMult = 1
  }

  const bonusSecThreads = Math.ceil(
    ((s.hackDifficulty - s.minDifficulty) * wpc) / wpt
  )

  const htSecInc = htWanted * hpt
  const threadsToOffsetHack = bonusSecThreads + Math.ceil(htSecInc / wpt) // threads to offset hack security growth

  const wantedGrowthRate = 1 / (1 - perc) + (gpc - 1) * (1 - moneyScale)

  const gPerc = ns.formulas.hacking.growPercent(hackedS, 1, p) - 1
  const gtWantedPerc = Math.ceil(wantedGrowthRate / gPerc) * gMult
  // ns.tprint(ns.sprintf('%s', gPerc))
  // const gtWantedOld = Math.ceil(ns.growthAnalyze(host, wantedGrowthRate))

  const gtSecIncrease = gtWantedPerc * gpt
  const threadsToOffsetGrow = bonusSecThreads + Math.ceil(gtSecIncrease / wpt)

  // ns.tprint(ns.sprintf('%s %s', wantedGrowthRate.toString(), gPerc.toString()))

  // ns.tprint(
  //   ns.sprintf('%s %s', gtWantedPerc.toString(), gtWantedOld.toString())
  // )

  const weakenTime = ns.formulas.hacking.weakenTime(s, p) // TODO: do proper calculation based on changes above
  const hackTime = ns.formulas.hacking.hackTime(s, p)
  const growTime = ns.formulas.hacking.growTime(s, p)

  const now = Date.now()
  const fwst = now // first weaken starts now (but ends after the hack)
  const hst = fwst + weakenTime - msPad - hackTime // hack finishes <pad> before weaken
  const gst = fwst + weakenTime + msPad - growTime // grow finishes after first weaken but before second weaken
  const swst = fwst + weakenTime + 2 * msPad - weakenTime // second weaken should finish last
  const fwo = 0
  const swo = swst - fwst
  const go = gst - fwst
  const ho = hst - fwst

  const fw: Entry = {
    type: 'weaken',
    threads: threadsToOffsetHack,
    startOffset: fwo,
    startTimestamp: now + fwo,
    duration: weakenTime,
    endTimestamp: now + fwo + weakenTime,
  }
  const sw: Entry = {
    type: 'weaken',
    threads: threadsToOffsetGrow,
    startOffset: swo,
    startTimestamp: now + swo,
    duration: weakenTime,
    endTimestamp: now + swo + weakenTime,
  }
  const g: Entry = {
    type: 'grow',
    threads: gtWantedPerc,
    startOffset: go,
    startTimestamp: now + go,
    duration: growTime,
    endTimestamp: now + go + growTime,
  }
  const h: Entry = {
    type: 'hack',
    threads: htWanted,
    startOffset: ho,
    startTimestamp: now + ho,
    duration: hackTime,
    endTimestamp: now + ho + hackTime,
  }
  const plan: Plan = {
    totalRam: 0,
    entries: [],
    cycleTime: 0,
    target: '',
  }
  plan.target = host
  if (h.threads !== 0) plan.entries.push(h)
  if (fw.threads !== 0) plan.entries.push(fw)
  if (sw.threads !== 0) plan.entries.push(sw)
  if (g.threads !== 0) plan.entries.push(g)
  plan.totalRam = plan.entries
    .map((e) => e.threads * costs[e.type])
    .reduce((a, b) => a + b, 0)
  plan.cycleTime = fwst + weakenTime + 2 * msPad - fwst
  return plan
}

// TODO extract info for servers into db - don't need to requery all of it each time
function planMoneyWithoutFormulas(
  ns: NS,
  host: string,
  perc: number,
  gpc: number
): Plan {
  perc = Math.min(perc, 1 - Number.EPSILON)
  gpc = Math.max(gpc, 1)

  const maxMoney = ns.getServerMaxMoney(host)
  const curMoney = ns.getServerMoneyAvailable(host)
  const growScale = curMoney / maxMoney // scale hacks proportionally to max money so we can grow faster
  const revGrowScale = 1 - growScale // scale additional growth reversely as we reach maxMoney
  // ns.tprint(
  //   ns.sprintf(
  //     'gs: %s revGs: %s',
  //     growScale.toString(),
  //     revGrowScale.toString()
  //   )
  // )

  const minSec = ns.getServerMinSecurityLevel(host)
  const curSec = ns.getServerSecurityLevel(host)
  const secScale = curSec / minSec
  const revSecScale = 1 / secScale

  const hackPercentagePerThread = ns.hackAnalyze(host) // returns DECIMALS
  const threadsToReachDesiredPerc = Math.floor(
    (perc / hackPercentagePerThread) * growScale * revSecScale
  )

  // threads needed to reach target perc

  const secIncreasePerHack = threadsToReachDesiredPerc * hpt // security increase to reach perc
  const threadsToOffsetHack = Math.ceil((secIncreasePerHack / wpt) * secScale) // threads to offset hack security growth

  const wantedGrowthRate = 1 / (1 - perc) + (gpc - 1) * revGrowScale

  // ns.tprint(
  //   ns.sprintf('gpc: %s wgr: %s', gpc.toString(), wantedGrowthRate.toString())
  // )

  const threadsToGrowMoneyBack = Math.ceil(
    ns.growthAnalyze(host, wantedGrowthRate)
  ) // threads required to offset hack
  const secIncreasePerGrow = threadsToGrowMoneyBack * gpt // security increase per growth

  const threadsToOffsetGrowth = Math.ceil((secIncreasePerGrow / wpt) * secScale) // threads to offset growth

  const weakenTime = Math.ceil(ns.getWeakenTime(host))
  const hackTime = Math.ceil(ns.getHackTime(host))
  const growTime = Math.ceil(ns.getGrowTime(host))

  const now = Date.now()
  const fwst = now // first weaken starts now (but ends after the hack)
  const hst = fwst + weakenTime - msPad - hackTime // hack finishes <pad> before weaken
  const gst = fwst + weakenTime + msPad - growTime // grow finishes after first weaken but before second weaken
  const swst = fwst + weakenTime + 2 * msPad - weakenTime // second weaken should finish last
  const fwo = 0
  const swo = swst - fwst
  const go = gst - fwst
  const ho = hst - fwst

  const fw: Entry = {
    type: 'weaken',
    threads: threadsToOffsetHack,
    startOffset: fwo,
    startTimestamp: now + fwo,
    duration: weakenTime,
    endTimestamp: now + fwo + weakenTime,
  }
  const sw: Entry = {
    type: 'weaken',
    threads: threadsToOffsetGrowth,
    startOffset: swo,
    startTimestamp: now + swo,
    duration: weakenTime,
    endTimestamp: now + swo + weakenTime,
  }
  const g: Entry = {
    type: 'grow',
    threads: threadsToGrowMoneyBack,
    startOffset: go,
    startTimestamp: now + go,
    duration: growTime,
    endTimestamp: now + go + growTime,
  }
  const h: Entry = {
    type: 'hack',
    threads: threadsToReachDesiredPerc,
    startOffset: ho,
    startTimestamp: now + ho,
    duration: hackTime,
    endTimestamp: now + ho + hackTime,
  }
  const p: Plan = {
    totalRam: 0,
    entries: [],
    cycleTime: 0,
    target: '',
  }
  p.target = host
  if (h.threads !== 0) p.entries.push(h)
  if (fw.threads !== 0) p.entries.push(fw)
  if (sw.threads !== 0) p.entries.push(sw)
  if (g.threads !== 0) p.entries.push(g)
  p.totalRam = p.entries
    .map((e) => e.threads * costs[e.type])
    .reduce((a, b) => a + b, 0)
  p.cycleTime = fwst + weakenTime + 2 * msPad - fwst
  return p
}

export function planXp(ns: NS, host: string, ram: number): void {
  // TODO: solve system of linear ineqaulities
  // 1.75 * (W_t + G_t) <= RAM
  // 0.05 * W_t - 0.004 * G_t >= 0
  const solved = false
  let wT = Math.floor(ram / 2 / costs.weaken)
  let gT = Math.floor(ram / 2 / costs.grow)
  let minDiff = 0
  const sameCount = 0
  while (!solved) {
    const diff = wT * wpt - gT * gpt
    if (diff > 0 && diff < minDiff) minDiff = diff

    if (diff < 0) {
      wT++
      gT--
      continue
    } else {
      wT--
      gT++
    }
  }
  ns.tprint(ns.sprintf('w %s g %s', wT.toString(), gT.toString()))
}

// https://www.desmos.com/calculator/ixh9vqpfic
export function ramPercForXpGrind(ns: NS, a: number, b: number): number {
  const hl = ns.getHackingLevel()
  return Math.max(f1(hl, a) * f2(hl, b), 0)
}

function f1(hl: number, a: number): number {
  return 1 - 3000 / Math.pow(hl, a)
}

function f2(hl: number, b: number): number {
  return Math.log2(hl) / b
}

export type Entry = {
  type: 'hack' | 'weaken' | 'grow'
  threads: number
  startOffset: number
  startTimestamp: number
  duration: number
  endTimestamp: number
}

export type Plan = {
  totalRam: number
  entries: Entry[]
  cycleTime: number
  target: string
}
