import { NS } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions";

const wpt = 0.05 // weaken security decrease per thread
const gpt = 0.004 // grow security decrease per thread
const hpt = 0.002 // hack security decrease per thread

export const costs = {
    'weaken': 1.75,
    'grow': 1.75,
    'hack': 1.70
}

export const msPad = 200 // padding between finishes in ms

// TODO extract info for servers into db - don't need to requery all of it each time
export function plan(ns: NS, host: string, perc: number, gpc: number): Plan {
    perc = Math.min(perc, 1)
    gpc = Math.max(gpc, 1)

    const maxMoney = ns.getServerMaxMoney(host)
    const curMoney = ns.getServerMoneyAvailable(host)
    const growScale = curMoney/maxMoney // scale hacks proportionally to max money so we can grow faster
    const revGrowScale = 1 - growScale // scale additional growth reversely as we reach maxMoney

    const minSec = ns.getServerMinSecurityLevel(host)
    const curSec = ns.getServerSecurityLevel(host)
    const secScale = (curSec / minSec)

    const hackPercentagePerThread = ns.hackAnalyze(host)   // returns DECIMALS
    const threadsToReachDesiredPerc = Math.max(1,Math.floor((perc / hackPercentagePerThread)*growScale)) // threads needed to reach target perc

    const secIncreasePerHack = threadsToReachDesiredPerc * hpt // security increase to reach perc
    const threadsToOffsetHack = 1 + Math.ceil((secIncreasePerHack / wpt)*secScale) // threads to offset hack security growth

    const wantedGrowthRate = Math.max(1/(1-perc)+(Math.min((gpc-1)*revGrowScale),
                                                  0),
                                      1)

    const threadsToGrowMoneyBack = 1 + Math.ceil(
        ns.growthAnalyze(host,wantedGrowthRate)
    ) // threads required to offset hack
    const secIncreasePerGrow = threadsToGrowMoneyBack * gpt // security increase per growth

    const threadsToOffsetGrowth = 1 + Math.ceil((secIncreasePerGrow / wpt)*secScale) // threads to offset growth

    const weakenTime = Math.ceil(ns.getWeakenTime(host))
    const hackTime = Math.ceil(ns.getHackTime(host))
    const growTime = Math.ceil(ns.getGrowTime(host))

    const now = Date.now()
    // ns.tprint(ppt)
    // ns.tprint(threadsToReachDesiredPerc)
    // ns.tprint(sih)
    // ns.tprint(threadsToOffsetHack)
    // ns.tprint(threadsToGrowMoneyBack)
    // ns.tprint(tog)
    // ns.tprint(ht)
    // ns.tprint(wt)
    // ns.tprint(gt)
    const fwst = now // first weaken starts now (but ends after the hack)
    const hst = (fwst + weakenTime) - msPad - hackTime // hack finishes <pad> before weaken
    const gst = (fwst + weakenTime) + msPad - growTime // grow finishes after first weaken but before second weaken
    const swst = (fwst + weakenTime) + (2 * msPad) - weakenTime // second weaken should finish last
    // ns.tprint(fwst)
    // ns.tprint(swst)
    // ns.tprint(gst)
    // ns.tprint(hst)
    const fwo = 0
    const swo = swst - fwst
    const go = gst - fwst
    const ho = hst - fwst
    // ns.tprint(fwo)
    // ns.tprint(swo)
    // ns.tprint(go)
    // ns.tprint(ho)
    const fw: Entry = {type: 'weaken', threads: threadsToOffsetHack, offset: fwo}
    const sw: Entry = {type: 'weaken', threads: threadsToOffsetGrowth, offset: swo}
    const g: Entry = {type: 'grow', threads: threadsToGrowMoneyBack, offset: go}
    const h: Entry = {type: 'hack', threads: threadsToReachDesiredPerc, offset: ho}
    const p: Plan = {
        totalRam: 0,
        entries: [],
        cycleTime: 0,
        target: ""
    }
    p.target = host
    p.entries = [fw, sw, g, h]
    p.totalRam = p.entries.map(e => e.threads * costs[e.type]).reduce((a, b) => a + b, 0)
    p.cycleTime = (fwst + weakenTime) + (2 * msPad) - fwst
    return p
}

export type Entry = {type: 'hack'|'weaken'|'grow', threads: number, offset: number}
export type Plan = {totalRam: number, entries: Entry[], cycleTime: number, target: string}
