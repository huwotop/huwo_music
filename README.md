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

项目通过 `_headers` 文件配置响应头（Range 请求支持 + 缓存策略 + 阻止 Cloudflare 注入）：

```
/*
  Accept-Ranges: bytes

/music/*
  Cache-Control: public, max-age=31536000

/img/*
  Cache-Control: public, max-age=604800

/js/*
  Cache-Control: public, max-age=31536000, immutable

/css/*
  Cache-Control: public, max-age=31536000, immutable

# HTML：no-transform 阻止 Cloudflare 注入 JS Detections
/
  Cache-Control: public, max-age=0, must-revalidate, no-transform

/index.html
  Cache-Control: public, max-age=0, must-revalidate, no-transform

/404.html
  Cache-Control: public, max-age=0, must-revalidate, no-transform
```

**测试验证**：打开开发者工具 → Network → 播放一首歌曲 → 点击音频请求，确认响应头包含 `Accept-Ranges: bytes`。

> 音频文件必须支持 Range 请求，否则进度条拖动会失效。

#### 为什么 HTML 要加 `no-transform`（请勿删除）

Cloudflare 的 JavaScript Detections（JSD）会往每个 HTML 响应末尾注入一段内联 `<script>`（用于加载 `/cdn-cgi/challenge-platform/scripts/jsd/main.js`）。该脚本每次请求内容都不同（内嵌随机 token），无法用 CSP hash 放行，于是持续触发控制台报错：

```
Executing inline script violates the following Content Security Policy directive:
"script-src 'self' …"  The action has been blocked.
```

JSD 由 Bot Fight Mode 自动开启，官方文档明确说明 **cannot be disabled**，免费版面板也没有对应开关——**关掉 Bot Fight Mode 并不会关掉 JSD**。

官方给出的退出方式就是 `no-transform`：当响应包含该指令时，Cloudflare 不再注入 JSD 脚本（[官方文档](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/javascript-detections/)）。代价是 Cloudflare 可能跳过对 HTML 的压缩（首页约 2.9 KB，影响可忽略），且这些页面的 `js_detection.passed` 会变为 `missing`——而它原本因被 CSP 拦截就已是拿不到的状态，无实际损失。

> 另注：官方文档说明 JSD **不支持通过 `<meta>` 标签设置的 CSP nonce**，因此「改用 nonce 放行」在本项目走不通（本项目的 CSP 写在 `<meta>` 里）。

#### 音频文件需要额外配置 Cache Rule（否则播放很慢）

Cloudflare 只缓存**内置扩展名白名单**内的文件。`.jpg` / `.webp` / `.css` / `.js` 都在白名单里，但 **`.m4a`（以及 `.mp3`）不在**。所以在 `_headers` 里给 `/music/*` 写 `Cache-Control` 只影响浏览器缓存，**不影响 Cloudflare 边缘缓存**：

| 资源 | `cf-cache-status` | 结果 |
| :--- | :--- | :--- |
| `/music/xxx.jpg`（封面） | `HIT` | 从就近边缘节点返回 |
| `/music/xxx.m4a`（音频） | `DYNAMIC` | **每次请求都回源**，播放等待明显变长 |

两个文件在同一个目录、同一条 `Cache-Control: public, max-age=31536000` 下，差别只在扩展名。

解决办法是在 Cloudflare 后台建一条 **Cache Rule**（免费版可建 10 条）：

**Caching → Cache Rules → Create rule**

- 规则名：`Cache audio`
- 匹配表达式：`starts_with(http.request.uri.path, "/music/")`
- 设置：
  - **Cache eligibility** → `Eligible for cache`
  - **Edge TTL** → `Ignore cache-control header and use this TTL` → `1 year`
  - **Browser TTL** → `Respect origin`（保持现有 1 年）

配好后 `/music/*.m4a` 的 `cf-cache-status` 应变为 `HIT`。首次访问某区域仍会回源一次，之后该区域即全部命中。

### 发版与缓存（重要）

CDN 与浏览器会按 `Cache-Control` 长期缓存 `css` / `js` / `img`。**只改文件内容而不改引用地址，线上可能仍显示旧版本。**

因此所有本地静态资源引用都带版本号 `?v=20261008`。发版时把它统一改成新值（例如当天日期）即可：

| 文件 | 需要修改的位置 |
| :--- | :--- |
| `index.html` | 全部 `?v=`（css / js / img / manifest） |
| `manifest.json` | `icons[].src` |
| `css/main.css` | `#music_bg` 的 `background-image` |
| `js/main.js` | 顶部 `ASSET_VER` 常量 |

> 该版本号用于「击穿」已被 CDN 和浏览器缓存的文件。历史教训：曾经因为图标缺失期间 CDN 把 HTML 回退页当作图标缓存了 1 年，导致 favicon 长期损坏。

如果改了文件却忘记改版本号，可在 Cloudflare 后台执行一次清理：

**Cloudflare Dashboard → 选择域名 → Caching → Configuration → Purge Everything**

注意：清理只影响 CDN 边缘节点，**已经访问过站点的浏览器**仍会用本地缓存。要立刻生效仍需依赖 `?v=` 版本号变更。

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
├── 404.html                  # 未找到页面（避免软 404 污染缓存）
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
