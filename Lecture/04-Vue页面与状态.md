# 第 04 课：Vue——页面为什么会自动更新

## 本课目标

会识别 `v-model`、`v-if`、`v-for`，知道 Pinia Store 为什么存在。

## 三个最常用指令

| 写法 | 含义 | 本项目例子 |
| --- | --- | --- |
| `v-model` | 输入框与变量双向同步 | 注册表单的 `form.email` |
| `v-if` | 条件成立才显示 | 错误提示 `v-if="errorMessage"` |
| `v-for` | 把数组循环渲染成多个元素 | 班级下拉框、照片墙卡片 |

## 跟着做

打开 `Register.vue`，找到班级 `<option v-for="classInfo in classes">`。它表示 `classes` 数组中有几个班级，页面就显示几个选项。

再打开 `frontend/src/stores/user.js`：

```text
页面调用 Store
Store 调用 API Service
Store 更新 user / isAuthenticated
所有使用这些状态的页面自动重新显示
```

## 必做

- [ ] 在注册页错误提示前加一句“请检查以下内容：”。
- [ ] 说明为什么班级选项不需要手工写死在 HTML 中。
- [ ] 登录后刷新页面，观察登录状态是否仍在；解释这是 `localStorage` 的作用。

## 挑战

在个人资料页增加“资料完成度”文字，例如根据姓名、家乡、电话、简介是否填写计算完成度。先在前端实现，不必新增接口。
