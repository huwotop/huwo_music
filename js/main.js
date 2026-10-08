if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || 
                                Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        var el = this;
        do {
            if (el.matches(s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}
console.log("\n %c HeoMusic 开源静态音乐播放器 %c https://github.com/zhheo/HeoMusic \n", "color: #fadfa3; background: #030307; padding:5px 0;", "background: #fadfa3; padding:5px 0;")
var local = false;
var localMusic; // 本地歌单，由远程 JSON 加载后填充
var isScrolling = false; // 添加全局变量 isScrolling，默认为 false
var scrollTimer = null; // 添加定时器变量
var animationFrameId = null; // 添加变量用于跟踪动画帧ID
var lyricClickBound = false; // 歌词点击监听是否已绑定（避免随切歌重复累积）

if (typeof userId === 'undefined') {
  var userId = "8152976493"; // 替换为实际的默认值
}
if (typeof userServer === 'undefined') {
  var userServer = "netease"; // 替换为实际的默认值
}
if (typeof userType === 'undefined') {
  var userType = "playlist"; // 替换为实际的默认值
}

if (typeof remoteMusic !== 'undefined' && remoteMusic) {
  fetch(remoteMusic)
    .then(response => response.json())
    .then(data => {
      if (Array.isArray(data)) {
        localMusic = data;
      }
      loadMusicScript();
    })
    .catch(error => {
      console.error('Error fetching remoteMusic:', error);
      loadMusicScript();
    });
} else {
  loadMusicScript();
}

// 通过 URL 参数指定歌单时（?id=xxx&server=xxx），必须走 Meting 模式
function useRemotePlaylistByParams() {
  var p = new URLSearchParams(window.location.search);
  return !!(p.get('id') && p.get('server'));
}

function loadScript(src) {
  var script = document.createElement('script');
  script.src = src;
  document.body.appendChild(script);
}

function loadMusicScript() {
  // 指定了远程歌单参数，或本地歌单为空，都改用 Meting.js
  var useMeting = useRemotePlaylistByParams() ||
    typeof localMusic === 'undefined' ||
    !Array.isArray(localMusic) ||
    localMusic.length === 0;

  if (useMeting) {
    loadScript('./js/Meting.js');
  } else {
    loadScript('./js/localEngine.js');
    local = true;
  }
}

var volume = 0.8;

// 获取地址栏参数
// 创建URLSearchParams对象并传入URL中的查询字符串
const params = new URLSearchParams(window.location.search);

var heo = {
  _metadataKey: null, // 上一次写入媒体会话的元数据标识，用于去重
  // 处理滚动和触摸事件的通用方法
  handleScrollOrTouch: function(event, isTouchEvent) {
    // 检查事件的目标元素是否在相关区域内部
    let targetElement = event.target;
    let isInTargetArea = false;
    
    // 向上遍历DOM树，检查是否在目标区域内
    while (targetElement && targetElement !== document) {
      if (targetElement.classList) {
        if (isTouchEvent) {
          // 触摸事件检查 aplayer-body 或 aplayer-lrc
          if (targetElement.classList.contains('aplayer-body') || 
              targetElement.classList.contains('aplayer-lrc')) {
            isInTargetArea = true;
            break;
          }
        } else {
          // 鼠标滚轮事件只检查 aplayer-body
          if (targetElement.classList.contains('aplayer-body')) {
            isInTargetArea = true;
            break;
          }
        }
      }
      targetElement = targetElement.parentNode;
    }
    
    // 只有当在目标区域内时才改变 isScrolling
    if (isInTargetArea) {
      // 取消任何正在进行的动画
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      
      // 设置isScrolling为true
      isScrolling = true;
      
      // 清除之前的定时器
      if(scrollTimer !== null) {
        clearTimeout(scrollTimer);
      }
      
      // 设置新的定时器，恢复isScrolling为false
      // 触摸事件给予更长的时间
      const timeoutDuration = isTouchEvent ? 4500 : 4000;
      scrollTimer = setTimeout(function() {
        isScrolling = false;
        heo.scrollLyric();
      }, timeoutDuration);
    }
  },
  
  // 初始化滚动和触摸事件
  initScrollEvents: function() {
    // 监听鼠标滚轮事件
    document.addEventListener('wheel', (event) => {
      this.handleScrollOrTouch(event, false);
    }, { passive: true });
    
    // 监听触摸滑动事件
    document.addEventListener('touchmove', (event) => {
      this.handleScrollOrTouch(event, true);
    }, { passive: true });
  },

  scrollLyric: function () {
    // 当 isScrolling 为 true 时，跳过执行
    if (isScrolling) {
      return;
    }
    
    const lrcContent = document.querySelector('.aplayer-lrc');
    const currentLyric = document.querySelector('.aplayer-lrc-current');

    if (lrcContent && currentLyric) {
      let startScrollTop = lrcContent.scrollTop;
      let targetScrollTop = currentLyric.offsetTop - (window.innerHeight - 150) * 0.3; // 目标位置在30%的dvh位置
      let distance = targetScrollTop - startScrollTop;
      let duration = 600; // 缩短动画时间以提高流畅度
      let startTime = null;

      function easeOutQuad(t) {
        return t * (2 - t);
      }

      function animateScroll(currentTime) {
        // 如果用户正在手动滚动，停止动画
        if (isScrolling) {
          animationFrameId = null;
          return;
        }
        
        if (startTime === null) startTime = currentTime;
        let timeElapsed = currentTime - startTime;
        let progress = Math.min(timeElapsed / duration, 1);
        let easeProgress = window.innerWidth < 768 ? progress : easeOutQuad(progress);
        lrcContent.scrollTop = startScrollTop + (distance * easeProgress);
        
        if (timeElapsed < duration) {
          animationFrameId = requestAnimationFrame(animateScroll);
        } else {
          animationFrameId = null;
        }
      }

      // 取消任何正在进行的动画
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      
      animationFrameId = requestAnimationFrame(animateScroll);
    }
  },

  getCustomPlayList: function () {
    const heoMusicPage = document.getElementById("heoMusic-page");
    const playlistType = params.get("type") || "playlist";

    if (params.get("id") && params.get("server")) {
      console.log("获取到自定义内容")
      var id = params.get("id")
      var server = params.get("server")
      heoMusicPage.innerHTML = `<meting-js id="${id}" server="${server}" type="${playlistType}" mutex="true" preload="auto" order="random"></meting-js>`;
    } else {
      console.log("无自定义内容")
      heoMusicPage.innerHTML = `<meting-js id="${userId}" server="${userServer}" type="${userType}" mutex="true" preload="auto" order="random"></meting-js>`;
    }
  },

  // 处理歌词点击跳转
  addLyricClickEvent: function () {
    // APlayer 每次切歌都会调用本方法，这里只允许绑定一次，避免监听器累积
    if (lyricClickBound) {
      return;
    }
    const lrcContent = document.querySelector('.aplayer-lrc-contents');

    if (lrcContent) {
      lyricClickBound = true;
      lrcContent.addEventListener('click', function (event) {
        if (event.target.tagName.toLowerCase() === 'p') {
          const lyrics = lrcContent.getElementsByTagName('p');
          for (let i = 0; i < lyrics.length; i++) {
            if (lyrics[i] === event.target) {
              // 获取当前播放器实例
              const player = ap;
              // 使用播放器内部的歌词数据
              if (player.lrc.current[i]) {
                const time = player.lrc.current[i][0];
                player.seek(time);
                // 点击歌词后不再等待4s，立即跳转
                isScrolling = false;
                clearTimeout(scrollTimer);
                // 如果当前是暂停状态,则恢复播放
                if (player.paused) {
                  player.play();
                }
              }
              event.stopPropagation(); // 阻止事件冒泡
              break;
            }
          }
        }
      });
    }
  },
  setMediaMetadata: function (aplayerObj, isSongPlaying) {
    const audio = aplayerObj.list.audios[aplayerObj.list.index]
    const coverUrl = audio.cover || './img/icon.webp';
        const currentLrcElement = document.getElementById("heoMusic-page").querySelector(".aplayer-lrc-current");
    const currentLrcContent = currentLrcElement ? currentLrcElement.textContent : "";
    let songName, songArtist;

    if ('mediaSession' in navigator) {
      if (isSongPlaying && currentLrcContent) {
        songName = currentLrcContent;
        songArtist = `${audio.artist} / ${audio.name}`;
      } else {
        songName = audio.name;
        songArtist = audio.artist;
      }
      // timeupdate 触发频率很高（约每秒 4 次），内容未变化时无需重建元数据
      const metadataKey = `${songName}|${songArtist}|${audio.album}|${coverUrl}`;
      if (metadataKey === heo._metadataKey) {
        return;
      }
      heo._metadataKey = metadataKey;

      navigator.mediaSession.metadata = new MediaMetadata({
        title: songName,
        artist: songArtist,
        album: audio.album,
        artwork: [
          { src: coverUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: coverUrl, sizes: '128x128', type: 'image/jpeg' },
          { src: coverUrl, sizes: '192x192', type: 'image/jpeg' },
          { src: coverUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: coverUrl, sizes: '384x384', type: 'image/jpeg' },
          { src: coverUrl, sizes: '512x512', type: 'image/jpeg' }
        ]
      });
    } else {
      console.log('当前浏览器不支持 Media Session API');
      document.title = `${audio.name} - ${audio.artist}`;
    }
  },
  // 响应 MediaSession 标准媒体交互
  setupMediaSessionHandlers: function (aplayer) {
    // 进度条拖动由 APlayer 内部处理，这里只注册 MediaSession 标准媒体动作
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        aplayer.play();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        aplayer.pause();
      });

      // 移除快进快退按钮
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);

      // 设置上一曲下一曲按钮
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        aplayer.skipBack();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        aplayer.skipForward();
      });

      // 响应进度条拖动
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.fastSeek && 'fastSeek' in aplayer.audio) {
          aplayer.audio.fastSeek(details.seekTime);
        } else {
          aplayer.audio.currentTime = details.seekTime;
        }
      });

      // 更新 Media Session 元数据
      aplayer.on('loadeddata', () => {
        heo.setMediaMetadata(aplayer, false);
      });

      // 更新播放状态
      aplayer.on('play', () => {
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
          heo.setMediaMetadata(aplayer, true);
        }
      });

      aplayer.on('pause', () => {
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'paused';
          heo.setMediaMetadata(aplayer, false);
        }
      });

      // 监听时间更新事件
      aplayer.on('timeupdate', () => {
        heo.setMediaMetadata(aplayer, true);
      });
    }
  },
  updateThemeColorWithImage(img) {
    if (local) {
      const updateThemeColor = (colorThief) => {
        const dominantColor = colorThief.getColor(img);
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
          // 叠加rgba(0,0,0,0.4)的效果
          const r = Math.round(dominantColor[0] * 0.6); // 原色 * 0.6 实现叠加黑色透明度0.4的效果
          const g = Math.round(dominantColor[1] * 0.6);
          const b = Math.round(dominantColor[2] * 0.6);
          metaThemeColor.setAttribute('content', `rgb(${r},${g},${b})`);
        }
      };

      if (typeof ColorThief === 'undefined') {
        const script = document.createElement('script');
        script.src = './js/color-thief.min.js';
        script.onload = () => updateThemeColor(new ColorThief());
        document.body.appendChild(script);
      } else {
        updateThemeColor(new ColorThief());
      }
    }

  },
  
  // 新增方法：将歌词滚动到顶部
  scrollLyricToTop: function() {
    const lrcContent = document.querySelector('.aplayer-lrc');
    if (lrcContent) {
      // 使用平滑滚动效果，但不过于缓慢
      lrcContent.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  },
  
  // 初始化所有事件
  init: function() {
    this.getCustomPlayList();
    this.initScrollEvents();
  }
}

// 调用初始化
heo.init();

window.addEventListener('aplayerloaded', function () {
  heo.addLyricClickEvent();
  //空格控制音乐
  document.addEventListener("keydown", function (event) {
    switch (event.code) {
      case "Space":
        // 暂停 / 继续
        event.preventDefault();
        ap.toggle();
        break;
      case "ArrowRight":
        // 下一曲
        event.preventDefault();
        ap.skipForward();
        break;
      case "ArrowLeft":
        // 上一曲
        event.preventDefault();
        ap.skipBack();
        break;
      case "ArrowUp":
        // 增加音量（钳制在 0 ~ 1，并做取整避免浮点误差累积）
        event.preventDefault();
        volume = Math.min(1, Math.round((volume + 0.1) * 10) / 10);
        ap.volume(volume, true);
        break;
      case "ArrowDown":
        // 减小音量（钳制在 0 ~ 1，并做取整避免浮点误差累积）
        event.preventDefault();
        volume = Math.max(0, Math.round((volume - 0.1) * 10) / 10);
        ap.volume(volume, true);
        break;
    }
  });

  // 监听窗口大小变化
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
      ap.list.show();
    } else {
      ap.list.hide();
    }

  });
});
