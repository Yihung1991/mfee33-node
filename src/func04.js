const f1 = a => a*a;
const f3 = a => a*a*a;
// 模組匯出

//多個匯出可以用array跟object
module.exports = {f1,f3};
// module.exports = [f1,f3];