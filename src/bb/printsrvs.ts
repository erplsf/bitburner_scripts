import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'
import {getUniqueServers} from './pathfinder.js'

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  ns.tprint(await getUniqueServers(ns))
}
