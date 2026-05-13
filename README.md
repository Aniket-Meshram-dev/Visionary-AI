# QuickAI - AI-Powered Full-Stack SaaS Platform

QuickAI is a comprehensive SaaS platform designed to empower users with cutting-edge AI tools for content generation and image processing. Built with a modern tech stack, it offers a seamless experience for creating articles, generating images, removing backgrounds, and even reviewing resumes.

![QuickAI Preview](https://via.placeholder.com/1200x600?text=QuickAI+Platform+Preview)

## 🚀 Key Features

- **📝 AI Content Suite**:
  - **Write Article**: Generate high-quality, long-form articles from a simple prompt.
  - **Blog Titles**: Create catchy and SEO-friendly titles for your next blog post.
- **🎨 AI Image Suite**:
  - **Generate Images**: Create stunning visuals using advanced text-to-image AI (ClipDrop).
  - **Remove Background**: Instant background removal powered by AI.
  - **Remove Object**: Smartly erase unwanted objects from your photos.
- **📄 AI Resume Reviewer**: Upload your resume in PDF format and get constructive AI-driven feedback to improve your job prospects.
- **👥 Community Hub**: Share your AI-generated masterpieces with the community and get inspired by others.
- **🔐 Secure Authentication**: Integrated with **Clerk** for robust and hassle-free user management.
- **💎 Premium Subscription Model**: Built-in logic for free usage limits and premium feature unlocking.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite 7
- **Styling**: Tailwind CSS 4
- **State Management & Routing**: React Router Dom 7
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Authentication**: Clerk React SDK

### Backend
- **Runtime**: Node.js + Express 5
- **Database**: Neon (PostgreSQL) with Serverless SQL
- **AI Integration**: Gemini 2.0 Flash (via OpenAI SDK), ClipDrop API
- **File Handling**: Cloudinary (Image Storage), Multer (File Uploads), PDF-Parse (Text Extraction)
- **Deployment**: Configured for Vercel

## ⚙️ Environment Variables

To run this project, you will need to add the following environment variables to your `.env` files.

### Server (`/server/.env`)
```env
PORT=3000
DATABASE_URL=your_neon_db_url
CLERK_SECRET_KEY=your_clerk_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GEMINI_API_KEY=your_gemini_api_key
CLIPDROP_API_KEY=your_clipdrop_api_key
```

### Client (`/client/.env`)
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_SERVER_URL=http://localhost:3000
```

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/QuickAI-Full-Stack.git
   cd QuickAI-Full-Stack
   ```

2. **Setup the Server**:
   ```bash
   cd server
   npm install
   # Create .env and add keys
   npm run server
   ```

3. **Setup the Client**:
   ```bash
   cd ../client
   npm install
   # Create .env and add keys
   npm run dev
   ```

## 📜 Database Schema & Core Tables

The project uses a PostgreSQL database (Neon) with a central table for all AI outputs:

### `creations` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID/Serial | Unique identifier for each creation |
| `user_id` | String | Clerk User ID of the creator |
| `prompt` | Text | Input prompt used for generation |
| `content` | Text | The generated result (URL for images, Markdown for text) |
| `type` | String | Type of creation (`article`, `blog-title`, `image`, `resume-review`) |
| `publish` | Boolean | Whether the creation is visible in the Community Hub |
| `likes` | Text[] | Array of User IDs who liked the creation |
| `created_at` | Timestamp | Automatic creation timestamp |

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
Built with ❤️ by [Aniket]
