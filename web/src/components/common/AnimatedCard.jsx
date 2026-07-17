import React from 'react';
import { motion } from 'framer-motion';

export const AnimatedCard = ({ children, className = '', delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: 'spring', 
        stiffness: 100, 
        damping: 15,
        delay 
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`card ${className}`}
    >
      {children}
    </motion.div>
  );
};
