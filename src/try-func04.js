//匯入多個可以用Array/object來寫
const {f1,f3} = require('./func04');
// const [f1,f3] = require('./func04');
const my =require('./func04')



console.log(f1(7));
console.log(f3(8));
console.log(my.f1(2));
console.log(my.f3(3));