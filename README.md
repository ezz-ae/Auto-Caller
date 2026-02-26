# 🔥 Auto Caller Pro

**AI-Controlled Lead Calling. 100% Local. One-Time Payment.**

*by [1hundred.ai](https://1hundred.ai)*

---

## The Pitch

**Stop manually calling leads. Let AI do it.**

Paste numbers → AI calls them → Forwards answered calls to your phone → You close deals.

```
Your AI Assistant: "I'll call these 50 leads for you"
       ↓
Auto Caller Pro: Calls each number with AI voice
       ↓
Prospect answers? → CALL FORWARDED TO YOUR PHONE
       ↓
You talk to hot leads only. No more cold calling.
```

---

## Quick Start

```bash
# Option 1: Clone & Run
git clone [your-repo]
cd auto-caller-pro
./install.sh

# Option 2: Homebrew
brew install auto-caller-pro
auto-caller
```

**Open:** http://localhost:3000

**Done.**

---

## Why This Is Different

| Most Auto-Dialers | Auto Caller Pro |
|-------------------|-----------------|
| Manual operation | AI-controllable via MCP |
| Learn the interface | Use your existing AI assistant |
| Click buttons | Natural language commands |
| Software to manage | Software that manages itself |

**"Hey Claude, call these leads with this script..."** and it happens.

---

## MCP Integration (The Secret Sauce)

This app speaks **Model Context Protocol (MCP)**. That means:

- ✅ Control it from Claude, ChatGPT, or any MCP-compatible AI
- ✅ No new interface to learn
- ✅ Natural language commands
- ✅ Automated workflows

### Setup

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "auto-caller": {
      "command": "node",
      "args": ["./mcp-server.ts"]
    }
  }
}
```

### Use

```
You: "Claude, I have these 20 phone numbers from an open house.
     Call them saying 'Hi, thanks for visiting our property at 
     Downtown Tower. Are you still interested?' Forward answered
     calls to my cell at +971 50 123 4567."

Claude: "I've started the campaign. So far: 3 answered (forwarded
        to your phone), 5 voicemails left, 12 still calling."
```

**See [MCP-GUIDE.md](./MCP-GUIDE.md) for full documentation.**

---

## Features

| Feature | Description |
|---------|-------------|
| ✅ **100% Local** | Runs on your machine, no cloud needed |
| ✅ **Private** | Your data never leaves your device |
| ✅ **AI Voice** | ElevenLabs integration for natural speech |
| ✅ **Call Forwarding** | Hot leads forwarded to your phone instantly |
| ✅ **MCP Control** | Control via Claude, ChatGPT, or any AI assistant |
| ✅ **Chrome Extension** | Quick access from browser |
| ✅ **Credits System** | Track your usage |
| ✅ **Campaign History** | All calls logged locally |
| ✅ **PayPal Integration** | Buy credits in-app |

---

## Pricing

| Package | Price | Includes |
|---------|-------|----------|
| **Starter** | $97 | Full app + Chrome extension + 500 credits |
| **Pro** | $197 | Above + 1,500 credits + Priority support + MCP access |
| **Agency** | $397 | Above + 5,000 credits + White-label + Resell rights |

**No subscriptions. No monthly fees. Yours forever.**

**Buy at:** [1hundred.ai/pricing](https://1hundred.ai/pricing)

---

## Requirements

- macOS, Windows, or Linux
- Node.js 18+ (auto-installed by install script)
- Twilio account (pay-as-you-go, ~$0.01-0.02/min)
- ElevenLabs account (optional, free tier available)

---

## API Costs (You Control)

| Service | Cost | Notes |
|---------|------|-------|
| Twilio Voice | ~$0.01-0.02/min | Pay only for connected calls |
| ElevenLabs | Free tier available | Or $5/mo for more voices |

**Your costs. Your control. No markup.**

---

## Chrome Extension

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `chrome-extension` folder

Shows server status, credits, and quick dashboard access.

---

## Security

- ✅ All data stored locally in `data/` folder
- ✅ API keys never transmitted anywhere
- ✅ No telemetry, no tracking
- ✅ No cloud, no servers
- ✅ You own everything

---

## Environment Variables (Optional)

Create a `.env` file for PayPal integration:

```env
PAYPAL_MODE=sandbox  # or 'live' for production
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Support

- Email: support@1hundred.ai
- Website: [1hundred.ai](https://1hundred.ai)

---

## License

**One-time purchase. Single user. No redistribution.**

For agency/resell rights, see Agency tier.

---

<div align="center">

**Your AI. Your Machine. Your Rules.** 🔐

*Brought to you by [1hundred.ai](https://1hundred.ai)*

</div>
