import { createContext, useContext, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { AppData, Magazine, Author, Editor, Issue, Work } from '../types';

const initialData: AppData = {
  magazines: [],
  authors: [],
  editors: [],
};

interface DataContextType {
  data: AppData;
  // 作家
  addAuthor: (author: Omit<Author, 'id'>) => void;
  updateAuthor: (id: string, author: Partial<Author>) => void;
  deleteAuthor: (id: string) => void;
  // 担当者
  addEditor: (editor: Omit<Editor, 'id'>) => void;
  updateEditor: (id: string, editor: Partial<Editor>) => void;
  deleteEditor: (id: string) => void;
  // 雑誌
  addMagazine: (magazine: Omit<Magazine, 'id' | 'issues'>) => void;
  updateMagazine: (id: string, magazine: Partial<Magazine>) => void;
  deleteMagazine: (id: string) => void;
  // 号
  addIssue: (magazineId: string, issue: Omit<Issue, 'id' | 'magazineId' | 'works'>) => void;
  updateIssue: (magazineId: string, issueId: string, issue: Partial<Issue>) => void;
  deleteIssue: (magazineId: string, issueId: string) => void;
  // 作品
  addWork: (magazineId: string, issueId: string, work: Omit<Work, 'id'>) => void;
  updateWork: (magazineId: string, issueId: string, workId: string, work: Partial<Work>) => void;
  deleteWork: (magazineId: string, issueId: string, workId: string) => void;
  // エクスポート・インポート
  exportData: () => string;
  importData: (jsonString: string) => boolean;
}

const DataContext = createContext<DataContextType | null>(null);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useLocalStorage<AppData>('manuscript-fee-data', initialData);

  // 作家
  const addAuthor = (author: Omit<Author, 'id'>) => {
    setData(prev => ({
      ...prev,
      authors: [...prev.authors, { ...author, id: generateId() }],
    }));
  };

  const updateAuthor = (id: string, author: Partial<Author>) => {
    setData(prev => ({
      ...prev,
      authors: prev.authors.map(a => (a.id === id ? { ...a, ...author } : a)),
    }));
  };

  const deleteAuthor = (id: string) => {
    setData(prev => ({
      ...prev,
      authors: prev.authors.filter(a => a.id !== id),
    }));
  };

  // 担当者
  const addEditor = (editor: Omit<Editor, 'id'>) => {
    setData(prev => ({
      ...prev,
      editors: [...prev.editors, { ...editor, id: generateId() }],
    }));
  };

  const updateEditor = (id: string, editor: Partial<Editor>) => {
    setData(prev => ({
      ...prev,
      editors: prev.editors.map(e => (e.id === id ? { ...e, ...editor } : e)),
    }));
  };

  const deleteEditor = (id: string) => {
    setData(prev => ({
      ...prev,
      editors: prev.editors.filter(e => e.id !== id),
    }));
  };

  // 雑誌
  const addMagazine = (magazine: Omit<Magazine, 'id' | 'issues'>) => {
    setData(prev => ({
      ...prev,
      magazines: [...prev.magazines, { ...magazine, id: generateId(), issues: [] }],
    }));
  };

  const updateMagazine = (id: string, magazine: Partial<Magazine>) => {
    setData(prev => ({
      ...prev,
      magazines: prev.magazines.map(m => (m.id === id ? { ...m, ...magazine } : m)),
    }));
  };

  const deleteMagazine = (id: string) => {
    setData(prev => ({
      ...prev,
      magazines: prev.magazines.filter(m => m.id !== id),
    }));
  };

  // 号
  const addIssue = (magazineId: string, issue: Omit<Issue, 'id' | 'magazineId' | 'works'>) => {
    setData(prev => ({
      ...prev,
      magazines: prev.magazines.map(m =>
        m.id === magazineId
          ? { ...m, issues: [...m.issues, { ...issue, id: generateId(), magazineId, works: [] }] }
          : m
      ),
    }));
  };

  const updateIssue = (magazineId: string, issueId: string, issue: Partial<Issue>) => {
    setData(prev => ({
      ...prev,
      magazines: prev.magazines.map(m =>
        m.id === magazineId
          ? { ...m, issues: m.issues.map(i => (i.id === issueId ? { ...i, ...issue } : i)) }
          : m
      ),
    }));
  };

  const deleteIssue = (magazineId: string, issueId: string) => {
    setData(prev => ({
      ...prev,
      magazines: prev.magazines.map(m =>
        m.id === magazineId ? { ...m, issues: m.issues.filter(i => i.id !== issueId) } : m
      ),
    }));
  };

  // 作品
  const addWork = (magazineId: string, issueId: string, work: Omit<Work, 'id'>) => {
    setData(prev => ({
      ...prev,
      magazines: prev.magazines.map(m =>
        m.id === magazineId
          ? {
              ...m,
              issues: m.issues.map(i =>
                i.id === issueId ? { ...i, works: [...i.works, { ...work, id: generateId() }] } : i
              ),
            }
          : m
      ),
    }));
  };

  const updateWork = (magazineId: string, issueId: string, workId: string, work: Partial<Work>) => {
    setData(prev => ({
      ...prev,
      magazines: prev.magazines.map(m =>
        m.id === magazineId
          ? {
              ...m,
              issues: m.issues.map(i =>
                i.id === issueId
                  ? { ...i, works: i.works.map(w => (w.id === workId ? { ...w, ...work } : w)) }
                  : i
              ),
            }
          : m
      ),
    }));
  };

  const deleteWork = (magazineId: string, issueId: string, workId: string) => {
    setData(prev => ({
      ...prev,
      magazines: prev.magazines.map(m =>
        m.id === magazineId
          ? {
              ...m,
              issues: m.issues.map(i =>
                i.id === issueId ? { ...i, works: i.works.filter(w => w.id !== workId) } : i
              ),
            }
          : m
      ),
    }));
  };

  // エクスポート・インポート
  const exportData = (): string => {
    return JSON.stringify(data, null, 2);
  };

  const importData = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString) as AppData;
      if (parsed.magazines && parsed.authors && parsed.editors) {
        setData(parsed);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <DataContext.Provider
      value={{
        data,
        addAuthor,
        updateAuthor,
        deleteAuthor,
        addEditor,
        updateEditor,
        deleteEditor,
        addMagazine,
        updateMagazine,
        deleteMagazine,
        addIssue,
        updateIssue,
        deleteIssue,
        addWork,
        updateWork,
        deleteWork,
        exportData,
        importData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
