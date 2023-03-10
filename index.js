//先判斷是「測試環境」還是「正式環境」,設定在package.json裡面
if (process.argv[2] && process.argv[2] === "production") {
  require("dotenv").config({
    path: "./production.env",
  });
} else {
  require("dotenv").config({
    path: "./dev.env",
  });
}

const express = require("express");
const session = require("express-session");
const jwt = require("jsonwebtoken");
const MysqlStore = require("express-mysql-session")(session);
const moment = require("moment-timezone");
const cors = require("cors");
const bcrypt = require("bcryptjs");
// const multer = require("multer");
// const upload = multer({ dest: "tmp_uploads/" });
const upload = require("./modules/upload-imgs");
const db = require("./modules/db_connect2");
const sessionStore = new MysqlStore({}, db);

const app = express();

//設定樣板引擎ejs
app.set("view engine", "ejs");


//top-level middlewares(中介軟體:資料庫以及應用程式的溝通橋樑),只要在index.js(入口)設定就好

//top-level middlewares設定session
app.use(
  session({
    saveUninitialized: false,
    resave: false,
    secret: "jdkfksd8934-@_75634kjdkjfdkssdfg",
    store: sessionStore,
    cookie: {
      maxAge: 1200_000,
    },
  })
);

//top-level middlewares解析urlencoded(body-parser)
app.use(express.urlencoded({ extended: false }));

//top-level middlewares解析json(body-parser)
app.use(express.json());

//top-level middlewares cors
const corsOption = {
  credentials: true,
  origin: function (origin, callback) {
    console.log({ origin });
    callback(null, true);
  },
};
app.use(cors(corsOption));

app.use((req, res, next) => {
  res.locals.title = "Groot的網頁";
  res.locals.pageName = "";

  //將ejs要用的功能寫在這邊
  res.locals.myToDateString = (d) => moment(d).format("YYYY-MM-DD");
  res.locals.myToDatetimeString = (d) =>
    moment(d).format("YYYY-MM-DD HH:mm:ss");
  res.locals.session = req.session; //把session資料傳給ejs使用
  res.locals.bearer = {}; // 預設值

  // 取得 headers 裡的 Authorization
  let auth = req.get("Authorization");
  if (auth && auth.indexOf("Bearer ") === 0) {
    auth = auth.slice(7); // token
    try {
      res.locals.bearer = jwt.verify(auth, process.env.JWT_SECRET);
    } catch (ex) {}
  }
  console.log("res.locals.bearer:", res.locals.bearer);

  next();
});


// ***********************路由設定********************

//ejs呼叫方式:render
app.get("/", (req, res) => {
  // res.send('Hello World');
  res.locals.title = "首頁 -" + res.locals.title;
  res.render("main", { name: "Groot" });
});

app.get("/sales-json", (req, res) => {
  //設定檔案名稱
  const sales = require(__dirname + "/data/sales");
  //res.json(sales); //用json格式輸出
  res.render("sales-json", { sales, title: "業務員資料" });//render是給ejs使用的
});

//取queryString
app.get("/try-qs", (req, res) => {
  res.json(req.query);
});

//取POST
app.post(["/try-post", "/try-post1"], (req, res) => {
  res.json({
    query: req.query,
    body: req.body,
  });
});

app.get("/try-post-form", (req, res) => {
  res.render("try-post-form");
});

app.post("/try-post-form", (req, res) => {
  res.render("try-post-form", req.body);
});

//用戶上傳檔案至後端
app.post("/try-upload", upload.single("avatar"), (req, res) => {
  res.json(req.file);
});

//上傳多個檔案至後端
app.post("/try-uploads", upload.array("photos", 5), (req, res) => {
  // console.log("req.files:", req.files);
  res.json({
    body: req.body,
    files: req.files,
  });
});

//有設定才會進入畫面
app.get("/my-params1/:action/:id", (req, res) => {
  res.json(req.params);
});
//沒設定也會進入畫面
app.get("/my-params2/:action?/:id?", (req, res) => {
  res.json(req.params);
});

app.get(/\/m\/09\d{2}-?\d{3}-?\d{3}$/i, () => {
  let u = req.url.slice(3);
  u = u.split("?")[0];
  u = u.split("-").join("");
  u = u.replaceAll("-", "");
  res.send({ u });
});

app.use(require("./routes/admin")); //router當作middleware

app.get("/try-sess", (req, res) => {
  req.session.myVar = req.session.myVar || 0;
  req.session.myVar++;
  res.json(req.session);
});
app.get("/try-moment", (req, res) => {
  const fmStr = "YYYY-MM-DD HH:mm:ss";
  const m1 = moment(); //取得當下時間
  const m2 = moment("2023-02-29");

  res.json({
    m1a: m1.format(fmStr),
    m1b: m1.tz("Europe/London").format(fmStr),
    m1c: m1.tz("Asia/Tokyo").format(fmStr),
    m2isValid: m2.isValid(),
  });
});

//測試是否有連線到MySQL
app.get("/try-db", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM address_book LIMIT 5");
  res.json(rows);
});

//用use()串接routes的address-book
app.use("/address-book", require("./routes/address-book"));

app.get("/getData", async (req, res) => {
  const sql = "SELECT * FROM `sessions` WHERE 1";
  const [data] = await db.query(sql);
  res.json(data);
});



app.get("/login", async (req, res) => {
  res.render("login"); // 呈現登入的表單
});
app.post("/login", async (req, res) => {
  const output = {
    success: false,
    error: "帳號密碼有錯誤",
    code: 0,
    postData: req.body,
    token: "",
  };

  const sql = "SELECT * FROM admins WHERE account=?";

  const [rows] = await db.query(sql, [req.body.account]);
  if (!rows.length) {
    // 帳號是錯的
    output.code = 401;
    return res.json(output);
  }
  let passwordCorrect = false; // 預設密碼是錯的
  try {
    passwordCorrect = await bcrypt.compare(
      req.body.password,
      rows[0].password_hash
    );
  } catch (ex) {}

  if (!passwordCorrect) {
    // 密碼是錯的
    output.code = 402;
  } else {
    output.success = true;
    output.code = 200;
    output.error = "";

    req.session.admin = {
      sid: rows[0].sid,
      account: rows[0].account,
    };
    output.token = jwt.sign(
      {
        sid: rows[0].sid,
        account: rows[0].account,
      },
      process.env.JWT_SECRET
    );
    output.accountId = rows[0].sid;
    output.account = rows[0].account;
  }
  res.json(output);
});
app.get("/logout", async (req, res) => {
  delete req.session.admin;
  res.redirect("/"); // 登出後跳到首頁
});

app.get("/hash", async (req, res) => {
  const p = req.query.p || "123456";
  const hash = await bcrypt.hash(p, 10);
  res.json({ hash });
});

//引用外掛可以多個
app.use(express.static("public"));
app.use(express.static("node_modules/bootstrap/dist"));
// app.use(express.static('node_modules/@fortawesome/fontawesome-free'));

//所有路由要放在404錯誤頁面之前
app.use((req, res) => {
  //res.type預設為text/html
  // res.type('text/plain');
  res.status(404).send(`<img src="imgs/404.png"><h1>找不到頁面</h1><p>404</p>`);
});

const port = process.env.PORT || 3000;
app.listen(port, (req, res) => {
  console.log(`伺服器啟動:${port}`);
});
