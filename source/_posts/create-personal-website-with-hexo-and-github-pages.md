---
title: Create Personal Website with Hexo and Github Pages
tags:
  - github
  - website
  - hexo
urlname: create-personal-website-with-hexo-and-github-pages
language: en
date: 2022-10-25 00:00:00
---

In this post, I will explain the details I build my own Github homepage with [Hexo](https://hexo.io), theme [NexT](https://github.com/theme-next/hexo-theme-next),  and [Github Pages](https://pages.github.com).

Basically, I followed the steps in this Zhihu answer: 
https://www.zhihu.com/question/20962496/answer/1882882782

<!--more-->

## Install Hexo

Requirements:
- [Node.js](https://nodejs.org/en/) (recommends 12.0 or higher)
- [Git](https://git-scm.com)

```bash
$ npm install -g hexo-cli
```

Refer to: https://hexo.io/docs/

## Hexo Quick Start

### Initialize a Hexo project

```bash
$ hexo init <folder>
$ cd <folder>
$ npm install
```

Refer to: https://hexo.io/docs/setup

In my case, I want to use this Hexo project as my Github homepage:
```bash
$ hexo init <your-username.github.io>
$ cd <your-username.github.io>
$ npm install
```

### Create a new post

``` bash
$ hexo new "My New Post"
```

More info: [Writing](https://hexo.io/docs/writing.html)

### Generate static files

``` bash
$ hexo generate
```

More info: [Generating](https://hexo.io/docs/generating.html)

Remember to perform `hexo clean` and `hexo generate` after you modified your site.
Then proceed to `hexo server` for local test or `hexo depoly` for deployment.

### Run server locally

``` bash
$ hexo server
```

More info: [Server](https://hexo.io/docs/server.html)

This runs Hexo locally, so that you can view your site before deploying it to remote sites. 
The output is like:
```
INFO  Validating config
INFO  Start processing
INFO  Hexo is running at http://localhost:4000/ . Press Ctrl+C to stop.
```

### Change Hexo config

Modify `_config.yml` in the site root directory.
This changes global settings for Hexo.

Please refer to [Configuration | Hexo](https://hexo.io/docs/configuration) for details.

### Change Hexo theme

#### NexT

I use theme [NexT](https://github.com/theme-next/hexo-theme-next) for my site:
```bash
$ cd <your-hexo-site>
$ git clone https://github.com/theme-next/hexo-theme-next themes/next
```

Modify `_config.yml` in the site root directory to enable the theme:
```yaml
theme: next
```

Modify `theme/next/_config.yml` for theme-specific config.

Please refer to [NexT Documentation](https://theme-next.js.org) for details.

### Deploy to remote sites

``` bash
$ hexo deploy
```

More info: [Deployment](https://hexo.io/docs/one-command-deployment.html)

#### Github Pages

Install plugin:
```bash
$ npm install hexo-deployer-git --save
```

Modify `_config.yml` in site root dir:
```yaml
deploy:
  type: git
  repo: git@github.com:<username>/<username>.github.io.git
  branch: master
```

Then run `hexo deploy`. 
You should be able to see you site at `<username>.github.io`.

## (Optional) Save Site Source Code on Github

```bash
$ git init
$ git checkout -b source
$ git add -A
$ git commit -m "init blog"
$ git remote add origin git@github.com:{username}/{username}.github.io.git
$ git push origin source
```

## References

Note that some of them are written in Chinese.

Documentation
- [文档 | Hexo](https://hexo.io/zh-cn/docs/)
- [Documentation | Hexo](https://hexo.io/docs/)
- [NexT Documentation](https://theme-next.js.org)
- [NexT使用文档](http://theme-next.iissnan.com)

Online Posts
- https://www.zhihu.com/question/20962496/answer/1882882782
- https://zhuanlan.zhihu.com/p/149306963
- https://uchuhimo.me/2017/04/11/genesis
- https://www.jianshu.com/p/53670692c5a6
- https://www.jianshu.com/p/a9e0b95f57a5