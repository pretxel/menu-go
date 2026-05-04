# 🧾 Requirements: Digital Menu Web App (Vercel + Claude AI)

---

## 1. 🎯 Objective

Build a web application that enables restaurants and bars to quickly create and manage digital menus—either manually or by uploading a photo—automatically generate a mobile-friendly menu, and provide a unique QR code linking to it, allowing real-time updates without reprinting.

---

## 2. 👤 Users

### 2.1 Restaurant / Bar Admin
- Owners or staff managing the menu

### 2.2 End Customers
- Users who scan the QR code to view the menu

---

## 3. 🧱 Architecture

### 🌐 Frontend
- Next.js (App Router)
- Tailwind CSS + shadcn/ui
- SSR / ISR for performance

---

### ⚙️ Backend
- Next.js API Routes / Server Actions
- Edge Functions (low latency)

---

### 🧠 AI Integration
- Claude API (Anthropic)

**Responsibilities:**
- Structure OCR text into JSON
- Detect:
  - Categories
  - Items
  - Prices
  - Descriptions

---

### 🗄️ Database
- Vercel Postgres

---

### 🗂️ Storage
- Vercel Blob
- Stores:
  - Menu images
  - Dish images
  - Logos

---

### 🔍 OCR
- Option 1: External (Google Vision API)
- Option 2 (MVP): Text extraction + Claude parsing

---

## 4. 🚀 Core Features

---

### 4.1 Authentication
- Email/password login
- OAuth (optional)
- Secure sessions

---

### 4.2 Restaurant Management
- Create/edit:
  - Name
  - Logo
  - Branding (colors)
  - Unique slug

---

### 4.3 Menu Creation

#### 🟢 Manual Mode
- Create categories (e.g. Starters, Drinks)
- Add items:
  - Name
  - Description
  - Price
  - Image
  - Tags

---

#### 🟡 Photo Import (Key Feature)

**Flow:**
1. Upload image → stored in Vercel Blob  
2. OCR extracts text  
3. Claude processes and structures data  
4. Returns structured JSON  
5. Editable preview before saving  

**Example Output:**
```json
{
  "categories": [
    {
      "name": "Starters",
      "items": [
        {
          "name": "Nachos",
          "price": 8.5,
          "description": "With cheese and guacamole"
        }
      ]
    }
  ]
}

### 4.4 Digital Menu Generation
Public URL:
https://app.com/r/{slug}

Features: 

- Mobile-first UI
- Responsive design
- Clean layout (cards or list)