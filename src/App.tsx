import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects'>('dashboard');
  const [status, setStatus] = useState('Loading...');

  // Load data from Supabase when the app starts
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Filter out completed tasks so they disappear when you click "Done"
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .not('completed', 'is', true) 
        .order('created_at', { ascending: false });

      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      setTasks(tasksData || []);
      setProjects(projectsData || []);
      setStatus(`✅ Connected | ${tasksData?.length || 0} active tasks`);
    } catch (error: any) {
      console.error('Supabase error:', error);
      setStatus('❌ Failed to connect to database');
    }
  };

  const addTask = async () => {
    const title = prompt('Task name?');
    if (!title) return;

    // Matches the exact schema required by your table
    const { error } = await supabase.from('tasks').insert([{
      title,
      due_date: new Date().toISOString().split('T')[0],
      category: 'Personal',
      completed: false // Explicitly set to false on creation
    }]);

    if (error) {
      alert('Error saving task: ' + error.message);
    } else {
      loadData(); // Seamlessly refreshes the dashboard view
    }
  };

  const completeTask = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ completed: true })
      .eq('id', id);

    if (error) {
      alert('Error updating task: ' + error.message);
    } else {
      loadData(); // Instantly clears the task off your active screen list
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            ✅ Done
          </h1>
          <div className="text-sm text-green-400">{status}</div>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-900 rounded-2xl p-1 mb-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${activeTab === 'projects' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Projects
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <button
              onClick={addTask}
              className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl text-lg font-semibold mb-8 flex items-center justify-center gap-2 transition-colors"
            >
              <Plus size={22} /> Add New Task
            </button>

            <h2 className="text-xl font-semibold mb-4">Today's Priorities</h2>

            <div className="space-y-3">
              {tasks.length === 0 && (
                <p className="text-slate-400 text-center py-4">No tasks yet. Add one above.</p>
              )}
              {tasks.map((task) => (
                <div key={task.id} className="bg-slate-900 rounded-3xl p-5 flex justify-between items-center border border-slate-800">
                  <div>
                    <div className="font-medium text-lg">{task.title}</div>
                    <div className="text-sm text-slate-400 mt-1">🕒 {task.due_date} • <span className="capitalize">{task.category}</span></div>
                  </div>
                  <button
                    onClick={() => completeTask(task.id)}
                    className="bg-green-600 hover:bg-green-700 active:scale-95 transition-all px-6 py-2 rounded-2xl text-sm font-medium"
                  >
                    ✓ Done
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="text-center py-12 bg-slate-900 rounded-3xl border border-slate-800">
            <h2 className="text-2xl font-bold mb-4">Projects Tracker</h2>
            <p className="text-slate-400 max-w-sm mx-auto px-4">Car flips, heavy repairs, and logistics will populate here.</p>
            <p className="text-blue-400 text-sm mt-4 font-medium">Coming in next update</p>
          </div>
        )}
      </div>
    </div>
  );
}
