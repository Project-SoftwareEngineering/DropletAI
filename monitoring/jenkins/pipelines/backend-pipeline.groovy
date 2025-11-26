pipeline {
    agent any
    
    environment {
        GO_VERSION = '1.21'
        DOCKER_REGISTRY = 'docker.io/droplet'
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', 
                    url: 'https://github.com/agam1092005/droplet-website.git'
            }
        }
        
        stage('Backend Tests') {
            steps {
                dir('backend') {
                    sh 'go test -v ./...'
                }
            }
        }
        
        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh 'go build -o droplet-backend main.go'
                }
            }
        }
        
        stage('Docker Build') {
            steps {
                dir('backend') {
                    sh '''
                        docker build -t droplet-backend:${BUILD_NUMBER} .
                        docker tag droplet-backend:${BUILD_NUMBER} droplet-backend:latest
                    '''
                }
            }
        }
        
        stage('Deploy') {
            steps {
                sh '''
                    echo "Deploying backend..."
                    # Add your deployment commands here
                '''
            }
        }
    }
    
    post {
        success {
            echo '✅ Backend pipeline completed successfully!'
        }
        failure {
            echo '❌ Backend pipeline failed!'
        }
        always {
            cleanWs()
        }
    }
}
