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

export async function main(ns: NS): Promise<void> {
  ns.disableLog('sleep')
  for (;;) {
    const files = (await listFiles(server).catch(() => {
      return {}
    })) as Record<string, string>
    for (const file in files) {
      if (ns.fileExists(file, 'home')) {
        const existingContents = ns.read(file)
        const existingHash = await digestMessage(existingContents)
        const sourceHash = files[file]
        if (existingHash !== sourceHash) {
          await downloadFile(ns, server, file)
          // TODO: refactor this out to a config
          if (file === 'manager.js') {
            ns.kill('manager.js', 'home')
            ns.run('manager.js', 1)
          } else if (file === 'sync.js') {
            ns.exec('sync.js', 'home', 1, Date.now().toString())
            ns.exit()
          } else if (file === 'scheduler.js') {
            const killed = ns.kill('scheduler.js', 'home')
            if (killed) ns.exec('scheduler.js', 'home')
          }
        }
      } else {
        await downloadFile(ns, server, file)
      }
    }
    await ns.sleep(1000)
  }
}
