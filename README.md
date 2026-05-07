# Kismath Catering

A static brand-showcase website for **Kismath**, an Arabic-fusion catering service.

Two-tone palette (cream `#F5F0E8` + maroon `#7A1B1B`), hand-drawn corner illustrations, and a click-to-expand menu modal.

## Stack

- HTML5 + CSS3 + vanilla JavaScript — no framework, no build step
- [Swiper](https://swiperjs.com/) (CDN) for the testimonial carousel
- Google Fonts: Playfair Display, Cinzel, Noto Naskh Arabic, Amiri, Inter

## Project structure

```
.
├── index.html          # Single-page site
├── css/style.css       # All styles
├── js/main.js          # Modal, mobile menu, carousel, lightbox
├── images/
│   ├── logo-dark1.png  # Navbar logo (transparent maroon)
│   ├── logo-cream1.png # Footer logo (transparent cream)
│   ├── menu/           # Dish photos (17 .jpg)
│   └── sketch/         # Decorative corner illustrations (2 sets)
├── .gitignore
└── README.md
```

## Sections

Hero · About · Menu (6 clickable category cards → modal) · Why Choose Us · Gallery · Testimonials · Contact · Footer

## Run locally

```bash
# Static preview (no contact form):
python3 -m http.server 8000

# Full preview including the /api/contact serverless function:
npm install         # one-time, installs nodemailer
npx vercel dev      # serves site + /api/contact, reads .env automatically
```

## Email / contact form

The form POSTs JSON to [`/api/contact`](api/contact.js) — a Vercel serverless function that sends the email via Gmail SMTP using `nodemailer`.

Credentials live in `.env` for local dev and in **Vercel → Project → Settings → Environment Variables** for production. Required keys:

| Variable | Value |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` (STARTTLS) or `465` (implicit TLS) |
| `SMTP_USER` | your Gmail address |
| `SMTP_PASS` | Gmail **App Password** (Google Account → Security → 2-Step Verification → App passwords) |
| `TO_EMAIL` | where inquiries are delivered (usually same as `SMTP_USER`) |

## Deploy to Vercel

```bash
npm install -g vercel       # if not already installed
vercel                      # first run links the project
vercel --prod               # deploys
```

Then in the Vercel dashboard, add the five env vars above (paste the same values from `.env`) and click **Redeploy**. Done — `/api/contact` is live on a global edge.

Alternative: connect this GitHub repo to Vercel via the dashboard — Vercel auto-deploys on push and prompts you for env vars during setup.

## Customising

| What | Where |
|---|---|
| Brand colours | [css/style.css](css/style.css) — `:root` variables at the top |
| Menu dishes (modal contents) | [js/main.js](js/main.js) — `MENU_DATA` object |
| Category cards | [index.html](index.html) — `.menu-card` blocks |
| Logo size | [css/style.css](css/style.css) — `.logo-img { height }` |
| Corner sketches | [images/sketch/](images/sketch/) — replace `corner*.png` files |
| Contact info | [index.html](index.html) — `.contact-list` and footer |

## Performance

Total page weight: **~3 MB**. All images optimized — menu photos as JPEG q85 progressive, logos and sketches as palette-quantized PNG. All `<img>` tags use `loading="lazy"`.
