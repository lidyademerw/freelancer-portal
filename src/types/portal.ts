export type UserRole = 'admin' | 'client';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  role: UserRole;
  brand_color?: string;
  company_name?: string;
}

export interface Project {
  id: string;
  title: string;
  client_id: string;
  status: 'active' | 'completed';
  created_at: string;
  description?: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  due_date: string;
  is_template: boolean;
  priority?: 'low' | 'medium' | 'high';
  description?: string;
  assigned_to_client?: boolean;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  file_name: string;
  file_url: string;
  file_size: string;
  uploaded_at: string;
  uploaded_by: string; // full_name or role
}

export interface Message {
  id: string;
  project_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  project_id: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  due_date: string;
  invoice_number: string;
}
