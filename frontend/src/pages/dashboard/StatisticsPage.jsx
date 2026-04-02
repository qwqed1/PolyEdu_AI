import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, BookOpen, Award } from 'lucide-react';
import statsService from '../../services/statsService';

export default function StatisticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await statsService.getDetailedStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (grade === null) return 'text-gray-400';
    if (grade >= 90) return 'text-green-500';
    if (grade >= 75) return 'text-blue-500';
    if (grade >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="text-xl text-neutral-600 dark:text-neutral-400">Р—Р°РіСЂСѓР·РєР° СЃС‚Р°С‚РёСЃС‚РёРєРё...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg p-8">
      <div className="max-w-7xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-6 hover:underline">
          <ArrowLeft className="w-5 h-5" />
          РќР°Р·Р°Рґ Рє РїСЂРѕС„РёР»СЋ
        </Link>

        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-8">
          рџ“Љ РЎС‚Р°С‚РёСЃС‚РёРєР°
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Р’СЃРµРіРѕ РіСЂСѓРїРї</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {stats?.summary?.total_groups || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Р’СЃРµРіРѕ СЃС‚СѓРґРµРЅС‚РѕРІ</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {stats?.summary?.total_students || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">РЎСЂРµРґРЅРёР№ Р±Р°Р»Р»</p>
                <p className={`text-2xl font-bold ${getGradeColor(stats?.summary?.average_grade)}`}>
                  {stats?.summary?.average_grade || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
            РЎС‚Р°С‚РёСЃС‚РёРєР° РїРѕ РіСЂСѓРїРїР°Рј
          </h2>
          {stats?.groups?.length === 0 ? (
            <p className="text-neutral-600 dark:text-neutral-400 text-center py-8">
              РќРµС‚ РіСЂСѓРїРї РґР»СЏ РѕС‚РѕР±СЂР°Р¶РµРЅРёСЏ
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-neutral-600 dark:text-neutral-400 font-medium">Р“СЂСѓРїРїР°</th>
                    <th className="text-center py-3 px-4 text-neutral-600 dark:text-neutral-400 font-medium">РЎС‚СѓРґРµРЅС‚РѕРІ</th>
                    <th className="text-center py-3 px-4 text-neutral-600 dark:text-neutral-400 font-medium">РћС†РµРЅРѕРє</th>
                    <th className="text-center py-3 px-4 text-neutral-600 dark:text-neutral-400 font-medium">РЎСЂРµРґРЅРёР№ Р±Р°Р»Р»</th>
                    <th className="text-center py-3 px-4 text-neutral-600 dark:text-neutral-400 font-medium">РњРёРЅ</th>
                    <th className="text-center py-3 px-4 text-neutral-600 dark:text-neutral-400 font-medium">РњР°РєСЃ</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.groups?.map((group) => (
                    <tr key={group.id} className="border-b border-neutral-100 dark:border-gray-700/50 hover:bg-neutral-50 dark:hover:bg-gray-700/30">
                      <td className="py-3 px-4">
                        <Link to={`/groups/${group.id}`} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
                          {group.name}
                        </Link>
                      </td>
                      <td className="text-center py-3 px-4 text-neutral-900 dark:text-white">
                        {group.student_count}
                      </td>
                      <td className="text-center py-3 px-4 text-neutral-900 dark:text-white">
                        {group.total_grades}
                      </td>
                      <td className={`text-center py-3 px-4 font-bold ${getGradeColor(group.average_grade)}`}>
                        {group.average_grade || '-'}
                      </td>
                      <td className="text-center py-3 px-4 text-neutral-600 dark:text-neutral-400">
                        {group.min_grade || '-'}
                      </td>
                      <td className="text-center py-3 px-4 text-neutral-600 dark:text-neutral-400">
                        {group.max_grade || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
            Р РµР№С‚РёРЅРі СЃС‚СѓРґРµРЅС‚РѕРІ
          </h2>
          {stats?.students?.length === 0 ? (
            <p className="text-neutral-600 dark:text-neutral-400 text-center py-8">
              РќРµС‚ СЃС‚СѓРґРµРЅС‚РѕРІ РґР»СЏ РѕС‚РѕР±СЂР°Р¶РµРЅРёСЏ
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-neutral-600 dark:text-neutral-400 font-medium">#</th>
                    <th className="text-left py-3 px-4 text-neutral-600 dark:text-neutral-400 font-medium">РЎС‚СѓРґРµРЅС‚</th>
                    <th className="text-left py-3 px-4 text-neutral-600 dark:text-neutral-400 font-medium">Р“СЂСѓРїРїР°</th>
                    <th className="text-center py-3 px-4 text-neutral-600 dark:text-neutral-400 font-medium">РћС†РµРЅРѕРє</th>
                    <th className="text-center py-3 px-4 text-neutral-600 dark:text-neutral-400 font-medium">РЎСЂРµРґРЅРёР№ Р±Р°Р»Р»</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.students?.map((student, index) => (
                    <tr key={student.id} className="border-b border-neutral-100 dark:border-gray-700/50 hover:bg-neutral-50 dark:hover:bg-gray-700/30">
                      <td className="py-3 px-4">
                        {index < 3 ? (
                          <span className="text-xl">{index === 0 ? 'рџҐ‡' : index === 1 ? 'рџҐ€' : 'рџҐ‰'}</span>
                        ) : (
                          <span className="text-neutral-600 dark:text-neutral-400">{index + 1}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {student.full_name.charAt(0)}
                          </div>
                          <span className="font-medium text-neutral-900 dark:text-white">
                            {student.full_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                        {student.group_name}
                      </td>
                      <td className="text-center py-3 px-4 text-neutral-900 dark:text-white">
                        {student.total_grades}
                      </td>
                      <td className={`text-center py-3 px-4 font-bold ${getGradeColor(student.average_grade)}`}>
                        {student.average_grade || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
