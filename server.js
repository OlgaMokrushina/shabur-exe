// SHABUR.EXE — сайт и учебный API в одном Render Web Service.
// Без зависимостей: Node.js 20+.
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const PORT = Number(process.env.PORT || 3000);
const PUBLIC = path.join(__dirname, 'public');

const orders = [
  {id:101,customer:'Маша',pizza:'Маргарита',quantity:1,status:'delivered'},
  {id:102,customer:'Даня',pizza:'Пепперони',quantity:999,status:'processing'},
  {id:103,customer:'Лиза',pizza:'Четыре сыра',quantity:2,status:'delivered'},
  {id:104,customer:'Шабур',pizza:'Грибная',quantity:1,status:'lost'},
  {id:105,customer:'Аня',pizza:'Гавайская',quantity:0,status:'processing'}
];
const users = [
  {id:1,name:'Маша',favorite:'Маргарита'},
  {id:2,name:'Картофельный повелитель',favorite:'Пепперони'},
  {id:3,name:'Лиза',favorite:'Четыре сыра'}
];
const MIME = {'.html':'text/html; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
function sendJson(res,status,obj) {
  const data=Buffer.from(JSON.stringify(obj));
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':data.length,'Cache-Control':'no-store','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'});
  res.end(data);
}
function api(req,res,u) {
  const p=u.pathname.replace(/\/$/,'')||'/';
  if(req.method==='OPTIONS') return sendJson(res,200,{ok:true});
  if(req.method==='GET') {
    if(p==='/api/health') return sendJson(res,200,{status:'online',message:'Шабур на связи!',mission:'PIZZA.EXE'});
    if(p==='/api/orders') return sendJson(res,200,{orders,total:orders.length});
    if(p==='/api/users') return sendJson(res,200,{users});
    const om=p.match(/^\/api\/orders\/(\d+)$/);
    if(om) {const o=orders.find(x=>x.id===Number(om[1]));return sendJson(res,o?200:404,o||{detail:'Заказ не найден. Проверь номер!'});}
    const um=p.match(/^\/api\/users\/(\d+)$/);
    if(um) {const x=users.find(y=>y.id===Number(um[1]));return sendJson(res,x?200:404,x||{detail:'Пользователь не найден'});}
    if(p==='/api/secret') return u.searchParams.get('code')?.trim().toLowerCase()==='shabur404'
      ? sendJson(res,200,{badge:'ОХОТНИК ЗА БАГАМИ',message:'Ты спас пиццерию Шабура!',clue:'Все ошибки найдены'})
      : sendJson(res,403,{detail:'Неверный код расследования'});
  }
  if(req.method==='POST'&&p==='/api/orders') {
    let raw='';
    req.on('data',chunk=>{raw+=chunk;if(raw.length>10000)req.destroy();});
    req.on('end',()=>{
      let d;try{d=JSON.parse(raw);}catch{return sendJson(res,422,{detail:'Ожидался JSON'});}
      const valid=d&&typeof d==='object'&&!Array.isArray(d)&&typeof d.participant==='string'&&d.participant.trim().length>=1&&d.participant.length<=40&&typeof d.pizza==='string'&&d.pizza.trim().length>=1&&Number.isInteger(d.quantity)&&d.quantity>=1&&d.quantity<=10;
      if(!valid)return sendJson(res,422,{detail:'Проверь participant, pizza и quantity (целое число от 1 до 10)'});
      return sendJson(res,201,{status:'accepted',order_id:'TRAINING-2026',participant:d.participant,pizza:d.pizza,quantity:d.quantity,message:'Шабур принял заказ!'});
    });
    return;
  }
  return sendJson(res,req.method==='GET'?404:405,{detail:'Маршрут или метод API не поддерживается'});
}
http.createServer((req,res)=>{
  let u;try{u=new URL(req.url,'http://localhost');}catch{return sendJson(res,400,{detail:'Некорректный URL'});}
  if(u.pathname.startsWith('/api/'))return api(req,res,u);
  if(req.method!=='GET'&&req.method!=='HEAD')return sendJson(res,405,{detail:'Метод не поддерживается'});
  let decoded;try{decoded=decodeURIComponent(u.pathname);}catch{return sendJson(res,400,{detail:'Некорректный путь'});}
  const target=path.resolve(PUBLIC,'.'+(decoded==='/'?'/index.html':decoded));
  if(!target.startsWith(PUBLIC+path.sep))return sendJson(res,403,{detail:'Доступ запрещён'});
  fs.stat(target,(err,stat)=>{
    if(err||!stat.isFile())return sendJson(res,404,{detail:'Файл не найден'});
    res.writeHead(200,{'Content-Type':MIME[path.extname(target)]||'application/octet-stream','Cache-Control':path.extname(target)==='.html'?'no-cache':'public, max-age=3600'});
    if(req.method==='HEAD')return res.end();
    fs.createReadStream(target).pipe(res);
  });
}).listen(PORT,'0.0.0.0',()=>console.log('SHABUR.EXE listening on '+PORT));
