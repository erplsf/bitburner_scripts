import Koa from 'koa'
import * as fs from 'fs/promises'
import * as crypto from 'crypto'

const BASE_PATH = './dist/bb'

async function ls(): Promise<Map<string, string>> {
    try {
        const files = new Map()
        const dir = await fs.opendir(BASE_PATH)
        for await (const dirent of dir) {
            if (dirent.isFile()) {
                const contents = await fs.readFile(BASE_PATH + '/' + dirent.name)
                files.set(dirent.name, crypto.createHash('sha256').update(contents).digest('hex'))
            }
        }
        return files
    } catch (err) {
        console.error(err)
        return new Map()
    }
}

async function read(name: string): Promise<Buffer> {
    return fs.readFile(BASE_PATH + '/' + name)
}

const app = new Koa()

app.use(async ctx => {
    if (ctx.path == '/') {
        ctx.body = Object.fromEntries(await ls())
    } else {
        const name = ctx.path.split('/')[1]
        ctx.body = await read(name)
    }
})

app.listen(3000)

// types: https://github.com/danielyxie/bitburner/blob/dev/src/ScriptEditor/NetscriptDefinitions.d.ts
