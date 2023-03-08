const express = require("express");

//存放個體變數
const router = express.Router();

router.get("/admin/:action?/:id?", (req, res) => {
  res.json(req.params);
});

module.exports = router;
