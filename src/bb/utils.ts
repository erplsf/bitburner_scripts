export function allServers(ns: NS): Array<string> {
    let servers: Set<string> | Array<string>;
    let contents = ns.read('servers.db');

    if (contents.length > 0) {
        return JSON.parse(contents);
    } else {
        servers = new Set(ns.scan('home'));
    }

    for (let hop of servers) {
        for (let nextHop of ns.scan(hop))
            servers.add(nextHop);
    }

    servers = Array.from(servers);

    ns.write('servers.db', JSON.stringify(servers, undefined, 2), 'w');

    return servers;
}

export function rootedServers(ns: NS): Array<string> {
    return allServers(ns).filter(s => ns.hasRootAccess(s));
}
