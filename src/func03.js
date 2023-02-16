const f1 = a => a*a;
const f3 = a => a*a*a;
// 模組匯出
//module.exports只能一次,所以f1會被f3覆蓋
module.exports = f1;
module.exports = f3;