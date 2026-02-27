import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Clock, Calendar as CalendarIcon, Plus } from 'lucide-react';

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month', 'week', 'day'
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Event State
  const [events, setEvents] = useState([
    // Initial mock data
    { id: 1, title: 'Встреча с командой', date: new Date(), type: 'work', time: '10:00', duration: 60 },
    { id: 2, title: 'Лекция по React', date: new Date(new Date().setDate(new Date().getDate() + 2)), type: 'study', time: '14:00', duration: 90 }
  ]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', time: '09:00', type: 'study', duration: 60 });

  // Helpers
  const formatMonth = (date) => date.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
  const isSameDay = (d1, d2) => d1.toDateString() === d2.toDateString();
  
  // Hours for timeline (06:00 to 23:00)
  const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);

  // Navigation
  const navigate = (direction) => {
    const newDate = new Date(currentDate);
    if (view === 'month') newDate.setMonth(currentDate.getMonth() + direction);
    else if (view === 'week') newDate.setDate(currentDate.getDate() + (direction * 7));
    else newDate.setDate(currentDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Event Handlers
  const handleDayClick = (date) => {
    setSelectedDate(date);
    setNewEvent(prev => ({ ...prev, date: date, time: '09:00' }));
    setIsModalOpen(true);
  };

  const handleTimeSlotClick = (date, hour) => {
    const timeString = `${hour.toString().padStart(2, '0')}:00`;
    setSelectedDate(date);
    setNewEvent(prev => ({ ...prev, date: date, time: timeString }));
    setIsModalOpen(true);
  };

  const saveEvent = () => {
    if (!newEvent.title) return;
    setEvents([...events, { ...newEvent, id: Date.now(), date: newEvent.date || selectedDate }]);
    setIsModalOpen(false);
    setNewEvent({ title: '', time: '09:00', type: 'study', duration: 60 });
  };

  // --- Views ---

  const MonthView = () => {
    const getDaysInMonth = (date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const days = new Date(year, month + 1, 0).getDate();
      const firstDay = new Date(year, month, 1).getDay();
      const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
      const daysArray = [];

      // Prev month
      const prevMonthDays = new Date(year, month, 0).getDate();
      for (let i = 0; i < adjustedFirstDay; i++) {
        daysArray.push({ day: prevMonthDays - adjustedFirstDay + 1 + i, type: 'prev', date: new Date(year, month - 1, prevMonthDays - adjustedFirstDay + 1 + i) });
      }
      // Current month
      for (let i = 1; i <= days; i++) {
        daysArray.push({ day: i, type: 'current', date: new Date(year, month, i) });
      }
      // Next month (fill to 42)
      const remaining = 42 - daysArray.length;
      for (let i = 1; i <= remaining; i++) {
        daysArray.push({ day: i, type: 'next', date: new Date(year, month + 1, i) });
      }
      return daysArray;
    };

    const days = getDaysInMonth(currentDate);
    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    return (
      <div className="flex flex-col h-full">
        <div className="grid grid-cols-7 mb-2 shrink-0">
          {weekDays.map(day => (
            <div key={day} className="text-center text-neutral-500 dark:text-neutral-400 font-medium py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 grid-rows-6 flex-1 gap-1 min-h-0">
          {days.map((dayObj, idx) => {
            const isToday = isSameDay(new Date(), dayObj.date);
            const isSelected = isSameDay(selectedDate, dayObj.date);
            const dayEvents = events.filter(e => isSameDay(e.date, dayObj.date));

            return (
              <div
                key={idx}
                onClick={() => handleDayClick(dayObj.date)}
                className={`
                  p-1 md:p-2 rounded-lg transition-all relative flex flex-col items-start justify-start cursor-pointer overflow-hidden
                  ${dayObj.type === 'current' 
                    ? 'bg-white dark:bg-dark-surface hover:shadow-md border border-transparent hover:border-primary-200 dark:hover:border-primary-800' 
                    : 'bg-neutral-50/50 dark:bg-neutral-900/20 text-neutral-400 dark:text-neutral-600'
                  }
                  ${isSelected ? 'ring-2 ring-primary-500 ring-inset' : ''}
                `}
              >
                <span className={`
                  text-xs md:text-sm font-medium w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full mb-1
                  ${isToday ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : ''}
                `}>
                  {dayObj.day}
                </span>
                
                <div className="w-full flex flex-col gap-1 overflow-y-auto no-scrollbar">
                  {dayEvents.map(event => (
                    <div key={event.id} className={`
                      text-[10px] px-1.5 py-0.5 rounded truncate w-full border-l-2
                      ${event.type === 'work' 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-500' 
                        : 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-500'}
                    `}>
                      {event.time} {event.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const WeekView = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); 
    startOfWeek.setDate(diff);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        weekDays.push(d);
    }

    return (
      <div className="flex flex-col h-full bg-white/40 dark:bg-dark-surface/40 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-dark-border shadow-xl overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-8 border-b border-neutral-200 dark:border-dark-border bg-white/50 dark:bg-dark-surface/50">
           <div className="p-4 border-r border-neutral-200 dark:border-dark-border text-center text-xs text-neutral-400 uppercase font-bold tracking-wider">
             Время
           </div>
           {weekDays.map((d, i) => {
             const isToday = isSameDay(new Date(), d);
             return (
               <div key={i} className={`p-2 text-center border-r border-neutral-200 dark:border-dark-border last:border-0 ${isToday ? 'bg-primary-50 dark:bg-primary-900/10' : ''}`}>
                   <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{d.toLocaleString('ru-RU', { weekday: 'short' }).toUpperCase()}</div>
                   <div className={`text-xl font-bold w-10 h-10 mx-auto flex items-center justify-center rounded-full ${isToday ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'text-neutral-800 dark:text-neutral-100'}`}>
                     {d.getDate()}
                   </div>
               </div>
             );
           })}
        </div>

        {/* Timeline Grid */}
        <div className="flex-1 overflow-y-auto relative no-scrollbar">
           {HOURS.map(hour => (
             <div key={hour} className="grid grid-cols-8 min-h-[80px] border-b border-dashed border-neutral-200 dark:border-dark-border">
                {/* Time Label */}
                <div className="p-2 text-center text-sm font-medium text-neutral-400 border-r border-neutral-200 dark:border-dark-border sticky left-0 bg-white/50 dark:bg-dark-bg/50 backdrop-blur z-10">
                   {hour}:00
                </div>
                
                {/* Days Columns */}
                {weekDays.map((d, colIndex) => {
                  const dayEvents = events.filter(e => isSameDay(e.date, d));
                  
                  return (
                    <div 
                      key={colIndex} 
                      className="border-r border-neutral-200 dark:border-dark-border last:border-0 relative group"
                      onClick={() => handleTimeSlotClick(d, hour)}
                    >
                      {/* Hover effect for add */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-primary-50/50 dark:bg-primary-900/10 transition-opacity cursor-pointer flex items-center justify-center">
                          <Plus className="w-5 h-5 text-primary-400" />
                      </div>

                      {/* Events for this slot */}
                      {dayEvents.map(event => {
                         const eventHour = parseInt(event.time.split(':')[0]);
                         if (eventHour === hour) {
                           return (
                             <div 
                               key={event.id}
                               className={`
                                 absolute top-1 left-1 right-1 z-20 p-2 rounded-lg text-xs border-l-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow
                                 ${event.type === 'work' 
                                   ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-100 border-blue-500' 
                                   : 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-100 border-purple-500'}
                               `}
                               onClick={(e) => { e.stopPropagation(); /* Handle event edit click */ }}
                             >
                               <div className="font-bold">{event.title}</div>
                               <div className="opacity-80">{event.time}</div>
                             </div>
                           );
                         }
                         return null;
                      })}
                    </div>
                  )
                })}
             </div>
           ))}
        </div>
      </div>
    );
  };

  const DayView = () => {
    const dayEvents = events.filter(e => isSameDay(e.date, currentDate));

    return (
      <div className="flex flex-col h-full bg-white/40 dark:bg-dark-surface/40 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-dark-border shadow-xl overflow-hidden">
        {/* Header */}
         <div className="p-4 border-b border-neutral-200 dark:border-dark-border bg-white/50 dark:bg-dark-surface/50 text-center">
             <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 capitalize">
               {currentDate.toLocaleString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
             </h2>
         </div>

         {/* Timeline */}
         <div className="flex-1 overflow-y-auto no-scrollbar relative p-4">
            {HOURS.map(hour => (
              <div key={hour} className="flex min-h-[100px] border-b border-neutral-100 dark:border-dark-border group">
                {/* Time */}
                <div className="w-20 text-right pr-4 pt-2 text-sm font-medium text-neutral-400 border-r border-neutral-200 dark:border-dark-border">
                  {hour}:00
                </div>
                
                {/* Slot */}
                <div 
                  className="flex-1 relative pl-4 pt-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/20 transition-colors cursor-pointer"
                  onClick={() => handleTimeSlotClick(currentDate, hour)}
                >
                   {/* Ghost Add Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                       <Plus className="w-6 h-6 text-neutral-300" />
                    </div>

                   {/* Events */}
                   {dayEvents.map(event => {
                      const eventHour = parseInt(event.time.split(':')[0]);
                      if (eventHour === hour) {
                        return (
                          <div 
                            key={event.id}
                            className={`
                              mb-2 p-3 rounded-xl border-l-4 shadow-sm relative z-10
                              ${event.type === 'work' 
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' 
                                : 'bg-purple-50 dark:bg-purple-900/20 border-purple-500'}
                            `}
                            onClick={(e) => { e.stopPropagation(); }}
                          >
                             <div className="flex items-center justify-between mb-1">
                               <h3 className="font-bold text-neutral-800 dark:text-neutral-100">{event.title}</h3>
                               <span className={`text-xs px-2 py-1 rounded-full ${event.type === 'work' ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-100' : 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-100'}`}>
                                 {event.type === 'work' ? 'Работа' : 'Учеба'}
                               </span>
                             </div>
                             <p className="text-sm text-neutral-600 dark:text-neutral-400">
                               <Clock className="w-3 h-3 inline mr-1" /> {event.time}
                             </p>
                          </div>
                        );
                      }
                      return null;
                   })}
                </div>
              </div>
            ))}
         </div>
      </div>
    );
  };

  // --- Modal ---
  const AddEventModal = () => {
    if (!isModalOpen) return null;
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in duration-200">
          <div className="p-4 border-b border-neutral-100 dark:border-dark-border flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
            <h3 className="font-bold text-lg text-neutral-800 dark:text-neutral-100">Новое событие</h3>
            <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Название</label>
              <input 
                autoFocus
                type="text" 
                value={newEvent.title}
                onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border bg-transparent focus:ring-2 focus:ring-primary-500 outline-none transition-all text-neutral-900 dark:text-white"
                placeholder="Напр. Созвон с клиентом"
              />
            </div>
            
            <div>
               <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Дата</label>
               <div className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-400 text-sm">
                 {newEvent.date?.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Время</label>
                <input 
                  type="time" 
                  value={newEvent.time}
                  onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border bg-transparent focus:ring-2 focus:ring-primary-500 outline-none transition-all text-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Тип</label>
                <select 
                  value={newEvent.type}
                  onChange={e => setNewEvent({...newEvent, type: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border bg-transparent focus:ring-2 focus:ring-primary-500 outline-none transition-all text-neutral-900 dark:text-white"
                >
                  <option value="work">Работа</option>
                  <option value="study">Учеба</option>
                  <option value="other">Другое</option>
                </select>
              </div>
            </div>
            <div className="pt-2 flex gap-2">
              <button 
                onClick={saveEvent}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 rounded-lg transition-all shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Добавить
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Main Render ---
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-neutral-50 dark:bg-dark-bg">
      <AddEventModal />
      
      {/* Header */}
      <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-white/50 dark:bg-dark-surface/50 backdrop-blur-sm border-b border-neutral-200 dark:border-dark-border z-10">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400 capitalize">
            {formatMonth(currentDate)}
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex bg-neutral-100 dark:bg-dark-surface rounded-lg p-1 border border-neutral-200 dark:border-dark-border">
            {['month', 'week', 'day'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                  view === v 
                    ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white' 
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                }`}
              >
                {v === 'month' ? 'Месяц' : v === 'week' ? 'Неделя' : 'День'}
              </button>
            ))}
          </div>
          
          <div className="h-6 w-px bg-neutral-200 dark:bg-dark-border mx-1" />

          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-neutral-100 dark:hover:bg-dark-surface rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
            </button>
            <button onClick={goToToday} className="px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-dark-surface rounded-lg text-sm font-medium transition-colors">
              Сегодня
            </button>
            <button onClick={() => navigate(1)} className="p-2 hover:bg-neutral-100 dark:hover:bg-dark-surface rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
            </button>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="hidden md:flex ml-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg shadow-lg shadow-primary-500/20 transition-all items-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" /> Еще
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-2 md:p-4">
        {view === 'month' && (
           <div className="h-full bg-white/40 dark:bg-dark-surface/40 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-dark-border shadow-xl p-4 overflow-hidden">
             <MonthView />
           </div>
        )}
        {view === 'week' && <WeekView />}
        {view === 'day' && <DayView />}
      </div>
    </div>
  );
}
