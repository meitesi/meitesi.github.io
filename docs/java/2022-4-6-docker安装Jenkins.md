# Docker 安装Jenkins并运行

### 一、创建 运行文件

1) 目录结构:
```shell
    jenkins
      |-- data # 用户存放数据的目录
      |-- docker-compose.yml 
```

2) docker-compose.yml 内容:
```shell
version: "3"

networks:
  jenkins-net:
    driver: bridge

services:
  # 安装jenkins
  jenkins:
    image: jenkinsci/blueocean:latest
    user: root # root 用户运行 否则会有权限问题
    container_name: jenkins
    restart: always
    volumes:
      - ./data:/var/jenkins_home
      - /home/ubuntu:/home
      - /var/run/docker.sock:/var/run/docker.sock:rw # jenkins 容器内部调用宿主机docker 运行环境
    ports:
      - "8080:8080"
      - "50000:50000"
    networks:
      - jenkins-net
```
### 二、服务器上运行

```shell
# 1. 上传jenkins 目录到服务器根目录（或者用户家目录等 自由选择）
# 2. 确保服务器已经安装docker运行环境
# 3. 运行
cd /jenkins 
docker-composer up -d
```

> 此过程需要注意的点:
1. docker-compose.yml  必须配置 user 为 root 用户,否则在pipeline 运行是会报权限错误
2. 如果需要docker镜像打包的话则需要在 jenkins 插件中 需要安装 `Docker` 以及 `Docker Pipeline` 2个插件