# Mistral for Copilot

[![Tests](https://github.com/selfagency/mistral-models-vscode/actions/workflows/ci.yml/badge.svg)](https://github.com/selfagency/mistral-models-vscode/actions/workflows/ci.yml) [![codecov](https://codecov.io/gh/selfagency/mistral-models-vscode/graph/badge.svg?token=0gHudqeY4p)](https://codecov.io/gh/selfagency/mistral-models-vscode)

<p align="center">
  <img src="logo.png" alt="Mistral AI Logo" width="128" height="128">
</p>

<p align="center">
  <strong>Access Mistral AI models within GitHub Copilot Chat</strong>
</p>

<p align="center">
  <a href="https://mistral.ai">🌐 Mistral AI</a> •
  <a href="https://docs.mistral.ai/api">📖 API Docs</a> •
  <a href="https://console.mistral.ai/">🔑 Get API Key</a>
</p>

<p align="center">
  <small>ℹ️ Forked from <a href="https://github.com/OEvortex/vscode-mistral-copilot-chat">OEvortex/vscode-mistral-copilot-chat</a>, which has been discontinued</small>
</p>

## ✨ Features

- 🧠 **All Mistral Models** - Every Mistral chat-capable model fetched dynamically from the API
- 🔀 **Model Picker** - Select Mistral models via the model selector dropdown on any Copilot Chat conversation
- 💬 **Chat Participant** - Invoke `@mistral` directly in Copilot Chat for a dedicated, history-aware Mistral conversation
- 🔧 **Tool Calling** - Function calling support for agentic workflows
- 🖼️ **Vision** - Image input support for models that support it
- 🔒 **Secure** - API key stored using VS Code's encrypted secrets API
- ⚡ **Streaming** - Real-time response streaming for faster interactions

## 🔧 Requirements

- **VS Code** 1.109.0 or higher
- **GitHub Copilot Chat** extension installed
- A valid **Mistral AI API key**

## 🚀 Installation

1. **Install from VS Code Marketplace** (or install the `.vsix` file)
2. **Open Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. **Run:** `Mistral: Manage API Key`
4. **Enter your API key** from [console.mistral.ai](https://console.mistral.ai/)

## 🔑 Getting Your API Key

1. Go to [Mistral AI Console](https://console.mistral.ai/)
2. Sign up or log in with your account
3. Navigate to **API Keys** section
4. Click **Create new key**
5. Copy the key and paste it into VS Code when prompted

## 💬 Usage

### Model Picker

To use a Mistral model in an existing Copilot Chat conversation without the `@mistral` handle:

1. Open **GitHub Copilot Chat** panel in VS Code
2. Click the **model selector** dropdown
3. Choose a **Mistral AI** model
4. Start chatting!

### Chat Participant

Type `@mistral` in any Copilot Chat input to direct the conversation to Mistral AI. The participant is sticky — once invoked, it stays active for the thread.

```text
@mistral explain the architecture of this project
```

## 🛡️ Privacy & Security

- Your API key is stored securely using VS Code's encrypted secrets API
- No data is stored by this extension - all requests go directly to Mistral AI
- See [Mistral AI Privacy Policy](https://mistral.ai/privacy) for details

## 🛠️ Development

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) (version pinned in `package.json`)
- [VS Code](https://code.visualstudio.com/) 1.109.0+

### Build

```bash
pnpm install
pnpm run compile        # type-check + lint + bundle
pnpm run watch          # parallel watch for type-check and bundle
```

### Testing

```bash
pnpm test               # unit tests (Vitest)
pnpm run test:coverage  # unit tests with coverage
pnpm run test:extension # VS Code integration tests
```

### Debugging

Open the project in VS Code and press **F5** to launch the Extension Development Host with the extension loaded.

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

Forked from [OEvortex/vscode-mistral-copilot-chat](https://github.com/OEvortex/vscode-mistral-copilot-chat) by OEvortex.
Maintained by [Daniel Sieradski](https://self.agency) ([@selfagency](https://github.com/selfagency)).
