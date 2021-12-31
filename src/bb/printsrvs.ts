import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'
import {getUniqueServers} from './utils.js'

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  ns.tprint(getUniqueServers(ns))
}
