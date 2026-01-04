export interface Project {
    id: string;
    name: string;
    path: string;
    ssh_key_path?: string;
    notes?: string;
}

export interface SshHostModel {
    host: string;
    hostname: string;
    user?: string;
    port?: number;
    identity_file?: string;
}

export interface Snippet {
    id: string;
    project_id: string;
    label: string;
    command: string;
    description?: string;
}

export interface ProjectKey {
    id: string;
    project_id: string;
    name: string;
    key_reference: string;
    created_at: string;
}
