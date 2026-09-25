(function(){
const B=window.BB;if(B.__extra)return;B.__extra=true;
B.ESTADOS=['Cotizado','Confirmado','Realizado','Cobrado','Cancelado'];
B.EV_CATS=['Soda italiana','Bubble tea','Café frío','Frutal'];
B.EVENTOS_EJEMPLO=[
{id:1,nombre:'Bazar de la 3 Sur',cliente:'Mariana Téllez',org:'Colectivo 3 Sur',wa:'222 318 4471',fecha:'2026-09-19',lugar:'Calle 3 Sur 1102, Centro',estado:'Cobrado',n:100,mix:{'Soda italiana':30,'Bubble tea':35,'Café frío':20,'Frutal':15},precio:75,traslado:180,equipo:60,horas:2,anticipo:3750,pagado:7500},
{id:2,nombre:'Kermés Colegio Humboldt',cliente:'Laura Gil',org:'Asociación de padres',wa:'222 105 2290',fecha:'2026-09-23',lugar:'Colegio Humboldt, La Paz',estado:'Confirmado',n:60,mix:{'Soda italiana':40,'Bubble tea':30,'Café frío':10,'Frutal':20},precio:70,traslado:120,equipo:0,horas:1.5,anticipo:2100,pagado:2100},
{id:3,nombre:'Mercadito Angelópolis',cliente:'Diego Paz',org:'Mercadito Angelópolis',wa:'221 674 9033',fecha:'2026-10-04',lugar:'Plaza Angelópolis, San Andrés Cholula',estado:'Cotizado',n:80,mix:{'Soda italiana':30,'Bubble tea':30,'Café frío':25,'Frutal':15},precio:75,traslado:150,equipo:60,horas:2,anticipo:0,pagado:0},
{id:4,nombre:'Boda Rivera Luna',cliente:'Andrea Rivera',org:'',wa:'222 841 7720',fecha:'2026-10-17',lugar:'Jardín Los Sauces, Cholula',estado:'Cotizado',n:150,mix:{'Soda italiana':40,'Bubble tea':30,'Café frío':20,'Frutal':10},precio:60,traslado:250,equipo:180,horas:3,anticipo:0,pagado:0},
{id:5,nombre:'Posada Textiles MX',cliente:'Recursos Humanos',org:'Textiles MX',wa:'222 230 1188',fecha:'2026-12-12',lugar:'Parque Industrial 5 de Mayo',estado:'Cancelado',n:120,mix:{'Soda italiana':25,'Bubble tea':35,'Café frío':30,'Frutal':10},precio:70,traslado:200,equipo:120,horas:3,anticipo:0,pagado:0},
{id:6,nombre:'Mercadito Angelópolis',cliente:'Diego Paz',org:'Mercadito Angelópolis',wa:'221 674 9033',fecha:'2026-08-30',lugar:'Plaza Angelópolis, San Andrés Cholula',estado:'Cobrado',n:70,mix:{'Soda italiana':35,'Bubble tea':30,'Café frío':20,'Frutal':15},precio:75,traslado:150,equipo:60,horas:2,anticipo:2625,pagado:5250,sinRegistro:true}];
B.parseD=s=>new Date(s+'T12:00:00');
B.fmtD=s=>B.fmtDate(B.parseD(s));
B.evExtra=ev=>(+ev.traslado||0)+(+ev.equipo||0)+(+ev.horas||0)*B.P.fuera;
const avgCache={};
B.cotizar=function(ev){
  const N=+ev.n||0,tot=B.EV_CATS.reduce((a,k)=>a+(+ev.mix[k]||0),0)||1;let costo=0,util=0,apps=0,mo=0;
  B.EV_CATS.forEach(k=>{const share=(+ev.mix[k]||0)/tot,ds=B.DRINKS.filter(d=>d.cat===k&&d.activa!==false&&!d.botana);if(!ds.length||!share)return;
    let cu=0,ue=0,ua=0,um=0;ds.forEach(d=>{const e=B.calc({n:d.n,tam:0,leche:0,adds:[],canal:'Evento',precioEvento:+ev.precio||0,dow:6,t:1080});cu+=e.ins+e.emp+e.ind+e.mo;ue+=e.util;um+=e.mo;
      const u=B.calc({n:d.n,tam:0,leche:0,adds:[],canal:'Uber Eats',dow:2,t:840}),r=B.calc({n:d.n,tam:0,leche:0,adds:[],canal:'Rappi',dow:2,t:840});ua+=.55*u.util+.45*r.util;});
    const m=N*share/ds.length;costo+=cu*m;util+=ue*m;apps+=ua*m;mo+=um*m;});
  const extra=B.evExtra(ev),venta=N*(+ev.precio||0),iva=venta-venta/(1+B.P.iva),queda=util-extra;
  return {N,venta,iva,costoBeb:costo,extra,costoTotal:costo+extra,queda,porBeb:N?queda/N:0,apps,mo:mo+(+ev.horas||0)*B.P.fuera,bajo:(+ev.precio||0)<65};
};
B.eventoReal=function(ev,sales,orders){
  const ids={};orders.forEach(o=>{if(o.evento===ev.nombre&&o.day===B.dateToDay(ev.fecha))ids[o.id]=1;});
  const ss=sales.filter(s=>ids[s.oid]);let venta=0,util=0;ss.forEach(s=>{venta+=s.c.precio;util+=s.c.util;});
  return {n:ss.length,pedidos:Object.keys(ids).length,venta,queda:ss.length?util-B.evExtra(ev):0,sales:ss};
};
B.quoteText=function(ev,Q){const M=B.money;return ['*Bendita Burbuja* · Cotización','',ev.nombre,B.fmtD(ev.fecha)+' · '+ev.lugar,'',Q.N+' bebidas a '+M(+ev.precio,0)+' c/u',B.EV_CATS.filter(k=>+ev.mix[k]).map(k=>k+' '+ev.mix[k]+' %').join(' · '),'Barra montada, vasos, hielo y servicio incluidos.','','*Total: '+M(Q.venta,0)+'* (IVA incluido)','Anticipo para apartar la fecha: '+M(Q.venta/2,0),'','Gracias por pensar en nosotros. Que haya burbujas para todos.'].join('\n');};
B.quotePDF=function(ev,Q){const M=B.money,w=window.open('','_blank');if(!w)return false;
  const rows=B.EV_CATS.filter(k=>+ev.mix[k]).map(k=>'<tr><td>'+k+'</td><td style="text-align:right">'+ev.mix[k]+' %</td><td style="text-align:right">'+Math.round(Q.N*ev.mix[k]/100)+'</td></tr>').join('');
  w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Cotización · '+ev.nombre+'</title><link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500&family=Josefin+Sans:wght@400&family=Montserrat:wght@400;600&display=swap" rel="stylesheet"><style>@page{size:letter;margin:18mm}body{font-family:Montserrat,sans-serif;color:#780F0D;background:#FEEFC4;margin:0;padding:32px;-webkit-print-color-adjust:exact;print-color-adjust:exact}.k{font-family:"Josefin Sans";font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8A5446}h1{font-family:"Bodoni Moda",serif;font-weight:500;font-size:34px;margin:6px 0}.hr{height:4px;border-top:1px solid #E1C8A5;border-bottom:1px solid #E1C8A5;margin:20px 0}table{width:100%;border-collapse:collapse;font-size:13px}td{padding:8px 0;border-bottom:1px solid #E1C8A5;font-variant-numeric:tabular-nums}.tot{font-size:20px;font-weight:600}</style></head><body><div style="max-width:620px;margin:0 auto;border:3px double #780F0D;padding:32px"><div style="text-align:center"><img src="'+location.href.replace(/[^/]*$/,'')+'assets/logo-bendita.jpeg" style="width:88px;height:88px;object-fit:cover;border-radius:4px"><div class="k" style="margin-top:12px">Cotización de barra para evento</div><h1>'+ev.nombre+'</h1><div style="font-size:13px;color:#8A5446">'+B.fmtD(ev.fecha)+' · '+ev.lugar+'</div><div style="font-size:13px;color:#8A5446">Para '+ev.cliente+(ev.org?' · '+ev.org:'')+'</div></div><div class="hr"></div><table><tr class="k"><td>Mezcla</td><td style="text-align:right">%</td><td style="text-align:right">Bebidas</td></tr>'+rows+'</table><div class="hr"></div><table><tr><td>'+Q.N+' bebidas × '+M(+ev.precio,0)+'</td><td style="text-align:right">'+M(Q.venta,0)+'</td></tr><tr><td style="color:#8A5446">Incluye IVA</td><td style="text-align:right;color:#8A5446">'+M(Q.iva)+'</td></tr><tr><td class="tot">Total</td><td class="tot" style="text-align:right">'+M(Q.venta,0)+'</td></tr><tr><td>Anticipo para apartar la fecha</td><td style="text-align:right">'+M(Q.venta/2,0)+'</td></tr></table><p style="font-size:12px;line-height:1.6;color:#8A5446;margin-top:20px">Incluye barra montada, vasos de 14 oz, hielo, popotes y servicio durante el evento. Vigencia de 15 días.</p><p style="text-align:center;font-family:\'Bodoni Moda\',serif;font-size:18px;margin-top:24px">Que haya burbujas para todos.</p></div><script>setTimeout(function(){window.print()},700)<\/script></body></html>');w.document.close();return true;};
B.xlsDownload=function(name,header,rows){
  const esc=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const cell=v=>typeof v==='number'?'<Cell><Data ss:Type="Number">'+v.toFixed(2)+'</Data></Cell>':'<Cell><Data ss:Type="String">'+esc(v)+'</Data></Cell>';
  const xml='<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Ventas"><Table>'+[header].concat(rows).map(r=>'<Row>'+r.map(cell).join('')+'</Row>').join('')+'</Table></Worksheet></Workbook>';
  B.download(name+'.xls',xml,'application/vnd.ms-excel');
};
B.download=function(fn,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=fn;document.body.appendChild(a);a.click();a.remove();};
B.shiftHours=function(day,nowT){const dow=B.DAYS[day].dow;const x=B.P.turnos.find(t=>t.dias.includes(dow));if(!x)return {h:0,rate:B.P.fuera};const end=day===13?Math.min(nowT,x.fin):x.fin;return {h:Math.max(0,end-x.ini)/60,rate:x.tarifa};};
})();
