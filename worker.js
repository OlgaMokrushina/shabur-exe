// SHABUR.EXE — учебный API, без реальных заказов и хранения персональных данных.
const orders = [
  {id:101,user_id:1,customer:'Маша',pizza:'Маргарита',quantity:1,status:'delivered',source:'web-form'},
  {id:102,user_id:2,customer:'Даня',pizza:'Пепперони',quantity:999,status:'processing',source:'legacy-import',audit_note:'Старый импорт не проверял верхнюю границу quantity'},
  {id:103,user_id:3,customer:'Лиза',pizza:'Четыре сыра',quantity:2,status:'delivered',source:'web-form'},
  {id:104,user_id:null,customer:'Шабур',pizza:'Грибная',quantity:1,status:'lost',source:'web-form'},
  {id:105,user_id:1,customer:'Аня',pizza:'Гавайская',quantity:0,status:'processing',source:'legacy-import'}
];
const users = [
  {id:1,name:'Маша',favorite:'Маргарита'},
  {id:2,name:'Картофельный повелитель',favorite:'Пепперони',note:'Имя профиля не является доказательством умысла'},
  {id:3,name:'Лиза',favorite:'Четыре сыра'}
];
const json = (value, status=200) => new Response(JSON.stringify(value), {status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});
export default {async fetch(request, env) {
  const url = new URL(request.url), path = url.pathname.replace(/\/$/, '') || '/';
  if(request.method === 'OPTIONS') return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});
  if(!path.startsWith('/api/')) return env?.ASSETS ? env.ASSETS.fetch(request) : json({detail:'Use /api/health'},404);
  if(request.method==='GET') {
    if(path==='/api/health') return json({status:'online',message:'Шабур на связи!',incident:'Заказ 999 пицц в 08:42'});
    if(path==='/api/orders') return json({orders,total:orders.length});
    if(path==='/api/users') return json({users});
    const order=path.match(/^\/api\/orders\/(\d+)$/);
    if(order){const found=orders.find(x=>x.id===Number(order[1]));return found?json(found):json({detail:'Заказ не найден'},404)}
    const user=path.match(/^\/api\/users\/(\d+)$/);
    if(user){const found=users.find(x=>x.id===Number(user[1]));return found?json(found):json({detail:'Пользователь не найден'},404)}
    if(path==='/api/secret') return url.searchParams.get('code')?.trim().toLowerCase()==='shabur404'
      ? json({badge:'ОХОТНИК ЗА БАГАМИ',root_cause:'legacy-import-validation-bypass',explanation:'Старый импорт не проверял количество. Новый POST ограничивает quantity диапазоном 1–10.',evidence:['GET /api/orders/102: quantity=999','GET /api/orders/102: source=legacy-import','POST /api/orders quantity=999: HTTP 422'],conclusion:'Не обвиняй владельца профиля без доказательств.'})
      : json({detail:'Неверный код расследования'},403);
  }
  if(request.method==='POST'&&path==='/api/orders') {
    let data;try{data=await request.json()}catch{return json({detail:'Ожидался JSON'},422)}
    if(!data||typeof data!=='object'||Array.isArray(data))return json({detail:'Ожидался объект JSON'},422);
    const valid=typeof data.participant==='string'&&data.participant.length>=1&&data.participant.length<=40&&typeof data.pizza==='string'&&data.pizza.length>=1&&Number.isInteger(data.quantity)&&data.quantity>=1&&data.quantity<=10;
    if(!valid)return json({detail:'Проверь participant, pizza и quantity (целое число от 1 до 10)'},422);
    return json({status:'accepted',order_id:'TRAINING-2026',participant:data.participant,pizza:data.pizza,quantity:data.quantity,message:'Учебный заказ принят!'},201);
  }
  if(request.method==='POST' && path==='/api/investigation/report') {
    let data; try { data=await request.json() } catch {return json({detail:'Нужен JSON-объект с полями order_id, source и conclusion'},422)}
    if(!data || typeof data!=='object' || Array.isArray(data)) return json({detail:'Нужен JSON-объект'},422);
    if(data.order_id!==102 || data.source!=='legacy-import' || typeof data.conclusion!=='string' || data.conclusion.trim().length<15)
      return json({detail:'Проверь order_id (число 102), source (legacy-import) и conclusion (не менее 15 символов)'},422);
    return json({status:'case_closed',badge:'ДЕТЕКТИВ API',case_id:999,summary:'Причина: старый импорт пропускал проверку количества. Современный POST отклоняет 999 пицц.',message:'Шабур благодарит за расследование!'},201);
  }
  return json({detail:request.method==='GET'?'Адрес API не найден':'Метод не поддерживается'},request.method==='GET'?404:405);
}};
