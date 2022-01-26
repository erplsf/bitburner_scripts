import {NS} from '../../bitburner/src/ScriptEditor/NetscriptDefinitions'

async function listFiles(server: string): Promise<Record<string, string>> {
  const response = await fetch(server)
  return await response.json()
}

async function downloadFile(
  ns: NS,
  server: string,
  filename: string
): Promise<void> {
  let targetPath = filename
  if (targetPath.split('/').length > 1) targetPath = '/' + targetPath
  await ns.wget(server + '/' + filename, targetPath)
}

async function digestMessage(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

const server = 'http://localhost:3000'

const persistentProgs = ['manager.js', 'pserv_manager.js', 'hs_manager.js']

export async function main(ns: NS): Promise<void> {
  ns.disableLog('sleep')
  const ownName = ns.getScriptName()
  const host = ns.getHostname()
  for (;;) {
    const files = (await listFiles(server).catch(() => {
      return {}
    })) as Record<string, string>
    for (const file in files) {
      if (ns.fileExists(file, host)) {
        const existingContents = ns.read(file)
        const existingHash = await digestMessage(existingContents)
        const sourceHash = files[file]
        if (existingHash !== sourceHash) {
          await downloadFile(ns, server, file)
          for (const filename of persistentProgs) {
            if (file === filename) {
              const killed = ns.kill(file, host)
              if (killed) ns.run(file)
            }
          }
          // TODO: refactor this out to a config
          if (file === ownName) {
            ns.exec(ownName, host, 1, Date.now().toString())
            ns.exit()
          }
        }
      } else {
        await downloadFile(ns, server, file)
      }
    }
    await ns.sleep(1000)
  }
}
