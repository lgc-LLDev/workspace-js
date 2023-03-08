const { join, resolve, dirname, basename } = require('path');
const { readdir, mkdir, rmdir, readFile, writeFile } = require('fs/promises');
const { existsSync } = require('fs');

const workDir = resolve(join(__dirname, '..'));
const tmpDir = join(__dirname, 'tmp');

async function convert(toothPath) {
  const {
    tooth,
    information: { name, description, author, license, homepage },
  } = JSON.parse(await readFile(toothPath, { encoding: 'utf-8' }));

  const obj = {
    format_version: 1,
    tooth,
    information: {
      author,
      description,
      homepage,
      license,
      name,
      repository: tooth,
      tags: ['plugin', 'llse'],
    },
  };

  await writeFile(
    join(tmpDir, `${basename(dirname(toothPath)).toLowerCase()}.json`),
    JSON.stringify(obj, null, 2),
    { encoding: 'utf-8' }
  );
}

async function main() {
  if (existsSync(tmpDir)) {
    await rmdir(tmpDir, { recursive: true });
  }
  await mkdir(tmpDir);

  const tasks = [];

  for (const dir of await readdir(workDir, { withFileTypes: true })) {
    const toothPath = join(workDir, dir.name, 'tooth.json');
    if (dir.isDirectory() && existsSync(toothPath)) {
      tasks.push(convert(toothPath));
    }
  }

  await Promise.all(tasks);
}

main();
