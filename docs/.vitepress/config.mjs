import { defineConfig } from 'vitepress'
import {nav,sidebar} from "./navs"
// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "陆远文档",
  description: "A VitePress Site",
  themeConfig: {
    logo: "/avatar.png",
    nav: nav, // 把定义的nav给替换进来
    sidebar: sidebar,

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
