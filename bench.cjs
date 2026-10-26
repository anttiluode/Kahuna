const fs=require('node:fs');
const K=require('./core.js');
const seeds=[11,22,33,44,55], scenarios=['stable','drift','ambiguous','capacity'];
const runs=scenarios.flatMap(s=>seeds.map(seed=>K.run(s,seed)));
const summary=scenarios.flatMap(s=>K.NAMES.map(model=>{
  const subset=runs.filter(r=>r.scenario===s).map(r=>r.metrics[model]);
  const row={scenario:s,model};
  for(const key of ['onlineMSE','acquisitionMSE','finalMSE','oldMSE','forgetting','compositionMSE','full']) {
    const v=subset.map(r=>r[key]); const avg=v.reduce((a,b)=>a+b,0)/v.length;
    row[key]={mean:avg,sd:Math.sqrt(v.reduce((a,b)=>a+(b-avg)**2,0)/(v.length-1))};
  }
  return row;
}));
fs.mkdirSync('results',{recursive:true});
fs.writeFileSync('results/benchmark.json',JSON.stringify({protocol:'docs/protocol.md',seeds,summary,runs},null,2)+'\n');
console.table(summary.map(r=>({scenario:r.scenario,model:r.model,
  finalMSE:r.finalMSE.mean.toFixed(5),forgetting:r.forgetting.mean.toFixed(5),
  composition:r.compositionMSE.mean.toFixed(5),full:r.full.mean})));
