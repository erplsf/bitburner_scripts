import * as Koa from 'koa';
import * as fs from 'fs/promises';

async function ls() {
    try {
        const dir = await fs.opendir('./');
        for await (const dirent of dir) console.log(dirent.name);
    } catch (err) {
        console.error(err);
    }
}

const app = new Koa();

app.use(async ctx => {
    await ls();
    ctx.body = 'Hello World';
});

app.listen(3000);
