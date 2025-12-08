use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, Runtime};

/// Backend process wrapper for lifecycle management
struct BackendProcess(Mutex<Option<Child>>);

/// Start the Python backend executable from the resources directory
fn start_backend<R: Runtime>(app: &AppHandle<R>) -> Result<Child, String> {
    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource directory: {}", e))?;

    let backend_name = if cfg!(windows) {
        "resources/backend.exe"
    } else {
        "resources/backend"
    };

    let backend_path = resource_dir.join(backend_name);

    if !backend_path.exists() {
        return Err(format!(
            "Backend executable not found at: {}",
            backend_path.display()
        ));
    }

    println!("Starting backend from: {}", backend_path.display());

    let child = Command::new(&backend_path)
        .spawn()
        .map_err(|e| format!("Failed to spawn backend process: {}", e))?;

    println!("Backend process started with PID: {:?}", child.id());

    Ok(child)
}

/// Wait for the backend to become ready by polling the health endpoint
fn wait_for_backend() -> Result<(), String> {
    let backend_url = "http://127.0.0.1:8000/";
    let max_retries = 20;
    let retry_delay = std::time::Duration::from_millis(500);

    println!("Waiting for backend to be ready at {}", backend_url);

    for attempt in 1..=max_retries {
        match ureq::get(backend_url).call() {
            Ok(_) => {
                println!("Backend is ready!");
                return Ok(());
            }
            Err(e) => {
                if attempt == max_retries {
                    return Err(format!(
                        "Backend failed to start after {} attempts: {}",
                        max_retries, e
                    ));
                }
                println!("Attempt {}/{}: Backend not ready yet...", attempt, max_retries);
                std::thread::sleep(retry_delay);
            }
        }
    }

    Err("Backend startup timeout".to_string())
}

/// Cleanup the backend process on app shutdown
fn cleanup_backend(backend_process: &BackendProcess) {
    if let Ok(mut child_opt) = backend_process.0.lock() {
        if let Some(mut child) = child_opt.take() {
            println!("Stopping backend process...");
            match child.kill() {
                Ok(_) => println!("Backend process terminated"),
                Err(e) => eprintln!("Failed to kill backend process: {}", e),
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Start the backend process
            let child = start_backend(&app.handle())?;

            // Store the process in app state
            app.manage(BackendProcess(Mutex::new(Some(child))));

            // Wait for backend to be ready
            wait_for_backend()?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                // Cleanup backend when window is closed
                let backend_process = window.state::<BackendProcess>();
                cleanup_backend(&backend_process);
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
