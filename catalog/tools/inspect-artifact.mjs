import { Workbook } from '@oai/artifact-tool';
const w = Workbook.create();
console.log(await w.help('export csv'));
