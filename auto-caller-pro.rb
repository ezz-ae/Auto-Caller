class AutoCallerPro < Formula
  desc "Call leads automatically with AI voice. 100% local, 100% private."
  homepage "https://autocaller.pro"
  version "1.0.1"
  
  depends_on "bun" => :build
  depends_on "node"
  
  def install
    # Create app directory
    pkgshare.install Dir["*"]
    
    # Create wrapper script
    (bin/"auto-caller").write <<~EOS
      #!/bin/bash
      cd "#{pkgshare}"
      bun run dev
    EOS
    
    chmod 0755, bin/"auto-caller"
  end
  
  def caveats
    <<~EOS
      🎉 Auto Caller Pro installed!
      
      To start:
        auto-caller
      
      Then open: http://localhost:3000
      
      Chrome Extension:
        1. Go to chrome://extensions
        2. Enable "Developer mode"
        3. Click "Load unpacked"
        4. Select the chrome-extension folder in:
           #{pkgshare}/chrome-extension
      
      Your AI. Your machine. Your rules.
    EOS
  end
  
  test do
    system "true"
  end
end
