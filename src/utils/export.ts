import type { AppData, Work, Author, Editor, Magazine, Issue } from '../types';
import { calculateWorkFee, calculate4CRate } from './calculator';

// JSONファイルとしてダウンロード
export function downloadAsJson(data: AppData, filename: string = 'manuscript-fee-data.json') {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// CSVファイルとしてダウンロード
export function downloadAsCsv(data: AppData, filename: string = 'manuscript-fee-data.csv') {
  const rows: string[][] = [];

  // ヘッダー行
  rows.push([
    '雑誌名',
    '号',
    '発売日',
    'タイトル',
    '作家名',
    '1C単価',
    '4C単価',
    '1Cページ数',
    '4Cページ数',
    '合計ページ数',
    '原稿料',
    '担当者',
  ]);

  // データ行
  data.magazines.forEach((magazine: Magazine) => {
    magazine.issues.forEach((issue: Issue) => {
      issue.works.forEach((work: Work) => {
        const author = data.authors.find((a: Author) => a.id === work.authorId);
        const editor = data.editors.find((e: Editor) => e.id === work.editorId);
        const fee = calculateWorkFee(work, author);

        rows.push([
          magazine.name,
          issue.issueNumber,
          issue.releaseDate,
          work.title,
          author?.name || '',
          author?.ratePerPage1C?.toString() || '',
          author ? calculate4CRate(author.ratePerPage1C).toString() : '',
          work.pages1C.toString(),
          work.pages4C.toString(),
          (work.pages1C + work.pages4C).toString(),
          fee.toString(),
          editor?.name || '',
        ]);
      });
    });
  });

  // CSVに変換（BOM付きUTF-8でExcel対応）
  const csvContent = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// JSONファイルを読み込み
export function readJsonFile(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const result = e.target?.result;
        if (typeof result === 'string') {
          const data = JSON.parse(result) as AppData;
          if (data.magazines && data.authors && data.editors) {
            resolve(data);
          } else {
            reject(new Error('Invalid data format'));
          }
        } else {
          reject(new Error('Failed to read file'));
        }
      } catch {
        reject(new Error('Invalid JSON format'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
