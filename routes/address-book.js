const express = require("express");
const moment = require("moment-timezone");
const db = require("./../modules/db_connect2");
const upload = require("./../modules/upload-imgs");
const router = express.Router();

router.use((req, res, next) => {
  /*if (!req.session.admin) {
    return res.redirect("/login");
  }*/
  next();
});

//將相同作法設定成一個函式
const getListData = async (req, res) => {
  let redirect = "";
  const perPage = 25;
  let page = +req.query.page || 1;
  // page = parseInt(page);

  let queryObj = {};
  let sqlWhere = "WHERE 1";
  let search = req.query.search;
  if (search && search.trim()) {
    search = search.trim();

    const searchEsc = db.escape("%" + search + "%");
    sqlWhere += ` AND\`name\`LIKE ${searchEsc}`;
    queryObj = { ...queryObj, search };
  }
  // console.log({sqlWhere});
  res.locals.search = search; //傳到ejs
  res.locals.queryObj = queryObj; //傳到ejs

  page = parseInt(page);

  if (page < 1) {
    redirect = req.baseUrl; //轉向別頁
  }
  //總筆數
  //[[{展開}]]
  const [[{ totalRows }]] = await db.query(
    `SELECT COUNT(1) totalRows FROM address_book ${sqlWhere}`
  );
  //總頁數(做分頁)
  const totalPages = Math.ceil(totalRows / perPage);
  let rows = [];
  if (totalRows > 0) {
    if (page > totalPages) {
      redirect = req.baseUrl + `?page=` + totalPages;
    }
    const sql = `SELECT * FROM address_book ${sqlWhere} ORDER BY sid DESC LIMIT ${
      (page - 1) * perPage
    },${perPage}`;
    // return res.send(sql); // SQL 除錯方式之一,會輸出sql的格式
    [rows] = await db.query(sql);
  }
  //   res.json({
  //     totalRows,
  //     totalPages,
  //     perPage,
  //     page,
  //     rows,
  //   });

  //轉換Date 類型的物件變成格式化的字串
  const fm = "YYYY-MM-DD";
  rows.forEach((v) => {
    v.birthday2 = moment(v.birthday).format(fm);
    // v.birthday3 = res.locals.myToDateString(v.birthday);//可以從index.js裡面去拿此功能
  });

  return {
    totalRows,
    totalPages,
    perPage,
    page,
    rows,
    redirect,
  };
};
router.get("/add", async (req, res) => {
  res.render("address-book/add", { pageName: "ab-add" }); //呈現表單
});
router.post("/add", upload.none(), async (req, res) => {
  let { name, email, mobile, birthday, address } = req.body;

  if (!moment(birthday).isValid()) {
    birthday = null;
  } else {
    birthday = moment(birthday).format("YYYY-MM-DD");
  }
  const sql =
    "INSERT INTO `address_book`(`name`, `email`, `mobile`, `birthday`, `address`, `created_at`) VALUES (?,?,?,?,?, NOW())";
  const [result] = await db.query(sql, [
    name,
    email,
    mobile,
    birthday,
    address,
  ]);
  res.json({
    success: !!result.affectedRows,
    postData: req.body,
    result,
  });
});
router.get("/edit/:sid", async (req, res) => {
  const sql = "SELECT * FROM address_book WHERE sid=?";
  const [rows] = await db.query(sql, [req.params.sid]);
  if (rows.length) {
    res.render("address-book/edit", rows[0]); //呈現編輯的表單
    // res.render("address-book/edit", {
    //   ...row[0],
    //   Referer: req.get("Referer") || "",
    // });
  } else {
    res.redirect(req.baseUrl);
  }
});
router.put("/edit/:sid", upload.none(), async (req, res) => {
  const sid = req.params.sid;
  let { name, email, mobile, birthday, address } = req.body;

  if (!moment(birthday).isValid()) {
    birthday = null;
  } else {
    birthday = moment(birthday).format("YYYY-MM-DD");
  }

  const sql =
    "UPDATE `address_book` SET `name`=?,`email`=?,`mobile`=?,`birthday`=?,`address`=? WHERE `sid`=? ";

  const [result] = await db.query(sql, [
    name,
    email,
    mobile,
    birthday,
    address,
    sid,
  ]);

  res.json({
    success: !!result.changedRows,
    formData: req.body,
    result,
  });
});

router.delete("/:sid", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };
  //console.log("res.locals.bearer:", res.locals.bearer);

  if (res.locals.bearer.sid && res.locals.bearer.account) {
    //req.params.sid
    const sql = "DELETE FROM address_book WHERE sid=?";
    const [result] = await db.query(sql, [req.params.sid]);
    output.success = !!result.affectedRows;
    output.error = output.success ? "" : "刪除發生錯誤";
  } else {
    output.error = "沒有權限做刪除";
  }
  /*const sql = "DELETE FROM address_book WHERE sid=?";
  const [result] = await db.query(sql, [req.params.sid]);*/
  res.json(output);
});

router.get("/", async (req, res) => {
  const output = await getListData(req, res);
  if (output.redirect) {
    return res.redirect(output.redirect);
  }
  res.render("address-book/list", output);
});

router.get("/api", async (req, res) => {
  res.json(await getListData(req, res));
});

module.exports = router;
