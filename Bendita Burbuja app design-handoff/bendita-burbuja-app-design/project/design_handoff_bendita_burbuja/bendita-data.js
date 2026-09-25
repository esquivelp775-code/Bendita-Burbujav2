(function(){
if(window.BB&&window.BB.__data)return;
const COST={jarabe_maracuya:.146552,jarabe_frambuesa:.146552,perla_mango:.120992,perla_maracuya:.085125,etiqueta:1.077586,popote:.439655,botella_mineral:6.034483,playo:.215517,hielo:.009333,tapioca_seca:.090944,azucar:.033684,polvo_taro:.542105,polvo_matcha:.510526,polvo_chai:.464361,te_negro:.421053,leche:.037895,leche_desl:.032632,avena_oatly:.050817,cafe_molido:.315789,crema_batir:.118153,jarabe_vainilla:.154265,base_moka:.331053,tisana_frutos:.757895,vaso_14:1.9/1.16,tapa_14:1.1/1.16,vaso_16:1.96/1.16,tapa_16:1.1/1.16,vaso_20:2.4/1.16,tapa_20:1.1/1.16,platano:19,malanga:19};
const EMP={etiqueta:1,popote:1,playo:1};
const CATS=[{k:'Soda italiana',label:'Sodas',min:3},{k:'Bubble tea',label:'Bubble tea',min:4},{k:'Café frío',label:'Café frío',min:2},{k:'Frutal',label:'Frutal',min:3},{k:'Botanas',label:'Botanas',min:0.5}];
const CAT={};CATS.forEach(c=>CAT[c.k]=c);
const E3=[['popote',1,0],['etiqueta',1,0],['playo',1,0]];
const TAP=[['hielo',90,1],['tapioca_seca',30,1],['azucar',12,1]];
const SODA=(j,p)=>j.concat([[p,30,1],['hielo',100,1],['botella_mineral',1,0]]);
const DRINKS=[
{n:1,nombre:'Pecado Tropical',cat:'Soda italiana',leche:false,p:[65,70,75],r:SODA([['jarabe_frambuesa',25,1]],'perla_mango')},
{n:2,nombre:'Pasión Prohibida',cat:'Soda italiana',leche:false,p:[60,65,70],r:SODA([['jarabe_frambuesa',25,1]],'perla_maracuya')},
{n:3,nombre:'Milagro Tropical',cat:'Soda italiana',leche:false,p:[65,70,75],r:SODA([['jarabe_maracuya',25,1]],'perla_mango')},
{n:4,nombre:'Amén de Maracuyá',cat:'Soda italiana',leche:false,p:[60,65,70],r:SODA([['jarabe_maracuya',25,1]],'perla_maracuya')},
{n:5,nombre:'Confesión de Sabores',cat:'Soda italiana',leche:false,p:[65,70,75],r:SODA([['jarabe_maracuya',12,1],['jarabe_frambuesa',13,1]],'perla_mango')},
{n:6,nombre:'Taro Celestial',cat:'Bubble tea',leche:true,p:[95,100,115],r:[['polvo_taro',30,1],['leche',180,1]].concat(TAP)},
{n:7,nombre:'Matcha Divino',cat:'Bubble tea',leche:true,p:[95,100,115],r:[['polvo_matcha',30,1],['leche',180,1]].concat(TAP)},
{n:8,nombre:'Bendita Original',cat:'Bubble tea',leche:true,p:[70,75,80],r:[['te_negro',5,1],['leche',180,1],['azucar',8,1]].concat(TAP)},
{n:9,nombre:'Chai Bendito',cat:'Bubble tea',leche:true,p:[90,95,110],r:[['polvo_chai',30,1],['leche',180,1]].concat(TAP)},
{n:10,nombre:'Penitencia Fría',cat:'Café frío',leche:false,p:[60,65,70],r:[['cafe_molido',20,1],['hielo',120,1]]},
{n:11,nombre:'Gloria de Vainilla',cat:'Café frío',leche:true,p:[70,75,85],r:[['cafe_molido',20,1],['hielo',110,1],['leche',45,1],['crema_batir',30,1],['jarabe_vainilla',15,1]]},
{n:12,nombre:'Tentación de Cacao',cat:'Café frío',leche:true,p:[85,90,100],r:[['cafe_molido',18,1],['base_moka',35,1],['leche',120,1],['hielo',95,1]]},
{n:13,nombre:'Alma Blanca',cat:'Café frío',leche:true,p:[80,85,95],r:[['cafe_molido',25,1],['leche',270,1],['hielo',95,1]]},
{n:14,nombre:'Frutos Rojos',cat:'Frutal',leche:false,p:[70,75,80],r:[['tisana_frutos',12,1],['perla_maracuya',30,1],['hielo',95,1]]},
{n:15,nombre:'Plátano Deshidratado',cat:'Botanas',botana:true,inv:'platano',p:[50,50,50],costo:19},
{n:16,nombre:'Malanga Natural',cat:'Botanas',botana:true,inv:'malanga',p:[50,50,50],costo:19}];
const BYN={};DRINKS.forEach(d=>BYN[d.n]=d);
const SIZES=[{k:'14',nombre:'14 oz',f:1,vaso:1.9,tapa:1.1,activo:true},{k:'16',nombre:'16 oz',f:1.14,vaso:1.96,tapa:1.1,activo:false},{k:'20',nombre:'20 oz',f:1.43,vaso:2.4,tapa:1.1,activo:false}];
const MILKS=[{nombre:'Entera',ins:'leche',extra:0},{nombre:'Deslactosada',ins:'leche_desl',extra:0},{nombre:'Avena',ins:'avena_oatly',extra:15}];
const ADDS=[{k:'tapioca',nombre:'Tapioca extra',precio:15,min:.2,r:[['tapioca_seca',30],['azucar',12]]},{k:'perlas',nombre:'Perlas explosivas extra',precio:20,min:.2,r:[['perla_mango',30]]},{k:'shot',nombre:'Shot de jarabe',precio:10,min:.1,r:[['jarabe_maracuya',15]]},{k:'espuma',nombre:'Espuma de vainilla',precio:20,min:1,r:[['leche',45],['crema_batir',30],['jarabe_vainilla',15]]},{k:'frappe',nombre:'Versión frappé',precio:10,min:2,r:[]}];
const ADD={};ADDS.forEach(a=>ADD[a.k]=a);
const CHN=['Uber Eats','Rappi','Evento'];
const CH={'Uber Eats':{com:.295,ret:true,color:'#5E0B0A',short:'Uber'},'Rappi':{com:.25,ret:true,color:'#B07A3A',short:'Rappi'},'Evento':{com:0,ret:false,color:'#44607A',short:'Evento'}};
const DOW=['dom','lun','mar','mié','jue','vie','sáb'];
const MON=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const DAYS=[];for(let i=0;i<14;i++){const d=new Date(2026,8,10+i);DAYS.push({i,date:d,dow:d.getDay(),label:DOW[d.getDay()]+' '+d.getDate()+' '+MON[d.getMonth()]});}
const EQUIPO_DIA=(237.8-0)/12/30.4;
const EVENTS=[{day:9,nombre:'Bazar de la 3 Sur',precio:75,traslado:180,equipoExtra:60,montajeHoras:2,tarifa:50}];
const evCost=e=>e.traslado+e.equipoExtra+e.montajeHoras*e.tarifa;
const TODAY_EVENTS=[{nombre:'Kermés Colegio Humboldt'},{nombre:'Mercadito Angelópolis'}];

const P={iva:.16,ind:2,retIsr:.025,retIva:.08,film:.35,fuera:50,meta:6000,uber:{base:.29,one:.01,prop:.5},rappi:.25,proyBase:200,utilProm:18.52,turnos:[{nombre:'Entre semana',dias:[1,2,3,4,5],ini:810,fin:990,tarifa:45},{nombre:'Fin de semana',dias:[6,0],ini:360,fin:780,tarifa:55}]};
function tarifa(dow,t){for(const x of P.turnos){if(x.dias.includes(dow)&&t>=x.ini&&t<x.fin)return x.tarifa;}return P.fuera;}
function calc(s){
  const d=BYN[s.n],sz=SIZES[s.tam||0],mk=MILKS[s.leche||0];
  const adds=d.botana?[]:(s.adds||[]).map(k=>ADD[k]);
  const base=s.precioLista!=null?s.precioLista:(s.canal==='Evento'&&!d.botana?(s.precioEvento||75):d.p[s.tam||0]);
  const precio=base+(d.leche?mk.extra:0)+adds.reduce((a,x)=>a+x.precio,0);
  const sinIva=precio/(1+P.iva),iva=precio-sinIva,com=precio*CH[s.canal].com;
  let ins=0,emp=0,ind=0,min;
  if(d.botana){ins=COST[d.inv];min=CAT.Botanas.min;}
  else{
    d.r.concat(E3).forEach(([k,q,sc])=>{if(k==='leche'&&d.leche)k=mk.ins;const c=q*(sc?sz.f:1)*COST[k];if(EMP[k])emp+=c;else ins+=c;});
    adds.forEach(a=>a.r.forEach(([k,q])=>{ins+=q*COST[k];}));
    emp+=COST['vaso_'+sz.k]+(sz.cierre==='film'?P.film:COST['tapa_'+sz.k]);ind=P.ind/(1+P.iva);
    min=CAT[d.cat].min+adds.reduce((a,x)=>a+x.min,0);
  }
  const tar=tarifa(s.dow,s.t),mo=min*tar/60;
  const util=sinIva-com-ins-emp-ind-mo;
  const ret=CH[s.canal].ret,retIsr=ret?sinIva*P.retIsr:0,retIva=ret?sinIva*P.retIva:0,ivaCom=com*P.iva;
  const dep=ret?precio-com-ivaCom-retIsr-retIva:precio;
  return {precio,sinIva,iva,com,ins,emp,ind,mo,util,retIsr,retIva,ivaCom,dep,min,tar};
}
function consumo(s){const d=BYN[s.n],o={},ad=(k,q)=>{o[k]=(o[k]||0)+q;};if(d.botana){ad(d.inv,1);return o;}const sz=SIZES[s.tam||0],mk=MILKS[s.leche||0];d.r.concat(E3).forEach(([k,q,sc])=>{if(k==='leche'&&d.leche)k=mk.ins;ad(k,q*(sc?sz.f:1));});(s.adds||[]).forEach(a=>ADD[a].r.forEach(([k,q])=>ad(k,q)));ad('vaso_'+sz.k,1);ad('tapa_'+sz.k,1);return o;}
function makeSale(s){s.dow=DAYS[s.day]?DAYS[s.day].dow:s.dow;s.c=calc(s);s.cons=consumo(s);return s;}

function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function pickW(R,W){let tot=0;for(const k in W)tot+=W[k];let x=R()*tot;for(const k in W){x-=W[k];if(x<=0)return +k;}return 6;}
const W_WD={6:13,7:9,8:8,9:7,1:5,2:5,3:5,4:3,5:3,10:3,11:4,12:4,13:3,14:6,15:1,16:1};
const W_WEm={10:11,11:9,12:8,13:10,6:3,7:3,8:3,9:2,1:2,2:2,3:2,4:1,5:1,14:3,15:1,16:1};
const W_WEd={6:8,7:6,8:5,9:5,1:5,2:4,3:5,4:3,5:3,10:5,11:5,12:5,13:5,14:6,15:1,16:1};
const W_EV={6:10,7:7,8:6,9:5,1:7,2:6,3:6,4:4,5:4,10:4,11:4,12:4,13:3,14:8,15:2,16:2};
function pickMilk(R,n){if(!BYN[n].leche)return 0;const r=R();return r<.72?0:r<.88?1:2;}
function pickAdds(R,n){const d=BYN[n];if(d.botana)return [];const a=[];
  if(d.cat==='Bubble tea'&&R()<.1)a.push('tapioca');
  if(d.cat==='Soda italiana'&&R()<.08)a.push('perlas');
  if(d.cat==='Café frío'&&R()<.08)a.push('espuma');
  if(R()<.04)a.push('shot');if(R()<.05)a.push('frappe');return a;}
function generate(){
  const R=rng(20260923);let id=1;const sales=[],orders=[];
  DAYS.forEach(day=>{
    const we=day.dow===0||day.dow===6,a=we?360:810,b=we?780:990;
    const target=we?36+Math.floor(R()*14):20+Math.floor(R()*12);
    let cnt=0;const ords=[];
    while(cnt<target){const r=R();const k=r<.65?1:r<.95?2:3;ords.push({k,t:a+Math.floor(((R()+R())/2)*(b-a-1))});cnt+=k;}
    ords.sort((x,y)=>x.t-y.t);
    ords.forEach(o=>{const oid=id++;const canal=R()<.55?'Uber Eats':'Rappi';orders.push({id:oid,day:day.i,t:o.t,canal});
      for(let j=0;j<o.k;j++){const W=!we?W_WD:(o.t<600?W_WEm:W_WEd);const n=pickW(R,W);
        sales.push(makeSale({id:id++,oid,day:day.i,t:o.t,n,tam:0,leche:pickMilk(R,n),adds:pickAdds(R,n),canal}));}});
    const ev=EVENTS.find(e=>e.day===day.i);
    if(ev){let c=0;const evo=[];while(c<100){const k=Math.min(R()<.8?1:2,100-c);evo.push({k,t:960+Math.floor(R()*240)});c+=k;}
      evo.sort((x,y)=>x.t-y.t);
      evo.forEach(o=>{const oid=id++;orders.push({id:oid,day:day.i,t:o.t,canal:'Evento',evento:ev.nombre});
        for(let j=0;j<o.k;j++){const n=pickW(R,W_EV);sales.push(makeSale({id:id++,oid,day:day.i,t:o.t,n,tam:0,leche:pickMilk(R,n),adds:[],canal:'Evento',precioEvento:ev.precio}));}});}
  });
  return {sales,orders};
}
function blank(){return {venta:0,iva:0,com:0,ins:0,emp:0,ind:0,mo:0,util:0,retIsr:0,retIva:0,dep:0,n:0,oids:{},pedidos:0,equipo:0,eventos:0,ganancia:0};}
function add(a,s){const c=s.c;a.venta+=c.precio;a.iva+=c.iva;a.com+=c.com;a.ins+=c.ins;a.emp+=c.emp;a.ind+=c.ind;a.mo+=c.mo;a.util+=c.util;a.retIsr+=c.retIsr;a.retIva+=c.retIva;a.dep+=c.dep;a.n++;if(!a.oids[s.oid]){a.oids[s.oid]=1;a.pedidos++;}}
function agg(list,day){
  const T=blank(),ch={},dr={},hr={};CHN.forEach(k=>ch[k]=blank());
  list.forEach(s=>{add(T,s);add(ch[s.canal],s);const x=dr[s.n]=dr[s.n]||{n:s.n,nombre:BYN[s.n].nombre,u:0,venta:0,util:0};x.u++;x.venta+=s.c.precio;x.util+=s.c.util;const h=Math.floor(s.t/60);hr[h]=(hr[h]||0)+1;});
  const ev=EVENTS.find(e=>e.day===day);
  T.equipo=T.n?(window.BB.equipoDia!=null?window.BB.equipoDia:EQUIPO_DIA):0;T.eventos=ev&&T.n?evCost(ev):0;T.ganancia=T.util-T.equipo-T.eventos;T.evento=ev||null;
  CHN.forEach(k=>{const a=ch[k];a.equipo=T.venta?T.equipo*a.venta/T.venta:0;a.eventos=k==='Evento'?T.eventos:0;a.ganancia=a.util-a.equipo-a.eventos;});
  T.ch=ch;T.drinks=Object.values(dr);T.hours=hr;return T;
}
const STOCK=[['tapioca_seca',1850],['polvo_taro',420],['polvo_matcha',610],['polvo_chai',380],['te_negro',640],['cafe_molido',1300],['base_moka',900],['tisana_frutos',140],['jarabe_maracuya',1450],['jarabe_frambuesa',1200],['jarabe_vainilla',700],['perla_mango',2100],['perla_maracuya',760],['leche',4000],['leche_desl',2000],['avena_oatly',3000],['crema_batir',600],['azucar',1800],['botella_mineral',22],['etiqueta',140],['popote',60],['playo',700]];
const INV={vasos:34,taro:420,value:STOCK.reduce((a,[k,q])=>a+q*COST[k],0)+34*(3/1.16)+8*19};
function money(v,dec){dec=dec==null?2:dec;const th=dec?0.005:0.5;const s='$'+Math.abs(v).toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec});return v<=-th?'('+s+') ▼':s;}
function pct(v){return (isFinite(v)?v:0).toFixed(1)+'\u00a0%';}
function hm(t){const h=Math.floor(t/60),m=t%60;return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');}
window.BB={__data:true,P,E3,consumo,COST,CATS,CAT,DRINKS,BYN,SIZES,MILKS,ADDS,ADD,CHN,CH,DAYS,EVENTS,evCost,TODAY_EVENTS,EQUIPO_DIA,tarifa,calc,makeSale,generate,agg,INV,money,pct,hm,DOW,MON};
})();
