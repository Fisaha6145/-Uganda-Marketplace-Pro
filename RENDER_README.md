
# Deploy to Render — Uganda Marketplace Pro (WhatsApp + Call)

## Create these on Render
1) **PostgreSQL** (Managed) → copy DATABASE_URL
2) **Web Service (Docker)** → backend/ (port 8080)
3) **Web Service or Static Site (Docker)** → frontend/

## Backend env vars
DATABASE_URL=<from Render Postgres>
PORT=8080
JWT_SECRET=<generate strong secret>
CORS_ORIGIN=*
UPLOAD_DIR=/app/uploads
REGISTRATION_FEE_UGX=25000

## WhatsApp / Phone
Create product body:
{
  "name":"iPhone 11",
  "category":"Electronics",
  "priceUGX":900000,
  "stock":1,
  "whatsapp":"0701234567",
  "phone":"+256701234567",
  "showContact":true
}
Public GET /products adds:
- whatsappLink: https://wa.me/256701234567?text=Hi%2C%20I'm%20interested%20in%20iPhone%2011
- phoneLink: tel:+256701234567
