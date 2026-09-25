(function(){
const B=window.BB;if(B.__inv)return;B.__inv=true;
const T=(k,nombre,cat,pres,cont,u,precio,iva,merma,verificado,caduca,prov)=>({k,nombre,cat,pres,cont,u,precio,iva,merma,verificado,caduca,prov});
const RAW=[
T('polvo_taro','Polvo taro premium','polvo','Bolsa 1 kg',1000,'g',515,0,.05,true,null,'Ziaba Gourmet'),
T('polvo_matcha','Polvo matcha','polvo','Bolsa 1 kg',1000,'g',485,0,.05,true,null,'Ziaba Gourmet'),
T('polvo_chai','Polvo chai','polvo','Bolsa 700 g',700,'g',308.8,0,.05,true,null,'Ziaba Gourmet'),
T('base_moka','Base en polvo moka','polvo','Chillout 2 kg',2000,'g',629,0,.05,true,null,'Barra Pro'),
T('leche','Leche entera','lacteo','Alpura Selecta 1 L',1000,'ml',36,0,.05,true,5,'Walmart'),
T('leche_desl','Leche deslactosada','lacteo','Alpura Deslactosada 1 L',1000,'ml',31,0,.05,true,5,'Walmart'),
T('avena_oatly','Bebida de avena barista','lacteo','Oatly Barista 1 L',1000,'ml',56,.16,.05,true,7,'Abasto Vegano'),
T('crema_batir','Crema para batir','lacteo','Lyncott 980 ml',980,'ml',110,0,.05,true,5,'Walmart'),
T('jarabe_maracuya','Jarabe agave maracuyá','jarabe','Botella 1 L',1000,'ml',161.5,.16,.05,true,null,'Café Etrusca'),
T('jarabe_frambuesa','Jarabe agave frambuesa','jarabe','Botella 1 L',1000,'ml',161.5,.16,.05,true,null,'Café Etrusca'),
T('jarabe_vainilla','Jarabe de vainilla','jarabe','Chillout agave azul 1 L',1000,'ml',170,.16,.05,false,null,'Café Etrusca'),
T('tapioca_seca','Tapioca seca','perla','Tea Zone 2.72 kg',2720,'g',235,0,.05,true,null,'Ziaba Gourmet'),
T('perla_mango','Perla explosiva mango','perla','Bote 3 kg',3000,'g',400,.16,.05,true,null,'COLDAY'),
T('perla_maracuya','Perla explosiva maracuyá','perla','Bote 1.25 kg',1250,'g',117.26,.16,.05,true,null,'COLDAY'),
T('cafe_molido','Café molido para cold brew','cafe','Bolsa 1 kg',1000,'g',300,0,.05,false,null,'Café Etrusca'),
T('te_negro','Té negro a granel','cafe','Bolsa 1 kg',1000,'g',400,0,.05,false,null,'Café Etrusca'),
T('tisana_frutos','Tisana frutos rojos','cafe','Chillout 250 g',250,'g',180,0,.05,false,null,'Café Etrusca'),
T('hielo','Hielo en cubo','base','Bolsa 5 kg',5000,'g',35,0,.25,false,2,'Tienda local'),
T('azucar','Azúcar estándar','base','Bolsa 1 kg',1000,'g',32,0,.05,false,null,'Walmart'),
T('botella_mineral','Agua mineral individual','base','Botella 500 ml',1,'pz',7,.16,0,true,null,'Walmart'),
T('etiqueta','Etiqueta','empaque','288 piezas',288,'pz',360,.16,0,false,null,'Desechables del Centro'),
T('popote','Popote ancho','empaque','Bolsa ~100 pz',100,'pz',51,.16,0,false,null,'Desechables del Centro'),
T('playo','Playo grado alimenticio','empaque','Rollo 500 m = 1,000 vasos',1000,'pz',250,.16,0,false,null,'Desechables del Centro'),
T('vaso_14','Vaso 14 oz','vaso','Paquete 50 pz',50,'pz',95,.16,0,true,null,'Desechables del Centro'),
T('tapa_14','Tapa 14 oz','vaso','Paquete 50 pz',50,'pz',55,.16,0,true,null,'Desechables del Centro'),
T('vaso_16','Vaso 16 oz','vaso','Paquete 50 pz',50,'pz',98,.16,0,true,null,'Desechables del Centro'),
T('tapa_16','Tapa 16 oz','vaso','Paquete 50 pz',50,'pz',55,.16,0,false,null,'Desechables del Centro'),
T('vaso_20','Vaso 20 oz','vaso','Paquete 50 pz',50,'pz',120,.16,0,true,null,'Desechables del Centro'),
T('tapa_20','Tapa 20 oz','vaso','Paquete 50 pz',50,'pz',55,.16,0,false,null,'Desechables del Centro'),
T('platano','Plátano deshidratado','botana','Bolsita',1,'pz',19,0,0,true,null,'Productor local'),
T('malanga','Malanga natural','botana','Bolsita',1,'pz',19,0,0,true,null,'Productor local')];
B.ITEM_DEF={};B.ITEMS=[];RAW.forEach(r=>{B.ITEM_DEF[r.k]=r;B.ITEMS.push(r.k);});
B.GROUPS=[['polvo','Polvos'],['lacteo','Lácteos'],['jarabe','Jarabes'],['perla','Perlas y tapioca'],['cafe','Café y té'],['base','Bases'],['empaque','Empaque'],['vaso','Vasos y tapas'],['botana','Botanas']];
B.PROVS=['Ziaba Gourmet','Café Etrusca','Barra Pro','COLDAY','Walmart','Abasto Vegano','Tienda local','Desechables del Centro','Productor local'];
B.REFS={jarabe_vainilla:[{prov:'Monin',precio:279,cont:750,nota:'cotización'}],cafe_molido:[{prov:'XicoCafé',precio:329,cont:1000,nota:'cotización'},{prov:'Orgánico de Chiapas',precio:360,cont:1000,nota:'mayoreo · pide 5 kg'}],te_negro:[{prov:'Soy Té',precio:1350,cont:1000,nota:'de especialidad'}]};
B.OBJ={'Soda italiana':13.25};
B.ADD_DESC={tapioca:'Otra porción de tapioca negra',perlas:'Otra cucharada de perlas del sabor que elijas',shot:'Un bombeo más del sabor que quieras',espuma:'La capa de espuma fría encima de cualquier café',frappe:'La misma bebida licuada con hielo'};
const DESC={1:'Frambuesa burbujeante con perlas de mango que revientan a cada trago. Dulce, frutal y bien fría.',2:'Frambuesa con perlas de maracuyá. Dulce arriba, ácido al morder.',3:'Maracuyá con perlas de mango. Tropical y equilibrada, la más fácil de tomar del menú.',4:'Maracuyá en el jarabe y en la perla. La más intensa y la más ácida.',5:'Tú la armas: eliges dos jarabes y la perla que quieras.',6:'Taro con leche y tapioca. Morado pálido, cremoso, entre nuez y vainilla.',7:'Matcha con leche y tapioca. Verde, cremoso y con ese amargor rico.',8:'Té negro, leche y tapioca. La receta original de Taiwán, sin polvos ni sabores.',9:'Chai con leche y tapioca. Canela, cardamomo y jengibre.',10:'Café reposado 16 horas en frío. Negro, sin azúcar y sin perlas.',11:'Cold brew con una nube de vainilla encima que baja despacio.',12:'Cold brew con chocolate y leche. Dulce sin empalagar.',13:'Cold brew infusionado en leche 16 horas. Sedoso y sin filo.',14:'Té de frutos rojos con perlas explosivas. Ácido, ligero y sin leche.',15:'Plátano en rodajas, secado despacio y sin freír.',16:'Malanga en hojuelas delgadas. Con sal y ya.'};
const SODA=j=>['30 g de perlas al fondo, con su almíbar','2 bombeos y medio de '+j,'Hielo hasta la marca','Tapa, etiqueta y popote','La botella de agua mineral va aparte, sin abrir'];
const BT=p=>['Tapioca ya cocida y en almíbar, 30 g secos por bebida','Disuelve el '+p+' en un poco de leche tibia','Agrega el resto de la leche y bate hasta que no queden grumos','Tapioca al fondo del vaso, luego el hielo','Vacía la mezcla encima. Tapa, etiqueta y popote ancho'];
const PASOS={1:SODA('jarabe de frambuesa'),2:SODA('jarabe de frambuesa'),3:SODA('jarabe de maracuyá'),4:SODA('jarabe de maracuyá'),5:['La perla que haya elegido, 30 g al fondo','Bombeo y medio del jarabe principal','1 bombeo del segundo jarabe','Hielo hasta la marca','Tapa, etiqueta, popote y botella aparte'],6:BT('polvo de taro'),7:BT('matcha'),8:['Concentrado de té negro de la jarra, bien frío','Tapioca ya cocida y en almíbar, 30 g secos por bebida','Tapioca al fondo del vaso, luego el hielo','Vacía el té y encima la leche, despacio, para que se vea la veta','Tapa, etiqueta y popote ancho'],9:BT('polvo de chai'),10:['Cold brew de la tanda de anoche, bien frío','Hielo hasta la marca','Llena con el cold brew','Tapa, etiqueta y popote','Si lo piden con leche, deja 60 ml de espacio'],11:['Bate leche, crema y jarabe de vainilla hasta que espese','Hielo en el vaso hasta la marca','Llena con cold brew dejando 3 cm libres','Vacía la espuma encima, despacio, para que quede en capa','Tapa, etiqueta y popote. No revolver'],12:['Disuelve la base de moka en un poco de leche tibia','Agrega el resto de la leche y bate bien','Hielo en el vaso hasta la marca','Vacía primero el cold brew, luego la mezcla de moka','Tapa, etiqueta y popote'],13:['Tanda aparte: 25 g de café por cada 270 ml de leche, 16 h en refri','Cuela con filtro fino o manta; nunca exprimas el poso','Hielo en el vaso hasta la marca y llena con el cold milk','Tapa, etiqueta y popote','Ojo: esta tanda dura 48 h en refri'],14:['30 g de perlas explosivas al fondo, con su almíbar','Hielo hasta la marca','Llena con la tisana de frutos rojos bien fría','Tapa, etiqueta y popote ancho','Se prepara en jarra, no vaso por vaso']};
B.DRINKS.forEach(d=>{d.desc=DESC[d.n]||'';d.pasos=PASOS[d.n]||[];d.activa=true;});
B.POR_CAPTURAR=[['Licuadora','Equipo',48],['Ollas para cocer tapioca','Equipo',24],['Báscula de cocina','Equipo',24],['Hieleras','Equipo',48],['Refrigerador (sólo la parte que usa el negocio)','Equipo',60],['Jarras y contenedores para cold brew','Equipo',24],['Coladores / filtros para cold brew','Equipo',12],['Mesa y mantel para barra de eventos','Mobiliario',48],['Selladora de vasos (si la compras)','Equipo',60]].map(([nombre,tipo,vida])=>({nombre,tipo,vida}));
B.ACTIVOS_BASE=[{nombre:'Dosificadores de 10 ml (2) y cuchara de bar',tipo:'Equipo',costo:237.8,fecha:'2026-09-08',vida:12,rescate:0}];
B.ACTIVOS_EJEMPLO=B.ACTIVOS_BASE.concat([
{nombre:'Licuadora',tipo:'Equipo',costo:1899,fecha:'2026-09-05',vida:48,rescate:0,from:'Licuadora'},
{nombre:'Ollas para cocer tapioca',tipo:'Equipo',costo:650,fecha:'2026-09-05',vida:24,rescate:0,from:'Ollas para cocer tapioca'},
{nombre:'Báscula de cocina',tipo:'Equipo',costo:399,fecha:'2026-09-06',vida:24,rescate:0,from:'Báscula de cocina'},
{nombre:'Hieleras (2)',tipo:'Equipo',costo:960,fecha:'2026-09-06',vida:48,rescate:0,from:'Hieleras'},
{nombre:'Refrigerador (parte del negocio)',tipo:'Equipo',costo:1500,fecha:'2026-09-01',vida:60,rescate:0,from:'Refrigerador (sólo la parte que usa el negocio)'},
{nombre:'Jarras y contenedores para cold brew',tipo:'Equipo',costo:520,fecha:'2026-09-07',vida:24,rescate:0,from:'Jarras y contenedores para cold brew'},
{nombre:'Mesa y mantel para barra',tipo:'Mobiliario',costo:1190,fecha:'2026-09-12',vida:48,rescate:0,from:'Mesa y mantel para barra de eventos'}]);
const BASE_COST=Object.assign({},B.COST);
B.resetCost=()=>Object.assign(B.COST,BASE_COST);
B.syncCost=items=>{for(const k in items){const d=B.ITEM_DEF[k];B.COST[k]=items[k].cu/(1-d.merma);}};
B.dayDate=d=>new Date(2026,8,10+d);
B.fmtDate=dt=>B.DOW[dt.getDay()]+' '+dt.getDate()+' '+B.MON[dt.getMonth()];
B.dayLabel=d=>B.fmtDate(B.dayDate(d));
B.dayShort=d=>{const x=B.dayDate(d);return x.getDate()+' '+B.MON[x.getMonth()];};
B.dateToDay=s=>Math.round((new Date(s+'T12:00:00')-new Date(2026,8,10,12))/864e5);
B.fq=(q,u)=>{if(u==='pz')return Math.round(q).toLocaleString('en-US')+' pz';if(Math.abs(q)>=1000)return (Math.round(q/10)/100).toLocaleString('en-US',{maximumFractionDigits:2})+(u==='g'?' kg':' L');return (Math.abs(q)<10?Math.round(q*10)/10:Math.round(q))+' '+u;};
B.fcu=(cu,u)=>u==='pz'?B.money(cu)+'/pz':B.money(cu*1000)+(u==='g'?'/kg':'/L');
B.mp=v=>Math.abs(v-Math.round(v))<.005?B.money(v,0):B.money(v);
const PLAN={polvo_taro:[270,[6,11]],polvo_matcha:[640,[6]],polvo_chai:[410,[6]],base_moka:[1150,[7]],leche:[2600,[3,6,9,12]],leche_desl:[1200,[6]],avena_oatly:[1700,[6]],crema_batir:[520,[6,12]],jarabe_maracuya:[760,[]],jarabe_frambuesa:[540,[]],jarabe_vainilla:[820,[2]],tapioca_seca:[1900,[6]],perla_mango:[1450,[]],perla_maracuya:[180,[9]],cafe_molido:[640,[5,11]],te_negro:[610,[]],tisana_frutos:[0,[2,8]],hielo:[3200,[0,2,4,6,8,9,10,12]],azucar:[1400,[]],botella_mineral:[38,[3,8]],etiqueta:[250,[]],popote:[160,[]],playo:[610,[]],vaso_14:[70,[4,9]],tapa_14:[140,[4,9]],vaso_16:[45,[4,9]],tapa_16:[90,[4,9]],vaso_20:[28,[4,9]],tapa_20:[60,[4,9]],platano:[6,[7]],malanga:[4,[7]]};
const OVR={},FACT={'Tienda local':false,'Productor local':false};
B.buildInv=function(sales,mode){
  const items={};RAW.forEach(r=>{items[r.k]={k:r.k,cu:r.precio/(1+r.iva)/r.cont,verificado:r.verificado,minimo:null,abierto:null};});
  if(mode!=='ejemplo')return {items,moves:[],purchases:[]};
  const C={};sales.forEach(s=>{for(const k in s.cons){(C[k]=C[k]||new Array(14).fill(0))[s.day]+=s.cons[k];}});
  const cum=(k,a,b)=>{const c=C[k];let t=0;if(c)for(let i=a;i<b;i++)t+=c[i];return t;};
  const moves=[],buys={};let mid=1;
  Object.keys(PLAN).forEach(k=>{
    const [Tg,days]=PLAN[k],r=B.ITEM_DEF[k],lines=[];let I0;
    if(!days.length)I0=Tg+cum(k,0,14);
    else{
      I0=Math.ceil(cum(k,0,days[0])*1.15);let s=I0,minS=I0,prev=0;
      days.forEach((d,i)=>{s-=cum(k,prev,d);minS=Math.min(minS,s);const nx=i+1<days.length?days[i+1]:14,need=cum(k,d,nx)*1.1+(i===days.length-1?Tg:0);const n=Math.max(1,Math.ceil((need-s)/r.cont));s+=n*r.cont;lines.push({d,n});prev=d;});
      s-=cum(k,prev,14);minS=Math.min(minS,s);const red=Math.max(0,Math.min(s-Tg,minS));I0-=red;const fin=s-red;
      if(fin-Tg>0.5&&(Tg===0||fin-Tg>0.15*Tg))moves.push({id:mid++,k,q:-(fin-Tg),day:12,t:1000,tipo:'ajuste',nota:Tg===0?'Caducidad · la tisana preparada no se usó':'Merma'});
    }
    moves.push({id:mid++,k,q:Math.round(I0),day:-1,t:600,tipo:'inicial',nota:'Conteo inicial'});
    lines.forEach(l=>{const key=l.d+'|'+r.prov;(buys[key]=buys[key]||{day:l.d,prov:r.prov,lines:[]}).lines.push({k,n:l.n,precio:(OVR[k]&&OVR[k][l.d])||r.precio});});
  });
  const P=Object.values(buys).sort((a,b)=>a.day-b.day);let pid=5000;
  const purchases=P.map(p=>{const f=FACT[p.prov]!==false,id=pid++;
    p.lines.forEach(l=>{const r=B.ITEM_DEF[l.k],q=l.n*r.cont,before=moves.filter(m=>m.k===l.k&&(m.day<p.day||(m.day===p.day&&m.t<600))).reduce((a,m)=>a+m.q,0)-cum(l.k,0,p.day);
      const it=items[l.k],uc=l.precio/(f?1+r.iva:1)/r.cont,b=Math.max(0,before);it.cu=(b*it.cu+q*uc)/(b+q);it.verificado=true;
      moves.push({id:mid++,k:l.k,q,day:p.day,t:600,tipo:'compra',ref:id,nota:p.prov});});
    return {id,day:p.day,t:600,prov:p.prov,factura:f,lines:p.lines,total:p.lines.reduce((a,l)=>a+l.n*l.precio,0)};});
  items.avena_oatly.abierto=8;items.leche_desl.abierto=10;items.leche.abierto=12;items.crema_batir.abierto=11;items.hielo.abierto=13;
  return {items,moves,purchases};
};
})();
