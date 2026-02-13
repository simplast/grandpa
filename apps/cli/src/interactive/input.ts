import readline from "readline";

export class InteractiveInput {
  private rl: readline.Interface;
  private buffer: string = "";
  private isShiftPressed: boolean = false;
  private resolveInput: ((value: string) => void) | null = null;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    // 监听原始按键事件
    process.stdin.setRawMode(true);
    process.stdin.on("keypress", (str, key) => {
      // Ctrl+C 退出
      if (key && key.ctrl && key.name === "c") {
        process.exit(0);
      }

      // 检测 Shift 键状态
      if (key && key.name === "shift") {
        this.isShiftPressed = true;
      }

      // 检测 Enter 键
      if (key && key.name === "return") {
        if (this.isShiftPressed) {
          // Shift+Enter: 换行
          this.buffer += "\n";
          process.stdout.write("\n");
        } else {
          // 单独 Enter: 发送消息
          if (this.resolveInput) {
            const message = this.buffer.trim();
            this.buffer = "";
            this.rl.removeAllListeners("line");
            this.resolveInput(message);
            this.resolveInput = null;
          }
        }
      }
    });

    // 检测 Shift 键释放
    process.stdin.on("keypress", (_str, key) => {
      if (key && key.name === "shift") {
        this.isShiftPressed = false;
      }
    });
  }

  async prompt(): Promise<string> {
    return new Promise((resolve) => {
      this.buffer = "";
      this.resolveInput = resolve;

      process.stdout.write("grandpa > ");

      this.rl.on("line", (line) => {
        // 检查是否是 exit 命令
        if (line.trim().toLowerCase() === "exit") {
          this.rl.close();
          process.exit(0);
        }

        // 将输入添加到缓冲区
        if (this.buffer.length > 0) {
          this.buffer += "\n";
        }
        this.buffer += line;
      });
    });
  }

  close() {
    this.rl.close();
  }
}
