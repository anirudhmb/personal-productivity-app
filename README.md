# Personal Productivity App

A Tauri application built with vanilla HTML, CSS, and JavaScript frontend and Rust backend.

## Project Structure

This project follows the standard Tauri structure:

- **Frontend** (`src/`): Web interface with HTML, CSS, and JavaScript
- **Backend** (`src-tauri/`): Rust application with Tauri commands
- **Configuration**: `tauri.conf.json` for app settings and `Cargo.toml` for Rust dependencies

## Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Rust** - [Install via rustup](https://rustup.rs/)

To verify your installations:
```bash
node --version
rustc --version
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

This will install the Tauri CLI and other development dependencies.

### 2. Run in Development Mode

```bash
npm run tauri dev
```

This command will:
- Compile the Rust backend
- Start the development server
- Launch the desktop application window

**Note**: The first run may take a few minutes as Tauri compiles the Rust dependencies.

### 3. Build for Production

To create a production build:

```bash
npm run tauri build
```

This will create an installer in the `src-tauri/target/release/bundle/` directory.

## How It Works

The application demonstrates basic Tauri functionality:

1. **Frontend** (`src/index.html`): Contains a simple form with a text input
2. **JavaScript** (`src/main.js`): Handles form submission and calls Rust functions via `invoke()`
3. **Rust Backend** (`src-tauri/src/lib.rs`): Contains the `greet` command that processes the input
4. **Communication**: Data flows between frontend and backend through Tauri's IPC system

## Development

- Modify the frontend in the `src/` directory
- Add new Rust commands in `src-tauri/src/lib.rs` using the `#[tauri::command]` attribute
- Update the Tauri configuration in `src-tauri/tauri.conf.json`

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
