// import React from 'react';
// import './Footer.css'; // Assuming you have a CSS file for styling the footer

// const Footer = () => {
//     const footerLinks = {
//         Platform: ["About Us", "All Courses", "Quizzes", "Instructors"],
//         Resources: ["Contact", "Blog", "FAQs", "Support"],
//     };
//     const socialIcons = [
//         { title: "Facebook", icon: <i className="fab fa-facebook-f"></i> },
//         { title: "Instagram", icon: <i className="fab fa-instagram"></i> },
//         { title: "LinkedIn", icon: <i className="fab fa-linkedin-in"></i> },
//         { title: "GitHub", icon: <i className="fab fa-github"></i> },
//         { title: "YouTube", icon: <i className="fab fa-youtube"></i> },
//     ];
//     return (
//         <footer className="footer">
//             <div className="container footer-content">
//                 <div className="footer-grid">
//                     <div className="footer-brand-info">
//                         <h2 className="footer-logo">LearnBent</h2>
//                         <p className="footer-text">Your partner in acquiring new skills and advancing your career through quality online education.</p>
//                         <p className="footer-text"><i className="fas fa-map-marker-alt footer-icon"></i>Sovereign Corporate Tower, Noida, UP, India</p>
//                     </div>
//                     {Object.entries(footerLinks).map(([title, links]) => (
//                         <div key={title}>
//                             <h3 className="footer-heading">{title}</h3>
//                             <ul className="footer-links-list">
//                                 {links.map(link => <li key={link}><a href="#" className="footer-link">{link}</a></li>)}
//                             </ul>
//                         </div>
//                     ))}
//                     <div>
//                         <h3 className="footer-heading">Connect</h3>
//                         <div className="social-icons">
//                             {socialIcons.map(social => (
//                                 <a key={social.title} href="#" title={social.title} className="social-icon">{social.icon}</a>
//                             ))}
//                         </div>
//                     </div>
//                 </div>
//                 <div className="footer-bottom">
//                     <p className="footer-copyright">&copy; {new Date().getFullYear()} LearnBent. All Rights Reserved. Designed with <i className="fas fa-heart footer-heart-icon"></i>.</p>
//                 </div>
//             </div>
//         </footer>
//     )
// }

// export default Footer;

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import LearnBentIcon from '../contexts/LearnBentIcon';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

const Footer = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState({ state: 'idle', message: '' });

  const canSubmit = useMemo(() => {
    const email = newsletterEmail.trim();
    return email.length > 0;
  }, [newsletterEmail]);

  const submitNewsletter = async () => {
    if (!canSubmit) return;

    try {
      setNewsletterStatus({ state: 'loading', message: '' });
      const res = await fetch(`${API_BASE_URL}/public/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail.trim(), source: 'footer' }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNewsletterStatus({ state: 'error', message: data.msg || 'Could not subscribe. Try again.' });
        return;
      }

      setNewsletterEmail('');
      setNewsletterStatus({
        state: 'success',
        message: data.already ? 'You are already subscribed.' : 'Subscribed successfully.',
      });
    } catch (err) {
      setNewsletterStatus({ state: 'error', message: 'Network error. Try again.' });
    }
  };

  // Keep the same link content you already had
  const footerLinks = {
    Platform: ['About Us', 'All Courses', 'Quizzes', 'Instructors'],
    Resources: ['Contact', 'Blog', 'FAQs', 'Support'],
  };

  // Keep the same social links/icons you already had
  const socialIcons = [
    { title: 'Facebook', href: '#', icon: <i className="fab fa-facebook-f" /> },
    { title: 'Instagram', href: '#', icon: <i className="fab fa-instagram" /> },
    { title: 'LinkedIn', href: '#', icon: <i className="fab fa-linkedin-in" /> },
    { title: 'GitHub', href: '#', icon: <i className="fab fa-github" /> },
    { title: 'YouTube', href: '#', icon: <i className="fab fa-youtube" /> },
  ];

  return (
    <footer className="relative border-t border-white/10 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand (logo/motto/location stay the same) */}
          <div className="lg:col-span-2">
            <motion.div className="flex items-center gap-2 mb-6" whileHover={{ scale: 1.03 }}>
              <LearnBentIcon size={32} />
              <span className="text-white font-bold text-xl">LearnBent</span>
            </motion.div>

            <p className="text-gray-400 mb-8 max-w-sm leading-relaxed">
              Your partner in acquiring new skills and advancing your career through quality online education.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors cursor-default">
                <MapPin className="w-4 h-4 text-[#167468]" />
                <span className="text-sm">Sovereign Corporate Tower, Noida, UP, India</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white font-bold mb-6">{category}</h3>
              <ul className="space-y-4">
                {links.map((link) => (
                  <li key={link}>
                    <motion.a
                      href="#"
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                      whileHover={{ x: 5 }}
                    >
                      {link}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Connect */}
          <div>
            <h3 className="text-white font-bold mb-6">Connect</h3>
            <div className="flex items-center gap-4 flex-wrap">
              {socialIcons.map((social) => (
                <motion.a
                  key={social.title}
                  href={social.href}
                  title={social.title}
                  className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all shadow-sm"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={social.title}
                >
                  <span className="text-white">{social.icon}</span>
                </motion.a>
              ))}
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 mb-12 shadow-inner">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-white text-xl font-bold mb-2">Subscribe to Our Newsletter</h3>
              <p className="text-gray-400 text-sm">Get the latest updates, course discounts and learning resources</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                value={newsletterEmail}
                onChange={(e) => {
                  setNewsletterEmail(e.target.value);
                  if (newsletterStatus.state !== 'idle') setNewsletterStatus({ state: 'idle', message: '' });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitNewsletter();
                }}
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#167468] w-full sm:flex-1 md:w-80 transition-all"
              />
              <motion.button
                type="button"
                className="bg-gradient-to-r from-purple-500 to-[#167468] text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg whitespace-nowrap font-bold shadow-lg text-sm sm:text-base w-full sm:w-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={submitNewsletter}
                disabled={!canSubmit || newsletterStatus.state === 'loading'}
              >
                {newsletterStatus.state === 'loading' ? 'Subscribing…' : 'Subscribe'}
              </motion.button>
            </div>
          </div>

          {newsletterStatus.state !== 'idle' && (
            <p
              className={`mt-3 text-sm ${newsletterStatus.state === 'success'
                  ? 'text-emerald-300'
                  : newsletterStatus.state === 'error'
                    ? 'text-red-300'
                    : 'text-gray-400'
                }`}
            >
              {newsletterStatus.message}
            </p>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/10">
          <p className="text-gray-500 text-sm text-center md:text-left">
            © {new Date().getFullYear()} LearnBent. All Rights Reserved. Designed with{' '}
            <i className="fas fa-heart text-red-500 mx-1" />.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;