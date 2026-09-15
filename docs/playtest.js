import {game} from './app.js';
import {CONFIG} from './config.js';
const version='外测 V5.1 · 2026-09-15';
const modal=document.createElement('dialog');
modal.id='playtestWelcome';
modal.innerHTML='<h2>花间香铺 · 试玩</h2><p>客人会陆续到店，记得留意他们的耐心。</p><ol><li>拖香料到秤上，再拖去研磨或蒸制。</li><li>长按研磨棒；蒸制会自动完成。</li><li>两份成料拖入同一个空香盘。</li><li>点左侧香囊，选料、划线绑紧，拖给顾客。</li></ol><p>本版开放玫瑰、丁香。建议手机竖屏体验。</p><button id="beginPlaytest">开始试玩</button><small>'+version+'</small>';
const style=document.createElement('style');style.textContent='#playtestWelcome{box-sizing:border-box;width:min(90vw,390px);padding:22px;border:3px double #927044;border-radius:14px;background:#f4e6ca;color:#493621;max-height:90dvh}#playtestWelcome::backdrop{background:#17271dcc;backdrop-filter:blur(3px)}#playtestWelcome h2{font-size:24px}#playtestWelcome p,#playtestWelcome li{font-size:15px;line-height:1.7}#playtestWelcome ol{padding-left:22px}#playtestWelcome button{width:100%;min-height:48px;background:#365c44;color:#fff4d9;border:0;border-radius:8px;font-size:18px}#playtestWelcome small{display:block;text-align:center;margin-top:12px;font-size:11px}#downloadTestLog{min-height:44px;border:1px solid #927044;background:#fff5da;color:#493621;padding:8px;border-radius:6px}';
document.head.append(style);document.body.append(modal);
game.pause();modal.showModal();
const suspend=()=>{if(modal.open)game.pause();};
document.addEventListener('visibilitychange',suspend);
modal.addEventListener('cancel',e=>e.preventDefault());
modal.querySelector('button').onclick=()=>{game.reset();modal.close();};
const menu=document.getElementById('menu');
const info=document.createElement('p');info.textContent=version+' · 试玩进度只保留在本次页面，刷新会重新开始。';
const download=document.createElement('button');download.id='downloadTestLog';download.textContent='下载测试记录';
download.onclick=()=>{
 const data={version,gameVersion:CONFIG.version,exportedAt:new Date().toISOString(),viewport:{width:innerWidth,height:innerHeight},delivered:game.s.delivered,lost:game.s.lost,events:game.events};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='huajian-playtest-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
menu.append(info,download);

