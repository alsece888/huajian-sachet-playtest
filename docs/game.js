import {CONFIG,RECIPES,HERBS} from './config.js?v=v6.0';
export function validTie(points){return points.length>=3&&Math.min(...points.map(p=>p.x))<.25&&Math.max(...points.map(p=>p.x))>.75&&points.every(p=>p.y>=.18&&p.y<=.55);}
const PEOPLE=[{name:'沈姑娘',portrait:0},{name:'苏姑娘',portrait:1},{name:'陆公子',portrait:2}];
const same=(a,b)=>[...a].sort().join('|')===[...b].sort().join('|');
export class Game{
 constructor(now=()=>performance.now()){this.now=now;this.events=[];this.reset();}
 log(type,data={}){this.events.push({type,time:this.now(),...data});}
 say(message){this.s.message=message;return false;}
 reset(){this.pausedAt=null;this.sequence=0;this.s={day:1,silver:0,delivered:0,lost:0};this.startDay();this.log('reset');}
 startDay(){Object.assign(this.s,{dayStart:this.now(),closed:false,dayIncome:0,scale:null,tools:{grind:null,steam:null},slots:Array.from({length:3},()=>({material:null,bag:null})),stock:Object.fromEntries(HERBS.map(h=>[h,CONFIG.stock])),restock:Object.fromEntries(HERBS.map(h=>[h,0])),customers:[null,null,null],nextArrival:this.now()+CONFIG.arrival,packing:null,message:'照订单选料，多味香料可以一起称量。'});this.pausedAt=null;this.arrive(0);}
 nextDay(){if(!this.s.closed)return false;this.s.day++;this.startDay();return true;}
 time(){return this.pausedAt??this.now();}
 running(){return this.pausedAt===null&&!this.s.closed;}
 clock(){const mins=Math.min(600,Math.floor((this.time()-this.s.dayStart)/CONFIG.dayDuration*600));return String(8+Math.floor(mins/60)).padStart(2,'0')+':'+String(mins%60).padStart(2,'0');}
 arrive(i){const id=this.sequence++,count=1+(id%4),ingredients=Array.from({length:count},(_,j)=>HERBS[(Math.floor(id/4)+j)%4]);this.s.customers[i]={...PEOPLE[id%3],id,ingredients,style:id%2?'blue':'red',arrived:this.now(),state:'waiting',leaves:null};this.log('arrived',{id,ingredients});}
 patience(c){return Math.max(0,1-(this.time()-c.arrived)/CONFIG.patience);}
 mood(c){const p=this.patience(c);return p>.6?'calm':p>.25?'worried':'angry';}
 pause(){if(this.pausedAt===null)this.pausedAt=this.now();}
 resume(){if(this.pausedAt===null)return;const d=this.now()-this.pausedAt;this.s.dayStart+=d;this.s.nextArrival+=d;for(const c of this.s.customers)if(c){c.arrived+=d;if(c.leaves!==null)c.leaves+=d;}if(this.s.scale)this.s.scale.start+=d;for(const t of Object.values(this.s.tools))if(t)t.start+=d;this.pausedAt=null;}
 pickup(h){if(!this.running()||!RECIPES[h]||this.s.stock[h]<=0)return false;this.s.stock[h]--;return true;}
 refund(h){if(RECIPES[h])this.s.stock[h]=Math.min(CONFIG.stock,this.s.stock[h]+1);}
 restock(h){if(!this.running()||this.s.stock[h]!==0)return false;const n=++this.s.restock[h];this.s.message='补货 '+n+' / '+CONFIG.restockClicks;if(n>=CONFIG.restockClicks){this.s.stock[h]=CONFIG.stock;this.s.restock[h]=0;this.s.message=RECIPES[h].name+'补满了。';this.log('restocked',{herb:h});}return true;}
 weigh(h){if(!this.running()||!RECIPES[h])return false;const s=this.s;if(s.scale?.ingredients.includes(h)||s.scale?.ingredients.length>=4)return this.say('每批最多四味，每味放一次。');if(!s.scale)s.scale={ingredients:[],stage:'weighing',start:this.now()};s.scale.ingredients.push(h);s.scale.stage='weighing';s.scale.start=this.now();s.message='正在称量，还可以加入其他香料。';this.log('weigh',{herb:h});return true;}
 process(method){const s=this.s;if(!this.running()||!['grind','steam'].includes(method)||s.scale?.stage!=='weighed'||s.tools[method])return this.say('先称好材料，并确认器具是空的。');s.tools[method]={ingredients:[...s.scale.ingredients],method,stage:'processing',start:this.now(),progress:0};s.scale=null;s.message=method==='grind'?'自动研磨中，指针到绿区时点击研磨钵。':'点击移动的绿色区域，完成蒸制。';this.log(method);return true;}
 grindPhase(){const t=this.s.tools.grind;return t?Math.max(0,this.time()-t.start)%(CONFIG.grindGreenEnd+1200):0;}
 grindGreen(){const p=this.grindPhase();return p>=CONFIG.durations.grind&&p<=CONFIG.grindGreenEnd;}
 steamTarget(){const t=this.s.tools.steam;if(!t)return .5;const phase=((this.time()-t.start)%CONFIG.steamCycle)/CONFIG.steamCycle;return CONFIG.steamWidth/2+(1-CONFIG.steamWidth)*(1-Math.cos(phase*Math.PI*2))/2;}
 finish(method){const t=this.s.tools[method];t.stage='ready';t.quantity=2;t.progress=100;this.s.message='两份成料做好了，一起拖到同一个香盘。';this.log('processed',{method,ingredients:t.ingredients});return true;}
 grindClick(){if(!this.running()||this.s.tools.grind?.stage!=='processing')return false;if(this.grindGreen())return this.finish('grind');return this.say('还没到绿区，再等一轮也可以。');}
 steamClick(x){if(!this.running()||this.s.tools.steam?.stage!=='processing')return false;if(!Number.isFinite(x)||Math.abs(x-this.steamTarget())>CONFIG.steamWidth/2)return this.say('点在绿色区域内，蒸制才会推进。');const t=this.s.tools.steam;t.progress=Math.min(100,t.progress+CONFIG.steamStep);if(t.progress===100)return this.finish('steam');this.s.message='蒸制 '+t.progress+'% · 继续跟随绿区';return true;}
 tick(){if(!this.running())return;const s=this.s,now=this.now();if(now-s.dayStart>=CONFIG.dayDuration){s.closed=true;s.message='酉时收铺，今日收入 '+s.dayIncome+' 两。';this.log('closed',{day:s.day,income:s.dayIncome});return;}
  for(let i=0;i<3;i++){const c=s.customers[i];if(!c)continue;if(c.state==='waiting'&&this.patience(c)<=0){c.state='left';c.leaves=now+CONFIG.departure;s.lost++;this.log('timeout',{id:c.id});}if(c.state!=='waiting'&&now>=c.leaves)s.customers[i]=null;}
  if(now>=s.nextArrival){const i=s.customers.findIndex(x=>!x);if(i>=0){this.arrive(i);s.nextArrival=now+CONFIG.arrival;}}
  if(s.scale?.stage==='weighing'&&now-s.scale.start>=CONFIG.durations.weigh)s.scale.stage='weighed';
 }
 store(i,method){const t=this.s.tools[method],slot=this.s.slots[i];if(!this.running()||!slot||slot.material||t?.stage!=='ready')return this.say('请选择没有成料的香盘，两份一起存放。');slot.material={ingredients:[...t.ingredients],method,quantity:2};this.s.tools[method]=null;this.s.message='把左侧香囊拖到香盘，再把成料拖进袋中。';this.log('stored',{slot:i,method});return true;}
 placeBag(i,style){const slot=this.s.slots[i];if(!this.running()||!slot||slot.bag||!['red','blue'].includes(style))return false;slot.bag={style,ingredients:[],sealed:false};this.s.message='把香盘上的成料拖进这个香囊。';return true;}
 fill(from,to){const material=this.s.slots[from]?.material,bag=this.s.slots[to]?.bag;if(!this.running()||!material||!bag||bag.sealed)return false;const next=[...bag.ingredients,...material.ingredients];if(next.length>4||new Set(next).size!==next.length)return this.say('香囊最多装四味不同香料，重复的香料先留在盘里。');bag.ingredients=next;if(--material.quantity===0)this.s.slots[from].material=null;this.s.message='香料入袋，点香囊画线绑紧；也可以继续加料。';this.log('filled',{from,to,ingredients:bag.ingredients});return true;}
 openPack(i){const b=this.s.slots[i]?.bag;if(!this.running()||!b||b.sealed||!b.ingredients.length)return this.say('先把处理好的香料拖进香囊。');this.s.packing={slot:i};return true;}
 cancelPack(){this.s.packing=null;}
 tie(points){const s=this.s,b=s.slots[s.packing?.slot]?.bag;if(!this.running()||!b||b.sealed||!b.ingredients.length||!validTie(points))return false;b.sealed=true;s.packing=null;s.message='绑好了，把香囊拖给对应的客人。';this.log('packed',{ingredients:b.ingredients,style:b.style});return true;}
 deliver(from,i){this.tick();const s=this.s,b=s.slots[from]?.bag,c=s.customers[i];if(!this.running()||!b?.sealed||!c||c.state!=='waiting')return false;const correct=b.style===c.style&&same(b.ingredients,c.ingredients),amount=correct?CONFIG.pay.base+CONFIG.pay.perHerb*b.ingredients.length:CONFIG.pay.wrong;s.slots[from].bag=null;s.silver+=amount;s.dayIncome+=amount;s.delivered++;c.state=correct?'served':'disappointed';c.amount=amount;c.leaves=this.now()+CONFIG.departure;s.message=correct?c.name+'：正合心意！收入 '+amount+' 两。':c.name+'：这不是我要的…只付 '+amount+' 两。';this.log('delivered',{id:c.id,correct,amount,ingredients:b.ingredients});return {correct,amount};}
 discard(kind,key){if(!this.running())return false;const s=this.s;if(kind==='scale')s.scale=null;else if(kind==='tool'&&['grind','steam'].includes(key))s.tools[key]=null;else if(['material','bag'].includes(kind)&&s.slots[key])s.slots[key][kind]=null;else return false;s.message='已投入废料桶。';this.log('discarded',{kind,key});return true;}
 ingredients(kind,key){if(kind==='scale')return this.s.scale?.ingredients||[];if(kind==='tool')return this.s.tools[key]?.ingredients||[];return this.s.slots[key]?.[kind]?.ingredients||[];}
}

