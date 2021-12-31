import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  if (ns.args.length < 2) return

  const ms = ns.args.shift() as number
  const filenames = ns.args as string[]

  if (ms <= 0) return
  if (filenames.length == 0) return

  for (;;) {
    for (const filename of filenames) {
      const pid = ns.run(filename)
      if (pid == 0) {
        // ns.tprint(ns.sprintf("something happened when running %s", filename))
        continue
      }
      while (ns.ps('home').filter((info) => info.pid == pid).length != 0)
        await ns.sleep(100)
    }
    await ns.sleep(ms)
  }
}
