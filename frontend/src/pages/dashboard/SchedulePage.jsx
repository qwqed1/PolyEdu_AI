import { useState, useEffect, useRef } from 'react';
import { Upload, ChevronDown, Clock, MapPin, User, BookOpen, Search, Trash2, FileText, X, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import scheduleUploadService from '../../services/scheduleUploadService';

const SAVED_GROUP_KEY = 'polyedu_selected_group';

export default function SchedulePage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  // State
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(() => localStorage.getItem(SAVED_GROUP_KEY) || '');
  const [scheduleData, setScheduleData] = useState({ uploads: [], entries: [] });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Load groups on mount
  useEffect(() => {
    loadGroups();
  }, []);

  // Load schedule when group changes
  useEffect(() => {
    if (selectedGroup) {
      localStorage.setItem(SAVED_GROUP_KEY, selectedGroup);
      loadSchedule(selectedGroup);
    } else {
      setScheduleData({ uploads: [], entries: [] });
      setLoading(false);
    }
  }, [selectedGroup]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowGroupDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadGroups = async () => {
    try {
      setGroupsLoading(true);
      const data = await scheduleUploadService.getGroups();
      setGroups(data);
    } catch (err) {
      console.error('Failed to load groups:', err);
      setGroups([]);
    } finally {
      setGroupsLoading(false);
    }
  };

  const loadSchedule = async (group) => {
    try {
      setLoading(true);
      setError('');
      const data = await scheduleUploadService.getByGroup(group);
      setScheduleData(data);
    } catch (err) {
      console.error('Failed to load schedule:', err);
      setError('Расписание не найдено для этой группы');
      setScheduleData({ uploads: [], entries: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError('');
      const result = await scheduleUploadService.upload(file);
      setUploadResult(result);
      setShowUploadModal(true);
      // Refresh groups
      await loadGroups();
      // If schedule is currently loaded, refresh it
      if (selectedGroup) {
        await loadSchedule(selectedGroup);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.error || 'Ошибка при загрузке файла');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const selectGroup = (group) => {
    setSelectedGroup(group);
    setShowGroupDropdown(false);
    setGroupSearch('');
  };

  const filteredGroups = groups.filter(g =>
    g.toLowerCase().includes(groupSearch.toLowerCase())
  );

  // Group entries by shift/upload
  const groupedByShift = {};
  scheduleData.entries.forEach(entry => {
    const key = `${entry.shift || 'Смена'} — ${entry.week_type || ''}`;
    if (!groupedByShift[key]) groupedByShift[key] = [];
    groupedByShift[key].push(entry);
  });

  // Sort entries within each shift by lesson number
  Object.keys(groupedByShift).forEach(key => {
    groupedByShift[key].sort((a, b) => a.lesson_number - b.lesson_number);
  });

  return (
    <div className="min-h-[calc(100vh-64px)] bg-neutral-50 dark:bg-dark-bg">
      {/* Upload Result Modal */}
      {showUploadModal && uploadResult && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-neutral-100 dark:border-dark-border flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-lg text-neutral-800 dark:text-neutral-100">Расписание загружено!</h3>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <FileText className="w-4 h-4" />
                <span>Записей: <strong className="text-neutral-900 dark:text-white">{uploadResult.entriesCount}</strong></span>
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">Найденные группы:</p>
                <div className="flex flex-wrap gap-1.5">
                  {uploadResult.groups?.map(g => (
                    <button
                      key={g}
                      onClick={() => { selectGroup(g); setShowUploadModal(false); }}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors cursor-pointer"
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 sm:px-6 py-5 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm border-b border-neutral-200 dark:border-dark-border sticky top-0 z-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Title + Group Selector */}
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400">
                📅 Расписание
              </h1>

              {/* Group Selector Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border hover:border-primary-300 dark:hover:border-primary-700 transition-all shadow-sm hover:shadow-md min-w-[180px]"
                >
                  {groupsLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                  ) : (
                    <BookOpen className="w-4 h-4 text-primary-500" />
                  )}
                  <span className={`text-sm font-medium flex-1 text-left ${selectedGroup ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}`}>
                    {selectedGroup || 'Выберите группу'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${showGroupDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showGroupDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-dark-surface rounded-xl border border-neutral-200 dark:border-dark-border shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Search */}
                    <div className="p-3 border-b border-neutral-100 dark:border-dark-border">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          type="text"
                          value={groupSearch}
                          onChange={(e) => setGroupSearch(e.target.value)}
                          placeholder="Поиск группы..."
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-bg text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all text-neutral-900 dark:text-white"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Group List */}
                    <div className="max-h-64 overflow-y-auto py-1">
                      {filteredGroups.length === 0 ? (
                        <div className="px-4 py-8 text-center text-neutral-400 text-sm">
                          {groups.length === 0 ? 'Нет загруженных расписаний' : 'Группа не найдена'}
                        </div>
                      ) : (
                        filteredGroups.map(g => (
                          <button
                            key={g}
                            onClick={() => selectGroup(g)}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex items-center justify-between ${
                              g === selectedGroup ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-semibold' : 'text-neutral-700 dark:text-neutral-300'
                            }`}
                          >
                            <span>{g}</span>
                            {g === selectedGroup && <Check className="w-4 h-4 text-primary-500" />}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Button (teachers) */}
            {isTeacher && (
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="schedule-file-input"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium shadow-lg shadow-primary-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Загрузка...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Загрузить .docx</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-3 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {!selectedGroup ? (
          /* No Group Selected State */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center mb-6 shadow-xl shadow-primary-500/10">
              <BookOpen className="w-10 h-10 text-primary-500" />
            </div>
            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
              Выберите свою группу
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-md mb-6">
              Выберите группу из списка выше, чтобы увидеть расписание. Ваш выбор сохранится.
            </p>
            {groups.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {groups.slice(0, 12).map(g => (
                  <button
                    key={g}
                    onClick={() => selectGroup(g)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border text-neutral-700 dark:text-neutral-300 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all shadow-sm"
                  >
                    {g}
                  </button>
                ))}
                {groups.length > 12 && (
                  <button
                    onClick={() => setShowGroupDropdown(true)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    +{groups.length - 12} ещё...
                  </button>
                )}
              </div>
            )}
            {groups.length === 0 && !groupsLoading && isTeacher && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium shadow-lg shadow-primary-500/20 transition-all"
              >
                <Upload className="w-5 h-5" />
                Загрузить расписание (.docx)
              </button>
            )}
          </div>
        ) : loading ? (
          /* Loading State */
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary-500 mb-4" />
            <p className="text-neutral-500 dark:text-neutral-400">Загрузка расписания...</p>
          </div>
        ) : scheduleData.entries.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-neutral-400" />
            </div>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-2">
              Расписание не найдено
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-center">
              Для группы <strong>{selectedGroup}</strong> ещё нет загруженного расписания.
            </p>
          </div>
        ) : (
          /* Schedule Table */
          <div className="space-y-6">
            {/* Upload info */}
            {scheduleData.uploads.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
                <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border shadow-sm">
                  📋 Группа: <strong className="text-neutral-900 dark:text-white">{selectedGroup}</strong>
                </span>
                {scheduleData.uploads[0]?.shift && (
                  <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border shadow-sm">
                    🕐 {scheduleData.uploads[0].shift}
                  </span>
                )}
                {scheduleData.uploads[0]?.week_type && (
                  <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border shadow-sm">
                    📅 {scheduleData.uploads[0].week_type}
                  </span>
                )}
              </div>
            )}

            {/* Schedule Cards */}
            <div className="grid gap-3">
              {scheduleData.entries.map((entry, idx) => (
                <div
                  key={entry.id || idx}
                  className="group relative bg-white dark:bg-dark-surface rounded-2xl border border-neutral-200 dark:border-dark-border shadow-sm hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300 overflow-hidden"
                >
                  {/* Lesson number accent bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${
                    entry.lesson_number === 1 ? 'bg-blue-500' :
                    entry.lesson_number === 2 ? 'bg-emerald-500' :
                    entry.lesson_number === 3 ? 'bg-amber-500' :
                    'bg-purple-500'
                  }`} />

                  <div className="pl-6 pr-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Lesson Number Badge */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold text-white shadow-lg ${
                      entry.lesson_number === 1 ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30' :
                      entry.lesson_number === 2 ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/30' :
                      entry.lesson_number === 3 ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/30' :
                      'bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/30'
                    }`}>
                      <span className="text-[10px] opacity-80 leading-none">пара</span>
                      <span className="text-lg leading-none">{entry.lesson_number}</span>
                    </div>

                    {/* Subject & Teacher */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-neutral-900 dark:text-white text-base truncate">
                        {entry.subject || 'Предмет'}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        <User className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{entry.teacher || 'Преподаватель'}</span>
                      </div>
                    </div>

                    {/* Time & Room Info */}
                    <div className="flex items-center gap-4 sm:gap-6 text-sm flex-shrink-0">
                      {entry.lesson_time && (
                        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                          <Clock className="w-4 h-4 text-primary-500" />
                          <span className="font-medium">{entry.lesson_time}</span>
                        </div>
                      )}
                      {entry.room && (
                        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                          <MapPin className="w-4 h-4 text-primary-500" />
                          <span className="font-medium whitespace-nowrap">{entry.room}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
