const http = require('http');
const server = http.createServer((request,response)=>{
    response.writeHead(200,{
        //在網頁上用什麼類型呈現
        'Content-Type':'text/html'
    });
    response.end(`<h2>Hello</h2><p>${request.url}</p>`);
});
server.listen(3000);