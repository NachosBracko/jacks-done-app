import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, CheckCircle, Wrench, DollarSign, TrendingUp, Folder, ClipboardList, Loader2, Trash2 } from 'lucide-react';

// Initialize Supabase client
const supabaseUrl = "https://supabase.com/dashboard/project/ltoznkvvnpaseaubtwcx";
const supabaseAnonKey = "sb_publishable_JduwaTMFShYDGBsjO3waMg_8wy7TqWG";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects'>('dashboard');
  const [status, setStatus] = useState<string>('Loading...');

  // Form states for adding new items
  const [newTaskName, setNewTaskName] = useState('');
  
  const [newProjectName, setNewProjectName] = useState('');
  const [newPurchaseCost, setNewPurchaseCost] = useState('');
  const [newSalePrice, setNewSalePrice] = useState('');

  // Load data from Supabase when the app starts
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setStatus('Loading application data...');
      
      // 1. Fetch incomplete tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .not('completed', 'is', true)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // 2. Fetch projects from schema in image_5e34d7.jpg
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      setStatus('Ready');
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setStatus(`Error: ${err.message}`);
    }
  };

  // --- TASK ACTIONS ---
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ name: newTaskName, completed: false }])
        .select();

      if (error) throw error;
      setTasks([data[0], ...tasks]);
      setNewTaskName('');
    } catch (err: any) {
      alert(`Failed to add task: ${err.message}`);
    }
  };

  const handleCompleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: true })
        .eq('id', id);

      if (error) throw error;
      setTasks(tasks.filter(task => task.id !== id));
    } catch (err: any) {
      alert(`Failed to complete task: ${err.message}`);
    }
  };

  // --- PROJECT ACTIONS (image_5e34d7.jpg Mapping) ---
  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            name: newProjectName,
            purchase_cost: parseFloat(newPurchaseCost) || 0,
            sale_price: parseFloat(newSalePrice) || 0,
            status: 'In Progress'
          }
        ])
        .select();

      if (error) throw error;
      setProjects([data[0], ...projects]);
      
      // Reset form fields
      setNewProjectName('');
      setNewPurchaseCost('');
      setNewSalePrice('');
    } catch (err: any) {
      alert(`Failed to create project: ${err.message}`);
    }
  };

  const handleUpdateProjectStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'In Progress' ? 'Completed' : 'In Progress';
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: nextStatus })
        .eq('id', id);

      if (error) throw error;
      setProjects(projects.map(p => p.id === id ? { ...p, status: nextStatus } : p));
    } catch (err: any) {
      alert(`Failed to update project: ${err.message}`);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to remove this project?')) return;
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProjects(projects.filter(p => p.id !== id));
    } catch (err: any) {
      alert(`Failed to delete project: ${err.message}`);
    }
  };

  // --- FINANCIAL CALCULATION ENGINE ---
  const totalInvested = projects.reduce((acc, p) => acc + (p.purchase_cost || 0), 0);
  const totalRevenue = projects.reduce((acc, p) => acc + (p.sale_price || 0), 0);
  const netReturn = totalRevenue - totalInvested;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans antialiased">
      {/* Dynamic App Header */}
      <header className="border-b border-slate-800 bg-[#1e293b]/50 backdrop-blur sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Done</h1>
            <p className="text-xs text-slate-400 font-medium">Jack's Operations Center</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <ClipboardList className="w-4 h-4" />
            Tasks ({tasks.length})
          </button>
          <button 
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'projects' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Wrench className="w-4 h-4" />
            Projects ({projects.length})
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        
        {/* Sync Status Banner */}
        {status !== 'Ready' && (
          <div className="mb-6 flex items-center gap-3 bg-blue-950/40 border border-blue-800/50 rounded-xl px-4 py-3 text-sm text-blue-300">
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            <span>{status}</span>
          </div>
        )}

        {/* === TAB 1: TASKS DASHBOARD === */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Inline Task Creator */}
            <form onSubmit={handleAddTask} className="flex gap-3 bg-[#1e293b] p-3 rounded-xl border border-slate-800 shadow-xl">
              <input 
                type="text" 
                placeholder="What mechanical service or operation needs handling next?" 
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700/60 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-5 py-2 rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-blue-500/10">
                <Plus className="w-4 h-4" /> Add Task
              </button>
            </form>

            {/* Task Render Stack */}
            <div className="space-y-3">
              {tasks.length === 0 && status === 'Ready' ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-500 bg-[#1e293b]/20">
                  All systems green. No active maintenance tasks pending.
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 bg-[#1e293b] rounded-xl border border-slate-800 hover:border-slate-700 transition group shadow-md">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></div>
                      <span className="text-sm font-medium text-slate-200">{task.name}</span>
                    </div>
                    <button 
                      onClick={() => handleCompleteTask(task.id)}
                      className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    >
                      ✓ Done
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* === TAB 2: PROJECTS WORKSPACE === */}
        {activeTab === 'projects' && (
          <div className="space-y-8">
            
            {/* Financial Overview KPI Ribbon */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#1e293b] p-5 rounded-xl border border-slate-800 flex items-center gap-4 shadow-md">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Capital Invested</p>
                  <p className="text-xl font-bold mt-0.5 text-slate-100">${totalInvested.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>
              </div>

              <div className="bg-[#1e293b] p-5 rounded-xl border border-slate-800 flex items-center gap-4 shadow-md">
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Projected Revenue</p>
                  <p className="text-xl font-bold mt-0.5 text-slate-100">${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>
              </div>

              <div className="bg-[#1e293b] p-5 rounded-xl border border-slate-800 flex items-center gap-4 shadow-md">
                <div className={`p-3 rounded-lg ${netReturn >= 0 ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}`}>
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Portfolio Return</p>
                  <p className={`text-xl font-bold mt-0.5 ${netReturn >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                    {netReturn >= 0 ? '' : '-'}${Math.abs(netReturn).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Project Deployment Form */}
            <form onSubmit={handleAddProject} className="bg-[#1e293b] p-5 rounded-xl border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-sm font-bold tracking-wide text-slate-300 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-500" /> Track New Shop Build or Flip
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">Project Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Ford F-150 Service or Bike Flip" 
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="bg-slate-900 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">Purchase Cost / Parts Budget ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    value={newPurchaseCost}
                    onChange={(e) => setNewPurchaseCost(e.target.value)}
                    className="bg-slate-900 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">Target Sale / Valuation ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    value={newSalePrice}
                    onChange={(e) => setNewSalePrice(e.target.value)}
                    className="bg-slate-900 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-6 py-2 rounded-lg transition shadow-lg shadow-blue-500/10 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Deploy Project Workspace
                </button>
              </div>
            </form>

            {/* Project List Stack */}
            <div className="space-y-4">
              {projects.length === 0 && status === 'Ready' ? (
                <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl text-slate-500 bg-[#1e293b]/20">
                  No operational metrics logged yet. Start a project above to run calculations.
                </div>
              ) : (
                projects.map((project) => {
                  const projectMargin = (project.sale_price || 0) - (project.purchase_cost || 0);
                  return (
                    <div key={project.id} className="bg-[#1e293b] border border-slate-800 rounded-xl overflow-hidden shadow-md hover:border-slate-700/80 transition duration-200">
                      
                      {/* Project Header Row */}
                      <div className="px-5 py-4 border-b border-slate-800/60 bg-slate-900/30 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${project.status === 'Completed' ? 'bg-emerald-500' : 'bg-blue-500'} shadow-sm`}></div>
                          <h4 className="font-bold text-base text-slate-100">{project.name}</h4>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${project.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                            {project.status || 'In Progress'}
                          </span>
                        </div>
                        
                        {/* Interactive Management Row */}
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleUpdateProjectStatus(project.id, project.status)}
                            className={`px-3 py-1 rounded-md text-xs font-bold border transition ${project.status === 'Completed' ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-white'}`}
                          >
                            {project.status === 'Completed' ? '↩ Reopen Build' : '✓ Mark Completed'}
                          </button>
                          
                          <button 
                            onClick={() => handleDeleteProject(project.id)}
                            className="p-1.5 rounded-md border border-slate-800 bg-slate-900/50 text-slate-500 hover:text-rose-400 hover:border-rose-500/20 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Internal Accounting Data View */}
                      <div className="grid grid-cols-3 divide-x divide-slate-800/60 bg-slate-900/10 text-center py-3.5">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Input Cost</p>
                          <p className="text-sm font-bold text-slate-200 mt-0.5">${(project.purchase_cost || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Valuation</p>
                          <p className="text-sm font-bold text-slate-200 mt-0.5">${(project.sale_price || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Spread / Margin</p>
                          <p className={`text-sm font-black mt-0.5 ${projectMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {projectMargin >= 0 ? '+' : '-'}${Math.abs(projectMargin).toLocaleString()}
                          </p>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
