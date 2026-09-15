import './visual-v3.js?v=v6.0';
import {Game} from './game.js?v=v6.0';
import {RECIPES,CONFIG,HERBS} from './config.js?v=v6.0';
export const game=new Game();
const $=id=>document.getElementById(id),stage=document.querySelector('.game-stage');
const setHTML=(el,html)=>{if(el._html!==html){el.innerHTML=html;el._html=html;}};
const text=(el,value)=>{if(el.textContent!==String(value))el.textContent=value;};
stage.insertAdjacentHTML('afterbegin','<svg width="0" height="0" style="position:absolute;pointer-events:none" aria-hidden="true"><defs><clipPath id="itemCell"><rect width="362" height="362"/></clipPath><clipPath id="portraitCell"><rect width="374" height="467.333333"/></clipPath></defs></svg>');
function item(n,cls=''){return '<svg class="item-art '+cls+'" viewBox="0 0 362 362" aria-hidden="true"><g clip-path="url(#itemCell)"><image href="assets/items-v6.png" width="1448" height="1086" x="'+(-362*(n%4))+'" y="'+(-362*Math.floor(n/4))+'"/></g></svg>';}
function bagArt(style){return '<span class="bag-art extra-art atlas-'+(style==='blue'?10:9)+'" aria-hidden="true"></span>';}
function mixture(list,processed=false){return '<span class="mixture count-'+list.length+'">'+list.map(h=>item(RECIPES[h].art+(processed?4:0))).join('')+'</span>';}
function icons(list){return list.map(h=>'<span class="ingredient-icon" aria-label="'+RECIPES[h].name+'">'+item(RECIPES[h].art)+'</span>').join('');}
const names=list=>list.map(h=>RECIPES[h].name).join('、');
document.querySelector('.timing').remove();
document.querySelector('.packing').innerHTML='<p class="flow-guide">多料同称 → 绿区加工 → 两份入盘<br>拖袋入盘 → 拖料入袋 → 系好交客</p>';
document.querySelector('.shop-sign').innerHTML='<span id="dayLabel">第 1 天</span><small>花间香铺</small>';
document.querySelector('.practice-clock').id='dayClock';
document.querySelector('.served').innerHTML='<span class="silver-icon">◆</span><span id="silver">0</span><small>两</small>';
$('resultBadge').hidden=true;
document.querySelector('.steamer').id='steam';$('steam').classList.remove('unavailable');$('steam').onclick=null;$('steam').setAttribute('aria-label','蒸制工位，拖入称好的香料');
$('steam').innerHTML=item(11,'empty-steamer')+'<small></small>';
$('grind').innerHTML=item(9,'empty-mortar')+'<span id="grindLabel" class="tool-action"></span><span class="live-pestle">'+item(10)+'</span>';
$('discard').innerHTML='<span class="extra-art atlas-11"></span><span class="waste-label">废料桶</span>';$('discard').setAttribute('aria-label','废料桶，拖入不需要的材料或香囊');
for(const b of document.querySelectorAll('.bag-option')){b.onclick=null;b.classList.remove('unavailable');b.querySelector('small')?.remove();b.dataset.style=b.querySelector('.atlas-10')?'blue':'red';b.setAttribute('aria-label',(b.dataset.style==='red'?'红':'蓝')+'香囊，拖到香盘');}
for(const b of document.querySelectorAll('.basket')){
 b.onclick=null;b.classList.toggle('preview-material',!RECIPES[b.id]);
 const label=b.querySelector('.herb-label').textContent;
 b.innerHTML=item(8,'empty-basket')+'<span class="stock-herbs"></span><span class="herb-label">'+label+'</span><span class="stock-dots"></span><span class="restock-note"></span>';
 if(!RECIPES[b.id])b.insertAdjacentHTML('beforeend','<span class="locked-note">待开放</span>');
}
for(let i=0;i<3;i++){
 const c=$('customer'+i);c.classList.remove('selected');c.querySelector('.order-bubble').innerHTML='<span class="order-recipe"></span>';
 c.insertAdjacentHTML('beforeend','<span class="emotion"></span><span class="patience"><i></i></span><span class="income"></span>');
 const old=$('slot'+i),plate=document.createElement('div');plate.id=old.id;plate.className='tray';plate.innerHTML='<button class="plate-material" data-slot="'+i+'" aria-label="香盘成料" hidden></button><button class="plate-bag" data-slot="'+i+'" aria-label="香盘香囊" hidden></button>';old.replaceWith(plate);
}
stage.insertAdjacentHTML('beforeend','<button id="scaleBatch" class="batch-token" hidden data-tip="scale"></button><div id="ingredientTip" hidden></div><dialog id="packDialog"><div class="menu-title"><h2>沿袋口系紧</h2><button id="closePack" aria-label="回到香盘">×</button></div><p id="packHint"></p><div id="bagIngredients"></div><div id="tieSurface" class="filled" aria-label="沿虚线从左向右划过袋口"><span id="tieBag"></span><div class="tie-guide">○ ┄ ┄ ┄ ┄ ○</div><svg viewBox="0 0 300 300"><polyline id="tieLine" fill="none" stroke="#ffe1a0" stroke-width="7" stroke-linecap="round"/></svg></div><p class="tie-caption">划过虚线两端再松手</p></dialog><dialog id="dayEnd"><h2>今日收铺</h2><p id="daySummary"></p><p>明日会整理工作台、补满原料，银子保留。</p><button id="nextDay">开启下一天</button></dialog>');
for(const method of ['grind','steam']){
 stage.insertAdjacentHTML('beforeend','<button id="'+method+'Batch" class="batch-token" hidden data-tip="tool" data-key="'+method+'"></button><div id="'+method+'Contents" class="tool-contents" hidden></div>');
}
stage.insertAdjacentHTML('beforeend','<button id="grindMeter" class="timing-meter" hidden aria-label="研磨计时，指针到绿区点击"><span class="green-zone"></span><i></i></button><button id="steamMeter" class="timing-meter" hidden aria-label="蒸制进度，点击移动绿区"><span class="green-zone"></span><b>0%</b></button>');
$('weigh').dataset.tip='scale';$('grind').dataset.tip='tool';$('grind').dataset.key='grind';$('steam').dataset.tip='tool';$('steam').dataset.key='steam';
$('menu').querySelectorAll('p,.option').forEach(e=>e.remove());$('discardProduct').remove();
const help=document.createElement('p');help.textContent='每天 08:00—18:00，共 3 分钟。顾客陆续到店，请看袋型和配料图。拖香料到秤盘可多料同称。研磨自动开始，5 秒后进入绿区，点击完成；蒸制跟随移动绿区点击到 100%。两份成料拖到一盘；拖香囊到盘，拖成料入袋，点袋画线系紧，再拖给顾客。空篮连续点 5 次补货；不要的材料拖入废料桶。轻触或悬停器具可看配料。';$('menu').prepend(help);
let active=null,tipTimer;
function showTip(el){
 const kind=el?.dataset.tip,key=el?.dataset.key;
 const list=kind?game.ingredients(kind,key):[];
 if(!list.length){$('ingredientTip').hidden=true;return;}
 const r=el.getBoundingClientRect(),tip=$('ingredientTip');setHTML(tip,icons(list));tip.setAttribute('aria-label',names(list));tip.hidden=false;
 const sr=stage.getBoundingClientRect();tip.style.left=Math.max(8,Math.min(sr.width-100,r.left-sr.left+r.width/2-45))+'px';tip.style.top=Math.max(50,r.top-sr.top-42)+'px';
 clearTimeout(tipTimer);tipTimer=setTimeout(()=>tip.hidden=true,1800);
}
document.addEventListener('pointerover',e=>{if(!active)showTip(e.target.closest('[data-tip]'));});
function closePack(){game.cancelPack();$('packDialog').close();}
function openPack(i){if(!game.openPack(i)){render();return;}const b=game.s.slots[i].bag;setHTML($('tieBag'),bagArt(b.style));setHTML($('bagIngredients'),icons(b.ingredients));text($('packHint'),'袋中：'+names(b.ingredients));$('tieLine').setAttribute('points','');$('packDialog').showModal();}
$('closePack').onclick=closePack;$('packDialog').oncancel=e=>{e.preventDefault();closePack();};
$('settings').onclick=()=>{cancelPointer();game.pause();text($('log'),JSON.stringify(game.events,null,2));$('menu').showModal();};
$('closeMenu').onclick=()=>$('menu').close();$('menu').addEventListener('close',()=>{if(!document.hidden)game.resume();});
$('reset').onclick=()=>{cancelPointer();closePack();game.reset();$('menu').close();$('dayEnd').close();render();};
$('nextDay').onclick=()=>{game.nextDay();$('dayEnd').close();render();};$('dayEnd').oncancel=e=>e.preventDefault();
$('grindMeter').onclick=()=>{game.grindClick();render();};
$('steamMeter').onclick=e=>{const r=e.currentTarget.getBoundingClientRect();game.steamClick((e.clientX-r.left)/r.width);render();};
function tiePoint(e){const r=$('tieSurface').getBoundingClientRect();return{x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};}
function cancelPointer(){if(active?.kind==='raw'&&!active.consumed)game.refund(active.key);active?.ghost?.remove();active=null;document.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));}
function makeGhost(html,e){const el=document.createElement('div');el.className='drag-ghost physical-ghost';el.innerHTML=html;document.body.append(el);el.style.left=e.clientX+'px';el.style.top=e.clientY+'px';return el;}
document.addEventListener('pointerdown',e=>{
 if(active||e.button!==0||!game.running())return;
 const el=e.target.closest('button,#tieSurface');if(!el)return;
 if(el.id==='tieSurface'){active={kind:'tie',id:e.pointerId,points:[tiePoint(e)]};}
 else{
  let kind,key,html;
  if(HERBS.includes(el.id)){key=el.id;if(game.s.stock[key]===0){game.restock(key);render();return;}if(!game.pickup(key))return;kind='raw';html=mixture([key]);}
  else if(el.classList.contains('bag-option')){kind='newBag';key=el.dataset.style;html=bagArt(key);}
  else if(el.id==='scaleBatch'){kind='scale';html=el.innerHTML;}
  else if(['grindBatch','steamBatch'].includes(el.id)){kind='tool';key=el.id.replace('Batch','');html=el.innerHTML;}
  else if(el.classList.contains('plate-material')){kind='material';key=+el.dataset.slot;html=mixture(game.s.slots[key].material.ingredients,true);}
  else if(el.classList.contains('plate-bag')){kind='bag';key=+el.dataset.slot;html=bagArt(game.s.slots[key].bag.style);}
  else if(['grind','steam'].includes(el.id)){showTip(el);active={kind:'station',key:el.id,id:e.pointerId,x:e.clientX,y:e.clientY};el.setPointerCapture(e.pointerId);e.preventDefault();return;}
  else return;
  showTip(el);active={id:e.pointerId,kind,key,x:e.clientX,y:e.clientY,moved:false,ghost:makeGhost(html,e)};
 }
 el.setPointerCapture(e.pointerId);e.preventDefault();render();
});
document.addEventListener('pointermove',e=>{
 if(!active||active.id!==e.pointerId)return;e.preventDefault();
 if(active.ghost){active.moved ||= Math.hypot(e.clientX-active.x,e.clientY-active.y)>8;active.ghost.style.left=e.clientX+'px';active.ghost.style.top=e.clientY+'px';document.querySelectorAll('.drop-target').forEach(x=>x.classList.remove('drop-target'));document.elementFromPoint(e.clientX,e.clientY)?.closest('#weigh,#grind,#steam,.tray,.customer,#discard')?.classList.add('drop-target');}
 if(active.kind==='tie'){active.points.push(tiePoint(e));$('tieLine').setAttribute('points',active.points.map(p=>p.x*300+','+p.y*300).join(' '));}
 if(active.kind==='station')active.moved ||= Math.hypot(e.clientX-active.x,e.clientY-active.y)>8;
});
document.addEventListener('pointerup',e=>{
 if(!active||active.id!==e.pointerId)return;
 const a=active,hit=document.elementFromPoint(e.clientX,e.clientY),target=hit?.closest('button,.tray'),plate=hit?.closest('.tray'),slot=plate?+plate.id.slice(4):null;
 if(target?.id==='discard'){
  if(a.kind==='raw'){a.consumed=true;game.say('原料已投入废料桶。');}
  else if(a.kind==='station')game.discard('tool',a.key);
  else game.discard(a.kind,a.key);
 }else if(a.kind==='raw'&&target?.id==='weigh')a.consumed=game.weigh(a.key);
 else if(a.kind==='raw'&&target?.id==='scaleBatch')a.consumed=game.weigh(a.key);
 else if(a.kind==='scale'&&['grind','steam'].includes(target?.id))game.process(target.id);
 else if(a.kind==='tool'&&slot!==null)game.store(slot,a.key);
 else if(a.kind==='newBag'){
  if(slot!==null)game.placeBag(slot,a.key);
  else if(!a.moved){const first=game.s.slots.findIndex(s=>!s.bag);if(first>=0)game.placeBag(first,a.key);else game.say('三个盘都有香囊了，先完成或丢弃一个。');}
 }else if(a.kind==='material'&&slot!==null)game.fill(a.key,slot);
 else if(a.kind==='bag'){
  if(target?.id.startsWith('customer'))game.deliver(a.key,+target.id.slice(8));
  else if(!a.moved)openPack(a.key);
 }else if(a.kind==='station'&&!a.moved){
  if(a.key==='grind')game.grindClick();else game.say('点击蒸笼下方移动的绿色区域。');
 }else if(a.kind==='tie'){a.points.push(tiePoint(e));if(game.tie(a.points))closePack();else{text($('packHint'),'请沿虚线完整划过左右两端。');$('tieLine').setAttribute('points','');}}
 cancelPointer();render();
});
document.addEventListener('pointercancel',()=>{cancelPointer();render();});
window.addEventListener('blur',cancelPointer);
document.addEventListener('visibilitychange',()=>{cancelPointer();if(document.hidden)game.pause();else if(!$('menu').open&&!$('playtestWelcome')?.open)game.resume();});
function render(){
 const s=game.s;text($('message'),s.message);text($('dayLabel'),'第 '+s.day+' 天');text($('dayClock'),game.clock());text($('silver'),s.silver);
 for(const b of document.querySelectorAll('.basket')){
  const h=b.id,n=s.stock[h]??0;
  setHTML(b.querySelector('.stock-herbs'),n?mixture([h]):'');
  b.querySelector('.stock-herbs').style.transform='scale('+(n/5*.55+.45)+')';
  text(b.querySelector('.stock-dots'),RECIPES[h]?'●'.repeat(n)+'○'.repeat(5-n):'');
  text(b.querySelector('.restock-note'),RECIPES[h]&&n===0?'补货 '+s.restock[h]+'/5':'');
  b.setAttribute('aria-label',(RECIPES[h]?.name||b.querySelector('.herb-label').textContent)+(RECIPES[h]?'，剩余'+n+'次'+(n===0?'，连续点击五次补货':'，拖入秤盘'):'，待开放，空篮'));
 }
 for(let i=0;i<3;i++){
  const c=s.customers[i],b=$('customer'+i);b.hidden=!c;if(!c)continue;
  const mood=c.state==='waiting'?game.mood(c):c.state,row=mood==='worried'?1:['angry','left','disappointed'].includes(mood)?2:0;
  if(b.dataset.guest!==String(c.id)){b.dataset.guest=c.id;b.classList.remove('entering');void b.offsetWidth;b.classList.add('entering');}
  b.dataset.mood=mood;b.setAttribute('aria-label',c.name+'，'+(c.style==='red'?'红':'蓝')+'香囊，配料：'+names(c.ingredients));b.querySelector('.portrait').setAttribute('aria-label',c.name+'，'+({calm:'平静',worried:'着急',angry:'生气',served:'满意',disappointed:'不满意',left:'失望'}[mood]));
  setHTML(b.querySelector('.portrait'),'<svg viewBox="0 0 374 467.333333" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><g clip-path="url(#portraitCell)"><image href="assets/customers-emotions-v5.png" width="1122" height="1402" x="'+(-374*c.portrait)+'" y="'+(-1402/3*row)+'"/></g></svg>');
  setHTML(b.querySelector('.order-recipe'),c.state==='waiting'?bagArt(c.style)+'<span class="order-ingredients">'+icons(c.ingredients)+'</span>':c.state==='served'?'正合心意！':c.state==='disappointed'?'做错了…':'不等了…');
  text(b.querySelector('.customer-name'),c.name);text(b.querySelector('.emotion'),{calm:'☺ 慢慢来',worried:'◷ 还要多久',angry:'等太久了',served:'♡ 真香！',disappointed:'不合心意',left:'下次再说'}[mood]);
  b.querySelector('.patience i').style.width=game.patience(c)*100+'%';
  text(b.querySelector('.income'),c.amount?'＋'+c.amount+' 两':'');
 }
 text($('weigh').querySelector('.tool-action'),s.scale?.stage==='weighing'?'称量中…':s.scale?'称好了 · 拖去加工':'拖入香料 · 可混称');
 $('weigh').classList.toggle('weighing',s.scale?.stage==='weighing');
 $('scaleBatch').hidden=!s.scale;if(s.scale){setHTML($('scaleBatch'),mixture(s.scale.ingredients));$('scaleBatch').setAttribute('aria-label',names(s.scale.ingredients)+'，'+(s.scale.stage==='weighed'?'称好了':'称量中'));}
 for(const method of ['grind','steam']){
  const t=s.tools[method],batch=$(method+'Batch'),contents=$(method+'Contents'),meter=$(method+'Meter');
  batch.hidden=t?.stage!=='ready';contents.hidden=t?.stage!=='processing';meter.hidden=t?.stage!=='processing';
  if(t){setHTML(batch,'<span class="two-portions">'+mixture(t.ingredients,true)+mixture(t.ingredients,true)+'</span>');batch.setAttribute('aria-label',names(t.ingredients)+'，两份成料，拖到一个香盘');setHTML(contents,mixture(t.ingredients,method==='grind'?game.grindPhase()>2500:t.progress>=40));}
  $(method).classList.toggle(method==='grind'?'grinding':'steaming',t?.stage==='processing');
 }
 const g=s.tools.grind,t=s.tools.steam;
 $('grind').querySelector('.live-pestle').hidden=g?.stage!=='processing';
 text($('grindLabel'),g?(g.stage==='ready'?'两份成料 · 拖入盘':game.grindGreen()?'现在点击！':'研磨中 · 等绿区'):'拖入称好的香料');
 $('grindMeter').classList.toggle('in-green',!!g&&game.grindGreen());
 $('grindMeter').querySelector('i').style.left=(game.grindPhase()/(CONFIG.grindGreenEnd+1200)*100)+'%';
 $('steamMeter').querySelector('.green-zone').style.left=(game.steamTarget()-CONFIG.steamWidth/2)*100+'%';
 text($('steamMeter').querySelector('b'),(t?.progress||0)+'%');
 text($('steam').querySelector('small'),t?(t.stage==='ready'?'两份成料 · 拖入盘':'跟随绿区点击'):'拖入称好的香料');
 for(let i=0;i<3;i++){
  const slot=s.slots[i],plate=$('slot'+i),m=plate.querySelector('.plate-material'),b=plate.querySelector('.plate-bag');
  m.hidden=!slot.material;b.hidden=!slot.bag;plate.classList.toggle('has-bag',!!slot.bag);plate.classList.toggle('has-material',!!slot.material);
  if(slot.material){setHTML(m,'<span class="two-portions">'+Array.from({length:slot.material.quantity},()=>mixture(slot.material.ingredients,true)).join('')+'</span>');m.dataset.tip='material';m.dataset.key=i;m.setAttribute('aria-label','香盘'+(i+1)+'，'+names(slot.material.ingredients)+'，剩'+slot.material.quantity+'份，拖入香囊或废料桶');}
  if(slot.bag){setHTML(b,bagArt(slot.bag.style)+(slot.bag.sealed?'<span class="bag-status">✓</span>':slot.bag.ingredients.length?'<span class="bag-status">系紧</span>':'<span class="bag-status">装料</span>'));b.dataset.tip='bag';b.dataset.key=i;b.setAttribute('aria-label','香盘'+(i+1)+'，'+(slot.bag.style==='red'?'红':'蓝')+'香囊，'+(slot.bag.ingredients.length?names(slot.bag.ingredients):'空袋')+'，'+(slot.bag.sealed?'已绑好，拖给顾客':'点击系紧'));}
 }
 if(s.closed&&!$('dayEnd').open){cancelPointer();closePack();text($('daySummary'),'第 '+s.day+' 天 · 今日收入 '+s.dayIncome+' 两 · 共存 '+s.silver+' 两');$('dayEnd').showModal();}
}
let lastRender=0;function frame(time){game.tick();if(time-lastRender>60){render();lastRender=time;}requestAnimationFrame(frame);}render();requestAnimationFrame(frame);

