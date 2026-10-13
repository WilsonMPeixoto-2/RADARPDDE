import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { closeSnapshot } from './backup-production.mjs';

test('snapshot rollback waits for the real child process to close before network isolation', async () => {
  const child = spawn(process.execPath, ['-e', `
    let input = '';
    process.stdin.on('data', chunk => input += chunk);
    process.stdin.on('end', () => {
      if (input !== 'ROLLBACK;\\n') process.exit(2);
      setTimeout(() => process.exit(0), 100);
    });
  `], { stdio: ['pipe', 'pipe', 'pipe'] });
  let closed = false;
  child.once('close', () => { closed = true; });
  const pending = closeSnapshot(child);
  assert.equal(closed, false);
  await pending;
  assert.equal(closed, true);
  assert.equal(child.exitCode, 0);
});

test('a failed snapshot process cannot be accepted as a clean rollback', async () => {
  const child = spawn(process.execPath, ['-e', `
    process.stdin.resume();
    process.stdin.on('end', () => process.exit(3));
  `], { stdio: ['pipe', 'pipe', 'pipe'] });
  await assert.rejects(closeSnapshot(child), /snapshot session failed/);
  assert.equal(child.exitCode, 3);
});
