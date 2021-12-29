import { NS } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions";

const wpt = 0.05 // weaken security decrease per thread
const gpt = 0.004 // grow security decrease per thread
const hpt = 0.002 // hack security decrease per thread
const pad = 200 // padding between finishes in ms

export const costs = {
    'weaken': 1.75,
    'grow': 1.75,
    'hack': 1.70
}

const wrc = 1.75  // weaken cost per thread
const grc = 1.75  // grow cost per thread
const hrc = 1.70  // hack cost per thread

const gpc = 2 // growth rate of original money

// TODO: broken with timing and splitting - can't handle over 0.1 perc
export function plan(ns: NS, host: string, perc: number): Plan {
    const maxMoney = ns.getServerMaxMoney(host)
    const curMoney = ns.getServerMoneyAvailable(host)
    const growScale = 1-(curMoney/maxMoney) // scale growth as we reach maxMoney

    const hackPercentagePerThread = ns.hackAnalyze(host)   // returns DECIMALS
    const threadsToReachDesiredPerc = Math.floor(perc / hackPercentagePerThread) // threads needed to reach target perc

    const secIncreasePerHack = threadsToReachDesiredPerc * hpt // security increase to reach perc
    const threadsToOffsetHack = 1 + Math.ceil(secIncreasePerHack / wpt) // threads to offset hack security growth

    const wantedGrowthRate = Math.max(1/(1-perc)+((gpc-1)*growScale),1)

    const threadsToGrowMoneyBack = 1 + Math.ceil(
        ns.growthAnalyze(host,wantedGrowthRate)
    ) // threads required to offset hack
    const secIncreasePerGrow = threadsToGrowMoneyBack * gpt // security increase per growth

    const threadsToOffsetGrowth = 1 + Math.ceil(secIncreasePerGrow / wpt) // threads to offset growth

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
    const hst = (fwst + weakenTime) - pad - hackTime // hack finishes <pad> before weaken
    const gst = (fwst + weakenTime) + pad - growTime // grow finishes after first weaken but before second weaken
    const swst = (fwst + weakenTime) + (2 * pad) - weakenTime // second weaken should finish last
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
    p.cycleTime = (fwst + weakenTime) + (2 * pad) - fwst
    return p
}

export type Entry = {type: 'hack'|'weaken'|'grow', threads: number, offset: number}
export type Plan = {totalRam: number, entries: Entry[], cycleTime: number, target: string}
