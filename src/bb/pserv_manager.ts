import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'

const moneyPerc = 0.1
export const nsFilename = '.s.no-schedule.txt'

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  const pServers: [string, number][] = ns
    .getPurchasedServers()
    .map((host) => [host, ns.getServerMaxRam(host)])
  const pRams = new Set(pServers.map((pserv) => pserv[1]))

  const maxRam = ns.getPurchasedServerMaxRam()
  const maxCount = ns.getPurchasedServerLimit()

  if (
    pRams.size == 1 &&
    Array.from(pRams)[0] == maxRam &&
    pServers.length == maxCount
  ) {
    // ns.tprint('already bought max, max sized servers, exiting')
    return
  }

  const pCosts = serverCosts(ns)

  const availableMoney = Math.floor(
    ns.getServerMoneyAvailable('home') * moneyPerc
  )

  let i = 20 - 1 // 20 is max power of ram
  while (pCosts[i] > availableMoney) i--
  if (i <= 0) return

  const affordablePrice = pCosts[i]
  const affordableRam = Math.pow(2, i + 1) // because i is index we need to add back one
  const affordableServers = Math.min(
    Math.floor(availableMoney / affordablePrice),
    maxCount
  )
  if (affordableServers == 0) return

  const smallerPServs = pServers.filter((pServ) => pServ[1] < affordableRam)
  const serversToDelete = affordableServers - (maxCount - smallerPServs.length)

  await ns.write(nsFilename, [''], 'w')
  for (let i = 0; i < serversToDelete; i++) {
    const pServ = smallerPServs[i][0]
    await ns.scp(nsFilename, 'home', pServ)
    ns.killall(pServ)
    ns.deleteServer(pServ)
  }
  ns.rm(nsFilename, 'home')

  const serversToBuy = Math.min(
    affordableServers,
    maxCount - ns.getPurchasedServers().length
  )
  if (serversToBuy == 0) return

  ns.toast(
    ns.sprintf(
      'will buy %s servers with %s ram and %s cost',
      serversToBuy.toString(),
      ns.nFormat((affordableRam * 1024) ** 2, '0ib'),
      ns.nFormat(affordablePrice, '0a')
    ),
    'info',
    10000
  )

  for (let i = 0; i < serversToBuy; i++) {
    ns.purchaseServer('pserv', affordableRam)
  }
}

function serverCosts(ns: NS): number[] {
  const costs = []
  for (let i = 1; i <= 20; i++) {
    costs.push(ns.getPurchasedServerCost(Math.pow(2, i)))
  }
  return costs
}
