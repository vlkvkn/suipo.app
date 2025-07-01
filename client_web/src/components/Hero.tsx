import { motion } from 'framer-motion';
import { Zap, Users, Star, Shield } from 'lucide-react';
import './Hero.css';

export function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  };

  return (
    <div className="hero-container">
      {/* Animated background */}
      <div className="hero-background">
        <motion.div
          className="gradient-orb orb-1"
          variants={floatingVariants}
          animate="animate"
        />
        <motion.div
          className="gradient-orb orb-2"
          variants={floatingVariants}
          animate="animate"
          style={{ animationDelay: '1s' }}
        />
        <motion.div
          className="gradient-orb orb-3"
          variants={floatingVariants}
          animate="animate"
          style={{ animationDelay: '2s' }}
        />
      </div>

      <motion.div
        className="hero-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Main heading */}
        <motion.div className="hero-header" variants={itemVariants}>
          <motion.h1 className="hero-title">
            Collect your Attendance!
          </motion.h1>
          <motion.p className="hero-subtitle" variants={itemVariants}>
            Create and collect unique digital event badges
          </motion.p>
          <motion.p className="hero-description" variants={itemVariants}>
            A secure platform for creating, distributing, and collecting 
            Proof of Attendance Protocol (POAP) on the Sui blockchain
          </motion.p>
        </motion.div>

        {/* Features */}
        <motion.div className="hero-features" variants={itemVariants}>

          <motion.div className="feature-card"
            whileHover={{ y: -5, scale: 1.02 }} 
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Star className="feature-icon" />
            <h3>Uniqueness</h3>
            <p>Exclusive digital collections</p>
          </motion.div>
          
          <motion.div 
            className="feature-card"
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Shield className="feature-icon" />
            <h3>Security</h3>
            <p>Secure smart contracts on Move</p>
          </motion.div>

          <motion.div 
            className="feature-card"
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Zap className="feature-icon" />
            <h3>Speed</h3>
            <p>Instant transactions on Sui</p>
          </motion.div>

          <motion.div 
            className="feature-card"
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Users className="feature-icon" />
            <h3>Community</h3>
            <p>Connect via zkLogin</p>
          </motion.div>

        </motion.div>

        {/* Stats */}
        {/* <motion.div className="hero-stats" variants={itemVariants}>
          <motion.div 
            className="stat-item"
            whileHover={{ scale: 1.1 }}
          >
            <h3>10,000+</h3>
            <p>POAPs Created</p>
          </motion.div>
          <motion.div 
            className="stat-item"
            whileHover={{ scale: 1.1 }}
          >
            <h3>50,000+</h3>
            <p>Users</p>
          </motion.div>
          <motion.div 
            className="stat-item"
            whileHover={{ scale: 1.1 }}
          >
            <h3>1,000+</h3>
            <p>Events</p>
          </motion.div>
        </motion.div> */}
      </motion.div>
    </div>
  );
} 