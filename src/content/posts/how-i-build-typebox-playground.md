---
pubDatetime: 2025-09-30T13:30:00+08:00
title: How I Build Typebox Playground?
tags: 
  - TypeScript
description: 其实 0 人在意 😭
---

关于我为什么写 typebox 可以移步我的另一篇文章 [try typebox](/posts/try-typebox)，不过考虑许多人并没有现成的 JavaScript 开发环境，所以我就想写一个在线的 playground，方便大家直接上手。

## 如何在浏览器中获得良好的编辑体验？

这一方面，毫无疑问选择使用 Monaco Editor，它为 vscode 提供了编辑器内核，功能强大且易于扩展，并且天生支持 JavaScript/TypeScript 语法高亮和智能提示。

```ts
import code from "../raw_code/playground?raw";

const editor = monaco.editor.create(document.getElementById("editor")!, {
  automaticLayout: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  theme: "vs-dark",
  quickSuggestions: true,
});

editor.setModel(
  monaco.editor.createModel(
    code,
    "typescript",
    monaco.Uri.file("playground.ts")
  )
);
```

## 如何在浏览器中运行 TypeScript 代码？

从 Monaco 中获取代码很简单，只需要：

```ts
const code = editor.getValue();
```

接下来就需要考虑运行代码了，由于这里是 TypeScript 代码，浏览器不能直接运行，因此需要将它编译成 JavaScript 代码：

```ts
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";

export async function compileCode(code: string): Promise<string> {
  const result = transpileModule(code, {
    compilerOptions: {
      module: ModuleKind.ESNext,
      target: ScriptTarget.ESNext,
    },
  });
  return result.outputText;
}
```

接下来可以在浏览器中执行编译完毕的代码了，由于 worker 不支持 import maps[^1]，同时考虑到这并不是一个计算繁重的任务，因此直接在主线程中执行：

```ts
function executeCode(code: string) {
  import(URL.createObjectURL(new Blob([code], { type: "application/javascript" })))
    .then((code) => {
      const config = JSON.stringify(code.default, null, 2);
      localStorage.setItem(resultKey, config);
      result.setValue(config);
    })
    .catch((e) => console.error(e));
}
```

> [!TIP]
> 因此不要在 playground 中删除 `export default config;` 这一行，因为我需要通过 `export default` 来获取用户定义的配置对象。

## 如何处理代码中的模块导入？

以上在浏览器中运行 TypeScript 代码的方案是可行的，但我刻意忽略了一个问题：代码中的模块导入。

我需要提供 typebox 的模块导入支持，这个问题分为两个部分：一个是使 Monaco 获取 typebox 的类型定义，另一个是在执行时获取 typebox 编译后的 JavaScript 代码。

### 使 Monaco 获取类型提示

其实这个事很简单：只要把模块代码写入 `node_modules` 下就可以了，由于 typebox 是一个无依赖模块，所以我直接大力出奇迹手动填充了所有文件：

```ts
languages.typescript.typescriptDefaults.setExtraLibs(
  [
    content: code,
    filePath: "file:///node_modules/@zhexin/typebox/index.ts"
  ]
);

monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
  target: languages.typescript.ScriptTarget.ESNext,
  module: languages.typescript.ModuleKind.ESNext,
  allowSyntheticDefaultImports: true,
  moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs, // 这里需要把它变成 nodejs 解析模式
  allowNonTsExtensions: true,
  isolatedModules: true,
});
```

### 在执行时获取模块代码

浏览器中没有文件系统，所以无法从 `@zhexin/typebox` 目录下获取模块代码，因此需要想办法把模块代码提供给运行时。

因为用户的代码也在 DOM 中运行，可以直接使用 `importmap` 来重定向模块导入路径：

```html
<script type="importmap">
  {
    "imports": {
      "@zhexin/typebox": "https://esm.sh/jsr/@zhexin/typebox",
      "@zhexin/typebox/": "https://esm.sh/jsr/@zhexin/typebox/"
    }
  }
</script>
```

在编译前将 `@zhexin/typebox` 重定向到 `https://esm.sh/jsr/@zhexin/typebox` 的 CDN 上。

## 结论

到此为止，一个简单的 Typebox playground 就完成了，完整代码可以在这个仓库 [typebox-playground](https://github.com/jiang-zhexin/typebox-playground) 中找到。

## 吐槽

Monaco Editor 不知道为何不能像 vscode 那样在字符串中进行 autocompletion[^2]，必须要手动按 `Ctrl+Space` 才能触发补全，体验很差。

## 参考

本 playground 在构建时主要参考了以下文章的思路，在此表达感谢：

1. [在 Web 中实现一个 TypeScript Editor](https://blog.rxliuli.com/p/03549d7051e440b7bbdeccf027fac644)
2. [how i built mtcute repl](https://tei.su/blog/mtcute-repl)

[^1]: https://github.com/WICG/import-maps/issues/2

[^2]: https://github.com/microsoft/monaco-editor/discussions/3679
