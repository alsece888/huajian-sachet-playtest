import {CONFIG,RECIPES} from './config.js';
export function validTie(points){
 if(points.length<3)return false;
 const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
 return Math.min(...xs)<.25&&Math.max(...xs)>.75&&ys.every(y=>y>=.18&&y<=.55);
}
const PEOPLE=[{name:'沈姑娘',recipe:'rose',portrait:0},{name:'苏姑娘',recipe:'clove',portrait:1},{name:'陆公子',recipe:'rose',portrait:2}];
export class Game{
 constructor(now=()=>performance.now()){this.now=now;this.events=[];this.reset();}
 log(type,data={}){this.events.push({type,time:this.now(),...data});}
 say(message){this.s.message=message;return false;}
 reset(){this.pausedAt=null;this.sequence=0;this.s={scale:null,tools:{grind:null,steam:null},slots:[null,null,null],customers:[null,null,null],nextArrival:this.now()+CONFIG.arrival,selected:0,packing:null,product:null,delivered:0,lost:0,message:'第一位客人来了！照着订单，拖香料到秤盘。'};this.arrive(0);this.log('reset');}
 arrive(i){const serial=this.sequence++;this.s.customers[i]={...PEOPLE[serial%3],id:serial,arrived:this.now(),state:'waiting',leaves:null};this.log('arrived',{id:serial,slot:i});}
 patience(c){return Math.max(0,1-((this.pausedAt??this.now())-c.arrived)/CONFIG.patience);}
 mood(c){const p=this.patience(c);return p>.6?'calm':p>.25?'worried':'angry';}
 pause(){if(this.pausedAt===null){this.pausedAt=this.now();this.hold(false);}}
 resume(){if(this.pausedAt===null)return;const d=this.now()-this.pausedAt;this.s.nextArrival+=d;for(const c of this.s.customers)if(c){c.arrived+=d;if(c.leaves!==null)c.leaves+=d;}if(this.s.scale)this.s.scale.start+=d;for(const t of Object.values(this.s.tools))if(t)t.last+=d;this.pausedAt=null;}
 weigh(recipe){if(!RECIPES[recipe]||this.s.scale)return this.say('秤上已有材料，把称好的材料拿去加工。');this.s.scale={recipe,stage:'weighing',start:this.now()};this.s.message='香料落入秤盘，正在称量。';this.log('weigh');return true;}
 process(method){const s=this.s;if(!['grind','steam'].includes(method)||s.scale?.stage!=='weighed'||s.tools[method])return this.say('这件器具有材料，先取走成料，或使用另一件器具。');s.tools[method]={recipe:s.scale.recipe,method,stage:'processing',elapsed:0,held:false,last:this.now()};s.scale=null;s.message=method==='grind'?'长按研磨棒，松手暂停。蒸笼可同时工作。':'蒸笼开始工作了，可以去称料、研磨或装袋。';this.log(method);return true;}
 hold(on){if(this.pausedAt===null)this.tick();const t=this.s.tools.grind;if(t?.stage!=='processing')return false;t.held=on;t.last=this.now();return true;}
 tick(){
  if(this.pausedAt!==null)return;
  const s=this.s,now=this.now();
  for(let i=0;i<3;i++){const c=s.customers[i];if(!c)continue;
   if(c.state==='waiting'&&this.patience(c)<=0){c.state='left';c.leaves=now+CONFIG.departure;s.lost++;s.message=c.name+'等了太久，失望地离开了。';this.log('timeout',{id:c.id});}
   if(c.state!=='waiting'&&now>=c.leaves)s.customers[i]=null;
  }
  if(now>=s.nextArrival){const i=s.customers.findIndex(x=>!x);if(i>=0){this.arrive(i);s.nextArrival=now+CONFIG.arrival;}}
  if(s.scale?.stage==='weighing'&&now-s.scale.start>=CONFIG.durations.weigh){s.scale.stage='weighed';s.message='称好了，拿到研磨钵或蒸笼。';}
  for(const t of Object.values(s.tools)){if(t?.stage!=='processing')continue;if(t.method==='steam'||t.held)t.elapsed+=Math.max(0,now-t.last);t.last=now;
   if(t.elapsed>=CONFIG.durations[t.method]){t.elapsed=CONFIG.durations[t.method];t.stage='ready';t.held=false;t.quantity=2;s.message='两份材料做好了，拿到同一个空香盘。';this.log('processed',{method:t.method});}
  }
 }
 store(i,method){const s=this.s,t=s.tools[method];if(!Number.isInteger(i)||i<0||i>=3||t?.stage!=='ready'||s.slots[i])return this.say('两份成料需要一个空香盘。');s.slots[i]={recipe:t.recipe,method,quantity:2};s.tools[method]=null;s.message='两份放在同一盘，点击左侧香囊装袋。';this.log('stored',{method});return true;}
 openPack(){if(this.s.product)return this.say('先把做好的香囊交给顾客。');this.s.packing={slot:null};return true;}
 choose(i){if(!this.s.packing||!this.s.slots[i])return false;this.s.packing.slot=i;return true;}
 cancelPack(){this.s.packing=null;}
 tie(points){const s=this.s,i=s.packing?.slot;if(i==null||!s.slots[i]||!validTie(points))return false;s.product={recipe:s.slots[i].recipe,method:s.slots[i].method};if(--s.slots[i].quantity===0)s.slots[i]=null;s.packing=null;s.message='绑好了，把香囊递给需要它的顾客。';this.log('packed');return true;}
 deliver(i){this.tick();const c=this.s.customers[i];if(!this.s.product)return false;if(!c||c.state!=='waiting')return this.say('这位客人已离开，香囊留着给下一位。');if(this.s.product.recipe!==c.recipe)return this.say(c.name+'要的是'+RECIPES[c.recipe].name+'，香囊已放回。');this.s.product=null;this.s.delivered++;c.state='served';c.leaves=this.now()+CONFIG.departure;this.s.message=c.name+'：谢谢掌柜，真香！';this.log('delivered',{id:c.id});return true;}
 discard(){if(this.s.packing)return false;this.s.slots[this.s.selected]=null;return true;}
}


