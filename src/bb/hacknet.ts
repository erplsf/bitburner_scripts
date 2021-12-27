import { NS } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions";

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
    const nodeCount = ns.hacknet.numNodes()
    for(let i = 0; i < nodeCount; i++) {
        let pMoney = ns.getPlayer().money

        let lCost = ns.hacknet.getLevelUpgradeCost(i, 1)
        while (lCost != Infinity && lCost / pMoney <= 0.05) {
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
}
