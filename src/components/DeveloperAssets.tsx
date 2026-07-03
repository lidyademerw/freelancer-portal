import React, { useState } from 'react';
import { Copy, Check, FolderTree, Database, Code, ShieldCheck } from 'lucide-react';

interface AssetSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  filename: string;
  language: string;
  code: string;
}

export default function DeveloperAssets() {
  const [activeTab, setActiveTab] = useState<string>('schema');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const assets: AssetSection[] = [
    {
      id: 'schema',
      title: 'Supabase SQL Schema',
      icon: <Database className="w-4 h-4" />,
      filename: 'supabase-schema.sql',
      language: 'sql',
      code: `-- Create custom user role enum type
CREATE TYPE user_role AS ENUM ('admin', 'client');
CREATE TYPE project_status AS ENUM ('active', 'completed');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');

-- 1. Create profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'client',
  brand_color VARCHAR(7) DEFAULT '#0f172a',
  company_name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create projects table
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status project_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create tasks table
CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  status task_status NOT NULL DEFAULT 'todo',
  due_date DATE,
  is_template BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create files table
CREATE TABLE public.files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

----------------------------------------------------
-- RLS Policies for Profiles
----------------------------------------------------
-- Logged in users can read profile details to see team & client details
CREATE POLICY "Allow logged-in users to view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Users can only update their own profile details
CREATE POLICY "Allow users to update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

----------------------------------------------------
-- RLS Policies for Projects
----------------------------------------------------
-- Admins can view/manage all projects
CREATE POLICY "Admins have full access to projects"
ON public.projects FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Clients can only view their own projects
CREATE POLICY "Clients can view their own projects"
ON public.projects FOR SELECT
TO authenticated
USING (client_id = auth.uid());

----------------------------------------------------
-- RLS Policies for Tasks
----------------------------------------------------
-- Admins can view/manage all tasks
CREATE POLICY "Admins have full access to tasks"
ON public.tasks FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Clients can view tasks belonging to their assigned projects
CREATE POLICY "Clients can view tasks for their projects"
ON public.tasks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = tasks.project_id AND projects.client_id = auth.uid()
  )
);

----------------------------------------------------
-- RLS Policies for Files
----------------------------------------------------
-- Admins can view/manage all files
CREATE POLICY "Admins have full access to files"
ON public.files FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Clients can view files uploaded to their assigned projects
CREATE POLICY "Clients can view files for their projects"
ON public.files FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = files.project_id AND projects.client_id = auth.uid()
  )
);

-- Trigger to automatically create a profile when a user signs up on Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'New Client'), 'client');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`,
    },
    {
      id: 'middleware',
      title: 'Next.js Middleware',
      icon: <ShieldCheck className="w-4 h-4" />,
      filename: 'middleware.ts',
      language: 'typescript',
      code: `import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 1. Initialize Supabase SSR client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 2. Fetch authenticated user session securely (GetUser checks cryptographic signature)
  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const isAuthPage = url.pathname.startsWith('/auth')
  const isDashboardPage = url.pathname.startsWith('/dashboard')

  // Redirection Engine
  if (!user) {
    if (isDashboardPage) {
      // Unauthenticated -> Force redirect to login page
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }
    return response
  }

  // 3. User is logged in -> Query role from database profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role // 'admin' | 'client'

  if (isAuthPage) {
    // Authenticated -> Prevent login page loop, route straight to matching panel
    url.pathname = role === 'admin' ? '/dashboard/admin' : '/dashboard/client'
    return NextResponse.redirect(url)
  }

  if (isDashboardPage) {
    // Role-based Access Rules:
    // Admin trying to enter client route -> redirect to admin home
    if (role === 'admin' && url.pathname.startsWith('/dashboard/client')) {
      url.pathname = '/dashboard/admin'
      return NextResponse.redirect(url)
    }

    // Client trying to enter admin route -> redirect to client home
    if (role === 'client' && url.pathname.startsWith('/dashboard/admin')) {
      url.pathname = '/dashboard/client'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to customize this based on assets.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}`,
    },
    {
      id: 'types',
      title: 'B2B TypeScript Models',
      icon: <Code className="w-4 h-4" />,
      filename: 'types/index.ts',
      language: 'typescript',
      code: `export type UserRole = 'admin' | 'client';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  avatarUrl?: string;
  brandColor?: string;
  companyName?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  clientId: string; // Foreign Key pointing to profiles.id
  status: 'active' | 'completed';
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string; // Foreign Key pointing to projects.id
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  dueDate: string;
  isTemplate: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface Message {
  id: string;
  projectId: string; // Foreign key pointing to projects.id
  senderId: string; // Foreign key pointing to profiles.id
  content: string;
  createdAt: string;
}

export interface File {
  id: string;
  projectId: string; // Foreign key pointing to projects.id
  fileName: string;
  fileUrl: string;
  fileSize: string;
  uploadedAt: string;
  uploadedBy: string; // Foreign key pointing to profiles.id
}`,
    },
    {
      id: 'folder',
      title: 'Next.js 15 Folder Layout',
      icon: <FolderTree className="w-4 h-4" />,
      filename: 'Directory Tree',
      language: 'text',
      code: `my-freelancer-portal/
├── app/
│   ├── layout.tsx              # Root HTML, Fonts, Tailwind setup
│   ├── page.tsx                # Client-side auto-routing / Landing
│   ├── middleware.ts           # Supabase session check & role router
│   ├── auth/
│   │   ├── layout.tsx          # Shared auth backdrop, logo
│   │   ├── login/
│   │   │   └── page.tsx        # Supabase authentication form
│   │   └── signup/
│   │       └── page.tsx        # Registration & profile setup
│   └── dashboard/
│       ├── layout.tsx          # Interactive Dashboard Sidebar & user profile
│       ├── admin/
│       │   ├── page.tsx        # Freelancer Overview (All clients & invoices)
│       │   ├── tasks/
│       │   │   └── page.tsx    # Comprehensive Task Board & Templates
│       │   ├── files/
│       │   │   └── page.tsx    # Media and document management
│       │   ├── messages/
│       │   │   └── page.tsx    # Unified Client Communications
│       │   └── invoices/
│       │       └── page.tsx    # Billing tracker and generator
│       └── client/
│           ├── page.tsx        # Client Overview (Their projects, status)
│           ├── tasks/
│           │   └── page.tsx    # Filtered project task lists
│           ├── files/
│           │   └── page.tsx    # Downloadable deliverables
│           ├── messages/
│           │   └── page.tsx    # Client-to-Freelancer chat thread
│           └── invoices/
│               └── page.tsx    # Payable invoices (Stripe connection)
├── components/
│   ├── sidebar.tsx             # Interactive, brand-color adaptable menu
│   └── ui/                     # Reusable Shadcn base primitives
├── lib/
│   └── supabase.ts             # Client-side Supabase client singleton
├── types/
│   └── index.ts                # Strong type declarations
├── package.json
│   └── tsconfig.json`,
    },
    {
      id: 'queries',
      title: 'Supabase Task Queries',
      icon: <Database className="w-4 h-4" />,
      filename: 'lib/queries.ts',
      language: 'typescript',
      code: `import { createClient } from '@supabase/supabase-js'
import { Task } from '../types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Fetches tasks for a specific project from Supabase.
 * Calculates completion percentage dynamically based on task states.
 * Passes this percentage to Donut Chart and Progress Bar components.
 */
export async function fetchProjectTasksAndMetrics(projectId: string) {
  try {
    // 1. Write the Supabase query to select tasks for the chosen project
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!tasks || tasks.length === 0) {
      return {
        tasks: [],
        total: 0,
        done: 0,
        completionPercentage: 0
      };
    }

    // 2. Filter tasks where status is 'done' vs total tasks
    const total = tasks.length;
    const done = tasks.filter((t: Task) => t.status === 'done').length;

    // 3. Calculate the completion percentage
    const completionPercentage = Math.round((done / total) * 100);

    return {
      tasks,
      total,
      done,
      completionPercentage // Passed directly to Donut Chart & Progress Bars
    };
  } catch (error) {
    console.error('Error executing tasks query:', error);
    return null;
  }
}`
    }
  ];

  const activeAsset = assets.find(a => a.id === activeTab) || assets[0];

  return (
    <div id="dev-assets-panel" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-sans font-semibold text-lg text-slate-900 tracking-tight flex items-center gap-2">
          <Code className="w-5 h-5 text-indigo-600" />
          Developer Architecture & Code Assets
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Review and copy production-ready backend code, models, schemas, and Next.js structures.
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-100 overflow-x-auto bg-slate-50/20 scrollbar-none">
        {assets.map((asset) => (
          <button
            key={asset.id}
            onClick={() => setActiveTab(asset.id)}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === asset.id
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50/50'
            }`}
          >
            {asset.icon}
            {asset.title}
          </button>
        ))}
      </div>

      {/* File info and Copy bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 text-slate-400 text-xs">
        <div className="font-mono flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          {activeAsset.filename}
        </div>
        <button
          onClick={() => copyToClipboard(activeAsset.code, activeAsset.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all cursor-pointer font-medium active:scale-95"
        >
          {copiedId === activeAsset.id ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Code viewport */}
      <div className="flex-1 bg-slate-950 p-6 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed max-h-[500px] lg:max-h-[640px]">
        <pre className="whitespace-pre overflow-x-auto">
          <code>{activeAsset.code}</code>
        </pre>
      </div>

      {/* Footer hint */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500">
        All templates comply with <strong>Next.js 15 App Router</strong>, <strong>Supabase Auth</strong>, and <strong>Supabase RLS Rules</strong>.
      </div>
    </div>
  );
}
