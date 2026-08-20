---
pubDatetime: 2026-04-13T13:30:00+08:00
title: Migrate Blog from Hugo to Astro
tags: 
  - Astro
description: Thank you, Hugo! 👋
---

**blog 最重要的意义不在于写文章而在于整些花里胡哨**，最后我还是被这个回旋镖击中了。总之我再次折腾了一下 blog，把它从 Hugo 迁移到了 Astro。

## 起因

[Hugo v0.156.0](https://github.com/gohugoio/hugo/releases/tag/v0.156.0) 又一次 break change 将 `.Site.Author` 删除替换为了 `.Site.Params.Author.`，本身其实不是什么问题，毕竟它很早就标记了 deprecated。

但是由于我使用的 theme (hugo-theme-monochrome) 开发并不是很积极，作者已经 6 个月没有任何 commit 了，尽管很快就有相关 issue 并且不久有人便贡献了 [Pull Request](https://github.com/kaiiiz/hugo-theme-monochrome/pull/84)，但作者迟迟没有合并。

虽然可以简单的把 commit 拿过来 (事实上我也这么做了)，不过经历这次事件我还是对 Hugo 失望了，使用一个还未发布 v1.0.0 的构建系统加之 hugo-theme-monochrome 作者的维护并不积极，使我产生了切换 blog 框架的想法。

## 为什么选择 Astro？

Blog 最终还是要编译到 HTML 的，但又少不了前端渲染工具 (比如 katex, mermaid, github-blockquote-alert)，对于非 JS 生态的构建往往需要在 `<head>` 中引入这些包，但是如果直接使用 JS 框架就不一样了，可以使用包管理器并且在构建过程中引入，避免手动引入的麻烦。

而且我对 JS 并无什么偏见，而 Astro 恰好是比较成熟的静态网站构建工具，因此选择了 Astro。

## 结论

按照一般惯例，换框架的第一件事就是大写特写自己又踩了什么坑，但是我觉得没什么必要，按照 JS 一般的发展规律，不出半年这类所谓教程就会过时，届时本教程就成了**坑点**啦，所以免了。

> [!TIP]
> 本 Blog 有一篇 [render test](/posts/render-test) 的文章，涵盖了 markdown 的许多高级功能，迁移的时候对着这篇文章看就能发现各种问题，十分不错。

最后，目前我使用的 Astro theme 是 [astro-paper](https://github.com/satnaing/astro-paper)，个人感觉审美十分在线。至于一些附加功能，翻翻 issue 也能解决，就酱。
