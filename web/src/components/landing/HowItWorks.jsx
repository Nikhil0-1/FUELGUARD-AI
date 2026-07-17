import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    num: '01',
    title: 'Flow Sensor Interrupts',
    desc: 'As fuel flows through YF-S201, a micro Hall sensor triggers rising interrupts on ESP8266 GPIO D5.'
  },
  {
    num: '02',
    title: 'Real-time Calculations',
    desc: 'The firmware accumulates pulses and filters flow spikes using moving average formulas in non-blocking loops.'
  },
  {
    num: '03',
    title: 'Cloud Synchronization',
    desc: 'The Firebase Client streams active sessions directly to the real-time database with sub-second accuracy.'
  },
  {
    num: '04',
    title: 'Telemetry Dashboard',
    desc: 'React dashboards pick up updates instantly via web sockets, enabling CSV log downloads and analytics plotting.'
  }
];

export const HowItWorks = () => {
  return (
    <section className="py-24 px-6 bg-russian-white relative">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="section-title">The Flow Optimization Loop</h2>
          <p className="section-subtitle">
            Understand how our hardware integrations stream fuel counts into analytics metrics logs.
          </p>
        </div>

        {/* Timeline Path */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step, idx) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.12 }}
              className="relative p-6 bg-card-white rounded-3xl border border-border-light/40 shadow-card"
            >
              <span className="text-4xl font-extrabold font-display text-luxury-gold/20 block mb-4">
                {step.num}
              </span>
              <h3 className="text-lg font-bold font-display text-text-primary mb-2">{step.title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
