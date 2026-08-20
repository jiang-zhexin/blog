---
pubDatetime: 2026-06-05T13:30:00+08:00
title: All You Need About Python Decorator
tags:
  - Python
description: DECORATOR IS ALL YOU NEED 😈
---

正如你所知道的，`decorator` 只是一个语法糖

```python
@decorator
def func():
    pass
```

它等价于如下写法：

```python
def func():
    pass


func = decorator(func)
```

## 一个基础的 decorator

笔者作为一个热衷于追求新东西的极客，自然是要求写一个符合 type hints 的 decorator 的，以下是一个最基本的 decorator，它仅仅是一个符合要求的装饰器，但它什么都不做

```python
import functools
from collections.abc import Callable


def decorator[**P, R](func: Callable[P, R]) -> Callable[P, R]:

    @functools.wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        return func(*args, **kwargs)

    return wrapper


@decorator
def func1() -> None:
    """doc string"""
    pass
```

> [!NOTE]
> `[**P, R]` 是 python 3.12 后引入的 TypeVar 语法，但是鉴于 python 3.11 将于 2027 年 10 月结束生命周期，我认为没必要介绍旧语法

这里说一下 `@functools.wraps(func)` 是一个什么东西，如果没有这个它，`func1.__name__` 会变成 `wrapper`，`func1.__doc__` 则什么都没有；而使用它则能正确保留

我不明白 `wraps` 为什么不成为写 decorator 的默认习惯，你能在 Google 或者别的什么搜索引擎找到的各种所谓 decorator 入门教程提到 `wraps` 的寥寥无几

更多关于 `wraps` 的信息参考 [官方文档](https://docs.python.org/3/library/functools.html#functools.wraps)

## 二阶装饰器

对于带参数的装饰器

```python
@decorator_with_input("something")
def func():
    pass
```

它等价于

```python
def func():
    pass


func = decorator_with_input("something")(func)
```

我将它命名为**二阶装饰器**是借用了 FP 编程中高阶函数的说法

以下是一个符合 type hints 的二阶装饰器的写法

```python
import functools
from collections.abc import Callable


def decorator_with_input[**P, R](
    input: str,
) -> Callable[[Callable[P, R]], Callable[P, R]]:

    def base_decorator(func: Callable[P, R]) -> Callable[P, R]:
        @functools.wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            return func(*args, **kwargs)
        return wrapper

    return base_decorator


@decorator_with_input("something")
def func2() -> None:
    pass
```

你会发现它没有什么特别的，仅仅只是基础 decorator 多包了一层

## 一个进阶的 decorator

你可能会想要这样一个 decorator，它带有可选的参数

```python
@decorator_with_optional_input
def func3() -> None:
    pass


@decorator_with_optional_input(input="something")
def func4() -> None:
    pass
```

如果你尝试写过就会发现它并没有那么好实现，如果还要满足 type hints 就更难了

但是以下是一个符合 type hints 的 decorator 的写法

```python
import functools
from collections.abc import Callable
from typing import overload


@overload
def decorator_with_optional_input[**P, R](
    func: None = None, *, input: str
) -> Callable[[Callable[P, R]], Callable[P, R]]: ...


@overload
def decorator_with_optional_input[**P, R](
    func: Callable[P, R], *, input: str | None = None
) -> Callable[P, R]: ...


def decorator_with_optional_input[**P, R](
    func: Callable[P, R] | None = None, *, input: str | None = None
) -> Callable[[Callable[P, R]], Callable[P, R]] | Callable[P, R]:
    if func is None:
        return functools.partial(decorator_with_optional_input, input=input)

    @functools.wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        return func(*args, **kwargs)

    return wrapper
```

以下是该 decorator 一些要点

- 由于 `func` 占据了第一个位置参数，因此额外的参数 `input` 只能作为键值参数
- 由于 `func` 是否为 `None` 会引起该函数返回值类型的变化，因此肯定会使用 `overload` 语法。`overload` 参见我的这篇 [blog](/posts/pythonic-tips#使用-overload)
- `functools.partial` 的作用参见 [官方文档](https://docs.python.org/3/library/functools.html#functools.partial)

## 类装饰器

这里的类装饰器而是将 class 用作 decorator。由于 python 存在用于装饰 class 的 decorator，特此强调

```python
class ClassDecorator[**P, R]:
    def __init__(self, func: Callable[P, R]) -> None:
        self._func = func
        functools.update_wrapper(self, func)

    def __call__(self, *args: P.args, **kwargs: P.kwargs) -> R:
        return self._func(*args, **kwargs)


@ClassDecorator
def func5() -> None:
    pass
```

`functools.update_wrapper` 的作用等用于 `functools.wraps`

## 对象装饰器

对象装饰器真没什么好说的，只是把 function 变成了 method

```python
class ObjectDecorator:
    def __init__(self) -> None:
        pass

    def __call__[**P, R](self, func: Callable[P, R]) -> Callable[P, R]:
        @functools.wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            return func(*args, **kwargs)

        return wrapper


@ObjectDecorator()
def func6() -> None:
    pass
```

## Concatenate

如果在 decorator 里改变了 func 的性质，比如修改入参之类的，在 python runtime 几乎没什么难度，这是动态语言的优势。但是如果还要做到 type hints，就不得不使用 `Concatenate` 了

```python
import functools
from collections.abc import Callable
from typing import Concatenate

type Context = str


def with_context[**P, R](func: Callable[Concatenate[Context, P], R]) -> Callable[P, R]:

    @functools.wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        return func("your context", *args, **kwargs)

    return wrapper


@with_context
def func7(ctx: Context, other_arg: str) -> None:
    pass


func7(other_arg="other_arg")
```

在这个例子中，`func7` 的第一个参数 `ctx` 是被 decorator 自动注入了，在真正调用 `func7` 时不需要自己去加入 `ctx` 了
