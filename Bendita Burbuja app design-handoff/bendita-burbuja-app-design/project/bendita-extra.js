(function(){
const B=window.BB;if(B.__extra)return;B.__extra=true;
B.ESTADOS=['Cotizado','Confirmado','Realizado','Cobrado','Cancelado'];
const L=a=>a.map(([n,tam,qty])=>({n,tam,qty}));
B.EVENTOS_EJEMPLO=[
{id:1,nombre:'Bazar de la 3 Sur',cliente:'Mariana Téllez',org:'Colectivo 3 Sur',wa:'222 318 4471',fecha:'2026-09-19',lugar:'Calle 3 Sur 1102, Centro',estado:'Cobrado',lines:L([[6,1,20],[7,1,10],[1,1,15],[14,1,15],[2,1,10],[10,0,10],[13,1,10],[9,1,10]]),traslado:400,equipo:300,horas:3,anticipo:3700,pagado:7400},
{id:2,nombre:'Kermés Colegio Humboldt',cliente:'Laura Gil',org:'Asociación de padres',wa:'222 105 2290',fecha:'2026-09-23',lugar:'Colegio Humboldt, La Paz',estado:'Confirmado',lines:L([[1,0,15],[3,0,10],[14,0,15],[6,0,10],[8,0,10]]),traslado:400,equipo:300,horas:3,anticipo:2200,pagado:2200},
{id:3,nombre:'Mercadito Angelópolis',cliente:'Diego Paz',org:'Mercadito Angelópolis',wa:'221 674 9033',fecha:'2026-10-04',lugar:'Plaza Angelópolis, San Andrés Cholula',estado:'Cotizado',lines:L([[6,1,30],[7,1,10],[1,1,20],[4,1,10],[10,1,15],[13,1,15]]),traslado:400,equipo:300,horas:3,anticipo:0,pagado:0},
{id:4,nombre:'Boda Rivera Luna',cliente:'Andrea Rivera',org:'',wa:'222 841 7720',fecha:'2026-10-17',lugar:'Jardín Los Sauces, Cholula',estado:'Cotizado',lines:L([[6,2,40],[7,2,20],[13,1,30],[12,1,20],[1,1,20],[14,1,20]]),traslado:400,equipo:300,horas:3,anticipo:0,pagado:0},
{id:5,nombre:'Posada Textiles MX',cliente:'Recursos Humanos',org:'Textiles MX',wa:'222 230 1188',fecha:'2026-12-12',lugar:'Parque Industrial 5 de Mayo',estado:'Cancelado',lines:L([[6,1,40],[10,1,40],[1,1,40]]),traslado:400,equipo:300,horas:3,anticipo:0,pagado:0},
{id:6,nombre:'Mercadito Angelópolis',cliente:'Diego Paz',org:'Mercadito Angelópolis',wa:'221 674 9033',fecha:'2026-08-30',lugar:'Plaza Angelópolis, San Andrés Cholula',estado:'Cobrado',lines:L([[6,0,20],[1,0,20],[14,0,15],[10,0,15]]),traslado:400,equipo:300,horas:3,anticipo:2500,pagado:5000,sinRegistro:true}];
B.parseD=s=>new Date(s+'T12:00:00');
B.fmtD=s=>B.fmtDate(B.parseD(s));
B.evExtra=ev=>(ev.traslado!=null?+ev.traslado:B.EVT.traslado)+(ev.equipo!=null?+ev.equipo:B.EVT.equipo)+(ev.horas!=null?+ev.horas:B.EVT.horas)*B.P.fuera;
B.evN=ev=>(ev.lines||[]).reduce((a,l)=>a+(+l.qty||0),0);
B.cotizar=function(ev){
  const lines=(ev.lines||[]).filter(l=>B.BYN[l.n]&&+l.qty>0),N=lines.reduce((a,l)=>a+(+l.qty),0),esc=B.escalaDe(N),iva=1+B.P.iva;
  let sub=0,util=0,costo=0,apps=0,mo=0;
  const rows=lines.map(l=>{const d=B.BYN[l.n],tam=+l.tam||0,q=+l.qty,pe=B.r5(d.p[tam]*esc.factor);
    const c=B.calc({n:d.n,tam,leche:0,adds:[],canal:'Evento',precioEvento:pe,dow:6,t:1080}),cp=c.ins+c.emp+c.ind;
    const u=.55*B.calc({n:d.n,tam,leche:0,adds:[],canal:'Uber Eats',dow:6,t:480}).util+.45*B.calc({n:d.n,tam,leche:0,adds:[],canal:'Rappi',dow:6,t:480}).util;
    sub+=pe*q;util+=c.util*q;costo+=cp*q;apps+=u*q;mo+=c.mo*q;
    return {n:d.n,nombre:d.nombre,tam,q,pe,pl:d.p[tam],cp,util:c.util,margen:(c.sinIva-cp)/cp};});
  const ok=N>=B.EVT.min,cargo=ok?esc.cargo:0,extra=B.evExtra(ev),total=sub+cargo,queda=util+cargo/iva-extra;
  return {N,esc,rows,sub,cargo,total,venta:total,iva:total-total/iva,costoBeb:costo,extra,costoTotal:costo+mo+extra,queda,porBeb:N?queda/N:0,apps,appsPor:N?apps/N:0,mo:mo+(ev.horas!=null?+ev.horas:B.EVT.horas)*B.P.fuera,ok,bajo:ok&&N>0&&queda/N<apps/N};
};
B.eventoReal=function(ev,sales,orders){
  const ids={};orders.forEach(o=>{if(o.evento===ev.nombre&&o.day===B.dateToDay(ev.fecha))ids[o.id]=1;});
  const ss=sales.filter(s=>ids[s.oid]);let venta=0,util=0;ss.forEach(s=>{venta+=s.c.precio;util+=s.c.util;});
  const cargo=ss.length&&B.evN(ev)>=B.EVT.min?B.escalaDe(B.evN(ev)).cargo:0;
  return {n:ss.length,pedidos:Object.keys(ids).length,venta:venta+cargo,queda:ss.length?util+cargo/(1+B.P.iva)-B.evExtra(ev):0,sales:ss};
};
B.quoteText=function(ev,Q){const M=B.money;return ['*Bendita Burbuja* · Cotización','',ev.nombre,B.fmtD(ev.fecha)+' · '+ev.lugar,''].concat(Q.rows.map(r=>r.q+' × '+r.nombre+' '+B.SIZES[r.tam].nombre+' a '+M(r.pe,0))).concat(['','Bebidas: '+M(Q.sub,0),'Montaje y traslado: '+(Q.cargo?M(Q.cargo,0):'sin cargo'),'*Total: '+M(Q.total,0)+'* (IVA incluido)','Anticipo para apartar la fecha: '+M(Q.total/2,0),'','Barra montada, vasos, hielo y servicio incluidos.','Que haya burbujas para todos.']).join('\n');};
B.quotePDF=function(ev,Q){const M=B.money,w=window.open('','_blank');if(!w)return false;
  const rows=Q.rows.map(r=>'<tr><td>'+r.nombre+' · '+B.SIZES[r.tam].nombre+'</td><td style="text-align:right">'+r.q+'</td><td style="text-align:right">'+M(r.pe,0)+'</td><td style="text-align:right">'+M(r.pe*r.q,0)+'</td></tr>').join('');
  w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Cotización · '+ev.nombre+'</title><link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500&family=Josefin+Sans:wght@400&family=Montserrat:wght@400;600&display=swap" rel="stylesheet"><style>@page{size:letter;margin:16mm}body{font-family:Montserrat,sans-serif;color:#780F0D;background:#FEEFC4;margin:0;padding:28px;-webkit-print-color-adjust:exact;print-color-adjust:exact}.k{font-family:"Josefin Sans";font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8A5446}h1{font-family:"Bodoni Moda",serif;font-weight:500;font-size:32px;margin:6px 0}.hr{height:4px;border-top:1px solid #E1C8A5;border-bottom:1px solid #E1C8A5;margin:18px 0}table{width:100%;border-collapse:collapse;font-size:13px}td{padding:7px 0;border-bottom:1px solid #E1C8A5;font-variant-numeric:tabular-nums}.tot{font-size:19px;font-weight:600}</style></head><body><div style="max-width:640px;margin:0 auto;border:3px double #780F0D;padding:30px"><div style="text-align:center"><img src="'+location.href.replace(/[^/]*$/,'')+'assets/logo-bendita.jpeg" style="width:84px;height:84px;object-fit:cover;border-radius:4px"><div class="k" style="margin-top:12px">Cotización de barra para evento</div><h1>'+ev.nombre+'</h1><div style="font-size:13px;color:#8A5446">'+B.fmtD(ev.fecha)+' · '+ev.lugar+'</div><div style="font-size:13px;color:#8A5446">Para '+ev.cliente+(ev.org?' · '+ev.org:'')+'</div></div><div class="hr"></div><table><tr class="k"><td>Bebida</td><td style="text-align:right">Cant.</td><td style="text-align:right">Precio</td><td style="text-align:right">Importe</td></tr>'+rows+'</table><div class="hr"></div><table><tr><td>'+Q.N+' bebidas</td><td style="text-align:right">'+M(Q.sub,0)+'</td></tr><tr><td>Montaje y traslado</td><td style="text-align:right">'+(Q.cargo?M(Q.cargo,0):'Sin cargo')+'</td></tr><tr><td class="tot">Total · IVA incluido</td><td class="tot" style="text-align:right">'+M(Q.total,0)+'</td></tr><tr><td>Anticipo para apartar la fecha</td><td style="text-align:right">'+M(Q.total/2,0)+'</td></tr></table><p style="font-size:12px;line-height:1.6;color:#8A5446;margin-top:18px">Precio por volumen: '+Q.N+' bebidas, '+Math.round((1-Q.esc.factor)*100)+' % menos que en la app. Incluye barra montada, vasos, hielo, popotes y servicio. Vigencia de 15 días.</p><p style="text-align:center;font-family:\'Bodoni Moda\',serif;font-size:18px;margin-top:22px">Que haya burbujas para todos.</p></div><script>setTimeout(function(){window.print()},700)<\/script></body></html>');w.document.close();return true;};
B.xlsDownload=function(name,header,rows){
  const esc=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const cell=v=>typeof v==='number'?'<Cell><Data ss:Type="Number">'+v.toFixed(2)+'</Data></Cell>':'<Cell><Data ss:Type="String">'+esc(v)+'</Data></Cell>';
  B.download(name+'.xls','<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Ventas"><Table>'+[header].concat(rows).map(r=>'<Row>'+r.map(cell).join('')+'</Row>').join('')+'</Table></Worksheet></Workbook>','application/vnd.ms-excel');
};
B.download=function(fn,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=fn;document.body.appendChild(a);a.click();a.remove();};
B.shiftHours=function(day,nowT){const dow=B.DAYS[day].dow;let h=0,pay=0;B.P.turnos.filter(t=>t.dias.includes(dow)).forEach(x=>{const end=day===13?Math.min(nowT,x.fin):x.fin,hh=Math.max(0,end-x.ini)/60;h+=hh;pay+=hh*x.tarifa;});return {h,pay,rate:h?pay/h:B.P.fuera};};
B.shiftNow=function(dow,t){const T=B.P.turnos;const cur=T.find(x=>x.dias.includes(dow)&&t>=x.ini&&t<x.fin);if(cur)return {open:true,text:cur.corto+' · abierto hasta '+B.hm(cur.fin)};
  for(let k=0;k<8;k++){const d=(dow+k)%7,list=T.filter(x=>x.dias.includes(d)&&(k>0||x.ini>t)).sort((a,b)=>a.ini-b.ini);if(list.length){const x=list[0];return {open:false,text:'Fuera de turno · '+x.corto.toLowerCase().replace('turno','el turno')+' abre '+(k===0?'hoy':k===1?'mañana':'el '+B.DOW[d])+' a las '+B.hm(x.ini)};}}
  return {open:false,text:'Fuera de turno'};};
B.shiftHoursOfDow=function(dow){const hs=[];B.P.turnos.filter(t=>t.dias.includes(dow)).forEach(x=>{for(let h=Math.floor(x.ini/60);h<Math.ceil(x.fin/60);h++)if(!hs.includes(h))hs.push(h);});return hs.sort((a,b)=>a-b);};
})();
