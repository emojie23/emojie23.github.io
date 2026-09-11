/* Original generated environment, projected around the unchanged gameplay plane. */
window.NeonDepth = (() => {
  'use strict';
  const SCALE = .9, OX = 64, OY = 69.5;
  const image = new Image();
  image.src = 'assets/depth/sunken-chamber-v2.webp';
  let loaded = false, failed = false, terrainBuilds = 0;
  image.onload = () => { loaded = true; };
  image.onerror = () => { failed = true; console.warn('Depth backdrop unavailable: using local procedural floor.'); };
  const cache = new WeakMap();
  const point = (x,y) => ({x:OX+x*SCALE,y:OY+y*SCALE});
  function project(ctx) {ctx.translate(OX, OY);ctx.scale(SCALE,SCALE);}
  function unproject(x,y) {return {x:(x-OX)/SCALE,y:(y-OY)/SCALE};}
  function polygon(ctx, points, fill, stroke) {
    ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();
    ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}
  }
  // Affine triangles unwrap the generated sloping room onto an exact gameplay rectangle.
  // Only the backdrop is warped; actors, collision and aim share one uniform transform.
  function triangle(ctx,s,d) {
    const [a,b,c]=s,[p,q,r]=d,den=(b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y);
    const A=((q.x-p.x)*(c.y-a.y)-(r.x-p.x)*(b.y-a.y))/den;
    const C=((r.x-p.x)*(b.x-a.x)-(q.x-p.x)*(c.x-a.x))/den;
    const B=((q.y-p.y)*(c.y-a.y)-(r.y-p.y)*(b.y-a.y))/den;
    const D=((r.y-p.y)*(b.x-a.x)-(q.y-p.y)*(c.x-a.x))/den;
    ctx.save();ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.lineTo(r.x,r.y);ctx.closePath();ctx.clip();
    ctx.transform(A,B,C,D,p.x-A*a.x-C*a.y,p.y-B*a.x-D*a.y);ctx.drawImage(image,0,0);ctx.restore();
  }
  function backdrop(ctx,room,bounds,links,floor) {
    const tl=point(bounds.x,bounds.y),br=point(bounds.x+bounds.w,bounds.y+bounds.h),mid=point(bounds.cx,bounds.cy);
    ctx.fillStyle='#090e13';ctx.fillRect(0,0,1280,720);
    if(loaded) {
      const sy=[0,218,480,790,941],left=[210,322,267,214,0],right=[1462,1350,1405,1458,1672];
      const dy=[0,tl.y,mid.y,br.y,720],dx=[0,tl.x,mid.x-57,mid.x+57,br.x,1280];
      const rows=sy.map((y,i)=>[0,left[i],745,930,right[i],1672].map(x=>({x:x*image.naturalWidth/1672,y:y*image.naturalHeight/941})));
      // Degenerate outer corner cells are avoided by leaving a narrow outer strip.
      rows[4][1].x=1;rows[4][4].x=image.naturalWidth-1;
      for(let j=0;j<4;j++)for(let i=0;i<5;i++) {
        const s=[rows[j][i],rows[j][i+1],rows[j+1][i+1],rows[j+1][i]];
        const d=[{x:dx[i],y:dy[j]},{x:dx[i+1],y:dy[j]},{x:dx[i+1],y:dy[j+1]},{x:dx[i],y:dy[j+1]}];
        triangle(ctx,[s[0],s[1],s[2]],[d[0],d[1],d[2]]);triangle(ctx,[s[0],s[2],s[3]],[d[0],d[2],d[3]]);
      }
      const visible=new Set(links.filter(n=>n.room.type!=='secret'||n.room.revealed).map(n=>n.dir));
      // The generated sheet has four openings: seal every non-existent/hidden exit.
      const crop=(sx,sy,sw,sh,x,y,w,h)=>ctx.drawImage(image,sx*image.naturalWidth/1672,sy*image.naturalHeight/941,sw*image.naturalWidth/1672,sh*image.naturalHeight/941,x,y,w,h);
      if(!visible.has('up'))crop(320,0,200,218,mid.x-69,0,138,tl.y+2);
      if(!visible.has('down'))crop(350,790,180,151,mid.x-73,br.y-2,146,722-br.y);
      if(!visible.has('left'))crop(70,583,175,150,0,mid.y-83,tl.x+3,166);
      if(!visible.has('right'))crop(1420,583,175,150,br.x-3,mid.y-83,1283-br.x,166);
    } else {
      ctx.fillStyle='#263039';ctx.fillRect(tl.x,tl.y,br.x-tl.x,br.y-tl.y);
      ctx.strokeStyle='#435460';ctx.lineWidth=12;ctx.strokeRect(tl.x-7,tl.y-7,br.x-tl.x+14,br.y-tl.y+14);
    }
    ctx.save();ctx.beginPath();ctx.rect(tl.x,tl.y,br.x-tl.x,br.y-tl.y);ctx.clip();
    const tint=['#082938','#180f36','#310e25','#302707','#300c12','#240c2a'][(floor-1)%6];
    ctx.fillStyle=tint;ctx.globalAlpha=.16;ctx.fillRect(tl.x,tl.y,br.x-tl.x,br.y-tl.y);ctx.globalAlpha=1;
    const shade=ctx.createLinearGradient(0,tl.y,0,tl.y+34);shade.addColorStop(0,'#0007');shade.addColorStop(1,'#0000');ctx.fillStyle=shade;ctx.fillRect(tl.x,tl.y,br.x-tl.x,34);ctx.restore();
  }
  function block(ctx,o) {
    const a=o.wallGroup?o.wallAngle:0,w=o.wallGroup?o.wallStep+7:o.r*1.55,h=o.wallGroup?o.r*1.22:o.r*1.55;
    const height=o.wallGroup?22:28,c=Math.cos(a),s=Math.sin(a);
    const base=[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([x,y])=>[o.x+x*c-y*s,o.y+x*s+y*c]);
    const top=base.map(([x,y])=>[x,y-height]),edge=o.breakable?'#bb7699':'#8dabad';
    polygon(ctx,base.map(([x,y])=>[x+9,y+9]),'#0005');
    ctx.lineWidth=1.5;
    const texture=(quad,sx,sy,sw,sh)=>{if(!loaded)return;const kx=image.naturalWidth/1672,ky=image.naturalHeight/941,src=[{x:sx*kx,y:sy*ky},{x:(sx+sw)*kx,y:sy*ky},{x:(sx+sw)*kx,y:(sy+sh)*ky},{x:sx*kx,y:(sy+sh)*ky}],dst=quad.map(([x,y])=>({x,y}));triangle(ctx,[src[0],src[1],src[2]],[dst[0],dst[1],dst[2]]);triangle(ctx,[src[0],src[2],src[3]],[dst[0],dst[2],dst[3]]);};
    for(let i=0;i<4;i++){const j=(i+1)%4;if(base[j][0]<=base[i][0]){const face=[top[j],top[i],base[i],base[j]];polygon(ctx,face,i===2?'#28343d':'#35424a','#111c24');texture(face,360,837,180,55);}}
    polygon(ctx,top,'#7c8687','#1c2931');
    texture(top,320,25,140,25);
    const inner=top.map(([x,y])=>[o.x+(x-o.x)*.78,o.y-height+(y-(o.y-height))*.69]);
    ctx.globalAlpha=.32;polygon(ctx,inner,o.breakable?'#665965':'#a2aaa5',edge);ctx.globalAlpha=1;
    ctx.strokeStyle=o.breakable?'#f995b9':'#9ee1db';ctx.lineWidth=2;ctx.beginPath();
    ctx.moveTo(top[3][0]+(top[2][0]-top[3][0])*.16,top[3][1]+(top[2][1]-top[3][1])*.16+7);
    ctx.lineTo(top[3][0]+(top[2][0]-top[3][0])*.84,top[3][1]+(top[2][1]-top[3][1])*.84+7);ctx.stroke();
  }
  function obstacles(ctx,objects) {
    let layer=cache.get(objects);
    if(!layer||layer.count!==objects.length) {
      const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;const c=canvas.getContext('2d');
      [...objects].sort((a,b)=>a.y-b.y).forEach(o=>block(c,o));layer={canvas,count:objects.length};cache.set(objects,layer);terrainBuilds++;
    }
    ctx.drawImage(layer.canvas,0,0);
  }
  function door(ctx,p,dir,color,locked,cost) {
    const vertical=dir==='left'||dir==='right',sign=dir==='up'||dir==='left'?-1:1;
    const local=(u,v)=>vertical?[p.x+sign*v,p.y+u]:[p.x+u,p.y+sign*v];
    const quad=(a,b,c,d,fill,stroke)=>polygon(ctx,[local(...a),local(...b),local(...c),local(...d)],fill,stroke);
    ctx.save();ctx.lineWidth=2;
    quad([-56,-4],[56,-4],[65,72],[-65,72],'#080e15','#45545c');
    quad([-65,-5],[-53,-5],[-53,76],[-75,76],'#87918e','#26383d');
    quad([53,-5],[65,-5],[75,76],[53,76],'#657273','#26383d');
    for(let v=13;v<65;v+=15)quad([-49,v],[49,v],[49,v+3],[-49,v+3],'#33414b');
    if(locked){quad([-51,4],[51,4],[51,52],[-51,52],'#34222e',color);for(let u=-40;u<=40;u+=20)quad([u,5],[u+4,5],[u+4,51],[u,51],color);}
    quad([-50,-3],[50,-3],[50,2],[-50,2],color);
    if(cost&&!locked){ctx.fillStyle=color;ctx.font='900 14px Consolas';ctx.textAlign='center';const q=local(0,25);ctx.fillText('◇ '+cost,q[0],q[1]);}
    ctx.restore();
  }
  return {project,unproject,point,backdrop,obstacles,door,get ready(){return loaded},get failed(){return failed},diagnostics:()=>({ready:loaded,failed,scale:SCALE,offset:{x:OX,y:OY},terrainBuilds})};
})();
