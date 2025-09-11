# 🚀 CafeMX Deployment Guide

## 📋 GitHub Repository Setup

### 1. Crear Repositorio en GitHub
```bash
# Repository URL
https://github.com/yoshimitzucalderon/Cafe_MX

# Description
Multi-tenant SaaS platform for Mexican coffee shops with OCR ticket processing using Anthropic Claude
```

### 2. Configurar Remote
```bash
git remote add origin https://github.com/yoshimitzucalderon/Cafe_MX.git
git branch -M main
git push -u origin main
```

### 3. Configurar Branches
```bash
# Crear branch de desarrollo
git checkout -b develop
git push -u origin develop

# Configurar branch protection en GitHub:
# Settings → Branches → Add rule
# - Branch name pattern: main
# - Require pull request reviews before merging
# - Require status checks to pass before merging
# - Require up-to-date branches before merging
```

## 🌐 Vercel Deployment Setup

### 1. Crear Proyecto en Vercel
```
Account: yoshimitzu-calderons-projects
Project Name: Cafe_MX
Repository: https://github.com/yoshimitzucalderon/cafemx-multi-tenant
Framework: Next.js
```

### 2. Environment Variables en Vercel
Configurar en Vercel Dashboard → Settings → Environment Variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://supabase.ycm360.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Anthropic API
ANTHROPIC_API_KEY=your_actual_anthropic_api_key_here

# OCR Configuration
OCR_PRIMARY_PROVIDER=anthropic
OCR_TIMEOUT_MS=30000
OCR_MAX_RETRIES=3
OCR_MIN_CONFIDENCE=0.7

# App Configuration
NEXT_PUBLIC_APP_URL=https://ycm360.com
COMPANY_EMAIL=contacto@ycm360.com
NODE_ENV=production
```

### 3. Domain Configuration
```
Primary Domain: ycm360.com
Aliases:
- www.ycm360.com
- *.ycm360.com (for subdomains)

DNS Records needed:
- A record: ycm360.com → Vercel IP
- CNAME: www.ycm360.com → cname.vercel-dns.com
- CNAME: *.ycm360.com → cname.vercel-dns.com
```

### 4. Deployment Settings
```
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Development Command: npm run dev
Node.js Version: 18.x
```

## 🔧 GitHub Actions Secrets

Configurar en GitHub → Settings → Secrets and variables → Actions:

```
VERCEL_TOKEN=<vercel_token>
VERCEL_ORG_ID=<organization_id>
VERCEL_PROJECT_ID=<project_id>
```

### Obtener tokens:
1. **VERCEL_TOKEN**: Vercel Dashboard → Settings → Tokens → Create Token
2. **VERCEL_ORG_ID**: Vercel CLI `vercel link` → .vercel/project.json
3. **VERCEL_PROJECT_ID**: Vercel CLI `vercel link` → .vercel/project.json

## 🌍 Multi-Tenant Subdomain Setup

### 1. DNS Configuration
```dns
# Main domain
ycm360.com        A     76.76.19.61 (Vercel IP)
www.ycm360.com    CNAME cname.vercel-dns.com

# Wildcard for tenants
*.ycm360.com      CNAME cname.vercel-dns.com

# Admin subdomain
admin.ycm360.com  CNAME cname.vercel-dns.com
```

### 2. Vercel Domain Verification
```bash
# Add domain in Vercel Dashboard
1. Project Settings → Domains
2. Add Domain: ycm360.com
3. Add Domain: *.ycm360.com
4. Verify DNS configuration
```

### 3. SSL Certificate
```
Vercel automatically provides SSL certificates for:
- ycm360.com
- www.ycm360.com
- *.ycm360.com (wildcard)
```

## 🚀 Deployment Workflow

### 1. Development Flow
```bash
# Feature development
git checkout develop
git checkout -b feature/new-feature
# ... make changes ...
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Create PR to develop branch
# → Triggers preview deployment

# After review and merge to develop
# → Triggers staging deployment
```

### 2. Production Deployment
```bash
# Release to production
git checkout main
git merge develop
git tag v1.0.0
git push origin main --tags

# → Triggers production deployment
# → Health checks run automatically
```

### 3. Rollback Process
```bash
# If deployment fails
vercel rollback --token=$VERCEL_TOKEN

# Or via GitHub
git revert <commit-hash>
git push origin main
```

## 📊 Monitoring & Health Checks

### 1. Vercel Analytics
```
- Page views and performance metrics
- Core Web Vitals monitoring
- Real User Monitoring (RUM)
```

### 2. Health Check Endpoints
```
GET /api/health              - General health
GET /api/health/database     - Database connectivity
GET /api/health/ocr          - OCR service status
```

### 3. Error Tracking
```
- Vercel Error Tracking enabled
- Console logs in Vercel Dashboard
- GitHub Actions failure notifications
```

## 🔐 Security Configuration

### 1. Environment Isolation
```
Development: localhost + preview deployments
Staging: staging.ycm360.com (develop branch)
Production: ycm360.com (main branch)
```

### 2. API Security
```
- CORS properly configured
- Rate limiting on OCR endpoints
- JWT validation for tenant access
- Row Level Security in Supabase
```

### 3. Content Security Policy
```javascript
// next.config.js headers
"Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
```

## 📈 Performance Optimization

### 1. Vercel Configuration
```json
{
  "regions": ["iad1"],
  "functions": {
    "app/api/ocr/process/route.ts": {
      "maxDuration": 30
    }
  }
}
```

### 2. Caching Strategy
```
- Static assets: 1 year cache
- API responses: 5 minutes cache
- Database queries: Connection pooling
```

### 3. Image Optimization
```
- Next.js Image component
- Vercel Image Optimization
- WebP format support
```

## 🧪 Testing Strategy

### 1. Local Testing
```bash
npm run dev
# Test on http://localhost:3000
# Test tenants on http://cafe-central.localhost:3000
```

### 2. Preview Deployments
```
- Every PR gets a preview URL
- Test multi-tenant functionality
- Verify OCR integration
```

### 3. Production Testing
```
- Smoke tests after deployment
- Health check monitoring
- User acceptance testing
```

## 📞 Support & Troubleshooting

### Common Issues

1. **Subdomain not working**
   - Check DNS propagation
   - Verify wildcard certificate
   - Check middleware routing

2. **OCR API errors**
   - Verify Anthropic API key
   - Check rate limits
   - Review timeout settings

3. **Database connection issues**
   - Verify Supabase credentials
   - Check connection pooling
   - Review schema permissions

### Debug Commands
```bash
# Vercel logs
vercel logs --token=$VERCEL_TOKEN

# Local debugging
npm run dev --debug

# Database debugging
npm run migrate status
```

---

## 🎯 Quick Deployment Checklist

- [ ] ✅ GitHub repository created
- [ ] ✅ Remote configured and code pushed
- [ ] ✅ Vercel project created
- [ ] ✅ Environment variables configured
- [ ] ✅ Domain and DNS configured
- [ ] ✅ GitHub Actions secrets set
- [ ] ✅ CI/CD pipeline tested
- [ ] ✅ Health checks passing
- [ ] ✅ Multi-tenant routing verified
- [ ] ✅ OCR functionality tested

**Ready for production! 🚀**