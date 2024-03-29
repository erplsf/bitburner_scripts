import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'
import {getUniqueServers} from './pathfinder.js'

export function buildServerMap(
  ns: NS,
  source: string,
  map: Map<string, string[]>
): void {
  const hosts = ns.scan(source)
  // const servers = hosts.map(host => ns.scan(host))
  map.set(source, hosts)
  for (const host of hosts) {
    if (!map.get(host)) {
      buildServerMap(ns, host, map)
    }
  }
}

export function unique(array: string[]): string[] {
  return array.reduce((acc: string[], serv: string) => {
    const exists = acc.find((ex: string) => ex === serv)
    if (!exists) acc.push(serv)
    return acc
  }, [])
}

type ServerFilter = (hostname: string) => boolean

export async function filterServers(
  ns: NS,
  filterFunction: ServerFilter
): Promise<string[]> {
  const servers = await getUniqueServers(ns)
  return servers.filter(filterFunction)
}

export async function rootedServers(ns: NS): Promise<string[]> {
  return await filterServers(
    ns,
    (serv) => ns.serverExists(serv) && ns.hasRootAccess(serv)
  )
}

export async function rootedHackableServers(ns: NS): Promise<string[]> {
  return await filterServers(
    ns,
    (serv) =>
      ns.serverExists(serv) &&
      ns.hasRootAccess(serv) &&
      ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(serv) &&
      ns.getServerMaxMoney(serv) !== 0 &&
      serv !== 'home'
  )
}

export function runCmd(cmd: string): boolean {
  const input = cheat.doc.getElementById(
    'terminal-input'
  ) as HTMLInputElement | null
  if (!input) return false
  input.value = cmd
  const handler = Object.keys(input)[1] as keyof HTMLInputElement
  ;(input[handler] as unknown as DummyHandler).onChange({
    target: input,
  })
  ;(input[handler] as unknown as DummyHandler).onKeyDown({
    keyCode: 13,
    preventDefault: () => null,
  })
  return true
}

interface DummyHandler {
  onChange(e: unknown): unknown
  onKeyDown(e: unknown): unknown
}

export class cheat {
  static get doc(): Document {
    return globalThis['document'] as Document
  }

  static get win(): typeof window {
    return globalThis as typeof window
  }
}

export function calculateGainedFavor(rep: number): number {
  return 1 + Math.log((rep + 25000) / 25000) / Math.log(1.02)
}

type HGWArgs = [string, number, number | null]

// export function parseHGWArgs(ns: NS): HGWArgs {
//   const host = ns.args[0]
//   if(typeof host === 'string')
// }
