# 第 05 课：API——前端怎样请求后端

## 本课目标

理解 API、URL、HTTP 方法、请求体和响应，不把“调用接口”当成魔法。

## 真实调用链

以登录为例：

```text
Login.vue -> userStore.login() -> userService.loginUser()
-> request.js 的 post() -> POST /api/users/login -> backend/routes/users.js
```

`frontend/src/utils/api/request.js` 用 Axios 统一设置 API 地址、超时和错误处理；`userService.js` 则给“登录、注册、查用户”等业务操作起容易懂的名字。

## 跟着做：看一次真实请求

1. 打开浏览器开发者工具，选择 Network。
2. 登录一次，点击名称含 `login` 的请求。
3. 找到四项：Request URL、Request Method、Payload、Response。
4. 说出：前端发了什么，后端回了什么。

## HTTP 方法速记

| 方法 | 常见用途 | 本项目例子 |
| --- | --- | --- |
| GET | 读取数据 | 获取班级、照片墙 |
| POST | 创建或提交动作 | 注册、登录、新增用户 |
| PUT | 更新已有数据 | 更新资料、重置密码 |
| DELETE | 删除数据 | 删除用户、删除班级 |

## 必做

- [ ] 在 Network 找到一次注册或登录请求。
- [ ] 将其状态码记录下来；成功通常是 200 或 201。
- [ ] 故意使用错误密码，观察 401 与正常响应的不同。

## 挑战

阅读 `photoWallService.js`，解释为什么普通用户照片墙请求的是带 `classId` 的地址。
