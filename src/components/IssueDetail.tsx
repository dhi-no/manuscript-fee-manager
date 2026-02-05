import { useState } from 'react';
import { useData } from '../context/DataContext';
import type { Magazine, Issue } from '../types';
import { calculateWorkFee, calculate4CRate, formatCurrency } from '../utils/calculator';

interface Props {
  magazine: Magazine;
  issue: Issue;
  onBack: () => void;
}

export function IssueDetail({ magazine, issue, onBack }: Props) {
  const { data, addWork, updateWork, deleteWork, updateIssue, deleteIssue } = useData();
  const [showWorkForm, setShowWorkForm] = useState(false);
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null);

  // 作品フォーム
  const [title, setTitle] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [editorId, setEditorId] = useState('');
  const [pages1C, setPages1C] = useState('');
  const [pages4C, setPages4C] = useState('');

  // 号の編集
  const [editingIssue, setEditingIssue] = useState(false);
  const [issueNumber, setIssueNumber] = useState(issue.issueNumber);
  const [releaseDate, setReleaseDate] = useState(issue.releaseDate);

  const resetWorkForm = () => {
    setTitle('');
    setAuthorId('');
    setEditorId('');
    setPages1C('');
    setPages4C('');
    setShowWorkForm(false);
    setEditingWorkId(null);
  };

  const handleWorkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !authorId || !editorId) return;

    const workData = {
      title: title.trim(),
      authorId,
      editorId,
      pages1C: parseInt(pages1C, 10) || 0,
      pages4C: parseInt(pages4C, 10) || 0,
      checkStatus: 'confirmed' as const, // 直接入力は確定済み扱い
    };

    if (editingWorkId) {
      updateWork(magazine.id, issue.id, editingWorkId, workData);
    } else {
      addWork(magazine.id, issue.id, workData);
    }
    resetWorkForm();
  };

  const handleEditWork = (workId: string) => {
    const work = issue.works.find(w => w.id === workId);
    if (work) {
      setTitle(work.title);
      setAuthorId(work.authorId);
      setEditorId(work.editorId);
      setPages1C(work.pages1C.toString());
      setPages4C(work.pages4C.toString());
      setEditingWorkId(workId);
      setShowWorkForm(true);
    }
  };

  const handleIssueUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueNumber.trim() || !releaseDate) return;
    updateIssue(magazine.id, issue.id, {
      issueNumber: issueNumber.trim(),
      releaseDate,
    });
    setEditingIssue(false);
  };

  const handleDeleteIssue = () => {
    if (confirm('この号を削除しますか？')) {
      deleteIssue(magazine.id, issue.id);
      onBack();
    }
  };

  // 合計原稿料を計算
  const totalFee = issue.works.reduce((sum, work) => {
    const author = data.authors.find(a => a.id === work.authorId);
    return sum + calculateWorkFee(work, author);
  }, 0);

  // 選択中の作家の単価を表示
  const selectedAuthor = data.authors.find(a => a.id === authorId);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          ← 戻る
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setEditingIssue(true)}
            className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800"
          >
            号を編集
          </button>
          <button
            onClick={handleDeleteIssue}
            className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800"
          >
            号を削除
          </button>
        </div>
      </div>

      {/* 号の情報 */}
      {editingIssue ? (
        <form onSubmit={handleIssueUpdate} className="mb-6 p-4 bg-gray-50 rounded-md space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">号数</label>
              <input
                type="text"
                value={issueNumber}
                onChange={e => setIssueNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">発売日</label>
              <input
                type="date"
                value={releaseDate}
                onChange={e => setReleaseDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm">
              更新
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingIssue(false);
                setIssueNumber(issue.issueNumber);
                setReleaseDate(issue.releaseDate);
              }}
              className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded-md text-sm"
            >
              キャンセル
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6">
          <h2 className="text-xl font-bold">
            {magazine.name} {issue.issueNumber}
          </h2>
          <p className="text-gray-600">発売日: {issue.releaseDate}</p>
        </div>
      )}

      {/* 合計表示 */}
      <div className="mb-6 p-4 bg-blue-50 rounded-md">
        <div className="flex justify-between items-center">
          <span className="font-medium">原稿料合計</span>
          <span className="text-2xl font-bold text-blue-600">{formatCurrency(totalFee)}</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">作品数: {issue.works.length}本</p>
      </div>

      {/* 作品追加フォーム */}
      {showWorkForm ? (
        <form onSubmit={handleWorkSubmit} className="mb-6 p-4 bg-gray-50 rounded-md space-y-4">
          <h3 className="font-semibold">{editingWorkId ? '作品を編集' : '作品を追加'}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="作品タイトル"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">作家</label>
              <select
                value={authorId}
                onChange={e => setAuthorId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">選択してください</option>
                {data.authors.map(author => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">担当者</label>
              <select
                value={editorId}
                onChange={e => setEditorId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">選択してください</option>
                {data.editors.map(editor => (
                  <option key={editor.id} value={editor.id}>
                    {editor.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">1Cページ数</label>
                <input
                  type="number"
                  value={pages1C}
                  onChange={e => setPages1C(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">4Cページ数</label>
                <input
                  type="number"
                  value={pages4C}
                  onChange={e => setPages4C(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {selectedAuthor && (
            <div className="text-sm text-gray-600 bg-white p-3 rounded border">
              <p>
                1C単価: {formatCurrency(selectedAuthor.ratePerPage1C)}/P
                4C単価: {formatCurrency(calculate4CRate(selectedAuthor.ratePerPage1C))}/P
              </p>
              {(pages1C || pages4C) && (
                <p className="mt-1 font-medium">
                  予定原稿料:{' '}
                  {formatCurrency(
                    (parseInt(pages1C, 10) || 0) * selectedAuthor.ratePerPage1C +
                      (parseInt(pages4C, 10) || 0) * calculate4CRate(selectedAuthor.ratePerPage1C)
                  )}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">
              {editingWorkId ? '更新' : '追加'}
            </button>
            <button
              type="button"
              onClick={resetWorkForm}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
            >
              キャンセル
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowWorkForm(true)}
          className="mb-6 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          作品を追加
        </button>
      )}

      {/* 作品一覧 */}
      {issue.works.length === 0 ? (
        <p className="text-gray-500">作品が登録されていません</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  タイトル
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  作家
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  1C
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  4C
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  原稿料
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  担当
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {issue.works.map(work => {
                const author = data.authors.find(a => a.id === work.authorId);
                const editor = data.editors.find(e => e.id === work.editorId);
                const fee = calculateWorkFee(work, author);

                return (
                  <tr key={work.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{work.title}</td>
                    <td className="px-4 py-3">{author?.name || '-'}</td>
                    <td className="px-4 py-3 text-center">{work.pages1C}P</td>
                    <td className="px-4 py-3 text-center">{work.pages4C}P</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(fee)}</td>
                    <td className="px-4 py-3">{editor?.name || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleEditWork(work.id)}
                        className="text-blue-600 hover:text-blue-800 mr-2 text-sm"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => deleteWork(magazine.id, issue.id, work.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
