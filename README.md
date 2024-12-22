# 🚀 FlareBase Expo D1
A modern web dashboard for managing Cloudflare D1 databases! ⚡

## ✨ Features
- ✅ Execute SQL Queries
- ✅ View Table Structures
- ✅ Monitor Database Metrics
- ✅ Dark Mode Interface
- ✅ Real-time Updates

## 📸 Screenshots

### Database Overview
<div style="margin-bottom: 30px;">
  <img src="screenshots/pic0.png" alt="FlareBase Database Metrics" width="780"/>
  <p>View all your D1 databases, metrics, and performance at a glance.</p>
</div>

### Table Management
<div style="margin-bottom: 30px;">
  <img src="screenshots/pic1.png" alt="FlareBase Table View" width="780"/>
  <p>Execute queries, manage tables, and view data with our modern interface.</p>
</div>

## 🔥 Fast Deploy
1. Fork this repository
2. Go to Cloudflare Pages
3. Connect your forked repo
4. Set build settings:
```
Framework preset: Next.js
Build command: npx @cloudflare/next-on-pages
Build output directory: .vercel/output/static
```

## ⚙️ Environment Setup

### 1️⃣ Account ID
- Log in to Cloudflare Dashboard
- Find in right sidebar or URL:
```
https://dash.cloudflare.com/<Account ID>
```

### 2️⃣ API Token
Create token with permissions:
```
D1: Read & Write
Workers Scripts: Read & Write
```

### 3️⃣ CORS Worker
1. Go to Workers & Pages
2. Create new Worker
3. Just Paste code:
```js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, CF-Account-ID',
      }
    })
  }

  try {
    const url = new URL(request.url)
    const cfAccountId = request.headers.get('CF-Account-ID')
    const authToken = request.headers.get('Authorization')

    // Base Cloudflare API URL
    const baseApiUrl = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/d1`

    let response

    if (url.pathname === '/databases') {
      // List databases
      response = await fetch(`${baseApiUrl}/database`, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      })
    } else if (url.pathname === '/query') {
      // Handle database queries
      const { dbId, sql } = await request.json()
      response = await fetch(`${baseApiUrl}/database/${dbId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql })
      })
    } else {
      return new Response('Not Found', { status: 404 })
    }

    const data = await response.json()

    // Return response with CORS headers
    return new Response(JSON.stringify(data), {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    })
  }
}
```
4. Deploy and copy worker URL

### 4️⃣ Add Variables
In Cloudflare Pages > Settings > Environment variables:
```
NEXT_PUBLIC_ACCOUNT_ID=your_cloudflare_account_id
NEXT_PUBLIC_API_TOKEN=your_cloudflare_api_token
NEXT_PUBLIC_CORS_PROXY_URL=your_worker_url
```

## 🚀 Ready!
Your D1 dashboard will be live at:
```
https://your-project.pages.dev
```

## 📝 Todo & Notes
- Initially started as a simple JavaScript project for easy copy-paste deployment
- Zero dependency approach didn't work smoothly and became too complex
- Switched to TypeScript/Nextjs to make things actually work
- Current code is concentrated in `page.tsx` (will be refactored in future updates)
- Planning to split components and improve code organization

## 📞 Contact
- GitHub: [@malithonline](https://github.com/malithonline)
- LinkedIn: [@malithonline](https://www.linkedin.com/in/malithonline)

Made with ❤️ by malith
