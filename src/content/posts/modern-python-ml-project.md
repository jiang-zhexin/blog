---
pubDatetime: 2026-02-18T19:00:00+08:00
title: Modern Python ML Project
featured: true
tags: 
  - Torch
  - Python
  - uv
description: 作为小镇唯一使用 uv、ruff、ty、marimo、polars、altair...
---

如何构建一个现代的 Python 机器学习项目？在这个 blog 中，我将分享一些我个人的经验和最佳实践，帮助你更高效地开发和部署机器学习模型。

## 工具链

欲善其事，必利其器。一个好的工具链可以大大提高开发效率和代码质量。以下是本文推荐的工具链：

- uv[^1]：一站式解决 Python 包安装和虚拟环境管理的问题，默认创建虚拟环境，依赖隔离，支持锁文件。
- ruff[^2]：一个现代化的 Python linter 工具。
- ty[^3]（可选）：一个现代快速的 Python 的类型检查器和 LSP。
- marimo[^4]（可选）：Yet another Python notebooks。Jupyter Notebook 和 Jupyter Lab 的替代品，不同于 Jupyter 的 .ipynb 文件，直接使用 .py 文件，利于 git 管理。
- Polars[^5]（可选）：pandas 的替代品，性能更好，API 也非常友好。
- Altair[^6]（可选）：Matplotlib 的替代品，基于 Vega-Lite，语法更简洁，交互式图表支持更好。
- PyTorch：不会吧，不会吧，还有人用 Tensorflow？爸爸（Google）都不要你了去开发 JAX 了。

## 初始化项目

