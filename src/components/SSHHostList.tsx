import React from 'react';
import { Globe, User } from 'lucide-react';
import type { SshHostModel } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Button } from "./ui/button";

interface SSHHostListProps {
  hosts: SshHostModel[];
}

import { useState } from 'react';
import { SSHTerminalDialog } from './Terminal/SSHTerminalDialog';

export const SSHHostList: React.FC<SSHHostListProps> = ({ hosts }) => {
  const [activeHost, setActiveHost] = useState<string | null>(null);

  if (hosts.length === 0) {
    // ... existing empty state ...
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center border-2 border-dashed border-border/50 rounded-xl bg-muted/5">
        <div className="p-4 rounded-full bg-muted mb-4">
             <Globe className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">No SSH hosts found</h3>
        <p className="text-muted-foreground mt-2 max-w-sm">
            Add hosts to your <code className="text-xs bg-muted px-1.5 py-0.5 rounded">~/.ssh/config</code> file to see them here.
        </p>
      </div>
    );
  }

  return (
    <>
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm transition-all hover:shadow-md">
        <CardHeader>
            <CardTitle>SSH Connections</CardTitle>
            <CardDescription>Managed hosts from your SSH config.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
            <div className="w-full overflow-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/30 text-muted-foreground border-b border-border/50">
                    <tr>
                        <th className="px-6 py-3 font-medium w-[200px]">Host Alias</th>
                        <th className="px-6 py-3 font-medium">Hostname</th>
                        <th className="px-6 py-3 font-medium">User</th>
                        <th className="px-6 py-3 font-medium text-right">Action</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                    {hosts.map((host, idx) => (
                        <tr key={`${host.host}-${idx}`} className="group hover:bg-muted/40 transition-colors">
                            <td className="px-6 py-4 font-medium text-foreground flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                                {host.host}
                            </td>
                            <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{host.hostname}</td>
                            <td className="px-6 py-4">
                                {host.user ? (
                                    <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-medium">
                                        <User className="w-3 h-3" />
                                        {host.user}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground/40 italic text-xs">default</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    className="h-8 text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:shadow"
                                    onClick={() => setActiveHost(host.host)}
                                >
                                    Connect
                                </Button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </CardContent>
    </Card>

    {activeHost && (
        <SSHTerminalDialog 
            host={activeHost} 
            onClose={() => setActiveHost(null)} 
        />
    )}
    </>
  );
};
