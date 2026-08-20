---
pubDatetime: 2025-09-11T14:30:00+08:00
title: WireGuard with Systemd
tags: 
  - wireguard
  - systemd
description: wg-quick👎 systemd-networkd👍
---

## wireguard-tools

在 Linux 上配置 wireguard，可以使用命令行工具 wg 配合 iproute2，像这样

```sh
ip link add dev wg0 type wireguard
ip link set dev wg0 mtu 1420
ip addr add 10.0.0.1/24 dev wg0
wg set wg0 listen-port 51820 private-key ./privatekey
wg set wg0 peer "Peer B public key" allowed-ips 10.0.0.2/32 endpoint 10.10.10.2:51820
ip link set wg0 up
```

当然这样的配置方式原始而且不能持久化，通常不使用上述方法

## wg-quick

wg-quick 是常用的 wireguard 配置工具，写入如下的配置文件，再 `wg-quick up wg0` 启动接口

```ini
# /etc/wireguard/wg0.conf
[Interface]
Address = 10.0.0.1/24
PrivateKey = [PRIVATE KEY]
ListenPort = 51820
MTU = 1420

[Peer]
PublicKey = [Peer B public key]
AllowedIPs = 10.0.0.2/32
Endpoint = 10.10.10.2:51820
```

但是，wg-quick 往往还需要使用 `systemctl enable wg-quick@wg0` 来做到开机自启

并且 wg-quick 糅合了一些配置，比如强制将 AllowedIPs 加入路由表，虽然常规往往这么做，但是实践上不如 wg + iproute2 灵活

## systemd

实际上，wireguard 已经可以使用 systemd 原生进行管理了，如下

```ini
# /etc/systemd/network/wg0.netdev
[NetDev]
Name=wg0
Kind=wireguard

[WireGuard]
PrivateKey=[PRIVATE KEY]
PrivateKeyFile=
ListenPort=51820
FirewallMark=
RouteTable=
RouteMetric=

[WireGuardPeer]
PublicKey=[Peer B public key]
PublicKeyFile=
PresharedKey=
PresharedKeyFile=
AllowedIPs=10.0.0.2/32
AllowedIPs=[more AllowedIPs]
Endpoint=10.10.10.2:51820
PersistentKeepalive=
RouteTable=
RouteMetric=
```

> [!TIP]
> 配置 RouteTable 可将 AllowedIPs 自动加入对应的路由表，默认为 false

> [!WARNING]
> 如果使用 PrivateKey 等涉及密钥的字段，则应该把 .netdev 文件的所有者设为 root:systemd-network，权限设为 640  
> 如果使用 PrivateKeyFile 等涉及密钥文件的字段，则应该把对应文件的所有者设为 root:systemd-network，权限设为 640

上述字段的用法应该非常好理解，否则可参考 [manpage](https://manpages.debian.org/trixie/systemd/systemd.netdev.5.en.html#%5BWIREGUARD%5D_SECTION_OPTIONS)

可以发现上述文件并没有配置如 IP address 和 MTU 等字段，它们应该在 .network 中配置

与此同时，你可以手动的进行路由的配置 (如果你喜欢的话)

```ini
# /etc/systemd/network/wg0.network
[Match]
Name=wg0

[Link]
MTUBytes=1420

[Network]
Address=10.0.0.1/24
Address=
DNS=

[Route]
Destination=10.0.0.2/32
Scope=link
```

然后，使用 `systemctl reload systemd-networkd` 加载配置，wg0 应该启动了

## 结论

使用 systemd 配置 wireguard 不仅灵活性更高，同时也做到了「勿增实体」，在我看来是十分优雅的一种方式，故写下此文以备忘
