import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { AppData, Magazine, Author, Editor, Issue, Work, WorkEntry } from '../types';

const initialData: AppData = {
  magazines: [],
  authors: [],
  editors: [],
};

interface DataContextType {
  data: AppData;
  loading: boolean;
  // 作家
  addAuthor: (author: Omit<Author, 'id'>) => Promise<void>;
  updateAuthor: (id: string, author: Partial<Author>) => Promise<void>;
  deleteAuthor: (id: string) => Promise<void>;
  // 担当者
  addEditor: (editor: Omit<Editor, 'id'>) => Promise<void>;
  updateEditor: (id: string, editor: Partial<Editor>) => Promise<void>;
  deleteEditor: (id: string) => Promise<void>;
  // 雑誌
  addMagazine: (magazine: Omit<Magazine, 'id' | 'issues'>) => Promise<void>;
  updateMagazine: (id: string, magazine: Partial<Magazine>) => Promise<void>;
  deleteMagazine: (id: string) => Promise<void>;
  // 号
  addIssue: (magazineId: string, issue: Omit<Issue, 'id' | 'magazineId' | 'works'>) => Promise<void>;
  updateIssue: (magazineId: string, issueId: string, issue: Partial<Issue>) => Promise<void>;
  deleteIssue: (magazineId: string, issueId: string) => Promise<void>;
  // 作品
  addWork: (magazineId: string, issueId: string, work: Omit<Work, 'id'>) => Promise<void>;
  updateWork: (magazineId: string, issueId: string, workId: string, work: Partial<Work>) => Promise<void>;
  deleteWork: (magazineId: string, issueId: string, workId: string) => Promise<void>;
  // エクスポート・インポート
  exportData: () => string;
  importData: (jsonString: string) => boolean;
  // 再読み込み
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [localData, setLocalData] = useLocalStorage<AppData>('manuscript-fee-data', initialData);
  const [data, setData] = useState<AppData>(initialData);
  const [loading, setLoading] = useState(true);

  // Supabaseからデータを読み込む
  const fetchFromSupabase = useCallback(async (): Promise<AppData> => {
    if (!supabase) return localData;

    const [authorsRes, editorsRes, magazinesRes, issuesRes, worksRes] = await Promise.all([
      supabase.from('authors').select('*').order('created_at'),
      supabase.from('editors').select('*').order('created_at'),
      supabase.from('magazines').select('*').order('created_at'),
      supabase.from('issues').select('*').order('created_at'),
      supabase.from('works').select('*').order('created_at'),
    ]);

    const authors: Author[] = (authorsRes.data || []).map(a => ({
      id: a.id,
      name: a.name,
      ratePerPage1C: a.rate_per_page_1c,
    }));

    const editors: Editor[] = (editorsRes.data || []).map(e => ({
      id: e.id,
      name: e.name,
    }));

    const worksData = (worksRes.data || []).map(w => ({
      id: w.id,
      issueId: w.issue_id,
      title: w.title,
      authorId: w.author_id,
      editorId: w.editor_id,
      pages1C: w.pages_1c,
      pages4C: w.pages_4c,
      startPage: w.start_page,
      endPage: w.end_page,
      checkStatus: w.check_status,
      firstEntry: w.first_entry as WorkEntry | undefined,
      secondEntry: w.second_entry as WorkEntry | undefined,
      firstEntryBy: w.first_entry_by,
      secondEntryBy: w.second_entry_by,
      confirmedAt: w.confirmed_at,
    }));

    const issuesData = (issuesRes.data || []).map(i => ({
      id: i.id,
      magazineId: i.magazine_id,
      issueNumber: i.name,
      releaseDate: i.release_date,
      works: worksData.filter(w => w.issueId === i.id) as Work[],
    }));

    const magazines: Magazine[] = (magazinesRes.data || []).map(m => ({
      id: m.id,
      name: m.name,
      issues: issuesData.filter(i => i.magazineId === m.id),
    }));

    return { magazines, authors, editors };
  }, [localData]);

  // 初期データ読み込み
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      if (isSupabaseEnabled) {
        const supabaseData = await fetchFromSupabase();
        setData(supabaseData);
      } else {
        setData(localData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setData(localData);
    } finally {
      setLoading(false);
    }
  }, [fetchFromSupabase, localData]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // 作家
  const addAuthor = async (author: Omit<Author, 'id'>) => {
    const id = generateId();
    if (isSupabaseEnabled && supabase) {
      await supabase.from('authors').insert({
        id,
        name: author.name,
        rate_per_page_1c: author.ratePerPage1C,
      });
      await refreshData();
    } else {
      setLocalData(prev => ({
        ...prev,
        authors: [...prev.authors, { ...author, id }],
      }));
      setData(prev => ({
        ...prev,
        authors: [...prev.authors, { ...author, id }],
      }));
    }
  };

