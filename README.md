# CloakRoom Admin Panel

Admin dashboard for the CloakRoom e-commerce platform. Manages users, orders, products, and admin access — connects to the same Firebase backend as the main storefront.

## Tech Stack

- **React 19** + **Vite 7** (no TypeScript)
- **Tailwind CSS v4** for styling
- **Firebase** (Auth + Firestore)
- **Cloudinary** for product image hosting
- **Lucide React** for icons
- **React Router v7** for client-side routing
- **Vercel** for deployment

## Project Structure

```
admin/
├── public/
├── src/
│   ├── components/
│   │   └── Sidebar.jsx            # Fixed sidebar with navigation
│   ├── config/
│   │   ├── firebase.js            # Firebase app, auth & db instances
│   │   └── adminConfig.js         # Admin email whitelist (Firestore + hardcoded owner)
│   ├── contexts/
│   │   └── AuthContext.jsx         # Google Auth with admin email verification
│   ├── pages/
│   │   ├── AdminLayout.jsx        # Protected layout wrapper (redirects if not admin)
│   │   ├── Login.jsx              # Google sign-in page
│   │   ├── UsersPage.jsx          # User management (list, delete, password reset)
│   │   ├── OrdersPage.jsx         # Order tracking (merged view, status updates)
│   │   ├── ProductsPage.jsx       # Product CRUD (images, inventory, real-time stock)
│   │   └── AllowedUsersPage.jsx   # Admin access management (add/remove emails)
│   ├── services/
│   │   ├── userService.js         # Firestore CRUD for users collection
│   │   ├── orderService.js        # Merges orders + orderTracking + customOrders
│   │   ├── productService.js      # Product CRUD + real-time listener (onSnapshot)
│   │   └── cloudinaryService.js   # Image upload to Cloudinary
│   ├── App.jsx                    # Router setup
│   ├── main.jsx                   # Entry point
│   └── index.css                  # Tailwind imports
├── vercel.json                    # SPA rewrite rules
├── package.json
└── vite.config.js
```

## Firebase Collections

| Collection | Purpose | Access |
|---|---|---|
| `allowedUsers` | Admin email whitelist (doc ID = email) | Authenticated read, admin write |
| `users` | Registered user profiles | Admin full access, users own doc only |
| `orders` | Order records with items, shipping, totals | Authenticated read/write |
| `orderTracking` | Tracking status, history, courier details | Admin full access, users own orders |
| `customOrders` | Custom design orders | Authenticated read, public create |
| `products` | Product catalog (synced with main app) | Public read, authenticated write |

## External Services

### Firebase (project: `ecom-c2aca`)
- **Auth**: Google OAuth provider, restricted to allowed admin emails
- **Firestore**: All data storage — users, orders, products, admin whitelist

### Cloudinary (cloud: `dlxv7oikk`)
- **Upload preset**: `ml_default` (unsigned)
- **Folder structure**: `products/{gender}/{product-name-slug}/`
- Stores product images (up to 6 per product)

## Admin Access Control

Access is controlled at two levels:

1. **App level** (`adminConfig.js`): Checks email against Firestore `allowedUsers` collection + one hardcoded owner email (`sanshraysinghlangeh@gmail.com`) that always has access
2. **Database level** (`firestore.rules`): `isAdmin()` helper uses `exists()` to check if the authenticated user's email has a document in `allowedUsers`

### First-time Setup

The owner email is hardcoded in the app, so it can log in without any Firestore data. To enable Firestore-level admin checks (required for rules), create the first document:

- **Collection**: `allowedUsers`
- **Document ID**: `sanshraysinghlangeh@gmail.com`
- **Fields**: `email` (string), `addedAt` (timestamp)

After that, additional admins can be added from the **Allowed Users** tab in the admin panel.

## Features

### Users Tab
- List all registered users with search
- Delete user (removes Firestore doc)
- Send password reset email

### Order Tracking Tab
- Merged view from `orders` + `orderTracking` + `customOrders`
- Status filter pills (Pending, Accepted, Preparing, Shipped, Delivered, Cancelled)
- Expandable order details (items, shipping address, tracking history)
- Update status modal with tracking number, courier, estimated delivery, notes
- Pagination (10 per page)

### Products Tab
- Product grid with category filter and search
- Add/edit product form: gender, category, name, description, price, sizes, colors, material, inventory count, featured/customizable toggles
- Image upload to Cloudinary (up to 6 images)
- **Real-time stock tracking** via Firestore `onSnapshot` — stock count updates live when customers place orders
- Live indicator badge

### Allowed Users Tab
- List all admin emails from Firestore
- Add new admin email
- Remove admin email (with confirmation)

## Stock Count Flow

1. Admin adds product with `stockCount` via Products tab
2. Customer places order on main app → `orderService.createOrder()` uses `increment(-quantity)` to reduce `stockCount` in Firebase
3. Admin panel's real-time listener (`onSnapshot`) auto-updates the product cards and edit form
4. Main app shows "X left" / "Sold out" / "OUT OF STOCK" badge on product cards

## Development

```bash
npm install
npm run dev
```

## Build & Deploy

```bash
npm run build
```

Deployed on Vercel with `vercel.json` handling SPA rewrites. Connect the GitHub repo to Vercel for automatic deployments.

## Firestore Rules

The Firestore security rules are maintained in the main app repo at `threadsmith-canvas-craft/firestore.rules`. They must be deployed to Firebase Console manually (paste into Firestore > Rules > Publish) since firebase-tools CLI is not installed.
