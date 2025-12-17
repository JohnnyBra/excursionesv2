import { useState, useEffect } from 'react';
import { db } from '../services/mockDb';

/**
 * Hook para sincronización de datos.
 * Retorna un número de versión que se incrementa cada vez que la BD se actualiza
 * (ya sea por una acción local o por un evento de Socket.io).
 */
export const useDataSync = () => {
  const [dbVersion, setDbVersion] = useState(0);

  useEffect(() => {
    // Suscribirse a cambios en mockDb
    const unsubscribe = db.subscribe(() => {
      setDbVersion(prev => prev + 1);
    });

    // Cleanup al desmontar
    return () => unsubscribe();
  }, []);

  return dbVersion;
};