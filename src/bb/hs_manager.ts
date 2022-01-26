import {
  Hacknet,
  HacknetServersFormulas,
  NodeStats,
  NS,
} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'

type serverUpgradeType = keyof Pick<
  NodeStats,
  'level' | 'ram' | 'cores' | 'cache'
>
type upgradeType = serverUpgradeType | 'node'
type serverUpgradeCostFunction = keyof Pick<
  HacknetServersFormulas,
  'levelUpgradeCost' | 'ramUpgradeCost' | 'coreUpgradeCost' | 'cacheUpgradeCost'
>
type upgradeFunction = keyof Pick<
  Hacknet,
  | 'purchaseNode'
  | 'upgradeLevel'
  | 'upgradeRam'
  | 'upgradeCore'
  | 'upgradeCache'
>

const hashUpgradeTypes: serverUpgradeType[] = ['level', 'ram', 'cores']
const typeCostMapping: Record<serverUpgradeType, serverUpgradeCostFunction> = {
  level: 'levelUpgradeCost',
  ram: 'ramUpgradeCost',
  cores: 'coreUpgradeCost',
  cache: 'cacheUpgradeCost',
}
const upgradeTypeFunctionMapping: Record<upgradeType, upgradeFunction> = {
  level: 'upgradeLevel',
  ram: 'upgradeRam',
  cores: 'upgradeCore',
  node: 'purchaseNode',
  cache: 'upgradeCache',
}

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  ns.disableLog('ALL')
  for (;;) {
    // spend some hashes
    if (ns.hacknet.numHashes() / ns.hacknet.hashCapacity() > 0.75) {
      const hToSpend = ns.hacknet.numHashes() * 0.25
      const bTimes = Math.floor(
        hToSpend / ns.hacknet.hashCost('Sell for Money')
      )
      for (let i = 0; i < bTimes; i++) ns.hacknet.spendHashes('Sell for Money')
    }

    const numNodes = ns.hacknet.numNodes()
    const hashRemCap = ns.hacknet.hashCapacity() - ns.hacknet.numHashes()
    let totalHashRate = 0
    for (let i = 0; i < numNodes; i++)
      totalHashRate += ns.hacknet.getNodeStats(i).production

    // if we fill up our remaining capacity in 15 minutes
    if (hashRemCap / totalHashRate < 15 * 60) {
      const capUpgrades = rankHashCapUpgrades(ns)
      let bought = false
      while (!bought && capUpgrades.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const upgrade = capUpgrades.shift()!
        bought = executeUpgrade(ns, upgrade)
      }
    }

    const budget = ns.getServerMoneyAvailable('home') * 0.1
    const upgrades = rankServerHashUpgrades(ns)

    // ns.tprint(upgrades)
    let bought = false
    while (!bought && upgrades.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const upgrade = upgrades.shift()!
      if (budget >= upgrade.cost) {
        bought = executeUpgrade(ns, upgrade)
      }
    }
    await ns.sleep(10 * 1000)
  }
}

type Upgrade = {
  index: number
  type: upgradeType
  cost: number
  vpd: number // value per dollar increse, higher is better
}

function rankHashCapUpgrades(ns: NS): Upgrade[] {
  const numNodes = ns.hacknet.numNodes()
  const upgrades: Upgrade[] = []
  if (ns.hacknet.maxNumNodes() - numNodes > 0) {
    const sCost = ns.formulas.hacknetServers.hacknetServerCost(
      numNodes + 1,
      ns.getHacknetMultipliers().purchaseCost
    )
    upgrades.push({
      index: numNodes,
      type: 'node',
      cost: sCost,
      vpd: 64 / sCost, // 64 is the base hash cap of new server
    })
  }
  for (let i = 0; i < numNodes; i++) {
    const t = 'cache'
    const stats = ns.hacknet.getNodeStats(i)
    const vIncrease = stats.cache
    const uCost = ns.formulas.hacknetServers[typeCostMapping[t]](stats[t], 1)
    const incCost = vIncrease / uCost
    upgrades.push({
      index: i,
      type: t,
      cost: uCost,
      vpd: incCost,
    })
  }
  upgrades.sort((a, b) => b.vpd - a.vpd)
  return upgrades
}

function rankServerHashUpgrades(ns: NS): Upgrade[] {
  const numNodes = ns.hacknet.numNodes()
  const upgrades: Upgrade[] = []
  if (ns.hacknet.maxNumNodes() - numNodes > 0) {
    const sCost = ns.formulas.hacknetServers.hacknetServerCost(
      numNodes + 1,
      ns.getHacknetMultipliers().purchaseCost
    )
    upgrades.push({
      index: numNodes,
      type: 'node',
      cost: sCost,
      vpd:
        ns.formulas.hacknetServers.hashGainRate(
          1,
          0,
          1,
          1,
          ns.getHacknetMultipliers().production
        ) / sCost,
    })
  }
  for (let i = 0; i < numNodes; i++) {
    const stats = ns.hacknet.getNodeStats(i)
    for (const t of hashUpgradeTypes) {
      const vIncrease = upgradeDiff(ns, stats, t)
      const uCost = ns.formulas.hacknetServers[typeCostMapping[t]](stats[t], 1)
      const incCost = vIncrease / uCost
      upgrades.push({
        index: i,
        type: t,
        cost: uCost,
        vpd: incCost,
      })
    }
  }
  upgrades.sort((a, b) => b.vpd - a.vpd)
  return upgrades
}

function executeUpgrade(ns: NS, upgrade: Upgrade): boolean {
  const f = upgradeTypeFunctionMapping[upgrade.type]
  switch (f) {
    case 'purchaseNode':
      if (ns.hacknet[f]() === -1) return false
      else return true
    default:
      return ns.hacknet[f](upgrade.index, 1)
  }
}

function upgradeDiff(
  ns: NS,
  stats: Readonly<NodeStats>,
  upgradeType: serverUpgradeType
): number {
  const currentRate = stats.production
  const sCopy: NodeStats = JSON.parse(JSON.stringify(stats))
  sCopy[upgradeType] += 1
  const newRate = ns.formulas.hacknetServers.hashGainRate(
    sCopy.level,
    sCopy.ramUsed,
    sCopy.ram,
    sCopy.cores,
    ns.getHacknetMultipliers().production
  )
  return newRate - currentRate
}
