import { useEffect, useState } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { ProjectCard } from './components/ProjectCard';
import { SSHHostList } from './components/SSHHostList';
import { ProjectWorkspace } from './components/Workspace/ProjectWorkspace';
import { useAppStore } from './stores/useAppStore';
import { Button } from './components/ui/button';
import { Plus } from 'lucide-react';
import { Toaster } from 'sonner';

function App() {
  const [view, setView] = useState<'projects' | 'ssh'>('projects');
  const [activeTerminalProject, setActiveTerminalProject] = useState<string | null>(null);
  
  const { 
    projects, 
    hosts, 
    fetchProjects, 
    fetchHosts,
    createProject 
  } = useAppStore();

  useEffect(() => {
    fetchProjects();
    fetchHosts();
  }, []);

  const handleLaunch = (id: string) => {
    setActiveTerminalProject(id);
  };

  const handleNewProject = async () => {
    // Mock interaction for now
    const name = `Project ${projects.length + 1}`;
    const path = `~/projects/${name.toLowerCase().replace(' ', '-')}`;
    await createProject(name, path);
  };

  return (
    <>
        <AppLayout 
            activeView={view} 
            onChangeView={setView} 
            onNewProject={handleNewProject}
        >
          {view === 'projects' ? (
            projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {projects.map(project => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    onLaunch={handleLaunch} 
                  />
                ))}
              </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-20 text-center border-2 border-dashed border-border/40 rounded-xl bg-muted/5 min-h-[400px]">
                    <div className="p-4 rounded-full bg-accent mb-6 shadow-xl">
                         <Plus className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-foreground">Welcome to Switchboard</h3>
                    <p className="text-muted-foreground mt-2 mb-8 max-w-sm">
                        Create your first developer workspace to manage secrets, environments, and terminals.
                    </p>
                    <Button onClick={handleNewProject} size="lg" className="shadow-lg shadow-blue-500/20">
                        Create Workspace
                    </Button>
                </div>
            )
          ) : (
            <SSHHostList hosts={hosts} />
          )}
        </AppLayout>
        
        {activeTerminalProject && (
            <ProjectWorkspace 
                project={projects.find(p => p.id === activeTerminalProject)!}
                onClose={() => setActiveTerminalProject(null)} 
            />
        )}
        <Toaster />
    </>
  );
}

export default App;
