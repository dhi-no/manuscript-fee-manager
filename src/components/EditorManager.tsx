import { useState } from 'react';
import { useData } from '../context/DataContext';

export function EditorManager() {
  const { data, addEditor, updateEditor, deleteEditor } = useData();
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      updateEditor(editingId, { name: name.trim() });
      setEditingId(null);
    } else {
      addEditor({ name: name.trim() });
    }
    setName('');
  };

  const handleEdit = (id: string) => {
    const editor = data.editors.find(e => e.id === id);
    if (editor) {
      setName(editor.name);
      setEditingId(id);
    }
  };

  const handleCancel = () => {
    setName('');
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">担当者マスタ</h2>

      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            担当者名
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="担当者名を入力"
          />
        </div>
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
                担当者名
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.editors.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-gray-500">
                  担当者が登録されていません
                </td>
              </tr>
            ) : (
              data.editors.map(editor => (
                <tr key={editor.id}>
                  <td className="px-4 py-3 whitespace-nowrap">{editor.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleEdit(editor.id)}
                      className="text-blue-600 hover:text-blue-800 mr-2"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => deleteEditor(editor.id)}
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
