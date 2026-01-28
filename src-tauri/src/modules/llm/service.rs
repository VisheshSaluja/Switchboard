use std::path::PathBuf;
use std::fs;
use anyhow::{Result, anyhow};

const MODEL_REPO: &str = "TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF"; 
const MODEL_FILE: &str = "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf";
const TOKENIZER_REPO: &str = "TinyLlama/TinyLlama-1.1B-Chat-v1.0";
const TOKENIZER_FILE: &str = "tokenizer.json";

pub struct LLMService {
    app_data_dir: PathBuf,
}

impl LLMService {
    pub fn new(app_data_dir: PathBuf) -> Self {
        Self {
            app_data_dir,
        }
    }

    fn get_models_dir(&self) -> PathBuf {
        self.app_data_dir.join("models")
    }

    pub fn get_model_path(&self) -> PathBuf {
        self.get_models_dir().join(MODEL_FILE)
    }

    pub fn get_tokenizer_path(&self) -> PathBuf {
        self.get_models_dir().join(TOKENIZER_FILE)
    }

    pub fn check_model_status(&self) -> (bool, f32) {
        let path = self.get_model_path();
        let tokenizer_path = self.get_tokenizer_path();
        if path.exists() && tokenizer_path.exists() {
            return (true, 100.0);
        }
        (false, 0.0)
    }

    pub async fn download_model<R: tauri::Runtime>(&self, app_handle: &tauri::AppHandle<R>) -> Result<PathBuf> {
        let dest = self.get_model_path();
        let tokenizer_dest = self.get_tokenizer_path();
        
        let models_dir = self.get_models_dir();
        if !models_dir.exists() {
            fs::create_dir_all(&models_dir)?;
        }
        
        // 1. Download Model
        if !dest.exists() {
            let url = format!("https://huggingface.co/{}/resolve/main/{}", MODEL_REPO, MODEL_FILE);
            
            let client = reqwest::Client::new();
            let response = client.get(&url).send().await?;
            
            let total_size = response.content_length().unwrap_or(0);
            
            use futures_util::StreamExt;
            use std::io::Write;
            use tauri::Emitter;

            let mut file = fs::File::create(&dest)?;
            let mut downloaded: u64 = 0;
            let mut stream = response.bytes_stream();

            while let Some(item) = stream.next().await {
                let chunk = item?;
                file.write_all(&chunk)?;
                downloaded += chunk.len() as u64;

                if total_size > 0 {
                    let progress = (downloaded as f64 / total_size as f64) * 100.0;
                    let _ = app_handle.emit("llm:download-progress", progress);
                }
            }
        }

        // 2. Download Tokenizer
        if !tokenizer_dest.exists() {
             let url = format!("https://huggingface.co/{}/resolve/main/{}", TOKENIZER_REPO, TOKENIZER_FILE);
             let response = reqwest::get(&url).await?;
             let content = response.bytes().await?;
             fs::write(&tokenizer_dest, content)?;
        }

        Ok(dest)
    }

    pub fn build_context(&self, project_path: &str) -> Result<String> {
        let root = PathBuf::from(project_path);
        let mut context = String::new();

        context.push_str("Project Structure:\n");
        
        let walker = walkdir::WalkDir::new(&root)
            .into_iter()
            .filter_entry(|e| !is_ignored(e));

        let mut file_tree = String::new();
        let mut manifests = String::new();
        let mut key_files = String::new();

        for entry in walker.filter_map(|e| e.ok()) {
            let path = entry.path();
            if let Ok(relative) = path.strip_prefix(&root) {
                let depth = relative.components().count();
                if depth > 4 { continue; } // Max depth

                let indent = "  ".repeat(depth);
                let name = relative.file_name().unwrap_or_default().to_string_lossy();
                file_tree.push_str(&format!("{}{}\n", indent, name));

                // Check for manifests
                if name == "package.json" || name == "Cargo.toml" || name == "requirements.txt" {
                     if let Ok(content) = fs::read_to_string(path) {
                         manifests.push_str(&format!("\n--- {} ---\n{}\n", name, content));
                     }
                }

                // Check for key files (simple heuristic)
                if (name.ends_with(".rs") || name.ends_with(".tsx") || name.ends_with(".js") || name.ends_with(".py")) 
                   && (name.starts_with("main") || name.starts_with("App") || name.starts_with("index") || name.starts_with("server")) {
                     if let Ok(content) = fs::read_to_string(path) {
                         let sample: String = content.lines().take(50).collect::<Vec<_>>().join("\n");
                         key_files.push_str(&format!("\n--- {} (First 50 lines) ---\n{}\n", name, sample));
                     }
                }
            }
        }

        // Limit context size strictly to prevent context overflow (TinyLlama context is 2048)
        let max_chars = 2000; // ~500 tokens
        if key_files.len() > max_chars {
             key_files.truncate(max_chars);
             key_files.push_str("\n... (truncated)\n");
        }

        context.push_str(&file_tree);
        context.push_str("\n\nManifests:");
        context.push_str(&manifests);
        context.push_str("\n\nKey Files Content:");
        context.push_str(&key_files);

        Ok(context)
    }

