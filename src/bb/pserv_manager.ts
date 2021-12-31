import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'

const moneyPerc = 0.1
export const nsFilename = '.s.no-schedule.txt'

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  const pServers = ns.getPurchasedServers()
  const pRams = new Set(pServers.map((host) => ns.getServerMaxRam(host)))

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

  for (const pServ of pServers) {
    await ns.write(nsFilename, [''], 'w')
    let deletedCount = 0
    if (
      ns.getServerMaxRam(pServ) < affordableRam &&
      deletedCount < affordableServers
    ) {
      await ns.scp(nsFilename, 'home', pServ)
      ns.killall(pServ)
      ns.deleteServer(pServ)
      deletedCount++
    }
    ns.rm(nsFilename, 'home')
  }

  const serversToBuy = Math.min(
    maxCount - ns.getPurchasedServers().length,
    affordableServers
  )

  if (serversToBuy == 0) return

  ns.toast(
    ns.sprintf(
      'will buy %s servers with %s ram and %s cost',
      serversToBuy.toString(),
      ns.nFormat(affordableRam * 1024 ** 2, '00ib'),
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
