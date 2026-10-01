import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
const previous = await readFile('next-env.d.ts', 'utf8').catch(() => null);
const env = {
  ...process.env,
  EDOCTOR_RESEARCH_TEST_BUILD: '1',
  EDOCTOR_RESEARCH_PREVIEW: '1',
  EDOCTOR_TEST_BUILD: '',
  GRAPHQL_URL: '',
  NEXT_PUBLIC_GRAPHQL_URL: '',
  NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3113',
  SITE_URL: 'http://127.0.0.1:3113',
  WORDPRESS_URL: '',
  CHECKOUT_SECRET: '',
  NEXT_PUBLIC_MEILI_URL: '',
};
function run(script, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      env,
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`Command exited ${code}`)),
    );
  });
}
try {
  await run('node_modules/next/dist/bin/next', ['build', '--webpack']);
  await run('node_modules/@playwright/test/cli.js', [
    'test',
    '--config=playwright.research.config.ts',
  ]);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (previous !== null) await writeFile('next-env.d.ts', previous);
}
