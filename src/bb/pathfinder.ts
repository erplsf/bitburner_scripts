import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'

const filename = 'servers.db'

// /** @param {NS} ns **/
// export async function main(ns: NS): Promise<void> {
//   if (!ns.fileExists(filename, 'home')) {
//     const map = scan(ns)
//     await ns.write(filename, [JSON.stringify(map)], 'w')
//   }
// }

export async function getPath(ns: NS, host: string): Promise<string[]> {
  const map = await buildOrGetMap(ns)
  return map[host]
}

export async function getUniqueServers(ns: NS): Promise<string[]> {
  return Object.keys(await buildOrGetMap(ns))
}

async function buildOrGetMap(ns: NS): Promise<PathMap> {
  let map: PathMap
  if (!ns.fileExists(filename, 'home')) {
    map = scan(ns)
    await ns.write(filename, [JSON.stringify(map)], 'w')
  } else {
    map = JSON.parse(ns.read(filename))
  }
  enrichMapWithPurchasedServers(ns, map)
  return map
}

function enrichMapWithPurchasedServers(ns: NS, map: PathMap) {
  ns.getPurchasedServers().forEach((pServ) => {
    map[pServ] = []
  })
}

function scan(ns: NS): PathMap {
  const map = {home: []}
  scanInternal(ns, 'home', map)
  return map
}

function scanInternal(
  ns: NS,
  host: string,
  map: PathMap,
  stack: ReadonlyArray<string> = []
): void {
  const servers = ns.scan(host)
  for (const target of servers) {
    if (!map[target]) {
      const path = stack.concat([target])
      map[target] = ['home', ...path]
      scanInternal(ns, target, map, path)
    }
  }
}

export function buildConnectionString(servers: string[]): string {
  return ['home', ...servers.slice(1).map((host) => `connect ${host}`)].join(
    ';'
  )
}

type PathMap = Record<string, string[]>
