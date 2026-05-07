// 批量调整 04模块和合作游戏模块的 top 值
const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 04模块元素的 top 值（需要上移177px）
const mod4Tops = [5252, 5168, 5639, 5533, 5533, 5737, 5737, 6011, 6087, 6087, 6232, 6232, 6232, 6377, 6377, 6523];
// 合作游戏及之后元素的 top 值（需要上移268px）
const gameTops = [6850, 6903, 7186, 7097, 7186, 7097, 7186, 7690, 7601, 7690, 7601, 7690, 8200, 8329, 8300, 8820];

const shift4 = 177;
const shiftGame = 268;

// 处理04模块
mod4Tops.forEach(function(t) {
  const oldStr = 'top:' + t + 'px';
  const newStr = 'top:' + (t - shift4) + 'px';
  html = html.split(oldStr).join(newStr);
});

// 处理合作游戏模块及之后
gameTops.forEach(function(t) {
  const oldStr = 'top:' + t + 'px';
  const newStr = 'top:' + (t - shiftGame) + 'px';
  html = html.split(oldStr).join(newStr);
});

fs.writeFileSync('index.html', html);
console.log('Done');
