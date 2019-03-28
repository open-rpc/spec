# How to setup tests

Testing is a project specific concern. That being said, each project may use a jenkins pipeline to setup CI and CD for the project.

We use [jenkins-vagrant](https://github.com/etclabscore/jenkins-vagrant)

Here is an example [jenkinsfile](https://jenkins.io/doc/book/pipeline/jenkinsfile/) that runs node project tests in each of osx, linux and windows:

```
pipeline {
  agent none
  stages {
    stage('Run Tests') {
      parallel {
        stage('test') {
          agent {
            label 'macos'
          }
          steps {
              sh 'npm install'
              sh 'npm test'
          }
        }
        stage('linux') {
          agent {
            label 'linux'
          }
          steps {
            sh 'npm install'
            sh 'npm test'
          }
        }
        stage('windows') {
          agent {
            label 'windows'
          }
          steps {
            bat 'npm install'
            bat 'npm test'
          }
        }
      }
    }
  }
}
```
