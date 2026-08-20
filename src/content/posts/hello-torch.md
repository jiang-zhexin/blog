---
pubDatetime: 2025-08-08T15:30:00+08:00
title: Hello Torch!
tags: 
  - Torch
description: ML 仙人手搓反向传播这一块 🤓👆
---

目前最流行的机器学习框架非 PyTorch 莫属，可惜学校主要教理论知识而不教授这些框架的使用方法以及 API，导致实际开展项目时异常痛苦，往往高度依赖 LLM 生成代码

本 blog 旨在入门 torch，以备忘

## 情景

> [!IMPORTANT]
> 有关机器学习的理论知识超出了本 blog 的范围，读者需要具备前置的理论知识

考虑一个最简单的三层全连接网络，激活函数使用 ReLU，损失函数使用平方损失函数

$$
\begin{aligned}
y_p&=w_2*h_{relu}
\\
h_{relu}&=ReLU(h)
\\
h&=w_1*x
\\
loss&=(y_p-y)^2
\end{aligned}
$$

反向传播的梯度

$$
\delta^{(2)}=\frac{\partial loss}{\partial y_p}=2(y_p-y)
$$

$$
\frac{\partial loss}{\partial w_2}=\frac{\partial y_p}{\partial w_2}\frac{\partial loss}{\partial y_p}=h_{relu}^T \cdot \delta^{(2)}
$$

$$
\delta^{(1)}=\frac{\partial h_{relu}}{\partial h}\frac{\partial y_p}{\partial h_{relu}}\frac{\partial loss}{\partial y_p}=ReLU^\prime(h)\odot\left(w_2^T \cdot \delta^{(2)}\right)
$$

$$
\frac{\partial loss}{\partial w_1}=\frac{\partial h}{\partial w_1}\frac{\partial h_{relu}}{\partial h}\frac{\partial y_p}{\partial h_{relu}}\frac{\partial loss}{\partial y_p}=x^T\cdot\delta^{(1)}
$$

以上便是学校会教你的知识，其中的反向传播更是考点中的考点，但很遗憾，实际应用中完全不需要你手算任何反向传播

但是我们还是一步一步做起，来理解 torch 提供的自动梯度计算是怎么一回事

### 使用 numpy

让我们用 numpy 手动构建上述网络并完成迭代学习

由于只是例子，我们直接随机生成数据集

```python
import numpy as np

# N 是 batch size；D_in 是输入大小
# H 是隐层的大小；D_out 是输出大小
N, D_in, H, D_out = 64, 1000, 100, 10

# 随机产生输入与输出
x: np.ndarray = np.random.randn(N, D_in)  # 64 x 1000
y: np.ndarray = np.random.randn(N, D_out)  # 64 x 10

# 随机初始化参数
w1: np.ndarray = np.random.randn(D_in, H)  # 1000 x 100
w2: np.ndarray = np.random.randn(H, D_out)  # 100 x 10

# 学习率
learning_rate = 1e-6

for t in range(500):
    # 前向计算 y
    h: np.ndarray = x.dot(w1)  # 64 x 100
    h_relu: np.ndarray = np.maximum(h, 0)  # 64 x 100
    y_pred: np.ndarray = h_relu.dot(w2)  # 64 x 10

    # 计算 loss
    loss: np.ndarray = np.square(y_pred - y).sum()  # 64 x 10
    print(t, loss)

    # [!code highlight:12]
    # 反向计算梯度
    # delta1
    grad_y_pred = 2.0 * (y_pred - y)  # 64 x 10
    # w2 的梯度
    grad_w2: np.ndarray = h_relu.T.dot(grad_y_pred)  # 100 x 10

    # delta2
    grad_h_relu: np.ndarray = grad_y_pred.dot(w2.T)  # 64 x 100
    grad_h: np.ndarray = grad_h_relu.copy()  # 64 x 100
    grad_h[h < 0] = 0  # 64 x 100
    # w1 的梯度
    grad_w1: np.ndarray = x.T.dot(grad_h)  # 1000 x 100

    # 更新参数
    w1 -= learning_rate * grad_w1
    w2 -= learning_rate * grad_w2
```

观察高亮部分，很显然手动实现了整个反向传播的梯度计算

这里的代码相当低级，就是按部就班地完成前向传播和反向传播并对参数进行调整

### 使用 torch 的 Tensor

```python
import torch

dtype = torch.float
device = torch.device("cuda") if torch.cuda.is_available() else torch.device("cpu")

N, D_in, H, D_out = 64, 1000, 100, 10

x = torch.randn(N, D_in, device=device, dtype=dtype)
y = torch.randn(N, D_out, device=device, dtype=dtype)

w1 = torch.randn(D_in, H, device=device, dtype=dtype)
w2 = torch.randn(H, D_out, device=device, dtype=dtype)

learning_rate = 1e-6

for t in range(500):
    h = x.mm(w1)
    h_relu = h.clamp(min=0)  # 使用 clamp(min=0) 来实现 ReLU
    y_pred = h_relu.mm(w2)

    loss = (y_pred - y).pow(2).sum()
    print(t, loss.item())

    grad_y_pred = 2.0 * (y_pred - y)
    grad_w2 = h_relu.t().mm(grad_y_pred)
    grad_h_relu = grad_y_pred.mm(w2.t())
    grad_h = grad_h_relu.clone()
    grad_h[h < 0] = 0
    grad_w1 = x.t().mm(grad_h)

    w1 -= learning_rate * grad_w1
    w2 -= learning_rate * grad_w2
```

