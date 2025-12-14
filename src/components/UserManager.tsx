import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { User, UserRole, ClassGroup, Student, Cycle } from '../types';
import { useAuth } from '../App';
import { Trash2, UserPlus, Edit, Upload, Download, Database, Users, GraduationCap, School, Search } from 'lucide-react';
import { useToast } from './ui/Toast';

export const UserManager: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'users' | 'classes' | 'students' | 'system'>('users');

    // Data State
    const [users, setUsers] = useState<User[]>([]);
    const [classes, setClasses] = useState<ClassGroup[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [cycles, setCycles] = useState<Cycle[]>([]);

    // Search State
    const [userSearch, setUserSearch] = useState('');

    // Editors
    const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
    const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);
    const [newClass, setNewClass] = useState<Partial<ClassGroup>>({});
    
    // Import State
    const [importClassId, setImportClassId] = useState('');

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = () => {
        setUsers(db.getUsers());
        setClasses(db.getClasses());
        setStudents(db.getStudents());
        setCycles(db.getCycles());
    };

    // Security check
    if (user?.role !== UserRole.DIRECCION) {
        return <div className="p-8 text-center text-red-500 font-bold bg-white rounded-xl shadow mt-10">⛔ ACCESO DENEGADO<br/><span className="text-sm font-normal text-gray-600">Este panel es exclusivo para Dirección.</span></div>;
    }

    // --- USER MANAGEMENT ---
    const handleSaveUser = () => {
        if (!editingUser?.username || !editingUser?.name || !editingUser?.role) {
            addToast('Faltan campos obligatorios', 'error');
            return;
        }
        const userToSave = { ...editingUser, password: editingUser.password || '123' } as User;
        
        // Prevent deleting/locking other admins if not strict logic (Simplified for demo)
        
        if (userToSave.id) {
            db.updateUser(userToSave);
            addToast('Usuario actualizado', 'success');
        } else {
            userToSave.id = crypto.randomUUID();
            db.addUser(userToSave);
            addToast('Usuario creado', 'success');
        }
        setEditingUser(null);
        refreshData();
    };

    const handleDeleteUser = (id: string) => {
        if (id === user?.id) {
            addToast('No puedes eliminar tu propio usuario', 'error');
            return;
        }
        if (confirm('¿Eliminar usuario?')) {
            db.deleteUser(id);
            refreshData();
        }
    };

    // Filter Logic
    const filteredUsers = users.filter(u => {
        const term = userSearch.toLowerCase();
        return u.name.toLowerCase().includes(term) || 
               u.username.toLowerCase().includes(term) || 
               u.role.toLowerCase().includes(term);
    });

    // --- STUDENT MANAGEMENT ---
    const handleSaveStudent = () => {
        if (!editingStudent?.name || !editingStudent?.classId) {
            addToast('Nombre y Clase obligatorios', 'error');
            return;
        }
        const st = editingStudent as Student;
        if (st.id) db.updateStudent(st);
        else {
            st.id = crypto.randomUUID();
            db.addStudent(st);
        }
        setEditingStudent(null);
        refreshData();
        addToast('Alumno guardado', 'success');
    };

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!importClassId) {
            addToast('Selecciona primero una clase para importar', 'error');
            e.target.value = ''; // Reset input
            return;
        }
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const content = evt.target?.result as string;
            // Assuming Format: Surnames, Name
            const count = db.importStudentsCSV(content, importClassId);
            refreshData();
            addToast(`Importados ${count} alumnos exitosamente`, 'success');
            e.target.value = ''; // Reset
        };
        // Use ISO-8859-1 (ANSI/Windows-1252) for Excel Spanish CSVs support
        reader.readAsText(file, 'ISO-8859-1');
    };

    // --- CLASS MANAGEMENT ---
    const handleAddClass = () => {
        if (!newClass.name || !newClass.cycleId || !newClass.tutorId) {
             addToast('Todos los campos son obligatorios', 'error');
             return;
        }
        db.addClass({
            id: crypto.randomUUID(),
            name: newClass.name,
            cycleId: newClass.cycleId,
            tutorId: newClass.tutorId
        });
        setNewClass({});
        refreshData();
        addToast('Clase creada', 'success');
    };

    // --- SYSTEM ---
    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (confirm('ATENCIÓN: Esto sobrescribirá toda la base de datos actual. ¿Continuar?')) {
            const success = await db.importDatabase(file);
            if (success) {
                addToast('Base de datos restaurada. Recargando...', 'success');
                setTimeout(() => window.location.reload(), 2000);
            } else {
                addToast('Error al leer el archivo de backup', 'error');
            }
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Panel de Administración</h2>
            
            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-white rounded-t-xl overflow-hidden shadow-sm">
                {[
                    { id: 'users', label: 'Usuarios', icon: Users },
                    { id: 'classes', label: 'Clases y Ciclos', icon: School },
                    { id: 'students', label: 'Alumnos', icon: GraduationCap },
                    { id: 'system', label: 'Sistema y Backup', icon: Database }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <tab.icon size={18} /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white p-6 rounded-b-xl shadow-sm border border-gray-100 min-h-[500px]">
                
                {/* --- USERS TAB --- */}
                {activeTab === 'users' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <h3 className="text-lg font-bold">Listado de Usuarios</h3>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:flex-none">
                                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar por nombre o rol..." 
                                        className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-64 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                    />
                                </div>
                                <button onClick={() => setEditingUser({ role: UserRole.TUTOR, password: '' })} className="btn-primary flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow-sm hover:bg-blue-700 transition">
                                    <UserPlus size={16} /> <span className="hidden sm:inline">Crear Usuario</span>
                                </button>
                            </div>
                        </div>
                        
                        {editingUser && (
                            <div className="p-4 bg-gray-50 rounded-lg border border-blue-100 grid grid-cols-2 gap-4 animate-fade-in">
                                <input placeholder="Nombre" className="input-field border p-2 rounded" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
                                <input placeholder="Usuario (Login)" className="input-field border p-2 rounded" value={editingUser.username || ''} onChange={e => setEditingUser({...editingUser, username: e.target.value})} />
                                <input placeholder="Email" className="input-field border p-2 rounded" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} />
                                <select className="input-field border p-2 rounded" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}>
                                    <option value={UserRole.TUTOR}>Tutor</option>
                                    <option value={UserRole.DIRECCION}>Dirección</option>
                                    <option value={UserRole.TESORERIA}>Tesorería</option>
                                    <option value={UserRole.COORDINACION}>Coordinación</option>
                                </select>
                                <div className="col-span-2 flex justify-end gap-2">
                                    <button onClick={() => setEditingUser(null)} className="px-3 py-1 text-gray-500">Cancelar</button>
                                    <button onClick={handleSaveUser} className="px-3 py-1 bg-green-600 text-white rounded">Guardar</button>
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="p-3">Nombre</th>
                                        <th className="p-3">Usuario</th>
                                        <th className="p-3">Rol</th>
                                        <th className="p-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map(u => (
                                            <tr key={u.id} className="border-t hover:bg-gray-50">
                                                <td className="p-3 font-medium">{u.name}</td>
                                                <td className="p-3 text-gray-500">{u.username}</td>
                                                <td className="p-3"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{u.role}</span></td>
                                                <td className="p-3 text-right">
                                                    <button onClick={() => setEditingUser(u)} className="text-blue-600 mr-2"><Edit size={16}/></button>
                                                    <button onClick={() => handleDeleteUser(u.id)} className="text-red-600"><Trash2 size={16}/></button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-gray-400">
                                                No se encontraron usuarios con ese criterio.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- CLASSES TAB --- */}
                {activeTab === 'classes' && (
                    <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <h4 className="font-bold text-blue-900 mb-2">Crear Nueva Clase</h4>
                            <div className="flex gap-2">
                                <input placeholder="Nombre (Ej: 1º A)" className="border p-2 rounded flex-1" value={newClass.name || ''} onChange={e => setNewClass({...newClass, name: e.target.value})} />
                                <select className="border p-2 rounded flex-1" value={newClass.cycleId || ''} onChange={e => setNewClass({...newClass, cycleId: e.target.value})}>
                                    <option value="">Selecciona Ciclo...</option>
                                    {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <select className="border p-2 rounded flex-1" value={newClass.tutorId || ''} onChange={e => setNewClass({...newClass, tutorId: e.target.value})}>
                                    <option value="">Asignar Tutor...</option>
                                    {users.filter(u => u.role === UserRole.TUTOR).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                                <button onClick={handleAddClass} className="bg-blue-600 text-white px-4 rounded font-medium">Añadir</button>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold mb-4">Clases Existentes</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {classes.map(c => (
                                    <div key={c.id} className="border p-4 rounded-lg shadow-sm flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-lg">{c.name}</h4>
                                            <p className="text-sm text-gray-500">{cycles.find(cy => cy.id === c.cycleId)?.name}</p>
                                            <p className="text-xs text-blue-600 mt-1">Tutor: {users.find(u => u.id === c.tutorId)?.name || 'Sin asignar'}</p>
                                        </div>
                                        <button onClick={() => { if(confirm('¿Borrar clase?')) { db.deleteClass(c.id); refreshData(); } }} className="text-red-400 hover:text-red-600">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- STUDENTS TAB --- */}
                {activeTab === 'students' && (
                    <div className="space-y-6">
                         <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <h3 className="font-bold">Base de Datos de Alumnos</h3>
                                <p className="text-sm text-gray-500">Total: {students.length} alumnos registrados</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingStudent({ name: '', classId: classes[0]?.id || '' })} className="bg-green-600 text-white px-3 py-2 rounded text-sm flex items-center gap-2">
                                    <UserPlus size={16}/> Añadir Alumno
                                </button>
                                
                                {/* Import Box */}
                                <div className="flex items-center gap-2 bg-blue-50 p-1 pr-2 rounded-lg border border-blue-100">
                                    <select 
                                        className="bg-white border text-sm p-1 rounded w-32"
                                        value={importClassId}
                                        onChange={(e) => setImportClassId(e.target.value)}
                                    >
                                        <option value="">Selecciona Clase...</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <label className={`px-3 py-1 rounded text-sm flex items-center gap-2 cursor-pointer transition ${importClassId ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                                        <Upload size={16} /> Importar CSV
                                        <input type="file" className="hidden" accept=".csv" onChange={handleImportCSV} disabled={!importClassId} />
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded border border-yellow-100">
                            <strong>Formato CSV requerido:</strong> "Apellidos, Nombre". El archivo se leerá en formato ANSI (compatible con Excel/Tildes).
                        </div>

                        {editingStudent && (
                             <div className="p-4 bg-green-50 rounded-lg border border-green-100 flex gap-2 items-end">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-600">Nombre Completo</label>
                                    <input className="w-full border p-2 rounded" value={editingStudent.name} onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-600">Clase</label>
                                    <select className="w-full border p-2 rounded" value={editingStudent.classId} onChange={e => setEditingStudent({...editingStudent, classId: e.target.value})}>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <button onClick={handleSaveStudent} className="bg-green-600 text-white px-4 py-2 rounded h-10">Guardar</button>
                                <button onClick={() => setEditingStudent(null)} className="text-gray-500 px-4 py-2 h-10">Cancelar</button>
                             </div>
                        )}

                        <div className="overflow-y-auto max-h-[400px] border rounded-lg">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="p-3 text-left">Nombre</th>
                                        <th className="p-3 text-left">Clase</th>
                                        <th className="p-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {students.map(s => (
                                        <tr key={s.id} className="hover:bg-gray-50">
                                            <td className="p-3">{s.name}</td>
                                            <td className="p-3">{classes.find(c => c.id === s.classId)?.name || 'Sin clase'}</td>
                                            <td className="p-3 text-right">
                                                <button onClick={() => setEditingStudent(s)} className="text-blue-600 mr-2"><Edit size={16}/></button>
                                                <button onClick={() => { if(confirm('¿Borrar?')) { db.deleteStudent(s.id); refreshData(); } }} className="text-red-600"><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- SYSTEM TAB --- */}
                {activeTab === 'system' && (
                    <div className="space-y-8 max-w-lg">
                        <div>
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Download size={20}/> Copia de Seguridad</h3>
                            <p className="text-sm text-gray-600 mb-4">Descarga un archivo JSON con toda la información del colegio (Usuarios, Alumnos, Excursiones, Pagos).</p>
                            <button onClick={() => db.exportDatabase()} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition flex items-center gap-2">
                                <Download size={18} /> Descargar Backup Completo
                            </button>
                        </div>

                        <div className="pt-8 border-t">
                            <h3 className="font-bold text-lg mb-4 text-red-600 flex items-center gap-2"><Upload size={20}/> Restaurar Sistema</h3>
                            <p className="text-sm text-gray-600 mb-4">Sube un archivo de backup previamente descargado. <strong className="text-red-500">Atención: Esto borrará los datos actuales.</strong></p>
                            <label className="border-2 border-dashed border-gray-300 p-6 rounded-lg flex flex-col items-center cursor-pointer hover:bg-gray-50 transition">
                                <Upload className="text-gray-400 mb-2" size={32} />
                                <span className="text-sm font-medium text-gray-600">Click para subir archivo JSON</span>
                                <input type="file" className="hidden" accept=".json" onChange={handleRestore} />
                            </label>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};