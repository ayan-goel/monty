#!/bin/bash

# Monty API Lambda Deployment Script
set -e

echo "🚀 Starting Lambda deployment for Monty API..."

# Check if required tools are installed
check_dependencies() {
    echo "📋 Checking dependencies..."
    
    if ! command -v serverless &> /dev/null; then
        echo "❌ Serverless Framework not found. Installing..."
        npm install -g serverless
    fi
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker not found. Please install Docker to continue."
        exit 1
    fi
    
    echo "✅ Dependencies check passed"
}

# Check environment variables
check_environment() {
    echo "📋 Checking environment variables..."
    
    if [ ! -f ".env" ]; then
        echo "❌ .env file not found. Please copy env.example to .env and configure it."
        exit 1
    fi
    
    source .env
    
    # Polygon API key is optional
    
    if [ -z "$GOOGLE_API_KEY" ] || [ "$GOOGLE_API_KEY" = "your_google_ai_api_key_here" ]; then
        echo "⚠️  Warning: GOOGLE_API_KEY not configured"
    fi
    
    echo "✅ Environment check completed"
}

# Install Serverless plugins
install_plugins() {
    echo "📦 Installing Serverless plugins..."
    
    if [ ! -f "package.json" ]; then
        npm init -y
    fi
    
    npm install --save-dev serverless-python-requirements
    
    echo "✅ Plugins installed"
}

# Deploy to AWS
deploy() {
    local stage=${1:-dev}
    
    echo "🚀 Deploying to AWS Lambda (stage: $stage)..."
    
    # Export environment variables for serverless
    export GOOGLE_API_KEY
    
    # Deploy using serverless
    export DOCKER_BUILDKIT=1
    export BUILDX_NO_DEFAULT_ATTESTATIONS=1
    serverless deploy --stage $stage --verbose
    
    echo "✅ Deployment completed!"
    echo ""
    echo "🌐 Your API is now live! Check the output above for the API Gateway URL."
    echo "📋 Test your API:"
    echo "   curl https://your-api-gateway-url/health"
}

# Remove deployment
remove() {
    local stage=${1:-dev}
    
    echo "🗑️  Removing deployment (stage: $stage)..."
    serverless remove --stage $stage
    echo "✅ Deployment removed"
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        check_dependencies
        check_environment
        install_plugins
        deploy "${2:-dev}"
        ;;
    "remove")
        remove "${2:-dev}"
        ;;
    "logs")
        serverless logs -f app --stage "${2:-dev}" --tail
        ;;
    "info")
        serverless info --stage "${2:-dev}"
        ;;
    *)
        echo "Usage: $0 {deploy|remove|logs|info} [stage]"
        echo ""
        echo "Commands:"
        echo "  deploy [stage]  - Deploy to AWS Lambda (default: dev)"
        echo "  remove [stage]  - Remove deployment"
        echo "  logs [stage]    - View Lambda logs"
        echo "  info [stage]    - Show deployment info"
        echo ""
        echo "Examples:"
        echo "  $0 deploy dev     # Deploy to dev stage"
        echo "  $0 deploy prod    # Deploy to production"
        echo "  $0 logs prod      # View production logs"
        exit 1
        ;;
esac 