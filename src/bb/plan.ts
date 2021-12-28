import { NS } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions";

const wpt = 0.05 // weaken security decrease per thread
const gpt = 0.004 // weaken security decrease per thread
const hpt = 0.002 // weaken security decrease per thread
const pad = 100 // padding between finishes in ms

export function plan(ns: NS, host: string, perc: number): Plan {
    const hackPercentagePerThread = ns.hackAnalyze(host) // returns percentage, convert to decimal
    const threadsToReachDesiredPerc = Math.ceil(perc / hackPercentagePerThread) // threads needed to reach target perc
    const secIncreasePerHack = threadsToReachDesiredPerc * hpt // security increase to reach perc
    const threadsToOffsetHack = 1 + Math.ceil(secIncreasePerHack / wpt) // threads to offset hack security growth
    const threadsToGrowMoneyBack = 1 + Math.ceil(ns.growthAnalyze(host, 1 + perc)) // threads required to offset hack
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
    return [fw, sw, g, h]
}

type Entry = {type: 'hack'|'weaken'|'grow', threads: number, offset: number}
type Plan = Entry[]