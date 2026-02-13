import readline from "readline";

export class InteractiveInput {
  private rl: readline.Interface;
  private buffer: string[] = [];

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    // 监听原始按键事件
    process.stdin.setRawMode(true);
    process.stdin.on("keypress", (_str, key) => {
      // Ctrl+C 退出
      if (key && key.ctrl && key.name === "c") {
        process.exit(0);
      }
    });
  }

  async prompt(): Promise<string> {
    return new Promise((resolve) => {
      this.buffer = [];

      const promptLine = () => {
        if (this.buffer.length === 0) {
          process.stdout.write("grandpa > ");
        } else {
          process.stdout.write("         > ");
        }
      };

      promptLine();

      this.rl.on("line", (line) => {
        // 检查是否是 exit 命令
        if (line.trim().toLowerCase() === "exit") {
          this.rl.close();
          process.exit(0);
        }

        // 如果缓冲区为空且输入为空行，继续等待
        if (line === "" && this.buffer.length === 0) {
          promptLine();
          return;
        }

        // 如果输入为空行但缓冲区有内容，发送消息
        if (line === "" && this.buffer.length > 0) {
          const message = this.buffer.join("\n").trim();
          if (message) {
            this.rl.removeAllListeners("line");
            resolve(message);
            return;
          }
        }

        // 非空行 - 添加到缓冲区
        if (line !== "") {
          this.buffer.push(line);
          process.stdout.write("\n");
          promptLine();
        }
      });
    });
  }

  close() {
    this.rl.close();
  }
}
