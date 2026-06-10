import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { Trash2, Plus, Clock, Car, DollarSign } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Task { id: string; title: string; due_date: string; recurring: string; category: string; completed: boolean; }
interface Project { id: string; name: string; purchase_cost: number; sale_price?: number; status: string; }
interface Expense { id: string; description: string; amount: number; }
interface TimeLog { id: string; hours: number; description: string; }

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'reports'>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectExpenses, setProjectExpenses] = useState<Expense[]>([]);
  const [projectTimeLogs, setProjectTimeLogs] = useState<TimeLog[]>([]);

  // Load data (we'll connect Supabase later)
  useEffect(() => {
    // Mock data for now
    setTasks([
      { id: '1', title: "Buy flowers for mom", due_date: "2026-06-13", recurring: "none", category: "personal", completed: false },
      { id: '2', title: "Work on Blue Mustang", due_date: "2026-06-11", recurring: "none", category: "flips", completed: false }
    ]);
    setProjects([
      { id: 'p1', name: "Blue Mustang Flip", purchase_cost: 600, status: "active" }
    ]);
  }, []);

  const addTask = () => {
    const title = prompt("Task title?");
    if (!title) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      due_date: format(new Date(), 'yyyy-MM-dd'),
      recurring: 'none',
      category: 'personal',
      completed: false
    };
    setTasks([newTask, ...tasks]);
  };

  const completeTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? {...t, completed: true} : t));
    alert("✅ Task completed!");
  };

  const deleteTask = (id: string) => {
    if (confirm("Delete this task?")) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const openProject = (project: Project) => {
    setSelectedProject(project);
    // Mock expenses and time logs
    setProjectExpenses([]);
    setProjectTimeLogs([]);
  };

  const logMileage = () => {
    const km = prompt("Kilometers driven?");
    if (!km) return;
    const cost = ((parseFloat(km) / 100) * 12 * 1.60).toFixed(2);
    alert(`Gas cost added: $${cost}`);
  };

  const markSold = () => {
    if (!selectedProject) return;
    const salePrice = prompt("Sale price?");
    if (!salePrice) return;
    alert(`Project sold! Profit calculated.`);
    setSelectedProject(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            ✅ Done
          </h1>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-xl ${activeTab === 'dashboard' ? 'bg-blue-600' : 'bg-slate-800'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('projects')} className={`px-4 py-2 rounded-xl ${activeTab === 'projects' ? 'bg-blue-600' : 'bg-slate-800'}`}>Projects</button>
            <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 rounded-xl ${activeTab === 'reports' ? 'bg-blue-600' : 'bg-slate-800'}`}>Reports</button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Today's Tasks</h2>
              <button onClick={addTask} className="big-button bg-blue-600 flex items-center gap-2">
                <Plus size={20} /> New Task
              </button>
            </div>
            
            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task.id} className="bg-slate-900 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-lg">{task.title}</div>
                    <div className="text-sm text-slate-400">Due {task.due_date}</div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => completeTask(task.id)} className="big-button bg-green-600 px-8">Done</button>
                    <button onClick={() => deleteTask(task.id)} className="p-3 text-red-400 hover:bg-red-950 rounded-xl">
                      <Trash2 size={24} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div>
            <button onClick={() => alert("New Project - coming in full version")} className="big-button bg-blue-600 w-full mb-6 flex items-center justify-center gap-2">
              <Plus /> New Project (Car Flip / Repair)
            </button>

            {projects.map(p => (
              <div key={p.id} onClick={() => openProject(p)} className="bg-slate-900 p-6 rounded-2xl mb-4 cursor-pointer hover:bg-slate-800">
                <h3 className="text-xl font-semibold">{p.name}</h3>
                <p>Purchase: ${p.purchase_cost}</p>
              </div>
            ))}

            {selectedProject && (
              <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
                <div className="bg-slate-900 rounded-3xl w-full max-w-lg p-8">
                  <h2 className="text-2xl mb-6">{selectedProject.name}</h2>
                  
                  <button onClick={logMileage} className="big-button bg-amber-600 w-full mb-3">Log Mileage (km)</button>
                  <button onClick={() => alert("Log Time - coming soon")} className="big-button bg-purple-600 w-full mb-3">Log Time</button>
                  <button onClick={() => alert("Add Expense - coming soon")} className="big-button bg-emerald-600 w-full mb-8">Add Parts / Expense</button>

                  <button onClick={markSold} className="big-button bg-green-600 w-full">Mark as Sold</button>
                  <button onClick={() => setSelectedProject(null)} className="mt-4 text-slate-400">Close</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="text-center py-20">
            <h2 className="text-2xl mb-4">Reports</h2>
            <p className="text-slate-400">Full reports with category breakdowns coming in the complete version.</p>
          </div>
        )}
      </div>
    </div>
  );
}
