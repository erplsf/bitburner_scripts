import { NS } from "../../bitburner/src/ScriptEditor/NetscriptDefinitions";

async function listFiles(server: string): Promise<Record<string, string>> {
    const response = await fetch(server);
    return await response.json()
}

async function requestFile(server: string, filename: string): Promise<string> {
    const response = await fetch(server + '/' + filename);
    return await response.text();
}

async function digestMessage(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
    const server = 'http://localhost:3000';
    // ns.disableLog('ALL');
    for(;;) {
        const files = await listFiles(server); // TODO: crashes if server unavailable
        for(const file in files) {
            if (ns.fileExists(file, 'home')) {
                const existingContents = ns.read(file);
                const existingHash = await digestMessage(existingContents);
                const sourceHash = files[file];
                if (existingHash != sourceHash) {
                    const sourceContents = await requestFile(server, file);
                    await ns.write(file, [sourceContents], 'w');
                }
            } else {
                const sourceContents = await requestFile(server, file);
                await ns.write(file, [sourceContents], 'w');
            }
        }
        await ns.sleep(1000);
    }
}
