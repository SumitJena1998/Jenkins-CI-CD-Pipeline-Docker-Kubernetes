pipeline {
    agent any

    environment {
        APP_NAME        = "nodeapp"
        DOCKER_REGISTRY = "your-dockerhub-username"
        IMAGE_NAME      = "${DOCKER_REGISTRY}/${APP_NAME}"
        IMAGE_TAG       = "${BUILD_NUMBER}-${GIT_COMMIT[0..7]}"
        K8S_NAMESPACE   = "production"
        SONAR_PROJECT   = "nodeapp-devops"
    }

    tools {
        nodejs "NodeJS-18"
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                echo "Checking out source code..."
                checkout scm
                sh "git log --oneline -5"
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('app') {
                    sh 'npm ci --prefer-offline'
                }
            }
        }

        stage('Code Quality - Lint') {
            steps {
                dir('app') {
                    sh 'npm run lint'
                }
            }
        }

        stage('Unit Tests') {
            steps {
                dir('app') {
                    sh 'npm test -- --coverage --ci'
                }
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'app/test-results/**/*.xml'
                    publishCoverage adapters: [coberturaAdapter('app/coverage/cobertura-coverage.xml')]
                }
            }
        }

        stage('SonarQube Analysis') {
            when { branch 'main' }
            environment {
                SONAR_TOKEN = credentials('sonarqube-token')
            }
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh """
                        sonar-scanner \
                          -Dsonar.projectKey=${SONAR_PROJECT} \
                          -Dsonar.sources=app/src \
                          -Dsonar.tests=app/tests \
                          -Dsonar.javascript.lcov.reportPaths=app/coverage/lcov.info
                    """
                }
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    docker.build("${IMAGE_NAME}:${IMAGE_TAG}", "-f docker/Dockerfile .")
                    docker.build("${IMAGE_NAME}:latest", "-f docker/Dockerfile .")
                }
            }
        }

        stage('Trivy Security Scan') {
            steps {
                sh """
                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      -v $HOME/.cache/trivy:/root/.cache/trivy \
                      aquasec/trivy:latest image \
                      --exit-code 1 \
                      --severity HIGH,CRITICAL \
                      --ignore-unfixed \
                      ${IMAGE_NAME}:${IMAGE_TAG}
                """
            }
        }

        stage('Docker Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh """
                        echo ${DOCKER_PASS} | docker login -u ${DOCKER_USER} --password-stdin
                        docker push ${IMAGE_NAME}:${IMAGE_TAG}
                        docker push ${IMAGE_NAME}:latest
                        docker logout
                    """
                }
            }
        }

        stage('Deploy to Staging') {
            when { branch 'main' }
            steps {
                withKubeConfig([credentialsId: 'kubeconfig-staging']) {
                    sh """
                        sed -i 's|IMAGE_PLACEHOLDER|${IMAGE_NAME}:${IMAGE_TAG}|g' kubernetes/deployment.yaml
                        kubectl apply -f kubernetes/ -n staging
                        kubectl rollout status deployment/${APP_NAME} -n staging --timeout=120s
                    """
                }
            }
        }

        stage('Smoke Test') {
            when { branch 'main' }
            steps {
                sh """
                    sleep 10
                    STAGING_URL=\$(kubectl get svc ${APP_NAME} -n staging -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
                    curl -f http://\${STAGING_URL}/health || exit 1
                    echo "Smoke test passed!"
                """
            }
        }

        stage('Deploy to Production') {
            when { branch 'main' }
            input {
                message "Deploy to Production?"
                ok "Yes, Deploy"
                parameters {
                    string(name: 'REASON', defaultValue: '', description: 'Reason for deployment')
                }
            }
            steps {
                withKubeConfig([credentialsId: 'kubeconfig-prod']) {
                    sh """
                        kubectl apply -f kubernetes/ -n ${K8S_NAMESPACE}
                        kubectl rollout status deployment/${APP_NAME} -n ${K8S_NAMESPACE} --timeout=180s
                    """
                }
            }
        }
    }

    post {
        always {
            sh "docker rmi ${IMAGE_NAME}:${IMAGE_TAG} || true"
            cleanWs()
        }
        success {
            slackSend(
                color: 'good',
                message: """
                    SUCCESS: ${APP_NAME} v${IMAGE_TAG} deployed!
                    Branch: ${GIT_BRANCH} | Build: ${BUILD_NUMBER}
                    URL: ${BUILD_URL}
                """.stripIndent()
            )
        }
        failure {
            slackSend(
                color: 'danger',
                message: """
                    FAILED: ${APP_NAME} build #${BUILD_NUMBER} failed!
                    Branch: ${GIT_BRANCH}
                    URL: ${BUILD_URL}
                """.stripIndent()
            )
        }
    }
}
