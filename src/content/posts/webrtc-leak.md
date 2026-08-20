---
pubDatetime: 2025-08-05T13:50:00+08:00
title: WebRTC Leak
tags:
  - NAT
description: 很难想象，后面忘了
---

最近研究了 STUN 和 TURN 这两个 P2P 协议，那正好看看它们所服务的 WebRTC，以及大名鼎鼎的 WebRTC Leak 是怎么一回事。

调查了一番后是大失所望，属于是贩卖焦虑了，今天就揉碎了说说这个无聊至极的 WebRTC Leak，并且简单实现一个 WebRTC Leak Test。

## WebRTC Leak 是怎么发生的？

原理很简单，Javascript 发起对 STUN server 的 BindRequest，STUN server 在 BindResponse 中 "反弹" 其看到的外部 IP 和端口。STUN 协议可参考我之前的 [文章](/posts/stun-protocol)。

本质上，完全可以搭建一个 HTTP server 实现相同的效果，只是因为 WebRTC 使用 UDP，当浏览器使用 HTTP/SOCKS5 代理时不会代理 WebRTC 请求；但对于透明代理的环境下，WebRTC 对外发起请求和 JavaScript 使用 fetch 发起请求并无二致。

## 简单实现一下 WebRTC Leak Test

你可以点击下面这个按钮来获取你的 IP。

<webrtc-test></webrtc-test>

> [!IMPORTANT]
> 本测试完全使用 Javascript 在本机上完成，唯一涉及的第三方服务器是用于测试的 STUN server `stun:stun.miwifi.com:3478`，本站不会知晓测试结果。

你也可以在控制台中执行以下代码得到相同结果：

```js
const peerConnection = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.miwifi.com:3478" }],
  bundlePolicy: "max-bundle",
});

peerConnection.createDataChannel("");

peerConnection.onicecandidate = (event) => {
  if (event.candidate?.type === "srflx") {
    console.log(event.candidate.address);
    peerConnection.onicecandidate = null;
  }
};

await peerConnection
  .createOffer()
  .then((offer) => peerConnection.setLocalDescription(offer));
```

> [!TIP]
> 你可以尝试不同的 STUN server  
> 使用支持 IPv6 的 STUN server 可获得 IPv6 地址  
> 对于透明代理，根据分流情况不同，使用国内外的 STUN server 可获取本地以及代理出口的 IP

<script type="module">
class WebrtcTest extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerText = "WebRTC Leak Test";
    this.onclick = async () => {
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.miwifi.com:3478" }],
        bundlePolicy: "max-bundle",
      });

      peerConnection.createDataChannel("");

      peerConnection.onicecandidate = (event) => {
        if (event.candidate?.type === "srflx") {
          alert(
            `你联系 STUN server 的外部 IP 地址是：${event.candidate.address}:${event.candidate.port}`
          );
          peerConnection.onicecandidate = null;
        }
      };

      await peerConnection
        .createOffer()
        .then((offer) => peerConnection.setLocalDescription(offer));
    };
    this.style = `cursor: pointer; color: var(--foreground); background-color: var(--border); border-radius: 5px; padding: 9px;`;
  }
}
window.customElements.define("webrtc-test", WebrtcTest);
</script>
