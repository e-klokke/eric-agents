#!/bin/bash
# Supabase Setup Script
# Guides you through setting up Supabase for the first time

set -e

echo "🚀 Eric Agents - Supabase Setup"
echo "================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "✅ .env file exists"
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo ""
    echo "❌ Supabase CLI not installed"
    echo ""
    echo "Install it with:"
    echo "  brew install supabase/tap/supabase  (macOS)"
    echo "  npm install -g supabase             (npm)"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI installed"
echo ""

# Check for placeholder values
if grep -q "your-project.supabase.co" .env || grep -q "your-service-key" .env; then
    echo "⚠️  Your .env file still has placeholder values"
    echo ""
    echo "Please follow these steps:"
    echo ""
    echo "1️⃣  Get Supabase Credentials:"
    echo "   - Go to https://supabase.com/dashboard"
    echo "   - Create or select your project"
    echo "   - Go to Settings > API"
    echo "   - Copy Project URL and service_role key"
    echo ""
    echo "2️⃣  Update .env file:"
    echo "   - Open .env in your editor"
    echo "   - Replace SUPABASE_URL with your actual URL"
    echo "   - Replace SUPABASE_SERVICE_KEY with your actual key"
    echo ""
    echo "3️⃣  Run this script again:"
    echo "   ./scripts/setup.sh"
    echo ""
    exit 1
fi

echo "✅ Supabase credentials configured"
echo ""

# Prompt for project ref
echo "📋 Database Setup"
echo ""
echo "What would you like to do?"
echo "1) Link to existing Supabase project and push migrations"
echo "2) I'll run migrations manually in Supabase dashboard"
echo "3) Skip database setup for now"
echo ""
read -p "Choose (1/2/3): " choice

case $choice in
    1)
        echo ""
        echo "To find your project-ref:"
        echo "- Look at your Supabase URL: https://XXXXX.supabase.co"
        echo "- The project-ref is the XXXXX part"
        echo ""
        read -p "Enter your project-ref: " project_ref

        if [ -z "$project_ref" ]; then
            echo "❌ No project-ref provided"
            exit 1
        fi

        echo ""
        echo "🔗 Linking to Supabase project..."
        supabase link --project-ref "$project_ref"

        echo ""
        echo "📤 Pushing migrations to Supabase..."
        supabase db push

        echo ""
        echo "✅ Database setup complete!"
        ;;
    2)
        echo ""
        echo "📝 Manual Migration Instructions:"
        echo ""
        echo "1. Go to Supabase Dashboard > SQL Editor"
        echo "2. Run these files in order:"
        echo "   - supabase/migrations/001_schema.sql"
        echo "   - supabase/migrations/002_sales_nurture.sql"
        echo "   - supabase/migrations/003_leadgen_tables.sql"
        echo ""
        echo "Press Enter when migrations are complete..."
        read
        ;;
    3)
        echo ""
        echo "⏭️  Skipping database setup"
        echo "Run migrations later with: supabase db push"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🧪 Testing Connection"
echo "====================="
echo ""

npm run test:connection

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Add your API keys to .env:"
echo "   - ANTHROPIC_API_KEY (required for agents)"
echo "   - OPENAI_API_KEY (optional for embeddings)"
echo ""
echo "2. Test an agent:"
echo "   npm run test:agent:leadgen:sts"
echo "   npm run test:agent:sales:pdc"
echo ""
echo "3. Start building! 🚀"
echo ""
