pipeline {
    agent any
    
    environment {
        PYTHON_VERSION = '3.9'
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', 
                    url: 'https://github.com/agam1092005/droplet-website.git'
            }
        }
        
        stage('Setup Python Environment') {
            steps {
                dir('ocean2droplet') {
                    sh '''
                        python3 -m venv venv
                        . venv/bin/activate
                        pip install -r requirements.txt
                    '''
                }
            }
        }
        
        stage('Run Tests') {
            steps {
                dir('ocean2droplet') {
                    sh '''
                        . venv/bin/activate
                        python test_installation.py
                    '''
                }
            }
        }
        
        stage('Synthetic Water Tests') {
            steps {
                dir('synthetic_water') {
                    sh '''
                        python3 -m venv venv
                        . venv/bin/activate
                        pip install -r requirements.txt
                        python test_synthetic_water.py
                    '''
                }
            }
        }
        
        stage('Build ML Images') {
            parallel {
                stage('Ocean2Droplet Image') {
                    steps {
                        dir('ocean2droplet') {
                            sh '''
                                docker build -t droplet-ocean2droplet:${BUILD_NUMBER} .
                                docker tag droplet-ocean2droplet:${BUILD_NUMBER} droplet-ocean2droplet:latest
                            '''
                        }
                    }
                }
                stage('Synthetic Water Image') {
                    steps {
                        dir('synthetic_water') {
                            sh '''
                                docker build -t droplet-synthetic-water:${BUILD_NUMBER} .
                                docker tag droplet-synthetic-water:${BUILD_NUMBER} droplet-synthetic-water:latest
                            '''
                        }
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo '✅ ML Pipeline completed successfully!'
        }
        failure {
            echo '❌ ML Pipeline failed!'
        }
        always {
            cleanWs()
        }
    }
}
