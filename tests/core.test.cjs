const {test} = require('node:test');
const assert = require('node:assert/strict');
const K = require('../core.js');

test('new record is scored before allocation and learning', () => {
  const m = new K.RecordBank(true);
  assert.deepEqual(m.predict([1,0], [1,1]).y, [0,0]);
  m.learn([1,0], [1,1], [0,1]);
  assert.ok(m.predict([1,0], [1,1]).y[1] > 0);
});
test('protection freezes mapping and routing center, including contradictory targets', () => {
  const m = new K.RecordBank(true);
  for(let i=0;i<128;i++) m.learn([1,0], [1,1], [0,1]);
  const before = JSON.stringify(m.records);
  for(let i=0;i<30;i++) m.learn([1,0], [1.1,1], [1,0]);
  assert.equal(JSON.stringify(m.records), before);
});
test('full bank refuses new context without overwriting and retains fixed payload', () => {
  const m = new K.RecordBank(true);
  for(const c of [[1,1],[-1,1],[-1,-1],[1,-1]]) m.learn([1,0],c,[1,0]);
  const before = JSON.stringify(m.records);
  assert.equal(m.learn([1,0],[4,4],[0,1]).status, 'full');
  assert.equal(JSON.stringify(m.records),before);
  assert.equal(m.numericSlots(),28);
});
test('evaluation and composition do not mutate learners', () => {
  const e = new K.Experiment('stable',11);
  for(let i=0;i<20;i++) e.step();
  const before = JSON.stringify(e.models);
  e.evaluate(); e.composition(); e.report();
  assert.equal(JSON.stringify(e.models), before);
});
test('shared and modular learners have the same persistent numeric slot budget', () => {
  assert.equal(new K.Shared().numericSlots(),28);
  assert.equal(new K.RecordBank(false).numericSlots(),28);
});
test('sample score uses pre-update prediction and target noise is not in evaluation', () => {
  const e = new K.Experiment('stable',11); const row=e.step();
  for(const v of Object.values(row.models)) {
    assert.deepEqual(v.y,[0,0]);
    assert.equal(v.error,(row.target[0]**2+row.target[1]**2)/2);
  }
  assert.deepEqual(e.evaluate(), e.evaluate());
});
test('all scenarios finish reproducibly with finite scores', () => {
  for(const s of ['stable','drift','ambiguous','capacity']) {
    const a=K.run(s,11), b=K.run(s,11);
    assert.deepEqual(a,b);
    for(const m of Object.values(a.metrics)) assert.ok(Number.isFinite(m.finalMSE));
  }
});
test('invalid scenarios are rejected',()=>assert.throws(()=>new K.Experiment('oops',1)));
