---
pubDatetime: 2026-04-16T17:30:00+08:00
title: Pythonic Tips
tags:
  - Python
description: 你的 Python 写的像 C/C++/Java 一样 😋
---

这是一些让你的代码更 Pythonic 的技巧。

> [!IMPORTANT]
> 不定期更新！

## enumerate

如果同时需要一个数组的下标和其值，学过 C 的可能会这么写：

```python
item_list = ["a", "b", "c"]

for i in range(len(item_list)):
    item = item_list[i]
    print(f"{i + 1}: {item}")
```

但是 python 中，最佳做法是使用 enumerate。

```python
item_list = ["a", "b", "c"]

for i, item in enumerate(item_list):
    print(f"{i + 1}: {item}")
```

## zip

需要同时遍历两个等长的序列时，你可能会这样写：

```python
names = ["Alice", "Bob", "Charlie"]
scores = [85, 92, 78]

for i in range(len(names)):
    print(f"{names[i]}: {scores[i]}")
```

使用 `zip` 更加简洁：

```python
names = ["Alice", "Bob", "Charlie"]
scores = [85, 92, 78]

for name, score in zip(names, scores):
    print(f"{name}: {score}")
```

> [!TIP]
> 如果两个序列不等长，`zip` 默认会按最短的截断。如需按最长的对齐（用默认值填充），使用 `itertools.zip_longest`。

## dedent

在 python 中，需要多行文本时往往会出现如下的情况：破坏了缩进，十分不美观。

```python
def _() -> str:
    return """
frist line
second line
third line
"""
```

使用 `textwrap.dedent` 就可以自动去掉多余的空白符号。

```python
from textwrap import dedent


def _() -> str:
    return dedent("""
        frist line
        second line
        third line
        """)
```

## 赋值表达式 `:=`

```python
def get_something() -> str | None: ...


res = get_something()
if res is not None:
    print(res)
else:
    print("can not get result...")
```

`:=` 允许你在判断语句中定义变量：

```python
def get_something() -> str | None: ...


if (res := get_something()) is not None:
    print(res)
else:
    print("can not get result...")
```

上面那个例子或许不好，下面的例子更能体现 `:=` 的用途：

```python
item_list = [None, 1, 2]


def do_something(x: int | None = None) -> int | None:
    if x is None:
        return None

    return x + 1


new_list = [
    do_something(item)
    for item in item_list
    if do_something(item) is not None
]
```

在这个例子中，可以看到对每个 `item` 执行了两遍 `do_something`，而使用 `:=` 可以避免这种情况：

```python
item_list = [None, 1, 2]


def do_something(x: int | None = None) -> int | None:
    if x is None:
        return None

    return x + 1


new_list = [
    res
    for item in item_list
    if (res := do_something(item)) is not None
]
```

## match / case

Python 3.10 引入了模式匹配，可以替代复杂的 `if-elif-isinstance` 链：

```python
class Click: ...
class Key: ...
class Quit: ...


def handle(event: Click | Key | Quit) -> str: ...
```

```python
# 不用 match
def handle(event: Click | Key | Quit) -> str:
    if isinstance(event, Click):
        return "clicked"
    elif isinstance(event, Key):
        return "key pressed"
    elif isinstance(event, Quit):
        return "quitting"
```

```python
# 使用 match
def handle(event: Click | Key | Quit) -> str:
    match event:
        case Click():
            return "clicked"
        case Key():
            return "key pressed"
        case Quit():
            return "quitting"
```

还可以结合结构解包和守卫条件：

```python
match command:
    case ["move", direction] if direction in ("up", "down", "left", "right"):
        move(direction)
    case ["attack", target, int(damage)]:
        attack(target, damage)
    case ["quit"]:
        quit()
    case _:
        print("unknown command")
```

## Type Hints

