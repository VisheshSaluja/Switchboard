use portable_pty::PtyPair;
use std::sync::{Arc, Mutex};

// We need to store the PtyPair to keep the session alive and write to it.
// PtyPair contains (master, slave). We mostly need master to write to input and resize.
// Reading happens in a background thread that holds a clone/ref to master reader.

pub struct TerminalSession {
    pub pty_pair: PtyPair,
    // We might want to store extra metadata like process ID or project ID here
    pub project_id: String,
}

// Thread-safe container for sessions
pub type TerminalSessions = Arc<Mutex<std::collections::HashMap<String, TerminalSession>>>;
