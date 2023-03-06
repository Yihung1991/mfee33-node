//用node寫入檔案
const http = require('http');
const fs = require('fs/promises');//使用promiseAPI

const server = http.createServer(async(req,res)=>{
    await fs.writeFile(__dirname+'/headers.txt',JSON.stringify(req.headers));
    res.writeHead(200,{
        'Content-Type':'text/html'
    });
    res.end(`<h2>Hello</h2>`);
});
//設定3000後,localhost3000可以看到此檔案
//位置在headers.json
//可以看到headers的設定
server.listen(3000);