pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', 
                    url: 'https://github.com/agam1092005/droplet-website.git'
            }
        }
        
        stage('Install Dependencies') {
            steps {
                dir('droplet-website') {
                    sh 'npm install'
                }
            }
        }
        
        stage('Build Frontend') {
            steps {
                dir('droplet-website') {
                    sh 'npm run build'
                }
            }
        }
        
        stage('Docker Build') {
            steps {
                dir('droplet-website') {
                    sh '''
                        docker build -t droplet-frontend:${BUILD_NUMBER} .
                        docker tag droplet-frontend:${BUILD_NUMBER} droplet-frontend:latest
                    '''
                }
            }
        }
        
        stage('Deploy') {
            steps {
                sh '''
                    echo "Deploying frontend..."
                    # Add your deployment commands here
                '''
            }
        }
    }
    
    post {
        success {
            echo '✅ Frontend pipeline completed successfully!'
        }
        failure {
            echo '❌ Frontend pipeline failed!'
        }
        always {
            cleanWs()
        }
    }
}
