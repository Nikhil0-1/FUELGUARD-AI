import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiAddLine, RiSubtractLine } from 'react-icons/ri';

const faqs = [
  {
    q: 'How accurate is the YF-S201 flow sensor under this firmware?',
    a: 'Out of the box, the YF-S201 sensor exhibits ±5% to ±10% tolerances. However, with our custom calibration routines that calculate factors dynamically and write profiles directly to ESP8266 LittleFS, precision falls under ±1.5% deviations when calibrated against specific fueling pressures.'
  },
  {
    q: 'How does the system handle offline states during network blackouts?',
    a: 'When WiFi connectivity drops, the ESP8266 displays a "WiFi Lost" status on the physical LCD. During this time, the firmware operates independently, updating flow volumes locally. Once connection reconnects, transaction logs push automatically to sync with cloud databases.'
  },
  {
    q: 'What is the role of the Super Admin in the dashboard console?',
    a: 'Only users assigned with the Super Admin role can edit base settings, modify the fuel price, reset total metrics, alter sensor calibration factors, and create or delete dashboard operator credentials. Viewers have read-only access to charts.'
  },
  {
    q: 'Does this platform support Over-The-Air (OTA) updates?',
    a: 'Yes, the ESP8266 firmware has full ArduinoOTA listener capabilities built directly into its background loops. Firmware updates can be compiled and pushed securely over local networks, with real-time flashing progress percentages rendering on the LCD.'
  }
];

export const FAQ = () => {
  const [openIdx, setOpenIdx] = useState(null);

  const toggle = (idx) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="py-24 px-6 bg-card-white">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Title */}
        <div className="text-center mb-16">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle mx-auto">
            Technical queries answered regarding hardware integrations, calibrations, and access control.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div 
                key={faq.q}
                className="border border-border-light/60 rounded-2xl overflow-hidden bg-russian-white/30"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-text-primary hover:bg-russian-white/60 transition-colors"
                >
                  <span className="font-display pr-4">{faq.q}</span>
                  {isOpen ? <RiSubtractLine size={20} className="text-luxury-gold" /> : <RiAddLine size={20} className="text-text-secondary" />}
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-6 pb-5 pt-1 text-sm text-text-secondary leading-relaxed border-t border-border-light/30">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
