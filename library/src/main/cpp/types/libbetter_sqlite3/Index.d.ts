/**
 * better-sqlite3 N-API type definitions
 * 供 ArkTS 调用时做类型提示
 */

export interface DatabaseOptions {
  readonly?: boolean;
  mustExist?: boolean;
  timeout?: number;
}

export interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

export interface Statement {
  bind(...params: any[]): Statement;
  run(...params: any[]): RunResult;
  get(...params: any[]): any;
  all(...params: any[]): any[];
  iterate(...params: any[]): StatementIterator;
  pluck(toggle?: boolean): Statement;
  expand(toggle?: boolean): Statement;
  raw(toggle?: boolean): Statement;
  safeIntegers(toggle?: boolean): Statement;
  columns(): string[];
  reset(): void;
  free(): boolean;
  busy: boolean;
  readonly: boolean;
  source: string;
  returnsData: boolean;
}

export interface StatementIterator {
  next(): IterationResult;
  return(): IterationResult;
  [Symbol.iterator](): StatementIterator;
  statement: Statement;
}

export interface IterationResult {
  done: boolean;
  value: any;
}

export interface Backup {
  step(pages?: number): BackupResult;
  complete(): void;
  close(): void;
}

export interface BackupResult {
  totalPages: number;
  remainingPages: number;
  completed: boolean;
}

export interface Database {
  open(filename: string, options?: DatabaseOptions): Database;
  close(): void;
  exec(sql: string): void;
  prepare(sql: string): Statement;
  pragma(pragma: string, simple?: boolean): any;
  function(name: string, fn: Function, argc?: number): void;
  aggregate(name: string, init: any, step: Function, finalize?: Function): void;
  loadExtension(path: string, entryPoint?: string): void;
  serialize(schema?: string): ArrayBuffer;
  backup(database: Database, attachedName: string, destFile: string, unlink?: boolean): Backup;
  defaultSafeIntegers(toggle?: boolean): void;
  unsafeMode(toggle?: boolean): void;
  readonly open: boolean;
  readonly inTransaction: boolean;
  readonly changes: number;
  readonly lastInsertRowid: number | bigint;
}

declare const Database: {
  new(filename: string, options?: DatabaseOptions): Database;
};

export default Database;
