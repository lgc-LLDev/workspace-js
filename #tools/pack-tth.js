const { join, resolve } = require('path');
const { readdir, mkdir, rmdir } = require('fs/promises');
const { existsSync } = require('fs');
const { spawn } = require('node:child_process');

const workDir = resolve(join(__dirname, '..'));
const tmpDir = join(__dirname, 'tmp');

async function zip(tthDirName) {
  console.log(`${tthDirName} Start!`);

  const filename = `${tthDirName}.tth`;
  const proc = spawn(
    '7z',
    [
      'a',
      '-y',
      '-tzip',
      '-xr!node_modules',
      '-xr!.git',
      join(tmpDir, filename),
      '*',
    ],
    { cwd: join(workDir, tthDirName) }
  );

  await new Promise((resv, reject) => {
    proc.on('close', (code) => {
      if (code === 0) resv();
      else reject();
    });
  });

  console.log(`${tthDirName} OK!`);
}

async function main() {
  if (existsSync(tmpDir)) {
    await rmdir(tmpDir);
  }
  await mkdir(tmpDir);

  const tasks = [];

  for (const dir of await readdir(workDir, { withFileTypes: true })) {
    if (dir.isDirectory() && existsSync(join(dir.name, 'tooth.json'))) {
      tasks.push(zip(dir.name));
    }
  }

  await Promise.all(tasks);
}

main();
