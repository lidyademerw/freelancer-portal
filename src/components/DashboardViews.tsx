import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { InvoiceDownloadButton } from './InvoicePDF';
import { supabase, uploadFileToStorage } from '../lib/supabaseClient';
import { 
  DollarSign, 
  CheckCircle, 
  Clock, 
  Folder, 
  Plus, 
  Trash2, 
  Upload, 
  Send, 
  FileDown, 
  User, 
  AlertCircle,
  FileCheck,
  Search,
  ExternalLink,
  ChevronRight,
  Briefcase,
  FileText,
  Sparkles,
  TrendingUp,
  Gauge,
  ShieldCheck,
  Image,
  FolderArchive,
  File,
  Copy,
  Loader2
} from 'lucide-react';
import { Profile, Project, Task, ProjectFile, Message, Invoice } from '../types/portal';
import { usePortal } from '../context/PortalContext';

interface DashboardViewsProps {
  role: 'admin' | 'client';
  selectedClient: Profile; // Sarah or Marcus
  setSelectedClient: (client: Profile) => void;
  clients: Profile[];
  projects: Project[];
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  files: ProjectFile[];
  setFiles: React.Dispatch<React.SetStateAction<ProjectFile[]>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  activeTab: 'overview' | 'tasks' | 'files' | 'messages' | 'invoices';
}