假设你已经按照 [这里](https://docs.astral.sh/uv/getting-started/installation/) 安装好了 uv，那么使用命令

```bash
uv init example-app
cd example-app
```

即可快速创建一个现代化的 Python 项目。

然后安装几个常用的依赖：

```bash
uv add ruff --dev
uv add ty --dev
uv add marimo
uv add numpy
```

> [!NOTE]
> 如果你需要使用镜像源，可以在 `pyproject.toml` 中添加如下内容（下面的例子使用阿里源）：
>
> ```toml
> [[tool.uv.index]]
> url="https://mirrors.aliyun.com/pypi/simple/"
> default=true
> ```

等一下，你是不是要直接 `uv add torch`？这里稍稍不同，由于 torch 在 PyPi 上仅提供适用于 Windows 和 macOS 的仅 CPU 加速 wheel，以及适用于 Linux 的 GPU 加速 wheel。要想安装适用于 Windows 的 GPU 加速版本，需要使用 torch 的包源。你需要在 `pyproject.toml` 中添加如下内容：

```toml
[[tool.uv.index]]
name = "pytorch-cu130"
url = "https://download.pytorch.org/whl/cu130"
explicit = true

[tool.uv.sources]
torch = [
    { index = "pytorch-cu130", marker = "sys_platform == 'linux' or sys_platform == 'win32'" },
]
```

这里的意思是，在 Windows 和 Linux 平台上安装 torch 时，优先使用 pytorch-cu130 这个包源。然后你就可以正常安装 torch 了：

```bash
uv add torch
```

> [!NOTE]
> 对于其他平台和不同 CUDA 版本等情况，请参考 [这里](https://docs.astral.sh/uv/guides/integration/pytorch)

## 代码质量

代码质量是一个重要的方面，好的代码质量可以提高代码的可读性和可维护性。使用 ruff 可以帮助你自动检查代码中的潜在问题和不规范的地方，保持代码整洁。使用 ty 可以帮助你进行类型检查，提前发现类型错误。

对于你写完的代码，使用如下的命令进行检查：

```bash
uv run ruff check .
uv run ty check

uv run ruff check . --fix
# 也可以直接使用上方的命令自动修复一些简单的代码问题
```

> [!IMPORTANT]
> 但老实说我不指望一个 ML 的项目能做到很好的类型检查，很多 python 的包也没有提供良好的类型注解，比如 torch 和 transformers。  
> 所以 ty 我列为可选，而 ruff 是必选的。

如果你使用 vscode 作为代码编辑器，可以安装 [ruff](https://marketplace.visualstudio.com/items?itemName=charliermarsh.ruff) 和 [ty](https://marketplace.visualstudio.com/items?itemName=astral-sh.ty) 的插件，在编辑器中实时检查代码质量和类型错误。

### 推荐的 Linter 规则

将下面的代码补充到 `pyproject.toml` 中：

```toml
[tool.ruff.lint]
extend-select = [
    "F",        # Pyflakes rules
    "W",        # PyCodeStyle warnings
    "E",        # PyCodeStyle errors
    "I",        # Sort imports properly
    "UP",       # Warn if certain things can changed due to newer Python versions
    "C4",       # Catch incorrect use of comprehensions, dict, list, etc
    "FA",       # Enforce from __future__ import annotations
    "ISC",      # Good use of string concatenation
    "ICN",      # Use common import conventions
    "RET",      # Good return practices
    "SIM",      # Common simplification rules
    "TID",      # Some good import practices
    "TC",       # Enforce importing certain types in a TYPE_CHECKING block
    "PTH",      # Use pathlib instead of os.path
    "TD",       # Be diligent with TODO comments
    "NPY",      # Some numpy-specific things
]
```

## nodebooks

使用 marimo 可以让你在 .py 文件中编写 notebook，相较于 ipynb 本质是 json 格式的文件，利于 git 管理和代码复用。

在 vscode 中安装 [marimo](https://marketplace.visualstudio.com/items?itemName=marimo-team.vscode-marimo) 插件，并且新建一个 .py 文件，默认情况下仍然会以文本编辑器的方式打开，你需要使用 <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> 打开命令面板，然后输入 `marimo: Open as marimo notebook`，可以在编辑器中直接编辑和运行 notebook cell 了，与 Jupyter 相比有一致的体验。

## 常用命令

```bash
# 安装依赖
uv add <package-name>

# 运行代码
uv run <.py-file>

# 格式化代码
uv run ruff check .

# 检查类型（可选，不勉强）
uv run ty check

# 同步依赖
# 这个命令会根据 pyproject.toml 中的依赖信息，安装缺失的依赖，卸载多余的依赖，并且更新锁文件。建议在每次修改 pyproject.toml 后都运行一次这个命令，确保依赖的一致性。
uv sync

# 升级依赖
uv sync --upgrade

# 导出依赖为 requirements.txt
# 这个主要是为使用其他工具链的人准备的，如果你最终会将项目开源到 GitHub 上，导出为 requirements.txt 可以让更多人方便地安装依赖。
uv export --format requirements.txt > requirements.txt
```

## FAQ

### 为什么一定要使用虚拟环境？

不使用虚拟环境，所有的包全部堆在全局环境，不同项目之间的依赖相互干扰，导致版本冲突。如果你平时使用 pytorch，某天需要跑起一个 tenserflow 1.x 的项目，大概率会被 numpy 版本冲突给恶心到。使用虚拟环境可以让每个项目拥有独立的包和依赖，避免这些问题。

### 为什么不使用 pip？

老实说这个问题你或多或少已经有点感觉了，pip 的安装速度慢，依赖全局环境，创建虚拟环境的功能只能说有，谁用谁知道。

### 为什么不使用 conda？

一句话，conda 不使用 PyPi 作为包源，完全脱离了 Python 生态，导致很多包的版本更新滞后，甚至有些包根本没有。

### 为什么使用 uv？

uv 默认使用 PyPi 作为包源，并且默认创建虚拟环境，不同项目之间依赖相互隔离。并且全局缓存依赖包，不会占用大量磁盘空间。

### 为什么需要锁文件？

不使用锁文件，依赖版本不固定，同时依赖的依赖也不固定，可能会导致不同环境下安装的包版本不一致。如果有尝试过跑起他人的项目（比如找个 GitHub 的开源项目，特别是旧一点几年前的），解决依赖问题可是个老大难。而锁文件记录了确切的包版本和哈希值，确保在任何环境中安装的依赖都是一致的。

pylock.toml 是 [PEP 751](https://peps.python.org/pep-0751) 定义的官方锁文件格式，但是目前较新，还没有被广泛采用。但是如果你已经开始使用 uv 作为依赖管理工具，你会发现项目根目录下会生成 uv.lock 文件，这就是 uv 的锁文件，功能和 pylock.toml 类似。

> [!WARNING]
> 我真的是求你们了，给个项目不给个锁文件，几年后的人来考古要跑起来都难。

### 为什么不使用 requirements.txt？

requirements.txt 是一个过时的依赖管理方式，只是早期社区的约定。pyproject.toml 是由 [PEP 518](https://peps.python.org/pep-0518) 和 [PEP 621](https://peps.python.org/pep-0621) 定义的现代 Python 项目的标准配置文件，已经被广泛接受和使用。相比之下，requirements.txt 是一个非正式的约定，没有官方的规范和支持。

而且 requirements.txt 需要手动填写，你真的会像这样写吗？

```plaintext
numpy==2.4.2 \
    --hash=sha256:068cdb2d0d644cdb45670810894f6a0600797a69c05f1ac478e8d31670b8ee75 \
    --hash=sha256:12e26134a0331d8dbd9351620f037ec470b7c75929cb8a1537f6bfe411152a1a \
    --hash=sha256:1f92f53998a17265194018d1cc321b2e96e900ca52d54c7c77837b71b9465181 \
    --hash=sha256:20abd069b9cda45874498b245c8015b18ace6de8546bf50dfa8cea1696ed06ef \
    --hash=sha256:2b8f157c8a6f20eb657e240f8985cc135598b2b46985c5bccbde7616dc9c6b1e \
    --hash=sha256:444be170853f1f9d528428eceb55f12918e4fda5d8805480f36a002f1415e09b \
    --hash=sha256:5daf6f3914a733336dab21a05cdec343144600e964d2fcdabaac0c0269874b2a \
    --hash=sha256:659a6107e31a83c4e33f763942275fd278b21d095094044eb35569e86a21ddae \
    --hash=sha256:6ed0be1ee58eef41231a5c943d7d1375f093142702d5723ca2eb07db9b934b05 \
    --hash=sha256:7cdde6de52fb6664b00b056341265441192d1291c130e99183ec0d4b110ff8b1 \
    --hash=sha256:7f54844851cdb630ceb623dcec4db3240d1ac13d4990532446761baede94996a \
    --hash=sha256:8c50dd1fc8826f5b26a5ee4d77ca55d88a895f4e4819c7ecc2a9f5905047a443 \
    --hash=sha256:98f16a80e917003a12c0580f97b5f875853ebc33e2eaa4bccfc8201ac6869308 \
    --hash=sha256:9e4424677ce4b47fe73c8b5556d876571f7c6945d264201180db2dc34f676ab5 \
    --hash=sha256:b2f0073ed0868db1dcd86e052d37279eef185b9c8db5bf61f30f46adac63c909 \
    --hash=sha256:bba37bc29d4d85761deed3954a1bc62be7cf462b9510b51d367b769a8c8df325 \
    --hash=sha256:cda077c2e5b780200b6b3e09d0b42205a3d1c68f30c6dceb90401c13bff8fe74 \
    --hash=sha256:d1240d50adff70c2a88217698ca844723068533f3f5c5fa6ee2e3220e3bdb000 \
    --hash=sha256:d30291931c915b2ab5717c2974bb95ee891a1cf22ebc16a8006bd59cd210d40a \
    --hash=sha256:da6cad4e82cb893db4b69105c604d805e0c3ce11501a55b5e9f9083b47d2ffe8 \
    --hash=sha256:e98c97502435b53741540a5717a6749ac2ada901056c7db951d33e11c885cc7d \
    --hash=sha256:fcf92bee92742edd401ba41135185866f7026c502617f422eb432cfeca4fe236
```

> [!TIP]
> 我估计很多人都不知道 requirements.txt 还支持 hash 校验。

## 参考

[^1]: https://docs.astral.sh/uv/
[^2]: https://docs.astral.sh/ruff/
[^3]: https://docs.astral.sh/ty/
[^4]: https://marimo.io/
[^5]: https://docs.pola.rs/
[^6]: https://altair-viz.github.io/
