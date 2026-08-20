---
pubDatetime: 2025-07-25T22:30:00+08:00
title: Try Typebox
featured: true
tags: 
  - TypeScript
description: ✋😭🤚
---

# Try Typebox! Now

新博客第一篇文章打算给我的一个 project 引一下流：[typebox](https://github.com/jiang-zhexin/typebox)

这个项目还是花了我不少心血去写的，虽然一开始只是供自己使用，但是看别人也有一点需求就开源出来了

其中也是非常感谢 [PuerNya](https://github.com/PuerNya) 提供 `duration` 字段的类型体操，以及 [第一个 issue](https://github.com/jiang-zhexin/typebox/issues/5) 反馈

## 为什么要使用 typebox？

typebox 主要解决了以下的问题：

1. 字段提示：如果你使用任意一个 IDE（如 vs code），编写时就可以享受类型提示，不用担心记不住字段名或拼错
2. 模块化管理：如果你有写多份配置文件的需求，而它们有共同的部分（如 outbounds），就可以单独编写它，在不同的文件中引用
3. tag 检查：sing-box 有相当多使用 tag 进行资源引用的设计（如 rule-set，outbound.selector），但是容易遗忘和混淆；typebox 基于 typescript 的类型系统会检查这一点

## 为什么开发 typebox？

主要还是因为懒（

由于我需要同时管理多人多设备的 sing-box 配置文件，而 .json 文件并不支持引用、导入等模块化方法；sing-box 配置字段多且长，每次都需要对比文档输入，也异常麻烦

因此，花了一下午的时间将所有 sing-box 的配置转成 typescript 的 interface 定义，这样既可以使用 ts 的 `export` `import` 进行模块化管理，也能享受字段类型提示

后来，发现 tag 也容易遗漏，有时在 outbound.selector 中引用了某 outbound 的 tag，却忘记把该 outbound 写进 outbounds 里

正好发现 typescript 5.0 之后加了 [`const` Type Parameters](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#const-type-parameters)，利用该特性对所有的 tag 和对引用该 tag 的地方做了泛型推导，对于非法的 tag 会报错提示，最终完成了这个 feature，也算做了一次相当复杂类型体操

## README 中的两种使用方法应该用哪一种？

如果你有现成的 js/ts 环境，推荐使用 typescript

JSON Schema 是从 typebox 中生成的，它只支持基本的字段提示功能，但是作为一种低成本的使用方式，可用于快速体验 typebox 的一部分功能

| Feature Matrix | JSON Schema | TypeScript |
| -------------- | ----------- | ---------- |
| Auto complete  | ✔️           | ✔️          |
| Modular        | ❌           | ✔️          |
| Tag check      | ❌           | ✔️          |
