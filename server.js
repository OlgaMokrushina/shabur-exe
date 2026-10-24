// Node.js adapter for the educational API (Render Web Service).
import http from 'node:http';
import api from './worker.js';

const port = Number(process.env.PORT || 10000);
const server = http.createServer(async (req, res) => {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const url = `http://${req.headers.host || 'localhost'}${req.url || '/'}`;
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      ...(req.method === 'GET' || req.method === 'HEAD' ? {} : {body}),
    });
    const response = await api.fetch(request, {});
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    res.writeHead(500, {'Content-Type':'application/json; charset=utf-8'});
    res.end(JSON.stringify({detail:'Внутренняя ошибка сервера'}));
  }
});
server.listen(port, '0.0.0.0', () => console.log(`Shabur API listening on ${port}`));
