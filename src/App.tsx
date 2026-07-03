import React, { useState, useEffect } from 'react';
import { 
  MOCK_ADMIN, 
  MOCK_CLIENTS, 
  MOCK_PROJECTS, 
} from './data/mockData';
import { Profile } from './types/portal';
import Sidebar from './components/Sidebar';
import DashboardViews from './components/DashboardViews';
import DeveloperAssets from './components/DeveloperAssets';
import { usePortal } from './context/PortalContext';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import { 
  Menu, 
  ArrowLeftRight, 
  Palette, 
  Layers, 
  Code,
  Smartphone,
  Monitor,
  Info,
  Loader2,
  Lock,
  UserPlus,
  LogIn,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function App() {
  // Local Session UI state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('sydney_is_logged_in') === 'true';
  });
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);

  // Authentication states
  const [authTab, setAuthTab] = useState<'demo' | 'live'>('demo');
  const [isSignUpMode, setIsSignUpMode] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // View Mode: Splits workspace between Portal Live Preview and Developer Assets Code Panel
  const [activeWorkspaceMode, setActiveWorkspaceMode] = useState<'preview' | 'code' | 'split'>('split');

  // Consume Portal Context
  const {
    userRole,
    setUserRole,
    currentProfile,
    setCurrentProfile,
    selectedClient,
    setSelectedClient,
    brandColor,
    setBrandColor,
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
  } = usePortal();

  // Listen to live Supabase auth session if configured
  useEffect(() => {
    if (supabase) {
      // Check current session on mount
      supabase.auth.getSession().then(({ data: { session } }) => {
        const authType = localStorage.getItem('sydney_auth_type');
        if (session && session.user) {
          setIsLoggedIn(true);
          localStorage.setItem('sydney_is_logged_in', 'true');
          localStorage.setItem('sydney_auth_type', 'live');
          const userEmail = session.user.email || '';
          const isUserAdmin = userEmail.includes('admin') || userEmail.includes('alex') || userEmail === 'lidyaspace@gmail.com';
          setUserRole(isUserAdmin ? 'admin' : 'client');
          setCurrentProfile({
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || userEmail.split('@')[0],
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${session.user.id}`,
            role: isUserAdmin ? 'admin' : 'client',
            company_name: session.user.user_metadata?.company_name || 'Business Partner',
            brand_color: '#6366f1'
          });
        } else if (authType === 'live') {
          // Only sign out/clear if they were previously logged in via 'live'
          setIsLoggedIn(false);
          localStorage.removeItem('sydney_is_logged_in');
          localStorage.removeItem('sydney_auth_type');
        }
        setIsInitialLoading(false);
      }).catch((err) => {
        console.error("[Supabase Connection Error]", err);
        localStorage.removeItem('sydney_auth_type');
        localStorage.removeItem('sydney_is_logged_in');
        setIsLoggedIn(false);
        setIsInitialLoading(false);
      });

      // Listen for session updates
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        const authType = localStorage.getItem('sydney_auth_type');
        if (session && session.user) {
          setIsLoggedIn(true);
          localStorage.setItem('sydney_is_logged_in', 'true');
          localStorage.setItem('sydney_auth_type', 'live');
          const userEmail = session.user.email || '';
          const isUserAdmin = userEmail.includes('admin') || userEmail.includes('alex') || userEmail === 'lidyaspace@gmail.com';
          setUserRole(isUserAdmin ? 'admin' : 'client');
          setCurrentProfile({
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || userEmail.split('@')[0],
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${session.user.id}`,
            role: isUserAdmin ? 'admin' : 'client',
            company_name: session.user.user_metadata?.company_name || 'Business Partner',
            brand_color: '#6366f1'
          });
        } else if (authType === 'live') {
          // Only sign out if the session is explicitly null AND they were using live auth
          setIsLoggedIn(false);
          localStorage.removeItem('sydney_is_logged_in');
          localStorage.removeItem('sydney_auth_type');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setIsInitialLoading(false);
    }
  }, [setUserRole, setCurrentProfile]);

  const presetColors = [
    { name: 'Sydney Indigo', hex: '#6366f1' },
    { name: 'Vortex Cyan', hex: '#06b6d4' },
    { name: 'Apex Sapphire', hex: '#1d4ed8' },
    { name: 'Sunset Rose', hex: '#f43f5e' },
    { name: 'Emerald Mint', hex: '#10b981' },
    { name: 'Monochrome Slate', hex: '#0f172a' },
  ];

  // Mobile Sidebar Visibility Toggle
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Helper preset log-ins
  const handlePresetLogin = (role: 'admin' | 'sarah' | 'marcus') => {
    setIsLoggedIn(true);
    localStorage.setItem('sydney_is_logged_in', 'true');
    localStorage.setItem('sydney_auth_type', 'demo');
    if (role === 'admin') {
      setUserRole('admin');
    } else if (role === 'sarah') {
      setSelectedClient(MOCK_CLIENTS[0]);
      setUserRole('client');
    } else if (role === 'marcus') {
      setSelectedClient(MOCK_CLIENTS[1]);
      setUserRole('client');
    }
    setActiveTab('overview');
  };

  // Real Supabase Auth login/signup submit
  const handleLiveAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      if (isSignUpMode) {
        // Sign Up Flow
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              company_name: companyName,
            },
          },
        });

        if (error) throw error;
        
        if (data.user && data.session) {
          setAuthSuccess("Successfully registered and logged in!");
          setIsLoggedIn(true);
          localStorage.setItem('sydney_is_logged_in', 'true');
          localStorage.setItem('sydney_auth_type', 'live');
        } else {
          setAuthSuccess("Registration initiated! Please check your email inbox to confirm your live credentials.");
        }
      } else {
        // Sign In Flow
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        setAuthSuccess("Logged in successfully!");
        setIsLoggedIn(true);
        localStorage.setItem('sydney_is_logged_in', 'true');
        localStorage.setItem('sydney_auth_type', 'live');
      }
    } catch (err: any) {
      console.error("[Supabase Auth Error]", err);
      setAuthError(err.message || "An authentication error occurred.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setIsLoggedIn(false);
    localStorage.removeItem('sydney_is_logged_in');
    localStorage.removeItem('sydney_auth_type');
  };


  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-indigo-500/10 select-none">
      
      {/* 1. TOP HEADER BRAND / SWITCHER BAR */}
      <header className="bg-slate-900 text-white px-5 py-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg font-bold text-white tracking-wider">
            S
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              Sydney.app Freelancer Suite
              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Next.js 15 + Supabase Specs
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Interactive design environment. Swap views, customize brand, and copy backend architectures below.
            </p>
          </div>
        </div>

        {/* Header Right Interactions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Workspace mode selectors */}
          <div className="flex bg-slate-800 p-1 rounded-xl text-xs font-semibold text-slate-300 border border-slate-700/80">
            <button
              onClick={() => setActiveWorkspaceMode('preview')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all ${
                activeWorkspaceMode === 'preview' ? 'bg-slate-950 text-white shadow-sm' : 'hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Portal Live Preview</span>
            </button>
            <button
              onClick={() => setActiveWorkspaceMode('split')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all hidden md:flex ${
                activeWorkspaceMode === 'split' ? 'bg-slate-950 text-white shadow-sm' : 'hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
            <button
              onClick={() => setActiveWorkspaceMode('code')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all ${
                activeWorkspaceMode === 'code' ? 'bg-slate-950 text-white shadow-sm' : 'hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Developer Code Assets</span>
            </button>
          </div>

          {/* Quick role toggle if logged in */}
          {isLoggedIn && (
            <div className="flex bg-slate-800 p-1 rounded-xl text-xs font-semibold text-slate-300 border border-slate-700/80">
              <button
                onClick={() => {
                  if (userRole === 'admin') {
                    setUserRole('client');
                  } else {
                    setUserRole('admin');
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-50 text-white flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 text-xs shadow-md"
                title="Simulates redirect behavior in middleware.ts"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Simulate: Swap Roles</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. MAIN SPLIT / SINGLE INTERACTIVE CONTENT SECTION */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* VIEW COLUMN A: THE CLIENT PORTAL PREVIEW */}
        {(activeWorkspaceMode === 'preview' || activeWorkspaceMode === 'split') && (
          <div className={`flex-1 flex flex-col bg-white overflow-hidden ${activeWorkspaceMode === 'split' ? 'lg:max-w-[62%]' : ''}`}>
            
            {/* If user is not logged in, render the premium Login Screen Mockup */}
            {isInitialLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6 min-h-[400px]">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-xs text-slate-500 mt-2 font-medium">Verifying security session...</p>
              </div>
            ) : !isLoggedIn ? (
              <div id="auth-flow-view" className="flex-1 flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden text-slate-700">
                {/* Background layout dots */}
                <span className="absolute -left-16 -top-16 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50 animate-pulse"></span>
                <span className="absolute -right-16 -bottom-16 w-64 h-64 bg-cyan-100 rounded-full blur-3xl opacity-50 animate-pulse"></span>

                <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200/85 shadow-xl space-y-6 z-10 relative">
                  <div className="text-center">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-md mb-3">
                      <Layers className="w-6 h-6 animate-pulse" />
                    </div>
                    <h2 className="font-sans font-bold text-xl text-slate-900 tracking-tight">Sydney client portal</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Secure B2B business hub & interactive client portal.
                    </p>
                  </div>

                  {/* Auth Mode Tabs */}
                  <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200/40">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('demo');
                        setAuthError(null);
                        setAuthSuccess(null);
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        authTab === 'demo'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Demo Accounts
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('live');
                        setAuthError(null);
                        setAuthSuccess(null);
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        authTab === 'live'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Lock className="w-3 h-3 text-indigo-500" />
                      Live Supabase Auth
                    </button>
                  </div>

                  {/* TAB 1: DEMO / SANDBOX ACCOUNTS */}
                  {authTab === 'demo' && (
                    <div className="space-y-3.5 animate-in fade-in-50 duration-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                        Select an instant workspace session:
                      </span>
                      
                      <button
                        onClick={() => handlePresetLogin('admin')}
                        className="w-full flex items-center justify-between p-3 border border-slate-200/80 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/20 text-left transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={MOCK_ADMIN.avatar_url}
                            alt="Admin Profile"
                            className="w-9 h-9 rounded-full object-cover border border-slate-100 shadow-3xs"
                          />
                          <div>
                            <p className="text-xs font-semibold text-slate-800">Alex Rivers</p>
                            <p className="text-[10px] text-slate-400">Freelancer (Full Admin Suite)</p>
                          </div>
                        </div>
                        <span className="text-xs text-indigo-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Launch →</span>
                      </button>

                      <button
                        onClick={() => handlePresetLogin('sarah')}
                        className="w-full flex items-center justify-between p-3 border border-slate-200/80 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/20 text-left transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={MOCK_CLIENTS[0].avatar_url}
                            alt="Client Profile Sarah"
                            className="w-9 h-9 rounded-full object-cover border border-slate-100 shadow-3xs"
                          />
                          <div>
                            <p className="text-xs font-semibold text-slate-800">Sarah Jenkins</p>
                            <p className="text-[10px] text-slate-400">Vortex Labs Client (Sandboxed)</p>
                          </div>
                        </div>
                        <span className="text-xs text-indigo-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Launch →</span>
                      </button>

                      <button
                        onClick={() => handlePresetLogin('marcus')}
                        className="w-full flex items-center justify-between p-3 border border-slate-200/80 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/20 text-left transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={MOCK_CLIENTS[1].avatar_url}
                            alt="Client Profile Marcus"
                            className="w-9 h-9 rounded-full object-cover border border-slate-100 shadow-3xs"
                          />
                          <div>
                            <p className="text-xs font-semibold text-slate-800">Marcus Vance</p>
                            <p className="text-[10px] text-slate-400">Apex Group Client (Sandboxed)</p>
                          </div>
                        </div>
                        <span className="text-xs text-indigo-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Launch →</span>
                      </button>

                      <p className="text-[9.5px] text-slate-400 font-medium text-center leading-relaxed">
                        No setup required. Instant demo simulations utilize isolated state systems mimicking the core server rules.
                      </p>
                    </div>
                  )}

                  {/* TAB 2: LIVE SUPABASE AUTHENTICATION */}
                  {authTab === 'live' && (
                    <div className="space-y-4 animate-in fade-in-50 duration-200">
                      {!isSupabaseConfigured ? (
                        <div className="p-4.5 bg-amber-50 rounded-2xl border border-amber-200/60 text-left space-y-3">
                          <div className="flex items-center gap-2 text-amber-800">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                            <h4 className="text-xs font-bold uppercase tracking-wide">Environment Keys Needed</h4>
                          </div>
                          <p className="text-[11px] text-amber-700 leading-relaxed">
                            To configure live authentication for signup and database syncs, you must supply your client-side Supabase credentials:
                          </p>
                          <div className="bg-slate-900/5 p-3 rounded-xl border border-slate-900/10 font-mono text-[10px] text-slate-700 space-y-1">
                            <div>NEXT_PUBLIC_SUPABASE_URL=...</div>
                            <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=...</div>
                          </div>
                          <p className="text-[10.5px] text-slate-500">
                            Set these variables in your workspace <strong className="text-slate-700">.env</strong> file or AI Studio secrets configuration.
                          </p>
                          <button
                            type="button"
                            onClick={() => setAuthTab('demo')}
                            className="w-full mt-1.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-3xs cursor-pointer transition-all"
                          >
                            Return to Demo Mode
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleLiveAuthSubmit} className="space-y-3.5 text-left">
                          {/* Alert Messages */}
                          {authError && (
                            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-medium">
                              ⚠️ {authError}
                            </div>
                          )}
                          {authSuccess && (
                            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-medium flex items-start gap-1.5">
                              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{authSuccess}</span>
                            </div>
                          )}

                          {isSignUpMode && (
                            <>
                              <div className="space-y-1">
                                <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Eleanor Vance"
                                  value={fullName}
                                  onChange={(e) => setFullName(e.target.value)}
                                  required
                                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 bg-white"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">Company Name (Optional)</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Apex Systems"
                                  value={companyName}
                                  onChange={(e) => setCompanyName(e.target.value)}
                                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 bg-white"
                                />
                              </div>
                            </>
                          )}

                          <div className="space-y-1">
                            <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">Business Email</label>
                            <input
                              type="email"
                              placeholder="you@company.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 bg-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">Secure Password</label>
                            <input
                              type="password"
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              minLength={6}
                              className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 bg-white"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={authLoading}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            {authLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Authenticating Security Credentials...</span>
                              </>
                            ) : isSignUpMode ? (
                              <>
                                <UserPlus className="w-4 h-4" />
                                <span>Register Secure Client Account</span>
                              </>
                            ) : (
                              <>
                                <LogIn className="w-4 h-4" />
                                <span>Authorize Secure Entrance</span>
                              </>
                            )}
                          </button>

                          <div className="text-center pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsSignUpMode(!isSignUpMode);
                                setAuthError(null);
                                setAuthSuccess(null);
                              }}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                            >
                              {isSignUpMode
                                ? "Already registered? Sign In instead"
                                : "Need a client account? Sign Up now"}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Sydney portals coordinate strict sandboxing. All entries map to dynamic profiles, guarding proprietary project deliverables behind custom metadata rules.
                  </p>
                </div>
              </div>
            ) : (
              /* If logged in, render the main live Workspace Panel */
              <div id="logged-dashboard-portal" className="flex-1 flex overflow-hidden h-full relative">
                
                {/* Embedded Sidebar Component */}
                <Sidebar
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  currentProfile={currentProfile}
                  onLogout={handleLogout}
                  isOpen={mobileSidebarOpen}
                  setIsOpen={setMobileSidebarOpen}
                />

                {/* Sub-view Content Frame */}
                <div className="flex-1 flex flex-col overflow-hidden h-full">
                  
                  {/* Dashboard Content Header (contains hamburger, brand customizer and quick stats) */}
                  <div className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
                    
                    <div className="flex items-center gap-3">
                      {/* Mobile Hamburger toggle */}
                      <button
                        onClick={() => setMobileSidebarOpen(true)}
                        className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer hover:bg-slate-50 transition-all shrink-0"
                        title="Open Navigation menu"
                      >
                        <Menu className="w-5 h-5" />
                      </button>

                      {/* Display current page breadcrumb */}
                      <div className="hidden sm:flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Dashboard</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-xs text-slate-700 font-bold capitalize">{activeTab}</span>
                      </div>
                    </div>

                    {/* Header Controls: Theme customizations & active stats */}
                    <div className="flex items-center gap-3">
                      
                      {/* Brand Color Popover button */}
                      <div className="relative">
                        <button
                          onClick={() => setShowColorPicker(!showColorPicker)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 flex items-center gap-2 cursor-pointer shadow-3xs transition-all active:scale-95"
                        >
                          <Palette className="w-4 h-4 text-slate-400" />
                          <span>Brand Color</span>
                          <span 
                            className="w-3.5 h-3.5 rounded-full border border-slate-200" 
                            style={{ backgroundColor: brandColor }}
                          />
                        </button>

                        {/* Dropdown list */}
                        {showColorPicker && (
                          <>
                            <div className="fixed inset-0 z-40 cursor-pointer" onClick={() => setShowColorPicker(false)} />
                            <div className="absolute right-0 mt-2.5 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 space-y-3 animate-in fade-in-50 slide-in-from-top-2 duration-200">
                              <h4 className="text-xs font-bold text-slate-900">Customize Client Branding</h4>
                              <p className="text-[10px] text-slate-400">
                                Set your brand theme color dynamically via the CSS custom variable override.
                              </p>
                              
                              {/* Grid of presets */}
                              <div className="grid grid-cols-3 gap-2">
                                {presetColors.map((color) => (
                                  <button
                                    key={color.hex}
                                    onClick={() => {
                                      setBrandColor(color.hex);
                                      setShowColorPicker(false);
                                    }}
                                    className="p-1 border border-slate-100 rounded-lg hover:border-slate-300 transition-all cursor-pointer flex flex-col items-center gap-1.5"
                                  >
                                    <span 
                                      className="w-5 h-5 rounded-md border border-slate-200 block"
                                      style={{ backgroundColor: color.hex }}
                                    />
                                    <span className="text-[8px] text-slate-500 font-semibold truncate w-full text-center">
                                      {color.name.split(' ')[1]}
                                    </span>
                                  </button>
                                ))}
                              </div>

                              <div className="pt-2 border-t border-slate-50">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Custom Hex Code</label>
                                <div className="flex gap-1.5">
                                  <input 
                                    type="text"
                                    value={brandColor}
                                    onChange={(e) => setBrandColor(e.target.value)}
                                    placeholder="#000000"
                                    className="flex-1 text-[11px] px-2 py-1 rounded-lg border border-slate-200 font-mono text-center focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                    </div>

                  </div>

                  {/* The interactive Views dashboard container */}
                  <DashboardViews
                    role={userRole}
                    selectedClient={selectedClient}
                    setSelectedClient={setSelectedClient}
                    clients={MOCK_CLIENTS}
                    projects={MOCK_PROJECTS}
                    tasks={tasks}
                    setTasks={setTasks}
                    files={files}
                    setFiles={setFiles}
                    messages={messages}
                    setMessages={setMessages}
                    invoices={invoices}
                    setInvoices={setInvoices}
                    activeTab={activeTab}
                  />

                </div>

              </div>
            )}

          </div>
        )}

        {/* VIEW COLUMN B: THE REQUESTED DEVELOPER ASSETS & POSTGRES/MIDDLEWARE CODE COPIER */}
        {(activeWorkspaceMode === 'code' || activeWorkspaceMode === 'split') && (
          <div className={`flex-1 p-6 md:p-8 overflow-y-auto bg-slate-900 flex flex-col ${activeWorkspaceMode === 'split' ? 'lg:max-w-[38%] border-l border-slate-800' : ''}`}>
            
            {/* Quick Helper block explaining relationships */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-slate-300 space-y-3 mb-6">
              <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-400" />
                Sydney-like B2B SaaS Relational Logic
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sydney.app organizes secure access around three relational boundaries: 
                <strong> Profiles</strong>, <strong>Projects</strong>, and <strong>Tasks</strong>. 
                Our simulated view dynamically maps your interactive choices directly back to these databases.
              </p>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>Active Database: <strong>Supabase (PostgreSQL)</strong></span>
                <span>Active Framework: <strong>Next.js 15</strong></span>
              </div>
            </div>

            {/* Render Developer Assets view */}
            <DeveloperAssets />

          </div>
        )}

      </main>

    </div>
  );
}

