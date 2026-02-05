import { useState } from 'react';
import { useData } from '../context/DataContext';
import { calculate4CRate, formatCurrency } from '../utils/calculator';

export function AuthorManager() {
  const { data, addAuthor, updateAuthor, deleteAuthor } = useData();
  const [name, setName] = useState('');
  const [ratePerPage1C, setRatePerPage1C] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ratePerPage1C) return;

    const rate = parseInt(ratePerPage1C, 10);
    if (isNaN(rate) || rate <= 0) return;

    if (editingId) {
      updateAuthor(editingId, { name: name.trim(), ratePerPage1C: rate });
      setEditingId(null);
    } else {
      addAuthor({ name: name.trim(), ratePerPage1C: rate });
    }
    setName('');
    setRatePerPage1C('');
  };

  const handleEdit = (id: string) => {
    const author = data.authors.find(a => a.id === id);
    if (author) {
      setName(author.name);
      setRatePerPage1C(author.ratePerPage1C.toString());
      setEditingId(id);
    }
  };

  const handleCancel = () => {
    setName('');
    setRatePerPage1C('');
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">作家マスタ</h2>

      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              作家名
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="作家名を入力"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              1C単価（円/ページ）
            </label>
            <input
              type="number"
              value={ratePerPage1C}
              onChange={e => setRatePerPage1C(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 10000"
              min="0"
            />
          </div>
        </div>
        {ratePerPage1C && (
          <p className="text-sm text-gray-600">
            4C単価（自動計算）: {formatCurrency(calculate4CRate(parseInt(ratePerPage1C, 10) || 0))}/ページ
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {editingId ? '更新' : '追加'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              キャンセル
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                作家名
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                1C単価
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                4C単価
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.authors.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  作家が登録されていません
                </td>
              </tr>
            ) : (
              data.authors.map(author => (
                <tr key={author.id}>
                  <td className="px-4 py-3 whitespace-nowrap">{author.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {formatCurrency(author.ratePerPage1C)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {formatCurrency(calculate4CRate(author.ratePerPage1C))}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleEdit(author.id)}
                      className="text-blue-600 hover:text-blue-800 mr-2"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => deleteAuthor(author.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
