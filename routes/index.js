var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

module.exports = router;

router.post("/question5", (req, res, next) => {
  var result = {
    name: "공동",
    point: 4,
    grade: "mfi",
  };

  res.render("fin", result);
});
