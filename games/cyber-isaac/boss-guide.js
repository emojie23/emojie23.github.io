/* Story archive runs the same fixed-step boss bodies as combat, isolated from the run. */
window.NeonBossGuide=(()=>{
 'use strict';
 const host=document.getElementById('boss-demo'),canvas=document.getElementById('boss-demo-canvas'),ctx=canvas.getContext('2d');
 const cues={intro:['观察','辨认本体轮廓'],transform:['变形','动作结束后进入新形态'],crawl:['追猎','绕开虫身，不要贴脸'],burrow:['钻入','头部先下潜，尾部仍在地面'],underground:['潜行','跟随隆起，离开金色落点'],emerge:['出土','头部先破土，身体依次跟出'],spit:['攻击','侧移躲开吐息'],recover:['反击','抓住收势停顿'],hover:['观察','看清刀片的收拢与展开'],charge:['蓄力','收刀：准备向侧面躲闪'],dash:['突进','横向躲开路径'], 'spin-charge':['蓄力','展刀：离开刀阵范围'],spin:['旋斩','保持距离，等待减速'], 'fan-charge':['蓄力','展开装甲：准备扇形射击'],fan:['攻击','穿过弹幕空隙'],idle:['观察','等它压腿，找好退路'],crouch:['蓄力','离开金色落点'],leap:['腾空','移动避让，等待落地'],land:['落地','避开冲击与扩散震波']};
 const colors=['#ffb759','#93fff1','#c497ff'],bounds={x:86,y:78,w:1108,h:574,cx:640,cy:365};
 let floor=0,boss=null,last=0,shots=[],shown='',phaseWanted=0,camX=590,camY=290,zoom=1;
 const env={player:{x:680,y:460,r:16},hurt(){},burst(){},clear(){shots=[]},phase(){},shot(x,y,a,speed){if(shots.length<36)shots.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:2})}};
 function restart(){if(!floor)return;boss={x:590,y:290,hp:150,maxHp:150,invuln:0,color:colors[floor-1],name:NeonBosses.NAMES[floor-1]};NeonBosses.init(boss,floor,bounds);phaseWanted=0;shots=[];shown='';camX=floor===1?485:590;camY=290;zoom=1;last=performance.now();}
 function select(n){floor=n;host.hidden=!n;if(n){host.style.setProperty('--threat',colors[n-1]);document.getElementById('boss-demo-sector').textContent='SECTOR 0'+n;restart()}else boss=null;}
 document.getElementById('boss-demo-replay').onclick=restart;
 document.getElementById('boss-demo-phase').onclick=()=>{if(!boss)return;if(phaseWanted===2){restart();return}phaseWanted++;boss.hp=phaseWanted===1?98.9:49;};
 function frame(now){requestAnimationFrame(frame);const dt=Math.min(.04,Math.max(0,(now-last)/1000));last=now;if(!boss||host.hidden||!document.getElementById('story-screen').classList.contains('visible')||document.hidden)return;
  NeonBosses.update(boss,dt,env);ctx.clearRect(0,0,640,500);
  const points=boss.anatomy==='worm'?boss.worms.flatMap(w=>w.visible>0?w.segments.filter(s=>(s.cover??1)>.05):[{x:w.x,y:w.y}]):[{x:boss.x,y:boss.y-(boss.z||0)*.5}];
  if(boss.target&&['charge','dash','crouch','leap','underground','emerge'].includes(boss.action))points.push(boss.target);if(!points.length)points.push(boss);
  const xs=points.map(p=>p.x),ys=points.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),k=1-Math.exp(-dt*4);
  camX+=((minX+maxX)/2-camX)*k;camY+=((minY+maxY)/2-camY)*k;zoom+=(Math.min(1.15,550/(maxX-minX+210),280/(maxY-minY+210))-zoom)*k;
  ctx.save();ctx.translate(320,235);ctx.scale(zoom,zoom);ctx.translate(-camX,-camY);
  ctx.strokeStyle='#63828720';ctx.lineWidth=1;for(let x=100;x<1200;x+=80){ctx.beginPath();ctx.moveTo(x,90);ctx.lineTo(x,660);ctx.stroke()}for(let y=90;y<680;y+=80){ctx.beginPath();ctx.moveTo(100,y);ctx.lineTo(1200,y);ctx.stroke()}
  NeonBossArt.draw(ctx,boss,boss.clock);
  for(const p of shots){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;ctx.fillStyle='#ff536f';ctx.beginPath();ctx.arc(p.x,p.y,5,0,Math.PI*2);ctx.fill()}shots=shots.filter(p=>p.life>0);ctx.restore();
  if(shown!==boss.action){shown=boss.action;const cue=cues[shown]||['观察','读懂动作，再反击'];document.getElementById('boss-demo-stage').textContent=cue[0];document.getElementById('boss-demo-cue').textContent=cue[1];host.dataset.action=shown;}
  document.getElementById('boss-demo-form').textContent='形态 '+(boss.phase+1)+' / 3';
 }
 requestAnimationFrame(frame);
 return{select,snapshot:()=>boss?NeonBosses.snapshot(boss):null};
})();
