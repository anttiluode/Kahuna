'use strict';
const $=id=>document.getElementById(id), K=Kahuna;
const colors={protected:'#ffad80',adaptive:'#9bdbbb',shared:'#8caeff'};
const labels={protected:'Protected records',adaptive:'Adaptive records',shared:'Shared learner'};
const descriptions={stable:'Four distinguishable contexts return with the same rules. Can old transformations survive?',drift:'One familiar context returns with a different rule. Protection can preserve the wrong answer.',ambiguous:'Four incompatible rules arrive with identical context cues. The learner has no reliable way to choose.',capacity:'Six distinguishable contexts arrive, but only four records exist. A full bank must refuse new writes.'};
let experiment,last=null,running=false,frame=0,cachedReport=null;
const fmt=v=>v===null?'—':v.toFixed(5);
function reset(){
  running=false;cancelAnimationFrame(frame);
  let seed=Number($('seed').value);
  if(!Number.isSafeInteger(seed)||seed<0||seed>4294967295){seed=11;$('seed').value='11';}
  experiment=new K.Experiment($('scenario').value,seed);last=null;cachedReport=null;
  $('description').textContent=descriptions[experiment.scenario];render();
}
function advance(n){for(let i=0;i<n;i++){const row=experiment.step();if(!row)break;last=row;}cachedReport=null;render();}
function tick(){if(!running)return;advance(8);if(experiment.t===experiment.total){running=false;render();return;}frame=requestAnimationFrame(tick);}
function renderRecords(){
  $('records').innerHTML=experiment.models.protected.records.map((r,i)=>{
    const selected=last&&last.models.protected.action.route===i,locked=r.n>=K.CONFIG.freezeAfter;
    const rings=r.w.map((w,k)=>{const rad=31+11*k;return `<circle cx="90" cy="85" r="${rad}" fill="none" stroke="#364144" stroke-width="3"/><circle cx="90" cy="85" r="${rad}" fill="none" stroke="${w>=0?colors.protected:colors.shared}" stroke-width="4" stroke-dasharray="${Math.min(1,Math.abs(w))*2*Math.PI*rad} ${2*Math.PI*rad}" transform="rotate(-90 90 85)"/>`;}).join('');
    const phase=experiment.t*.015,px=90+57*Math.cos(phase),py=85+57*Math.sin(phase);
    return `<div class="record ${selected?'selected':''}"><svg viewBox="0 0 180 175" role="img" aria-label="Record ${i+1}, ${locked?'read only':r.n?'learning':'unused'}, ${r.n} writes"><circle cx="90" cy="85" r="76" fill="#111719"/>${rings}<circle cx="90" cy="85" r="16" fill="#252e31"/><circle cx="90" cy="85" r="4" fill="#9caeaf"/>${selected?`<path d="M170 5 L${px} ${py}" stroke="#edece4" stroke-width="3"/><circle cx="${px}" cy="${py}" r="4" fill="${colors.protected}"/>`:''}</svg><strong>RECORD 0${i+1} · ${locked?'LOCKED':r.n?'LEARNING':'EMPTY'}</strong><small>${r.n?`cue (${r.c.map(v=>v.toFixed(2)).join(', ')}) · ${r.n} writes`:'Waiting for a new context'}</small></div>`;
  }).join('');
}
function chart(){
  const h=experiment.history;let max=.001;
  h.forEach(p=>K.NAMES.forEach(n=>max=Math.max(max,p.oldMSE[n])));max*=1.15;
  let s='';
  for(let i=0;i<3;i++){const y=15+i*60;s+=`<path d="M50 ${y}H585" stroke="#364144" stroke-dasharray="3 5"/><text x="0" y="${y+4}" fill="#9caeaf" font-size="10">${(max*(1-i/2)).toFixed(3)}</text>`;}
  for(const n of K.NAMES){const pts=h.map(p=>`${50+p.t/experiment.total*535},${135-p.oldMSE[n]/max*120}`);if(pts.length)s+=`<polyline points="${pts.join(' ')}" fill="none" stroke="${colors[n]}" stroke-width="2"/>`;
    h.forEach(p=>{s+=`<circle cx="${50+p.t/experiment.total*535}" cy="${135-p.oldMSE[n]/max*120}" r="2" fill="${colors[n]}"/>`;});}
  s+='<text x="50" y="162" fill="#9caeaf" font-size="10">0 samples</text>'+`<text x="530" y="162" fill="#9caeaf" font-size="10">${experiment.total}</text>`;
  $('chart').innerHTML=s;
}
function move(){
  let s='<path d="M25 105H235 M130 10V200" stroke="#364144"/><circle cx="130" cy="105" r="80" fill="none" stroke="#364144" stroke-dasharray="3 5"/>';
  if(last){
    const points=[['input',last.x,'#9caeaf'],['target',last.target,'#edece4'],...K.NAMES.map(n=>[n,last.models[n].y,colors[n]])];
    for(const [n,v,c] of points){const x=130+v[0]*60,y=105-v[1]*60;s+=`<path d="M130 105L${x} ${y}" stroke="${c}" opacity=".6"/><circle cx="${x}" cy="${y}" r="${n==='target'?7:n==='input'?5:3}" fill="${n==='input'||n==='target'?'none':c}" stroke="${c}" stroke-width="1.5"/>`;}
    $('cue').textContent=`Observed cue: (${last.cue.map(v=>v.toFixed(2)).join(', ')}). The learner receives this cue and input vector, never the hidden task number.`;
  }
  $('move').innerHTML=s;
}
function render(){
  const e=experiment,done=e.t===e.total;
  $('play').textContent=running?'Pause':done?'Run again':'Run experiment';
  $('progress').textContent=`${e.t} / ${e.total}`;
  $('used').textContent=`${e.models.protected.records.filter(r=>r.n).length} / 4`;
  $('writes').textContent=e.stats.protected.writes;$('full').textContent=e.stats.protected.full;
  $('action').textContent=last?`Sample ${e.t} · ${last.models.protected.action.status}${last.models.protected.action.route>=0?' · record '+(last.models.protected.action.route+1):''}`:'Waiting for the first encounter';
  const current=e.evaluate(),old=e.evaluate(false),seen=Object.keys(e.initial);
  const avg=a=>a.reduce((s,v)=>s+v,0)/a.length;
  $('scores').innerHTML=K.NAMES.map(n=>`<tr><td class="${n}-text">${labels[n]}</td><td>${e.t?fmt(e.stats[n].error/e.t):'—'}</td><td>${fmt(avg(current[n]))}</td><td>${seen.length?fmt(avg(seen.map(k=>old[n][k]-e.initial[k][n]))):'—'}</td></tr>`).join('');
  renderRecords();chart();move();
  if(done){
    cachedReport=cachedReport||e.report();const m=cachedReport.metrics;
    const sentences={stable:'Routing preserves these skills. Locking is not the whole story.',drift:'Preserving yesterday’s answer can mean failing today’s task.',ambiguous:'A protected wrong answer is still a wrong answer.',capacity:'Four records cannot store six separate transformations this way.'};
    $('verdict').textContent=sentences[e.scenario];
    $('detail').textContent=`Final current-rule MSE: protected ${fmt(m.protected.finalMSE)}, adaptive ${fmt(m.adaptive.finalMSE)}, shared ${fmt(m.shared.finalMSE)}. Compare learning quality as well as forgetting. These are the actual results for seed ${e.seed}.`;
    $('composition').textContent=`Composition diagnostic (provided two-step schedule): ${fmt(m.protected.compositionMSE)} protected MSE across ${e.count**2} ordered pairs. No paired transformations were used in training. This tests reuse, not discovering a plan.`;
  }else{
    $('verdict').textContent=e.t?'Watch what changes—and what is no longer allowed to change.':'Start with the easy world. Then change its rules.';
    $('detail').textContent='The adaptive bank is the important control: it has exactly the same routing and records, with writing left enabled.';
    $('composition').textContent='';
  }
}
$('play').onclick=()=>{if(experiment.t===experiment.total)reset();running=!running;render();if(running)frame=requestAnimationFrame(tick);else cancelAnimationFrame(frame);};
$('step').onclick=()=>{running=false;cancelAnimationFrame(frame);advance(1);};
$('finish').onclick=()=>{running=false;cancelAnimationFrame(frame);advance(experiment.total-experiment.t);};
$('reset').onclick=reset;$('scenario').onchange=reset;$('seed').onchange=reset;
$('export').onclick=()=>{const a=document.createElement('a');const url=URL.createObjectURL(new Blob([JSON.stringify(experiment.report(),null,2)],{type:'application/json'}));a.href=url;a.download=`kahuna-${experiment.scenario}-${experiment.seed}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
reset();