Type Hints 入门可以参考[这里](https://zhuanlan.zhihu.com/p/464979921)。

### 使用 overload

由于 python 的灵活性，允许根据函数参数返回不同类型 (这在静态类型语言中是不可想象的)：

```python
def do_something(x: int | None = None, return_zero: bool = False) -> int | None:
    if x is None:
        return 0 if return_zero else None

    return x + 1

# [!code highlight:3]
x: int | None = do_something(1)
# or
x: int | None = do_something(None, return_zero=True)
```

但是可以看到返回值被推断为了 `int | None`，尽管我们知道这里的 `x` 都只能是 `int`。

```python
from typing import Literal, overload


@overload
def do_something(x: None = None, return_zero: Literal[False] = False) -> None: ...


@overload
def do_something(x: None = None, return_zero: Literal[True] = True) -> int: ...


@overload
def do_something(x: int, return_zero: bool = False) -> int: ...


def do_something(x: int | None = None, return_zero: bool = False) -> int | None:
    if x is None:
        return 0 if return_zero else None

    return x + 1

# [!code highlight:4]
x1: int = do_something(1)
x2: int = do_something(1, return_zero=True)
x3: None = do_something()
x4: int = do_something(return_zero=True)
```

使用 `@overload` 对这些复杂情况进行分类，这样 `x1`, `x2`, `x3`, `x4` 都得到了正确的类型

### 使用泛型

一开始写 python 时往往容易写出如下工具函数，丢失了返回 `list` 的类型信息。

```python
def cut(array: list, index: int) -> tuple[list, list]:
    return array[:index], array[index:]


# [!code highlight:1]
a: list[Unkown], b: list[Unkown] = cut([1, 2], 1)
```

将 `cut` 加上泛型参数即可正确推断 `a` 和 `b` 的类型。

```python
def cut[T](array: list[T], index: int) -> tuple[list[T], list[T]]:
    return array[:index], array[index:]


# [!code highlight:1]
a: list[int], b: list[int] = cut([1, 2], 1)
```

### 使用 Sequence/Iterable/Mapping

当需要封装一个对 `list`/`dict` 进行操作的函数时，很容易写成下面这种情况，这样的函数不够通用。

比如 `list` 无法接受 `tuple`/`set` 类型的输入。

```python
def _1[T](iterable: list[T]):
    for item in iterable:
        pass


def _2[T](map: dict[str, T]):
    for k, v in map.items():
        pass
```

使用抽象基类封装，能使函数更加通用。

> [!TIP]
> `Iterable` 和 `Sequence` 的区别是：`Sequence` 一般是已知长度的序列，`Iterable` 是未知长度的序列 (甚至无穷长)。

```python
from collections.abc import Iterable, Mapping, Sequence


def _1[T](iterable: Sequence[T]):
    for item in iterable:
        pass


def _1[T](iterable: Iterable[T]):
    for item in iterable:
        pass


def _2[T](map: Mapping[str, T]):
    for k, v in map.items():
        pass
```

## TypeGuard / TypeIs

当你写一个检查函数来收窄类型时，默认的 `bool` 返回值无法让类型检查器知道副作用：

```python
def is_str_list(val: list[object]) -> bool:
    return all(isinstance(x, str) for x in val)

items: list[object] = ["a", "b"]
if is_str_list(items):
    # items 仍然是 list[object]，无法调用 str 的方法
    items[0].upper()  # ❌ 类型检查器报错
```

使用 `TypeIs` (Python 3.13+) 告诉类型检查器：当返回 `True` 时参数被收窄为目标类型：

```python
from typing import TypeIs  # Python 3.13+ / typing_extensions


def is_str_list(val: list[object]) -> TypeIs[list[str]]:
    return all(isinstance(x, str) for x in val)

items: list[object] = ["a", "b"]
if is_str_list(items):
    # items 是 list[str]
    items[0].upper()
```

> [!TIP]
> 使用 `TypeGuard` (Python 3.10+) 也能实现类似的效果，但 Python 3.13+ 推荐使用 `TypeIs`（PEP 742），相比 `TypeGuard` 更加精确——`TypeGuard` 会在返回 `False` 时也对类型做出（可能错误的）假设，而 `TypeIs` 仅在返回 `True` 时收窄类型。

## Self 类型

如果你在父类中定义了一个方法，它返回 `self`，但子类调用时返回类型仍然是父类：

```python
class Animal:
    @classmethod
    def create(cls) -> "Animal":  # Dog.create() 返回类型还是 Animal
        return cls()


class Dog(Animal): ...


dog = Dog.create()  # dog 的类型是 Animal，不是 Dog
```

使用 `Self` (Python 3.11+) 自动跟随当前类：

```python
from typing import Self


class Animal:
    @classmethod
    def create(cls) -> Self:
        return cls()


class Dog(Animal): ...


dog = Dog.create()  # dog 的类型是 Dog
```

这在 builder 模式或链式调用中尤其有用：

```python
class QueryBuilder:
    def select(self, *fields: str) -> Self:
        ...
        return self

    def where(self, condition: str) -> Self:
        ...
        return self


builder = QueryBuilder().select("id", "name").where("age > 18")
```

## TypedDict

当你的函数接收或返回一个固定结构的字典时，`TypedDict` 比 `dict[str, Any]` 精确得多：

```python
def get_user() -> dict[str, object]:
    return {"name": "Alice", "age": 30, "email": "alice@example.com"}

user = get_user()
user["name"]  # 类型是 object，实际是 str
```

使用 `TypedDict` 描述键的类型，配合 `NotRequired` / `Required` 标记可选字段：

```python
from typing import NotRequired, TypedDict


class User(TypedDict):
    name: str
    age: int
    email: NotRequired[str]


def get_user() -> User:
    return {"name": "Alice", "age": 30}

user = get_user()
user["name"]  # 类型是 str
user.get("email")  # str | None
```

> [!NOTE]
> `TypedDict` 仅在类型检查时生效，运行时与普通 `dict` 完全一样，无性能开销。
