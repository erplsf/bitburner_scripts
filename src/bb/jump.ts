import { NS } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions";
import { runCmd } from "./utils.js";

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
    if (ns.args.length < 1) return

    const target = ns.args[0] as string

    const stck = find(ns, 'home', target, [], [])
    const cmd = stck.map(serv => `connect ${serv};`).join('')
    runCmd('home;' + cmd)
}

function find(ns: NS, curr: string, targ: string, scnd: string[], stck: string[]): string[] {
    if (curr == targ) {
        stck.push(targ)
        return stck
    }

    if (scnd.find((serv:string) => serv == curr)) return []

    scnd.push(curr)
    const servs = ns.scan(curr)

    for (const serv of servs) {
        stck.push(serv)
        if (serv == targ) return stck

        const st = find(ns, serv, targ, scnd, stck)
        if (st.length != 0) return st

        stck.pop()
    }
    return []
}

