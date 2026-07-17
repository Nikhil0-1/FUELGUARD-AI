import React, { useState } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { 
  RiWaterFlashLine, 
  RiMoneyDollarBoxLine, 
  RiBaseStationLine, 
  RiPieChartLine 
} from 'react-icons/ri';
import { formatVolume, formatCurrency } from '../utils/formatters';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticsPage() {
  const { 
    highestFuel,
    lowestFuel,
    averageFuel,
    averageCost,
    averageFlow,
    dailyConsumption,
    loading 
  } = useAnalytics();

  const [timeRange, setTimeRange] = useState('30'); // 7, 30, 90 days

  if (loading) {
    return <div className="text-center py-12">Parsing fuel analytics aggregates...</div>;
  }

  // Composing datasets for charts
  const dates = dailyConsumption.map(d => d.date);
  const fuelValues = dailyConsumption.map(d => d.fuel);
  const costValues = dailyConsumption.map(d => d.cost);

  const fuelChartData = {
    labels: dates,
    datasets: [
      {
        label: 'Fuel Consumption (Litres)',
        data: fuelValues,
        borderColor: '#C9A96E', // Luxury Gold
        backgroundColor: 'rgba(201, 169, 110, 0.1)',
        fill: true,
        tension: 0.35
      }
    ]
  };

  const revenueChartData = {
    labels: dates,
    datasets: [
      {
        label: 'Revenue Earned (INR)',
        data: costValues,
        borderColor: '#6B9BD2', // Soft Blue
        backgroundColor: 'rgba(107, 155, 210, 0.15)',
        fill: true,
        tension: 0.35
      }
    ]
  };

  const barChartData = {
    labels: dates,
    datasets: [
      {
        label: 'Daily Totals',
        data: fuelValues,
        backgroundColor: '#C9A96E',
        borderRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        grid: { display: false }
      },
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-text-primary">AI Analytics Console</h1>
          <p className="text-sm text-text-secondary mt-1">Aggregated consumption trends and performance analytics</p>
        </div>

        {/* Time Selector */}
        <div className="flex items-center gap-2 bg-card-white border border-border-light/60 px-4 py-2 rounded-xl shadow-nav">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-transparent text-sm font-semibold text-text-primary focus:outline-none cursor-pointer"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Highest Session */}
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-luxury-gold/10 text-luxury-gold flex items-center justify-center border border-luxury-gold/10">
            <RiWaterFlashLine size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary block">Peak Session</span>
            <span className="text-xl font-bold font-display text-text-primary mt-1 block">
              {formatVolume(highestFuel)}
            </span>
          </div>
        </div>

        {/* Average Fuel */}
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-soft-blue/10 text-soft-blue flex items-center justify-center border border-soft-blue/10">
            <RiPieChartLine size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary block">Avg Fuel Volume</span>
            <span className="text-xl font-bold font-display text-text-primary mt-1 block">
              {formatVolume(averageFuel)}
            </span>
          </div>
        </div>

        {/* Average cost */}
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-success-light text-success flex items-center justify-center border border-success/10">
            <RiMoneyDollarBoxLine size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary block">Avg Ticket Price</span>
            <span className="text-xl font-bold font-display text-text-primary mt-1 block">
              {formatCurrency(averageCost)}
            </span>
          </div>
        </div>

        {/* Average flow rate */}
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-warning-light text-warning flex items-center justify-center border border-warning/10">
            <RiBaseStationLine size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary block">Avg Flow Rate</span>
            <span className="text-xl font-bold font-display text-text-primary mt-1 block">
              {averageFlow} L/m
            </span>
          </div>
        </div>

      </div>

      {/* Chart Layout Plots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Fuel Consumption Trend */}
        <div className="card space-y-4">
          <h3 className="text-lg font-bold font-display text-text-primary">Fuel Consumption Volume</h3>
          <div className="h-72">
            <Line data={fuelChartData} options={options} />
          </div>
        </div>

        {/* Financial Revenue Trend */}
        <div className="card space-y-4">
          <h3 className="text-lg font-bold font-display text-text-primary">Daily Revenue Sales</h3>
          <div className="h-72">
            <Line data={revenueChartData} options={options} />
          </div>
        </div>

        {/* Bar Chart Daily comparisons */}
        <div className="card space-y-4 lg:col-span-2">
          <h3 className="text-lg font-bold font-display text-text-primary">Daily Delivery Metrics Summary</h3>
          <div className="h-72">
            <Bar data={barChartData} options={options} />
          </div>
        </div>

      </div>
    </div>
  );
}
