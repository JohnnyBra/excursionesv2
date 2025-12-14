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
    className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-transform hover:scale-105 ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
      if (e.scope === 'CLASE' && e.targetId === user.classId) return true;
      // Simplified cycle check
      const myClass = db.classes.find(c => c.id === user.classId);
      if (e.scope === 'CICLO' && e.targetId === myClass?.cycleId) return true;
    }
    return false;
  });

  const totalCollected = relevantExcursions.reduce((acc, exc) => {
    const parts = participations.filter(p => p.excursionId === exc.id && p.paid);
    return acc + parts.reduce((sum, p) => sum + p.amountPaid, 0);
  }, 0);

  const totalCost = relevantExcursions.reduce((acc, exc) => {
    return acc + Number(exc.costBus) + Number(exc.costEntry); // Simplified cost logic
  }, 0);

  const chartData = relevantExcursions.slice(0, 5).map(e => ({
    name: e.title.substring(0, 15) + '...',
    cost: Number(e.costBus) + Number(e.costEntry),
    collected: participations
      .filter(p => p.excursionId === e.id && p.paid)
      .reduce((sum, p) => sum + p.amountPaid, 0)
  }));

  const handleExcursionClick = (id: string) => {
    // Navegar pasando el ID en el estado para que el manager lo abra
    navigate('/excursions', { state: { selectedId: id } });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Hola, {user?.name}</h2>
          <p className="text-gray-500">Aquí tienes el resumen de las excursiones.</p>
        </div>
        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Excursiones Activas" 
          value={relevantExcursions.length} 
          icon={Calendar} 
          color="bg-blue-500"
          onClick={() => navigate('/excursions')} 
        />
        <StatCard 
          title="Participantes Totales" 
          value={participations.filter(p => relevantExcursions.some(e => e.id === p.excursionId)).length} 
          icon={Users} 
          color="bg-purple-500" 
        />
        {(user?.role === UserRole.DIRECCION || user?.role === UserRole.TESORERIA) && (
          <>
            <StatCard 
              title="Recaudado Total" 
              value={`${totalCollected}€`} 
              icon={DollarSign} 
              color="bg-green-500"
              onClick={() => navigate('/treasury')} 
            />
            <StatCard 
              title="Balance Neto" 
              value={`${totalCollected - totalCost}€`} 
              icon={TrendingUp} 
              color={totalCollected - totalCost >= 0 ? "bg-emerald-500" : "bg-red-500"}
              onClick={() => navigate('/treasury')} 
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-4">Próximas Salidas</h3>
          <div className="space-y-4">
            {relevantExcursions.map(ex => {
              const isPast = new Date(ex.dateEnd) < new Date();
              return (
                <div 
                  key={ex.id} 
                  onClick={() => handleExcursionClick(ex.id)}
                  className={`flex items-center gap-4 p-3 hover:bg-blue-50 cursor-pointer rounded-lg transition-colors border-b border-gray-100 last:border-0 group ${isPast ? 'opacity-70' : ''}`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold shrink-0 transition-colors ${isPast ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-200'}`}>
                    {new Date(ex.dateStart).getDate()}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${isPast ? 'text-gray-500 line-through decoration-gray-400' : 'text-gray-800 group-hover:text-blue-700'}`}>{ex.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                       <span>{ex.destination}</span>
                       <span>•</span>
                       <span className={`font-medium ${isPast ? 'text-gray-400' : 'text-blue-600'}`}>{getScopeLabel(ex.scope, ex.targetId)}</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${isPast ? 'bg-gray-100 text-gray-400' : ex.scope === 'GLOBAL' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {ex.scope}
                  </span>
                </div>
              );
            })}
            {relevantExcursions.length === 0 && (
              <p className="text-gray-400 text-center py-4">No hay excursiones programadas</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-4">Balance Financiero</h3>
          <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}€`} />
                  <Tooltip />
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