import { NS, Server } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions";

export function buildServerMap(ns: NS, source: string, map: Map<string, Server[]>): void {
    const hosts = ns.scan(source)
    const servers = hosts.map(host => ns.getServer(host))
    map.set(source, servers)
    for(const host of hosts) {
        if(!map.get(host)) {
            buildServerMap(ns, host, map)
        }
    }
}

export function getUniqueServers(ns: NS): Server[] {
    const map = new Map()
    buildServerMap(ns, 'home', map)
    const servers = Array.from(map.values()).flat()
    return servers.reduce((acc:Server[], serv:Server) => {
        const exists = acc.find((ex: Server) => ex.hostname == serv.hostname)
        if(!exists) acc.push(serv)
        return acc
    },[])
}

type ServerFilter = (server: Server) => boolean

export function filterServers(ns: NS, filterFunction: ServerFilter): Server[] {
    const servers = getUniqueServers(ns)
    return servers.filter(filterFunction)
}

/** returns percentage of difference between min and current, fractional, lower is better */
export function serverSecurityP(server: Server): number {
    return 1 - server.minDifficulty / server.hackDifficulty
}

/** returns percentage of money available to max money, fractional, higher is better */
export function serverMoneyP(server: Server): number {
    return server.moneyAvailable / server.moneyMax
}
