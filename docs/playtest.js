import {game} from './app.js?v=v6.0';
import {CONFIG} from './config.js?v=v6.0';
const version='外测 V6.0 · 2026-09-16';
const modal=document.createElement('dialog');modal.id='playtestWelcome';
modal.innerHTML='<h2>花间香铺 · 开门迎客</h2><p>一日三分钟，看订单中的袋型和配料图，为陆续到店的客人制香。</p><ol><li>多味香料拖到秤盘，一起称量。</li><li>研磨到绿区点击完成；蒸制跟随绿区点击。</li><li>两份成料拖到一盘，香囊也拖到盘上。</li><li>拖成料入袋，点袋画线系紧，再拖给客人。</li></ol><p>空篮点五次补货。轻触器具看配料，不要的材料拖到废料桶。</p><button id="beginPlaytest">开始营业</button><small>'+version+'</small>';
const style=document.createElement('style');style.textContent='#playtestWelcome{box-sizing:border-box;width:min(90vw,390px);padding:22px;border:3px double #927044;border-radius:14px;background:#f4e6ca;color:#493621;max-height:90dvh}#playtestWelcome::backdrop{background:#17271dcc;backdrop-filter:blur(3px)}#playtestWelcome h2{font-size:24px}#playtestWelcome p,#playtestWelcome li{font-size:15px;line-height:1.7}#playtestWelcome ol{padding-left:22px}#playtestWelcome button{width:100%;min-height:48px;background:#365c44;color:#fff4d9;border:0;border-radius:8px;font-size:18px}#playtestWelcome small{display:block;text-align:center;margin-top:12px;font-size:11px}#downloadTestLog{min-height:44px;border:1px solid #927044;background:#fff5da;color:#493621;padding:8px;border-radius:6px}';
document.head.append(style);document.body.append(modal);game.pause();modal.showModal();
modal.addEventListener('cancel',e=>e.preventDefault());document.addEventListener('visibilitychange',()=>{if(modal.open)game.pause();});
modal.querySelector('button').onclick=()=>{game.reset();modal.close();};
const menu=document.getElementById('menu'),info=document.createElement('p');info.textContent=version+' · 本次试玩进度保存在页面内，刷新重新开始。';
const download=document.createElement('button');download.id='downloadTestLog';download.textContent='下载测试记录';
download.onclick=()=>{const data={version,gameVersion:CONFIG.version,exportedAt:new Date().toISOString(),viewport:{width:innerWidth,height:innerHeight},day:game.s.day,silver:game.s.silver,delivered:game.s.delivered,lost:game.s.lost,events:game.events};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='huajian-playtest-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
menu.append(info,download);

