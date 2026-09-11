/* Six-floor campaign: fixed-step, independently testable boss bodies and attacks. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NeonBosses=api;})(globalThis,()=>{
 'use strict';
 const STEP=1/120,TAU=Math.PI*2;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
 const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
 const angle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
 const KINDS=['worm','angel','frog'];
 const NAMES=['钻髓地龙','六刃智天使','震跃机兽'];
 function supported(b){return !!b?.anatomy&&KINDS.includes(b.anatomy)}
 function state(b,name,duration){b.previousAction=b.action;b.action=name;b.actionTime=0;b.duration=duration;b.actionSerial++;b.history.push(name);if(b.history.length>40)b.history.shift();}
 function chain(x,y,heading,count){return {x,y,px:x,py:y,heading,segments:Array.from({length:count},(_,i)=>({x:x-Math.cos(heading)*i*30,y:y-Math.sin(heading)*i*30,px:x-Math.cos(heading)*i*30,py:y-Math.sin(heading)*i*30,angle:heading})),visible:1};}
 function fitChain(w,r){for(const s of w.segments){s.x=s.px=clamp(s.x,r.x+27,r.x+r.w-27);s.y=s.py=clamp(s.y,r.y+27,r.y+r.h-27);}return w;}
 function init(b,floor,bounds){
  if(floor>3)return false;
  Object.assign(b,{anatomy:KINDS[floor-1],phase:0,clock:0,accumulator:0,actionSerial:0,history:[],cycle:0,hitFlash:0,px:b.x,py:b.y,z:0,pz:0,bladeAngle:0,prevBladeAngle:0,bladeRadius:58,prevBladeRadius:58,hitParts:[],waves:[],bounds:{...bounds},transformPulse:0});
  b.r=[33,38,48][floor-1];
  b.entry={x:b.x,y:b.y};b.invuln=2.2;
  if(b.anatomy==='worm'){const w=chain(b.x,b.y,0,8);w.target={...b.entry};beginEmerge(w,b);b.worms=[w];}
  else if(b.anatomy==='angel'){b.z=b.pz=320;b.bladeRadius=b.prevBladeRadius=10;}
  else{b.y=b.py=bounds.y-45;b.z=b.pz=160;}
  state(b,'intro',2.2);return true;
 }
 function entrance(b,env){
  const t=b.actionTime;
  if(b.anatomy==='worm'){b.worms.forEach(w=>emergePose(w,clamp((t-.2)/1.65,0,1)));b.x=b.worms[0].x;b.y=b.worms[0].y;}
  else if(b.anatomy==='angel'){b.z=320*(1-smooth(t/1.6));b.bladeRadius=lerp(10,62,smooth((t-.65)/1.4));b.bladeAngle+=STEP*(.5+smooth(t/2)*.6);}
  else{const q=clamp(t/1.35,0,1);b.y=lerp(b.bounds.y-45,b.entry.y,smooth(q));b.z=160*(1-smooth(q))+Math.sin(q*Math.PI)*75;}
  if(t>=b.duration){b.z=0;b.invuln=0;state(b,b.anatomy==='worm'?'crawl':b.anatomy==='angel'?'hover':'idle',b.anatomy==='worm'?2.2:.45);env.ready?.();}
 }
 function protection(b){
  if(b.action==='intro')return{immune:true,label:'入场中 · 双方保护'};
  if(b.action==='transform'||b.invuln>0)return{immune:true,label:'形态重构 · 无敌'};
  if(b.anatomy==='angel'&&((b.action==='charge'&&b.actionTime<.45)||(b.action==='spin-charge'&&b.actionTime<.5)))return{immune:true,label:'合甲蓄力 · 无敌'};
  if(b.anatomy==='worm'&&b.action==='underground')return{immune:true,label:'地下潜行'};
  if(b.anatomy==='frog'&&b.z>25)return{immune:true,label:'腾空 · 等待落地'};
  return{immune:false,label:b.action==='recover'?'收势 · 反击窗口':'交战中'};
 }
 function target(b,p,distance=300){const d=Math.hypot(p.x-b.x,p.y-b.y)||1,k=Math.min(1,distance/d),r=b.bounds;return{x:clamp(b.x+(p.x-b.x)*k,r.x+85,r.x+r.w-85),y:clamp(b.y+(p.y-b.y)*k,r.y+95,r.y+r.h-80)};}
 function phaseChange(b,env){
  if(b.phase>=2||b.hp>b.maxHp*(b.phase===0?.66:.33))return false;
  // Finish travel before transforming: never reset a partially buried body or airborne pose.
  if(['burrow','underground','emerge','leap','land'].includes(b.action))return false;
  b.phase++;b.invuln=1.05;b.transformPulse=1.05;b.waves=[];env.clear?.();
  if(b.anatomy==='worm'&&b.phase===2){
   const w=b.worms[0],rear=w.segments.splice(4).reverse().map(s=>({...s,angle:s.angle+Math.PI})),head=rear[0];
   b.worms.push({x:head.x,y:head.y,heading:head.angle,segments:rear,visible:1,born:b.clock});
   w.splitTail=b.clock;env.burst?.(rear.at(-1).x,rear.at(-1).y,b.color,12,70);
  }
  state(b,'transform',1.05);env.phase?.(b);return true;
 }
 function headMotion(w,p,speed,dt,b,index){
  const r=b.bounds,inset=68,edge=w.x<r.x+inset||w.x>r.x+r.w-inset||w.y<r.y+inset||w.y>r.y+r.h-inset;
  const desired=edge?Math.atan2(r.cy-w.y,r.cx-w.x):Math.atan2(p.y-w.y,p.x-w.x)+Math.sin(b.clock*1.25+index*2)*.6;
  w.heading+=clamp(angle(w.heading,desired),-dt*1.65,dt*1.65);
  w.x=clamp(w.x+Math.cos(w.heading)*speed*dt,r.x+40,r.x+r.w-40);w.y=clamp(w.y+Math.sin(w.heading)*speed*dt,r.y+40,r.y+r.h-40);
  w.segments[0].x=w.x;w.segments[0].y=w.y;w.segments[0].angle=w.heading;
  for(let i=1;i<w.segments.length;i++){const s=w.segments[i],front=w.segments[i-1],a=Math.atan2(front.y-s.y,front.x-s.x);s.x=front.x-Math.cos(a)*30;s.y=front.y-Math.sin(a)*30;s.angle=a;}
 }
 function wave(b,x,y,max=200){b.waves.push({x,y,r:28,pr:28,max,age:0});}
 function beginDive(w){w.hole={x:w.x,y:w.y};w.divePath=w.segments.map(s=>({x:s.x,y:s.y,angle:s.angle}));}
 function divePose(w,q){
  const travel=smooth(q)*((w.segments.length-1)*30+65);
  w.segments.forEach((s,i)=>{const d=i*30-travel,at=Math.max(0,d)/30,j=Math.min(w.divePath.length-1,Math.floor(at)),a=w.divePath[j],c=w.divePath[Math.min(j+1,w.divePath.length-1)];
   s.x=lerp(a.x,c.x,at-j);s.y=lerp(a.y,c.y,at-j);s.angle=a.angle+angle(a.angle,c.angle)*(at-j);s.cover=1-smooth(-d/65);s.depth=1-s.cover;
  });
 }
 function beginEmerge(w,b){
  w.hole={...w.target};w.heading=Math.atan2(b.bounds.cy-w.hole.y,b.bounds.cx-w.hole.x);
  w.segments.forEach(s=>{s.x=s.px=w.hole.x;s.y=s.py=w.hole.y;s.cover=s.pcover=0;s.depth=1;s.angle=w.heading});w.visible=1;
 }
 function emergePose(w,q){
  const travel=smooth(q)*((w.segments.length-1)*30+65);
  w.segments.forEach((s,i)=>{const d=travel-i*30,forward=Math.max(0,d-55);s.cover=smooth(d/55);s.depth=1-s.cover;s.x=w.hole.x+Math.cos(w.heading)*forward;s.y=w.hole.y+Math.sin(w.heading)*forward;s.angle=w.heading;});
  w.x=w.segments[0].x;w.y=w.segments[0].y;
 }
 function worm(b,dt,env){
  const t=b.actionTime,p=env.player;
  if(b.action==='intro'||b.action==='transform'){
   if(b.action==='transform'&&b.phase===2)b.worms.forEach((w,i)=>headMotion(w,{x:w.x+Math.cos(w.heading+(i?-.4:.4))*100,y:w.y+Math.sin(w.heading+(i?-.4:.4))*100},55*Math.sin(Math.PI*clamp(t/b.duration,0,1)),dt,b,i));
   b.x=b.worms[0].x;b.y=b.worms[0].y;if(t>=b.duration)state(b,'crawl',2.7-b.phase*.35);return;
  }
  if(b.action==='crawl'){
   b.worms.forEach((w,i)=>{w.visible=1;headMotion(w,p,112+b.phase*22,dt,b,i)});
   if(t>=b.duration){b.target=target(b,p,500);b.worms.forEach((w,i)=>{w.target={x:clamp(b.target.x+(i-(b.worms.length-1)/2)*135,b.bounds.x+85,b.bounds.x+b.bounds.w-85),y:b.target.y};beginDive(w)});state(b,'burrow',1.25);}
  }else if(b.action==='burrow'){
   b.worms.forEach(w=>divePose(w,t/b.duration));
   if(t>=b.duration){state(b,'underground',1.15);b.worms.forEach(w=>{w.from={x:w.x,y:w.y};});}
  }else if(b.action==='underground'){
   b.worms.forEach(w=>{w.visible=0;const q=smooth(t/1.15);w.x=lerp(w.from.x,w.target.x,q);w.y=lerp(w.from.y,w.target.y,q)});
   if(t>=b.duration){b.worms.forEach(w=>beginEmerge(w,b));state(b,'emerge',1.35);}
  }else if(b.action==='emerge'){
   b.worms.forEach(w=>emergePose(w,t/b.duration));
   if(t>=b.duration){b.worms.forEach(w=>{env.burst?.(w.x,w.y,b.color,16,150);wave(b,w.x,w.y,95);});state(b,'spit',.5);}
  }else if(b.action==='spit'){
   if(t>=b.duration){b.worms.forEach(w=>{const a=Math.atan2(p.y-w.y,p.x-w.x);for(let i=-1;i<=1;i++)env.shot?.(w.x,w.y,a+i*.23,155+b.phase*15)});state(b,'recover',.75);}
  }else if(b.action==='recover'&&t>=b.duration)state(b,'crawl',2.7-b.phase*.35);
  b.x=b.worms[0].x;b.y=b.worms[0].y;
 }
 function angel(b,dt,env){
  const t=b.actionTime,p=env.player;
  const spin=b.action==='spin',fold=b.action==='charge'||b.action==='dash',radius=fold?38:spin?108+b.phase*12:b.action==='fan'?120:62+b.phase*8;
  b.bladeRadius+= (radius-b.bladeRadius)*(1-Math.exp(-dt*8));
  b.bladeSpeed=(b.bladeSpeed??1.1)+((spin?4.7+b.phase:fold?.35:1.1+b.phase*.25)-(b.bladeSpeed??1.1))*(1-Math.exp(-dt*7));b.bladeAngle+=dt*b.bladeSpeed;
  b.bladePitch=(b.bladePitch??.3)+((spin?1.05:fold?-.25:.3)-(b.bladePitch??.3))*(1-Math.exp(-dt*7));
  const opening=b.phase===2?2:b.phase===1||b.action.includes('charge')||spin||b.action==='fan'?1:0;
  b.armor=(b.armor||0)+(opening-(b.armor||0))*(1-Math.exp(-dt*5));
  const leanTarget=b.action==='charge'?-.09:b.action==='dash'?.22*Math.cos(b.dashAngle):0;
  b.lean=(b.lean||0)+(leanTarget-(b.lean||0))*(1-Math.exp(-dt*9));
  if(b.action==='intro'||b.action==='transform'){if(t>=b.duration)state(b,'hover',.42);return;}
  if(b.action==='hover'){
   b.x+=Math.cos(b.clock*.85)*34*dt;b.y+=Math.sin(b.clock*1.1)*23*dt;
   if(t>=b.duration){b.cycle++;const action=b.cycle%3===0?'fan-charge':b.cycle%2===0?'spin-charge':'charge';b.target=target(b,p,470);b.dashAngle=Math.atan2(b.target.y-b.y,b.target.x-b.x);state(b,action,.72-b.phase*.05);}
  }else if(b.action==='charge'&&t>=b.duration){b.from={x:b.x,y:b.y};state(b,'dash',.52);}
  else if(b.action==='dash'){const q=smooth(t/.52);b.x=lerp(b.from.x,b.target.x,q);b.y=lerp(b.from.y,b.target.y,q);if(t>=b.duration){env.burst?.(b.x,b.y,b.color,14,180);state(b,'recover',.7);}}
  else if(b.action==='spin-charge'&&t>=b.duration){state(b,'spin',1.35);}
  else if(b.action==='spin'){
   if(t>=b.duration){for(let i=0;i<6;i++)env.shot?.(b.x,b.y,b.bladeAngle+i*TAU/6,160+b.phase*15);state(b,'recover',.75);}
  }else if(b.action==='fan-charge'&&t>=b.duration){for(let i=-2;i<=2;i++)env.shot?.(b.x,b.y,b.dashAngle+i*.28,195);b.fanRepeats=0;state(b,'fan',.62);}
  else if(b.action==='fan'){if(b.phase>0&&t>.26&&!b.fanRepeats){b.fanRepeats++;for(let i=-2;i<=2;i++)env.shot?.(b.x,b.y,b.dashAngle+i*.28+.14,200);}if(t>=b.duration)state(b,'recover',.65);}
  else if(b.action==='recover'&&t>=b.duration)state(b,'hover',.52-b.phase*.08);
  const r=b.bounds;b.x=clamp(b.x,r.x+135,r.x+r.w-135);b.y=clamp(b.y,r.y+135,r.y+r.h-135);
 }
 function frog(b,dt,env){
  const t=b.actionTime,p=env.player;
  if(b.action==='intro'||b.action==='transform'){if(t>=b.duration){b.hops=0;state(b,'idle',1.05);}return;}
  if(b.action==='idle'&&t>=b.duration){b.target=target(b,p,300+b.phase*30);state(b,'crouch',.85);}
  else if(b.action==='crouch'&&t>=b.duration){b.from={x:b.x,y:b.y};state(b,'leap',.9);}
  else if(b.action==='leap'){
   const q=clamp(t/.9,0,1);b.x=lerp(b.from.x,b.target.x,smooth(q));b.y=lerp(b.from.y,b.target.y,smooth(q));b.z=Math.sin(q*Math.PI)*125;
   if(t>=b.duration){b.z=0;state(b,'land',.46);if(Math.hypot(p.x-b.x,p.y-b.y)<70+p.r)env.hurt?.(1);wave(b,b.x,b.y,180+b.phase*30);env.burst?.(b.x,b.y,b.color,22,190);}
  }else if(b.action==='land'&&t>=b.duration){b.hops++;if(b.hops<=b.phase){b.target=target(b,p,225);state(b,'crouch',.62);}else{b.hops=0;state(b,'recover',1.25);}}
  else if(b.action==='recover'&&t>=b.duration){if(b.phase===2){for(let i=0;i<8;i++)env.shot?.(b.x,b.y,i*TAU/8,160);}state(b,'idle',.7);}
 }
 function bodies(b){
  if(!supported(b))return [{x:b.x,y:b.y,r:b.r}];
  if(b.action==='intro'||b.action==='transform')return [];
  if(b.anatomy==='worm')return b.worms.flatMap(w=>w.visible>.8?w.segments.flatMap((s,i)=>(s.cover??1)>.65?[{x:s.x,y:s.y,r:i===0?31:i===w.segments.length-1?18:23}]:[]):[]);
  if(b.anatomy==='frog'&&b.z>25)return [];
  return [{x:b.x,y:b.y,r:b.r}];
 }
 function step(b,env){
  b.px=b.x;b.py=b.y;b.pz=b.z;b.prevBladeAngle=b.bladeAngle;b.prevBladeRadius=b.bladeRadius;
  b.worms?.forEach(w=>w.segments.forEach(s=>{s.px=s.x;s.py=s.y;s.pcover=s.cover??1}));
  b.clock+=STEP;b.actionTime+=STEP;b.invuln=Math.max(0,b.invuln-STEP);b.hitFlash=Math.max(0,b.hitFlash-STEP);b.transformPulse=Math.max(0,b.transformPulse-STEP);
  if(b.action==='intro'){entrance(b,env);b.hitParts=[];return;}
  phaseChange(b,env);
  if(b.anatomy==='worm')worm(b,STEP,env);else if(b.anatomy==='angel')angel(b,STEP,env);else frog(b,STEP,env);
  b.hitParts=bodies(b);const p=env.player;
  if(b.action!=='recover'&&b.hitParts.some(s=>Math.hypot(p.x-s.x,p.y-s.y)<s.r+p.r))env.hurt?.(1);
  if(b.anatomy==='angel'&&b.action==='spin')for(let i=0;i<6;i++){const a=b.bladeAngle+i*TAU/6,x=b.x+Math.cos(a)*(b.bladeRadius+25),y=b.y+Math.sin(a)*(b.bladeRadius+25)*.72;if(Math.hypot(p.x-x,p.y-y)<p.r+20)env.hurt?.(1);}
  for(const w of b.waves){w.pr=w.r;w.r+=STEP*150;w.age+=STEP;if(w.age>.08&&Math.abs(Math.hypot(p.x-w.x,p.y-w.y)-w.r)<p.r+6)env.hurt?.(1);}
  b.waves=b.waves.filter(w=>w.r<w.max);
 }
 function update(b,dt,env){if(!supported(b))return false;b.accumulator+=Math.min(.1,Math.max(0,dt));let n=0;while(b.accumulator+1e-9>=STEP&&n++<12){step(b,env);b.accumulator-=STEP;}return true;}
 function segmentDistance(x,y,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,k=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(x-ax-dx*k,y-ay-dy*k);}
 function hitTest(b,t){return bodies(b).some(s=>segmentDistance(s.x,s.y,t.px??t.x,t.py??t.y,t.x,t.y)<s.r+(t.r||0));}
 function damage(b,amount){if(!supported(b))return amount;if(!bodies(b).length||protection(b).immune)return 0;b.hitFlash=.13;const floor=b.phase===0?b.maxHp*.66-.001:b.phase===1?b.maxHp*.33-.001:0;return Math.min(amount,Math.max(0,b.hp-floor));}
 function snapshot(b){if(!supported(b))return null;return{kind:b.anatomy,name:b.name,phase:b.phase,action:b.action,clock:b.clock,actionTime:b.actionTime,x:b.x,y:b.y,z:b.z,parts:bodies(b),worms:b.worms?.length||0,segments:b.worms?.map(w=>w.segments.length)||[],bladeCount:b.anatomy==='angel'?6:0,bladeAngle:b.bladeAngle,bladeRadius:b.bladeRadius,waves:b.waves.length,target:b.target,history:[...b.history]};}
 return{KINDS,NAMES,STEP,supported,init,update,hitTest,bodies,damage,protection,snapshot,lerp,smooth};
});
