import React from 'react';
import { useAuth } from '../App';
import { db } from '../services/mockDb';
import { UserRole, ExcursionScope } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, color, onClick }: any) => (
  <div
    onClick={onClick}
    className={`glass p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white font-display">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color} shadow-lg shadow-current/20`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get fresh user data to avoid stale classId from localStorage
  const currentUser = user ? db.getUsers().find(u => u.id === user.id) || user : user;

  const excursions = db.getExcursions();
  const participations = db.getParticipations();

  // Helper para mostrar scope legible
  const getScopeLabel = (scope: string, targetId?: string) => {
    if (scope === ExcursionScope.GLOBAL) return 'Global (Todo el Centro)';
    if (scope === ExcursionScope.CICLO) {
      const cycle = db.cycles.find(c => c.id === targetId);
      return `Ciclo: ${cycle?.name || 'Desconocido'}`;
    }
    if (scope === ExcursionScope.CLASE) {
      const cls = db.classes.find(c => c.id === targetId);
      return `Clase: ${cls?.name || 'Desconocida'}`;
    }
    return scope;
  };

  // Filter data based on role
  const relevantExcursions = excursions.filter(e => {
    if (user?.role === UserRole.DIRECCION || user?.role === UserRole.TESORERIA) return true;
    if (user?.role === UserRole.TUTOR) {
      if (e.scope === 'GLOBAL') return true;
      if (e.scope === 'CLASE' && e.targetId === currentUser?.classId) return true;
      // Simplified cycle check
      const myClass = db.classes.find(c => c.id === currentUser?.classId);
      if (e.scope === 'CICLO' && e.targetId === myClass?.cycleId) return true;
    }
    return false;
  }).sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());

  const upcomingExcursions = relevantExcursions.filter(e => new Date(e.dateEnd) >= new Date());

  const totalCollected = relevantExcursions.reduce((acc, exc) => {
    const parts = participations.filter(p => p.excursionId === exc.id && p.paid);
    return acc + parts.reduce((sum, p) => sum + p.amountPaid, 0);
  }, 0);

  const totalCost = relevantExcursions.reduce((acc, exc) => {
    return acc + Number(exc.costBus) + Number(exc.costOther || 0) + (Number(exc.costEntry) * Number(exc.estimatedStudents || 0));
  }, 0);

  const chartData = relevantExcursions.slice(0, 5).map(e => ({
    name: e.title.substring(0, 15) + '...',
    cost: Number(e.costBus) + Number(e.costOther || 0) + (Number(e.costEntry) * Number(e.estimatedStudents || 0)),
    collected: participations
      .filter(p => p.excursionId === e.id && p.paid)
      .reduce((sum, p) => sum + p.amountPaid, 0)
  }));

  const handleExcursionClick = (id: string) => {
    // Navegar pasando el ID en el estado para que el manager lo abra
    navigate('/excursions', { state: { selectedId: id } });
  };

  return (
    <div className="space-y-8 animate-slide-up pb-safe">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display text-gray-900 dark:text-white">Hola, {user?.name}</h2>
          <p className="text-gray-500 dark:text-gray-400">Aquí tienes el resumen de las excursiones.</p>
        </div>
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 glass px-4 py-2 rounded-xl">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Excursiones Activas"
          value={relevantExcursions.length}
          icon={Calendar}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          onClick={() => navigate('/excursions')}
        />
        <StatCard
          title="Participantes Totales"
          value={participations.filter(p => relevantExcursions.some(e => e.id === p.excursionId)).length}
          icon={Users}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        {(user?.role === UserRole.DIRECCION || user?.role === UserRole.TESORERIA) && (
          <>
            <StatCard
              title="Recaudado Total"
              value={`${totalCollected}€`}
              icon={DollarSign}
              color="bg-gradient-to-br from-emerald-500 to-emerald-600"
              onClick={() => navigate('/treasury')}
            />
            <StatCard
              title="Balance Neto"
              value={`${totalCollected - totalCost}€`}
              icon={TrendingUp}
              color={totalCollected - totalCost >= 0 ? "bg-gradient-to-br from-teal-500 to-teal-600" : "bg-gradient-to-br from-red-500 to-red-600"}
              onClick={() => navigate('/treasury')}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-6 font-display text-gray-900 dark:text-white">Próximas Salidas</h3>
          <div className="space-y-3">
            {upcomingExcursions.map((ex, i) => (
              <div
                key={ex.id}
                onClick={() => handleExcursionClick(ex.id)}
                className="flex items-center gap-4 p-4 hover:bg-white/50 dark:hover:bg-white/5 cursor-pointer rounded-xl transition-all duration-200 border border-transparent hover:border-gray-100 dark:hover:border-white/5 group"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 transition-colors shadow-sm bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 group-hover:scale-110 duration-300">
                  {new Date(ex.dateStart).getDate()}/{new Date(ex.dateStart).getMonth() + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold font-display truncate text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">{ex.title}</h4>
                  <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    <span className="truncate">{ex.destination}</span>
                    <span className="opacity-50">•</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">{getScopeLabel(ex.scope, ex.targetId)}</span>
                  </div>
                </div>
                <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${ex.scope === 'GLOBAL' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'}`}>
                  {ex.scope}
                </span>
              </div>
            ))}
            {upcomingExcursions.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300 dark:text-gray-600">
                  <Calendar size={32} />
                </div>
                <p className="text-gray-400 dark:text-gray-500 font-medium">No hay excursiones próximas</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-6 font-display text-gray-900 dark:text-white">Balance Financiero</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.2)" />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#9ca3af' }} interval={0} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}€`} tick={{ fill: '#9ca3af' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(156, 163, 175, 0.1)' }}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="collected" name="Recaudado" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" name="Coste" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};