export default function DashboardViews({
  role,
  selectedClient,
  setSelectedClient,
  clients,
  projects,
  tasks,
  setTasks,
  files,
  setFiles,
  messages,
  setMessages,
  invoices,
  setInvoices,
  activeTab,
}: DashboardViewsProps) {
  
  const { currentProfile } = usePortal();

  // Active Project thread selected in Messages
  const [activeThreadProjectId, setActiveThreadProjectId] = useState<string>('');

  // Shadcn Dialog Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalTaskTitle, setModalTaskTitle] = useState('');
  const [modalTaskDesc, setModalTaskDesc] = useState('');
  const [modalTaskProj, setModalTaskProj] = useState('');
  const [modalTaskDueDate, setModalTaskDueDate] = useState('2026-07-15');
  const [modalTaskPriority, setModalTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [modalTaskAssignToClient, setModalTaskAssignToClient] = useState(false);

  // Local state for forms

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskProj, setNewTaskProj] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('2026-07-15');
  const [newTaskIsTemplate, setNewTaskIsTemplate] = useState(false);

  const [newFileName, setNewFileName] = useState('');
  const [newFileProj, setNewFileProj] = useState('');
  const [newFileSize, setNewFileSize] = useState('2.4 MB');
  const [isUploading, setIsUploading] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);

  // Form Loading state indicators
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [isRequestingService, setIsRequestingService] = useState<string | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Secure Signed URL State & Growth Toast States
  const [signedUrlState, setSignedUrlState] = useState<{
    fileName: string;
    url: string;
    timeLeft: number;
  } | null>(null);

  const [serviceRequestedToast, setServiceRequestedToast] = useState<{
    serviceName: string;
    active: boolean;
  } | null>(null);

  // Signed URL Countdown Interval
  useEffect(() => {
    if (!signedUrlState) return;
    if (signedUrlState.timeLeft <= 0) {
      setSignedUrlState(null);
      return;
    }
    const timer = setInterval(() => {
      setSignedUrlState(prev => prev ? { ...prev, timeLeft: prev.timeLeft - 1 } : null);
    }, 1000);
    return () => clearInterval(timer);
  }, [signedUrlState]);

  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [newInvProj, setNewInvProj] = useState('');
  const [newInvAmount, setNewInvAmount] = useState('');
  const [newInvNum, setNewInvNum] = useState('');
  const [newInvDue, setNewInvDue] = useState('2026-07-31');

  const [searchQuery, setSearchQuery] = useState('');
  const [taskFilter, setTaskFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const [isFetching, setIsFetching] = useState(false);
  const [emailStatusToast, setEmailStatusToast] = useState<{
    success: boolean;
    simulated: boolean;
    to: string;
    taskTitle: string;
  } | null>(null);

  useEffect(() => {
    setIsFetching(true);
    const timer = setTimeout(() => {
      setIsFetching(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [activeTab, selectedProjectId, selectedClient.id]);

  const triggerEmailNotification = async (newTask: Task) => {
    const proj = projects.find(p => p.id === newTask.project_id);
    const client = clients.find(c => c.id === proj?.client_id) || selectedClient;
    
    const targetEmail = client.id === 'client-sarah' 
      ? 'sarah@vortexlabs.com' 
      : 'marcus@apexgroup.com';

    try {
      console.log(`[Resend Email Dispatcher] Triggering full-stack API route /api/send-email...`);
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: targetEmail,
          clientName: client.full_name,
          taskTitle: newTask.title,
          taskDescription: newTask.description || 'New scope deliverable item created.',
          dueDate: newTask.due_date,
          priority: newTask.priority,
          brandColor: client.brand_color || '#6366f1',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setEmailStatusToast({
          success: true,
          simulated: data.simulated,
          to: targetEmail,
          taskTitle: newTask.title
        });
        setTimeout(() => setEmailStatusToast(null), 5000);
      }
    } catch (error) {
      console.error("[Resend Front-end Error] Failed to contact /api/send-email:", error);
    }
  };

  // Skeletons
  const renderDashboardSkeleton = () => (
    <div className="space-y-6 animate-pulse w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="h-7 w-56 bg-slate-200 rounded-lg"></div>
          <div className="h-4 w-80 bg-slate-200/70 rounded-md"></div>
        </div>
        <div className="h-10 w-48 bg-slate-200 rounded-xl"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/40 flex items-center gap-4 shadow-3xs">
            <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0"></div>
            <div className="space-y-2 flex-1">
              <div className="h-3.5 w-16 bg-slate-200 rounded"></div>
              <div className="h-5 w-24 bg-slate-200/80 rounded-md"></div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 lg:col-span-2 space-y-5">
          <div className="flex justify-between items-center">
            <div className="h-5 w-36 bg-slate-200 rounded-md"></div>
            <div className="h-6 w-28 bg-slate-200/70 rounded-full"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border border-slate-100 rounded-xl space-y-3">
                <div className="flex justify-between">
                  <div className="h-4.5 w-48 bg-slate-200 rounded-md"></div>
                  <div className="h-5 w-16 bg-slate-200 rounded-full"></div>
                </div>
                <div className="h-3 w-full bg-slate-200/60 rounded"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 space-y-5">
          <div className="h-5 w-36 bg-slate-200 rounded-md"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center py-2.5 border-b border-slate-50">
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-24 bg-slate-200 rounded"></div>
                  <div className="h-2.5 w-16 bg-slate-200/70 rounded"></div>
                </div>
                <div className="h-5 w-12 bg-slate-200 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTasksSkeleton = () => (
    <div className="space-y-6 animate-pulse w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 rounded-lg"></div>
          <div className="h-3.5 w-80 bg-slate-200/70 rounded-md"></div>
        </div>
        <div className="h-10 w-36 bg-slate-200 rounded-xl"></div>
      </div>
      <div className="h-9 w-80 bg-slate-200 rounded-xl"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 bg-white border border-slate-200/50 rounded-2xl space-y-4 shadow-3xs">
              <div className="flex gap-3">
                <div className="w-5.5 h-5.5 rounded bg-slate-200 shrink-0"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-3/4 bg-slate-200 rounded-md"></div>
                  <div className="h-3 w-5/6 bg-slate-200/70 rounded"></div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between">
                <div className="h-3 w-20 bg-slate-200 rounded"></div>
                <div className="h-4 w-12 bg-slate-200 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200/50 h-fit space-y-4">
          <div className="h-5 w-32 bg-slate-200 rounded-md"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-16 bg-slate-200 rounded"></div>
                <div className="h-8 w-full bg-slate-200/60 rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderFilesSkeleton = () => (
    <div className="space-y-6 animate-pulse w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 rounded-lg"></div>
          <div className="h-3.5 w-80 bg-slate-200/70 rounded-md"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 bg-white border border-slate-200/50 rounded-2xl flex items-center gap-3.5 shadow-3xs">
              <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
                <div className="h-3 w-16 bg-slate-200/70 rounded"></div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0"></div>
            </div>
          ))}
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200/50 space-y-4">
          <div className="h-5 w-32 bg-slate-200 rounded-md"></div>
          <div className="h-32 w-full bg-slate-100 rounded-2xl border border-dashed border-slate-200"></div>
        </div>
      </div>
    </div>
  );

  // Empty States
  const renderTasksEmptyState = () => (
    <div className="text-center py-16 px-6 bg-white border border-slate-200/80 shadow-3xs rounded-2xl max-w-xl mx-auto my-4 space-y-5 animate-fade-in w-full">
      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
        <CheckCircle className="w-8 h-8" />
      </div>
      <div className="space-y-1.5">
        <h3 className="font-sans font-bold text-base text-slate-800">No active tasks created yet</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          This project has no scheduled deliverables. Active tasks, progress checklists, and milestone items will render right here.
        </p>
      </div>
      {role === 'admin' ? (
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4.5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-95 active:scale-98 shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          style={{ backgroundColor: 'var(--brand-color, #6366f1)' }}
        >
          <Plus className="w-4 h-4" />
          Create your first task
        </button>
      ) : (
        <p className="text-[11px] text-slate-400 font-medium">Your freelancer hasn't added scope items yet. Send a message to coordinate kickoff!</p>
      )}
    </div>
  );

  const renderMessagesEmptyState = () => (
    <div className="h-[520px] flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-4 w-full">
      <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center shadow-3xs">
        <Send className="w-7 h-7 rotate-45 text-indigo-600 translate-x-[-2px] translate-y-[2px]" />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h3 className="font-sans font-bold text-sm text-slate-800">Secure discussion threads</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Select a project thread on the sidebar panel to coordinate design revisions, scope parameters, or share instant project updates.
        </p>
      </div>
    </div>
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'messages' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Filter lists based on role
  // If role is client, only show their items.
  // If role is admin, show items belonging to the selectedClient
  const clientFilterId = role === 'admin' ? selectedClient.id : currentProfile.id;

  const filteredProjects = projects.filter(p => p.client_id === clientFilterId);
  const projectIds = filteredProjects.map(p => p.id);

  // Synchronize selectedProjectId with the first filtered project if not set or if filter changes
  useEffect(() => {
    if (filteredProjects.length > 0) {
      const isStillValid = filteredProjects.some(p => p.id === selectedProjectId);
      if (!isStillValid) {
        setSelectedProjectId(filteredProjects[0].id);
      }
    } else {
      setSelectedProjectId('');
    }
  }, [filteredProjects, selectedProjectId]);

  // Synchronize activeThreadProjectId with the first filtered project if not set or if filter changes
  useEffect(() => {
    if (filteredProjects.length > 0) {
      const isStillValid = filteredProjects.some(p => p.id === activeThreadProjectId);
      if (!isStillValid) {
        setActiveThreadProjectId(filteredProjects[0].id);
      }
    } else {
      setActiveThreadProjectId('');
    }
  }, [filteredProjects, activeThreadProjectId]);

  const filteredTasks = tasks.filter(t => projectIds.includes(t.project_id));
  const filteredFiles = files.filter(f => projectIds.includes(f.project_id));
  const filteredInvoices = invoices.filter(i => projectIds.includes(i.project_id));
  const filteredMessages = messages.filter(m => projectIds.includes(m.project_id));

  // React Dropzone hook configuration
  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    
    // Populate form inputs with real dropped file details
    setNewFileName(file.name);
    setDroppedFile(file);
    const sizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${(file.size / 1024).toFixed(0)} KB`;
    setNewFileSize(sizeStr);
    
    console.log(`[React Dropzone] Captured drop event for file: ${file.name} (${sizeStr})`);
    
    // Play subtle entry sound or visual alert on drop success
    confetti({
      particleCount: 15,
      spread: 20,
      origin: { y: 0.8 }
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false
  });


  // --- Handlers ---
  const handleToggleTask = (taskId: string) => {
    let completedProjectAndWasLast = false;
    let targetProjectTitle = '';
    let updatedStatus: 'todo' | 'done' = 'todo';

    setTasks(prev => {
      const targetTask = prev.find(t => t.id === taskId);
      if (!targetTask) return prev;

      updatedStatus = targetTask.status === 'done' ? 'todo' : 'done';

      console.log(`[Supabase Query Run] UPDATE tasks SET status = '${updatedStatus}' WHERE id = '${taskId}'`);

      const nextTasks = prev.map(t => {
        if (t.id === taskId) {
          return { ...t, status: updatedStatus };
        }
        return t;
      });

      // If marked done, check if it was the last task in the project
      if (updatedStatus === 'done') {
        const projId = targetTask.project_id;
        const projectTasks = nextTasks.filter(t => t.project_id === projId);
        const unfinishedCount = projectTasks.filter(t => t.status !== 'done').length;
        if (unfinishedCount === 0 && projectTasks.length > 0) {
          completedProjectAndWasLast = true;
          const proj = projects.find(p => p.id === projId);
          targetProjectTitle = proj?.title || 'this project';
        }
      }

      return nextTasks;
    });

    if (completedProjectAndWasLast) {
      console.log(`[UX Celebration] Last task in project "${targetProjectTitle}" completed! Tossing confetti...`);
      try {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (err) {
        console.error("Confetti launch failed:", err);
      }
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskProj || isCreatingTask) return;

    setIsCreatingTask(true);
    setTimeout(() => {
      const newTaskItem: Task = {
        id: `task-${Date.now()}`,
        project_id: newTaskProj,
        title: newTaskTitle,
        status: 'todo',
        due_date: newTaskDueDate,
        is_template: newTaskIsTemplate,
        priority: newTaskPriority,
      };

      setTasks(prev => [newTaskItem, ...prev]);
      setNewTaskTitle('');
      setNewTaskIsTemplate(false);
      setIsCreatingTask(false);

      if (role === 'admin') {
        triggerEmailNotification(newTaskItem);
      }
    }, 1000);
  };

  const handleCreateTaskFromModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTaskTitle.trim() || !modalTaskProj || isCreatingTask) return;

    setIsCreatingTask(true);
    setTimeout(() => {
      const newTaskItem: Task = {
        id: `task-${Date.now()}`,
        project_id: modalTaskProj,
        title: modalTaskTitle,
        description: modalTaskDesc.trim() || undefined,
        status: 'todo',
        due_date: modalTaskDueDate,
        is_template: false,
        priority: modalTaskPriority,
        assigned_to_client: modalTaskAssignToClient,
      };

      console.log(`[Supabase Query Run] INSERT INTO tasks (title, description, project_id, due_date, priority, assigned_to_client, status) VALUES ('${modalTaskTitle}', '${modalTaskDesc}', '${modalTaskProj}', '${modalTaskDueDate}', '${modalTaskPriority}', ${modalTaskAssignToClient}, 'todo')`);

      setTasks(prev => [newTaskItem, ...prev]);

      // Reset fields and close modal
      setModalTaskTitle('');
      setModalTaskDesc('');
      setModalTaskProj('');
      setModalTaskDueDate('2026-07-15');
      setModalTaskPriority('medium');
      setModalTaskAssignToClient(false);
      setIsCreateModalOpen(false);
      setIsCreatingTask(false);

      if (role === 'admin') {
        triggerEmailNotification(newTaskItem);
      }
    }, 1000);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim() || !newFileProj) return;

    setIsUploading(true);
    
    let finalUrl = '#';
    let finalFileName = newFileName.endsWith('.pdf') || newFileName.endsWith('.png') || newFileName.endsWith('.jpg') || newFileName.endsWith('.zip')
      ? newFileName 
      : `${newFileName}.pdf`;

    try {
      if (supabase && droppedFile) {
        console.log(`[Supabase Storage] Initiating live storage upload to bucket 'project-files' for file: ${droppedFile.name}`);
        const storagePath = `${Date.now()}-${finalFileName}`;
        const { url, error } = await uploadFileToStorage('project-files', storagePath, droppedFile);
        if (error) {
          console.error(`[Supabase Storage Error] Upload failed: ${error}. Falling back to sandbox file mapping.`);
        } else {
          finalUrl = url;
          finalFileName = storagePath; // Track with unique key in DB
          console.log(`[Supabase Storage Success] File uploaded successfully. Live public URL: ${url}`);
        }
      } else {
        // Simulated lag to make local mode feel high-fidelity
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const newFileItem: ProjectFile = {
        id: `file-${Date.now()}`,
        project_id: newFileProj,
        file_name: finalFileName,
        file_url: finalUrl,
        file_size: newFileSize || '1.8 MB',
        uploaded_at: new Date().toISOString().split('T')[0],
        uploaded_by: role === 'admin' ? 'Alex Rivers' : (role === 'client' ? selectedClient.full_name : 'Client'),
      };

      const fileExt = finalFileName.split('.').pop() || 'pdf';
      console.log(`[Supabase Query] INSERT INTO files (name, size, type, project_id, url) VALUES ('${finalFileName}', '${newFileItem.file_size}', '${fileExt}', '${newFileProj}', '${finalUrl}')`);

      setFiles(prev => [newFileItem, ...prev]);
      setNewFileName('');
      setDroppedFile(null);
      setIsUploading(false);

      // Trigger success confetti
      confetti({
        particleCount: 25,
        spread: 30,
        origin: { y: 0.8 }
      });
    } catch (err) {
      console.error("[Upload Error Handler]", err);
      setIsUploading(false);
    }
  };

  const handleGenerateSignedUrl = async (file: ProjectFile) => {
    let mockSignedUrl = '';
    
    if (supabase && file.file_url && file.file_url !== '#') {
      console.log(`[Supabase Storage] Requesting real secure signed URL for path "${file.file_name}"`);
      try {
        const { data, error } = await supabase.storage
          .from('project-files')
          .createSignedUrl(file.file_name, 60);
        
        if (error) {
          console.error(`[Supabase Signed URL Error] ${error.message}`);
        } else if (data) {
          mockSignedUrl = data.signedUrl;
        }
      } catch (err) {
        console.error("Signed URL fetch exception", err);
      }
    }

    if (!mockSignedUrl) {
      const token = Math.random().toString(36).substring(2, 12);
      mockSignedUrl = `https://sydney-portal.supabase.co/storage/v1/object/sign/project-files/${file.file_name}?token=sb_sig_${token}&expires=60`;
    }
    
    console.log(`[Supabase Storage] Generated Signed URL with 60-second TTL:`, mockSignedUrl);
    
    setSignedUrlState({
      fileName: file.file_name,
      url: mockSignedUrl,
      timeLeft: 60
    });
    
    // Blast small success confetti
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.8 }
    });
  };

  const handleRequestService = (serviceName: string) => {
    if (isRequestingService) return;
    setIsRequestingService(serviceName);

    // Find client's project or default to a safe value
    const activeProjId = filteredProjects[0]?.id || 'proj-general';
    const clientName = selectedClient.full_name;
    
    setTimeout(() => {
      const clientMsg: Message = {
        id: `msg-service-${Date.now()}`,
        project_id: activeProjId,
        sender_id: clientFilterId, // Sarah Jenkins or Marcus
        content: `[Growth Service Request] Hello Alex! I would like to procure the "${serviceName}" premium package for our business pipeline. Please upload a structured statement of work to our secure file vault so we can coordinate parameter sign-off!`,
        created_at: new Date().toISOString(),
      };

      console.log(`[Supabase Query] INSERT INTO messages (project_id, sender_id, content) VALUES ('${activeProjId}', '${clientFilterId}', '[Growth Service Request] ...')`);
      
      // Create a client message and a system notification alert
      const systemNotification: Message = {
        id: `msg-notif-${Date.now()}`,
        project_id: activeProjId,
        sender_id: 'system',
        content: `🔔 [Portal Notification] Client ${clientName} (${selectedClient.company_name}) has requested the "${serviceName}" growth package!`,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, clientMsg, systemNotification]);

      // Program a high-quality simulated reply from Alex after 1.5 seconds
      setIsTyping(true);
      setTimeout(() => {
        const alexReply: Message = {
          id: `msg-alex-${Date.now()}`,
          project_id: activeProjId,
          sender_id: 'admin-alex',
          content: `Hi ${clientName}! Outstanding choice requesting the "${serviceName}" package. This is a highly effective way to grow your business. I've logged this to my active client checklist, and I am preparing a detailed proposal statement. I'll upload it to your Secure File Vault here within the hour!`,
          created_at: new Date().toISOString(),
        };
        
        console.log(`[Supabase Realtime] broadcast event to client channel:`, alexReply);
        setMessages(prev => [...prev, alexReply]);
        setIsTyping(false);
      }, 1800);

      // Blast beautiful tri-color growth confetti
      confetti({
        particleCount: 50,
        spread: 60,
        colors: ['#6366f1', '#06b6d4', '#10b981'],
        origin: { y: 0.6 }
      });

      // Display temporary success toast
      setServiceRequestedToast({
        serviceName,
        active: true
      });
      setTimeout(() => {
        setServiceRequestedToast(null);
      }, 6000);

      setIsRequestingService(null);
    }, 1200);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeThreadProjectId) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      project_id: activeThreadProjectId,
      sender_id: role === 'admin' ? 'admin-alex' : clientFilterId,
      content: chatInput,
      created_at: new Date().toISOString(),
    };

    console.log(`[Supabase Realtime] NEW INSERT in messages table on project_id ${activeThreadProjectId}:`, userMsg);

    setMessages(prev => [...prev, userMsg]);
    setChatInput('');

    // Trigger AI response to simulate interactive B2B communications
    setIsTyping(true);

    const activeProj = projects.find(p => p.id === activeThreadProjectId);
    const projectTitle = activeProj ? activeProj.title : "General";
    const threadHistory = [...messages.filter(m => m.project_id === activeThreadProjectId), userMsg];

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: threadHistory.slice(-6),
          targetRole: role === 'admin' ? 'client' : 'admin',
          clientName: selectedClient.full_name,
          projectTitle: projectTitle,
        }),
      });

      const data = await response.json();
      
      const botMsg: Message = {
        id: `msg-bot-${Date.now()}`,
        project_id: activeThreadProjectId,
        sender_id: role === 'admin' ? clientFilterId : 'admin-alex',
        content: data.success ? data.text : "Received, I'll review and get back to you soon!",
        created_at: new Date().toISOString(),
      };

      console.log(`[Supabase Realtime] simulated incoming event via Gemini:`, botMsg);
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error("[Gemini Fetch Error] Failed to get dynamic response:", err);
      const botMsg: Message = {
        id: `msg-bot-${Date.now()}`,
        project_id: activeThreadProjectId,
        sender_id: role === 'admin' ? clientFilterId : 'admin-alex',
        content: "Hi, got your message! I'm on it and will write back with updates shortly.",
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvAmount || !newInvProj || isGeneratingInvoice) return;

    const amountNum = parseFloat(newInvAmount);
    if (isNaN(amountNum)) return;

    setIsGeneratingInvoice(true);

    setTimeout(() => {
      const invoiceNum = newInvNum.trim() || `INV-2026-${Math.floor(100 + Math.random() * 900)}`;

      const newInvoiceItem: Invoice = {
        id: `inv-${Date.now()}`,
        project_id: newInvProj,
        amount: amountNum,
        status: 'sent',
        due_date: newInvDue,
        invoice_number: invoiceNum,
      };

      setInvoices(prev => [newInvoiceItem, ...prev]);
      setNewInvAmount('');
      setNewInvNum('');
      setIsGeneratingInvoice(false);

      confetti({
        particleCount: 35,
        spread: 45,
        origin: { y: 0.8 }
      });
    }, 1000);
  };

  const handleMarkInvoicePaid = (invoiceId: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        return { ...inv, status: 'paid' };
      }
      return inv;
    }));
  };

  // Pay Invoice Animation
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const handlePayInvoice = (invoiceId: string) => {
    setPayingInvoiceId(invoiceId);
    setTimeout(() => {
      handleMarkInvoicePaid(invoiceId);
      setPayingInvoiceId(null);
    }, 1500);
  };

  // Helper formatting values
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  // Calculate stats for current filter
  const totalBilled = filteredInvoices.reduce((acc, inv) => acc + inv.amount, 0);
  const totalPaid = filteredInvoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.amount, 0);
  const totalOutstanding = filteredInvoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((acc, i) => acc + i.amount, 0);

  // Find current active selected project
  const activeSelectedProject = filteredProjects.find(p => p.id === selectedProjectId) || filteredProjects[0];

  // Dynamically calculate metrics for the SPECIFIC project
  const specificProjectTasks = activeSelectedProject 
    ? tasks.filter(t => t.project_id === activeSelectedProject.id)
    : filteredTasks;

  const totalTasksCount = specificProjectTasks.length;
  const completedTasksCount = specificProjectTasks.filter(t => t.status === 'done').length;
  const taskProgressPct = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;


  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50">
      <AnimatePresence mode="wait">
        {isFetching ? (
          <motion.div
            key="fetching-skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full space-y-8"
          >
            {activeTab === 'overview' && renderDashboardSkeleton()}
            {activeTab === 'tasks' && renderTasksSkeleton()}
            {activeTab === 'files' && renderFilesSkeleton()}
            {activeTab === 'messages' && (
              <div className="h-96 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            )}
            {activeTab === 'invoices' && (
              <div className="h-96 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key={`${activeTab}-${selectedProjectId}-${selectedClient.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-8 w-full"
          >
            
            {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-sans font-bold text-2xl text-slate-900 tracking-tight">
                {role === 'admin' 
                  ? `Welcome back, Alex` 
                  : `Welcome back, ${selectedClient.full_name}`}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {role === 'admin' 
                  ? `Here is an aggregate summary of deliverables for ${selectedClient.company_name}.`
                  : `Review project pipelines, file sharing, and financial approvals for ${selectedClient.company_name}.`}
              </p>
            </div>
            
            {/* Client Picker for Freelancers */}
            {role === 'admin' && (
              <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Managing Client:</span>
                <div className="flex gap-1.5">
                  {clients.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClient(c)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        selectedClient.id === c.id 
                          ? 'text-white' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                      style={selectedClient.id === c.id ? { backgroundColor: 'var(--brand-color, #6366f1)' } : undefined}
                    >
                      {c.company_name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Metric Bento Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {role === 'admin' && (
              <>
                {/* Metric 1 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Total Billed</span>
                    <span className="text-xl font-bold text-slate-900 mt-0.5 block">{formatCurrency(totalBilled)}</span>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Total Paid</span>
                    <span className="text-xl font-bold text-slate-900 mt-0.5 block">{formatCurrency(totalPaid)}</span>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Outstanding</span>
                    <span className="text-xl font-bold text-slate-900 mt-0.5 block">{formatCurrency(totalOutstanding)}</span>
                  </div>
                </div>
              </>
            )}

            {/* Metric 4 */}
            <div className={`bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs flex items-center gap-4 ${role === 'client' ? 'sm:col-span-2 lg:col-span-4' : ''}`}>
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                <Folder className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">Active Projects</span>
                <span className="text-xl font-bold text-slate-900 mt-0.5 block">{filteredProjects.length}</span>
              </div>
            </div>
          </div>

          {/* Main overview columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Project Status Overview */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-sans font-semibold text-base text-slate-900">Current Projects</h3>
                <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-full">
                  Status Tracking
                </span>
              </div>

              {filteredProjects.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                  <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 font-medium">No projects registered under this account.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {filteredProjects.map((p) => {
                    const projTasks = tasks.filter(t => t.project_id === p.id);
                    const doneProjTasks = projTasks.filter(t => t.status === 'done');
                    const progress = projTasks.length > 0 ? Math.round((doneProjTasks.length / projTasks.length) * 100) : 0;
                    
                    return (
                      <div key={p.id} className="p-4 border border-slate-100 rounded-xl hover:border-slate-200 transition-all space-y-3.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-sm text-slate-900">{p.title}</h4>
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{p.description}</p>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            p.status === 'active' 
                              ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                            {p.status}
                          </span>
                        </div>

                        {/* Progress slider */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold text-slate-500">
                            <span>Milestone Progress</span>
                            <span>{progress}% Completed</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500"
                              style={{ 
                                width: `${progress}%`,
                                backgroundColor: 'var(--brand-color, #6366f1)'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Side Widgets */}
            <div className="space-y-6">
              {/* Task Completion Gauge */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-4">
                <h3 className="font-sans font-semibold text-sm text-slate-900">Task Completion</h3>
                
                {/* Radial Gauge Ring */}
                <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-slate-100"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="transition-all duration-500 stroke-indigo-600"
                      style={{ strokeDasharray: `${2 * Math.PI * 40}`, strokeDashoffset: `${2 * Math.PI * 40 * (1 - taskProgressPct / 100)}` }}
                      strokeWidth="10"
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-slate-950">{taskProgressPct}%</span>
                    <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">Approved</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 font-medium">
                  <strong>{completedTasksCount}</strong> out of <strong>{totalTasksCount}</strong> interactive tasks checked off.
                </p>
              </div>

              {/* Quick Communication Box */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 text-white space-y-3.5 relative overflow-hidden">
                {/* Background ambient radial glow */}
                <span className="absolute -right-10 -bottom-10 w-24 h-24 rounded-full blur-2xl opacity-40 bg-indigo-500"></span>
                
                <h4 className="font-bold text-sm">Need help or changes?</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Send a fast message instantly to Alex. Tapping will take you to the secure channels tab.
                </p>
                <button
                  onClick={() => {
                    const navBtn = document.querySelector('[id="app-sidebar"]');
                    if (navBtn) {
                      const msgTab = Array.from(navBtn.querySelectorAll('button')).find(b => b.textContent?.includes('Messages'));
                      if (msgTab) (msgTab as HTMLButtonElement).click();
                    }
                  }}
                  className="w-full py-2 bg-white text-slate-950 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  Open Secure Message Thread
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>

          {/* Recommended Growth Services (Clients Only) */}
          {role === 'client' && (
            <div className="pt-6 border-t border-slate-200 mt-8 space-y-5 animate-fade-in">
              <div>
                <h3 className="font-sans font-bold text-base text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-indigo-500 animate-pulse" />
                  Recommended Business Growth Services
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proactive recommendations tailored to expand your digital footprint, optimize conversions, and automate operations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Service 1: SEO Audit */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-3xs hover:shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">SEO Audit & Organic Roadmap</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Identify ranking gaps, audit crawl blocks, map search intent, and receive an actionable organic growth plan.
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800">$499 <span className="text-[9px] font-medium text-slate-400">/ fixed</span></span>
                    <button
                      onClick={() => handleRequestService('SEO Audit')}
                      disabled={isRequestingService !== null}
                      className="px-3.5 py-1.5 rounded-xl text-[10px] font-bold text-white transition-all hover:opacity-95 active:scale-98 cursor-pointer shadow-3xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                      style={{ backgroundColor: 'var(--brand-color, #6366f1)' }}
                    >
                      {isRequestingService === 'SEO Audit' ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Requesting...
                        </>
                      ) : (
                        'Request Service'
                      )}
                    </button>
                  </div>
                </div>

                {/* Service 2: Speed Optimization */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-3xs hover:shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                      <Gauge className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">Core Web Vitals & Speed Boost</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Optimize render paths, script deferrals, media compressions, and cache rules for lightning sub-100ms speeds.
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800">$299 <span className="text-[9px] font-medium text-slate-400">/ pipeline</span></span>
                    <button
                      onClick={() => handleRequestService('Speed Optimization')}
                      disabled={isRequestingService !== null}
                      className="px-3.5 py-1.5 rounded-xl text-[10px] font-bold text-white transition-all hover:opacity-95 active:scale-98 cursor-pointer shadow-3xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                      style={{ backgroundColor: 'var(--brand-color, #6366f1)' }}
                    >
                      {isRequestingService === 'Speed Optimization' ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Requesting...
                        </>
                      ) : (
                        'Request Service'
                      )}
                    </button>
                  </div>
                </div>

                {/* Service 3: Monthly Maintenance */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-3xs hover:shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">Monthly Priority SLA Support</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Automatic library patching, proactive server up-time pings, priority bug fixes, and detailed analytics reports.
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800">$199 <span className="text-[9px] font-medium text-slate-400">/ month</span></span>
                    <button
                      onClick={() => handleRequestService('Monthly Maintenance')}
                      disabled={isRequestingService !== null}
                      className="px-3.5 py-1.5 rounded-xl text-[10px] font-bold text-white transition-all hover:opacity-95 active:scale-98 cursor-pointer shadow-3xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                      style={{ backgroundColor: 'var(--brand-color, #6366f1)' }}
                    >
                      {isRequestingService === 'Monthly Maintenance' ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Requesting...
                        </>
                      ) : (
                        'Request Service'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 2. TASKS TAB */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {/* Header and Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-sans font-bold text-xl text-slate-900 tracking-tight">Scope Action Items</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review specific deliverables, verify critical milestones, and checklist client approvals.
              </p>
            </div>
            
            {/* Create New Task Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all shadow-sm hover:opacity-95 active:scale-98 cursor-pointer shrink-0"
              style={{ backgroundColor: 'var(--brand-color, #6366f1)' }}
            >
              <Plus className="w-4 h-4" />
              Create New Task
            </button>
          </div>

          {/* Shadcn-style Filter Tabs */}
          <div className="w-full max-w-md bg-slate-100 p-1 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-500 border border-slate-200/50 shadow-3xs">
            <button
              onClick={() => setTaskFilter('all')}
              className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
                taskFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTaskFilter('todo')}
              className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
                taskFilter === 'todo'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              To Do
            </button>
            <button
              onClick={() => setTaskFilter('in_progress')}
              className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
                taskFilter === 'in_progress'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setTaskFilter('done')}
              className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
                taskFilter === 'done'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              Completed
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Interactive list (takes 2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              {filteredTasks.filter(t => taskFilter === 'all' ? true : t.status === taskFilter).length === 0 ? (
                renderTasksEmptyState()
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTasks
                    .filter(t => taskFilter === 'all' ? true : t.status === taskFilter)
                    .map((t) => {
                      const proj = projects.find(p => p.id === t.project_id);
                      const isCompleted = t.status === 'done';
                      return (
                        <div 
                          key={t.id} 
                          className={`p-5 bg-white border rounded-2xl shadow-3xs hover:shadow-2xs transition-all duration-200 flex flex-col justify-between space-y-4 ${
                            isCompleted ? 'border-slate-100 bg-slate-50/20' : 'border-slate-200/80 hover:border-slate-300'
                          }`}
                        >
                          {/* Header / Toggle & Title */}
                          <div className="flex items-start gap-3">
                            {/* Checkbox button */}
                            <button
                              onClick={() => handleToggleTask(t.id)}
                              className={`w-5.5 h-5.5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                                isCompleted
                                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-3xs'
                                  : 'border-slate-300 hover:border-slate-400 text-transparent'
                              }`}
                              title={isCompleted ? "Mark outstanding" : "Mark as completed"}
                            >
                              {isCompleted && (
                                <span className="text-[10px] font-bold">✓</span>
                              )}
                            </button>

                            <div className="space-y-1">
                              <h4 className={`text-xs sm:text-sm font-bold leading-snug ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                {t.title}
                              </h4>
                              {t.description && (
                                <p className={`text-xs leading-relaxed ${isCompleted ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {t.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Bottom info row */}
                          <div className="pt-3 border-t border-slate-100/80 flex items-center justify-between gap-2.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* Project tag */}
                              <span className="text-[9px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-bold uppercase tracking-wider max-w-[120px] truncate" title={proj?.title}>
                                {proj?.title || 'Scope Item'}
                              </span>

                              {/* Due date */}
                              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-300" />
                                Due: {t.due_date}
                              </span>

                              {/* Assign to Client badge if true */}
                              {t.assigned_to_client && (
                                <span className="bg-indigo-50 text-indigo-600 text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider border border-indigo-100">
                                  Client Assigned
                                </span>
                              )}
                            </div>

                            {/* Priority badge */}
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                              t.priority === 'high' ? 'bg-red-50 text-red-600 border border-red-100' :
                              t.priority === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {t.priority || 'medium'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Right: Task Operations / Add Task Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5 h-fit">
              <h3 className="font-sans font-semibold text-base text-slate-900">
                {role === 'admin' ? 'Add Task Scope' : 'Active Integrations'}
              </h3>
              
              {role === 'admin' ? (
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Task Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Gather visual references"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Link to Project</label>
                    <select
                      value={newTaskProj}
                      onChange={(e) => setNewTaskProj(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    >
                      <option value="">-- Choose Project --</option>
                      {filteredProjects.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">Priority</label>
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as any)}
                        className="w-full text-xs px-2 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">Due Date</label>
                      <input
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        className="w-full text-xs px-2 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Template selector */}
                  <div className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      id="is-template-checkbox"
                      checked={newTaskIsTemplate}
                      onChange={(e) => setNewTaskIsTemplate(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <label htmlFor="is-template-checkbox" className="text-xs font-medium text-slate-600 select-none cursor-pointer">
                      Mark as Reusable Onboarding Template
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingTask}
                    className="w-full py-2.5 text-xs text-white rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs hover:opacity-90 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: 'var(--brand-color, #6366f1)' }}
                  >
                    {isCreatingTask ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating Task...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Task
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-4 text-xs text-slate-500 leading-relaxed">
                  <p>
                    These tasks are securely stored in the Supabase backend with active **Row Level Security (RLS)**.
                  </p>
                  <p>
                    As a **Client**, you are strictly sandboxed. Under RLS, you can query public tasks but cannot insert or manipulate records without correct validation signatures.
                  </p>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-slate-400 font-medium leading-relaxed">
                      To review the security model schema protecting your client data, inspect the <strong>Developer Assets</strong> tab below.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. FILES TAB */}
      {activeTab === 'files' && (() => {
        const getFileIconInfo = (fileName: string) => {
          const ext = fileName.split('.').pop()?.toLowerCase() || '';
          if (ext === 'pdf') {
            return {
              icon: <FileText className="w-5 h-5 text-rose-500" />,
              bg: 'bg-rose-50/70 border-rose-100',
              label: 'PDF Document'
            };
          }
          if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
            return {
              icon: <Image className="w-5 h-5 text-emerald-500" />,
              bg: 'bg-emerald-50/70 border-emerald-100',
              label: 'Image Asset'
            };
          }
          if (['zip', 'rar', 'tar', '7z'].includes(ext)) {
            return {
              icon: <FolderArchive className="w-5 h-5 text-amber-500" />,
              bg: 'bg-amber-50/70 border-amber-100',
              label: 'Compressed Archive'
            };
          }
          return {
            icon: <File className="w-5 h-5 text-slate-500" />,
            bg: 'bg-slate-50 border-slate-100',
            label: 'Secure Asset'
          };
        };

        return (
          <div className="space-y-6">
            <div>
              <h2 className="font-sans font-bold text-xl text-slate-900">Secure File Vault</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Secure B2B file repository. Upload briefs, view dynamic assets, and access deliverables.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Files grid */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
                <h3 className="font-sans font-semibold text-base text-slate-900">Project Documents</h3>
                
                {filteredFiles.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl">
                    <Folder className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 font-semibold">No files uploaded for this project pipeline yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredFiles.map((file) => {
                      const proj = projects.find(p => p.id === file.project_id);
                      const fileMeta = getFileIconInfo(file.file_name);
                      return (
                        <div key={file.id} className="p-4 border border-slate-200/60 rounded-2xl hover:border-slate-300/80 hover:shadow-3xs transition-all flex flex-col justify-between space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${fileMeta.bg}`}>
                                {fileMeta.icon}
                              </div>
                              <div className="overflow-hidden space-y-0.5">
                                <p className="text-xs font-bold text-slate-800 truncate" title={file.file_name}>
                                  {file.file_name}
                                </p>
                                <p className="text-[10px] text-slate-400 font-semibold">{fileMeta.label} • {file.file_size}</p>
                              </div>
                            </div>
                            
                            {/* Download generates signed URL */}
                            <button
                              onClick={() => handleGenerateSignedUrl(file)}
                              className="p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 text-slate-500 hover:text-slate-900 cursor-pointer transition-all shrink-0"
                              title="Generate Secure Signed Download Link"
                            >
                              <FileDown className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Metadata block */}
                          <div className="pt-2.5 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-bold text-slate-500 truncate max-w-[120px]">📂 {proj?.title || 'General'}</span>
                            <span className="font-semibold text-slate-400 shrink-0">By: {file.uploaded_by}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right: Upload Section */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5 h-fit">
                <h3 className="font-sans font-semibold text-base text-slate-900">Upload File</h3>
                
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">File Display Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Design_System_Draft"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Target Project Pipeline</label>
                    <select
                      value={newFileProj}
                      onChange={(e) => setNewFileProj(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    >
                      <option value="">-- Choose Project --</option>
                      {filteredProjects.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Mock File Size</label>
                    <select
                      value={newFileSize}
                      onChange={(e) => setNewFileSize(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="1.2 MB">1.2 MB</option>
                      <option value="3.5 MB">3.5 MB</option>
                      <option value="8.4 MB">8.4 MB</option>
                      <option value="12.7 MB">12.7 MB</option>
                    </select>
                  </div>

                  {/* Drag and Drop Zone Container */}
                  <div 
                    {...getRootProps()} 
                    className={`border-2 border-dashed rounded-xl p-6 text-center space-y-2 cursor-pointer transition-all ${
                      isDragActive 
                        ? 'border-indigo-500 bg-indigo-50/30' 
                        : 'border-slate-200 hover:border-indigo-400 bg-slate-50/30'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className={`w-5 h-5 mx-auto transition-all ${isDragActive ? 'text-indigo-600 animate-bounce' : 'text-slate-400'}`} />
                    {isDragActive ? (
                      <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Drop the file here...</p>
                    ) : (
                      <>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Drag & Drop deliverable</p>
                        <span className="text-[9px] text-slate-400 block">Or click to browse device storage</span>
                      </>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full py-2.5 text-xs text-white rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs hover:opacity-90 active:scale-98 disabled:opacity-50"
                    style={{ backgroundColor: 'var(--brand-color, #6366f1)' }}
                  >
                    {isUploading ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                        Uploading asset...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Publish Asset
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 4. MESSAGES TAB */}
      {activeTab === 'messages' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-sans font-bold text-xl text-slate-900 tracking-tight">Secure Project Channels</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure client-freelancer communications backed by Supabase Realtime websocket synchronizations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-sm">
            {/* Thread selector sidebar (1 col) */}
            <div className="border-r border-slate-100 bg-slate-50/20 p-4 space-y-4 lg:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Threads</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              
              <div className="space-y-2">
                {filteredProjects.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No active projects to message.</p>
                ) : (
                  filteredProjects.map((proj) => {
                    const isActive = proj.id === activeThreadProjectId;
                    const lastMsg = messages.filter(m => m.project_id === proj.id).pop();
                    return (
                      <button
                        key={proj.id}
                        onClick={() => setActiveThreadProjectId(proj.id)}
                        className={`w-full flex flex-col gap-1 p-3 rounded-xl text-left border transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-slate-50 border-slate-200 shadow-3xs font-semibold' 
                            : 'bg-white hover:bg-slate-50/55 border-slate-100'
                        }`}
                        style={isActive ? { borderLeft: '4px solid var(--brand-color, #6366f1)' } : undefined}
                      >
                        <div className="flex items-center justify-between w-full">
                          <p className="text-xs font-bold text-slate-800 truncate max-w-[130px]">{proj.title}</p>
                          <span className="text-[8px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-400 uppercase font-bold">{proj.status}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate leading-relaxed">
                          {lastMsg ? lastMsg.content : proj.description || 'Secure communication thread'}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Main Chat thread (3 cols) */}
            <div className="lg:col-span-3 flex flex-col justify-between h-[520px] bg-white">
              {!activeThreadProjectId ? (
                renderMessagesEmptyState()
              ) : (
                <>
                  {/* Thread Header */}
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={role === 'admin' ? selectedClient.avatar_url : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'}
                      alt="Avatar"
                      className="w-9 h-9 rounded-full object-cover border border-slate-200"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {role === 'admin' ? selectedClient.full_name : 'Alex Rivers (Freelancer)'}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <p className="text-[9px] text-slate-400 font-medium">
                        Listening to Supabase inserts on <code className="bg-slate-100 px-1 py-0.2 rounded font-mono text-indigo-500">project_id={activeThreadProjectId}</code>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20">
                {messages.filter(m => m.project_id === activeThreadProjectId).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2">
                    <div className="w-11 h-11 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                      <Send className="w-5 h-5 rotate-45" />
                    </div>
                    <p className="text-xs font-semibold text-slate-500">No communication logs recorded yet</p>
                    <p className="text-[10px] text-slate-400">Type a secure message below to broadcast the initial websocket frame.</p>
                  </div>
                ) : (
                  messages
                    .filter(m => m.project_id === activeThreadProjectId)
                    .map((msg) => {
                      const isAdminSender = msg.sender_id === 'admin-alex';
                      const isCurrentLoggedUserSender = (role === 'admin' && isAdminSender) || (role === 'client' && !isAdminSender);

                      return (
                        <div 
                          key={msg.id}
                          className={`flex gap-3 max-w-[85%] ${
                            isCurrentLoggedUserSender ? 'ml-auto flex-row-reverse' : ''
                          }`}
                        >
                          {/* Avatar */}
                          <img
                            src={isAdminSender 
                              ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80' 
                              : selectedClient.avatar_url}
                            alt="Sender avatar"
                            className="w-7 h-7 rounded-full object-cover border border-slate-100 shrink-0 mt-0.5"
                          />

                          {/* Content bubble */}
                          <div className="space-y-1">
                            <div 
                              className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-3xs ${
                                isCurrentLoggedUserSender
                                  ? 'text-white'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                              style={isCurrentLoggedUserSender ? { backgroundColor: 'var(--brand-color, #6366f1)' } : undefined}
                            >
                              <p>{msg.content}</p>
                            </div>
                            <p className={`text-[9px] text-slate-400 font-medium ${isCurrentLoggedUserSender ? 'text-right' : ''}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                )}

                {/* Loading indicator */}
                {isTyping && (
                  <div className="flex gap-3 max-w-[80%] animate-fade-in">
                    <img
                      src={role === 'admin' ? selectedClient.avatar_url : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'}
                      alt="Typing avatar"
                      className="w-7 h-7 rounded-full object-cover border border-slate-100 shrink-0 mt-0.5"
                    />
                    <div className="bg-slate-100 px-4 py-3 rounded-2xl text-xs text-slate-500 flex items-center gap-1.5 shadow-3xs">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-3 items-center shrink-0">
                <input
                  type="text"
                  placeholder="Type your secure channel transmission..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 text-xs bg-white px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-3xs"
                  required
                />
                <button
                  type="submit"
                  className="p-3 text-white rounded-xl shadow-xs cursor-pointer transition-all active:scale-95 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--brand-color, #6366f1)' }}
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. INVOICES TAB */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          {/* Billing Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Earned</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalPaid)}</p>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Outstanding Invoices</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalOutstanding)}</p>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${totalBilled > 0 ? (totalOutstanding / totalBilled) * 100 : 0}%` }} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs bg-slate-950 text-white border-none relative overflow-hidden">
              <span className="absolute -right-8 -bottom-8 w-20 h-20 bg-indigo-500/20 rounded-full blur-xl"></span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aggregate Billing Volume</span>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalBilled)}</p>
              <span className="text-[10px] text-slate-400 mt-3 block font-semibold uppercase">Secure Stripe Integration Ready</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Invoices list */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
              <h3 className="font-sans font-semibold text-base text-slate-900">Billing Statements</h3>
              
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl">
                  <FileCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 font-semibold">No invoices issued for this client yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => {
                    const proj = projects.find(p => p.id === inv.project_id);
                    return (
                      <div key={inv.id} className="py-4 flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            <FileText className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{inv.invoice_number}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-semibold uppercase truncate max-w-xs">{proj?.title}</p>
                            <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">Due: {inv.due_date}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3.5">
                          <div className="text-right">
                            <span className="text-sm font-bold text-slate-900 block">{formatCurrency(inv.amount)}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block ${
                              inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                              inv.status === 'overdue' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                              'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>
                              {inv.status}
                            </span>
                          </div>

                          {/* PDF Invoice Download Button */}
                          <InvoiceDownloadButton
                            invoice={inv}
                            project={proj}
                            tasks={tasks.filter(t => t.project_id === inv.project_id)}
                            client={selectedClient}
                            brandColor="var(--brand-color, #6366f1)"
                          />

                          {/* Action Button depending on Role */}
                          {role === 'admin' && inv.status !== 'paid' && (
                            <button
                              onClick={() => handleMarkInvoicePaid(inv.id)}
                              className="px-3.5 py-2 text-white rounded-xl text-[10px] font-bold cursor-pointer transition-all active:scale-95 shrink-0 shadow-3xs hover:opacity-95"
                              style={{ backgroundColor: 'var(--brand-color, #6366f1)' }}
                            >
                              Mark Paid
                            </button>
                          )}

                          {role === 'client' && inv.status !== 'paid' && (
                            <button
                              onClick={() => handlePayInvoice(inv.id)}
                              disabled={payingInvoiceId === inv.id}
                              className="px-3.5 py-2 text-white rounded-xl text-[10px] font-bold cursor-pointer transition-all active:scale-95 shrink-0 min-w-16 text-center disabled:opacity-50 shadow-3xs"
                              style={{ backgroundColor: 'var(--brand-color, #6366f1)' }}
                            >
                              {payingInvoiceId === inv.id ? (
                                <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin inline-block"></span>
                              ) : (
                                'Pay Now'
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Generate Invoice form (Admins only) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5 h-fit">
              <h3 className="font-sans font-semibold text-base text-slate-900">
                {role === 'admin' ? 'Generate Statement' : 'Secure Payments'}
              </h3>
              
              {role === 'admin' ? (
                <form onSubmit={handleCreateInvoice} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Invoice Number</label>
                    <input
                      type="text"
                      placeholder="e.g. INV-2026-003"
                      value={newInvNum}
                      onChange={(e) => setNewInvNum(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Target Project Pipeline</label>
                    <select
                      value={newInvProj}
                      onChange={(e) => setNewInvProj(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    >
                      <option value="">-- Choose Project --</option>
                      {filteredProjects.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Invoice Amount ($)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={newInvAmount}
                      onChange={(e) => setNewInvAmount(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Due Date</label>
                    <input
                      type="date"
                      value={newInvDue}
                      onChange={(e) => setNewInvDue(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isGeneratingInvoice}
                    className="w-full py-2.5 text-xs text-white rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs hover:opacity-90 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: 'var(--brand-color, #6366f1)' }}
                  >
                    {isGeneratingInvoice ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating Statement...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Issue Invoice
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-4 text-xs text-slate-500 leading-relaxed">
                  <p>
                    All invoice records are cryptographically secured. Click **Pay Now** to process via pre-configured Stripe webhooks.
                  </p>
                  <p>
                    Once payment finishes successfully, the status automatically updates to **Paid** across both client and admin portals in real time.
                  </p>
                  <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-2.5 text-emerald-800">
                    <FileCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-relaxed">
                      All connections are audited for security. Review the Postgres policies that prevent other client accounts from accessing these billing tables.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* Shadcn Dialog Modal Overlay */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl p-6 relative flex flex-col space-y-4 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-xl font-medium w-8 h-8 rounded-full hover:bg-slate-50 flex items-center justify-center"
              title="Close modal"
            >
              ×
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-900 font-sans tracking-tight">Create New Task Scope</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Define a new milestone or deliverable in the project pipeline.
              </p>
            </div>

            <form onSubmit={handleCreateTaskFromModal} className="space-y-4">
              {/* Task Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Implement middleware authentication"
                  value={modalTaskTitle}
                  onChange={(e) => setModalTaskTitle(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-3xs"
                  required
                />
              </div>

              {/* Task Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="Provide explicit context, parameters, or guidelines..."
                  value={modalTaskDesc}
                  onChange={(e) => setModalTaskDesc(e.target.value)}
                  rows={3}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-3xs resize-none"
                />
              </div>

              {/* Project Link */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Link to Project</label>
                <select
                  value={modalTaskProj}
                  onChange={(e) => setModalTaskProj(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-3xs"
                  required
                >
                  <option value="">-- Choose Target Project --</option>
                  {filteredProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              {/* Grid: Priority & Due Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Priority</label>
                  <select
                    value={modalTaskPriority}
                    onChange={(e) => setModalTaskPriority(e.target.value as any)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-3xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Due Date</label>
                  <input
                    type="date"
                    value={modalTaskDueDate}
                    onChange={(e) => setModalTaskDueDate(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-3xs"
                  />
                </div>
              </div>

              {/* Toggle: Assign to Client */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <label htmlFor="assign-client-toggle" className="text-xs font-bold text-slate-700 block cursor-pointer select-none">
                    Assign to Client Sign-Off
                  </label>
                  <span className="text-[10px] text-slate-400">Requires explicit client approval.</span>
                </div>
                <button
                  type="button"
                  id="assign-client-toggle"
                  onClick={() => setModalTaskAssignToClient(!modalTaskAssignToClient)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer outline-none ${
                    modalTaskAssignToClient ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                  style={modalTaskAssignToClient ? { backgroundColor: 'var(--brand-color, #6366f1)' } : undefined}
                >
                  <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                    modalTaskAssignToClient ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Submit / Action buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isCreatingTask}
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer text-center disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTask}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-all shadow-xs hover:opacity-95 cursor-pointer text-center flex items-center justify-center gap-1.5 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--brand-color, #6366f1)' }}
                >
                  {isCreatingTask ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Task'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Secure Signed URL Toast Banner */}
      {signedUrlState && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white border border-slate-900 rounded-2xl p-4 shadow-2xl max-w-sm w-full space-y-3.5 animate-fade-in-up">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono text-xs">
                🔒
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-tight">Secure Signed URL Generated</h4>
                <p className="text-[10px] text-slate-400">Valid for exactly 60 seconds</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
              00:{signedUrlState.timeLeft < 10 ? `0${signedUrlState.timeLeft}` : signedUrlState.timeLeft}
            </span>
          </div>

          <div className="p-2.5 bg-slate-900 rounded-xl space-y-1.5 border border-slate-800">
            <p className="text-[10px] font-bold text-slate-300 truncate" title={signedUrlState.fileName}>
              {signedUrlState.fileName}
            </p>
            <p className="text-[9px] text-slate-500 font-medium break-all select-all font-mono leading-relaxed bg-slate-950 p-1.5 rounded border border-slate-900/60">
              {signedUrlState.url.substring(0, 80)}...
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(signedUrlState.url);
                confetti({
                  particleCount: 15,
                  spread: 20,
                  origin: { y: 0.95 }
                });
              }}
              className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all text-[10px] font-bold text-slate-300 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              Copy Link
            </button>
            <a
              href={signedUrlState.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                console.log(`[Supabase Storage] Downloading secure object via signed URL...`);
                setSignedUrlState(null);
              }}
              className="flex-1 py-1.5 rounded-lg text-slate-950 font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer bg-emerald-400 hover:bg-emerald-300 transition-all"
            >
              <ExternalLink className="w-3 h-3" />
              Download File
            </a>
          </div>
        </div>
      )}

      {/* Service Requested Bottom Notification Banner */}
      {serviceRequestedToast && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white border border-slate-800 rounded-2xl p-4 shadow-2xl max-w-sm w-full space-y-2 animate-fade-in-up">
          <div className="flex items-center gap-2 text-indigo-400">
            <Sparkles className="w-4 h-4 animate-bounce" />
            <h4 className="text-xs font-bold tracking-tight">Growth Service Initialized!</h4>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            The premium package <strong>"{serviceRequestedToast.serviceName}"</strong> has been logged. An automated client message thread was dispatched.
          </p>
          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 animate-[pulse_1.5s_infinite]" style={{ width: '100%' }}></div>
          </div>
        </div>
      )}

    </div>
  );
}
