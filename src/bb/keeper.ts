import { NS } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions";

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
    if(ns.args.length < 2) return

    const secs = ns.args.shift() as number
    const filenames = ns.args as string[]

    if (secs <= 0) return
    if (filenames.length == 0) return

    for(;;) {
        for(const filename of filenames) ns.run(filename)
        await ns.sleep(secs)
    }
}
