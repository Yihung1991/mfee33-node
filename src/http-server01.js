const http = require('http');
const server = http.createServer((request,respont)=>{
    respont.writeHead(200,{
        'Content-Type':'text/html'
    });
    respont.end(`<h2>Hello</h2><p>${request.url}</p>`);
});
server.listen(3000);