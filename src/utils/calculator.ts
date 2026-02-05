import type { Work, Author } from '../types';
import { COLOR_RATE_MULTIPLIER } from '../types';

// 4C単価を計算（1C単価 × 1.3）
export function calculate4CRate(rate1C: number): number {
  return Math.round(rate1C * COLOR_RATE_MULTIPLIER);
}

// 作品の原稿料を計算
export function calculateWorkFee(work: Work, author: Author | undefined): number {
  if (!author) return 0;

  const rate1C = author.ratePerPage1C;
  const rate4C = calculate4CRate(rate1C);

  const fee1C = work.pages1C * rate1C;
  const fee4C = work.pages4C * rate4C;

  return fee1C + fee4C;
}

// 作品の合計ページ数
export function calculateTotalPages(work: Work): number {
  return work.pages1C + work.pages4C;
}

// 金額をフォーマット（円表記）
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);
}
