# 贾蔓个人作品集 · GitHub Pages 发布包

这是公开展示网页的发布文件。先解压 ZIP；不要只把 ZIP 文件上传到仓库，也不要只上传 index.html。

## 发布步骤

1. 在 GitHub 创建或打开用于作品集的仓库。免费账户使用公开仓库。
2. 把 index.html、assets 文件夹、media 文件夹及 .nojekyll 文件放到仓库根目录，保留目录结构。README.md 可一起上传。
3. 如使用 GitHub 网页上传，一次最多上传 100 个文件，单文件最多 25 MiB。超过此大小的素材使用 GitHub Desktop 或 Git 命令提交；不要删掉视频文件。
4. 打开仓库 Settings → Pages → Build and deployment。
5. Source 选择 Deploy from a branch，分支选择包含这些文件的分支（通常为 main），文件夹选择 / (root)，点击 Save。
6. 等待部署成功，打开 Pages 页面给出的 HTTPS 链接。这才是可分享的网站地址。

## 当前文件检查

- 项目数：5
- 素材文件数：34
- 末页配图：3 张（会保留你实际上传的图片）
- 页面与素材合计约 203.4 MiB
- 超过网页上传 25 MiB 限制的文件：
- media/3a38c8a0-8521-4bc5-857d-fb3cf4c0b6f9.mp4：37.05 MiB
- media/ebb0978a-0435-462b-aed6-49007945fc36.mp4：42.64 MiB
- media/eb142a23-aaf0-4417-a867-d59cb834fcc3.mp4：27.23 MiB

GitHub 普通仓库的单文件上限为 100 MiB，Pages 发布站点上限为 1 GB。本工具已检查这两项。图片与视频保持导出时的质量，不会为上传而自动压缩。

## 更新作品

保留本地可编辑 HTML。以后在本地更新作品、说明或末页三张图，再导出一次 GitHub Pages 发布包，把新文件同步到原仓库。网页展示版不提供在线编辑，不需要访客导入文件。

所有资源使用相对路径，既支持账户主页，也支持 /仓库名/ 下的项目网站。背景图、视频和末页图片应一并提交。

发布后实际检查：首页背景、作品筛选、项目弹窗、视频播放与拖动、末页图片、手机横竖屏。网站速度取决于素材大小、访客网络和托管服务。

## 官方说明

- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
