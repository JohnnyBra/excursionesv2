import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Excursion, Participation, Student, ExcursionScope, UserRole, ExcursionClothing, TransportType, ClassGroup } from '../types';
import { useAuth } from '../App';
import { useToast } from './ui/Toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDataSync } from '../hooks/useDataSync';
import { 
  Plus, Save, DollarSign, CheckCircle, 
  Printer, Calendar, MapPin, Calculator, FileText, Copy, Trash2, FileSpreadsheet,
  Share2, Shirt, Footprints, Bus, Clock, ArrowRight, FileBarChart, Edit, X
} from 'lucide-react';

interface ExcursionManagerProps {
  mode: 'management' | 'treasury';
}

const getLogoData = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Error loading logo", e);
    return "";
  }
};

const LOGO_URL = '/logo_documento.png';

const drawPdfHeader = (doc: jsPDF, logoData: string | null) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  if (logoData) {
      doc.addImage(logoData, 'PNG', pageWidth - 35, 10, 25, 25);
  }
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Cooperativa de Enseñanza La Hispanidad", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(new Date().toLocaleString(), 14, 26);
  doc.setTextColor(0, 0, 0);
};

export const ExcursionManager: React.FC<ExcursionManagerProps> = ({ mode }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  // HOOK DE SINCRONIZACIÓN
  const dbVersion = useDataSync();

  // Get fresh user data to avoid stale classId from localStorage
  const currentUser = user ? db.getUsers().find(u => u.id === user.id) || user : user;

  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [selectedExcursion, setSelectedExcursion] = useState<Excursion | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'budget'>('details');

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());

  // Form State
  const [formData, setFormData] = useState<Partial<Excursion>>({});
  
  // Data for Selectors
  const [cyclesList, setCyclesList] = useState(db.cycles);
  const [classesList, setClassesList] = useState(db.classes);

  // Participants View State
  const [participants, setParticipants] = useState<Participation[]>([]);
  const [studentsMap, setStudentsMap] = useState<Record<string, Student>>({});

  // Helper to check if we should show the attendance column
  const [isExcursionDayOrPast, setIsExcursionDayOrPast] = useState(false);

  // EFECTO PRINCIPAL DE CARGA DE DATOS
  useEffect(() => {
    loadData();
    const students = db.getStudents();
    const map: Record<string, Student> = {};
    students.forEach(s => map[s.id] = s);
    setStudentsMap(map);
    
    if (selectedExcursion) {
        const updatedExcursion = db.getExcursions().find(e => e.id === selectedExcursion.id);
        if (updatedExcursion) {
             if (!isEditing) {
                 setSelectedExcursion(updatedExcursion);
                 setFormData(updatedExcursion);
             }
             const allParts = db.getParticipations();
             setParticipants(allParts.filter(p => p.excursionId === updatedExcursion.id));
        } else {
             if (!isEditing) { 
                 setSelectedExcursion(null);
                 addToast('La excursión que veías ha sido eliminada por otro usuario', 'info');
             }
        }
    }
  }, [user, dbVersion]); 

  // Selección automática desde Dashboard
  useEffect(() => {
    if (excursions.length > 0 && location.state && (location.state as any).selectedId) {
        const targetId = (location.state as any).selectedId;
        const targetExcursion = excursions.find(e => e.id === targetId);
        if (targetExcursion) {
            handleSelect(targetExcursion);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }
  }, [excursions, location.state]);

  // Update "is day of" state when selection changes
  useEffect(() => {
      if (selectedExcursion) {
          const today = new Date().toISOString().slice(0, 10);
          const start = selectedExcursion.dateStart.slice(0, 10);
          setIsExcursionDayOrPast(today >= start);
      } else {
          setIsExcursionDayOrPast(false);
      }
  }, [selectedExcursion]);

  const loadData = () => {
    const all = db.getExcursions();
    let visible = all;

    if (user?.role === UserRole.TUTOR) {
        const myClass = db.classes.find(c => c.id === currentUser?.classId);
        visible = all.filter(e => 
            e.scope === ExcursionScope.GLOBAL || 
            (e.scope === ExcursionScope.CICLO && e.targetId === myClass?.cycleId) ||
            (e.scope === ExcursionScope.CLASE && e.targetId === currentUser?.classId)
        );
    } 
    
    setExcursions(visible);
    setCyclesList(db.getCycles()); 
    setClassesList(db.getClasses());
  };

  const getScopeLabel = (scope: string, targetId?: string) => {
    if (scope === ExcursionScope.GLOBAL) return 'Global';
    if (scope === ExcursionScope.CICLO) {
        const cycle = cyclesList.find(c => c.id === targetId);
        return `Ciclo ${cycle?.name || ''}`;
    }
    if (scope === ExcursionScope.CLASE) {
        const cls = classesList.find(c => c.id === targetId);
        return `Clase ${cls?.name || ''}`;
    }
    return scope;
  };

  const getTransportIcon = (type?: TransportType) => {
      if (type === TransportType.BUS) return <Bus size={18} className="text-blue-600" />;
      if (type === TransportType.WALKING) return <Footprints size={18} className="text-green-600" />;
      return <MapPin size={18} className="text-gray-500" />;
  };

  const getClothingLabel = (type?: ExcursionClothing) => {
      if (type === ExcursionClothing.UNIFORM) return 'Uniforme';
      if (type === ExcursionClothing.PE_KIT) return 'Chándal';
      if (type === ExcursionClothing.STREET) return 'Ropa de Calle';
      return 'No especificado';
  };

  const handleCreateNew = () => {
    if (user?.role === UserRole.TESORERIA) return; 

    const newExcursion: Excursion = {
      id: crypto.randomUUID(),
      title: 'Nueva Excursión',
      description: '',
      justification: '',
      destination: '',
      dateStart: new Date().toISOString().slice(0, 16),
      dateEnd: new Date().toISOString().slice(0, 16),
      clothing: ExcursionClothing.UNIFORM,
      transport: TransportType.BUS,
      costBus: 0,
      costOther: 0,
      costEntry: 0,
      costGlobal: 0,
      estimatedStudents: 0,
      scope: user?.role === UserRole.TUTOR ? ExcursionScope.CLASE : ExcursionScope.GLOBAL,
      targetId: user?.role === UserRole.TUTOR ? currentUser?.classId || '' : '',
      creatorId: user?.id || ''
    };
    setSelectedExcursion(newExcursion);
    setFormData(newExcursion);
    setParticipants([]); 
    setIsEditing(true);
    setActiveTab('details');
  };

  const handleSelect = (ex: Excursion) => {
    setSelectedExcursion(ex);
    setFormData(ex);
    const allParts = db.getParticipations();
    setParticipants(allParts.filter(p => p.excursionId === ex.id));
    setIsEditing(false);
    setActiveTab(mode === 'treasury' ? 'budget' : 'details');
  };

  const handleDelete = () => {
      if (!selectedExcursion) return;
      if (user?.role === UserRole.TESORERIA) {
          addToast('Tesorería no puede eliminar excursiones', 'error');
          return;
      }
      if (user?.role === UserRole.TUTOR && selectedExcursion.creatorId !== user.id) {
           addToast('Solo puedes borrar excursiones creadas por ti', 'error');
           return;
      }

      if (confirm('¿ATENCIÓN: Estás seguro de borrar esta excursión y todos sus datos? Esta acción no se puede deshacer.')) {
          db.deleteExcursion(selectedExcursion.id);
          addToast('Excursión eliminada correctamente', 'success');
          setSelectedExcursion(null);
          loadData();
      }
  };

  const handleDuplicateToClass = () => {
      if (!selectedExcursion || user?.role !== UserRole.TUTOR || !currentUser?.classId) return;
      
      const copy: Excursion = {
          ...selectedExcursion,
          id: crypto.randomUUID(),
          title: `${selectedExcursion.title} (Mi Clase)`,
          scope: ExcursionScope.CLASE,
          targetId: currentUser.classId,
          creatorId: user.id
      };
      
      db.addExcursion(copy);
      addToast('Excursión duplicada a tu clase', 'success');
      loadData();
      setTimeout(() => handleSelect(copy), 100);
  };

  const handleInternalShare = (targetClass: ClassGroup) => {
      if (!selectedExcursion) return;

      const sharedExcursion: Excursion = {
          ...selectedExcursion,
          id: crypto.randomUUID(),
          title: selectedExcursion.title, 
          scope: ExcursionScope.CLASE,
          targetId: targetClass.id,
          creatorId: targetClass.tutorId 
      };

      db.addExcursion(sharedExcursion);
      addToast(`Excursión enviada a la clase ${targetClass.name}`, 'success');
      setIsShareModalOpen(false);
  };

  // Efecto para recalcular automáticamente
  useEffect(() => {
    if (activeTab === 'budget' || isEditing) {
      const bus = Number(formData.costBus) || 0;
      const other = Number(formData.costOther) || 0; 
      const entry = Number(formData.costEntry) || 0;
      const students = Number(formData.estimatedStudents) || 0; 
      
      let newCost = 0;
      if (students > 0) {
        const rawCost = ((bus + other) / students) + entry;
        newCost = Math.ceil(rawCost);
      }
      
      setFormData(prev => {
          if (prev.costGlobal !== newCost) {
              return { ...prev, costGlobal: newCost };
          }
          return prev;
      });
    }
  }, [
    formData.costBus, 
    formData.costOther, 
    formData.costEntry, 
    formData.estimatedStudents
  ]);

  const handleSave = () => {
    if (!formData.title || !formData.dateStart) {
      addToast('Título y fecha obligatorios', 'error');
      return;
    }

    const excursionToSave = {
        ...formData,
        costBus: Number(formData.costBus) || 0,
        costOther: Number(formData.costOther) || 0,
        costEntry: Number(formData.costEntry) || 0,
        costGlobal: Number(formData.costGlobal) || 0, 
        estimatedStudents: Number(formData.estimatedStudents) || 0
    } as Excursion;

    if (isEditing || activeTab === 'budget') {
      const exists = excursions.find(e => e.id === formData.id);
      if (exists) {
        db.updateExcursion(excursionToSave);
        addToast('Guardado correctamente', 'success');
      } else {
        db.addExcursion(excursionToSave);
        addToast('Creada correctamente', 'success');
      }

      setSelectedExcursion(excursionToSave);
      setFormData(excursionToSave);
      setIsEditing(false);
      loadData();

      // Refresh participants immediately
      const allParts = db.getParticipations();
      setParticipants(allParts.filter(p => p.excursionId === excursionToSave.id));
    }
  };

  const toggleParticipationStatus = (p: Participation, field: 'authSigned' | 'paid' | 'attended') => {
    if (user?.role === UserRole.TESORERIA) return;

    const updated = { ...p, [field]: !p[field] };
    if (field === 'paid' && updated.paid) {
        updated.amountPaid = selectedExcursion?.costGlobal || 0;
        updated.paymentDate = new Date().toISOString();
    } else if (field === 'paid' && !updated.paid) {
        updated.amountPaid = 0;
        updated.paymentDate = undefined;
    }
    db.updateParticipation(updated);
    setParticipants(prev => prev.map(item => item.id === p.id ? updated : item));
  };

  // --- REPORT GENERATION LOGIC ---

  const handleGenerateAnnualReport = async (format: 'pdf' | 'csv') => {
    const startDate = new Date(reportYear, 8, 1);
    const endDate = new Date(reportYear + 1, 5, 30);

    const filteredExcursions = excursions.filter(ex => {
        const d = new Date(ex.dateStart);
        return d >= startDate && d <= endDate;
    }).sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());

    if (filteredExcursions.length === 0) {
        addToast('No hay excursiones en ese periodo', 'info');
        return;
    }

    const reportData = filteredExcursions.map(ex => {
        const parts = db.getParticipations().filter(p => p.excursionId === ex.id);
        const collected = parts.filter(p => p.paid).reduce((sum, p) => sum + p.amountPaid, 0);
        
        const entryCount = parts.filter(p => p.attended).length || parts.filter(p => p.paid).length;
        
        const fixedCosts = (ex.costBus || 0) + (ex.costOther || 0);
        const variableCosts = (ex.costEntry || 0) * entryCount;
        const totalCost = fixedCosts + variableCosts;
        
        return {
            fecha: new Date(ex.dateStart).toLocaleDateString(),
            titulo: ex.title,
            destino: ex.destination,
            curso: getScopeLabel(ex.scope, ex.targetId),
            bus: (ex.costBus || 0).toFixed(2),
            otros: (ex.costOther || 0).toFixed(2),
            entrada: (ex.costEntry || 0).toFixed(2),
            precioAlumno: ex.costGlobal.toFixed(2),
            recaudado: collected.toFixed(2),
            costeTotal: totalCost.toFixed(2),
            balance: (collected - totalCost).toFixed(2)
        };
    });

    if (format === 'pdf') {
        const doc = new jsPDF('l', 'mm', 'a4');

        const logoData = await getLogoData(LOGO_URL);
        drawPdfHeader(doc, logoData);

        doc.setFontSize(12);
        doc.text(`Informe Anual de Excursiones - Curso ${reportYear}/${reportYear + 1}`, 40, 35);

        autoTable(doc, {
            startY: 45,
            head: [['Fecha', 'Título', 'Destino', 'Grupo', 'Bus', 'Otros', 'Entrada', 'P.Alumno', 'Ingresos', 'Gastos', 'Balance']],
            body: reportData.map(r => Object.values(r)),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] },
        });

        const totalIngresos = reportData.reduce((sum, r) => sum + parseFloat(r.recaudado), 0);
        const totalGastos = reportData.reduce((sum, r) => sum + parseFloat(r.costeTotal), 0);
        
        doc.setFontSize(11);
        doc.text(`TOTAL INGRESOS: ${totalIngresos.toFixed(2)}€`, 14, (doc as any).lastAutoTable.finalY + 10);
        doc.text(`TOTAL GASTOS: ${totalGastos.toFixed(2)}€`, 100, (doc as any).lastAutoTable.finalY + 10);
        doc.text(`BALANCE FINAL: ${(totalIngresos - totalGastos).toFixed(2)}€`, 200, (doc as any).lastAutoTable.finalY + 10);

        doc.save(`Informe_Excursiones_${reportYear}-${reportYear+1}.pdf`);
    } else {
        const headers = ['Fecha', 'Título', 'Destino', 'Grupo', 'Coste Bus', 'Otros Gastos', 'Coste Entrada', 'Precio Alumno', 'Ingresos', 'Gastos Totales', 'Balance'];
        const csvContent = [
            headers.join(';'),
            ...reportData.map(r => Object.values(r).join(';'))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Informe_Excursiones_${reportYear}-${reportYear+1}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    setIsReportModalOpen(false);
  };

  const generatePDF = async () => {
      user?.role === UserRole.TUTOR ? await generateTutorReport() : await generateFinancialReport();
  };

  const generateTutorReport = async () => {
      if (!selectedExcursion) return;
      const doc = new jsPDF();

      const logoData = await getLogoData(LOGO_URL);
      drawPdfHeader(doc, logoData);

      doc.setFontSize(12);
      doc.text(`Lista: ${selectedExcursion.title}`, 40, 35);
      
      const tableData = participants.map(p => [
          studentsMap[p.studentId]?.name || 'Unknown',
          p.authSigned ? 'SÍ' : 'NO',
          p.paid ? 'SÍ' : 'NO',
          p.attended ? 'SÍ' : 'NO'
      ]);

      autoTable(doc, {
          startY: 50,
          head: [['Alumno', 'Autorización', 'Pagado', 'Asistencia']],
          body: tableData,
      });
      doc.save(`lista_${selectedExcursion.title}.pdf`);
  };

  const generateFinancialReport = async () => {
      if (!selectedExcursion) return;
      const doc = new jsPDF();

      const logoData = await getLogoData(LOGO_URL);
      drawPdfHeader(doc, logoData);

      doc.setFontSize(12);
      doc.text("Informe Económico", 40, 35);
      doc.text(`Excursión: ${selectedExcursion.title}`, 40, 42);
      
      const collected = participants.filter(p => p.paid).reduce((acc, p) => acc + p.amountPaid, 0);
      const entryCount = participants.filter(p => p.attended).length || participants.filter(p => p.paid).length;
      
      const fixedCosts = (selectedExcursion.costBus || 0) + (selectedExcursion.costOther || 0);
      const variableCosts = (entryCount * selectedExcursion.costEntry);
      const realCost = fixedCosts + variableCosts;
      
      doc.text(`Total Recaudado: ${collected}€`, 14, 55);
      doc.text(`Coste Real (Bus+Entradas): ${realCost}€`, 14, 65);
      doc.text(`Balance: ${collected - realCost}€`, 14, 75);

      const tableData = participants.map(p => [
          studentsMap[p.studentId]?.name || 'Unknown',
          p.paid ? `${p.amountPaid}€` : 'Pendiente'
      ]);

      autoTable(doc, { startY: 85, head: [['Alumno', 'Pago']], body: tableData });
      doc.save(`finanzas_${selectedExcursion.title}.pdf`);
  };

  const generateDirectorReport = async () => {
      if (!selectedExcursion) return;
      const doc = new jsPDF();

      const logoData = await getLogoData(LOGO_URL);
      drawPdfHeader(doc, logoData);

      const dateStr = new Date(selectedExcursion.dateStart).toLocaleDateString();
      
      doc.setFontSize(16);
      doc.text("Listado de Control - Día de Excursión", 40, 35);
      doc.setFontSize(12);
      doc.text(`Actividad: ${selectedExcursion.title}`, 40, 42);
      doc.text(`Fecha: ${dateStr} - Destino: ${selectedExcursion.destination}`, 40, 48);

      const participantsByClass: Record<string, typeof participants> = {};
      
      participants.forEach(p => {
          const student = studentsMap[p.studentId];
          if (!student) return;
          const className = classesList.find(c => c.id === student.classId)?.name || 'Sin Clase';
          
          if (!participantsByClass[className]) {
              participantsByClass[className] = [];
          }
          participantsByClass[className].push(p);
      });

      let currentY = 60;
      const classKeys = Object.keys(participantsByClass).sort();

      classKeys.forEach(className => {
          const classParts = participantsByClass[className];
          
          if (currentY > 250) {
              doc.addPage();
              currentY = 20;
          }

          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(`Clase: ${className}`, 14, currentY);
          doc.setFont("helvetica", "normal");
          
          const tableBody = classParts.map(p => {
              const st = studentsMap[p.studentId];
              const isGoing = (p.authSigned && p.paid) || p.attended;
              const status = isGoing ? 'VA A LA EXCURSIÓN' : 'SE QUEDA EN CENTRO';
              
              return [
                  st?.name || 'Desconocido',
                  p.paid ? 'SÍ' : 'NO',
                  p.authSigned ? 'SÍ' : 'NO',
                  status
              ];
          });

          autoTable(doc, {
              startY: currentY + 2,
              head: [['Alumno', 'Pagado', 'Autorizado', 'ESTADO']],
              body: tableBody,
              theme: 'grid',
              headStyles: { fillColor: [60, 60, 60] },
              styles: { fontSize: 9 },
          });

          currentY = (doc as any).lastAutoTable.finalY + 15;
      });

      doc.save(`control_asistencia_${selectedExcursion.title.replace(/\s+/g, '_')}.pdf`);
  };

  const isFieldDisabled = (fieldName: string) => {
      if (!isEditing) return true; 

      if (user?.role === UserRole.DIRECCION) return false; 
      if (user?.role === UserRole.TESORERIA) {
          return !['costBus', 'costOther', 'costEntry', 'estimatedStudents', 'costGlobal'].includes(fieldName);
      }
      if (user?.role === UserRole.TUTOR) {
          if (selectedExcursion?.creatorId !== user.id) return true;
          return false;
      }
      return true;
  };

  const canEditBudget = () => {
      if (user?.role === UserRole.DIRECCION || user?.role === UserRole.TESORERIA) return true;
      if (user?.role === UserRole.TUTOR && selectedExcursion?.creatorId === user.id) return true;
      return false;
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6 relative">
      
      {/* ... MODALES ... */}
      {isReportModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 rounded-xl backdrop-blur-sm">
              <div className="bg-white w-96 rounded-xl shadow-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <FileBarChart className="text-blue-600"/> Informe Anual Global
                  </h3>
                  <div className="mb-6">
                      <label className="label-sm">Año de Inicio del Curso</label>
                      <input type="number" className="input-field" value={reportYear} onChange={e => setReportYear(parseInt(e.target.value))} />
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => handleGenerateAnnualReport('pdf')} className="flex-1 py-2 bg-red-500 text-white rounded-lg">PDF</button>
                      <button onClick={() => handleGenerateAnnualReport('csv')} className="flex-1 py-2 bg-green-600 text-white rounded-lg">Excel</button>
                  </div>
                  <button onClick={() => setIsReportModalOpen(false)} className="w-full mt-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
              </div>
          </div>
      )}

      {isShareModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 rounded-xl backdrop-blur-sm">
              <div className="bg-white w-96 rounded-xl shadow-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Share2 className="text-blue-600"/> Compartir con Clase
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                      {classesList
                        .filter(c => user?.role === UserRole.DIRECCION || (user?.role === UserRole.TUTOR && c.id !== currentUser?.classId))
                        .map(cls => (
                            <button 
                                key={cls.id} 
                                onClick={() => handleInternalShare(cls)} 
                                className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition flex justify-between items-center group"
                            >
                                <span className="font-medium text-gray-700 group-hover:text-blue-700">{cls.name}</span>
                                <ArrowRight size={16} className="text-gray-300 group-hover:text-blue-500"/>
                            </button>
                        ))
                      }
                      {classesList.length === 0 && <p className="text-center text-gray-400">No hay otras clases disponibles.</p>}
                  </div>
                  <button onClick={() => setIsShareModalOpen(false)} className="w-full py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
              </div>
          </div>
      )}

      {/* Sidebar List */}
      <div className="w-1/3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-gray-700">
             {mode === 'treasury' ? 'Tesorería' : 'Excursiones'}
          </h2>
          <div className="flex gap-1">
             {(user?.role === UserRole.DIRECCION || user?.role === UserRole.TESORERIA) && (
                <button onClick={() => setIsReportModalOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                    <FileBarChart size={18} />
                </button>
             )}
             {mode !== 'treasury' && user?.role !== UserRole.TESORERIA && (
                <button onClick={handleCreateNew} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm">
                  <Plus size={18} />
                </button>
             )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {excursions.map(ex => {
            const isPast = new Date(ex.dateEnd) < new Date();
            return (
                <div 
                key={ex.id}
                onClick={() => handleSelect(ex)}
                className={`p-3 rounded-lg cursor-pointer transition border-l-4 ${selectedExcursion?.id === ex.id ? 'border-l-blue-600 bg-blue-50' : 'border-l-transparent hover:bg-gray-50'}`}
                >
                <h3 className={`font-semibold truncate ${isPast ? 'text-gray-400 line-through decoration-gray-400' : 'text-gray-800'}`}>{ex.title}</h3>
                <div className="flex justify-between items-center mt-1">
                    <span className={`text-xs ${isPast ? 'text-gray-300' : 'text-gray-500'}`}>{new Date(ex.dateStart).toLocaleDateString()}</span>
                    <span className={`text-xs px-1 rounded truncate max-w-[80px] ${isPast ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 text-gray-700'}`}>
                        {getScopeLabel(ex.scope, ex.targetId)}
                    </span>
                </div>
                </div>
            );
          })}
        </div>
      </div>

      {/* Main Details */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        {selectedExcursion ? (
          <>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <div>
                   <h2 className="text-xl font-bold text-gray-800">
                      {isEditing ? 'Editando...' : selectedExcursion.title}
                   </h2>
                   {!isEditing && (
                       <p className="text-sm text-blue-600 font-medium">
                           {getScopeLabel(selectedExcursion.scope, selectedExcursion.targetId)}
                       </p>
                   )}
               </div>
               <div className="flex gap-2">
                 {!isEditing && user?.role === UserRole.TUTOR && selectedExcursion.creatorId !== user.id && (
                     <button onClick={handleDuplicateToClass} className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm shadow-sm">
                         <Copy size={16}/> Duplicar
                     </button>
                 )}
                 
                 {!isEditing && (user?.role === UserRole.DIRECCION || (user?.role === UserRole.TUTOR && selectedExcursion.creatorId === user.id)) && (
                     <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                         <Trash2 size={18} />
                     </button>
                 )}

                 {isEditing ? (
                   <>
                    <button onClick={() => { setIsEditing(false); setFormData(selectedExcursion); }} className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm flex items-center gap-1"><X size={16}/> Cancelar</button>
                    <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-sm transition"><Save size={18} /> Guardar</button>
                   </>
                 ) : (
                   <>
                    {(user?.role === UserRole.TUTOR || user?.role === UserRole.DIRECCION) && (
                        <button onClick={() => setIsShareModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 shadow-sm text-sm">
                             <Share2 size={18} />
                        </button>
                    )}

                    {user?.role === UserRole.DIRECCION && (
                        <button onClick={generateDirectorReport} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm text-sm">
                             <FileSpreadsheet size={18} />
                        </button>
                    )}

                    <button onClick={generatePDF} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm text-sm">
                      <Printer size={18} /> {user?.role === UserRole.TESORERIA ? 'Inf. Econ.' : 'Listado'}
                    </button>
                    <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm text-sm font-medium flex items-center gap-2">
                         <Edit size={16} /> {user?.role === UserRole.TESORERIA ? 'Costes' : 'Editar'}
                    </button>
                   </>
                 )}
               </div>
            </div>

            {!isEditing && (
                <div className="flex border-b">
                    <button onClick={() => setActiveTab('details')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'details' ? 'text-blue-600 border-b-2' : 'text-gray-500'}`}>Detalles</button>
                    {(user?.role === UserRole.DIRECCION || user?.role === UserRole.TESORERIA || user?.role === UserRole.TUTOR) && (
                        <button onClick={() => setActiveTab('budget')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'budget' ? 'text-blue-600 border-b-2' : 'text-gray-500'}`}>Presupuesto</button>
                    )}
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-6">
              {(activeTab === 'budget' || (isEditing && user?.role === UserRole.TESORERIA)) && (
                   <div className="max-w-lg mx-auto bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm">
                        <h4 className="font-semibold text-blue-900 mb-6 flex items-center gap-2"><Calculator/> Datos Económicos</h4>
                        <div className="grid grid-cols-2 gap-6 mb-4">
                            <div>
                                <label className="label-sm">Coste Autobús (Total)</label>
                                <input type="number" disabled={isFieldDisabled('costBus')} className="input-field" value={formData.costBus || ''} onChange={e => setFormData({...formData, costBus: Number(e.target.value)})} placeholder="0" />
                            </div>
                            <div>
                                <label className="label-sm">Otros Gastos (Total)</label>
                                <input type="number" disabled={isFieldDisabled('costOther')} className="input-field" value={formData.costOther || ''} onChange={e => setFormData({...formData, costOther: Number(e.target.value)})} placeholder="0" />
                            </div>
                            <div>
                                <label className="label-sm">Coste Entrada (Unitario)</label>
                                <input type="number" disabled={isFieldDisabled('costEntry')} className="input-field" value={formData.costEntry || ''} onChange={e => setFormData({...formData, costEntry: Number(e.target.value)})} placeholder="0" />
                            </div>
                            <div>
                                <label className="label-sm">Alumnos Estimados</label>
                                <input type="number" disabled={isFieldDisabled('estimatedStudents')} className="input-field" value={formData.estimatedStudents || ''} onChange={e => setFormData({...formData, estimatedStudents: Number(e.target.value)})} placeholder="0" />
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t border-blue-200">
                             <label className="label-sm">Precio Final Alumno</label>
                             <input type="number" disabled={isFieldDisabled('costGlobal')} className="w-full text-2xl font-bold text-green-700 p-2 border border-green-300 bg-green-50 rounded" value={formData.costGlobal ?? 0} onChange={e => setFormData({...formData, costGlobal: Number(e.target.value)})} />
                        </div>
                        {isEditing && <p className="text-xs text-gray-500 mt-2">* Tesorería puede modificar estos valores.</p>}

                        {canEditBudget() && (
                            <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-gray-100">
                                {!isEditing ? (
                                    <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
                                        <Edit size={16} /> Editar Presupuesto
                                    </button>
                                ) : (
                                    <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg">
                                        <Save size={16} /> Guardar
                                    </button>
                                )}
                            </div>
                        )}
                   </div>
              )}

              {activeTab === 'details' && (
                  isEditing && user?.role !== UserRole.TESORERIA ? (
                    <div className="space-y-4 max-w-3xl mx-auto pb-10">
                        <div className="grid grid-cols-2 gap-4">
                             <div className="col-span-2">
                                <label className="label-sm">Título</label>
                                <input className="input-field" placeholder="Título" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} disabled={isFieldDisabled('title')} />
                             </div>
                             
                             <div className="col-span-2">
                                <label className="label-sm">Destino</label>
                                <input className="input-field" placeholder="Destino" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} disabled={isFieldDisabled('destination')} />
                             </div>

                             <div>
                                <label className="label-sm">Salida</label>
                                <input type="datetime-local" className="input-field" value={formData.dateStart?.slice(0, 16)} onChange={e => setFormData({...formData, dateStart: e.target.value})} disabled={isFieldDisabled('dateStart')} />
                             </div>
                             <div>
                                <label className="label-sm">Llegada</label>
                                <input type="datetime-local" className="input-field" value={formData.dateEnd?.slice(0, 16)} onChange={e => setFormData({...formData, dateEnd: e.target.value})} disabled={isFieldDisabled('dateEnd')} />
                             </div>
                             
                             <div>
                                <label className="label-sm">Vestimenta</label>
                                <select className="input-field" value={formData.clothing} onChange={e => setFormData({...formData, clothing: e.target.value as ExcursionClothing})} disabled={isFieldDisabled('clothing')}>
                                    <option value={ExcursionClothing.UNIFORM}>Uniforme</option>
                                    <option value={ExcursionClothing.PE_KIT}>Chándal</option>
                                    <option value={ExcursionClothing.STREET}>Ropa de Calle</option>
                                </select>
                             </div>
                             <div>
                                <label className="label-sm">Transporte</label>
                                <select className="input-field" value={formData.transport} onChange={e => setFormData({...formData, transport: e.target.value as TransportType})} disabled={isFieldDisabled('transport')}>
                                    <option value={TransportType.BUS}>Autobús</option>
                                    <option value={TransportType.WALKING}>Andando</option>
                                    <option value={TransportType.OTHER}>Otro</option>
                                </select>
                             </div>

                             <div className="col-span-2">
                                 <label className="label-sm">Justificación</label>
                                 <textarea className="input-field h-24" placeholder="Explica los motivos..." value={formData.justification || ''} onChange={e => setFormData({...formData, justification: e.target.value})} disabled={isFieldDisabled('justification')} />
                             </div>
                             
                             <div className="col-span-2 bg-gray-50 p-4 rounded border">
                                <label className="label-sm mb-2 block">Alcance</label>
                                <div className="flex gap-2">
                                    <select
                                        className="border p-2 rounded flex-1"
                                        value={formData.scope}
                                        onChange={e => {
                                            const newScope = e.target.value as ExcursionScope;
                                            let newTargetId = '';
                                            if (user?.role === UserRole.TUTOR) {
                                                if (newScope === ExcursionScope.CICLO) {
                                                    const myClass = classesList.find(c => c.id === currentUser?.classId) || db.getClasses().find(c => c.id === currentUser?.classId);
                                                    newTargetId = myClass?.cycleId || '';
                                                } else if (newScope === ExcursionScope.CLASE) {
                                                    newTargetId = currentUser?.classId || '';
                                                }
                                            }
                                            setFormData({...formData, scope: newScope, targetId: newTargetId});
                                        }}
                                    >
                                        {user?.role !== UserRole.TUTOR && <option value={ExcursionScope.GLOBAL}>Global</option>}
                                        <option value={ExcursionScope.CICLO}>Ciclo</option>
                                        <option value={ExcursionScope.CLASE}>Clase</option>
                                    </select>
                                    {(formData.scope !== ExcursionScope.GLOBAL) && (
                                        <select className="border p-2 rounded flex-1" value={formData.targetId} onChange={e => setFormData({...formData, targetId: e.target.value})} disabled={user?.role === UserRole.TUTOR}>
                                            <option value="">Seleccionar...</option>
                                            {formData.scope === ExcursionScope.CICLO ?
                                                cyclesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                                                :
                                                classesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                                            }
                                        </select>
                                    )}
                                </div>
                             </div>
                        </div>

                        {!isFieldDisabled('title') && (
                            <div className="mt-8 pt-6 border-t border-red-100">
                                <h4 className="text-red-600 font-bold mb-2 flex items-center gap-2"><Trash2 size={18}/> Zona de Peligro</h4>
                                <button onClick={handleDelete} className="px-4 py-2 border border-red-200 bg-red-50 text-red-600 rounded hover:bg-red-100">Eliminar Excursión</button>
                            </div>
                        )}
                    </div>
                  ) : activeTab === 'details' && !isEditing ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-start bg-gray-50 p-4 rounded-lg">
                             <div className="space-y-2">
                                <h3 className="text-xl font-bold text-gray-800">{selectedExcursion.destination}</h3>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1.5"><Calendar size={16} className="text-blue-500" /> <span>{new Date(selectedExcursion.dateStart).toLocaleDateString()}</span></div>
                                    <div className="flex items-center gap-1.5"><Clock size={16} className="text-orange-500" /> <span>{new Date(selectedExcursion.dateStart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                                    <div className="flex items-center gap-1.5">{getTransportIcon(selectedExcursion.transport)}<span>{selectedExcursion.transport === TransportType.WALKING ? 'Andando' : 'Autobús'}</span></div>
                                    <div className="flex items-center gap-1.5"><Shirt size={16} className="text-purple-500" /> <span>{getClothingLabel(selectedExcursion.clothing)}</span></div>
                                </div>
                             </div>
                             <div className="text-right">
                                <span className="block text-3xl font-bold text-blue-600">{selectedExcursion.costGlobal}€</span>
                                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Precio Alumno</span>
                             </div>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                             <table className="min-w-full text-sm">
                                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Alumno</th>
                                        <th className="px-4 py-3 text-center">Auth</th>
                                        <th className="px-4 py-3 text-center">Pago</th>
                                        {isExcursionDayOrPast && <th className="px-4 py-3 text-center bg-green-50 text-green-700">Asistencia Real</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {participants.map(p => (
                                        <tr key={p.id} className="border-t hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium">{studentsMap[p.studentId]?.name}</td>
                                            <td className="px-4 py-3 text-center cursor-pointer" onClick={() => toggleParticipationStatus(p, 'authSigned')}>
                                                <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full ${p.authSigned ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-300'}`}><FileText size={16}/></div>
                                            </td>
                                            <td className="px-4 py-3 text-center cursor-pointer" onClick={() => toggleParticipationStatus(p, 'paid')}>
                                                 <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full ${p.paid ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-300'}`}><DollarSign size={16}/></div>
                                            </td>
                                            {isExcursionDayOrPast && (
                                                <td className="px-4 py-3 text-center cursor-pointer bg-green-50/50" onClick={() => toggleParticipationStatus(p, 'attended')}>
                                                    {p.attended ? <CheckCircle size={20} className="text-green-500 mx-auto"/> : <div className="w-5 h-5 rounded-full border-2 border-gray-300 mx-auto"></div>}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                             </table>
                             {!isExcursionDayOrPast && (
                                 <div className="p-2 bg-yellow-50 text-xs text-yellow-700 text-center border-t border-yellow-100">
                                     La columna de "Asistencia Real" se activará el día de la excursión ({new Date(selectedExcursion.dateStart).toLocaleDateString()}).
                                 </div>
                             )}
                        </div>
                    </div>
                  ) : null
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300">Selecciona una excursión</div>
        )}
      </div>
    </div>
  );
};