    pub fn run_inference(&self, prompt: &str) -> Result<String> {
        use candle_core::{Device, Tensor, DType};
        use candle_transformers::models::quantized_llama as model;
        use tokenizers::Tokenizer;

        let model_path = self.get_model_path();
        let tokenizer_path = self.get_tokenizer_path();

        if !model_path.exists() || !tokenizer_path.exists() {
            return Err(anyhow!("Model or tokenizer not found"));
        }

        // Device selection (Force CPU due to Metal RMSNorm missing kernel)
        let device = Device::Cpu;

        // 1. Load Model
        let mut file = std::fs::File::open(&model_path)?;
        let content = candle_core::quantized::gguf_file::Content::read(&mut file)?;
        let mut model = model::ModelWeights::from_gguf(content, &mut file, &device)?;
        
        // 2. Load Tokenizer (local)
        let tokenizer = Tokenizer::from_file(&tokenizer_path).map_err(|e| anyhow!(e))?;

        // 3. Prompt Template (TinyLlama ChatML-like)
        let formatted_prompt = format!("<|system|>\nYou are a helpful assistant.\n</s>\n<|user|>\n{}</s>\n<|assistant|>", prompt);
        let tokens = tokenizer.encode(formatted_prompt, true).map_err(|e| anyhow!(e))?.get_ids().to_vec();

        // Safety check for context window
        if tokens.len() > 1800 {
            return Err(anyhow!("Context too long ({} tokens). Max supported is ~2048. Please try a smaller project scope.", tokens.len()));
        }

        println!("Starting inference with {} tokens...", tokens.len());

        // 4. Inference Loop
        let mut output = String::new();
        let max_tokens = 1000;
        
        use candle_transformers::generation::LogitsProcessor;
        let mut logits_processor = LogitsProcessor::new(299792458, Some(0.7), Some(0.9));

        // Prefill
        println!("Prefilling...");
        let input = Tensor::new(tokens.as_slice(), &device)?.unsqueeze(0)?;
        println!("Input shape: {:?}", input.shape());
        
        let logits = model.forward(&input, 0)?;
        println!("Forward Output shape: {:?}", logits.shape());
        
        let logits = match logits.rank() {
            3 => {
                // [1, seq_len, vocab_size] -> Get last token's logits
                // First squeeze batch: [seq_len, vocab_size]
                let logits = logits.squeeze(0)?;
                // Then get last row: [vocab_size]
                logits.get(logits.dim(0)? - 1)?
            },
            2 => {
                 // [1, vocab_size] -> Already last token's logits
                 logits.squeeze(0)?
            },
            _ => return Err(anyhow!("Unexpected logits rank: {}", logits.rank())),
        };
        
        let logits = logits.to_dtype(DType::F32)?;
        println!("Final Logits shape (expect [vocab]): {:?}", logits.shape());
        
        // Use Greedy Sampling
        let mut next_token = logits.argmax(0)?.to_scalar::<u32>()?;
        
        if let Some(text) = tokenizer.decode(&[next_token], true).ok() {
             output.push_str(&text);
        }

        let mut current_pos = tokens.len();

        for i in 0..max_tokens {
            if next_token == tokenizer.token_to_id("<|end|>").unwrap_or(32000) {
                 break;
            }
            
            let input = Tensor::new(&[next_token], &device)?.unsqueeze(0)?;
            let logits = model.forward(&input, current_pos)?;
            let logits = logits.squeeze(0)?.squeeze(0)?.to_dtype(DType::F32)?;
            
            // Greedy sampling
            next_token = logits.argmax(0)?.to_scalar::<u32>()?;
            current_pos += 1;

            if let Some(text) = tokenizer.decode(&[next_token], true).ok() {
                output.push_str(&text);
            }
        }
        
        Ok(output)
    }
}

fn is_ignored(entry: &walkdir::DirEntry) -> bool {
    let name = entry.file_name().to_string_lossy();
    name.starts_with('.') || name == "node_modules" || name == "target" || name == "dist" || name == "build"
}
