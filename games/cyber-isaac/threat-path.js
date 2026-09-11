/* Shared forward-only path for warning geometry and actual charge travel. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NeonThreatPath=api})(globalThis,()=>{
 function lock(entity,target,bounds,obstacles,maxLength=164){
  const angle=Math.atan2(target.y-entity.y,target.x-entity.x),dx=Math.cos(angle),dy=Math.sin(angle),r=entity.r;
  let length=maxLength;
  if(dx>1e-8)length=Math.min(length,(bounds.x+bounds.w-r-entity.x)/dx);else if(dx<-1e-8)length=Math.min(length,(bounds.x+r-entity.x)/dx);
  if(dy>1e-8)length=Math.min(length,(bounds.y+bounds.h-r-entity.y)/dy);else if(dy<-1e-8)length=Math.min(length,(bounds.y+r-entity.y)/dy);
  for(const o of obstacles){const ox=entity.x-o.x,oy=entity.y-o.y,rr=r+o.r,c=ox*ox+oy*oy-rr*rr,b=ox*dx+oy*dy,disc=b*b-c;if(c<-.001){length=0;break}if(disc>=0){const t=-b-Math.sqrt(disc);if(t>=-.001)length=Math.min(length,Math.max(0,t));}}
  length=Math.max(0,length-.5);return{x:entity.x,y:entity.y,angle,dx,dy,length,width:r*2,endX:entity.x+dx*length,endY:entity.y+dy*length};
 }
 function advance(e,path,distance){const travelled=Math.min(path.length,(e.chargeTravel||0)+distance);e.chargeTravel=travelled;e.x=path.x+path.dx*travelled;e.y=path.y+path.dy*travelled;return travelled>=path.length;}
 return{lock,advance};
});
