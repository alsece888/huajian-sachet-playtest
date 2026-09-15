import './visual-v3.js';
import {Game} from './game.js';
import {RECIPES,CONFIG} from './config.js';
const game=new Game(),$=id=>document.getElementById(id),stage=document.querySelector('.game-stage');

document.querySelector('.steamer').id='steam';
$('steam').classList.remove('unavailable');$('steam').onclick=null;
$('steam').setAttribute('aria-label','蒸制工位，拖入称量好的香料');
document.querySelector('.timing').remove();
document.querySelector('.packing').innerHTML='<button id="finished" hidden aria-label="拖动成品香囊给顾客"><span class="prop prop-pouch"></span><span id="finishedLabel"></span></button><p class="flow-guide">拖料称量 → 研磨 / 蒸制<br>两份入一盘 → 点击香囊包装</p>';
$('resultBadge').hidden=true;
$('menu').querySelectorAll('p,.option').forEach(e=>e.remove());
$('discardProduct').remove();
const help=document.createElement('p');help.textContent='拖原料到秤盘，称好后拖去研磨或蒸制。长按研磨棒 5 秒（松手暂停）；蒸制 5 秒自动完成，两件器具可以同时工作。客人每 18 秒陆续到店，各有 65 秒耐心，等太久会离开。把两份成料拖进一个空盘，再点击左侧香囊、选料、沿袋口画线绑紧，拖给顾客。';$('menu').insertBefore(help,$('menu').querySelector('.menu-actions'));
stage.insertAdjacentHTML('beforeend','<button id="scaleBatch" class="batch-token" hidden></button><button id="toolBatch" class="batch-token" hidden></button><div class="work-meter" hidden><span></span></div><dialog id="packDialog"><div class="menu-title"><h2>装香 · 系囊</h2><button id="closePack" aria-label="取消包装">×</button></div><p id="packHint">先点选一份处理好的香料</p><div id="packChoices"></div><div id="tieSurface" aria-label="沿香囊袋口从左向右画线绑紧"><span class="prop prop-pouch"></span><div class="tie-guide">○ ┄ ┄ ┄ ┄ ○</div><svg viewBox="0 0 300 300"><polyline id="tieLine" fill="none" stroke="#ffe1a0" stroke-width="7" stroke-linecap="round"/></svg></div><p class="tie-caption">选料后，沿袋口虚线从一端划到另一端</p></dialog>');
document.querySelector('.work-meter').remove();toolBatch.remove();for(const method of ['grind','steam']){
 stage.insertAdjacentHTML('beforeend','<button id="'+method+'Batch" class="batch-token output-'+method+'" hidden></button><div id="'+method+'Meter" class="work-meter" hidden><span></span></div><div id="'+method+'Contents" class="tool-contents" hidden></div>');
}
document.querySelector('.shop-sign').innerHTML='花间香铺<small>开门迎客</small>';
document.querySelector('.practice-clock').id='queueClock';
for(let i=0;i<3;i++){
 const c=$('customer'+i);c.insertAdjacentHTML('beforeend','<span class="emotion"></span><span class="patience"><i></i></span>');
 c.classList.remove('selected');
}
function setText(el,value){if(el.textContent!==String(value))el.textContent=value;}
function setMarkup(el,value){if(el._markup!==value){el.innerHTML=value;el._markup=value;}}
function materialArt(recipe,processed=false,quantity=1){
 const color=recipe==='rose'?'#c14e65':'#76513a';
 let shapes='';
 for(let i=0;i<(processed?25:12);i++){const x=20+(i*19)%65,y=30+(i*13)%43;
 shapes+=processed?'<circle cx="'+x+'" cy="'+y+'" r="'+(3+i%3)+'" fill="'+color+'"/>':'<ellipse cx="'+x+'" cy="'+y+'" rx="'+(recipe==='rose'?9:3)+'" ry="6" fill="'+color+'" stroke="#f0c694" stroke-width=".6" transform="rotate('+(i*33)+' '+x+' '+y+')"/>';
 }
 return '<svg class="material-art" viewBox="0 0 110 100" aria-hidden="true"><ellipse cx="55" cy="76" rx="39" ry="10" fill="#39261440"/>'+shapes+'</svg><small>'+RECIPES[recipe].name+(quantity===2?' ×2':'')+'</small>';
}
const pestle=document.createElement('span');pestle.className='live-pestle';pestle.setAttribute('aria-hidden','true');$('grind').append(pestle);
let active=null;
function openPack(){if(game.openPack()){$('packHint').textContent='先点选一份处理好的香料';renderChoices();$('tieLine').setAttribute('points','');$('packDialog').showModal();}render();}
for(const b of document.querySelectorAll('.bag-option:not(.unavailable)')){b.onclick=openPack;b.setAttribute('aria-label','点击香囊开始包装');}
function renderChoices(){
 $('packChoices').innerHTML=game.s.slots.map((x,i)=>x?'<button data-choice="'+i+'" class="'+(game.s.packing?.slot===i?'chosen':'')+'">'+materialArt(x.recipe,true).replace(/<small>.*<\/small>/,'')+RECIPES[x.recipe].name+' · '+(x.method==='steam'?'蒸制':'研磨')+'<small>香盘'+(i+1)+' · 剩 '+x.quantity+' 份</small></button>':'').join('')||'<p>还没有处理好的材料，先将成料拖入香盘。</p>';
 for(const b of $('packChoices').querySelectorAll('button'))b.onclick=()=>{game.choose(+b.dataset.choice);$('packHint').textContent='香料已装入，沿袋口画线绑紧';$('tieSurface').classList.add('filled');renderChoices();};
}
function closePack(){game.cancelPack();$('packDialog').close();$('tieSurface').classList.remove('filled');}
$('closePack').onclick=closePack;$('packDialog').oncancel=e=>{e.preventDefault();closePack();};
$('settings').onclick=()=>{$('log').textContent=JSON.stringify(game.events,null,2);$('menu').showModal();};
$('closeMenu').onclick=()=>$('menu').close();
$('reset').onclick=()=>{cancelPointer();closePack();game.reset();$('menu').close();render();};
$('discard').onclick=()=>{game.discard();render();};
for(let i=0;i<3;i++){$('slot'+i).onclick=()=>{game.s.selected=i;render();};$('customer'+i).onclick=()=>{game.say('做好香囊后，拖到这位顾客面前交付。');render();};}
function ghost(text,x,y,source,kind){const el=document.createElement('div');el.className='drag-ghost physical-ghost';el.innerHTML=kind==='raw'?materialArt(source.id):source.innerHTML;document.body.append(el);el.style.left=x+'px';el.style.top=y+'px';return el;}
function point(e){const r=$('tieSurface').getBoundingClientRect();return{x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};}
function cancelPointer(){if(active?.kind==='hold')game.hold(false);active?.ghost?.remove();active=null;document.querySelectorAll('.drop-target').forEach(e=>e.classList.remove('drop-target'));}
document.addEventListener('pointerdown',e=>{
 if(active||e.button!==0)return;
 const el=e.target.closest('button,#tieSurface');if(!el)return;
 if(el.id==='tieSurface'){
  if(game.s.packing?.slot==null)return;
  active={id:e.pointerId,kind:'tie',points:[point(e)]};
 }else if(el.id==='grind'&&game.s.tools.grind?.stage==='processing'){
  game.hold(true);active={id:e.pointerId,kind:'hold'};
 }else{
  let kind,label;
  if(['rose','clove'].includes(el.id)){kind='raw';label=RECIPES[el.id].name;}
  else if(el.id==='scaleBatch'){kind='weighed';label=el.textContent;}
  else if(['grindBatch','steamBatch'].includes(el.id)){kind='processed';label=el.textContent;}
  else if(el.id==='finished'){kind='product';label=el.textContent;}
  if(!kind)return;
  active={id:e.pointerId,kind,recipe:el.id,method:el.id==='steamBatch'?'steam':'grind',ghost:ghost(label,e.clientX,e.clientY,el,kind)};
 }
 el.setPointerCapture(e.pointerId);e.preventDefault();
});
document.addEventListener('pointermove',e=>{
 if(!active||active.id!==e.pointerId)return;e.preventDefault();
 if(active.ghost){active.ghost.style.left=e.clientX+'px';active.ghost.style.top=e.clientY+'px';
 document.querySelectorAll('.drop-target').forEach(x=>x.classList.remove('drop-target'));
 document.elementFromPoint(e.clientX,e.clientY)?.closest('#weigh,#grind,#steam,.tray,.customer')?.classList.add('drop-target');
 }
 if(active.kind==='tie'){active.points.push(point(e));$('tieLine').setAttribute('points',active.points.map(p=>(p.x*300)+','+(p.y*300)).join(' '));}
});
document.addEventListener('pointerup',e=>{
 if(!active||active.id!==e.pointerId)return;
 const a=active,target=document.elementFromPoint(e.clientX,e.clientY)?.closest('button');
 if(a.kind==='raw'&&target?.id==='weigh')game.weigh(a.recipe);
 else if(a.kind==='weighed'&&['grind','steam'].includes(target?.id))game.process(target.id);
 else if(a.kind==='processed'&&target?.id.startsWith('slot'))game.store(+target.id.slice(4),a.method);
 else if(a.kind==='product'&&target?.id.startsWith('customer')){if(game.deliver(+target.id.slice(8))){target.classList.add('received');setTimeout(()=>target.classList.remove('received'),1200);}}
 else if(a.kind==='tie'){a.points.push(point(e));if(game.tie(a.points)){closePack();}else{$('packHint').textContent='沿袋口虚线，完整划过左右两端再松手';$('tieLine').setAttribute('points','');}}
 cancelPointer();render();
});
document.addEventListener('pointercancel',cancelPointer);
window.addEventListener('blur',cancelPointer);
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelPointer();game.pause();}else if(!menu.open)game.resume();});
$('grind').onkeydown=e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();game.hold(true);}};
$('grind').onkeyup=e=>{if([' ','Enter'].includes(e.key))game.hold(false);};
$('grind').onblur=()=>game.hold(false);
function render(){
 const s=game.s,g=s.tools.grind,t=s.tools.steam;
 setText($('message'),s.message);setText($('delivered'),s.delivered);
 setText($('queueClock'),'候客 '+s.customers.filter(c=>c?.state==='waiting').length+' / 3');
 for(let i=0;i<3;i++){
  const c=s.customers[i],b=$('customer'+i);b.hidden=!c;if(!c)continue;
  if(b.dataset.guest!==String(c.id)){b.dataset.guest=c.id;b.classList.remove('entering');void b.offsetWidth;b.classList.add('entering');}
  const mood=c.state==='waiting'?game.mood(c):c.state;
  b.dataset.mood=mood;b.setAttribute('aria-label',c.name+'，'+RECIPES[c.recipe].name+'香囊，'+({calm:'平静',worried:'着急',angry:'不耐烦',served:'满意离开',left:'生气离开'}[mood]));
  b.querySelector('.portrait').style.backgroundPositionX=(c.portrait*50)+'%';
  setText(b.querySelector('.customer-name'),c.name);
  setText(b.querySelector('.order-recipe'),c.state==='waiting'?RECIPES[c.recipe].name+'香囊':c.state==='served'?'谢谢掌柜！':'不等了…');
  setText(b.querySelector('.emotion'),{calm:'☺ 慢慢来',worried:'◷ 还要多久',angry:'💢 等太久了',served:'♡ 真香！',left:'💢 下次再说'}[mood]);
  const p=game.patience(c);b.querySelector('.patience i').style.width=(p*100)+'%';
  b.querySelector('.patience').setAttribute('aria-label','耐心剩余 '+Math.ceil(p*65)+' 秒');
 }
 setText($('weigh').querySelector('.tool-action'),s.scale?.stage==='weighing'?'称量中…':s.scale?'称好了 · 拿去加工':'放入香料');
 $('weigh').classList.toggle('weighing',s.scale?.stage==='weighing');
 $('scaleBatch').hidden=!s.scale;
 $('scaleBatch').classList.toggle('unweighed',s.scale?.stage==='weighing');
 if(s.scale){setMarkup($('scaleBatch'),materialArt(s.scale.recipe));$('scaleBatch').setAttribute('aria-label',RECIPES[s.scale.recipe].name+(s.scale.stage==='weighed'?'，已称好，拖去加工':'，称量中'));}
 for(const method of ['grind','steam']){
  const work=s.tools[method],batch=$(method+'Batch'),meter=$(method+'Meter'),contents=$(method+'Contents');
  batch.hidden=work?.stage!=='ready';if(work){setMarkup(batch,materialArt(work.recipe,true,2));batch.setAttribute('aria-label',RECIPES[work.recipe].name+'两份，拖入空盘');}
  meter.hidden=work?.stage!=='processing';meter.querySelector('span').style.width=work?work.elapsed/CONFIG.durations[method]*100+'%':'0%';
  contents.hidden=work?.stage!=='processing';if(work)setMarkup(contents,materialArt(work.recipe,work.elapsed>CONFIG.durations[method]/2));contents.style.setProperty('--progress',work?work.elapsed/CONFIG.durations[method]:0);
 }
 setText($('grindLabel'),g?(g.stage==='ready'?'成料 ×2 · 拖入盘':g.held?'研磨中…':'长按研磨棒'):'放入称好的香料');
 $('grind').classList.toggle('grinding',!!g?.held);pestle.hidden=!g||g.stage!=='processing';
 setText($('steam').querySelector('small'),t?(t.stage==='ready'?'成料 ×2 · 拖入盘':'蒸制中 · 可做别的'):'放入称好的香料');
 $('steam').classList.toggle('steaming',t?.stage==='processing');
 for(let i=0;i<3;i++){
  const x=s.slots[i],b=$('slot'+i);b.classList.toggle('filled',!!x);b.classList.toggle('selected',s.selected===i);
  setText(b.querySelector('span'),x?RECIPES[x.recipe].name+' ×'+x.quantity:'空盘');
  b.querySelector('svg').style.color=x?RECIPES[x.recipe].color:'transparent';
  b.setAttribute('aria-label','香盘'+(i+1)+'，'+(x?RECIPES[x.recipe].name+x.quantity+'份':'空盘'));
 }
 $('finished').hidden=!s.product;document.querySelector('.flow-guide').hidden=!!s.product;
 if(s.product)setText($('finishedLabel'),RECIPES[s.product.recipe].name+' · 递给客人');
}
let lastRender=0;
function frame(time){game.tick();if(time-lastRender>80){render();lastRender=time;}requestAnimationFrame(frame);}render();requestAnimationFrame(frame);

export {game};

