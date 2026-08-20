import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://blog.zhexin.org",
    title: "Blog of ZheXin",
    description: "Jiang ZheXin とは？",
    author: "jiang zhexin",
    profile: "https://blog.zhexin.org",
    lang: "zh-cn",
    timezone: "Asia/ShangHai",
    dir: "ltr",
    googleVerification: "YRksfajukhJnwK3aaT8t5Me7MsU2fDi2orfwsVkB-34",
  },
  posts: {
    perPage: 5,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: true,
      url: "https://github.com/jiang-zhexin/blog/edit/main/",
    },
    search: "pagefind",
  },
  socials: [
    { name: "github", url: "https://github.com/jiang-zhexin" },
    { name: "mail", url: "mailto:me@zhexin.org" },
  ],
  shareLinks: [
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "x", url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=" },
    { name: "mail", url: "mailto:?subject=See%20this%20post&body=" },
  ],
});
