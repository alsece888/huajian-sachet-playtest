// Reference-aligned scene composition; gameplay remains in game.js/app.js.
const herbNames=['玫瑰','薰衣草','丁香','艾叶','薄荷','桂花','茉莉','檀香'];
const herbIds=['rose','lavender','clove','mugwort','mint','osmanthus','jasmine','sandalwood'];
const ingredients=document.querySelector('.ingredients');
ingredients.innerHTML=herbIds.map((id,i)=>`<button id="${id}" class="basket herb-${i} ${i===0?'active':''} ${i===0||i===2?'':'preview-material'}" aria-label="${herbNames[i]}${i===0||i===2?'，选择原料':'，配方待开放'}"><span class="herb-art atlas-${i}" aria-hidden="true"></span><span class="herb-label">${herbNames[i]}</span><span class="stock-dots" aria-hidden="true">● ● ● ○ ○</span><b class="selection-mark">✓</b>${i===0||i===2?'':'<span class="locked-note">待开放</span>'}</button>`).join('');
for(const button of document.querySelectorAll('.preview-material'))button.onclick=()=>{document.getElementById('message').textContent='这味香料将在后续配方开放；先用玫瑰或丁香练习。';};
const additions=document.createElement('div');additions.className='scene-additions';additions.innerHTML=`<div class="shelf-label minister">臣 料</div><div class="shelf-label sovereign">君 料</div><div class="sachet-rack"><h2>香 囊</h2><button class="bag-option selected" aria-label="素布香囊，当前袋型"><span class="extra-art atlas-9"></span></button><button class="bag-option unavailable" aria-label="蓝色香囊，待开放"><span class="extra-art atlas-10"></span><small>待开放</small></button><div class="bag-lock" aria-label="更多袋型待开放">♙</div></div><button class="steamer unavailable" aria-label="蒸制工位，待开放"><span class="extra-art atlas-8"></span><small>蒸制 · 待开放</small></button><div class="tray-title">香 盘 台</div>`;
document.querySelector('.game-stage').append(additions);
for(const b of additions.querySelectorAll('button'))b.onclick=()=>{document.getElementById('message').textContent=b.classList.contains('unavailable')?'此内容待后续阶段开放，本次先制作单料香囊。':'已使用当前素布袋型；选一份香粉即可包装。';};
const waste=document.getElementById('discard');waste.innerHTML='<span class="extra-art atlas-11" aria-hidden="true"></span><span class="waste-label">杂料</span>';
const hud=document.querySelector('.hud');hud.querySelector('.shop-sign').innerHTML='初学制香<small>练习模式</small>';
const badge=document.createElement('output');badge.id='resultBadge';badge.className='result-badge';document.querySelector('.game-stage').append(badge);
const practiceTime=document.createElement('div');practiceTime.className='practice-clock';practiceTime.innerHTML='<span>⌛</span> 不限时';hud.insertBefore(practiceTime,hud.querySelector('.served'));
for(const b of document.querySelectorAll('.order-bubble')){const label=b.querySelector('span:not(.prop)');label.className='order-recipe';}