  const updateAuthor = async (id: string, author: Partial<Author>) => {
    if (isSupabaseEnabled && supabase) {
      const updateData: Record<string, unknown> = {};
      if (author.name !== undefined) updateData.name = author.name;
      if (author.ratePerPage1C !== undefined) updateData.rate_per_page_1c = author.ratePerPage1C;
      await supabase.from('authors').update(updateData).eq('id', id);
      await refreshData();
    } else {
      setLocalData(prev => ({
        ...prev,
        authors: prev.authors.map(a => (a.id === id ? { ...a, ...author } : a)),
      }));
      setData(prev => ({
        ...prev,
        authors: prev.authors.map(a => (a.id === id ? { ...a, ...author } : a)),
      }));
    }
  };

  const deleteAuthor = async (id: string) => {
    if (isSupabaseEnabled && supabase) {
      await supabase.from('authors').delete().eq('id', id);
      await refreshData();
    } else {
      setLocalData(prev => ({
        ...prev,
        authors: prev.authors.filter(a => a.id !== id),
      }));
      setData(prev => ({
        ...prev,
        authors: prev.authors.filter(a => a.id !== id),
      }));
    }
  };

  // 担当者
  const addEditor = async (editor: Omit<Editor, 'id'>) => {
    const id = generateId();
    if (isSupabaseEnabled && supabase) {
      await supabase.from('editors').insert({
        id,
        name: editor.name,
      });
      await refreshData();
    } else {
      setLocalData(prev => ({
        ...prev,
        editors: [...prev.editors, { ...editor, id }],
      }));
      setData(prev => ({
        ...prev,
        editors: [...prev.editors, { ...editor, id }],
      }));
    }
  };

  const updateEditor = async (id: string, editor: Partial<Editor>) => {
    if (isSupabaseEnabled && supabase) {
      await supabase.from('editors').update({ name: editor.name }).eq('id', id);
      await refreshData();
    } else {
      setLocalData(prev => ({
        ...prev,
        editors: prev.editors.map(e => (e.id === id ? { ...e, ...editor } : e)),
      }));
      setData(prev => ({
        ...prev,
        editors: prev.editors.map(e => (e.id === id ? { ...e, ...editor } : e)),
      }));
    }
  };

  const deleteEditor = async (id: string) => {
    if (isSupabaseEnabled && supabase) {
      await supabase.from('editors').delete().eq('id', id);
      await refreshData();
    } else {
      setLocalData(prev => ({
        ...prev,
        editors: prev.editors.filter(e => e.id !== id),
      }));
      setData(prev => ({
        ...prev,
        editors: prev.editors.filter(e => e.id !== id),
      }));
    }
  };

  // 雑誌
  const addMagazine = async (magazine: Omit<Magazine, 'id' | 'issues'>) => {
    const id = generateId();
    if (isSupabaseEnabled && supabase) {
      await supabase.from('magazines').insert({
        id,
        name: magazine.name,
      });
      await refreshData();
    } else {
      setLocalData(prev => ({
        ...prev,
        magazines: [...prev.magazines, { ...magazine, id, issues: [] }],
      }));
      setData(prev => ({
        ...prev,
        magazines: [...prev.magazines, { ...magazine, id, issues: [] }],
      }));
    }
  };

  const updateMagazine = async (id: string, magazine: Partial<Magazine>) => {
    if (isSupabaseEnabled && supabase) {
      await supabase.from('magazines').update({ name: magazine.name }).eq('id', id);
      await refreshData();
    } else {
      setLocalData(prev => ({
        ...prev,
        magazines: prev.magazines.map(m => (m.id === id ? { ...m, ...magazine } : m)),
      }));
      setData(prev => ({
        ...prev,
        magazines: prev.magazines.map(m => (m.id === id ? { ...m, ...magazine } : m)),
      }));
    }
  };

  const deleteMagazine = async (id: string) => {
    if (isSupabaseEnabled && supabase) {
      await supabase.from('magazines').delete().eq('id', id);
      await refreshData();
    } else {
      setLocalData(prev => ({
        ...prev,
        magazines: prev.magazines.filter(m => m.id !== id),
      }));
      setData(prev => ({
        ...prev,
        magazines: prev.magazines.filter(m => m.id !== id),
      }));
    }
  };

  // 号
  const addIssue = async (magazineId: string, issue: Omit<Issue, 'id' | 'magazineId' | 'works'>) => {
    const id = generateId();
    if (isSupabaseEnabled && supabase) {
      await supabase.from('issues').insert({
        id,
        magazine_id: magazineId,
        name: issue.issueNumber,
        release_date: issue.releaseDate || null,
      });
      await refreshData();
    } else {
      setLocalData(prev => ({
        ...prev,
        magazines: prev.magazines.map(m =>
          m.id === magazineId
            ? { ...m, issues: [...m.issues, { ...issue, id, magazineId, works: [] }] }
            : m
        ),
      }));
      setData(prev => ({
        ...prev,
        magazines: prev.magazines.map(m =>
          m.id === magazineId
            ? { ...m, issues: [...m.issues, { ...issue, id, magazineId, works: [] }] }
            : m
        ),
      }));
    }
  };