直接使用 torch.Tensor 看上去和 numpy.ndarray 并没有什么本质上的区别，除了可以加载到 GPU 上

但是下面，使用 torch.Tensor 的自动求导才是精髓所在

### 使用 autograd

```python
import torch

dtype = torch.float
device = torch.device("cuda") if torch.cuda.is_available() else torch.device("cpu")

N, D_in, H, D_out = 64, 1000, 100, 10

# 创建随机的 Tensor 作为输入和输出
# 输入和输出需要的 requires_grad=False (默认)，
# 因为我们不需要计算 loss 对它们的梯度
x = torch.randn(N, D_in, device=device, dtype=dtype, requires_grad=False)
y = torch.randn(N, D_out, device=device, dtype=dtype, requires_grad=False)

# 创建 weight 的 Tensor，需要设置 requires_grad=True
w1 = torch.randn(D_in, H, device=device, dtype=dtype, requires_grad=True)
w2 = torch.randn(H, D_out, device=device, dtype=dtype, requires_grad=True)

learning_rate = 1e-6
for t in range(500):
    y_pred = x.mm(w1).clamp(min=0).mm(w2)

    loss = (y_pred - y).pow(2).sum()
    print(t, loss.item())

    # 使用 autograd 进行反向计算。它会计算 loss 对所有对它有影响的
    # requires_grad=True 的 Tensor 的梯度
    loss.backward()

    # 手动使用梯度下降更新参数。一定要把更新的代码放到 torch.no_grad() 里
    # 否则下面的更新也会计算梯度
    with torch.no_grad():
        w1 -= learning_rate * w1.grad
        w2 -= learning_rate * w2.grad

        # 手动把梯度清零
        w1.grad.zero_()
        w2.grad.zero_()
```

是否感觉一下子简单了许多？我们完全不需要自己计算任何梯度，只需要根据得到的梯度按学习率更新参数即可

只需调用 `loss.backward()`，便可自动计算每个参数在 loss 上的偏导

这便是 torch.Tensor 与 numpy.ndarray 的根本区别，有了自动求导，就不必繁琐的自己实现反向传播的整个过程了

### 使用 nn 构建网络

实际上，神经网络都是一层一层搭建的，所以可以使用预构建各种 layer 来定义网络，并不需要手动完成；损失函数同理

```python
import torch

dtype = torch.float
device = torch.device("cuda") if torch.cuda.is_available() else torch.device("cpu")

N, D_in, H, D_out = 64, 1000, 100, 10

x = torch.randn(N, D_in, device=device, dtype=dtype, requires_grad=False)
y = torch.randn(N, D_out, device=device, dtype=dtype, requires_grad=False)

# 使用 nn 包来定义网络
model = torch.nn.Sequential(
    torch.nn.Linear(D_in, H),
    torch.nn.ReLU(),
    torch.nn.Linear(H, D_out),
)

# 常见的损失函数在 nn 包里也有，不需要我们自己实现
loss_fn = torch.nn.MSELoss(size_average=False)

learning_rate = 1e-4
for t in range(500):
    y_pred: torch.Tensor = model(x)
    loss: torch.Tensor = loss_fn(y_pred, y)
    print(t, loss.item())

    # 梯度清空，调用 Sequential 对象的 zero_grad 后所有里面的变量都会清零梯度
    model.zero_grad()

    # 反向计算梯度。我们通过 Module 定义的变量都会计算梯度
    loss.backward()

    # 更新参数，所有的参数都在 model.paramenters() 里
    with torch.no_grad():
        for param in model.parameters():
            param -= learning_rate * param.grad
```

> [!TIP]
> 这里为了简单演示，使用了 `torch.nn.Sequential` 直接「叠」成了网络，Pytorch 实际还是使用 class 风格的网络更多一点

### 使用 optimizer

最后，我们使用 optimzer 更新参数，而不同 optimizer 也对应不同的学习策略，这里使用的 adam 优化器稍稍有别于之前使用的固定学习率的策略

```python
import torch

N, D_in, H, D_out = 64, 1000, 100, 10

x = torch.randn(N, D_in)
y = torch.randn(N, D_out)

model = torch.nn.Sequential(
    torch.nn.Linear(D_in, H),
    torch.nn.ReLU(),
    torch.nn.Linear(H, D_out),
)
loss_fn = torch.nn.MSELoss(size_average=False)

# 使用 Adam 算法，需要提供模型的参数和 learning rate
learning_rate = 1e-4
optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
for t in range(500):
    y_pred: torch.Tensor = model(x)

    loss: torch.Tensor = loss_fn(y_pred, y)
    print(t, loss.item())

    # 梯度清零，原来调用的是 model.zero_grad，现在调用的是 optimizer 的 zero_grad
    optimizer.zero_grad()
    loss.backward()
    # 调用 optimizer.step 实现参数更新
    optimizer.step()
```

现在是否开始熟悉起来了呢？这便是 torch 进行神经网络训练常见的样本代码

在经过以上的步骤之后，相比以前是否具有对 torch 更加透彻的理解呢？

## 结论

由于理论知识与工程实践存在较大的区别，平时使用的代码都是经过高度抽象和封装的，难以建立知识的连接和迁移，导致理解困难

本文通过一步步将手动实现的代码替换成 torch 提供的易于使用的 API，建立二者的联系，以便读者理解
