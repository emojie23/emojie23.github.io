/* Generated cutouts + continuous skeletal poses. No per-frame image filters. */
window.NeonBossArt=(()=>{
 'use strict';
 const names=['worm-head','worm-body','worm-tail','worm-maw','angel-core','angel-open','angel-blade','angel-exposed','frog-idle','frog-crouch','frog-leap','frog-land'];
 const images={},failed=[];let loaded=0;const deaths=[];
 for(const name of names){const image=new Image();images[name]=image;image.onload=()=>loaded++;image.onerror=()=>{failed.push(name);console.warn('Boss art unavailable:',name)};image.src='assets/boss-v3/'+name+'.webp';}
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,TAU=Math.PI*2;
 function sprite(ctx,id,x,y,w,h=w,rotation=0,sx=1,sy=1,alpha=1,reveal=1){const im=images[id];if(!im?.naturalWidth||reveal<=0)return;const k=Math.min(w/im.naturalWidth,h/im.naturalHeight),dw=im.naturalWidth*k,dh=im.naturalHeight*k;ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(sx,sy);ctx.globalAlpha*=alpha;if(reveal<1){ctx.beginPath();ctx.rect(-dw/2,-dh/2,dw,dh*reveal);ctx.clip()}ctx.drawImage(im,-dw/2,-dh/2,dw,dh);ctx.restore();}
 function ellipse(ctx,x,y,rx,ry,color,fill=true){ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);if(fill){ctx.fillStyle=color;ctx.fill()}else{ctx.strokeStyle=color;ctx.stroke()}}
 function progress(b){return clamp((b.actionTime-NeonBosses.STEP+b.accumulator)/(b.duration||1),0,1)}
 function ground(ctx,b,time){
  ctx.save();ctx.lineWidth=2;
  if(b.target&&['underground','burrow','emerge','crouch','leap'].includes(b.action))for(const target of b.anatomy==='worm'?b.worms.map(w=>w.target||b.target):[b.target]){
   const size=b.anatomy==='frog'?75:60,pulse=1+Math.sin(time*12)*.04;
   ellipse(ctx,target.x,target.y,size*pulse,size*.66*pulse,'#140d1dc0');ctx.setLineDash([8,6]);ellipse(ctx,target.x,target.y,size*pulse,size*.66*pulse,'#ffc267',false);ctx.setLineDash([]);
   ctx.strokeStyle='#ffc267';ctx.beginPath();ctx.moveTo(target.x-16,target.y);ctx.lineTo(target.x+16,target.y);ctx.moveTo(target.x,target.y-11);ctx.lineTo(target.x,target.y+11);ctx.stroke();
  }
  for(const w of b.waves){const r=mix(w.pr,w.r,clamp(b.accumulator/NeonBosses.STEP,0,1));ctx.globalAlpha=clamp(1-w.r/w.max,.15,1);ctx.lineWidth=6;ellipse(ctx,w.x,w.y,r,r,b.color,false);ctx.lineWidth=2;ellipse(ctx,w.x,w.y,r-5,r-5,'#fff2cd',false);}
  ctx.globalAlpha=1;
  if(b.anatomy==='angel'&&['charge','fan-charge'].includes(b.action)&&b.target){ctx.strokeStyle='#ffc267aa';ctx.lineWidth=3;ctx.setLineDash([12,9]);ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.target.x,b.target.y);ctx.stroke();ctx.setLineDash([]);}
  if(b.anatomy==='angel'&&b.action==='spin-charge'){ctx.strokeStyle='#ffd089';ctx.setLineDash([10,6]);ellipse(ctx,b.x,b.y,145,105,'#ffd089',false);}
  ctx.restore();
 }
 function worm(ctx,b,time,alpha){
  for(const w of b.worms){
   const tunnel=['intro','burrow','emerge'].includes(b.action),hole=w.hole;
   if(tunnel&&hole){ellipse(ctx,hole.x,hole.y+9,46,23,'#080a10');ctx.lineWidth=5;ellipse(ctx,hole.x,hole.y+9,46,23,'#54473d',false);ctx.lineWidth=2;ellipse(ctx,hole.x,hole.y+7,40,18,'#ffb75988',false);}
   if(b.action==='underground'){
    for(let j=5;j>=0;j--){const q=clamp(progress(b)-j*.045,0,1),x=mix(w.from.x,w.target.x,NeonBosses.smooth(q)),y=mix(w.from.y,w.target.y,NeonBosses.smooth(q));ellipse(ctx,x,y,30-j*2,12-j,'#30241c');ctx.lineWidth=2;ellipse(ctx,x,y-3,25-j*2,9,'#eaa14466',false);}
   }
   for(let i=w.segments.length-1;i>=0;i--){const s=w.segments[i],x=mix(s.px??s.x,s.x,alpha),y=mix(s.py??s.y,s.y,alpha),cover=mix(s.pcover??s.cover??1,s.cover??1,alpha);if(w.visible<=0||cover<=0)continue;
    const head=i===0,tail=i===w.segments.length-1,wid=head?94:tail?76:67;
    ellipse(ctx,x,y+9,(head?35:24)*cover,12*cover,'#0006');ctx.save();
    const twist=s.angle+(head?0:Math.sin(time*5-i*.6)*.025),lift=(1-cover)*28,birth=w.born===undefined?1:NeonBosses.smooth((time-w.born)/.8);
    if(head&&birth<1)sprite(ctx,'worm-tail',x,y+lift,76,64,twist,1,1,1-birth,cover);
    sprite(ctx,head?'worm-head':tail?'worm-tail':'worm-body',x,y+lift,wid,head?82:64,tail?twist+Math.PI:twist,1,1,head?birth:1,cover);
    if(head&&b.action==='spit')sprite(ctx,'worm-maw',x,y,wid,82,twist,1,1,NeonBosses.smooth(progress(b)));
    if(b.phase>0&&!head&&cover>.8){ctx.globalAlpha=.45;ellipse(ctx,x,y,7+b.phase*2,4,b.phase===2?'#ff603e':'#ffbb58');}
    ctx.restore();
   }
   if(tunnel&&hole){ctx.strokeStyle='#9b7950';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(hole.x,hole.y+9,46,23,0,0,Math.PI);ctx.stroke();for(let i=0;i<9;i++){const a=i*2.4+time*1.8,r=30+Math.sin(time*9+i)*8;ctx.fillStyle=i%2?'#ab8860':'#574d42';ctx.fillRect(hole.x+Math.cos(a)*r,hole.y+Math.sin(a)*r*.55-4,4,3)}}
  }
 }
 function angel(ctx,b,time,alpha){
  const x=mix(b.px,b.x,alpha),groundY=mix(b.py,b.y,alpha),z=mix(b.pz,b.z,alpha),y=groundY-z,a=mix(b.prevBladeAngle,b.bladeAngle,alpha),r=mix(b.prevBladeRadius,b.bladeRadius,alpha),bob=Math.sin(time*2.7)*4;
  ellipse(ctx,x,groundY+15,Math.max(20,62-z*.1),Math.max(8,23-z*.03),'#0006');
  const blade=(i)=>{const q=a+i*TAU/6,spin=b.action==='spin',rad=r+30,px=x+Math.cos(q)*rad,py=y+Math.sin(q)*rad*.72;ctx.strokeStyle='#62898a77';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+Math.cos(q)*29,y+Math.sin(q)*22);ctx.lineTo(px,py);ctx.stroke();
   if(spin){for(let j=2;j>=1;j--)sprite(ctx,'angel-blade',x+Math.cos(q-j*.13)*rad,y+Math.sin(q-j*.13)*rad*.72+bob,99,43,q+1.05,1,1,.13/j);}
   sprite(ctx,'angel-blade',px,py+bob,99,43,q+(b.bladePitch??.3));};
  for(let i=0;i<6;i++)if(Math.sin(a+i*TAU/6)<0)blade(i);
  const armor=b.armor??0,open=clamp(armor,0,1),exposed=clamp(armor-1,0,1),lean=b.lean||0;
  sprite(ctx,'angel-core',x,y-12+bob,133,155,lean,1,1,1-open);
  sprite(ctx,'angel-open',x,y-12+bob,133,155,lean,1+open*.04,1,open*(1-exposed));
  sprite(ctx,'angel-exposed',x,y-12+bob,133,155,lean,1.04,1,exposed);
  for(let i=0;i<6;i++)if(Math.sin(a+i*TAU/6)>=0)blade(i);
  if(NeonBosses.protection(b).immune&&b.action!=='intro'){ctx.strokeStyle='#b6fff0';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<6;i++){const q=i*TAU/6+time*.35;ctx.lineTo(x+Math.cos(q)*72,y-12+Math.sin(q)*72)}ctx.closePath();ctx.stroke();}
  if(b.action==='fan'){ctx.globalAlpha=(1-progress(b))*.7;ellipse(ctx,x,y-10,26+progress(b)*50,26+progress(b)*50,'#b8ffef',false);ctx.globalAlpha=1;}
 }
 function frog(ctx,b,time,alpha){
  const x=mix(b.px,b.x,alpha),y=mix(b.py,b.y,alpha),z=mix(b.pz,b.z,alpha),p=progress(b),S=NeonBosses.smooth;
  let weights={idle:1,crouch:0,leap:0,land:0},crouch=0,land=0,stretch=0;
  if(b.action==='intro'){const t=b.actionTime;if(t<1.35){const blend=S((t-1)/.35);weights={idle:0,crouch:0,leap:1-blend,land:blend};}else{const rise=S((t-1.75)/.45);weights={idle:rise,crouch:0,leap:0,land:1-rise};land=Math.sin(Math.PI*clamp((t-1.35)/.4,0,1));}}
  if(b.action==='crouch'){crouch=S(p);weights={idle:b.previousAction==='land'?0:1-crouch,crouch,leap:0,land:b.previousAction==='land'?1-crouch:0};}
  if(b.action==='leap'){const launch=S(p/.22),landing=S((p-.76)/.24);weights={idle:0,crouch:1-launch,leap:launch*(1-landing),land:landing};crouch=1-launch;stretch=Math.sin(Math.PI*clamp(p/.3,0,1))*.12;}
  if(b.action==='land'){land=Math.sin(p*Math.PI);weights={idle:0,crouch:0,leap:0,land:1};}
  if(b.action==='recover'){const rise=S(p/.42);weights={idle:rise,crouch:0,leap:0,land:1-rise};}
  ellipse(ctx,x,y+13,60-z*.19,24-z*.08,'#0007');ctx.lineWidth=2;
  if(z>20)ellipse(ctx,x,y+13,48,18,'#c5abf38c',false);
  const sx=1+crouch*.12+land*.2-stretch*.4,sy=1-crouch*.12-land*.2+stretch,yy=y-24-z+crouch*10;
  for(const pose of ['idle','crouch','leap','land'])if(weights[pose]>.001)sprite(ctx,'frog-'+pose,x,yy,190,178,0,sx,sy,weights[pose]);
  if(b.phase>0){ctx.globalAlpha=.35+.15*Math.sin(time*5);ellipse(ctx,x,yy+8,9+b.phase*3,7+b.phase*2,b.phase===2?'#ff80e9':'#b9a1ff');ctx.globalAlpha=1;}
 }
 function draw(ctx,b,time){if(!NeonBosses.supported(b)||loaded!==names.length)return false;
  const alpha=clamp(b.accumulator/NeonBosses.STEP,0,1),clock=b.clock-NeonBosses.STEP+b.accumulator;ground(ctx,b,clock);ctx.save();
  if(b.action==='transform'){const p=progress(b);ctx.translate(b.x,b.y);const s=1+Math.sin(p*Math.PI)*.12;ctx.scale(s,s);ctx.translate(-b.x,-b.y);ctx.lineWidth=3;ellipse(ctx,b.x,b.y,65+p*85,42+p*55,b.color,false);}
  if(b.hitFlash>0)ctx.globalAlpha=.65+.35*Math.abs(Math.sin(time*70));
  if(b.anatomy==='worm')worm(ctx,b,clock,alpha);else if(b.anatomy==='angel')angel(ctx,b,clock,alpha);else frog(ctx,b,clock,alpha);ctx.restore();return true;
 }
 function intro(ctx,floor,time){if(floor<1||floor>3||loaded!==names.length)return false;
  const b={x:280,y:310,name:'',color:['#ffb759','#93fff1','#c497ff'][floor-1],maxHp:100,hp:100,invuln:0};NeonBosses.init(b,floor,{x:0,y:0,w:560,h:590,cx:280,cy:295});
  b.action='idle';b.z=b.pz=0;b.y=b.py=310;b.invuln=0;b.clock=time;b.actionTime=time;b.accumulator=NeonBosses.STEP;b.bladeAngle=b.prevBladeAngle=time*.65;b.bladeRadius=b.prevBladeRadius=68;
  if(b.anatomy==='worm'){b.worms[0].segments.forEach((s,i)=>{s.cover=s.pcover=1;s.x=s.px=395-i*27;s.y=s.py=295+Math.sin(time*1.6-i*.55)*32;s.angle=Math.cos(time*1.6-i*.55)*.3});}
  ctx.save();ctx.translate(280,295);ctx.scale(1.65,1.65);ctx.translate(-280,-295);draw(ctx,b,time);ctx.restore();return true;
 }
 function death(b,time,room){if(!NeonBosses.supported(b))return;b.waves=[];deaths.push({b,time,room});if(deaths.length>3)deaths.shift();}
 function drawDeaths(ctx,time,room){for(let i=deaths.length-1;i>=0;i--){const d=deaths[i],age=time-d.time;if(age>.7||d.room!==room){deaths.splice(i,1);continue;}ctx.save();ctx.globalAlpha=1-age/.7;ctx.translate(d.b.x,d.b.y);ctx.scale(1+age*.25,Math.max(.2,1-age*.8));ctx.translate(-d.b.x,-d.b.y);draw(ctx,d.b,time);ctx.restore();}}
 return{draw,intro,death,drawDeaths,diagnostics:()=>({loaded,total:names.length,failed:[...failed]}),names};
})();