  const updateIssue = async (magazineId: string, issueId: string, issue: Partial<Issue>) => {
    if (isSupabaseEnabled && supabase) {
      const updateData: Record<string, unknown> = {};
      if (issue.issueNumber !== undefined) updateData.name = issue.issueNumber;
      if (issue.releaseDate !== undefined) updateData.release_date = issue.releaseDate;
      await supabase.from('issues').update(updateData).eq('id', issueId);
      await refreshData();
    } else {
      setLocalData(prev => ({
        ...prev,
        magazines: prev.magazines.map(m =>
          m.id === magazineId
            ? { ...m, issues: m.issues.map(i => (i.id === issueId ? { ...i, ...issue } : i)) }
            : m
        ),
      }));
      setData(prev => ({
        ...prev,
        magazines: prev.magazines.map(m =>
          m.id === magazineId
            ? { ...m, issues: m.issues.map(i => (i.id === issueId ? { ...i, ...issue } : i)) }
            : m
        ),
      }));
    }
  };

  const deleteIssue = async (magazineId: string, issueId: string) => {
    if (isSupabaseEnabled && supabase) {
      await supabase.from('issues').delete().eq('id', issueId);
      await refreshData();
    } else {
      setLocalData(prev => ({
        ...prev,
        magazines: prev.magazines.map(m =>
          m.id === magazineId ? { ...m, issues: m.issues.filter(i => i.id !== issueId) } : m
        ),
      }));
      setData(prev => ({
        ...prev,
        magazines: prev.magazines.map(m =>
          m.id === magazineId ? { ...m, issues: m.issues.filter(i => i.id !== issueId) } : m
        ),
      }));
    }
  };

  // 作品
  const addWork = async (magazineId: string, issueId: string, work: Omit<Work, 'id'>) => {
    const id = generateId();
    if (isSupabaseEnabled && supabase) {
      await supabase.from('works').insert({
        id,
        issue_id: issueId,
        title: work.title,
        author_id: work.authorId,
        editor_id: work.editorId,
        pages_1c: work.pages1C,
        pages_4c: work.pages4C,
        start_page: work.startPage || null,
        end_page: work.endPage || null,
        check_status: work.checkStatus || 'draft',
        first_entry: work.firstEntry || null,
        second_entry: work.secondEntry || null,
        first_entry_by: work.firstEntryBy || null,
        second_entry_by: work.secondEntryBy || null,
        confirmed_at: work.confirmedAt || null,
      });
      await refreshData();
    } else {
      setLocalData(prev => ({
        ...prev,
        magazines: prev.magazines.map(m =>
          m.id === magazineId
            ? {
                ...m,
                issues: m.issues.map(i =>
                  i.id === issueId ? { ...i, works: [...i.works, { ...work, id }] } : i
                ),
              }
            : m
        ),
      }));
      setData(prev => ({
        ...prev,
        magazines: prev.magazines.map(m =>
          m.id === magazineId
            ? {
                ...m,
                issues: m.issues.map(i =>
                  i.id === issueId ? { ...i, works: [...i.works, { ...work, id }] } : i
                ),
              }
            : m
        ),
      }));
    }
  };

  const updateWork = async (magazineId: string, issueId: string, workId: string, work: Partial<Work>) => {
    if (isSupabaseEnabled && supabase) {
      const updateData: Record<string, unknown> = {};
      if (work.title !== undefined) updateData.title = work.title;
      if (work.authorId !== undefined) updateData.author_id = work.authorId;
      if (work.editorId !== undefined) updateData.editor_id = work.editorId;
      if (work.pages1C !== undefined) updateData.pages_1c = work.pages1C;
      if (work.pages4C !== undefined) updateData.pages_4c = work.pages4C;
      if (work.startPage !== undefined) updateData.start_page = work.startPage;
      if (work.endPage !== undefined) updateData.end_page = work.endPage;
      if (work.checkStatus !== undefined) updateData.check_status = work.checkStatus;
      if (work.firstEntry !== undefined) updateData.first_entry = work.firstEntry;
      if (work.secondEntry !== undefined) updateData.second_entry = work.secondEntry;
      if (work.firstEntryBy !== undefined) updateData.first_entry_by = work.firstEntryBy;
      if (work.secondEntryBy !== undefined) updateData.second_entry_by = work.secondEntryBy;
      if (work.confirmedAt !== undefined) updateData.confirmed_at = work.confirmedAt;
      await supabase.from('works').update(updateData).eq('id', workId);
      await refreshData();
    } else {
      setLocalData(prev => ({
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
    }
  };

  const deleteWork = async (magazineId: string, issueId: string, workId: string) => {
    if (isSupabaseEnabled && supabase) {
      await supabase.from('works').delete().eq('id', workId);
      await refreshData();
    } else {
      setLocalData(prev => ({
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
    }
  };

  // エクスポート・インポート
  const exportData = (): string => {
    return JSON.stringify(data, null, 2);
  };

  const importData = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString) as AppData;
      if (parsed.magazines && parsed.authors && parsed.editors) {
        setLocalData(parsed);
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
        loading,
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
        refreshData,
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
