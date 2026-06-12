import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, CheckCircle, Wrench, DollarSign, TrendingUp, Folder, ClipboardList, Loader2, Trash2 } from 'lucide-react';

// Initialize Supabase client
const supabaseUrl = "https://ltoznkvvnpaseaubtwcx.supabase.co";
const supabaseAnonKey = "sb_publishable_JduwaTMFShYDGBsjO3waMg_8wy7TqWG";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects'>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<string>('Loading...');

  // Form states
  const [newTaskName, setNewTaskName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newPurchaseCost, setNewPurchaseCost] = useState('');
  const [newSalePrice, setNewSalePrice] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setStatus('Loading application data...');

      // Fetch active tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('completed', false)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      setTasks(tasksData || []);
      setProjects(projectsData || []);
      setStatus('All systems green.');
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setStatus(`Error: ${err.message || 'Failed to fetch'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ name: newTaskName.trim(), completed: false }])
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

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const purchase = parseFloat(newPurchaseCost) || 0;
      const sale = parseFloat(newSalePrice) || 0;
      const profit = sale - purchase;

      const { data, error } = await supabase
        .from('projects')
        .insert([{ 
          name: newProjectName.trim(), 
          purchase_cost: purchase, 
          sale_price: sale, 
          profit: profit 
        }])
        .select();

      if (error) throw error;

      setProjects([data[0], ...projects]);
      setNewProjectName('');
      setNewPurchaseCost('');
      setNewSalePrice('');
    } catch (err: any) {
      alert(`Failed to add project: ${err.message}`);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
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

  // Metrics calculations
  const totalProfit = projects.reduce((sum, p) => sum + (p.profit || 0), 0);
  const activeProjectsCount = projects.length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <ClipboardList className="text-blue-500 h-8 w-8" /> Done
            </h1>
            <p className="text-sm text-slate-400 mt-1">Jack's Operations Center</p>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-800/60 px-4 py-2 rounded-lg border border-slate-700/50 text-xs text-slate-300">
            <span className={`h-2 w-2 rounded-full ${status.includes('Error') ? 'bg-red-500 animate-pulse' : loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
            {status}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        
        {/* Metric Cards Banner */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Active Tasks</p>
              <p className="text-2xl font-bold text-white mt-0.5">{tasks.length}</p>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
              <Folder className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Projects</p>
              <p className="text-2xl font-bold text-white mt-0.5">{activeProjectsCount}</p>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Net Tracked Profit</p>
              <p className="text-2xl font-bold text-emerald-400 mt-0.5">${totalProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Wrench className="h-4 w-4" /> Operations Dashboard
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-all flex items-center gap-2 ${activeTab === 'projects' ? 'border-purple-500 text-purple-400 bg-purple-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Folder className="h-4 w-4" /> Project Ledger
          </button>
        </div>

        {/* Tab Layout Screens */}
        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left/Middle Column: Tasks Panel */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <ClipboardList className="text-blue-400 h-5 w-5" /> Live Action Items
                </h2>

                <form onSubmit={handleAddTask} className="flex gap-2 mb-6">
                  <input
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="What mechanical service or operational item needs resolution?"
                    className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors shrink-0 shadow-lg shadow-blue-600/10">
                    <Plus className="h-4 w-4" /> Add Task
                  </button>
                </form>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <p className="text-xs">Querying secure records...</p>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-500">
                    <CheckCircle className="h-8 w-8 mx-auto text-slate-700 mb-2" />
                    <p className="text-sm font-medium text-slate-400">All systems green</p>
                    <p className="text-xs mt-0.5">No active maintenance tasks pending.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/60">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 group">
                        <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{task.name}</span>
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          className="text-xs bg-slate-800 hover:bg-emerald-900/40 text-slate-400 hover:text-emerald-400 border border-slate-700/60 hover:border-emerald-700/50 px-3 py-1.5 rounded-md flex items-center gap-1 transition-all"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Complete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Mini Info Cards */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-900/20 to-slate-800/40 border border-blue-500/10 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">Operational Insight</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  This interface provides immediate state persistence straight to your live cloud architecture. Use this panel to track mechanical service flows, flipping tasks, and deployment conditions safely.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Projects Ledger Tab Screen */
          <div className="space-y-6">
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Folder className="text-purple-400 h-5 w-5" /> Financial Ledger & Tracked Assets
              </h2>

              {/* Form Input Grid */}
              <form onSubmit={handleAddProject} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Asset Name / Description</label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g., Vehicle Flip #1 or Shop Equipment"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Purchase / Base Cost ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 text-sm"><DollarSign className="h-3.5 w-3.5" /></span>
                    <input
                      type="number"
                      step="0.01"
                      value={newPurchaseCost}
                      onChange={(e) => setNewPurchaseCost(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Expected / Sale Price ($)</label>
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2.5 text-slate-500 text-sm"><DollarSign className="h-3.5 w-3.5" /></span>
                      <input
                        type="number"
                        step="0.01"
                        value={newSalePrice}
                        onChange={(e) => setNewSalePrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-lg shadow-purple-600/10 flex items-center self-end h-[38px]">
                      Track
                    </button>
                  </div>
                </div>
              </form>

              {/* Data Table */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                  <p className="text-xs">Querying asset balances...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-500">
                  <Folder className="h-8 w-8 mx-auto text-slate-700 mb-2" />
                  <p className="text-sm font-medium text-slate-400">Ledger empty</p>
                  <p className="text-xs mt-0.5">No investments or tracked assets loaded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900/80 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        <th className="p-4">Project / Asset Name</th>
                        <th className="p-4">Purchase Cost</th>
                        <th className="p-4">Sale Price</th>
                        <th className="p-4">Net Profit</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 bg-slate-900/10">
                      {projects.map((project) => (
                        <tr key={project.id} className="hover:bg-slate-800/30 transition-colors group">
                          <td className="p-4 text-sm font-medium text-slate-200">{project.name}</td>
                          <td className="p-4 text-sm text-slate-400">${(project.purchase_cost || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                          <td className="p-4 text-sm text-slate-400">${(project.sale_price || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                          <td className={`p-4 text-sm font-semibold ${project.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            ${(project.profit || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </td>
                          <td className="p-4 text-sm text-right">
                            <button
                              onClick={() => handleDeleteProject(project.id)}
                              className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/5 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
