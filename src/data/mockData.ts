import { Profile, Project, Task, ProjectFile, Message, Invoice } from '../types/portal';

export const MOCK_ADMIN: Profile = {
  id: 'admin-alex',
  full_name: 'Alex Rivers',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
  role: 'admin',
  brand_color: '#0f172a', // Slate 900
};

export const MOCK_CLIENTS: Profile[] = [
  {
    id: 'client-sarah',
    full_name: 'Sarah Jenkins',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    role: 'client',
    company_name: 'Vortex Labs',
    brand_color: '#06b6d4', // Cyan 500
  },
  {
    id: 'client-marcus',
    full_name: 'Marcus Vance',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    role: 'client',
    company_name: 'Apex Group',
    brand_color: '#6366f1', // Indigo 500
  }
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: 'Brand Strategy & Identity Design',
    client_id: 'client-sarah',
    status: 'active',
    created_at: '2026-05-15',
    description: 'Comprehensive brand discovery, positioning matrix, responsive logo system, and visual guidelines.',
  },
  {
    id: 'proj-2',
    title: 'Custom Next.js SaaS WebApp',
    client_id: 'client-sarah',
    status: 'active',
    created_at: '2026-06-01',
    description: 'Developing a high-performance customer dashboard, real-time analytics module, and Stripe subscriptions.',
  },
  {
    id: 'proj-3',
    title: 'Corporate Website & CMS Integration',
    client_id: 'client-marcus',
    status: 'active',
    created_at: '2026-06-10',
    description: 'High-speed marketing website with structured Sanity CMS configuration and Framer Motion transitions.',
  },
  {
    id: 'proj-4',
    title: 'E-commerce UI Consultation',
    client_id: 'client-marcus',
    status: 'completed',
    created_at: '2026-04-05',
    description: 'UX audits, high-fidelity wireframes, and checkout flow optimization.',
  }
];

export const MOCK_TASKS: Task[] = [
  // Project 1 tasks
  {
    id: 'task-1-1',
    project_id: 'proj-1',
    title: 'Finalize brand discovery summary document',
    status: 'done',
    due_date: '2026-05-22',
    is_template: false,
    priority: 'high',
  },
  {
    id: 'task-1-2',
    project_id: 'proj-1',
    title: 'Create secondary logo layout variations',
    status: 'in_progress',
    due_date: '2026-07-10',
    is_template: false,
    priority: 'medium',
  },
  {
    id: 'task-1-3',
    project_id: 'proj-1',
    title: 'Assemble typography pairing guidelines',
    status: 'todo',
    due_date: '2026-07-18',
    is_template: false,
    priority: 'low',
  },
  // Project 2 tasks
  {
    id: 'task-2-1',
    project_id: 'proj-2',
    title: 'Architect Supabase schema and RLS policies',
    status: 'done',
    due_date: '2026-06-05',
    is_template: false,
    priority: 'high',
  },
  {
    id: 'task-2-2',
    project_id: 'proj-2',
    title: 'Implement Next.js middleware and route guards',
    status: 'in_progress',
    due_date: '2026-07-08',
    is_template: false,
    priority: 'high',
  },
  {
    id: 'task-2-3',
    project_id: 'proj-2',
    title: 'Configure client billing portal endpoints',
    status: 'todo',
    due_date: '2026-07-25',
    is_template: false,
    priority: 'medium',
  },
  // Project 3 tasks
  {
    id: 'task-3-1',
    project_id: 'proj-3',
    title: 'Wireframe core landing pages',
    status: 'done',
    due_date: '2026-06-18',
    is_template: false,
    priority: 'high',
  },
  {
    id: 'task-3-2',
    project_id: 'proj-3',
    title: 'Connect CMS content models to Next.js routes',
    status: 'in_progress',
    due_date: '2026-07-15',
    is_template: false,
    priority: 'medium',
  },
  // Templates (is_template = true)
  {
    id: 'template-onboard',
    project_id: 'proj-1', // Link to brand but is template
    title: 'Client onboarding checklist & kickoff',
    status: 'todo',
    due_date: '2026-08-01',
    is_template: true,
    priority: 'high',
  },
  {
    id: 'template-deploy',
    project_id: 'proj-2',
    title: 'Production deployment QA check',
    status: 'todo',
    due_date: '2026-08-15',
    is_template: true,
    priority: 'medium',
  }
];

export const MOCK_FILES: ProjectFile[] = [
  {
    id: 'file-1',
    project_id: 'proj-1',
    file_name: 'Brand_Brief_VortexLabs.pdf',
    file_url: '#',
    file_size: '4.2 MB',
    uploaded_at: '2026-05-16',
    uploaded_by: 'Sarah Jenkins',
  },
  {
    id: 'file-2',
    project_id: 'proj-1',
    file_name: 'Logo_Moodboard_v2.jpg',
    file_url: '#',
    file_size: '8.7 MB',
    uploaded_at: '2026-05-28',
    uploaded_by: 'Alex Rivers',
  },
  {
    id: 'file-3',
    project_id: 'proj-2',
    file_name: 'Database_Schema_Draft_v1.png',
    file_url: '#',
    file_size: '1.4 MB',
    uploaded_at: '2026-06-06',
    uploaded_by: 'Alex Rivers',
  }
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    project_id: 'proj-1',
    sender_id: 'client-sarah',
    content: "Hi Alex! We just reviewed the discovery brief. It's incredibly thorough and aligns perfectly with our vision.",
    created_at: '2026-05-17T09:15:00Z',
  },
  {
    id: 'msg-2',
    project_id: 'proj-1',
    sender_id: 'admin-alex',
    content: "That's fantastic to hear, Sarah! I've kicked off the moodboarding phase based on your feedback on the core pillars.",
    created_at: '2026-05-17T11:30:00Z',
  },
  {
    id: 'msg-3',
    project_id: 'proj-1',
    sender_id: 'client-sarah',
    content: "Excellent. Let us know when the draft visual direction is ready for review.",
    created_at: '2026-05-18T14:22:00Z',
  },
  {
    id: 'msg-4',
    project_id: 'proj-2',
    sender_id: 'admin-alex',
    content: "Hey Sarah! Just pushed the Supabase schema to the database files folder. Take a look at your convenience.",
    created_at: '2026-06-06T16:05:00Z',
  }
];

export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    project_id: 'proj-1',
    amount: 4500,
    status: 'paid',
    due_date: '2026-05-30',
    invoice_number: 'INV-2026-001',
  },
  {
    id: 'inv-2',
    project_id: 'proj-2',
    amount: 6000,
    status: 'sent',
    due_date: '2026-07-15',
    invoice_number: 'INV-2026-002',
  },
  {
    id: 'inv-3',
    project_id: 'proj-3',
    amount: 3500,
    status: 'sent',
    due_date: '2026-07-20',
    invoice_number: 'INV-2026-003',
  },
  {
    id: 'inv-4',
    project_id: 'proj-4',
    amount: 1500,
    status: 'paid',
    due_date: '2026-04-20',
    invoice_number: 'INV-2026-004',
  }
];
