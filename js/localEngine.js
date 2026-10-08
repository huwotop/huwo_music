function encodeNonAscii(str) {
  return (str || '').replace(/[^\x00-\x7F]/g, function(c) {
    return encodeURIComponent(c);
  });
}

var encodedLocalMusic = localMusic.map(item => ({
  name: item.name,
  artist: item.artist,
  url: encodeNonAscii(item.url),
  cover: encodeNonAscii(item.cover),
  lrc: encodeNonAscii(item.lrc)
}));

var localPageEl = document.getElementById('heoMusic-page');
// 清空 getCustomPlayList() 预先注入的占位 <meting-js> 节点
localPageEl.innerHTML = '';
localPageEl.classList.add('localMusic');

const ap = new APlayer({
  container: localPageEl,
  lrcType: 3,
  audio: encodedLocalMusic,
  listFolded: window.innerWidth < 768 ? true : false
});

// 与 Meting.js 保持一致，暴露全局实例
window.ap = ap;

heo.setupMediaSessionHandlers(ap);

// 与 Meting.js 保持一致：派发 aplayerloaded 事件
// 否则 main.js 中挂在该事件上的键盘快捷键与窗口 resize 逻辑永远不会绑定
window.dispatchEvent(new Event('aplayerloaded'));
