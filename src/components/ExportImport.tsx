import { useRef, useState } from 'react';
import { useData } from '../context/DataContext';
import { downloadAsJson, downloadAsCsv, readJsonFile } from '../utils/export';

export function ExportImport() {
  const { data, importData } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleExportJson = () => {
    downloadAsJson(data);
  };

  const handleExportCsv = () => {
    downloadAsCsv(data);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedData = await readJsonFile(file);
      const success = importData(JSON.stringify(importedData));
      if (success) {
        setImportStatus('success');
        setErrorMessage('');
      } else {
        setImportStatus('error');
        setErrorMessage('データ形式が正しくありません');
      }
    } catch (err) {
      setImportStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'インポートに失敗しました');
    }

    // ファイル入力をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">データの入出力</h2>

      <div className="space-y-6">
        {/* エクスポート */}
        <div>
          <h3 className="font-semibold mb-3">エクスポート（データ出力）</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportJson}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              JSON形式でダウンロード
            </button>
            <button
              onClick={handleExportCsv}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              CSV形式でダウンロード（Excel対応）
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            JSON形式は再インポートに使用できます。CSV形式はExcelで開けます。
          </p>
        </div>

        {/* インポート */}
        <div>
          <h3 className="font-semibold mb-3">インポート（データ読込）</h3>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={handleImportClick}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            JSONファイルを読み込む
          </button>
          <p className="mt-2 text-sm text-gray-600">
            以前エクスポートしたJSONファイルを読み込みます。現在のデータは上書きされます。
          </p>

          {importStatus === 'success' && (
            <div className="mt-3 p-3 bg-green-100 text-green-700 rounded-md">
              データのインポートが完了しました
            </div>
          )}
          {importStatus === 'error' && (
            <div className="mt-3 p-3 bg-red-100 text-red-700 rounded-md">
              エラー: {errorMessage}
            </div>
          )}
        </div>

        {/* データ統計 */}
        <div>
          <h3 className="font-semibold mb-3">現在のデータ</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-100 rounded-md">
              <div className="text-2xl font-bold">{data.magazines.length}</div>
              <div className="text-sm text-gray-600">雑誌</div>
            </div>
            <div className="p-4 bg-gray-100 rounded-md">
              <div className="text-2xl font-bold">
                {data.magazines.reduce((sum, m) => sum + m.issues.length, 0)}
              </div>
              <div className="text-sm text-gray-600">号</div>
            </div>
            <div className="p-4 bg-gray-100 rounded-md">
              <div className="text-2xl font-bold">{data.authors.length}</div>
              <div className="text-sm text-gray-600">作家</div>
            </div>
            <div className="p-4 bg-gray-100 rounded-md">
              <div className="text-2xl font-bold">{data.editors.length}</div>
              <div className="text-sm text-gray-600">担当者</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
