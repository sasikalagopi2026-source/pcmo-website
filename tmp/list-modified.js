const fs = require('fs').promises;
const path = require('path');
const start = new Date('2026-07-29T08:00:00');
const end = new Date('2026-07-29T09:00:00');
const root = process.cwd();
(async function(){
  const results=[];
  async function walk(dir){
    const entries = await fs.readdir(dir,{withFileTypes:true});
    for(const e of entries){
      const full = path.join(dir,e.name);
      if(e.isDirectory()){
        if(full.includes(path.sep + 'node_modules') || full.includes(path.sep + '.git')) continue;
        await walk(full);
      } else if(e.isFile()){
        try{
          const stat = await fs.stat(full);
          const m = stat.mtime;
          if(m>=start && m<=end) results.push({ fullPath: full, mtime: m.toISOString() });
        }catch(err){ /* ignore */ }
      }
    }
  }
  await walk(root);
  console.log(JSON.stringify(results, null, 2));
})().catch(err=>{ console.error(err); process.exit(1); });
