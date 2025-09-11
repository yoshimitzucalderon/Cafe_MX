# 🔧 CafeMX Setup Instructions

## 📋 Prerequisites

Before setting up CafeMX, ensure you have:

- [ ] Node.js 18+ installed
- [ ] Git configured with your credentials  
- [ ] Access to Supabase self-hosted instance
- [ ] Anthropic API key
- [ ] GitHub account (yoshimitzucalderon)
- [ ] Vercel account (yoshimitzu-calderons-projects)

## 🚀 Step-by-Step Setup

### 1. Repository Setup

```bash
# Clone the repository (after pushing to GitHub)
git clone https://github.com/yoshimitzucalderon/Cafe_MX.git
cd Cafe_MX

# Install dependencies
npm install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your actual values
```

Required environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://supabase.ycm360.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_key
ANTHROPIC_API_KEY=your_actual_anthropic_api_key_here
```

### 3. Database Setup

```bash
# Run database migrations
npm run migrate

# Verify migration status
npm run migrate status
```

### 4. Create Test Client

```bash
# Create a test client
npm run create-client "Café Central" cafe-central admin@cafecentral.com <user_uuid>

# Note: You'll need a valid user UUID from your Supabase auth.users table
```

### 5. Local Development

```bash
# Start development server
npm run dev

# Access the application
# Main site: http://localhost:3000
# Test client: http://cafe-central.localhost:3000/dashboard
```

### 6. GitHub Repository Creation

**Manual Steps Required:**

1. **Create Repository on GitHub**
   - Go to: https://github.com/yoshimitzucalderon/
   - Click "New repository"
   - Repository name: `Cafe_MX`
   - Description: `Multi-tenant SaaS platform for Mexican coffee shops with OCR ticket processing using Anthropic Claude`
   - Set as Public or Private (recommended: Private for now)
   - Don't initialize with README (we already have files)

2. **Push Code to GitHub**
   ```bash
   # Push main branch
   git checkout main
   git push -u origin main
   
   # Push develop branch  
   git checkout develop
   git push -u origin develop
   ```

3. **Configure Branch Protection**
   - Go to repository Settings → Branches
   - Click "Add rule"
   - Branch name pattern: `main`
   - Enable:
     - ✅ Require pull request reviews before merging
     - ✅ Require status checks to pass before merging
     - ✅ Require up-to-date branches before merging
     - ✅ Include administrators

### 7. Vercel Project Setup

**Manual Steps Required:**

1. **Create Vercel Project**
   - Go to: https://vercel.com/yoshimitzu-calderons-projects
   - Click "New Project"
   - Import from GitHub: `yoshimitzucalderon/Cafe_MX`
   - Framework: Next.js (auto-detected)
   - Root Directory: `./` (default)

2. **Configure Build Settings**
   ```
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   Development Command: npm run dev
   ```

3. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local` (except NEXT_PUBLIC_VERCEL_URL)
   - Set environment: Production, Preview, Development

4. **Configure Custom Domain**
   - Go to Project Settings → Domains
   - Add domain: `ycm360.com`
   - Add domain: `www.ycm360.com`
   - Add domain: `*.ycm360.com` (for subdomains)

### 8. GitHub Actions Setup

**Manual Steps Required:**

1. **Create Vercel Token**
   - Go to Vercel Account Settings → Tokens
   - Create new token: "GitHub Actions - CafeMX"
   - Copy the token

2. **Get Vercel Project IDs**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Link project
   vercel link
   
   # Get IDs from .vercel/project.json
   cat .vercel/project.json
   ```

3. **Configure GitHub Secrets**
   - Go to GitHub repository → Settings → Secrets and variables → Actions
   - Add repository secrets:
     ```
     VERCEL_TOKEN=<token_from_step_1>
     VERCEL_ORG_ID=<orgId_from_project.json>
     VERCEL_PROJECT_ID=<projectId_from_project.json>
     ```

### 9. DNS Configuration

**Manual Steps Required (if you own ycm360.com):**

1. **Add DNS Records**
   ```dns
   Type    Name    Value
   A       @       76.76.19.61
   CNAME   www     cname.vercel-dns.com
   CNAME   *       cname.vercel-dns.com
   ```

2. **Verify Domain in Vercel**
   - Go to Project Settings → Domains
   - Click "Verify" next to each domain
   - Wait for DNS propagation (up to 24 hours)

## ✅ Verification Checklist

After setup, verify everything works:

### Local Development
- [ ] `npm run dev` starts without errors
- [ ] Main site loads at http://localhost:3000
- [ ] Test client loads at http://cafe-central.localhost:3000
- [ ] Database migrations completed successfully
- [ ] Test client can be created with script

### GitHub Integration
- [ ] Code pushed to both main and develop branches
- [ ] Branch protection rules configured
- [ ] Repository is accessible
- [ ] Issues and PR templates visible

### Vercel Deployment
- [ ] Project deploys successfully
- [ ] Environment variables configured
- [ ] Custom domains added (if applicable)
- [ ] Preview deployments work for PRs

### CI/CD Pipeline
- [ ] GitHub Actions workflow runs on push
- [ ] Quality checks pass (lint, typecheck, build)
- [ ] Deployment triggers correctly
- [ ] Secrets configured properly

## 🛠️ Development Workflow

### Feature Development
```bash
# Start from develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
# Create PR from feature/new-feature to develop
```

### Release Process
```bash
# Merge develop to main for production release
git checkout main
git pull origin main
git merge develop
git tag v1.0.0
git push origin main --tags
```

## 🆘 Troubleshooting

### Common Issues

1. **"Cannot resolve module" errors**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Database connection errors**
   - Verify Supabase credentials in .env.local
   - Check if Supabase instance is running
   - Verify network connectivity

3. **OCR API errors**
   - Verify Anthropic API key is correct
   - Check API quota and rate limits
   - Verify API key permissions

4. **Subdomain routing not working locally**
   ```bash
   # Add to /etc/hosts (or C:\Windows\System32\drivers\etc\hosts)
   127.0.0.1 cafe-central.localhost
   127.0.0.1 test.localhost
   ```

### Getting Help

- 📧 Email: contacto@ycm360.com
- 📚 Docs: Check README.md and DEPLOYMENT.md
- 🐛 Issues: Use GitHub Issues with provided templates
- 💬 Discussions: GitHub Discussions for questions

---

## 🎯 Next Steps After Setup

1. **Test Multi-Tenant Functionality**
   - Create multiple test clients
   - Verify data isolation
   - Test subdomain routing

2. **OCR Integration Testing**
   - Upload test ticket images
   - Verify data extraction accuracy
   - Test error handling

3. **Production Deployment**
   - Follow DEPLOYMENT.md guide
   - Configure production domains
   - Set up monitoring

4. **User Training**
   - Create user documentation
   - Set up support channels
   - Plan onboarding process

**Ready to build the future of coffee shop management! ☕🚀**