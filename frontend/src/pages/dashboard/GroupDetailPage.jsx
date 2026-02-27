import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Plus, Trash2, Star, X, BookOpen, ChevronDown, ChevronRight, Layers, FileText } from 'lucide-react';
import groupService from '../../services/groupService';
import studentService from '../../services/studentService';
import gradeService from '../../services/gradeService';
import subjectService from '../../services/subjectService';
import moduleService from '../../services/moduleService';

export default function GroupDetailPage() {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddGrade, setShowAddGrade] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showGradeHistory, setShowGradeHistory] = useState(false);
  const [showAddModule, setShowAddModule] = useState(false);
  const [showAddModuleSubject, setShowAddModuleSubject] = useState(false);
  
  // Modules state
  const [modules, setModules] = useState([]);
  const [expandedModules, setExpandedModules] = useState({});
  const [newModuleCode, setNewModuleCode] = useState('');
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleType, setNewModuleType] = useState('theory');
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [newModSubCode, setNewModSubCode] = useState('');
  const [newModSubName, setNewModSubName] = useState('');
  
  // Form states
  const [newStudentName, setNewStudentName] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [gradeValue, setGradeValue] = useState('');
  const [gradeTopic, setGradeTopic] = useState('');
  const [gradeDate, setGradeDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [studentGrades, setStudentGrades] = useState([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [g, s, st, sub, mod] = await Promise.all([
        groupService.getById(id),
        studentService.getByGroupId(id),
        groupService.getStats(id),
        subjectService.getAll(),
        moduleService.getByGroupId(id)
      ]);
      setGroup(g.data);
      setStudents(s.data);
      setStats(st.data);
      setSubjects(sub.data || []);
      setModules(mod.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    try {
      await studentService.create(newStudentName.trim(), id);
      setNewStudentName('');
      setShowAddStudent(false);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!confirm('Удалить студента?')) return;
    try {
      await studentService.delete(studentId);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenGradeModal = (student) => {
    setSelectedStudent(student);
    setGradeValue('');
    setGradeTopic('');
    setGradeDate(new Date().toISOString().split('T')[0]);
    setSelectedSubject(subjects.length > 0 ? subjects[0].id : '');
    setShowAddGrade(true);
  };

  const handleAddGrade = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedSubject || gradeValue === '') return;
    
    const grade = parseInt(gradeValue);
    if (isNaN(grade) || grade < 0 || grade > 100) {
      alert('Оценка должна быть от 0 до 100');
      return;
    }

    try {
      await gradeService.create(
        selectedStudent.id,
        parseInt(selectedSubject),
        grade,
        gradeTopic || null,
        gradeDate
      );
      setShowAddGrade(false);
      setSelectedStudent(null);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    try {
      await subjectService.create(newSubjectName.trim());
      setNewSubjectName('');
      setShowAddSubject(false);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewGrades = async (student) => {
    try {
      const response = await gradeService.getByStudentId(student.id);
      setStudentGrades(response.data || []);
      setSelectedStudent(student);
      setShowGradeHistory(true);
    } catch (err) {
      console.error(err);
      setStudentGrades([]);
    }
  };

  const handleDeleteGrade = async (gradeId) => {
    if (!confirm('Удалить оценку?')) return;
    try {
      await gradeService.delete(gradeId);
      // Refresh grades
      const response = await gradeService.getByStudentId(selectedStudent.id);
      setStudentGrades(response.data || []);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Module handlers
  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!newModuleCode.trim() || !newModuleName.trim()) return;
    try {
      await moduleService.create(id, newModuleCode.trim(), newModuleName.trim(), newModuleType);
      setNewModuleCode('');
      setNewModuleName('');
      setNewModuleType('theory');
      setShowAddModule(false);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!confirm('Удалить модуль и все его предметы?')) return;
    try {
      await moduleService.delete(moduleId);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenAddModuleSubject = (moduleId) => {
    setSelectedModuleId(moduleId);
    setNewModSubCode('');
    setNewModSubName('');
    setShowAddModuleSubject(true);
  };

  const handleAddModuleSubject = async (e) => {
    e.preventDefault();
    if (!newModSubCode.trim() || !newModSubName.trim() || !selectedModuleId) return;
    try {
      await moduleService.addSubject(selectedModuleId, newModSubCode.trim(), newModSubName.trim());
      setNewModSubCode('');
      setNewModSubName('');
      setShowAddModuleSubject(false);
      setSelectedModuleId(null);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteModuleSubject = async (subjectId) => {
    if (!confirm('Удалить предмет из модуля?')) return;
    try {
      await moduleService.deleteSubject(subjectId);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const theoryModules = modules.filter(m => m.module_type === 'theory');
  const practiceModules = modules.filter(m => m.module_type === 'practice');

  const getGradeColor = (grade) => {
    if (grade >= 90) return 'bg-green-500';
    if (grade >= 75) return 'bg-blue-500';
    if (grade >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) return <div className="p-8 text-center">Загрузка...</div>;
  if (!group) return <div className="p-8 text-center">Группа не найдена</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <Link to="/groups" className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-4 hover:underline">
          <ArrowLeft className="w-5 h-5" />
          Назад
        </Link>
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{group.name}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModule(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
            >
              <Layers className="w-5 h-5" />
              Добавить модуль
            </button>
            <button
              onClick={() => setShowAddSubject(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
            >
              <BookOpen className="w-5 h-5" />
              Добавить предмет
            </button>
            <button
              onClick={() => setShowAddStudent(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
            >
              <Plus className="w-5 h-5" />
              Добавить студента
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Студентов</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.total_students || 0}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Средний балл</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.average_grade || '-'}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Мин</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.min_grade || '-'}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Макс</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.max_grade || '-'}</div>
          </div>
        </div>

        {/* Modules Section */}
        {modules.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              Модули
            </h2>

            {/* Теория */}
            {theoryModules.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3 border-b dark:border-gray-700 pb-2">
                  Теория:
                </h3>
                <div className="space-y-3">
                  {theoryModules.map((mod) => (
                    <div key={mod.id} className="border dark:border-gray-700 rounded-lg overflow-hidden">
                      <div
                        className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition"
                        onClick={() => toggleModule(mod.id)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {expandedModules[mod.id] ? (
                            <ChevronDown className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                          )}
                          <span className="font-bold text-indigo-700 dark:text-indigo-300 flex-shrink-0">{mod.code}</span>
                          <span className="text-gray-800 dark:text-gray-200 truncate">{mod.name}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenAddModuleSubject(mod.id); }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-200 dark:hover:bg-indigo-900/40 rounded transition"
                            title="Добавить предмет"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteModule(mod.id); }}
                            className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition"
                            title="Удалить модуль"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {expandedModules[mod.id] && (
                        <div className="p-3 space-y-2 bg-white dark:bg-gray-800">
                          {mod.subjects.length === 0 ? (
                            <div className="text-sm text-gray-400 dark:text-gray-500 py-2 pl-6">Нет предметов</div>
                          ) : (
                            mod.subjects.map((sub) => (
                              <div key={sub.id} className="flex items-center justify-between pl-6 pr-2 py-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="font-medium text-indigo-600 dark:text-indigo-400 flex-shrink-0">{sub.code}</span>
                                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{sub.name}</span>
                                </div>
                                <button
                                  onClick={() => handleDeleteModuleSubject(sub.id)}
                                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition flex-shrink-0"
                                  title="Удалить"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Практика */}
            {practiceModules.length > 0 && (
              <div>
                <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3 border-b dark:border-gray-700 pb-2">
                  Практика:
                </h3>
                <div className="space-y-3">
                  {practiceModules.map((mod) => (
                    <div key={mod.id} className="border dark:border-gray-700 rounded-lg overflow-hidden">
                      <div
                        className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition"
                        onClick={() => toggleModule(mod.id)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {expandedModules[mod.id] ? (
                            <ChevronDown className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          )}
                          <span className="font-bold text-emerald-700 dark:text-emerald-300 flex-shrink-0">{mod.code}</span>
                          <span className="text-gray-800 dark:text-gray-200 truncate">{mod.name}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenAddModuleSubject(mod.id); }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900/40 rounded transition"
                            title="Добавить предмет"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteModule(mod.id); }}
                            className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition"
                            title="Удалить модуль"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {expandedModules[mod.id] && (
                        <div className="p-3 space-y-2 bg-white dark:bg-gray-800">
                          {mod.subjects.length === 0 ? (
                            <div className="text-sm text-gray-400 dark:text-gray-500 py-2 pl-6">Нет предметов</div>
                          ) : (
                            mod.subjects.map((sub) => (
                              <div key={sub.id} className="flex items-center justify-between pl-6 pr-2 py-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="font-medium text-emerald-600 dark:text-emerald-400 flex-shrink-0">{sub.code}</span>
                                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{sub.name}</span>
                                </div>
                                <button
                                  onClick={() => handleDeleteModuleSubject(sub.id)}
                                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition flex-shrink-0"
                                  title="Удалить"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Subjects list */}
        {subjects.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Ваши предметы</h2>
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <span key={subject.id} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                  {subject.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Students List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Список студентов</h2>
          {students.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Нет студентов</div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                      {student.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{student.full_name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Средний балл: {student.average_grade || '-'} | Оценок: {student.total_grades || 0}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewGrades(student)}
                      className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition"
                      title="История оценок"
                    >
                      <BookOpen className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleOpenGradeModal(student)}
                      className="p-2 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg transition"
                      title="Поставить оценку"
                    >
                      <Star className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteStudent(student.id)}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition"
                      title="Удалить студента"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Student Modal */}
        {showAddStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAddStudent(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Добавить студента</h2>
                <button onClick={() => setShowAddStudent(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddStudent}>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="ФИО студента"
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowAddStudent(false)} className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300">
                    Отмена
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
                    Добавить
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Grade Modal */}
        {showAddGrade && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAddGrade(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Поставить оценку</h2>
                <button onClick={() => setShowAddGrade(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Студент: <strong>{selectedStudent.full_name}</strong></p>
              
              {subjects.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Сначала добавьте предмет</p>
                  <button
                    onClick={() => {
                      setShowAddGrade(false);
                      setShowAddSubject(true);
                    }}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                  >
                    Добавить предмет
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAddGrade}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Предмет</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    >
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Оценка (0-100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={gradeValue}
                      onChange={(e) => setGradeValue(e.target.value)}
                      placeholder="Например: 85"
                      className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Тема (необязательно)</label>
                    <input
                      type="text"
                      value={gradeTopic}
                      onChange={(e) => setGradeTopic(e.target.value)}
                      placeholder="Например: Контрольная работа №1"
                      className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Дата</label>
                    <input
                      type="date"
                      value={gradeDate}
                      onChange={(e) => setGradeDate(e.target.value)}
                      className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowAddGrade(false)} className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300">
                      Отмена
                    </button>
                    <button type="submit" className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
                      Поставить
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Add Subject Modal */}
        {showAddSubject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAddSubject(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Добавить предмет</h2>
                <button onClick={() => setShowAddSubject(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddSubject}>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="Название предмета"
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowAddSubject(false)} className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300">
                    Отмена
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                    Добавить
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Module Modal */}
        {showAddModule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAddModule(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Добавить модуль</h2>
                <button onClick={() => setShowAddModule(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddModule}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Тип модуля</label>
                  <select
                    value={newModuleType}
                    onChange={(e) => setNewModuleType(e.target.value)}
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="theory">Теория</option>
                    <option value="practice">Практика</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Код модуля</label>
                  <input
                    type="text"
                    value={newModuleCode}
                    onChange={(e) => setNewModuleCode(e.target.value)}
                    placeholder="Например: КМ1"
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название модуля</label>
                  <textarea
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    placeholder="Например: Электроника және электротехника зандарын, аналогтік және цифрлық техника бойынша білімді қолдану"
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    rows={3}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowAddModule(false)} className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300">
                    Отмена
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">
                    Добавить
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Module Subject Modal */}
        {showAddModuleSubject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAddModuleSubject(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Добавить предмет в модуль</h2>
                <button onClick={() => setShowAddModuleSubject(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddModuleSubject}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Код предмета</label>
                  <input
                    type="text"
                    value={newModSubCode}
                    onChange={(e) => setNewModSubCode(e.target.value)}
                    placeholder="Например: ОН1.1"
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название предмета</label>
                  <textarea
                    value={newModSubName}
                    onChange={(e) => setNewModSubName(e.target.value)}
                    placeholder="Например: Электрондық техниканың әртүрлі түрлерінің құрылғыларын, блоктары мен аспаптарын монтаждау"
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    rows={3}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowAddModuleSubject(false)} className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300">
                    Отмена
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">
                    Добавить
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Grade History Modal */}
        {showGradeHistory && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowGradeHistory(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">История оценок</h2>
                <button onClick={() => setShowGradeHistory(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Студент: <strong>{selectedStudent.full_name}</strong></p>
              
              {studentGrades.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">Нет оценок</div>
              ) : (
                <div className="space-y-3">
                  {studentGrades.map((grade) => (
                    <div key={grade.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${getGradeColor(grade.grade)} rounded-lg flex items-center justify-center text-white font-bold text-lg`}>
                          {grade.grade}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{grade.subject_name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {grade.topic || 'Без темы'} • {new Date(grade.date).toLocaleDateString('ru-RU')}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteGrade(grade.id)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
