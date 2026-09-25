(function(){
const B=window.BB;if(B.__ops)return;B.__ops=true;
B.TODAY=13;
B.COST0=Object.assign({},B.COST);
B.tkey=(d,t)=>d*1440+t;
B.consOf=s=>B.consumo(s);
B.equipoDiaOf=list=>list.reduce((s,x)=>s+(x.costo-(x.rescate||0))/x.vida,0)/30.4;
B.daysSince=f=>Math.round((new Date(2026,8,23,12)-new Date(f+'T12:00:00'))/864e5);
B.assetOf=a=>{const dm=(a.costo-(a.rescate||0))/a.vida,m=Math.max(0,B.daysSince(a.fecha)/30.4),p=Math.min(1,m/a.vida);return {dm,pct:p,valor:a.costo-(a.costo-(a.rescate||0))*p};};
B.invState=function(inv,sales){
  const st={},start={};let any=false;
  inv.moves.forEach(m=>{st[m.k]=(st[m.k]||0)+m.q;if(m.tipo==='inicial'){any=true;const x=B.tkey(m.day,m.t);if(start[m.k]==null||x<start[m.k])start[m.k]=x;}});
  const rate={};
  sales.forEach(s=>{const x=B.tkey(s.day,s.t);for(const k in s.cons){rate[k]=(rate[k]||0)+s.cons[k]/13.5;if(start[k]!=null&&x>=start[k])st[k]=(st[k]||0)-s.cons[k];}});
  const ref={};inv.moves.forEach(m=>{if(m.tipo==='compra'||m.tipo==='inicial'){const x=B.tkey(m.day,m.t);if(ref[m.k]==null||x>=ref[m.k])ref[m.k]=x;}});
  const norm={};Object.keys(ref).forEach(k=>{let v=0;inv.moves.forEach(m=>{if(m.k===k&&B.tkey(m.day,m.t)<=ref[k])v+=m.q;});sales.forEach(s=>{const q=s.cons[k];if(!q)return;const x=B.tkey(s.day,s.t);if(start[k]!=null&&x>=start[k]&&x<ref[k])v-=q;});norm[k]=Math.max(0,v);});
  const rows={};let value=0,reponer=0,abiertos=0,caducan=0;
  B.ITEMS.forEach(k=>{
    const def=B.ITEM_DEF[k],it=inv.items[k],raw=st[k]||0,s=Math.max(0,raw),r=rate[k]||0,days=r>0?s/r:null;
    let cad=null;if(def.caduca&&it.abierto!=null&&s>0)cad=it.abierto+def.caduca-B.TODAY;
    const inactive=/_(16|20)$/.test(k)&&s<=0&&!r;
    const pr=it.prioridad||B.PRIO[k]||'media',um=it.umbral!=null?it.umbral:B.UMB[pr],normal=it.normal!=null?it.normal:(norm[k]||0),pct=normal>0?s/normal:null;
    let tag='OK';
    if(inactive)tag='—';
    else if(s<=0.0001)tag='Agotado';
    else if(cad!=null&&cad<=Math.min(2,def.caduca-1))tag='Por caducar';
    else if(it.minimo!=null?s<it.minimo:(pct!=null&&pct<um))tag='Bajo';
    if(tag==='Agotado'||tag==='Bajo')reponer++;
    if(cad!=null)abiertos++;
    if(tag==='Por caducar')caducan++;
    const v=s*it.cu;value+=v;
    rows[k]={k,def,it,stock:s,raw,rate:r,days,cad,tag,value:v,inactive,pr,um,normal,pct};
  });
  return {counted:any,rows,value,reponer,abiertos,caducan};
};
B.usesOf=function(k){
  const out=[],alt=k==='leche_desl'||k==='avena_oatly',pack=['popote','etiqueta','playo','vaso_14','tapa_14'].includes(k);
  B.DRINKS.forEach(d=>{if(d.activa===false)return;let q=0;
    if(d.botana){if((d.n===15&&k==='platano')||(d.n===16&&k==='malanga'))q=1;}
    else{if(pack)q=1;d.r.forEach(([kk,qq])=>{if(kk===k||(alt&&d.leche&&kk==='leche'))q+=qq;});}
    if(q>0)out.push({nombre:d.nombre,q,nota:alt?'si la piden con '+(k==='avena_oatly'?'avena':'deslactosada'):''});});
  B.ADDS.forEach(a=>a.r.forEach(([kk,qq])=>{if(kk===k)out.push({nombre:a.nombre,q:qq,nota:'adicional'});}));
  return out;
};
B.kardex=function(inv,sales,k){
  const ev=[];let start=null;
  inv.moves.forEach(m=>{if(m.k!==k)return;const x=B.tkey(m.day,m.t);if(m.tipo==='inicial'&&(start==null||x<start))start=x;ev.push({x,day:m.day,t:m.t,tipo:m.tipo,q:m.q,nota:m.nota||''});});
  const by={};
  sales.forEach(s=>{const q=s.cons[k];if(!q)return;const x=B.tkey(s.day,s.t);if(start==null||x<start)return;const b=by[s.day]=by[s.day]||{q:0,n:0,t:0};b.q+=q;b.n++;b.t=Math.max(b.t,s.t);});
  Object.keys(by).forEach(d=>{const b=by[d];ev.push({x:B.tkey(+d,b.t)+.5,day:+d,t:b.t,tipo:'venta',q:-b.q,nota:b.n+(b.n>1?' bebidas':' bebida')});});
  ev.sort((a,b)=>a.x-b.x);let bal=0;ev.forEach(e=>{bal+=e.q;e.bal=bal;});
  return ev.reverse();
};
B.weekCons=function(sales,k){const d=new Array(14).fill(0);sales.forEach(s=>{if(s.cons[k])d[s.day]+=s.cons[k];});return d;};
B.priceHistory=function(inv,k){const out=[];inv.purchases.forEach(p=>p.lines.forEach(l=>{if(l.k===k)out.push({prov:p.prov,precio:l.precio,day:p.day,n:l.n,factura:p.factura});}));out.sort((a,b)=>b.day-a.day);return out;};
B.recipeInfo=function(d){
  const obj=d.botana?null:(B.OBJ[d.cat]!=null?B.OBJ[d.cat]:17.5);
  const sizes=[0,1,2].map(tam=>{
    const c=B.calc({n:d.n,tam,leche:0,adds:[],canal:'Uber Eats',dow:2,t:840});
    const fixed=c.ins+c.emp+c.ind+c.mo,P=d.p[tam],deja=(p,com)=>p/(1+B.P.iva)-p*com-fixed;
    const sug=obj==null?null:Math.ceil((obj+fixed)/(1/(1+B.P.iva)-B.CH['Uber Eats'].com)/5)*5;
    return {tam,c,fixed,P,uber:deja(P,.295),rappi:deja(P,.25),evento:deja(P,0),sug,below:obj!=null&&deja(P,.295)<obj-0.005,deja};
  });
  const rises=[];
  if(!d.botana)d.r.forEach(([k])=>{if(B.COST0[k]&&B.COST[k]>B.COST0[k]*1.005&&!rises.find(r=>r.k===k))rises.push({k,nombre:B.ITEM_DEF[k].nombre,pct:(B.COST[k]/B.COST0[k]-1)*100});});
  return {obj,sizes,rises,s0:sizes[0]};
};
B.PRIO={tapioca_seca:'alta',polvo_taro:'alta',polvo_matcha:'alta',polvo_chai:'alta',base_moka:'alta',cafe_molido:'alta',leche:'alta',vaso_14:'alta',tapa_14:'alta',vaso_16:'alta',tapa_16:'alta',vaso_20:'alta',tapa_20:'alta',jarabe_maracuya:'media',jarabe_frambuesa:'media',jarabe_vainilla:'media',perla_mango:'media',perla_maracuya:'media',te_negro:'media',tisana_frutos:'media',leche_desl:'media',avena_oatly:'media',crema_batir:'media',popote:'media',etiqueta:'media',playo:'media',azucar:'baja',hielo:'baja',botella_mineral:'baja',platano:'media',malanga:'media'};
B.UMB={alta:.3,media:.25,baja:.2};
B.shoppingList=function(S,inv){const by={};Object.values(S.rows).forEach(r=>{if(r.inactive||(r.tag!=='Bajo'&&r.tag!=='Agotado'))return;const d=r.def,h=B.priceHistory(inv,r.k)[0],prov=h?h.prov:d.prov,precio=h?h.precio:d.precio,need=Math.max(0,(r.normal||d.cont)-r.stock),n=Math.max(1,Math.ceil(need/d.cont));(by[prov]=by[prov]||[]).push({k:r.k,nombre:d.nombre,pres:d.pres,n,precio,costo:n*precio,pct:r.pct,pr:r.pr,tag:r.tag});});return Object.keys(by).sort().map(prov=>({prov,items:by[prov],total:by[prov].reduce((a,x)=>a+x.costo,0)}));};
B.invAlerts=function(S){
  const ord={'Agotado':0,'Por caducar':1,'Bajo':2};
  return Object.values(S.rows).filter(r=>ord[r.tag]!=null).sort((a,b)=>ord[a.tag]-ord[b.tag]||(a.days||0)-(b.days||0)).map(r=>{
    const d=r.def,uses=B.usesOf(r.k).filter(u=>u.nota!=='adicional');let text,sub;
    if(r.tag==='Agotado'){text=d.nombre+': se acabó';sub=uses.length?'lo usan '+uses.length+(uses.length>1?' bebidas':' bebida')+' · '+d.prov:d.prov;}
    else if(r.tag==='Por caducar'){text=d.nombre+' abierta hace '+(B.TODAY-r.it.abierto)+' días — caduca en '+r.cad;sub=d.pres+' · abierta el '+B.dayLabel(r.it.abierto);}
    else{
      text=d.nombre+(r.pct!=null?' al '+Math.round(r.pct*100)+' %':' bajo su mínimo')+' — agrégalo a la lista';
      sub='Prioridad '+r.pr+' · avisa al '+Math.round(r.um*100)+' %'+(r.days!=null?' · te alcanza para '+(r.days<1?'hoy':Math.floor(r.days)+(Math.floor(r.days)===1?' día':' días')):'');
    }
    return {k:r.k,tag:r.tag,text,sub};
  });
};
})();
