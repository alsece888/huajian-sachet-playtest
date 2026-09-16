import {
 _decorator,Component,Node,Sprite,SpriteFrame,Texture2D,ImageAsset,resources,
 UITransform,Label,Graphics,Color,Rect,Size,Vec2,Vec3,Layers,
 input,Input,EventTouch,EventMouse,EventKeyboard,KeyCode,
 view,ResolutionPolicy,builtinResMgr,game as engineGame,Game as EngineGame
} from 'cc';
import {Game} from './game';
import {CONFIG,RECIPES,HERBS} from './config';
const {ccclass}=_decorator;
type Box={x:number,y:number,w:number,h:number};
type Target=Box&{id:string,kind:string,key?:any};
type Drag={id:string,target:Target,start:Vec2,last:Vec2,moved:boolean,consumed?:boolean,points?:{x:number,y:number}[]};
type Meter={root:Node,fill:Node,marker?:Node};
const W=1080,H=1920;
const box=(x:number,y:number,w:number,h:number):Box=>({x:x*W/100,y:y*H/100,w:w*W/100,h:h*H/100});
const inside=(p:Vec2,r:Box)=>p.x>=r.x&&p.y>=r.y&&p.x<=r.x+r.w&&p.y<=r.y+r.h;
const INK='#493920',PAPER='#f5e6c7',GREEN='#345443',GOLD='#b99a61';
const AREAS={
 scale:box(19,55.5,32,18),grind:box(50,58,26,16),steam:box(76,56,23,18),
 scaleBatch:box(24,58,22,6),grindBatch:box(53,62,21,9),steamBatch:box(78,58,20,9),
 grindMeter:box(51,74,23,3.1),steamMeter:box(76,74,22,3.1),
 waste:box(85,77,14,11),rackRed:box(2,58,15,9),rackBlue:box(2,68,15,9),
 menu:box(90,1.5,9,5),tie:{x:200,y:690,w:680,h:680}
};
@ccclass('ShopController')
export class ShopController extends Component{
 private model:Game;
 private stage:Node;
 private fixed:Node; private dynamic:Node; private effects:Node; private overlay:Node;
 private textures:Record<string,Texture2D>={}; private frames=new Map<string,SpriteFrame>();
 private labels:Record<string,Label>={}; private groups:Record<string,Node>={}; private signatures:Record<string,string>={};
 private targets:Target[]=[]; private active:Drag|null=null; private ghost:Node|null=null;
 private modal:'welcome'|'menu'|'tie'|'end'|null=null; private ready=false; private dirty=true;
 private timeMs=0; private redraw=0; private tipUntil=0; private toolPhase=''; private dayShown='';
 private clockShown=''; private lastPatience=''; private moneyShown=-1;
 private pestle:Node; private grindTrack:Meter; private steamTrack:Meter; private tieLine:Graphics;
 private patienceBars:Meter[]=[]; private solidFrame:SpriteFrame; private tipKey='';
 private loading:Label;
 onLoad(){
  view.setDesignResolutionSize(W,H,ResolutionPolicy.SHOW_ALL);
  this.stage=this.create('Shop',this.node,{x:0,y:0,w:W,h:H},true);
  this.fixed=this.create('Scenery',this.stage);this.dynamic=this.create('Workstations',this.stage);
  this.effects=this.create('Feedback',this.stage);this.overlay=this.create('Screens',this.stage);
  this.loading=this.label(this.overlay,'Loading','正在布置香铺…',{x:120,y:850,w:840,h:160},46,PAPER);
  this.model=new Game(()=>this.timeMs);this.model.onChange=()=>this.dirty=true;this.model.pause();
  this.loadArt().then(()=>{if(!this.isValid)return;this.clear(this.overlay);this.buildScene();this.ready=true;this.render();this.showModal('welcome');})
   .catch(error=>{console.error('香铺素材加载失败',error);this.loading.string='素材加载失败，请刷新重试';});
  input.on(Input.EventType.TOUCH_START,this.touchStart,this);input.on(Input.EventType.TOUCH_MOVE,this.touchMove,this);
  input.on(Input.EventType.TOUCH_END,this.touchEnd,this);input.on(Input.EventType.TOUCH_CANCEL,this.touchCancel,this);
  input.on(Input.EventType.MOUSE_DOWN,this.mouseDown,this);input.on(Input.EventType.MOUSE_MOVE,this.mouseMove,this);input.on(Input.EventType.MOUSE_UP,this.mouseUp,this);
  input.on(Input.EventType.KEY_DOWN,this.keyDown,this);
  engineGame.on(EngineGame.EVENT_HIDE,this.hide,this);engineGame.on(EngineGame.EVENT_SHOW,this.show,this);
 }
 onDestroy(){
  input.off(Input.EventType.TOUCH_START,this.touchStart,this);input.off(Input.EventType.TOUCH_MOVE,this.touchMove,this);
  input.off(Input.EventType.TOUCH_END,this.touchEnd,this);input.off(Input.EventType.TOUCH_CANCEL,this.touchCancel,this);
  input.off(Input.EventType.MOUSE_DOWN,this.mouseDown,this);input.off(Input.EventType.MOUSE_MOVE,this.mouseMove,this);input.off(Input.EventType.MOUSE_UP,this.mouseUp,this);
  input.off(Input.EventType.KEY_DOWN,this.keyDown,this);engineGame.off(EngineGame.EVENT_HIDE,this.hide,this);engineGame.off(EngineGame.EVENT_SHOW,this.show,this);
  for(const f of this.frames.values())f.destroy();for(const t of Object.values(this.textures))t.destroy();this.solidFrame?.destroy();
 }
 private create(name:string,parent:Node,r?:Box,center=false){
  const n=new Node(name);n.layer=Layers.Enum.UI_2D;parent.addChild(n);
  n.addComponent(UITransform).setContentSize(r?.w||W,r?.h||H);
  if(r)n.setPosition(center?0:r.x+r.w/2-W/2,center?0:H/2-r.y-r.h/2);
  return n;
 }
 private clear(n:Node){for(const c of [...n.children]){c.removeFromParent();c.destroy();}}
 private async loadArt(){await Promise.all(['scene-v3','atlas-v3','props-v2','customers-emotions-v5','items-v6'].map(name=>new Promise<void>((resolve,reject)=>{
  resources.load('art/'+name,ImageAsset,(err,img)=>{if(err){reject(err);return;}const t=new Texture2D();t.image=img;this.textures[name]=t;resolve();});
 })));}
 private frame(sheet:string,col=0,row=0,cols=1,rows=1){
  const key=[sheet,col,row,cols,rows].join(':');if(this.frames.has(key))return this.frames.get(key);
  const t=this.textures[sheet],x=Math.round(t.width*col/cols),y=Math.round(t.height*row/rows);
  const w=Math.round(t.width*(col+1)/cols)-x,h=Math.round(t.height*(row+1)/rows)-y;
  const f=new SpriteFrame();f.texture=t;f.rect=new Rect(x,y,w,h);f.originalSize=new Size(w,h);f.offset=new Vec2();f.packable=false;
  this.frames.set(key,f);return f;
 }
 private sprite(parent:Node,name:string,sheet:string,r:Box,col=0,row=0,cols=1,rows=1,fit=true){
  const f=this.frame(sheet,col,row,cols,rows);let area={...r};
  if(fit){const s=Math.min(r.w/f.rect.width,r.h/f.rect.height);area={x:r.x+(r.w-f.rect.width*s)/2,y:r.y+(r.h-f.rect.height*s)/2,w:f.rect.width*s,h:f.rect.height*s};}
  const n=this.create(name,parent,area);const s=n.addComponent(Sprite);s.sizeMode=Sprite.SizeMode.CUSTOM;s.spriteFrame=f;n.getComponent(UITransform).setContentSize(area.w,area.h);
  return n;
 }
 private item(parent:Node,n:number,r:Box){return this.sprite(parent,'Ingredient-'+n,'items-v6',r,n%4,Math.floor(n/4),4,3);}
 private bag(parent:Node,style:string,r:Box){return this.sprite(parent,'Bag-'+style,'atlas-v3',r,style==='blue'?2:1,2,4,3);}
 private mixture(parent:Node,herbs:string[],r:Box,processed=false,portions=1){
  for(let q=0;q<portions;q++){const area={x:r.x+q*r.w*.35,y:r.y+q*r.h*.12,w:r.w/(portions===2?1.5:1),h:r.h};
   herbs.forEach((h,i)=>{const count=herbs.length,cols=count>2?2:count,rows=count>2?2:1;
    this.item(parent,RECIPES[h].art+(processed?4:0),{x:area.x+i%cols*area.w/cols,y:area.y+Math.floor(i/cols)*area.h/rows,w:area.w/cols,h:area.h/rows});
   });
  }
 }
 private label(parent:Node,name:string,value:string,r:Box,size=30,color=INK){
  const n=this.create(name,parent,r),l=n.addComponent(Label);l.string=value;l.fontFamily='KaiTi';l.fontSize=size;l.lineHeight=size*1.3;
  l.color=new Color(color);l.horizontalAlign=Label.HorizontalAlign.CENTER;l.verticalAlign=Label.VerticalAlign.CENTER;
  l.overflow=Label.Overflow.SHRINK;l.enableWrapText=true;return l;
 }
 // Shared solid texture: moving/filling a meter updates its transform, not vector geometry.
 private solid(parent:Node,name:string,r:Box,color:string){
  if(!this.solidFrame){this.solidFrame=new SpriteFrame();this.solidFrame.texture=builtinResMgr.get<Texture2D>('white-texture');this.solidFrame.packable=false;}
  const n=this.create(name,parent,r),s=n.addComponent(Sprite);s.sizeMode=Sprite.SizeMode.CUSTOM;s.spriteFrame=this.solidFrame;s.color=new Color(color);
  n.getComponent(UITransform).setContentSize(r.w,r.h);n.getComponent(UITransform).setAnchorPoint(0,0);
  n.setPosition(r.x-W/2,H/2-r.y-r.h);return n;
 }
 private meter(name:string,r:Box,marker=false):Meter{
  const root=this.create(name,this.effects);this.solid(root,'Track',r,'#453d2d');
  const fill=this.solid(root,'Fill',r,'#8dc854');
  const pointer=marker?this.solid(root,'Marker',{...r,w:6},'#fff6d8'):undefined;
  root.active=false;return{root,fill,marker:pointer};
 }
 private panel(parent:Node,name:string,r:Box,fill=PAPER,border=GOLD,radius=14){
  const n=this.create(name,parent,r),g=n.addComponent(Graphics);g.fillColor=new Color(fill);g.strokeColor=new Color(border);g.lineWidth=3;
  g.roundRect(-r.w/2,-r.h/2,r.w,r.h,radius);g.fill();g.stroke();return n;
 }
 private target(id:string,kind:string,r:Box,key?:any){this.targets.push({...r,id,kind,key});}
 private group(key:string,parent=this.dynamic){return this.groups[key] ||= this.create(key,parent);}
 private changed(key:string,signature:string,draw:(n:Node)=>void){if(this.signatures[key]===signature)return;this.signatures[key]=signature;const n=this.group(key);this.clear(n);draw(n);}
 private setLabel(id:string,value:string){const l=this.labels[id];if(l&&l.string!==value)l.string=value;}
 private buildScene(){
  this.sprite(this.fixed,'Garden shop','scene-v3',{x:0,y:0,w:W,h:H},0,0,1,1,false);
  this.panel(this.fixed,'Day sign',box(11,1.7,23,4.8));this.labels.day=this.label(this.fixed,'Day','第 1 天',box(12,1.8,21,4.4),48);
  this.panel(this.fixed,'Clock sign',box(35,1.7,23,4.8),GREEN);this.labels.clock=this.label(this.fixed,'Clock','08:00',box(36,1.8,21,4.4),44,PAPER);
  this.panel(this.fixed,'Silver sign',box(59,1.7,29,4.8),GREEN);this.labels.silver=this.label(this.fixed,'Silver','银 0 两',box(60,1.8,27,4.4),40,PAPER);
  this.panel(this.fixed,'Menu',AREAS.menu,GREEN,GOLD,40);this.label(this.fixed,'Menu glyph','☰',AREAS.menu,48,PAPER);this.target('menu','menu',AREAS.menu);
  this.label(this.fixed,'Minister title','臣 料',box(8,32.6,56,2.8),44);
  this.label(this.fixed,'Sovereign title','君 料',box(70,32.6,24,2.8),44);
  const all=['rose','lavender','clove','mugwort','mint','osmanthus','jasmine','sandalwood'];
  const names=['玫瑰','薰衣草','丁香','艾叶','薄荷','桂花','茉莉','檀香'],xs=[6,26.8,47.5,72.5];
  all.forEach((h,i)=>{const r=box(xs[i%4],35.8+Math.floor(i/4)*8.2,i%4===3?22:19,8.1);
   this.target(h,'raw',r,h);this.label(this.fixed,'Herb label '+h,names[i],{x:r.x,y:r.y+r.h*.65,w:r.w,h:r.h*.22},31);
   if(!RECIPES[h])this.label(this.fixed,'Locked '+h,'待开放',{x:r.x+10,y:r.y+12,w:r.w-20,h:40},24,'#7b715c');
  });
  this.sprite(this.fixed,'Brass scale','props-v2',AREAS.scale,2,0,3,2);
  this.item(this.fixed,9,AREAS.grind);this.item(this.fixed,11,AREAS.steam);
  this.target('scale','scale',AREAS.scale);this.target('grind','station',AREAS.grind,'grind');this.target('steam','station',AREAS.steam,'steam');
  this.pestle=this.item(this.effects,10,box(55,59,18,10));this.pestle.active=false;
  this.label(this.fixed,'Bag title','香 囊',box(2,54.5,15,3),42);
  this.bag(this.fixed,'red',AREAS.rackRed);this.bag(this.fixed,'blue',AREAS.rackBlue);
  this.target('red','newBag',AREAS.rackRed,'red');this.target('blue','newBag',AREAS.rackBlue,'blue');
  this.label(this.fixed,'Locked bag','待开放',box(2,79,15,4),28,'#897c5e');
  this.label(this.fixed,'Trays title','香 盘 台',box(24,76.5,53,3),42);
  for(let i=0;i<3;i++){const r=this.plate(i);this.sprite(this.fixed,'Gold plate '+i,'props-v2',r,2,1,3,2);this.target('plate'+i,'plate',r,i);}
  this.sprite(this.fixed,'Waste barrel','atlas-v3',AREAS.waste,3,2,4,3);
  this.panel(this.fixed,'Waste label',box(89,79.4,5,6.2),PAPER,PAPER,3);this.label(this.fixed,'Waste','废\n料\n桶',box(89,79.4,5,6.2),28);this.target('waste','waste',AREAS.waste);
  for(const m of ['scale','grind','steam']){
   const r=m==='scale'?box(20,72.2,30,2.4):m==='grind'?box(51,72.2,24,2.4):box(76,72.2,23,2.4);
   this.panel(this.fixed,m+' caption',r,PAPER,GOLD,5);this.labels[m]=this.label(this.fixed,m+' instruction','拖入香料',r,25);
  }
  this.grindTrack=this.meter('Grinding timing',AREAS.grindMeter,true);
  this.steamTrack=this.meter('Steam timing',AREAS.steamMeter);
  for(let i=0;i<3;i++){const r=this.guest(i);this.patienceBars.push(this.meter('Patience '+i,{x:r.x+r.w*.06,y:r.y+r.h*.925-13,w:r.w*.88,h:13}));}
  this.target('grindMeter','grindMeter',AREAS.grindMeter);this.target('steamMeter','steamMeter',AREAS.steamMeter);
  this.panel(this.fixed,'Message',box(19,88.1,64,4.3));this.labels.message=this.label(this.fixed,'Message text','',box(20,88.3,62,3.9),28);
  this.panel(this.fixed,'Flow',box(19,93,64,5),GREEN,GOLD,8);
  this.label(this.fixed,'Flow text','多料同称 → 绿区加工 → 两份入盘\n拖袋入盘 → 拖料入袋 → 系紧交客',box(20,93,62,5),27,PAPER);
 }
 private plate(i:number):Box{return box(21+i*21.2,80,20,8);}
 private plateMaterial(i:number):Box{const r=this.plate(i),bag=this.model.s.slots[i].bag;return {x:r.x,y:r.y,w:r.w*(bag ? .46 : 1),h:r.h*.78};}
 private plateBag(i:number):Box{const r=this.plate(i),m=this.model.s.slots[i].material;return {x:r.x+r.w*(m ? .45 : .12),y:r.y-r.h*.3,w:r.w*(m ? .65 : .78),h:r.h*1.1};}
 private guest(i:number):Box{return box(8+i*28,8,26,23.2);}
 private render(){
  if(!this.ready)return;this.dirty=false;const s=this.model.s;
  this.setLabel('day','第 '+s.day+' 天');this.setLabel('silver','银 '+s.silver+' 两');this.setLabel('message',s.message);
  for(const h of HERBS){const r=this.targets.find(t=>t.id===h),n=s.stock[h],clicks=s.restock[h];
   this.changed('stock-'+h,n+':'+clicks,parent=>{
    if(n){const factor=.45+.55*n/5;this.item(parent,RECIPES[h].art,{x:r.x+r.w*(1-factor)/2,y:r.y-6,w:r.w*factor,h:r.h*.64});}
    this.label(parent,'Stock count','●'.repeat(n)+'○'.repeat(5-n),{x:r.x,y:r.y+r.h*.86,w:r.w,h:24},19,'#827257');
    if(!n){this.panel(parent,'Refill',{x:r.x+4,y:r.y+15,w:r.w-8,h:60},GREEN);this.label(parent,'Refill text','补货 '+clicks+'/5',{x:r.x+4,y:r.y+15,w:r.w-8,h:60},28,PAPER);}
   });
  }
  for(let i=0;i<3;i++){
   const c=s.customers[i],m=c?.state==='waiting'?this.model.mood(c):c?.state;
   this.changed('guest-'+i,c?[c.id,c.state,m,c.amount].join(':'):'empty',parent=>{
    if(!c)return;const r=this.guest(i),row=m==='worried'?1:['angry','left','disappointed'].includes(m)?2:0;
    this.sprite(parent,'Customer portrait','customers-emotions-v5',{x:r.x-12,y:r.y+r.h*.33,w:r.w+24,h:r.h*.68},c.portrait,row,3,3);
    this.panel(parent,'Order',{x:r.x,y:r.y,w:r.w,h:r.h*.37},'#fff8e8',GOLD,22);
    if(c.state==='waiting'){
     this.bag(parent,c.style,{x:r.x+10,y:r.y+7,w:r.w*.63,h:r.h*.32});
     c.ingredients.forEach((h,j)=>this.item(parent,RECIPES[h].art,{x:r.x+r.w*.68,y:r.y+8+j*(r.h*.34/c.ingredients.length),w:r.w*.28,h:r.h*.34/c.ingredients.length}));
    }else this.label(parent,'Response',c.state==='served'?'正合心意！':c.state==='disappointed'?'做错了…':'不等了…',{x:r.x+4,y:r.y,w:r.w-8,h:r.h*.32},32);
    const moodText={calm:'慢慢来',worried:'还要多久',angry:'等太久了',served:'真香！',left:'下次再说',disappointed:'不合心意'}[m];
    this.panel(parent,'Mood',{x:r.x,y:r.y+r.h*.38,w:r.w,h:34},['angry','disappointed'].includes(m)?'#edbc99':PAPER,GOLD,14);
    this.label(parent,'Mood text',moodText,{x:r.x,y:r.y+r.h*.38,w:r.w,h:34},24);
    this.label(parent,'Name',c.name,{x:r.x,y:r.y+r.h*.95,w:r.w,h:30},24);
    if(c.amount)this.label(parent,'Income','＋'+c.amount+' 两',{x:r.x,y:r.y+r.h*.17,w:r.w,h:65},48,'#b08224');
   });
  }
  this.changed('scale',JSON.stringify(s.scale),parent=>{if(s.scale)this.mixture(parent,s.scale.ingredients,AREAS.scaleBatch);});
  this.setLabel('scale',s.scale?.stage==='weighing'?'称量中…':s.scale?'称好了 · 拖去加工':'多味香料可同称');
  for(const m of ['grind','steam']){
   const t=s.tools[m];this.changed('tool-'+m,JSON.stringify(t),parent=>{
    if(!t)return;const r=m==='grind'?AREAS.grindBatch:AREAS.steamBatch;
    this.mixture(parent,t.ingredients,r,t.stage==='ready'||m==='steam'&&t.progress>=40,t.stage==='ready'?2:1);
   });
   this.setLabel(m,t?.stage==='ready'?'两份成料 · 拖入盘':t?'':'拖入称好的香料');
  }
  for(let i=0;i<3;i++){const slot=s.slots[i];this.changed('plate-'+i,JSON.stringify(slot),parent=>{
   if(slot.material)this.mixture(parent,slot.material.ingredients,this.plateMaterial(i),true,slot.material.quantity);
   if(slot.bag){const r=this.plateBag(i);this.bag(parent,slot.bag.style,r);
    this.panel(parent,'Bag status',{x:r.x+8,y:r.y+r.h*.85,w:r.w-16,h:28},PAPER,GOLD,5);
    this.label(parent,'Bag status text',slot.bag.sealed?'已系紧':slot.bag.ingredients.length?'点袋系紧':'拖料入袋',{x:r.x+8,y:r.y+r.h*.85,w:r.w-16,h:28},23);
   }
  });}
 }
 private track(m:Meter,r:Box,greenStart:number,greenWidth:number,marker?:number){
  m.root.active=true;m.fill.setScale(greenWidth,1,1);m.fill.setPosition(r.x-W/2+r.w*greenStart,H/2-r.y-r.h);
  if(marker!==undefined)m.marker.setPosition(r.x-W/2+r.w*marker-3,H/2-r.y-r.h);
 }
 update(dt:number){
  this.timeMs+=dt*1000;if(!this.ready)return;this.model.tick();
  if(this.model.s.closed&&this.modal!=='end'){this.cancelDrag();this.showModal('end');}
  const clock=this.model.clock();if(clock!==this.clockShown){this.clockShown=clock;this.setLabel('clock',clock);}
  this.redraw+=dt;if(this.redraw<1/30)return;this.redraw%=1/30;
  const s=this.model.s,g=s.tools.grind,t=s.tools.steam;
  const moodKey=s.customers.map(c=>c?.state==='waiting'?this.model.mood(c):c?.state).join();
  if(moodKey!==this.lastPatience){this.lastPatience=moodKey;this.dirty=true;}
  if(this.dirty)this.render();
  if(!this.model.running())return;
  this.pestle.active=g?.stage==='processing';
  if(this.pestle.active)this.pestle.angle=Math.sin(this.timeMs/170)*9;
  if(g?.stage==='processing'){
   const total=CONFIG.grindGreenEnd+1200;this.track(this.grindTrack,AREAS.grindMeter,CONFIG.durations.grind/total,(CONFIG.grindGreenEnd-CONFIG.durations.grind)/total,this.model.grindPhase()/total);
   this.setLabel('grind',this.model.grindGreen()?'现在点击研磨钵！':'研磨中 · 等待绿区');
  }else this.grindTrack.root.active=false;
  if(t?.stage==='processing'){this.track(this.steamTrack,AREAS.steamMeter,this.model.steamTarget()-CONFIG.steamWidth/2,CONFIG.steamWidth);this.setLabel('steam','跟随绿区 · '+t.progress+'%');}else this.steamTrack.root.active=false;
  this.patienceBars.forEach((bar,i)=>{const c=s.customers[i];bar.root.active=!!c;if(!c)return;const p=this.model.patience(c);
   bar.fill.setScale(Math.max(.001,p),1,1);const color=p>.6?'#9ac77b':p>.25?'#dfb356':'#d46551';
   const key='patience-color-'+i;if(this.signatures[key]!==color){this.signatures[key]=color;bar.fill.getComponent(Sprite).color=new Color(color);}
  });
  if(this.timeMs>this.tipUntil&&this.groups.tip)this.groups.tip.active=false;
 }
 private position(e:EventTouch|EventMouse){const p=e.getUILocation(),q=this.stage.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(p.x,p.y));return new Vec2(q.x+W/2,H/2-q.y);}
 private touchStart(e:EventTouch){this.down(this.position(e),'t'+e.getID());}
 private touchMove(e:EventTouch){this.move(this.position(e),'t'+e.getID());}
 private touchEnd(e:EventTouch){this.up(this.position(e),'t'+e.getID());}
 private touchCancel(){this.cancelDrag();}
 private mouseDown(e:EventMouse){if(e.getButton()===EventMouse.BUTTON_LEFT)this.down(this.position(e),'mouse');}
 private mouseMove(e:EventMouse){const p=this.position(e);if(this.active)this.move(p,'mouse');else if(!this.modal)this.inspect(this.hit(p));}
 private mouseUp(e:EventMouse){if(e.getButton()===EventMouse.BUTTON_LEFT)this.up(this.position(e),'mouse');}
 private hide(){this.cancelDrag();this.model.pause();}
 private show(){if(this.modal!=='welcome'&&this.modal!=='menu')this.model.resume();}
 private keyDown(e:EventKeyboard){
  if(e.keyCode===KeyCode.ESCAPE){if(this.modal==='tie')this.closeModal();else if(this.modal==='menu')this.closeModal();else if(!this.modal)this.showModal('menu');}
  if(e.keyCode===KeyCode.ENTER&&this.modal==='welcome')this.startPlay();
 }
 private hit(p:Vec2):Target|null{
  if(this.modal){if(this.modal==='tie'&&inside(p,AREAS.tie))return {...AREAS.tie,id:'tie',kind:'tie'};
   return [...this.targets].reverse().find(t=>t.kind==='modal'&&inside(p,t))||null;
  }
  for(let i=2;i>=0;i--){const s=this.model.s.slots[i];if(s.bag&&inside(p,this.plateBag(i)))return {...this.plateBag(i),id:'bag'+i,kind:'bag',key:i};
   if(s.material&&inside(p,this.plateMaterial(i)))return {...this.plateMaterial(i),id:'material'+i,kind:'material',key:i};
  }
  for(let i=0;i<3;i++)if(this.model.s.customers[i]&&inside(p,this.guest(i)))return {...this.guest(i),id:'guest'+i,kind:'customer',key:i};
  const t=[...this.targets].reverse().find(t=>t.kind!=='modal'&&inside(p,t));
  if(!t)return null;if(t.kind.endsWith('Meter')&&this.model.s.tools[t.kind==='grindMeter'?'grind':'steam']?.stage!=='processing')return null;
  return t;
 }
 private down(p:Vec2,id:string){
  if(!this.ready||this.active)return;const target=this.hit(p);if(!target)return;
  if(target.kind==='menu'){this.showModal('menu');return;}
  if(target.kind==='raw'){
   if(!RECIPES[target.key]){this.model.say('这味香料尚未开放。');this.dirty=true;return;}
   if(this.model.s.stock[target.key]===0){this.model.restock(target.key);this.dirty=true;return;}
   if(!this.model.pickup(target.key))return;
  }
  if(target.kind==='scale'&&!this.model.s.scale)return;
  this.active={id,target,start:p.clone(),last:p.clone(),moved:false};
  if(target.kind==='tie'){this.active.points=[this.tiePoint(p)];return;}
  this.inspect(target);
  if(['raw','newBag','scale','material','bag','station'].includes(target.kind))this.makeGhost(target,p);
  this.dirty=true;
 }
 private makeGhost(t:Target,p:Vec2){
  this.ghost=this.create('Dragged item',this.effects);const r={x:W/2-100,y:H/2-100,w:200,h:200};
  if(t.kind==='raw')this.mixture(this.ghost,[t.key],r);
  if(t.kind==='newBag')this.bag(this.ghost,t.key,r);
  if(t.kind==='bag')this.bag(this.ghost,this.model.s.slots[t.key].bag.style,r);
  if(t.kind==='scale')this.mixture(this.ghost,this.model.s.scale.ingredients,r);
  if(t.kind==='material')this.mixture(this.ghost,this.model.s.slots[t.key].material.ingredients,r,true);
  if(t.kind==='station'&&this.model.s.tools[t.key])this.mixture(this.ghost,this.model.s.tools[t.key].ingredients,r,this.model.s.tools[t.key].stage==='ready');
  this.ghost.setPosition(p.x-W/2,H/2-p.y+55);this.ghost.active=t.kind!=='station';
 }
 private move(p:Vec2,id:string){
  const a=this.active;if(!a||a.id!==id)return;a.last=p.clone();a.moved ||= Vec2.distance(a.start,p)>14;
  if(this.ghost){this.ghost.setPosition(p.x-W/2,H/2-p.y+55);this.ghost.active=true;}
  if(a.target.kind==='tie'){a.points.push(this.tiePoint(p));this.drawTie(a.points);}
 }
 private tiePoint(p:Vec2){return{x:(p.x-AREAS.tie.x)/AREAS.tie.w,y:(p.y-AREAS.tie.y)/AREAS.tie.h};}
 private drawTie(points:{x:number,y:number}[]){
  this.tieLine.clear();this.tieLine.strokeColor=new Color('#fff0a8');this.tieLine.lineWidth=10;
  points.forEach((p,i)=>{const x=AREAS.tie.x+p.x*AREAS.tie.w-W/2,y=H/2-AREAS.tie.y-p.y*AREAS.tie.h;if(i===0)this.tieLine.moveTo(x,y);else this.tieLine.lineTo(x,y);});this.tieLine.stroke();
 }
 private up(p:Vec2,id:string){
  const a=this.active;if(!a||a.id!==id)return;const source=a.target,target=this.hit(p);
  const plate=[0,1,2].find(i=>inside(p,this.plate(i))||this.model.s.slots[i].bag&&inside(p,this.plateBag(i)));
  if(source.kind==='modal'){if(target?.id===source.id)this.modalAction(source.id);}
  else if(source.kind==='tie'){a.points.push(this.tiePoint(p));if(this.model.tie(a.points))this.closeModal();else this.setLabel('tieHint','请沿袋口虚线划过左右两端。');}
  else if(target?.kind==='waste'){
   if(source.kind==='raw'){a.consumed=true;this.model.say('原料已投入废料桶。');}
   else this.model.discard(source.kind==='station'?'tool':source.kind,source.key);
  }else if(source.kind==='raw'&&inside(p,AREAS.scale))a.consumed=this.model.weigh(source.key);
  else if(source.kind==='scale'&&target?.kind==='station')this.model.process(target.key);
  else if(source.kind==='station'){
   if(a.moved&&plate!==undefined)this.model.store(plate,source.key);
   else if(!a.moved&&source.key==='grind')this.model.grindClick();
   else if(!a.moved)this.model.say('点击蒸笼下方移动的绿色区域。');
  }else if(source.kind==='grindMeter')this.model.grindClick();
  else if(source.kind==='steamMeter'&&inside(p,AREAS.steamMeter))this.model.steamClick((p.x-AREAS.steamMeter.x)/AREAS.steamMeter.w);
  else if(source.kind==='newBag'){const i=plate??(!a.moved?this.model.s.slots.findIndex(s=>!s.bag):-1);if(i>=0)this.model.placeBag(i,source.key);}
  else if(source.kind==='material'&&a.moved&&plate!==undefined)this.model.fill(source.key,plate);
  else if(source.kind==='bag'){
   if(target?.kind==='customer')this.model.deliver(source.key,target.key);
   else if(!a.moved&&this.model.openPack(source.key))this.showModal('tie');
   else if(a.moved&&plate!==undefined&&plate!==source.key&&!this.model.s.slots[plate].bag){this.model.s.slots[plate].bag=this.model.s.slots[source.key].bag;this.model.s.slots[source.key].bag=null;}
  }
  this.cancelDrag();this.dirty=true;
 }
 private cancelDrag(){if(this.active?.target.kind==='raw'&&!this.active.consumed)this.model.refund(this.active.target.key);this.active=null;if(this.ghost){this.ghost.destroy();this.ghost=null;}this.dirty=true;}
 private inspect(t:Target|null){
  if(!t)return;let list:string[]=[];
  if(t.kind==='raw'&&RECIPES[t.key])list=[t.key];
  else if(t.kind==='scale')list=this.model.ingredients('scale');
  else if(t.kind==='station')list=this.model.ingredients('tool',t.key);
  else if(t.kind==='material'||t.kind==='bag')list=this.model.ingredients(t.kind,t.key);
  if(!list.length)return;const group=this.group('tip',this.effects),key=t.id+':'+list.join(',');group.active=true;this.tipUntil=this.timeMs+1800;
  if(this.tipKey===key)return;this.tipKey=key;this.clear(group);
  const w=list.length*78+24,r={x:Math.max(12,Math.min(W-w-12,t.x+t.w/2-w/2)),y:Math.max(140,t.y-105),w,h:84};
  this.panel(group,'Ingredients',r,PAPER,GOLD,30);list.forEach((h,i)=>this.item(group,RECIPES[h].art,{x:r.x+12+i*78,y:r.y+6,w:72,h:72}));this.tipUntil=this.timeMs+1800;
 }
 private modalButton(id:string,value:string,r:Box){this.panel(this.overlay,id,r,GREEN,GOLD,15);this.label(this.overlay,id+' text',value,r,40,PAPER);this.target(id,'modal',r);}
 private showModal(mode:'welcome'|'menu'|'tie'|'end'){
  this.modal=mode;this.clear(this.overlay);this.targets=this.targets.filter(t=>t.kind!=='modal');if(mode==='welcome'||mode==='menu')this.model.pause();
  this.panel(this.overlay,'Shade',{x:0,y:0,w:W,h:H},'#233328e9','#233328e9',0);
  this.panel(this.overlay,'Dialog',{x:100,y:380,w:880,h:1160},PAPER,GOLD,26);
  if(mode==='tie'){
   const b=this.model.s.slots[this.model.s.packing.slot].bag;
   this.label(this.overlay,'Title','沿袋口系紧',{x:180,y:450,w:720,h:100},58);
   b.ingredients.forEach((h,i)=>this.item(this.overlay,RECIPES[h].art,{x:540-b.ingredients.length*50+i*100,y:565,w:100,h:100}));
   this.bag(this.overlay,b.style,AREAS.tie);
   this.label(this.overlay,'Tie guide','○ ┄ ┄ ┄ ┄ ┄ ○',{x:AREAS.tie.x+40,y:AREAS.tie.y+AREAS.tie.h*.28,w:AREAS.tie.w-80,h:68},58,'#fff2bc');
   this.tieLine=this.create('Tie stroke',this.overlay).addComponent(Graphics);
   this.labels.tieHint=this.label(this.overlay,'Tie hint','按住，沿虚线划过左右两端',{x:160,y:1390,w:760,h:75},32);
   this.modalButton('close','返回',{x:760,y:410,w:160,h:80});
  }else if(mode==='end'){
   this.label(this.overlay,'End title','今日收铺',{x:180,y:520,w:720,h:120},64);
   this.label(this.overlay,'Summary','第 '+this.model.s.day+' 天\n今日收入 '+this.model.s.dayIncome+' 两\n共存银子 '+this.model.s.silver+' 两',{x:180,y:700,w:720,h:340},48);
   this.label(this.overlay,'Next note','明日整理工作台、补满原料，银子保留。',{x:180,y:1100,w:720,h:130},32);
   this.modalButton('next','开启下一天',{x:200,y:1310,w:680,h:125});
  }else{
   this.label(this.overlay,'Title',mode==='welcome'?'花间香铺':'香铺小记',{x:180,y:450,w:720,h:110},64);
   this.label(this.overlay,'Subtitle','Cocos 版 · 开门迎客',{x:180,y:565,w:720,h:60},30,GREEN);
   this.label(this.overlay,'Instructions','一日三分钟，客人陆续到店。\n看清袋型与配料图，再动手制香。\n\n多味香料拖到秤盘，一起称量。\n研磨到绿区点击；蒸制跟随绿区。\n两份成料拖到一盘，香囊也放盘上。\n拖成料入袋，点袋画线系紧，交给客人。\n\n空篮点五次补货。\n不要的材料拖进废料桶。',{x:180,y:660,w:720,h:590},36);
   this.modalButton(mode==='welcome'?'start':'resume',mode==='welcome'?'开始营业':'继续营业',{x:200,y:1300,w:680,h:110});
   if(mode==='menu')this.modalButton('reset','重新开始',{x:330,y:1430,w:420,h:75});
  }
 }
 private closeModal(){const mode=this.modal;this.clear(this.overlay);this.modal=null;this.targets=this.targets.filter(t=>t.kind!=='modal');if(mode==='tie')this.model.cancelPack();else this.model.resume();this.dirty=true;}
 private startPlay(){this.model.reset();this.closeModal();this.dirty=true;}
 private modalAction(id:string){if(id==='start'||id==='reset')this.startPlay();else if(id==='resume'||id==='close')this.closeModal();else if(id==='next'){this.model.nextDay();this.closeModal();}}
}
