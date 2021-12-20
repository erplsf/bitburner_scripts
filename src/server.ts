import * as Koa from 'koa';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';

const BASE_PATH = './dist/bb';

async function ls(): Promise<Map<string, string>> {
    try {
        const files = new Map();
        const dir = await fs.opendir(BASE_PATH);
        for await (const dirent of dir) {
            if (dirent.isFile()) {
                const contents = await fs.readFile(BASE_PATH + '/' + dirent.name);
                files.set(dirent.name, crypto.createHash('sha256').update(contents).digest('hex'));
            }
        }
        return files;
    } catch (err) {
        console.error(err);
        return new Map();
    }
}

const app = new Koa();

app.use(async ctx => {
    ctx.body = Object.fromEntries(await ls());
});

app.listen(3000);
