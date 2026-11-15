import { spawn } from 'node:child_process';
const args=process.argv.slice(2).filter(x=>x!=='--strictPort').map(x=>x==='--host'?'--hostname':x);
const child=spawn('next',['dev',...args],{stdio:'inherit',shell:false});
child.on('exit',code=>process.exit(code||0));
