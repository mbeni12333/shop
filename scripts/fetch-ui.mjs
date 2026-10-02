// Pulls the shadcn/ui new-york registry sources and adapts them to this repo:
//   - "@/lib/utils"  -> "@/edoctor/lib/utils"
//   - double quotes -> single quotes (prettier config)
//   - drops the "use client" directive: this app is on the Pages Router
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const components = process.argv.slice(2);
mkdirSync('src/edoctor/ui', { recursive: true });

for (const name of components) {
  const url = `https://ui.shadcn.com/r/styles/new-york/${name}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    console.log(`SKIP  ${name} (${response.status})`);
    continue;
  }
  const registry = await response.json();
  for (const file of registry.files ?? []) {
    const target = file.path.replace(/^ui\//, 'src/edoctor/ui/');
    let content = file.content
      .replace(/^"use client"\n+/, '')
      .replace(/from "@\/lib\/utils"/g, "from '@/edoctor/lib/utils'")
      .replace(/from "@\/components\//g, "from '@/edoctor/")
      .replace(/from '(\.[^']*)\.tsx'/g, "from '$1'")
      .replace(/from "(\.[^"]*)\.tsx"/g, "from '$1'");
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
    console.log(`WRITE ${target} (${content.split('\n').length} lines)`);
  }
}
