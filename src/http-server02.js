const http = require('http');
const fs = require('fs/promises');
const server = http.createServer(async(req,res)=>{
    await fs.writeFile(__dirname+'/headers.txt',JSON.stringify(req.headers));
    res.writeHead(200,{
        'Content-Type':'text/html'
    });
    res.end(`<h2>Hello</h2>`);
});
server.listen(3000);