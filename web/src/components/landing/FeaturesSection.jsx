import React from 'react';
import { motion } from 'framer-motion';
import { RiCpuLine, RiLineChartLine, RiFileShield2Line, RiCompass3Line } from 'react-icons/ri';

const features = [
  {
    title: 'Hardware Intrinsic Accuracy',
    desc: 'Edge calibration using LittleFS file storage guarantees sensor pulse readings translate with sub-milliliter precision.',
    icon: <RiCpuLine size={24} />,
    color: 'gold'
  },
  {
    title: 'Real-time Telemetry Updates',
    desc: 'Synchronized push loops deliver current flow rates and cost calculations to dashboard charts in real time.',
    icon: <RiLineChartLine size={24} />,
    color: 'blue'
  },
  {
    title: 'Role-Based Auth Security',
    desc: 'Database rules isolate Super Admins, operators, and viewers to restrict settings modifications and calibration modes.',
    icon: <RiFileShield2Line size={24} />,
    color: 'pink'
  },
  {
    title: 'Remote Diagnostics Panel',
    desc: 'Trigger remote ESP8266 restarts, initiate software calibrations, and check WiFi RSSI signal metrics instantly.',
    icon: <RiCompass3Line size={24} />,
    color: 'blue'
  }
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 px-6 bg-card-white relative">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="section-title">Built For Industrial Scaling</h2>
          <p className="section-subtitle">
            Engineered with modern hardware parameters and robust software components to replace legacy physical billing registers.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -6 }}
              className="bg-russian-white/40 p-8 rounded-3xl border border-border-light/60 flex flex-col transition-all duration-300 hover:shadow-card-hover"
            >
              <div className="w-12 h-12 rounded-2xl bg-luxury-gold/10 text-luxury-gold flex items-center justify-center border border-luxury-gold/10 mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold font-display mb-3">{feature.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
