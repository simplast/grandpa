import chalk from "chalk";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  SUCCESS = 2,
  WARN = 3,
  ERROR = 4,
}

export class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  info(message: string): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`${chalk.blue("ℹ")} ${message}`);
    }
  }

  success(message: string): void {
    if (this.level <= LogLevel.SUCCESS) {
      console.log(`${chalk.green("✔")} ${message}`);
    }
  }

  warn(message: string): void {
    if (this.level <= LogLevel.WARN) {
      console.log(`${chalk.yellow("⚠")} ${message}`);
    }
  }

  error(message: string): void {
    if (this.level <= LogLevel.ERROR) {
      console.log(`${chalk.red("✖")} ${message}`);
    }
  }

  debug(message: string): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`${chalk.gray("debug")} ${message}`);
    }
  }
}