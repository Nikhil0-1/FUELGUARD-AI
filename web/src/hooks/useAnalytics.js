import { useState, useEffect } from 'react';
import { ref, get, query, orderByKey, limitToLast } from 'firebase/database';
import { db } from '../config/firebase';

export const useAnalytics = (days = 30) => {
  const [data, setData] = useState({
    highestFuel: 0,
    lowestFuel: 0,
    averageFuel: 0,
    averageCost: 0,
    averageFlow: 0,
    dailyConsumption: [],
    revenueTrend: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Read historical transactions to derive charts analytics
        const transRef = query(ref(db, 'FuelGuardAI/Transactions'), orderByKey(), limitToLast(200));
        const snapshot = await get(transRef);

        if (!snapshot.exists()) {
          setData(prev => ({ ...prev, loading: false }));
          return;
        }

        const rawTransactions = Object.values(snapshot.val());
        if (rawTransactions.length === 0) {
          setData(prev => ({ ...prev, loading: false }));
          return;
        }

        let totalFuel = 0;
        let totalCost = 0;
        let totalFlow = 0;
        let maxFuel = -Infinity;
        let minFuel = Infinity;
        
        const dailyAggregates = {};
        
        rawTransactions.forEach(t => {
          const fuel = parseFloat(t.fuel) || 0;
          const price = parseFloat(t.price) || 0;
          const flow = parseFloat(t.flowRate) || 0;
          const date = t.date || "Unknown";

          totalFuel += fuel;
          totalCost += price;
          totalFlow += flow;

          if (fuel > maxFuel) maxFuel = fuel;
          if (fuel < minFuel) minFuel = fuel;

          // Group by Date for chart aggregation
          if (!dailyAggregates[date]) {
            dailyAggregates[date] = { fuel: 0, cost: 0 };
          }
          dailyAggregates[date].fuel += fuel;
          dailyAggregates[date].cost += price;
        });

        const count = rawTransactions.length;
        
        // Transform daily consumption aggregates into list format
        const sortedDates = Object.keys(dailyAggregates).sort();
        const dailyConsumption = sortedDates.map(date => ({
          date,
          fuel: parseFloat(dailyAggregates[date].fuel.toFixed(2)),
          cost: parseFloat(dailyAggregates[date].cost.toFixed(2))
        }));

        setData({
          highestFuel: parseFloat((maxFuel === -Infinity ? 0 : maxFuel).toFixed(2)),
          lowestFuel: parseFloat((minFuel === Infinity ? 0 : minFuel).toFixed(2)),
          averageFuel: parseFloat((totalFuel / count).toFixed(2)),
          averageCost: parseFloat((totalCost / count).toFixed(2)),
          averageFlow: parseFloat((totalFlow / count).toFixed(2)),
          dailyConsumption,
          loading: false,
          error: null
        });

      } catch (err) {
        console.error("Error generating analytics:", err);
        setData(prev => ({ ...prev, loading: false, error: err }));
      }
    };

    fetchAnalytics();
  }, [days]);

  return data;
};
