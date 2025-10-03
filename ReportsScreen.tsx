
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function ReportsScreen() {
  const [total, setTotal] = useState(0);
  const [finished, setFinished] = useState(0);

  useEffect(() => {
    const run = async () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      // Firestore doesn't support between on non-timestamp unless stored as Timestamp
      // We'll fetch all and filter in client for simplicity in starter
      const snap = await getDocs(collection(db, 'tasks'));
      const tasks = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      const inMonth = tasks.filter((t: any) => {
        const ts = t.createdAt?.toDate ? t.createdAt.toDate() : (t.createdAt ? new Date(t.createdAt) : null);
        if (!ts) return false;
        return ts >= start && ts < end;
      });
      setTotal(inMonth.length);
      setFinished(inMonth.filter((t:any)=> t.status === 'Finished').length);
    };
    run();
  }, []);

  const rate = total > 0 ? Math.round((finished/total)*100) : 0;

  return (
    <View style={{ padding: 16, gap: 8 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>Monthly Report</Text>
      <Text>Total tasks: {total}</Text>
      <Text>Completed: {finished}</Text>
      <Text>Success rate: {rate}%</Text>
    </View>
  );
}
