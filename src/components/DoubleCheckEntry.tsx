import { useState } from 'react';
import { useData } from '../context/DataContext';
import type { Magazine, Issue, Work, WorkEntry, CheckStatus } from '../types';
import { calculateWorkFee, calculate4CRate, formatCurrency } from '../utils/calculator';

interface Props {
  magazine: Magazine;
  issue: Issue;
  onBack: () => void;
}

type EntryMode = 'first' | 'second';

export function DoubleCheckEntry({ magazine, issue, onBack }: Props) {
  const { data, addWork, updateWork } = useData();
  const [entryMode, setEntryMode] = useState<EntryMode>('first');
  const [entryBy, setEntryBy] = useState('');

  // 入力フォーム
  const [title, setTitle] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [editorId, setEditorId] = useState('');
  const [pages1C, setPages1C] = useState('');
  const [pages4C, setPages4C] = useState('');
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');

  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setAuthorId('');
    setEditorId('');
    setPages1C('');
    setPages4C('');
    setStartPage('');
    setEndPage('');
    setSelectedWorkId(null);
  };

  // 1次入力：新規作品として登録
  const handleFirstEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !authorId || !entryBy.trim()) return;

    const entry: WorkEntry = {
      title: title.trim(),
      authorId,
      editorId,
      pages1C: parseInt(pages1C, 10) || 0,
      pages4C: parseInt(pages4C, 10) || 0,
      startPage: startPage ? parseInt(startPage, 10) : undefined,
      endPage: endPage ? parseInt(endPage, 10) : undefined,
    };

    addWork(magazine.id, issue.id, {
      ...entry,
      checkStatus: 'first_check' as CheckStatus,
      firstEntry: entry,
      firstEntryBy: entryBy.trim(),
    });

    resetForm();
  };

  // 2次入力：既存作品に2次入力を追加
  const handleSecondEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkId || !entryBy.trim()) return;

    const entry: WorkEntry = {
      title: title.trim(),
      authorId,
      editorId,
      pages1C: parseInt(pages1C, 10) || 0,
      pages4C: parseInt(pages4C, 10) || 0,
      startPage: startPage ? parseInt(startPage, 10) : undefined,
      endPage: endPage ? parseInt(endPage, 10) : undefined,
    };

    const work = issue.works.find(w => w.id === selectedWorkId);
    if (!work || !work.firstEntry) return;

    // 差異チェック
    const hasDiscrepancy = checkDiscrepancy(work.firstEntry, entry);

    updateWork(magazine.id, issue.id, selectedWorkId, {
      secondEntry: entry,
      secondEntryBy: entryBy.trim(),
      checkStatus: hasDiscrepancy ? 'discrepancy' : 'second_check',
    });

    resetForm();
  };

  // 差異チェック
  const checkDiscrepancy = (first: WorkEntry, second: WorkEntry): boolean => {
    return (
      first.title !== second.title ||
      first.authorId !== second.authorId ||
      first.editorId !== second.editorId ||
      first.pages1C !== second.pages1C ||
      first.pages4C !== second.pages4C ||
      first.startPage !== second.startPage ||
      first.endPage !== second.endPage
    );
  };

  // 2次入力用に作品を選択
  const handleSelectWork = (work: Work) => {
    if (work.firstEntry) {
      setSelectedWorkId(work.id);
      // フォームは空のままにして、入力者Bが独立して入力
      setTitle('');
      setAuthorId('');
      setEditorId('');
      setPages1C('');
      setPages4C('');
      setStartPage('');
      setEndPage('');
    }
  };

  // 1次入力待ちの作品
  const firstCheckWorks = issue.works.filter(w => w.checkStatus === 'first_check');
  // 差異がある作品
  const discrepancyWorks = issue.works.filter(w => w.checkStatus === 'discrepancy');
  // 2次入力完了の作品
  const secondCheckWorks = issue.works.filter(w => w.checkStatus === 'second_check');
  // 確定済みの作品
  const confirmedWorks = issue.works.filter(w => w.checkStatus === 'confirmed');

  const selectedAuthor = data.authors.find(a => a.id === authorId);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-blue-600 hover:text-blue-800">
          ← 戻る
        </button>
        <h2 className="text-xl font-bold">
          {magazine.name} {issue.issueNumber} - ダブルチェック入力
        </h2>
      </div>

      {/* 入力モード切替 */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => { setEntryMode('first'); resetForm(); }}
          className={`px-4 py-2 rounded-md ${
            entryMode === 'first'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          1次入力（入力者A）
        </button>
        <button
          onClick={() => { setEntryMode('second'); resetForm(); }}
          className={`px-4 py-2 rounded-md ${
            entryMode === 'second'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          2次入力（入力者B）
        </button>
      </div>

      {/* 入力者名 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          入力者名
        </label>
        <input
          type="text"
          value={entryBy}
          onChange={e => setEntryBy(e.target.value)}
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md"
          placeholder="あなたの名前"
        />
      </div>

      {/* 1次入力モード */}
      {entryMode === 'first' && (
        <form onSubmit={handleFirstEntry} className="mb-6 p-4 bg-blue-50 rounded-md space-y-4">
          <h3 className="font-semibold text-blue-800">1次入力：紙の雑誌を見ながら入力</h3>
          <p className="text-sm text-blue-600">目次と実際のページを確認しながら入力してください</p>

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
                  <option key={author.id} value={author.id}>{author.name}</option>
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
                  <option key={editor.id} value={editor.id}>{editor.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">開始ページ</label>
                <input
                  type="number"
                  value={startPage}
                  onChange={e => setStartPage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="1"
                  placeholder="例: 5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">終了ページ</label>
                <input
                  type="number"
                  value={endPage}
                  onChange={e => setEndPage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="1"
                  placeholder="例: 24"
                />
              </div>
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
                />
              </div>
            </div>
          </div>

          {/* ページ数の整合性チェック */}
          {startPage && endPage && (pages1C || pages4C) && (
            <div className={`p-3 rounded-md ${
              (parseInt(endPage) - parseInt(startPage) + 1) === ((parseInt(pages1C) || 0) + (parseInt(pages4C) || 0))
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              開始〜終了: {parseInt(endPage) - parseInt(startPage) + 1}ページ /
              1C+4C: {(parseInt(pages1C) || 0) + (parseInt(pages4C) || 0)}ページ
              {(parseInt(endPage) - parseInt(startPage) + 1) !== ((parseInt(pages1C) || 0) + (parseInt(pages4C) || 0)) && (
                <span className="font-bold"> ← ページ数が一致しません！</span>
              )}
            </div>
          )}

          {selectedAuthor && (
            <div className="text-sm text-gray-600 bg-white p-3 rounded border">
              <p>1C単価: {formatCurrency(selectedAuthor.ratePerPage1C)}/P / 4C単価: {formatCurrency(calculate4CRate(selectedAuthor.ratePerPage1C))}/P</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!entryBy.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            1次入力を登録
          </button>
        </form>
      )}

      {/* 2次入力モード */}
      {entryMode === 'second' && (
        <div className="mb-6">
          <div className="p-4 bg-green-50 rounded-md mb-4">
            <h3 className="font-semibold text-green-800">2次入力：別の人が独立して入力</h3>
            <p className="text-sm text-green-600">1次入力の内容を見ずに、紙の雑誌を見て入力してください</p>
          </div>

          {/* 2次入力待ちの作品一覧 */}
          {firstCheckWorks.length === 0 ? (
            <p className="text-gray-500">2次入力待ちの作品がありません</p>
          ) : (
            <div className="mb-4">
              <h4 className="font-medium mb-2">2次入力待ちの作品（クリックして選択）</h4>
              <div className="space-y-2">
                {firstCheckWorks.map(work => (
                  <button
                    key={work.id}
                    onClick={() => handleSelectWork(work)}
                    className={`w-full text-left p-3 rounded-md border ${
                      selectedWorkId === work.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">作品{firstCheckWorks.indexOf(work) + 1}</span>
                    <span className="text-sm text-gray-500 ml-2">（1次入力者: {work.firstEntryBy}）</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2次入力フォーム */}
          {selectedWorkId && (
            <form onSubmit={handleSecondEntry} className="p-4 bg-green-50 rounded-md space-y-4">
              <h4 className="font-medium">作品{firstCheckWorks.findIndex(w => w.id === selectedWorkId) + 1}の2次入力</h4>

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
                      <option key={author.id} value={author.id}>{author.name}</option>
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
                      <option key={editor.id} value={editor.id}>{editor.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">開始ページ</label>
                    <input
                      type="number"
                      value={startPage}
                      onChange={e => setStartPage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">終了ページ</label>
                    <input
                      type="number"
                      value={endPage}
                      onChange={e => setEndPage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="1"
                    />
                  </div>
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
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!entryBy.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                2次入力を登録して照合
              </button>
            </form>
          )}
        </div>
      )}

      {/* ステータス別一覧 */}
      <div className="space-y-6">
        {/* 差異がある作品 */}
        {discrepancyWorks.length > 0 && (
          <div className="border-2 border-red-500 rounded-md p-4">
            <h3 className="font-bold text-red-600 mb-3">差異あり（要確認）: {discrepancyWorks.length}件</h3>
            {discrepancyWorks.map(work => (
              <DiscrepancyItem key={work.id} work={work} data={data} magazine={magazine} issue={issue} />
            ))}
          </div>
        )}

        {/* 2次入力完了（差異なし） */}
        {secondCheckWorks.length > 0 && (
          <div className="border-2 border-green-500 rounded-md p-4">
            <h3 className="font-bold text-green-600 mb-3">照合一致（確定可能）: {secondCheckWorks.length}件</h3>
            {secondCheckWorks.map(work => (
              <MatchedItem key={work.id} work={work} data={data} magazine={magazine} issue={issue} />
            ))}
          </div>
        )}

        {/* 確定済み */}
        {confirmedWorks.length > 0 && (
          <div className="border rounded-md p-4 bg-gray-50">
            <h3 className="font-bold text-gray-600 mb-3">確定済み: {confirmedWorks.length}件</h3>
            <div className="text-sm text-gray-500">
              {confirmedWorks.map(work => (
                <div key={work.id} className="py-1">
                  {work.title} - {data.authors.find(a => a.id === work.authorId)?.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 差異表示コンポーネント
function DiscrepancyItem({ work, data, magazine, issue }: {
  work: Work;
  data: { authors: { id: string; name: string; ratePerPage1C: number }[]; editors: { id: string; name: string }[] };
  magazine: Magazine;
  issue: Issue;
}) {
  const { updateWork } = useData();
  const first = work.firstEntry;
  const second = work.secondEntry;
  if (!first || !second) return null;

  const getAuthorName = (id: string) => data.authors.find(a => a.id === id)?.name || '不明';
  const getEditorName = (id: string) => data.editors.find(e => e.id === id)?.name || '不明';

  const differences: { field: string; first: string; second: string }[] = [];

  if (first.title !== second.title) {
    differences.push({ field: 'タイトル', first: first.title, second: second.title });
  }
  if (first.authorId !== second.authorId) {
    differences.push({ field: '作家', first: getAuthorName(first.authorId), second: getAuthorName(second.authorId) });
  }
  if (first.editorId !== second.editorId) {
    differences.push({ field: '担当者', first: getEditorName(first.editorId), second: getEditorName(second.editorId) });
  }
  if (first.pages1C !== second.pages1C) {
    differences.push({ field: '1Cページ', first: String(first.pages1C), second: String(second.pages1C) });
  }
  if (first.pages4C !== second.pages4C) {
    differences.push({ field: '4Cページ', first: String(first.pages4C), second: String(second.pages4C) });
  }
  if (first.startPage !== second.startPage) {
    differences.push({ field: '開始ページ', first: String(first.startPage || '-'), second: String(second.startPage || '-') });
  }
  if (first.endPage !== second.endPage) {
    differences.push({ field: '終了ページ', first: String(first.endPage || '-'), second: String(second.endPage || '-') });
  }

  const handleUseFirst = () => {
    updateWork(magazine.id, issue.id, work.id, {
      ...first,
      checkStatus: 'confirmed',
      confirmedAt: new Date().toISOString(),
    });
  };

  const handleUseSecond = () => {
    updateWork(magazine.id, issue.id, work.id, {
      ...second,
      checkStatus: 'confirmed',
      confirmedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="bg-red-50 p-4 rounded-md mb-3">
      <div className="font-medium mb-2">{first.title || second.title}</div>
      <table className="w-full text-sm mb-3">
        <thead>
          <tr className="border-b">
            <th className="text-left py-1">項目</th>
            <th className="text-left py-1">1次入力（{work.firstEntryBy}）</th>
            <th className="text-left py-1">2次入力（{work.secondEntryBy}）</th>
          </tr>
        </thead>
        <tbody>
          {differences.map((diff, i) => (
            <tr key={i} className="border-b">
              <td className="py-1 font-medium text-red-600">{diff.field}</td>
              <td className="py-1">{diff.first}</td>
              <td className="py-1">{diff.second}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2">
        <button
          onClick={handleUseFirst}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm"
        >
          1次を採用
        </button>
        <button
          onClick={handleUseSecond}
          className="px-3 py-1.5 bg-green-600 text-white rounded text-sm"
        >
          2次を採用
        </button>
      </div>
    </div>
  );
}

// 一致表示コンポーネント
function MatchedItem({ work, data, magazine, issue }: {
  work: Work;
  data: { authors: { id: string; name: string; ratePerPage1C: number }[]; editors: { id: string; name: string }[] };
  magazine: Magazine;
  issue: Issue;
}) {
  const { updateWork } = useData();
  const author = data.authors.find(a => a.id === work.authorId);

  const handleConfirm = () => {
    updateWork(magazine.id, issue.id, work.id, {
      checkStatus: 'confirmed',
      confirmedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="bg-green-50 p-4 rounded-md mb-3 flex items-center justify-between">
      <div>
        <div className="font-medium">{work.title}</div>
        <div className="text-sm text-gray-600">
          {author?.name} / {work.pages1C}P(1C) + {work.pages4C}P(4C) = {formatCurrency(calculateWorkFee(work, author))}
        </div>
        <div className="text-xs text-gray-500">
          1次: {work.firstEntryBy} / 2次: {work.secondEntryBy}
        </div>
      </div>
      <button
        onClick={handleConfirm}
        className="px-4 py-2 bg-green-600 text-white rounded-md"
      >
        確定
      </button>
    </div>
  );
}
