const { join, resolve, dirname, basename } = require('path');
const {
  readdir,
  mkdir,
  rm,
  readFile,
  writeFile,
  copyFile,
} = require('fs/promises');
const { existsSync } = require('fs');

const workDir = resolve(join(__dirname, '..'));
const tmpDir = join(__dirname, 'tmp');

const teethDir = join(tmpDir, 'teeth');
const docsDir = join(tmpDir, 'readmes');

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

  const toothDir = dirname(toothPath);
  const toothName = basename(toothDir).toLowerCase();
  await writeFile(
    join(teethDir, `${toothName}.json`),
    JSON.stringify(obj, null, 2),
    { encoding: 'utf-8' }
  );

  for (const f of await readdir(toothDir)) {
    if (f.toLowerCase() === 'readme.md') {
      // eslint-disable-next-line no-await-in-loop
      await copyFile(join(toothDir, f), join(docsDir, `${toothName}.md`));
      break;
    }
  }
}

async function main() {
  if (existsSync(tmpDir)) {
    await rm(tmpDir, { recursive: true });
  }
  await mkdir(tmpDir);
  await mkdir(teethDir);
  await mkdir(docsDir);

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
