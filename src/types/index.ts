// 作家マスタ
export interface Author {
  id: string;
  name: string;
  ratePerPage1C: number; // 1Cページ単価（円）
}

// 担当者マスタ
export interface Editor {
  id: string;
  name: string;
}

// チェックステータス
export type CheckStatus = 'draft' | 'first_check' | 'second_check' | 'confirmed' | 'discrepancy';

// 作品情報（1次入力）
export interface WorkEntry {
  title: string;
  authorId: string;
  editorId: string;
  pages1C: number;
  pages4C: number;
  startPage?: number; // 開始ページ（目次照合用）
  endPage?: number;   // 終了ページ（目次照合用）
}

// 作品情報
export interface Work {
  id: string;
  title: string;
  authorId: string;
  editorId: string;
  pages1C: number; // 1Cページ数
  pages4C: number; // 4Cページ数
  startPage?: number; // 開始ページ
  endPage?: number;   // 終了ページ
  // ダブルチェック用
  checkStatus: CheckStatus;
  firstEntry?: WorkEntry;  // 1次入力（入力者A）
  secondEntry?: WorkEntry; // 2次入力（入力者B）
  firstEntryBy?: string;   // 1次入力者
  secondEntryBy?: string;  // 2次入力者
  confirmedAt?: string;    // 確定日時
}

// 雑誌の号
export interface Issue {
  id: string;
  magazineId: string;
  issueNumber: string; // 例: "2024年3月号"
  releaseDate: string; // ISO 8601形式
  works: Work[];
}

// 雑誌
export interface Magazine {
  id: string;
  name: string;
  issues: Issue[];
}

// アプリケーション全体のデータ
export interface AppData {
  magazines: Magazine[];
  authors: Author[];
  editors: Editor[];
}

// 4C単価の倍率
export const COLOR_RATE_MULTIPLIER = 1.3;
