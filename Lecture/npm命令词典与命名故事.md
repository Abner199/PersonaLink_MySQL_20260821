# npm 命令词典与命名故事：不要背口令，要读懂约定

> ## 先记住两句最重要的话
>
> **`ci`：clean install，按锁文件“干净、冻结地”重装依赖。**
>
> **`dev`：development，开发模式；它不是 npm 天生自带的命令，而是项目作者在 `package.json` 中约定的脚本名。**

## 1. npm 到底在做什么

npm 最初服务于 Node.js 社区共享和安装 JavaScript 包的需求。随着项目越来越复杂，开发者不只需要“下载一个包”，还反复需要做同几类事情：安装依赖、启动程序、运行测试、构建发布文件。

于是 `package.json` 成了项目的“说明书”，其中的 `scripts` 成了团队的“按钮面板”：把一长串命令取一个统一名字。npm 官方把 `scripts` 解释为：既支持一些约定的生命周期脚本，也支持任意用户自定义脚本；后者通过 `npm run <名字>` 执行。[npm Scripts 官方说明](https://docs.npmjs.com/cli/v11/using-npm/scripts/)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

这不是“npm 自动猜出 Vite”，而是项目作者告诉 npm：当团队说“dev”时，就运行 `vite`。

## 2. 名字从哪里来：一段约定的历史

早期软件开发大量使用终端命令和构建工具。人们逐渐形成了短、清楚、可读的动词习惯：`start` 表示启动、`test` 表示测试、`build` 表示把源代码加工成可发布文件、`dev` 表示开发阶段。

这不是某个人一次性规定的“宇宙标准”，而是工具生态长期形成的共同语言：

- npm 对 `start`、`test`、`stop` 等提供了专门命令和生命周期；`prestart`、`poststart` 也会围绕 `start` 执行。
- `dev`、`build`、`preview` 通常是项目作者/框架作者采用的易读名字，本质上是用户自定义脚本。
- Vite 等现代前端工具普遍把“带热更新的开发服务器”叫作 `dev`，把“生成部署文件”叫作 `build`，学生因此经常看到这些名字。

**所以：命名有历史形成的习惯，但真正的唯一依据永远是当前目录的 `package.json`。**

## 3. 本项目命令一览

| 命令 | 英文全称/含义 | 它读取什么 | 本项目实际执行什么 | 什么时候用 |
| --- | --- | --- | --- | --- |
| `npm ci` | clean install，干净安装 | `package.json` + `package-lock.json` | 安装锁定的依赖 | 首次运行、换电脑、CI、部署 |
| `npm install` | install，安装 | `package.json`，必要时更新锁文件 | 安装/新增/升级依赖 | 开发者新增依赖时 |
| `npm start` | start，启动包 | `scripts.start` | 后端：`node server.js` | 普通启动后端 |
| `npm run dev` | development，开发模式 | `scripts.dev` | 前端：`vite`；后端：`nodemon server.js` | 修改代码时开发 |
| `npm run build` | build，构建 | `scripts.build` | 前端：`vite build` | 交付/部署前生成 `dist` |
| `npm run preview` | preview，预览 | `scripts.preview` | 前端：`vite preview` | 本机看构建结果 |
| `npm run` | 列出/运行脚本 | `scripts` | 显示可用脚本 | 不确定该敲什么时 |

## 4. 为什么 `ci` 要强调

`npm ci` 的官方标题就是“Clean install a project”。它要求已有 `package-lock.json`；如果锁文件和 `package.json` 不匹配会报错；会先移除已有 `node_modules`；不会写入 `package.json` 或锁文件。[npm ci 官方说明](https://docs.npmjs.com/cli/v11/commands/npm-ci/)

这正是课堂和部署所需要的：

```text
教师电脑安装的版本 = 学生电脑安装的版本 = CI 服务器安装的版本
```

而 `npm install` 更像“我要调整购物清单”：例如 `npm install axios`，它会把 Axios 写入依赖清单并更新锁文件。已经有一份正确锁文件、只是要运行项目时，不必用 `npm install` 重新决定版本。

> 注意：`npm ci` 处理的是 `node_modules`，不会删除 `src`、MySQL 数据、Markdown 文档或你的 Git 提交；但不要把自己写的文件放进 `node_modules`。

## 5. 为什么 `dev` 要强调

`dev` 是 **development（开发）** 的缩写。开发模式的重点是让人写代码时舒服：快速启动、文件一保存就更新页面（热更新）、显示更容易排查的错误。

在本项目中：

```text
frontend/package.json
"dev": "vite"
```

所以 `cd frontend` 后的 `npm run dev` 实际就是运行 Vite 开发服务器；它默认服务于开发，不等于把网站部署到公网。

后端也有：

```text
backend/package.json
"dev": "nodemon server.js"
```

`nodemon` 会观察后端文件，改代码后自动重启 Node 进程。因此：

- 日常后端启动：`npm start`，稳定、简单。
- 边写后端边调试：`npm run dev`，省去每次手动停掉再启动。
- 日常前端开发：`npm run dev`，因为 Vite 的开发服务器和热更新就在这个脚本里。

## 6. `start` 是不是等于“生产环境”？

**不是。** `start` 的意思只是“运行 `scripts.start`”。npm 官方规定：如果定义了 `scripts.start`，`npm start` 就执行它；若没有定义但项目根目录有 `server.js`，npm 会默认执行 `node server.js`。[npm start 官方说明](https://docs.npmjs.com/cli/v11/commands/npm-start/)

本项目后端的 `start` 恰好是普通 Node 启动方式，但是否生产可用还取决于环境变量、反向代理、日志、鉴权、数据库等，不能只看命令名字。

## 7. 为什么 `npm start` 不写 `run`

大多数自定义脚本写作：

```bash
npm run dev
npm run build
```

而 npm 给 `start`、`test`、`stop`、`restart` 等少数常用生命周期命令提供了短写法：

```bash
npm start
npm run start
```

两句效果相同。`dev` 没有这个特殊短写法，因此本项目写 `npm run dev`；直接输入 `npm dev` 不会执行 `scripts.dev`。

## 8. 学生的万能排错步骤

当你不知道该运行什么命令时，不要猜：

```powershell
# 先确认自己在哪个目录
Get-Location

# 看看该目录有没有 package.json
Get-ChildItem package.json

# 让 npm 列出本项目真实定义的脚本
npm run
```

看到脚本后再执行对应命令。对 PersonaLink：

```text
backend  -> npm start 或 npm run dev
frontend -> npm run dev / npm run build / npm run preview
```

## 9. 再向前一步：你可以自己设计脚本

例如团队想把“同时检查并构建”命名为 `check`，可以在 `package.json` 中定义：

```json
{
  "scripts": {
    "check": "npm run build"
  }
}
```

随后运行 `npm run check`。好的脚本名应是动词或清晰短语，并写入 README；不要把不同事情都叫作 `start`，也不要要求同学记住未记录的神秘命令。

## 10. 一张记忆卡

```text
ci      = clean install：锁定清单，统一环境
install = install：新增/调整依赖
dev     = development：写代码时的开发模式
build   = build：把源码加工成部署文件
preview = preview：本地预览构建结果
start   = start：执行项目约定的启动脚本
```
