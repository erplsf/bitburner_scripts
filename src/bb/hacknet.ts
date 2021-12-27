import { NS } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions";

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
    // TODO: fix/swap to correct calculating and stuff
    const nodeCount = ns.hacknet.numNodes()
    let uCost = 0
    const upgrades: [number, string, number][] = []
    for(let i = 0; i < nodeCount; i++) {
        let pMoney = ns.getPlayer().money

        let lCost = ns.hacknet.getLevelUpgradeCost(i, 1)
        uCost += lCost
        if(lCost != Infinity && uCost / pMoney <= 0.1) {
            const found = upgrades.findIndex(u => u[0] == i)
            if(found != -1) {
                upgrades[found][2] += 1
            } else {
                upgrades.push([i, 'c', 1])
            }
        }

        while (lCost != Infinity && uCost / pMoney <= 0.1) {
            ns.hacknet.upgradeLevel(i, 1)
            lCost = ns.hacknet.getLevelUpgradeCost(i, 1)
            pMoney = ns.getPlayer().money
        }

        let rCost = ns.hacknet.getRamUpgradeCost(i, 1)
        while (rCost != Infinity && rCost / pMoney <= 0.05) {
            ns.hacknet.upgradeRam(i, 1)
            rCost = ns.hacknet.getRamUpgradeCost(i, 1)
            pMoney = ns.getPlayer().money
        }

        let cCost = ns.hacknet.getCoreUpgradeCost(i, 1)
        while (cCost != Infinity && cCost / pMoney <= 0.05) {
            ns.hacknet.upgradeCore(i, 1)
            cCost = ns.hacknet.getCoreUpgradeCost(i, 1)
            pMoney = ns.getPlayer().money
        }
    }
    for(const up of upgrades) {
        const [i, t, l] = up
    }
}
