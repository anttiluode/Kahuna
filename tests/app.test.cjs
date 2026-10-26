// DOM-boundary smoke test; this does not verify browser layout or rendering.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
test('UI steps, completes, resets on scenario change, and validates seed',()=>{
  const nodes={};
  for(const id of ['scenario','seed','play','step','finish','reset','export','description',
    'progress','used','writes','full','action','scores','chart','records','move','cue','verdict','detail','composition']) {
    nodes[id]={value:'',textContent:'',innerHTML:''};
  }
  nodes.scenario.value='stable';nodes.seed.value='11';
  const context={Kahuna:require('../core.js'),document:{getElementById:id=>nodes[id]},
    requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{},setTimeout};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../app.js'),'utf8'),context);
  nodes.step.onclick();
  assert.equal(nodes.progress.textContent,'1 / 2048');
  nodes.finish.onclick();
  assert.equal(nodes.progress.textContent,'2048 / 2048');
  assert.match(nodes.composition.textContent,/provided two-step schedule/);
  nodes.scenario.value='capacity';nodes.scenario.onchange();
  assert.equal(nodes.progress.textContent,'0 / 3072');
  nodes.finish.onclick();assert.equal(nodes.full.textContent,1024);
  nodes.seed.value='1.5';nodes.seed.onchange();
  assert.equal(nodes.seed.value,'11');assert.equal(nodes.progress.textContent,'0 / 3072');
});
