import { NS } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions"

async function listFiles(server: string): Promise<Record<string, string>> {
    const response = await fetch(server)
    return await response.json()
}

async function requestFile(server: string, filename: string): Promise<string> {
    const response = await fetch(server + '/' + filename)
    return await response.text()
}

async function digestMessage(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
    const server = 'http://localhost:3000'

    let runForever = false
    if(ns.args.length != 0 && ns.args[0] == true) {
        runForever = true
    }

    ns.disableLog('sleep')
    do {
        await ns.sleep(1000)
        const files = await listFiles(server).catch(() => {return {}}) as Record<string, string>
        for(const file in files) {
            if (ns.fileExists(file, 'home')) {
                const existingContents = ns.read(file)
                const existingHash = await digestMessage(existingContents)
                const sourceHash = files[file]
                if (existingHash != sourceHash) {
                    const sourceContents = await requestFile(server, file).catch(() => "")
                    if(sourceContents.length != 0) await ns.write(file, [sourceContents], 'w')
                }
            } else {
                const sourceContents = await requestFile(server, file)
                await ns.write(file, [sourceContents], 'w')
            }
        }
    } while(runForever)
}
