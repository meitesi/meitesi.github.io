# Jenkins 流水线 pipeline 模板
> 打包SpringBoot 为docker镜像并部署服务器

### 一、模板文件
```shell
def registry = "ccr.ccs.tencentyun.com" //私有仓库地址
def project = "web-dev" // 项目
def app_name = "demo" // 名称
def image_name = "${registry}/${project}/${app_name}:${Branch}-${BUILD_NUMBER}" // 镜像名称 Branch:构建参数  BUILD_NUMBER: 全局变量构建版本
def back_version_num = 3 //服务器上保留的历史版本数量
def ipList = ['49.xxx.xxx.xx','49.xx.xx.xx'] //需要部署的服务器

// 登录服务器 ip:服务器地址
def getServer(ip){
    def remote = [:]
    remote.name = "server-${ip}"
    remote.host = ip
    remote.port = 22
    remote.allowAnyHosts = true
    withCredentials([usernamePassword(credentialsId: 'tencent-server', passwordVariable: 'password', usernameVariable: 'username')]) {
        remote.user = "${username}"
        remote.password = "${password}"
    }
    return remote
}


pipeline {
    agent none
    stages {
        stage('package'){ // maven 打包
            agent {
                docker{
                    image 'maven:3.8.5-ibmjava-8'
                    args ' -v /root/.m2:/root/.m2 -v /opt/maven/apache-maven-3.8.5/conf/settings.xml:/root/.m2/settings.xml'
                }
            }
            steps {
                sh """
                    mvn clean package '-Dmaven.test.skip=true'
                    echo '---------------- maven-package complete ！ ----------------'
                """
            }
        }
        stage('build'){ // 构建 docker 镜像并推送到 私有仓库
           agent any
           steps{
                withCredentials([usernamePassword(credentialsId: 'docker-tencent', passwordVariable: 'password', usernameVariable: 'username')]) {
                    sh """
                        docker build -t ${image_name} .
                        docker login -u ${username} -p '${password}' ${registry}
                        docker push ${image_name}
                        echo '---------------- docker-push complete ！ ----------------'
                    """
                }
           }
        }
        stage('deploy'){ // 登录服务器 部署docker镜像
            agent any
            steps{
                script{
                    for(ip in ipList){
                        def sshServer = getServer(ip)
                        //清理 旧版本Docker镜像 只保留最近的3个版本
                        def clearOldImageSSH = "n=`docker images | grep  ${Branch} | awk 'NR> ${back_version_num} '| wc -l`; if [ \$n -gt 0 ]; then docker rmi `docker images | grep  ${Branch} | awk 'NR>${back_version_num}{print \$3}'`; fi"
                        // 登录docker私服拉取最新应用镜像
                        withCredentials([usernamePassword(credentialsId: 'docker-tencent', passwordVariable: 'password', usernameVariable: 'username')]) {
                            sh """
                                docker login -u ${username} -p '${password}' ${registry}
                                docker pull ${image_name}
                                echo '---------------- docker-pull complete ！ ----------------'
                            """
                        }
                        // love_server=master-11 应用打包版本号
                        sshCommand remote: sshServer, command: """
                            echo '
                                love_server=${Branch}-${BUILD_NUMBER}
                            ' > \$HOME/demo/.env
                            cd \$HOME/demo && docker-compose down && docker-compose up -d
                            ${clearOldImageSSH}
                        """
                        echo '---------------- ssh-docker-run complete ! ----------------'
                    }
                }
            }
        }
    }
}
```