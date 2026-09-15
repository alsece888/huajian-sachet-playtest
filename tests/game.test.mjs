import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,validTie} from '../docs/game.js';
const line=[{x:.1,y:.35},{x:.5,y:.35},{x:.9,y:.35}];
function setup(){let n=0;const g=new Game(()=>n);return{g,advance(ms){n+=ms;g.tick();},ready(method='steam',recipe='rose'){g.weigh(recipe);n+=1000;g.tick();assert.ok(g.process(method));if(method==='grind')g.hold(true);n+=5000;g.tick();},pack(i){g.openPack();g.choose(i);assert.ok(g.tie(line));}};}
test('开局一客，每18秒来一位，最多3人',()=>{const s=setup();assert.equal(s.g.s.customers.filter(Boolean).length,1);s.advance(17999);assert.equal(s.g.s.customers.filter(Boolean).length,1);s.advance(1);assert.equal(s.g.s.customers.filter(Boolean).length,2);s.advance(18000);assert.equal(s.g.s.customers.filter(Boolean).length,3);s.advance(18000);assert.equal(s.g.sequence,3);});
test('各自独立耐心：平静→着急→不耐烦',()=>{const s=setup(),first=s.g.s.customers[0];assert.equal(s.g.mood(first),'calm');s.advance(18000);s.advance(9000);assert.equal(s.g.mood(first),'worried');assert.equal(s.g.mood(s.g.s.customers[1]),'calm');s.advance(23000);assert.equal(s.g.mood(first),'angry');});
test('超时只记一次，离店后新客逐个补位',()=>{const s=setup();s.advance(18000);s.advance(18000);s.advance(29000);assert.equal(s.g.s.customers[0].state,'left');assert.equal(s.g.s.lost,1);s.advance(1799);assert.equal(s.g.s.lost,1);s.advance(1);assert.equal(s.g.s.customers[0].id,3);assert.equal(s.g.s.customers[0].state,'waiting');});
test('页面暂停冻结耐心、来客、加工，恢复无跳时',()=>{const s=setup();s.g.weigh('rose');s.advance(500);s.g.pause();s.advance(90000);assert.equal(s.g.s.scale.stage,'weighing');assert.equal(s.g.patience(s.g.s.customers[0]),1-500/65000);s.g.resume();s.advance(500);assert.equal(s.g.s.scale.stage,'weighed');assert.equal(s.g.sequence,1);});
test('称量不可跳过或重复覆盖',()=>{const s=setup();assert.equal(s.g.process('steam'),false);s.g.weigh('rose');assert.equal(s.g.weigh('clove'),false);s.advance(999);assert.equal(s.g.process('steam'),false);s.advance(1);assert.ok(s.g.process('steam'));});
test('蒸制与研磨独立并行，松手只暂停研磨',()=>{const s=setup();s.g.weigh('rose');s.advance(1000);s.g.process('steam');s.g.weigh('clove');s.advance(1000);s.g.process('grind');s.g.hold(true);s.advance(2000);s.g.hold(false);s.advance(2000);assert.equal(s.g.s.tools.steam.stage,'ready');assert.equal(s.g.s.tools.grind.elapsed,2000);s.g.hold(true);s.advance(3000);assert.equal(s.g.s.tools.grind.stage,'ready');});
test('加工完成留在工位，两份放一个盘，重复拖放无复制',()=>{const s=setup();s.ready();assert.deepEqual(s.g.s.slots,[null,null,null]);assert.ok(s.g.store(0,'steam'));assert.equal(s.g.s.slots[0].quantity,2);assert.equal(s.g.store(1,'steam'),false);});
test('满盘不能覆盖，留在工位等待空盘',()=>{const s=setup();for(let i=0;i<3;i++){s.ready();s.g.store(i,'steam');}s.ready();assert.equal(s.g.store(0,'steam'),false);assert.equal(s.g.s.tools.steam.quantity,2);s.g.discard();assert.ok(s.g.store(0,'steam'));});
test('取消与错误绑线不消耗材料',()=>{const s=setup();s.ready();s.g.store(0,'steam');s.g.openPack();s.g.choose(0);assert.equal(s.g.tie([{x:.1,y:.9},{x:.9,y:.9}]),false);s.g.cancelPack();assert.equal(s.g.s.slots[0].quantity,2);});
test('绑紧一袋消耗一份，重复完成不多扣',()=>{const s=setup();s.ready();s.g.store(0,'steam');s.pack(0);assert.equal(s.g.s.slots[0].quantity,1);assert.equal(s.g.tie(line),false);});
test('送对客人满意离店，成品消失且只计一次',()=>{const s=setup();s.ready();s.g.store(0,'steam');s.pack(0);assert.ok(s.g.deliver(0));assert.equal(s.g.s.customers[0].state,'served');assert.equal(s.g.s.delivered,1);assert.equal(s.g.deliver(0),false);s.advance(1800);assert.equal(s.g.s.customers[0],null);});
test('送错或超时离开的客人不吞成品',()=>{const s=setup();s.ready();s.g.store(0,'steam');s.pack(0);s.advance(12000);assert.equal(s.g.deliver(1),false);s.advance(47000);assert.equal(s.g.deliver(0),false);assert.ok(s.g.s.product);});
test('重新开局清空加工/来客/计数，不保留旧计时',()=>{const s=setup();s.ready();s.advance(65000);s.g.reset();assert.equal(s.g.s.lost,0);assert.equal(s.g.s.customers.filter(Boolean).length,1);assert.deepEqual(s.g.s.tools,{grind:null,steam:null});});
test('绑线需覆盖袋口，支持双向',()=>{assert.ok(validTie(line));assert.ok(validTie([...line].reverse()));assert.equal(validTie([{x:.4,y:.35},{x:.5,y:.35},{x:.6,y:.35}]),false);});


