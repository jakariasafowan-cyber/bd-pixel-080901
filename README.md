# DFTV App Welcome Page

简洁的APP欢迎页面，用于内嵌在Android APK中，支持Facebook Pixel事件追踪。

## 功能特点

- ✅ 简洁的语言选择界面（孟加拉语 + 英语）
- ✅ Facebook Pixel购物事件追踪
- ✅ 深色主题，与落地页配色一致
- ✅ 突出显示"100% FREE"
- ✅ 响应式设计，适配所有设备

## 在线预览

部署到Vercel后，访问你的域名即可预览。

## 配置方法

编辑 `index.html` 文件顶部的配置区域：

```javascript
// 📱 Facebook Pixel ID - 修改这里的像素ID
var FACEBOOK_PIXEL_ID = '1332039895717687';

// 🎯 Final Destination URL - 修改这里的最终跳转地址
var FINAL_URL = 'https://mayapsst.site/';
```

## 部署到Vercel

### 方法1：通过GitHub自动部署（推荐）

1. **创建GitHub仓库**
   ```bash
   # 在本地创建新的Git仓库
   cd BD-dating/TV4
   git init
   git add .
   git commit -m "Initial commit: DFTV welcome page"
   ```

2. **推送到GitHub**
   ```bash
   # 在GitHub上创建新仓库后
   git remote add origin https://github.com/你的用户名/dftv-welcome.git
   git branch -M main
   git push -u origin main
   ```

3. **连接Vercel**
   - 访问 [https://vercel.com](https://vercel.com)
   - 点击 "Import Project"
   - 选择你的GitHub仓库
   - 点击 "Deploy"
   - 等待部署完成，获取你的域名

4. **配置自定义域名（可选）**
   - 在Vercel项目设置中
   - 进入 "Domains"
   - 添加你的自定义域名

### 方法2：使用Vercel CLI

1. **安装Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录Vercel**
   ```bash
   vercel login
   ```

3. **部署**
   ```bash
   cd BD-dating/TV4
   vercel
   ```

4. **生产环境部署**
   ```bash
   vercel --prod
   ```

## 文件结构

```
BD-dating/TV4/
├── index.html          # 主页面（语言选择 + FB像素）
├── vercel.json         # Vercel部署配置
└── README.md           # 说明文档
```

## APK集成方法

### 在Android WebView中使用

```java
WebView webView = findViewById(R.id.webview);
WebSettings webSettings = webView.getSettings();

// 启用JavaScript
webSettings.setJavaScriptEnabled(true);

// 启用DOM Storage
webSettings.setDomStorageEnabled(true);

// 加载在线页面
webView.loadUrl("https://你的vercel域名.vercel.app");

// 或者从assets加载本地文件
// webView.loadUrl("file:///android_asset/index.html");
```

### AndroidManifest.xml权限

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## 工作流程

1. 用户打开APP
2. WebView加载欢迎页面
3. 触发FB Pixel的 **PageView** 事件
4. 用户选择语言（孟加拉语或英语）
5. 触发FB Pixel的 **Purchase** 事件（无价值参数）
6. 自动跳转到最终页面（带语言参数）

## FB Events Manager验证

1. 访问 [Facebook Events Manager](https://business.facebook.com/events_manager2/)
2. 选择你的像素
3. 进入"测试事件"
4. 打开页面并操作
5. 应该能看到：
   - `PageView` 事件（页面加载时）
   - `Purchase` 事件（选择语言时）

## 优势

- ✅ **数据准确**：只追踪真实用户行为
- ✅ **易于部署**：一键部署到Vercel
- ✅ **全球CDN**：Vercel提供快速访问
- ✅ **自动HTTPS**：无需额外配置
- ✅ **版本控制**：通过GitHub管理代码

## 更新方法

修改代码后，推送到GitHub即可自动部署：

```bash
git add .
git commit -m "更新配置"
git push
```

Vercel会自动检测到更新并重新部署。

## 注意事项

1. **跨域问题**：如果APK内WebView加载在线URL，确保配置正确的CORS
2. **网络权限**：确保APK有网络访问权限
3. **像素ID**：记得修改为你自己的Facebook Pixel ID
4. **测试**：先在浏览器中测试，确认事件正常触发

## 技术支持

如遇问题，请检查：
- Facebook Pixel ID是否正确
- 网络连接是否正常
- JavaScript是否启用
- FB Events Manager中是否看到事件

---

**部署状态**：[![Vercel](https://vercelbadge.vercel.app/api/你的用户名/dftv-welcome)](https://vercel.com)
