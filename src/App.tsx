import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { Plus, Trash2, Clock, Car, DollarSign } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Task {
  id: string;
  title: string;
  due_date: string;
  recurring: string;
  category: string;
  completed: boolean;
}

interface Project {
  id: string;
  name: string;
  purchase_cost: number;
  sale_price?: number;
  status: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'reports'>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectExpenses, setProjectExpenses] = useState<Expense[]>([]);
  const [projectTimeLogs, setProjectTimeLogs] = useState<any[]>([]);

  // Load data from Supabase
  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  const fetchTasks = async () => {
    const { data } = await supabase.from('tasks').select('*').order('due_date');
    setTasks(data || []);
  };

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    setProjects(data || []);
  };

  const addTask = async () => {
    const title = prompt("New task title?");
    if (!title) return;

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ title, due_date: format(new Date(), 'yyyy-MM-dd'), recurring: 'none', category: 'personal', completed: false }])
      .select();

    if (data) {
      setTasks([data[0], ...tasks]);
    }
  };

  const completeTask = async (id: string) => {
    await supabase.from('tasks').update({ completed: true }).eq('id', id);
    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    await supabase.from('tasks').delete().eq('id', id);
    fetchTasks();
  };

  const createProject = async () => {
    const name = prompt("Project name (e.g. Blue Mustang Flip)?");
    if (!name) return;
    const purchase = parseFloat(prompt("Purchase price?") || "0");

    const { data } = await supabase
      .from('projects')
      .insert([{ name, purchase_cost: purchase, status: 'active' }])
      .select();

    if (data) fetchProjects();
  };

  const logMileage = async () => {
    if (!selectedProject) return;
    const km = parseFloat(prompt("Kilometers driven?") || "0");
    if (!km) return;

    const cost = ((km / 100) * 12 * 1.60);
    
    await supabase.from('expenses').insert([{
      project_id: selectedProject.id,
      description: `Gas - ${km} km`,
      amount: parseFloat(cost.toFixed(2)),
      date: format(new Date(), 'yyyy-MM-dd')
    }]);

    alert(`$${cost.toFixed(2)} gas cost added!`);
    loadProjectDetails(selectedProject.id);
  };

  const loadProjectDetails = async (id: string) => {
    const { data: expenses } = await supabase.from('expenses').select('*').eq('project_id', id);
    setProjectExpenses(expenses || []);
  };

  const markSold = async () => {
    if (!selectedProject) return;
    const salePrice = parseFloat(prompt("Sale price?") || "0");
    if (!salePrice) return;

    await supabase.from('projects').update({ 
      sale_price: salePrice, 
      status: 'sold' 
    }).eq('id', selectedProject.id);

    alert("Project marked as sold! Check Reports for profit.");
    setSelectedProject(null);
    fetchProjects();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">✅ Done</h1>
          <div className="flex gap-2 bg-slate-900 rounded-2xl p-1">
            {['dashboard', 'projects', 'reports'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-5 py-2 rounded-xl capitalize ${activeTab === tab ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-semibold">Today's Tasks</h2>
              <button onClick={addTask} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-2xl flex items-center gap-2">
                <Plus size={20} /> New Task
              </button>
            </div>

            <div className="space-y-3">
              {tasks.filter(t => !t.completed).map(task => (
                <div key={task.id} className="bg-slate-900 rounded-3xl p-6 flex items-center justify-between">
                  <div>
                    <div className="text-lg font-medium">{task.title}</div>
                    <div className="text-sm text-slate-400">Due: {task.due_date}</div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => completeTask(task.id)} className="bg-green-600 px-8 py-3 rounded-2xl">Done</button>
                    <button onClick={() => deleteTask(task.id)} className="text-red-400 p-3"><Trash2 /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {activeTab === 'projects' && (
          <div>
            <button onClick={createProject} className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-3xl text-lg font-semibold mb-6 flex items-center justify-center gap-2">
              <Plus /> New Project (Flip / Repair)
            </button>

            {projects.map(p => (
              <div key={p.id} onClick={() => {
                setSelectedProject(p);
                loadProjectDetails(p.id);
              }} className="bg-slate-900 p-6 rounded-3xl mb-4 cursor-pointer hover:bg-slate-800">
                <h3 className="text-xl font-semibold">{p.name}</h3>
                <p className="text-slate-400">Purchase: ${p.purchase_cost}</p>
              </div>
            ))}

            {/* Project Detail Modal */}
            {selectedProject && (
              <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 rounded-3xl w-full max-w-lg p-8 max-h-[90vh] overflow-auto">
                  <h2 className="text-2xl font-bold mb-6">{selectedProject.name}</h2>

                  <div className="space-y-3">
                    <button onClick={logMileage} className="w-full bg-amber-600 py-4 rounded-2xl text-lg">Log Mileage (km)</button>
                    <button onClick={() => alert("Add Time / Expense - will be enhanced soon")} className="w-full bg-purple-600 py-4 rounded-2xl text-lg">Log Time or Parts</button>
                    <button onClick={markSold} className="w-full bg-green-600 py-4 rounded-2xl text-lg">Mark as Sold</button>
                  </div>

                  <button onClick={() => setSelectedProject(null)} className="mt-8 text-slate-400 w-full">Close</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reports */}
        {activeTab === 'reports' && (
          <div className="text-center py-12">
            <h2 className="text-3xl mb-4">Reports</h2>
            <p className="text-slate-400">Full profit, hourly rates, and category breakdowns coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
