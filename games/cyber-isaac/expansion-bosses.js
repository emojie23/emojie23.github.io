/* Independent original boss encounters. All attacks have visible preparation and recovery. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NeonNewBosses=api})(globalThis,()=>{
 const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)},mix=(a,b,t)=>a+(b-a)*t;
 const definitions={spider:{name:'蛛网织母',subtitle:'WEB MOTHER // 绕开电网 · 腹核暴露时反击',color:'#ffb576'},mirror:{name:'镜像执政官',subtitle:'MIRROR REGENT // 金色核心是真身 · 小心折射齐射',color:'#c6a0ff'}};
 const pictures={},deaths=[];if(typeof Image!=='undefined')for(const id of ['spider','mirror']){const im=new Image();im.src='assets/expansion/'+id+'.png';pictures[id]=im;}
 function select(base,floor,seed){const kind=floor===4?'spider':floor===5?'mirror':null;return kind&&((seed+floor*13)%2===0)?{...base,...definitions[kind],expansionBoss:kind}:base}
 function state(b,action,duration){b.previousAction=b.action;b.action=action;b.actionTime=0;b.duration=duration;b.fired=false;b.history.push(action);if(b.history.length>60)b.history.shift();}
 function init(b,kind){b.expansionBoss=kind;Object.assign(b,definitions[kind],{entryTime:0,invuln:2.2,phase:0,r:kind==='spider'?51:40,clock:0,history:[],traps:[],clones:[],z:300,cycle:0,weak:0});b.home={x:b.x,y:b.y};state(b,'intro',2.2)}
 function protection(b){return{immune:b.action==='intro'||b.action==='transform'||b.action==='swap'||b.invuln>0,label:b.action==='intro'?'入场中 · 双方保护':b.action==='swap'?'镜面跃迁 · 等待显形':b.action==='transform'?'形态重构 · 无敌':b.action==='recover'?'核心暴露 · 伤害 +35%':'交战中'}}
 function damage(b,raw){if(protection(b).immune)return 0;const d=raw*(b.action==='recover'?1.35:1),gate=b.phase<2?b.maxHp*(b.phase===0?.66:.33):0;return Math.max(0,Math.min(d,b.hp-gate));}
 function aim(b,p){return Math.atan2(p.y-b.y,p.x-b.x)}
 function prepare(b,action,duration,p){b.target={x:p.x,y:p.y};if(action==='lunge-windup'){const a=aim(b,p),d=Math.min(250,Math.hypot(p.x-b.x,p.y-b.y));b.target={x:clamp(b.x+Math.cos(a)*d,165,1115),y:clamp(b.y+Math.sin(a)*d,155,560)}}state(b,action,duration)}
 function webLength(b,a,max){const dx=Math.cos(a),dy=Math.sin(a),tx=dx>0?(1180-b.x)/dx:dx<0?(100-b.x)/dx:Infinity,ty=dy>0?(638-b.y)/dy:dy<0?(92-b.y)/dy:Infinity;return Math.max(0,Math.min(max,tx,ty))}
 function shotFan(b,env,x,y,a,count,spread,speed){for(let i=0;i<count;i++)env.shot(x,y,a+(i-(count-1)/2)*spread,speed)}
 function update(b,dt,env){b.clock+=dt;b.actionTime+=dt;b.invuln=Math.max(0,b.invuln-dt);const t=b.actionTime,p=env.player;
  if(b.action==='intro'){b.z=300*(1-smooth(t/1.8));if(t>=2.2){b.z=0;state(b,'stalk',.9);env.ready?.()}return}
  if(b.phase<2&&b.hp<=b.maxHp*(b.phase===0?.66:.33)&&b.action!=='transform'){b.phase++;b.invuln=1.1;b.traps=[];b.clones=[];env.clear?.();state(b,'transform',1.1);return}
  if(b.action==='transform'){if(t>=b.duration)state(b,'stalk',.7);return}
  for(let i=b.traps.length-1;i>=0;i--){const trap=b.traps[i];trap.age+=dt;if(trap.age>trap.life){b.traps.splice(i,1);continue}if(trap.age>1){const dx=p.x-trap.x,dy=p.y-trap.y,u=clamp((dx*trap.dx+dy*trap.dy)/trap.length,0,1),x=trap.x+trap.dx*trap.length*u,y=trap.y+trap.dy*trap.length*u;if(Math.hypot(p.x-x,p.y-y)<p.r+7)env.hurt(1)}}
  if(b.expansionBoss==='spider'){
   if(b.action==='stalk'){const a=aim(b,p);b.x+=Math.cos(a)*48*dt;b.y+=Math.sin(a)*32*dt;if(t>b.duration){const move=['web-windup','brood-windup','lunge-windup'][b.cycle++%3];prepare(b,move,move==='web-windup'?1:.8,p)}}
   else if(b.action==='web-windup'){if(t>=b.duration){const a=Math.atan2(b.target.y-b.y,b.target.x-b.x),length=240+b.phase*30;for(let i=0;i<2+b.phase;i++){const q=a+(i-(1+b.phase)/2)*.5;b.traps.push({x:b.x,y:b.y,dx:Math.cos(q),dy:Math.sin(q),length:webLength(b,q,length),age:0,life:4.5})}state(b,'weave',.7)}}
   else if(b.action==='brood-windup'){if(t>=b.duration){const count=Math.min(2,Math.max(0,3-(env.summons?.()||0)));for(let i=0;i<count;i++)env.summon(b.x+(i?75:-75),b.y+55);state(b,'brood',.75)}}
   else if(b.action==='lunge-windup'){if(t>=b.duration){b.from={x:b.x,y:b.y};const a=Math.atan2(b.target.y-b.y,b.target.x-b.x),d=Math.min(250,Math.hypot(b.target.x-b.x,b.target.y-b.y));b.target={x:clamp(b.x+Math.cos(a)*d,165,1115),y:clamp(b.y+Math.sin(a)*d,155,560)};state(b,'lunge',.6)}}
   else if(b.action==='lunge'){b.x=mix(b.from.x,b.target.x,smooth(t/.6));b.y=mix(b.from.y,b.target.y,smooth(t/.6));if(t>=.6)state(b,'recover',1.25)}
   else if(['weave','brood'].includes(b.action)&&t>=b.duration)state(b,'recover',1.2);
   else if(b.action==='recover'){if(t>=b.duration)state(b,'stalk',.8-b.phase*.15)}
  }else{
   if(b.action==='stalk'){b.x+=Math.cos(b.clock*1.2)*35*dt;b.y+=Math.sin(b.clock)*24*dt;if(t>=b.duration){prepare(b,'mirror-windup',1,p);b.clones=Array.from({length:2+b.phase},(_,i)=>({x:clamp(b.x+Math.cos(i/(2+b.phase)*TAU)*180,180,1100),y:clamp(b.y+Math.sin(i/(2+b.phase)*TAU)*120,175,555)}));}}
   else if(b.action==='mirror-windup'){if(t>=1){state(b,'volley',.65);const all=[b,...b.clones];all.forEach((c,i)=>{if(i===0||b.phase>0)shotFan(b,env,c.x,c.y,Math.atan2(b.target.y-c.y,b.target.x-c.x),i===0?5:2,.16,195+b.phase*25)})}}
   else if(b.action==='volley'&&t>=.65){b.from={x:b.x,y:b.y};b.swapTarget=b.clones[b.cycle++%b.clones.length]||b.home;state(b,'swap',1.2)}
   else if(b.action==='swap'){// Shrink into one shard, travel as visible energy, unfold at destination.
    const q=smooth((t-.3)/.55);b.x=mix(b.from.x,b.swapTarget.x,q);b.y=mix(b.from.y,b.swapTarget.y,q);if(t>=1.2){b.clones=[];state(b,'recover',1.3)}}
   else if(b.action==='recover'){if(t>=b.duration)prepare(b,'prism-windup',.95,p)}
   else if(b.action==='prism-windup'){if(t>=.95){for(let i=0;i<8+b.phase*2;i++)env.shot(b.x,b.y,i/(8+b.phase*2)*TAU+b.clock*.2,160+b.phase*15);state(b,'prism',.8)}}
   else if(b.action==='prism'&&t>=.8)state(b,'stalk',.8);
  }
  b.x=clamp(b.x,165,1115);b.y=clamp(b.y,155,560);if(b.action!=='swap'&&Math.hypot(b.x-p.x,b.y-p.y)<b.r+p.r)env.hurt(1);
 }
 function cell(ctx,id,index,x,y,w,h=w,angle=0,alpha=1){const im=pictures[id];if(!im?.naturalWidth)return;const sw=im.naturalWidth/2,sh=im.naturalHeight/2;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha*=alpha;ctx.drawImage(im,index%2*sw,Math.floor(index/2)*sh,sw,sh,-w/2,-h/2,w,h);ctx.restore()}
 function ring(ctx,x,y,r,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke()}
 function draw(ctx,b,time){if(!b.expansionBoss)return false;const id=b.expansionBoss,t=b.actionTime,blend=smooth(t/.22);ctx.save();
  for(const trap of b.traps||[]){ctx.strokeStyle=trap.age<1?'#ffcc83':'#ff6b67';ctx.lineWidth=trap.age<1?2:7;ctx.setLineDash(trap.age<1?[8,8]:[]);ctx.beginPath();ctx.moveTo(trap.x,trap.y);ctx.lineTo(trap.x+trap.dx*trap.length,trap.y+trap.dy*trap.length);ctx.stroke()}ctx.setLineDash([]);
  if(b.target&&b.action.endsWith('windup')){ctx.strokeStyle='#ffc277';ctx.lineWidth=2;ctx.setLineDash([7,7]);if(b.action==='web-windup'){for(let i=0;i<2+b.phase;i++){const a=Math.atan2(b.target.y-b.y,b.target.x-b.x)+(i-(1+b.phase)/2)*.5;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x+Math.cos(a)*webLength(b,a,240+b.phase*30),b.y+Math.sin(a)*webLength(b,a,240+b.phase*30));ctx.stroke()}}else if(b.action==='lunge-windup'){ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.target.x,b.target.y);ctx.stroke()}else ring(ctx,b.x,b.y,95,'#ffd08a');ctx.setLineDash([])}
  ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(b.x,b.y+30,id==='spider'?93:55,25,0,0,TAU);ctx.fill();const y=b.y-(b.z||0),weak=b.action==='recover';
  if(id==='spider'){const gait=['stalk','lunge'].includes(b.action)?Math.sin(time*11):Math.sin(time*3)*.25;for(let side of[-1,1])for(let i=0;i<4;i++){const a=(i-1.5)*.31+side*.1+Math.sin(time*8+i*1.8)*.07*Math.abs(gait);ctx.save();ctx.translate(b.x+side*27,y-24+i*16);ctx.scale(side,1);cell(ctx,id,2,50,0,128,100,a+(i-1.5)*.13);ctx.restore()}cell(ctx,id,3,b.x,y-43,100+b.phase*7,120,Math.sin(time*3)*.05);cell(ctx,id,weak?0:b.previousAction==='recover'?1:0,b.x,y+13,125,125,Math.sin(time*5)*.025,1-blend);cell(ctx,id,weak?1:0,b.x,y+13,125,125,Math.sin(time*5)*.025,blend);if(b.action==='brood-windup')ring(ctx,b.x,y-45,40+Math.sin(time*20)*4,'#ffcf74');}
  else{const unfold=b.action==='swap'?Math.max(.08,Math.abs(t-.6)/.6):1;for(const c of b.clones||[]){cell(ctx,id,0,c.x,c.y-10+Math.sin(time*3)*5,134,166,0,.3);cell(ctx,id,2,c.x,c.y+23,45,75,Math.sin(time*2)*.1,.6)}ctx.save();ctx.translate(b.x,y-8+Math.sin(time*2.5)*5);ctx.scale(unfold,1);cell(ctx,id,b.previousAction==='prism-windup'?3:b.previousAction==='recover'?1:0,0,0,160,190,0,1-blend);cell(ctx,id,b.action==='prism-windup'?3:weak?1:0,0,0,160,190,0,blend);ctx.restore();if(b.action==='swap'){cell(ctx,id,2,b.x,y,72,110,Math.sin(time*4)*.1);ring(ctx,b.x,y,38,'#e5c5ff')}else ring(ctx,b.x,y-17,8,'#ffd46b',3);}
  if(weak){ring(ctx,b.x,y,40+Math.sin(time*6)*3,'#ffe897',3)}if(b.action==='transform'){ring(ctx,b.x,y,70+t*35,b.color,3)}ctx.restore();return true;
 }
 function death(b,time,key){if(!b.expansionBoss)return;deaths.push({b:{...b,traps:[],clones:[]},time,key})}
 function drawDeaths(ctx,time,key){for(let i=deaths.length-1;i>=0;i--){const d=deaths[i],age=time-d.time;if(age>1.1||d.key!==key){deaths.splice(i,1);continue}ctx.save();ctx.globalAlpha=1-age/1.1;ctx.translate(d.b.x,d.b.y);ctx.scale(1+age*.18,1-age*.45);ctx.translate(-d.b.x,-d.b.y);draw(ctx,d.b,time);ctx.restore()}}
 function intro(ctx,kind,time){if(!definitions[kind])return false;const b={x:280,y:335,expansionBoss:kind,phase:0,action:'recover',actionTime:0,clock:time,clones:[],traps:[]};ctx.save();ctx.translate(280,315);ctx.scale(1.8,1.8);ctx.translate(-280,-315);draw(ctx,b,time);ctx.restore();return true}
 return{definitions,select,init,update,damage,protection,draw,death,drawDeaths,intro,pictures};
});
