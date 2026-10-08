# 虎窝音乐

一个基于 [APlayer](https://github.com/DIYgod/APlayer) 的静态音乐播放器。音乐文件、歌词与封面图片默认放在本地 `music/` 目录，也支持通过 `config.js` 指向远程歌单 URL，并支持歌词同步显示。

## 功能特性

- 本地 `music/` 目录托管音乐文件、歌词和封面图片
- 支持通过 `config.js` 指向远程歌单 JSON
- 支持完整的进度条拖动控制
- 歌词同步显示
- 动态主题色（根据封面自动提取）
- 精美的渐变背景和毛玻璃效果
- 丰富的键盘快捷键支持
- 响应式设计，支持移动端

## 技术栈

- **前端**: HTML5 + CSS3 + JavaScript
- **播放器**: APlayer
- **颜色提取**: color-thief

## 基本操作

| 快捷键 | 功能 |
| :--- | :--- |
| `Space` | 暂停/播放音乐 |
| `↑ / ↓` | 增加/减少音量 |
| `← / →` | 上一曲/下一曲 |

## 快速开始

### 本地运行

```bash
# 1. 把音频（.m4a / .mp3 / .flac / .aac）和同名的 .lrc 歌词、.jpg 封面放进 music/ 目录
#    文件名格式：歌手 - 歌曲.m4a  /  歌手 - 歌曲.lrc  /  歌手 - 歌曲.jpg

# 2. 扫描 music/ 目录生成歌单
python3 generate_musiclist.py

# 3. 启动本地服务器
python3 -m http.server 8000

# 访问 http://localhost:8000
```

> 每次增删歌曲后都要重新执行 `generate_musiclist.py`，否则新歌不会出现在播放器中。

## 配置说明

### 音乐列表

`musiclist.json` 由 `generate_musiclist.py` 扫描 `music/` 目录自动生成，一般不需要手工编辑：

```json
[
  {
    "name": "F4",
    "artist": "流星雨",
    "url": "./music/F4%20-%20%E6%B5%81%E6%98%9F%E9%9B%A8.m4a",
    "cover": "./music/F4%20-%20%E6%B5%81%E6%98%9F%E9%9B%A8.jpg",
    "lrc": "./music/F4%20-%20%E6%B5%81%E6%98%9F%E9%9B%A8.lrc"
  }
]
```

脚本按文件名中**第一个** ` - ` 切分：**左半部分写入 `name`，右半部分写入 `artist`**。
播放器列表按 `name - artist` 展示，因此显示顺序与文件名完全一致。`url` / `cover` / `lrc` 均为相对路径，非 ASCII 字符已做 URL 编码。

如果没有对应的封面或歌词文件，对应字段会是空字符串，播放器会回退到默认封面并显示「暂无歌词」。

### config.js

```js
var remoteMusic = "./musiclist.json"
```

- 指向一个歌单 JSON（本地路径或远程 URL）：使用该歌单作为播放列表。
- 留空或文件不存在：回退到 `Meting.js` + `meting-api/` 的在线歌单方案。
- 也可以通过 URL 参数临时指定远程歌单：`?id=<歌单ID>&server=<netease|tencent>`，此模式下会强制走 Meting。

### 部署到 Cloudflare Pages

如果部署到 Cloudflare Pages，需要创建 `_headers` 文件以启用 Range 请求支持：

1. 在项目根目录创建 `_headers` 文件：

```
/*
  Accept-Ranges: bytes
```

2. 将项目上传到 GitHub

3. 在 Cloudflare Pages 中配置并部署项目

4. **测试验证**：
   - 打开浏览器，按 F12 打开开发者工具
   - 切换到 Network 面板
   - 播放一首歌曲，点击音频请求
   - 在 Response Headers 中确认包含 `Accept-Ranges: bytes`

## 项目结构

```
虎窝音乐/
├── css/                      # 样式文件
│   ├── APlayer.css           # APlayer 播放器样式
│   └── main.css              # 自定义样式
├── img/                      # 站点图标与默认背景（icon.webp / icon-r*.webp / cover.webp）
├── js/                       # JavaScript 文件
│   ├── APlayer.min.js        # APlayer 核心库（已定制，内部会调用 heo.* 方法）
│   ├── color-thief.min.js    # 颜色提取库
│   ├── localEngine.js        # 本地音乐引擎（读取 musiclist.json）
│   ├── Meting.js             # MetingJS 音乐 API（备选）
│   └── main.js               # 主逻辑
├── music/                    # 音乐文件 + 同名 .lrc 歌词 + 同名 .jpg 封面
├── meting-api/               # MetingAPI 服务端（备选，需 PHP 环境）
├── config.js                 # 歌单来源配置（remoteMusic）
├── generate_musiclist.py     # 扫描 music/ 生成 musiclist.json
├── index.html                # 主页面
├── musiclist.json            # 自动生成的音乐列表
├── _headers                  # Cloudflare Pages 响应头（Range 支持 + 缓存）
└── README.md                 # 项目说明
```

> `js/APlayer.min.js` 是为本项目定制过的构建版本：它在切歌时会直接调用 `heo.scrollLyric()`、`heo.addLyricClickEvent()`、`heo.updateThemeColorWithImage()` 等全局方法。请勿用上游原版 APlayer 直接替换，否则歌词滚动与主题色会失效。

## 许可证

项目采用 MIT 协议，包含以下开源项目：

| 项目 | 协议 |
| :--- | :--- |
| [APlayer](https://github.com/DIYgod/APlayer) | MIT |
| [color-thief](https://github.com/lokesh/color-thief) | MIT |
