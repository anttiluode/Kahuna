/* Kahuna: one learning engine for Node and the browser. No external dependencies. */
(function(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Kahuna = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const CONFIG = Object.freeze({slots:4, freezeAfter:128, radius:.65, rate:.2, block:256});
  const NAMES = ['protected','adaptive','shared'];
  const mse = (a,b) => ((a[0]-b[0])**2+(a[1]-b[1])**2)/2;
  const mean = a => a.reduce((s,v)=>s+v,0)/a.length;
  function rng(seed) {
    let a=seed>>>0;
    return () => { a+=0x6D2B79F5; let t=a; t=Math.imul(t^t>>>15,t|1);
      t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; };
  }
  function rotate(x,angle) {
    const c=Math.cos(angle),s=Math.sin(angle);
    return [c*x[0]-s*x[1],s*x[0]+c*x[1]];
  }
  function transform(w,x) {return [w[0]*x[0]+w[1]*x[1],w[2]*x[0]+w[3]*x[1]];}
  class RecordBank {
    constructor(protect=true) {
      this.protect=protect;
      this.records=Array.from({length:CONFIG.slots},()=>({w:[0,0,0,0],c:[0,0],n:0}));
    }
    numericSlots() {return this.records.length*7;}
    route(c) {
      let index=-1,distance=Infinity;
      this.records.forEach((r,i)=>{
        if(!r.n)return;
        const d=Math.hypot(c[0]-r.c[0],c[1]-r.c[1]);
        if(d<distance){index=i;distance=d;}
      });
      return {index,distance};
    }
    predict(x,c) {
      const {index,distance}=this.route(c);
      // Unknown contexts abstain until an unused record has been trained.
      return {y:index<0||distance>CONFIG.radius?[0,0]:transform(this.records[index].w,x),
        route:index<0||distance>CONFIG.radius?-1:index};
    }
    learn(x,c,y) {
      let {index,distance}=this.route(c);
      if(index<0||distance>CONFIG.radius) {
        index=this.records.findIndex(r=>r.n===0);
        if(index<0)return {status:'full',route:-1};
      }
      const r=this.records[index];
      if(this.protect&&r.n>=CONFIG.freezeAfter)return {status:'read only',route:index};
      const p=transform(r.w,x), gain=CONFIG.rate/(.25+x[0]**2+x[1]**2);
      for(let j=0;j<2;j++)for(let k=0;k<2;k++)r.w[j*2+k]+=gain*(y[j]-p[j])*x[k];
      r.n++;
      for(let k=0;k<2;k++)r.c[k]+=(c[k]-r.c[k])/r.n;
      return {status:'write',route:index};
    }
  }
  class Shared {
    constructor(){this.w=Array(28).fill(0);}
    numericSlots(){return this.w.length;}
    features(x,c){
      const [a,b]=c, terms=[1,a,b,a*b,a*a,b*b,a*a*a];
      return terms.flatMap(v=>[v*x[0],v*x[1]]);
    }
    predict(x,c){
      const f=this.features(x,c);
      return {y:[0,1].map(j=>f.reduce((s,v,k)=>s+v*this.w[j*14+k],0)),route:-1};
    }
    learn(x,c,y){
      const f=this.features(x,c),p=this.predict(x,c).y;
      const gain=CONFIG.rate/(.25+f.reduce((s,v)=>s+v*v,0));
      for(let j=0;j<2;j++)for(let k=0;k<14;k++)this.w[j*14+k]+=gain*(y[j]-p[j])*f[k];
      return {status:'write',route:-1};
    }
  }
  class Experiment {
    constructor(scenario='stable',seed=11) {
      if(!['stable','drift','ambiguous','capacity'].includes(scenario))throw Error('Unknown scenario');
      if(!Number.isSafeInteger(seed))throw Error('Seed must be an integer');
      this.scenario=scenario;this.seed=seed;this.random=rng(seed);this.t=0;
      this.models={protected:new RecordBank(true),adaptive:new RecordBank(false),shared:new Shared()};
      this.contexts=[[.9,.9],[-.9,.9],[-.9,-.9],[.9,-.9],[0,2.4],[0,-2.4]];
      this.angles=[0,Math.PI/2,Math.PI,-Math.PI/2,.7,-.7];
      this.count=scenario==='capacity'?6:4;
      this.order=Array.from({length:this.count},(_,i)=>i);
      for(let i=this.order.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));
        [this.order[i],this.order[j]]=[this.order[j],this.order[i]];}
      this.schedule=[...this.order,...this.order.slice().reverse()];
      this.total=this.schedule.length*CONFIG.block;
      this.initial={};this.history=[];
      this.stats=Object.fromEntries(NAMES.map(n=>[n,{error:0,full:0,writes:0,reads:0}]));
      const er=rng(8675309);
      this.test=Array.from({length:64},()=>({x:[er()*2-1,er()*2-1],jitter:[(er()-.5)*.24,(er()-.5)*.24]}));
    }
    cue(task,jitter=[0,0]) {
      const c=this.contexts[this.scenario==='ambiguous'?0:task];
      return c.map((v,i)=>v+jitter[i]);
    }
    angle(task,current=true) {
      const changed=this.scenario==='drift'&&this.t>=this.count*CONFIG.block;
      return this.angles[task]+(current&&changed&&task===this.order[0]?Math.PI/2:0);
    }
    evaluate(current=true) {
      return Object.fromEntries(NAMES.map(name=>[name,Array.from({length:this.count},(_,task)=>
        mean(this.test.map(({x,jitter})=>mse(this.models[name].predict(x,this.cue(task,jitter)).y,
          rotate(x,this.angle(task,current))))))]));
    }
    composition() {
      return Object.fromEntries(NAMES.map(name=>{
        const errors=[];
        for(let a=0;a<this.count;a++)for(let b=0;b<this.count;b++) {
          for(const {x,jitter} of this.test) {
            const first=this.models[name].predict(x,this.cue(a,jitter)).y;
            const second=this.models[name].predict(first,this.cue(b,jitter)).y;
            errors.push(mse(second,rotate(rotate(x,this.angle(a)),this.angle(b))));
          }
        }
        return [name,mean(errors)];
      }));
    }
    step() {
      if(this.t>=this.total)return null;
      const block=Math.floor(this.t/CONFIG.block), task=this.schedule[block];
      const x=[this.random()*2-1,this.random()*2-1];
      const cue=this.cue(task,[(this.random()-.5)*.24,(this.random()-.5)*.24]);
      const target=rotate(x,this.angle(task)).map(v=>v+(this.random()-.5)*.04);
      const row={t:this.t,block,task,x,cue,target,models:{}};
      for(const name of NAMES) {
        const m=this.models[name],p=m.predict(x,cue),error=mse(p.y,target);
        const action=m.learn(x,cue,target),s=this.stats[name];
        s.error+=error;
        if(action.status==='full')s.full++;
        if(action.status==='write')s.writes++;
        if(action.status==='read only')s.reads++;
        row.models[name]={...p,error,action};
      }
      this.t++;
      if(this.t%CONFIG.block===0) {
        const evaluation=this.evaluate(false);
        if(block<this.count)this.initial[task]=Object.fromEntries(NAMES.map(n=>[n,evaluation[n][task]]));
        this.history.push({t:this.t,task,oldMSE:Object.fromEntries(NAMES.map(n=>
          [n,mean(Object.keys(this.initial).map(k=>evaluation[n][Number(k)]))]))});
      }
      return row;
    }
    report() {
      const current=this.evaluate(),old=this.evaluate(false),composition=this.composition();
      const seen=Object.keys(this.initial).map(Number);
      return {version:1,scenario:this.scenario,seed:this.seed,samples:this.t,complete:this.t===this.total,
        budget:{numericSlots:28,payloadBytes:224,excludes:'JS overhead, global bookkeeping, configuration, scratch and evaluation data'},
        metrics:Object.fromEntries(NAMES.map(n=>[n,{
          onlineMSE:this.t?this.stats[n].error/this.t:0,
          acquisitionMSE:seen.length?mean(seen.map(k=>this.initial[k][n])):null,
          finalMSE:mean(current[n]),oldMSE:mean(old[n]),
          forgetting:seen.length?mean(seen.map(k=>old[n][k]-this.initial[k][n])):null,
          compositionMSE:composition[n],...this.stats[n],
          usedRecords:n==='shared'?null:this.models[n].records.filter(r=>r.n>0).length
        }])),history:this.history};
    }
  }
  function run(scenario,seed){const e=new Experiment(scenario,seed);while(e.step());return e.report();}
  return {CONFIG,NAMES,rng,rotate,mse,RecordBank,Shared,Experiment,run};
});
