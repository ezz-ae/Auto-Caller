# MCP Integration Guide

## What is MCP?

**Model Context Protocol (MCP)** lets AI assistants like Claude control your app directly.

Instead of opening the app and clicking buttons, you just tell the AI what to do:

```
You: "Call these 50 leads about the Downtown Dubai project"

Claude: ✓ Using auto-caller MCP
        ✓ Starting campaign with 50 numbers
        ✓ Campaign started - 3 connected so far
```

## Setup for Users

### 1. Claude Desktop

Add to your Claude config file:

**Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "auto-caller": {
      "command": "bun",
      "args": ["run", "mcp-server.ts"],
      "cwd": "/path/to/auto-caller-pro"
    }
  }
}
```

### 2. Restart Claude Desktop

### 3. Done! Now say:

```
"Start calling these numbers: +971501234567, +971509876543"
```

## Available MCP Commands

| Command | What It Does |
|---------|--------------|
| `start_campaign` | Start calling numbers |
| `stop_campaign` | Stop current campaign |
| `get_status` | Check credits & progress |
| `configure` | Set API keys |
| `list_voices` | Get available voices |

## Example Prompts

```
"Start calling my leads about the Marina project"
"Stop the current campaign"
"How many credits do I have left?"
"Configure my Twilio account: SID=xxx, Token=xxx"
```

## The Game Changer

MCP transforms your app from a **tool** into an **AI agent capability**.

This means:
- ✅ Users can control via voice/chat
- ✅ Works with Claude, GPT-4, Cursor, etc.
- ✅ Automated workflows
- ✅ 24/7 operation without manual control

**This is what makes it worth $97-397 instead of $20.**
