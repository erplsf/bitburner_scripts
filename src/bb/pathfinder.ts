import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  const map: Record<string, string[]> = {}
  const servers = ns.scan('home')
  const stack: string[] = []
  for (const host of servers) {
    if (!map[host]) {
      map[host] = stack
    }
  }
  ns.tprint(map)
}

function scan(
  ns: NS,
  host: string,
  map: Record<string, string[]>,
  stack: string[]
): void {}
