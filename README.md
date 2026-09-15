# 虎窝音乐

一个基于 [APlayer](https://github.com/DIYgod/APlayer) 的静态音乐播放器，通过 IPFS 网关获取音乐文件、歌词和封面图片，支持歌词同步显示。

## 功能特性

- 通过 IPFS 网关获取音乐文件、歌词和封面图片
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
# 进入项目目录
cd 虎窝音乐

# 使用 Python 启动服务器
python -m http.server 8000

# 或使用 Node.js
npx serve .

# 访问 http://localhost:8000
```

## 配置说明

### 音乐列表

编辑 `musiclist.json` 文件，直接填写完整的 IPFS URL，格式如下：

```json
[
  {
    "name": "歌曲名称",
    "artist": "歌手",
    "url": "https://gateway.ipfsscan.io/ipfs/<CID>/歌曲名称 - 歌手.flac",
    "cover": "https://gateway.ipfsscan.io/ipfs/<CID>/歌曲名称 - 歌手.jpg",
    "lrc": "https://gateway.ipfsscan.io/ipfs/<CID>/歌曲名称 - 歌手.lrc"
  }
]
```

将 `<CID>` 替换为你的 IPFS 目录 CID。歌曲文件、歌词和封面图片均存放在该 CID 根目录下，文件名格式为 `歌曲名 - 歌手名.扩展名`。

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
├── css/                    # 样式文件
│   ├── APlayer.css         # APlayer 播放器样式
│   └── main.css            # 自定义样式
├── img/                    # 封面图片资源（站点图标等）
├── js/                     # JavaScript 文件
│   ├── APlayer.min.js      # APlayer 核心库
│   ├── color-thief.min.js  # 颜色提取库
│   ├── localEngine.js       # IPFS 音乐引擎
│   ├── Meting.js            # MetingJS 音乐API（备选）
│   └── main.js             # 主逻辑
├── meting-api/             # MetingAPI 服务端（备选）
├── config.js               # 音乐列表配置
├── index.html              # 主页面
├── musiclist.json          # 音乐列表（IPFS 完整 URL）
└── README.md              # 项目说明
```

## 许可证

项目采用 MIT 协议，包含以下开源项目：

| 项目 | 协议 |
| :--- | :--- |
| [APlayer](https://github.com/DIYgod/APlayer) | MIT |
| [color-thief](https://github.com/lokesh/color-thief) | MIT |
