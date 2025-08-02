# 🌐 Academitna Frontend Deployment Guide

Complete guide for deploying the Academitna frontend to production on Hostinger VPS.

## 📋 Prerequisites

- **Backend deployed** and running at `https://academitna.online/api/`
- **Domain configured** with SSL certificates
- **Node.js 18+** installed on your local machine
- **VPS access** to `root@148.230.115.242`

## 🚀 Quick Deployment Steps

### **1. Build the Frontend**
```bash
# Navigate to frontend directory
cd pro-frontend

# Install dependencies
npm install

# Build for production
npm run build
```

### **2. Create Deployment Package**
```bash
# Run deployment script
chmod +x deployment/build-and-deploy.sh
./deployment/build-and-deploy.sh
```

### **3. Upload to VPS**
```bash
# Upload the generated package
scp academitna-frontend-*.tar.gz root@148.230.115.242:/root/
```

### **4. Deploy on VPS**
```bash
# Connect to VPS
ssh root@148.230.115.242

# Extract package
tar -xzf academitna-frontend-*.tar.gz
cd academitna-frontend-*

# Deploy to web directory
sudo mkdir -p /var/www/academitna
sudo cp -r * /var/www/academitna/
sudo chown -R nginx:nginx /var/www/academitna
sudo chmod -R 755 /var/www/academitna
```

### **5. Update Nginx Configuration**
```bash
# The main nginx configuration should already include frontend serving
# If not, add the frontend configuration from nginx-frontend.conf

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## 🔧 Detailed Configuration

### **Environment Variables**
The frontend uses these environment variables (already configured in `.env.production`):

```env
NEXT_PUBLIC_API_BASE_URL=https://academitna.online/api
NEXT_PUBLIC_CDN_BASE_URL=https://academitna.b-cdn.net
NEXT_PUBLIC_APP_URL=https://academitna.online
```

### **API Integration**
All API calls are configured to use:
- **Production API**: `https://academitna.online/api/`
- **CDN Images**: `https://academitna.b-cdn.net/`
- **Video Streaming**: Bunny.net iframe embed player

### **Bunny.net CDN Integration**
The frontend automatically handles:
- **Image optimization** with WebP format
- **Video streaming** with secure URLs
- **Thumbnail generation** for videos
- **Responsive images** for different screen sizes

## 📁 File Structure After Deployment

```
/var/www/academitna/
├── index.html              # Main entry point
├── _next/                  # Next.js build files
│   ├── static/            # Static assets
│   └── ...
├── public/                 # Public assets
├── 404.html               # Custom 404 page
├── 50x.html               # Custom error page
└── DEPLOYMENT_INFO.txt    # Deployment information
```

## 🔒 Security Features

### **Content Security Policy**
- **Script sources**: Self, CDN, inline (for Next.js)
- **Image sources**: Self, CDN, data URLs
- **Media sources**: Self, Bunny.net CDN
- **Frame sources**: Bunny.net iframe player only

### **HTTP Headers**
- **X-Frame-Options**: DENY
- **X-Content-Type-Options**: nosniff
- **X-XSS-Protection**: 1; mode=block
- **Referrer-Policy**: strict-origin-when-cross-origin

### **Caching Strategy**
- **HTML files**: No cache (always fresh)
- **Static assets**: 1 year cache with immutable
- **API responses**: No cache
- **Images**: 1 year cache with optimization

## 🎯 Performance Optimizations

### **Image Optimization**
- **WebP format** for modern browsers
- **Responsive images** with multiple sizes
- **Lazy loading** for better performance
- **CDN delivery** via Bunny.net

### **Code Splitting**
- **Automatic code splitting** by Next.js
- **Vendor chunks** separated
- **Dynamic imports** for large components

### **Compression**
- **Gzip compression** for all text assets
- **Brotli compression** (if available)
- **Static file compression** pre-built

## 🧪 Testing Deployment

### **1. Basic Functionality**
```bash
# Test homepage
curl -I https://academitna.online/

# Test API connectivity
curl https://academitna.online/api/actuator/health

# Test static assets
curl -I https://academitna.online/_next/static/css/app.css
```

### **2. Performance Testing**
- **Google PageSpeed Insights**: Test loading speed
- **GTmetrix**: Analyze performance metrics
- **WebPageTest**: Detailed performance analysis

### **3. Security Testing**
- **SSL Labs**: Test SSL configuration
- **Security Headers**: Check security headers
- **OWASP ZAP**: Security vulnerability scan

## 🔄 Updates and Maintenance

### **Updating the Frontend**
```bash
# 1. Build new version locally
npm run build
./deployment/build-and-deploy.sh

# 2. Upload to VPS
scp academitna-frontend-*.tar.gz root@148.230.115.242:/root/

# 3. Deploy on VPS
ssh root@148.230.115.242
tar -xzf academitna-frontend-*.tar.gz
sudo cp -r academitna-frontend-*/* /var/www/academitna/
sudo systemctl reload nginx
```

### **Backup Strategy**
```bash
# Create backup before deployment
sudo cp -r /var/www/academitna /var/backups/academitna-frontend-$(date +%Y%m%d_%H%M%S)

# Automated backup script (add to cron)
0 2 * * * /usr/local/bin/backup-frontend.sh
```

### **Monitoring**
```bash
# Check Nginx logs
sudo tail -f /var/log/nginx/academitna_frontend_access.log
sudo tail -f /var/log/nginx/academitna_frontend_error.log

# Monitor disk usage
df -h /var/www/academitna

# Check file permissions
ls -la /var/www/academitna
```

## 🐛 Troubleshooting

### **Common Issues**

#### **1. 404 Errors for Routes**
```bash
# Ensure try_files is configured correctly in Nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

#### **2. Static Assets Not Loading**
```bash
# Check file permissions
sudo chown -R nginx:nginx /var/www/academitna
sudo chmod -R 755 /var/www/academitna

# Check Nginx configuration
sudo nginx -t
```

#### **3. API Calls Failing**
```bash
# Check CORS configuration in backend
# Verify API base URL in environment variables
# Test API connectivity from server
curl https://academitna.online/api/actuator/health
```

#### **4. Images Not Loading from CDN**
```bash
# Check CDN URL configuration
# Verify Bunny.net CDN is accessible
curl -I https://academitna.b-cdn.net/test-image.jpg

# Check CSP headers allow CDN domain
```

### **Log Analysis**
```bash
# Check for 404s
grep "404" /var/log/nginx/academitna_frontend_access.log

# Check for errors
grep "error" /var/log/nginx/academitna_frontend_error.log

# Monitor real-time access
tail -f /var/log/nginx/academitna_frontend_access.log
```

## ✅ Success Checklist

- [ ] Frontend builds without errors
- [ ] All environment variables configured
- [ ] Files deployed to `/var/www/academitna`
- [ ] Nginx configuration updated and tested
- [ ] SSL certificates working
- [ ] Homepage loads at `https://academitna.online`
- [ ] API calls work from frontend
- [ ] Images load from Bunny.net CDN
- [ ] Video player works with Bunny.net
- [ ] Authentication flow works
- [ ] All routes accessible (no 404s)
- [ ] Performance metrics acceptable
- [ ] Security headers present

## 🎉 Congratulations!

Your Academitna frontend is now deployed and ready for production use!

**Access your application at**: https://academitna.online

For support and maintenance, refer to the troubleshooting section above.
