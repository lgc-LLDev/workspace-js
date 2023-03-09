const { spawn } = require('child_process');
const { join, resolve } = require('path');
const { existsSync } = require('fs');
const { readdir } = require('fs/promises');
const { stdin, stdout } = require('process');
// eslint-disable-next-line import/no-unresolved
const readline = require('readline/promises');

const workDir = resolve(join(__dirname, '..'));

function awaitProc(proc) {
  return new Promise((resv) => {
    proc.on('close', (code) => {
      resv(code);
    });
  });
}

async function commit(respDir, msg) {
  const cwd = join(workDir, respDir);

  console.log(`${respDir} Start`);

  const gitAddProc = spawn('git', ['add', '.'], { cwd });
  await awaitProc(gitAddProc);

  const gitCommitProc = spawn('git', ['commit', '-m', msg], { cwd });
  if ((await awaitProc(gitCommitProc)) !== 0) {
    console.log(`${respDir} No file needs commit`);
    return;
  }

  const gitPushProc = spawn('git', ['push'], { cwd });
  if ((await awaitProc(gitPushProc)) !== 0) {
    console.log(`${respDir} Push Failed!`);
    return;
  }

  console.log(`${respDir} OK`);
}

async function main() {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const msg = (await rl.question('Input commit msg: ')).trim();
  rl.close();

  if (!msg) {
    console.log('No msg, return');
    return;
  }

  for (const dir of await readdir(workDir, { withFileTypes: true })) {
    if (dir.isDirectory() && existsSync(join(dir.name, '.git'))) {
      // eslint-disable-next-line no-await-in-loop
      await commit(dir.name, msg);
    }
  }

  console.log('Updating Workspace');
  await commit('.', 'update workspace');
}

main().catch(console.error);
