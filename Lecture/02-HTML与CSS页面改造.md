# 第 02 课：HTML 与 CSS——先让页面变好看

## 本课目标

在不改后端的情况下，修改照片卡片的文字样式和悬停效果，理解“结构”和“样式”的区别。

## 要打开的文件

`frontend/src/components/UserCard.vue`

其中 `<template>` 是卡片结构，`<style scoped>` 是卡片样式。先只在样式区域练习。

## 跟着做

1. 搜索 `.user-name`。
2. 将 `font-size` 改大 2px，保存文件并回浏览器观察。
3. 搜索 `.user-card:hover`，把 `translateY(-12px)` 临时改成 `translateY(-18px)`，观察卡片浮起变化。
4. 改回一个你觉得舒服的值，再刷新确认。

## 原理小卡片

```css
transition: transform 0.48s; /* 变化不是瞬间完成 */
transform: translateY(-12px) scale(1.115); /* 上移并放大 */
```

`transform` 通常比直接改变 `width`、`top` 更适合动画，因为浏览器更容易流畅绘制它。

## 必做

- [ ] 让卡片名称更醒目。
- [ ] 修改一个悬停效果并说出你改的 CSS 属性。
- [ ] 不移除 `.user-card:hover .user-avatar` 的图片放大规则；它是当前照片细节查看体验的一部分。

## 常见问题

- 修改没有效果：确认改的是 `<style scoped>` 内的选择器，且浏览器已保存/刷新。
- 页面样式乱了：撤销最后一次修改，或用 Git 查看差异：`git diff`。

## 挑战

给卡片增加一个只在 hover 时出现的浅色边框；不要加入会遮住照片的大面积白色覆盖层。
