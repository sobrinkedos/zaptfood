const fs = require('fs');
const workflow = JSON.parse(fs.readFileSync('n8n/workflows/zaptfood_main_workflow.json', 'utf8'));
workflow.id = '6ubPA5St1tRpAClS';
fs.writeFileSync('n8n/workflows/updated_workflow.json', JSON.stringify(workflow, null, 2));
console.log('Created updated_workflow.json with ID 6ubPA5St1tRpAClS');
