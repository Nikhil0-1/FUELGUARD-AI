import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { db } from '../config/firebase';

export const useRealtimeData = (path) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!path) return;
    
    setLoading(true);
    const dbRef = ref(db, path);
    
    const callback = onValue(
      dbRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.val());
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error(`Firebase stream read error at path: ${path}`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      off(dbRef, 'value', callback);
    };
  }, [path]);

  return { data, loading, error };
};
