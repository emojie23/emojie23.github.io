/* Original content expansion. Pure configuration and seeded event rules. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NeonExpansionData=api})(globalThis,()=>{
 const rows=[
 ['conductive','导电标记','命中标记目标 4 秒；电弧优先选择标记目标。','electric','common',1,'weapon'],
 ['arc-relay','弧光中继','电弧距离 +60；有特斯拉突触时额外跳跃一次。','electric','advanced',2,'weapon'],
 ['capacitor','脉冲电容','每 6 次有效命中向附近目标放电，造成单发 80% 伤害。','electric','rare',2,'skill'],
 ['ember','熔芯弹药','命中施加灼烧，3 秒内造成单发 60% 伤害；重复命中刷新。','fire','common',1,'weapon'],
 ['flashpoint','爆燃核心','灼烧目标累计 5 次命中爆燃，对周围造成单发 120% 伤害。','fire','advanced',2,'weapon'],
 ['ash-leech','余烬回收','灼烧目标被击杀时恢复 1 电池格，冷却 12 秒。','fire','rare',3,'skill'],
 ['wall-split','折射分枝','弹体首次反弹后分出 2 枚 45% 伤害弹；分枝不再繁殖。','bounce','advanced',2,'weapon'],
 ['rebound-aim','寻迹棱镜','反弹弹体缓慢转向最近敌人；不会穿过墙体。','bounce','rare',2,'weapon'],
 ['kinetic','动能回收','反弹弹速 +15%；反弹后伤害额外 +20%。','bounce','common',1,'weapon'],
 ['hive-core','蜂巢主核','额外部署 1 架无人机，与现有无人机叠加。','drone','advanced',2,'skill'],
 ['shared-bus','共感总线','无人机继承导电标记、灼烧和爆燃效果。','drone','rare',3,'skill'],
 ['drone-reactor','微型反应堆','无人机伤害随楼层战力成长，射击间隔 -20%。','drone','advanced',2,'skill'],
 ['shield-coil','破盾线圈','护盾耗尽时清除近身弹幕、放电反击并获得 1.5 秒保护。','shield','advanced',2,'skill'],
 ['repair-loop','自修复回路','清理普通战斗房后恢复 1 层护盾。','shield','common',1,'skill'],
 ['aegis-charge','满载电容','满护盾时伤害 +20%；护盾不满时射速 +10%。','shield','rare',2,'core'],
 ['redline','红线超频','生命不高于一半时射击间隔 -25%。','risk','advanced',2,'core'],
 ['bloodbank','生物蓄能罐','每击杀 12 个普通敌人恢复 1 电池格，跨房间累计。','risk','common',1,'skill'],
 ['martyr','殉道晶片','最大生命 -1 电池格（最低 2），暴击率 +10%。','risk','rare',3,'core']
 ];
 const tags={electric:['电击','#70edf5'],fire:['爆燃','#ffad65'],bounce:['反弹','#af97ff'],drone:['机群','#b4eebb'],shield:['护盾','#66d2ff'],risk:['血契','#ff749a']};
 const recipes=[
 ['电网回响',['conductive','arc-relay','tesla'],'标记优先；电弧跳跃 2 次，覆盖更远。'],
 ['熔断连锁',['ember','flashpoint'],'灼烧目标五次命中引发范围爆燃。'],
 ['折射猎群',['wall-split','rebound-aim'],'墙面分枝后缓慢追敌；仅允许一代分枝。'],
 ['共感蜂巢',['hive-core','shared-bus','ember'],'额外无人机共享灼烧，为爆燃积累命中。'],
 ['攻防电池',['shield-coil','repair-loop'],'清房恢复护盾，下一次破盾再次触发反击。'],
 ['濒危过载',['redline','votive'],'低血量同时提高伤害、射速和暴击率。']
 ];
 const items=rows.map((r,i)=>({id:r[0],name:r[1],desc:r[2],build:r[3],rarity:r[4],minFloor:r[5],category:r[6],glyph:String(i+1),icon:i,color:tags[r[3]][1],tag:tags[r[3]][0]+'构筑',synergy:'适配：'+rows.filter(s=>s[3]===r[3]&&s!==r).map(s=>s[1]).join('、')+'；'+(r[3]==='electric'?'特斯拉突触。':'同类效果可协同。')}));
 const buffs={power:{name:'火力祝福',desc:'伤害 +30%',duration:40,color:'#ffb371'},haste:{name:'神经加速',desc:'移动速度 +20%',duration:40,color:'#7bffeb'},surge:{name:'超频祝福',desc:'射击间隔 -25%',duration:35,color:'#e0a2ff'},focus:{name:'精准祝福',desc:'暴击率 +20%',duration:40,color:'#fff188'},pierce:{name:'相位祝福',desc:'敌人穿透 +2，不穿墙',duration:40,color:'#9fb4ff'},siphon:{name:'生命回响',desc:'击杀回血 1 格，冷却 8 秒',duration:35,color:'#ff88ab'}};
 function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296}}
 function wish(uses,misses,roll){if(uses>=3)return null;return misses>=2?'relic':roll<.25?'relic':roll<.70?'buff':'supply'}
 function active(ids){return recipes.filter(r=>r[1].every(id=>ids.includes(id)))}
 function addBranch(rooms,floor,seed){const random=rng(seed+floor*7919),types=['fountain','workshop','altar'],type=floor===1?'fountain':types[(floor-1+seed%3)%3],occupied=new Set(rooms.map(r=>`${r.x},${r.y}`)),boss=rooms.find(r=>r.type==='boss'),slots=[];
  for(const r of rooms.filter(r=>['start','combat','treasure'].includes(r.type)))for(const [dx,dy]of [[0,1],[0,-1],[-1,0],[1,0]]){const x=r.x+dx,y=r.y+dy;if(!occupied.has(`${x},${y}`)&&(!boss||Math.abs(x-boss.x)+Math.abs(y-boss.y)>1))slots.push({x,y})}if(!slots.length)return;
  const pos=slots[Math.floor(random()*slots.length)];rooms.push({...pos,key:`${pos.x},${pos.y}`,index:rooms.length,type,cleared:true,revealed:true,visited:false,event:{uses:0,misses:0,taken:false,seed:seed+floor*997,result:'',buff:null}});
 }
 return{items,buffs,recipes,tags,rng,wish,active,addBranch};
});
