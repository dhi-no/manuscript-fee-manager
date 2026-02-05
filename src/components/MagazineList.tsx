import { useState } from 'react';
import { useData } from '../context/DataContext';
import { IssueDetail } from './IssueDetail';
import { DoubleCheckEntry } from './DoubleCheckEntry';

type ViewMode = 'list' | 'detail' | 'doubleCheck';

export function MagazineList() {
  const { data, addMagazine, updateMagazine, deleteMagazine, addIssue } = useData();
  const [magazineName, setMagazineName] = useState('');
  const [editingMagazineId, setEditingMagazineId] = useState<string | null>(null);
  const [selectedMagazineId, setSelectedMagazineId] = useState<string | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // 号の追加フォーム用
  const [showAddIssue, setShowAddIssue] = useState<string | null>(null);
  const [issueNumber, setIssueNumber] = useState('');
  const [releaseDate, setReleaseDate] = useState('');

  const handleMagazineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!magazineName.trim()) return;

    if (editingMagazineId) {
      updateMagazine(editingMagazineId, { name: magazineName.trim() });
      setEditingMagazineId(null);
    } else {
      addMagazine({ name: magazineName.trim() });
    }
    setMagazineName('');
  };

  const handleEditMagazine = (id: string) => {
    const magazine = data.magazines.find(m => m.id === id);
    if (magazine) {
      setMagazineName(magazine.name);
      setEditingMagazineId(id);
    }
  };

  const handleCancelMagazine = () => {
    setMagazineName('');
    setEditingMagazineId(null);
  };

  const handleAddIssue = (magazineId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!issueNumber.trim() || !releaseDate) return;

    addIssue(magazineId, {
      issueNumber: issueNumber.trim(),
      releaseDate,
    });
    setIssueNumber('');
    setReleaseDate('');
    setShowAddIssue(null);
  };

  // 号の詳細画面またはダブルチェック画面が選択されている場合
  if (selectedMagazineId && selectedIssueId) {
    const magazine = data.magazines.find(m => m.id === selectedMagazineId);
    const issue = magazine?.issues.find(i => i.id === selectedIssueId);

    if (magazine && issue) {
      const handleBack = () => {
        setSelectedMagazineId(null);
        setSelectedIssueId(null);
        setViewMode('list');
      };

      if (viewMode === 'doubleCheck') {
        return (
          <DoubleCheckEntry
            magazine={magazine}
            issue={issue}
            onBack={handleBack}
          />
        );
      }

      return (
        <IssueDetail
          magazine={magazine}
          issue={issue}
          onBack={handleBack}
        />
      );
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">雑誌管理</h2>

      {/* 雑誌追加フォーム */}
      <form onSubmit={handleMagazineSubmit} className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            雑誌名
          </label>
          <input
            type="text"
            value={magazineName}
            onChange={e => setMagazineName(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="雑誌名を入力"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {editingMagazineId ? '更新' : '追加'}
          </button>
          {editingMagazineId && (
            <button
              type="button"
              onClick={handleCancelMagazine}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              キャンセル
            </button>
          )}
        </div>
      </form>

      {/* 雑誌一覧 */}
      {data.magazines.length === 0 ? (
        <p className="text-gray-500">雑誌が登録されていません</p>
      ) : (
        <div className="space-y-6">
          {data.magazines.map(magazine => (
            <div key={magazine.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{magazine.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditMagazine(magazine.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => deleteMagazine(magazine.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    削除
                  </button>
                </div>
              </div>

              {/* 号の追加ボタン */}
              {showAddIssue === magazine.id ? (
                <form
                  onSubmit={e => handleAddIssue(magazine.id, e)}
                  className="mb-4 p-4 bg-gray-50 rounded-md space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        号数
                      </label>
                      <input
                        type="text"
                        value={issueNumber}
                        onChange={e => setIssueNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="例: 2024年3月号"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        発売日
                      </label>
                      <input
                        type="date"
                        value={releaseDate}
                        onChange={e => setReleaseDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      号を追加
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddIssue(null);
                        setIssueNumber('');
                        setReleaseDate('');
                      }}
                      className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
                    >
                      キャンセル
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowAddIssue(magazine.id)}
                  className="mb-4 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  号を追加
                </button>
              )}

              {/* 号の一覧 */}
              {magazine.issues.length === 0 ? (
                <p className="text-gray-500 text-sm">号が登録されていません</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          号数
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          発売日
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          作品数
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {magazine.issues.map(issue => (
                        <tr key={issue.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">{issue.issueNumber}</td>
                          <td className="px-4 py-2">{issue.releaseDate}</td>
                          <td className="px-4 py-2 text-center">{issue.works.length}</td>
                          <td className="px-4 py-2 text-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedMagazineId(magazine.id);
                                setSelectedIssueId(issue.id);
                                setViewMode('doubleCheck');
                              }}
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
                            >
                              ダブルチェック
                            </button>
                            <button
                              onClick={() => {
                                setSelectedMagazineId(magazine.id);
                                setSelectedIssueId(issue.id);
                                setViewMode('detail');
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              詳細
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
