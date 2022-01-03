import Koa from 'koa'
import * as fs from 'fs/promises'
import * as crypto from 'crypto'

const BASE_PATH = './dist/bb'

async function fillMap(map: Map<string, string>, path: string): Promise<void> {
  const dir = await fs.opendir(path)
  for await (const dirent of dir) {
    if (dirent.isFile()) {
      const contents = await fs.readFile(path + '/' + dirent.name)
      map.set(
        cleanFilename(path + '/' + dirent.name),
        crypto.createHash('sha256').update(contents).digest('hex')
      )
    } else if (dirent.isDirectory()) {
      await fillMap(map, path + '/' + dirent.name)
    }
  }
}

function cleanFilename(fn: string): string {
  return fn.split('/').slice(3).join('/')
}

async function ls(): Promise<Map<string, string>> {
  try {
    const files = new Map()
    await fillMap(files, BASE_PATH)
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

app.use(async (ctx) => {
  if (ctx.path == '/') {
    ctx.body = Object.fromEntries(await ls())
  } else {
    const name = ctx.path.split('/').slice(1).join('/')
    ctx.body = await read(name)
  }
})

app.listen(3000)

// types: https://github.com/danielyxie/bitburner/blob/dev/src/ScriptEditor/NetscriptDefinitions.d.ts
