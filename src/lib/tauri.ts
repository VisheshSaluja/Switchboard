import { invoke } from "@tauri-apps/api/core";

const isTauri = () => {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

export async function invokeCommand<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
    if (!isTauri()) {
        console.warn(`[Mock Mode] Tauri not detected. Command '${cmd}' simulated.`);
        // Return mock data or throw helpful error
        if (cmd === 'list_projects') return [] as T;
        if (cmd === 'get_ssh_hosts') return [] as T;
        throw new Error(`Tauri environment not found. Please run with 'npx tauri dev' and use the Application Window, not the browser.`);
    }

    try {
        return await invoke<T>(cmd, args);
    } catch (error) {
        console.error(`Tauri command '${cmd}' failed:`, error);
        throw error;
    }
}
