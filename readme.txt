res.end()
res.send()
res.render()
res.json()
res.redirect()

-------------------------------
req.query  # 接收 query string 參數

req.body   # 接收表單的參數

req.params # 路徑的參數

req.file   #單一
req.files  #複數
-------------------------------
RESTful API
  對應到資料操作的 CRUD
    Create: POST
    Read:   GET
    Update: PUT (PATCH)
    Delete: DELETE
-------------------------------
GET      /products      # 取得商品列表
GET      /procucts/15   # 取得 PK 為 15 的商品詳細資料
POST     /products      # 新增商品資料
PUT      /procucts/15   # 修改 PK 為 15 的商品資料
DELETE   /procucts/15   # 刪除 PK 為 15 的商品資料
-------------------------------
相同來源
http://localhost:3002
協定,網域,通訊埠