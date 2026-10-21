// ШАБУР.EXE — stateless educational API for Cloudflare Workers.
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
const json = (value, status=200) => new Response(JSON.stringify(value), {
  status, headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}
});
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';
    if (!path.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (request.method === 'GET') {
      if (path === '/api/health') return json({status:'online',message:'Шабур на связи!',mission:'PIZZA.EXE'});
      if (path === '/api/orders') return json({orders,total:orders.length});
      if (path === '/api/users') return json({users});
      const order = path.match(/^\/api\/orders\/(\d+)$/);
      if (order) return json(orders.find(x=>x.id===Number(order[1])) ?? {detail:'Заказ не найден. Проверь номер!'}, orders.some(x=>x.id===Number(order[1])) ? 200 : 404);
      const user = path.match(/^\/api\/users\/(\d+)$/);
      if (user) return json(users.find(x=>x.id===Number(user[1])) ?? {detail:'Пользователь не найден'}, users.some(x=>x.id===Number(user[1])) ? 200 : 404);
      if (path === '/api/secret') return url.searchParams.get('code')?.trim().toLowerCase() === 'shabur404'
        ? json({badge:'ОХОТНИК ЗА БАГАМИ',message:'Ты спас пиццерию Шабура!',clue:'Все ошибки найдены'})
        : json({detail:'Неверный код расследования'},403);
    }
    if (request.method === 'POST' && path === '/api/orders') {
      let data;
      try { data = await request.json(); } catch { return json({detail:'Ожидался JSON'},422); }
      if (!data || typeof data !== 'object' || Array.isArray(data)) return json({detail:'Ожидался объект JSON'},422);
      const valid = typeof data.participant === 'string' && data.participant.length >= 1 && data.participant.length <= 40
        && typeof data.pizza === 'string' && data.pizza.length >= 1
        && Number.isInteger(data.quantity) && data.quantity >= 1 && data.quantity <= 10;
      if (!valid) return json({detail:'Проверь participant, pizza и quantity (целое число от 1 до 10)'},422);
      return json({status:'accepted',order_id:'TRAINING-2026',participant:data.participant,pizza:data.pizza,quantity:data.quantity,message:'Шабур принял заказ!'},201);
    }
    return json({detail: request.method === 'GET' ? 'Адрес API не найден' : 'Метод не поддерживается'}, request.method === 'GET' ? 404 : 405);
  }
};
