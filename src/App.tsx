import { useState } from 'react';
import { DataProvider } from './context/DataContext';
import { AuthorManager } from './components/AuthorManager';
import { EditorManager } from './components/EditorManager';
import { MagazineList } from './components/MagazineList';
import { ExportImport } from './components/ExportImport';

type Tab = 'magazines' | 'authors' | 'editors' | 'export';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('magazines');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'magazines', label: '雑誌管理' },
    { id: 'authors', label: '作家マスタ' },
    { id: 'editors', label: '担当者マスタ' },
    { id: 'export', label: 'データ入出力' },
  ];

  return (
    <DataProvider>
      <div className="min-h-screen bg-gray-100">
        {/* ヘッダー */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">原稿料管理システム</h1>
          </div>
        </header>

        {/* タブナビゲーション */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex space-x-4">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* メインコンテンツ */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          {activeTab === 'magazines' && <MagazineList />}
          {activeTab === 'authors' && <AuthorManager />}
          {activeTab === 'editors' && <EditorManager />}
          {activeTab === 'export' && <ExportImport />}
        </main>
      </div>
    </DataProvider>
  );
}

export default App;
