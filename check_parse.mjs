import { parse } from '@babel/parser';
import fs from 'node:fs';

const files = [
  'src/App.jsx',
  'src/main.jsx',
  'src/components/AuthScreen.jsx',
  'src/components/Dashboard.jsx',
  'src/components/AgentEditor.jsx',
  'src/components/PhoneSimulator.jsx',
  'src/components/DeployTab.jsx',
  'src/components/LandingPage.jsx',
  'src/lib/agents.js',
  'src/lib/api.js',
  'src/lib/supabase.js',
  'src/lib/csv.js',
  'server/index.js',
];
let ok = true;
for (const f of files) {
  try {
    parse(fs.readFileSync(f, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
    console.log('OK  ' + f);
  } catch (e) {
    ok = false;
    console.log('ERR ' + f + ' :: ' + e.message);
  }
}
process.exit(ok ? 0 : 1);
