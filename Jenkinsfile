pipeline {
  agent none
  stages {
    stage('Run Tests') {
      parallel {
        stage('flint checker') {
	  agent {
            label 'macos'
          }
          steps {
              sh '/usr/local/bin/brew install flint-checker'
              sh 'ls -al'
              sh '/usr/local/bin/flint --skip-changelog --skip-bootstrap --skip-test-script --skip-code-of-conduct'
          }
        }
        stage('linux') {
          agent {
            label 'linux'
          }
          steps {
            sh 'echo "linux hello world"'
          }
        }
        stage('windows') {
          agent {
            label 'windows'
          }
          steps {
            bat 'echo "windows hello world"'
          }
        }
      }
    }
  }
}
