# Framez - Social Media Mobile App

A modern social media mobile application built with React Native and Expo for the HNG Internship Stage 4 Mobile Track.

## 🎯 Project Overview

Framez is a full-featured social media app that allows users to create posts with images, view a real-time feed, and manage their profiles. Built with React Native, Expo Router, and Supabase for backend services.

## ✨ Features

- **User Authentication**

  - Email/Password sign up and login
  - Persistent sessions (stay logged in after closing app)
  - Secure authentication with Supabase Auth

- **Feed**

  - View all posts from all users in real-time
  - Pull-to-refresh functionality
  - Beautiful Instagram-like post cards
  - Relative timestamps (e.g., "2 hours ago")
  - Auto-updates when new posts are created

- **Create Posts**

  - Write text-based posts
  - Upload images from your photo library
  - Image preview before posting
  - Image cropping and editing
  - Secure image storage with Supabase Storage

- **User Profile**

  - View your profile information
  - See post count statistics
  - View all your posts
  - Logout functionality

- **UI/UX**
  - Clean, modern interface
  - Smooth tab navigation
  - Custom logo and branding
  - Loading states and error handling
  - Responsive design

## 🛠️ Tech Stack

- **Frontend**: React Native with Expo
- **Routing**: Expo Router (file-based routing)
- **Backend**: Supabase
  - Authentication
  - PostgreSQL Database
  - Storage (for images)
  - Real-time subscriptions
- **Language**: TypeScript
- **UI Components**: React Native core components
- **Image Handling**: expo-image-picker
- **Date Formatting**: dayjs

## 📱 Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo Go app on your phone (for testing)
- A Supabase account

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd framez
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your project URL and anon key

### Step 4: Configure Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 5: Set Up Database

Run the following SQL in Supabase SQL Editor:

```sql
-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- Create posts table
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  image_url text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.posts enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Posts policies
create policy "Posts are viewable by everyone"
  on posts for select using (true);

create policy "Users can insert own posts"
  on posts for insert to authenticated
  with check (auth.uid() = author_id);

create policy "Users can update own posts"
  on posts for update using (auth.uid() = author_id);

create policy "Users can delete own posts"
  on posts for delete using (auth.uid() = author_id);
```

### Step 6: Set Up Storage

1. Go to Storage in Supabase dashboard
2. Create a bucket named `post-images`
3. Make it public
4. Run this SQL for storage policies:

```sql
create policy "Authenticated uploads to post-images"
on storage.objects for insert to authenticated
with check (bucket_id = 'post-images');

create policy "Public access to post-images"
on storage.objects for select
using (bucket_id = 'post-images');
```

### Step 7: Run the App

```bash
npx expo start
```

Scan the QR code with Expo Go on your phone to run the app.

## 📂 Project Structure

```
framez/
├── app/
│   ├── (app)/              # Authenticated app routes
│   │   ├── _layout.tsx     # Tab navigation
│   │   ├── index.tsx       # Feed screen
│   │   ├── create.tsx      # Create post screen
│   │   └── profile.tsx     # Profile screen
│   ├── (auth)/             # Authentication routes
│   │   ├── login.tsx       # Login screen
│   │   └── signup.tsx      # Signup screen
│   ├── _layout.tsx         # Root layout
│   └── index.tsx           # Entry redirect
├── components/
│   ├── Logo.tsx            # App logo component
│   └── PostCard.tsx        # Post display component
├── context/
│   └── AuthProvider.tsx    # Authentication context
├── lib/
│   └── supabase.ts         # Supabase client
└── .env                    # Environment variables
```

## 🚀 Deployment

The app is deployed on Appetize.io for demo purposes:

[Demo Link: Insert Appetize.io URL]

## 🎥 Demo Video

[Video Link: Insert video URL showing app features]

## 👤 Developer

**Xander Kira**

- HNG Internship - Stage 4 Mobile Track
- Email: xanderkira4life@gmail.com

## 📝 License

This project is part of the HNG Internship program.

## 🙏 Acknowledgments

- HNG Internship for the opportunity
- Supabase for the amazing backend platform
- Expo team for the excellent development experience
