import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Task, ProjectFile, Message, Invoice } from '../types/portal';
import { 
  MOCK_ADMIN, 
  MOCK_CLIENTS, 
  MOCK_PROJECTS, 
  MOCK_TASKS, 
  MOCK_FILES, 
  MOCK_MESSAGES, 
  MOCK_INVOICES 
} from '../data/mockData';

export type UserRole = 'admin' | 'client';

interface PortalContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  currentProfile: Profile;
  setCurrentProfile: (profile: Profile) => void;
  selectedClient: Profile;
  setSelectedClient: (client: Profile) => void;
  brandColor: string;
  setBrandColor: (color: string) => void;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  files: ProjectFile[];
  setFiles: React.Dispatch<React.SetStateAction<ProjectFile[]>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  activeTab: 'overview' | 'tasks' | 'files' | 'messages' | 'invoices';
  setActiveTab: (tab: 'overview' | 'tasks' | 'files' | 'messages' | 'invoices') => void;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export function PortalProvider({ children }: { children: React.ReactNode }) {
  // Read state from localStorage to simulate dynamic Supabase persistence on refresh
  const [userRole, setUserRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('sydney_user_role');
    return (saved as UserRole) || 'admin';
  });

  const [currentProfile, setCurrentProfile] = useState<Profile>(() => {
    const savedRole = localStorage.getItem('sydney_user_role') || 'admin';
    if (savedRole === 'admin') {
      return MOCK_ADMIN;
    } else {
      // Find Sarah Jenkins or default to first client
      const savedClient = localStorage.getItem('sydney_active_client_id');
      return MOCK_CLIENTS.find(c => c.id === savedClient) || MOCK_CLIENTS[0];
    }
  });

  const [selectedClient, setSelectedClient] = useState<Profile>(() => {
    const savedClient = localStorage.getItem('sydney_active_client_id');
    return MOCK_CLIENTS.find(c => c.id === savedClient) || MOCK_CLIENTS[0];
  });

  const [brandColor, setBrandColorState] = useState<string>(() => {
    return localStorage.getItem('sydney_brand_color') || '#6366f1';
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('sydney_tasks');
    return saved ? JSON.parse(saved) : MOCK_TASKS;
  });

  const [files, setFiles] = useState<ProjectFile[]>(() => {
    const saved = localStorage.getItem('sydney_files');
    return saved ? JSON.parse(saved) : MOCK_FILES;
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('sydney_messages');
    return saved ? JSON.parse(saved) : MOCK_MESSAGES;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('sydney_invoices');
    return saved ? JSON.parse(saved) : MOCK_INVOICES;
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'files' | 'messages' | 'invoices'>('overview');

  // Sync state mutations back to simulated Supabase persistence (localStorage)
  useEffect(() => {
    localStorage.setItem('sydney_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('sydney_files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('sydney_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('sydney_invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Persists brandColor preference in Root CSS Custom variables
  useEffect(() => {
    document.documentElement.style.setProperty('--brand-color', brandColor);
    document.documentElement.style.setProperty('--primary', brandColor);
    localStorage.setItem('sydney_brand_color', brandColor);
  }, [brandColor]);

  // Handle setting and persisting the brandColor to user profile preference
  const updateBrandColor = (newColor: string) => {
    setBrandColorState(newColor);
    
    // Log active simulation statement for clarity
    console.log(`[Supabase Query Run] UPDATE profiles SET brand_color = '${newColor}' WHERE id = '${currentProfile.id}'`);
    
    // Dynamically update simulated DB profiles state
    if (userRole === 'client') {
      currentProfile.brand_color = newColor;
    }
  };

  // Sync profile & variables whenever the role is changed
  const setUserRole = (role: UserRole) => {
    setUserRoleState(role);
    localStorage.setItem('sydney_user_role', role);
    
    if (role === 'admin') {
      setCurrentProfile(MOCK_ADMIN);
      // Restore Admin preference
      setBrandColorState('#6366f1');
    } else {
      // Restore Client preference
      const clientProfile = selectedClient;
      setCurrentProfile(clientProfile);
      setBrandColorState(clientProfile.brand_color || '#06b6d4');
    }
    setActiveTab('overview');
  };

  // Sync chosen client
  const changeSelectedClient = (client: Profile) => {
    setSelectedClient(client);
    localStorage.setItem('sydney_active_client_id', client.id);
    if (userRole === 'client') {
      setCurrentProfile(client);
      setBrandColorState(client.brand_color || '#06b6d4');
    }
  };

  return (
    <PortalContext.Provider value={{
      userRole,
      setUserRole,
      currentProfile,
      setCurrentProfile,
      selectedClient,
      setSelectedClient: changeSelectedClient,
      brandColor,
      setBrandColor: updateBrandColor,
      tasks,
      setTasks,
      files,
      setFiles,
      messages,
      setMessages,
      invoices,
      setInvoices,
      activeTab,
      setActiveTab,
    }}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return context;
}
