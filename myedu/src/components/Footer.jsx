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




import React from 'react';

const Footer = () => {
  const footerLinks = {
    Platform: ["About Us", "All Courses", "Quizzes", "Instructors"],
    Resources: ["Contact", "Blog", "FAQs", "Support"],
  };

  // The social icons data remains the same
  const socialIcons = [
    { title: "Facebook", icon: <i className="fab fa-facebook-f text-white" /> },
    { title: "Instagram", icon: <i className="fab fa-instagram text-white" /> },
    { title: "LinkedIn", icon: <i className="fab fa-linkedin-in text-white" /> },
    { title: "GitHub", icon: <i className="fab fa-github text-white" /> },
    { title: "YouTube", icon: <i className="fab fa-youtube text-white" /> },
  ];

  return (
    // The main footer container, removing the bottom margin
    <footer className="bg-gray-900 text-gray-300 w-full transition-colors duration-300 ">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-16">
          {/* Brand Information Section */}
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-white">LearnBent</h2>
            <p className="text-sm">Your partner in acquiring new skills and advancing your career through quality online education.</p>
            <p className="text-sm flex items-start">
              <i className="fas fa-map-marker-alt text-teal-400 mr-2 mt-1" />
              Sovereign Corporate Tower, Noida, UP, India
            </p>
          </div>

          {/* Dynamic Link Sections */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
              <ul className="flex flex-col space-y-2">
                {links.map(link => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-gray-300 hover:text-teal-400 transition-colors duration-300"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social Media Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Connect</h3>
            <div className="flex space-x-4">
              {socialIcons.map(social => (
                <a
                  key={social.title}
                  href="#"
                  title={social.title}
                  className="w-10 h-10 flex items-center justify-center bg-gray-700 rounded-full hover:bg-teal-500 transition-colors duration-300 group"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Copyright Section */}
        <div className="mt-12 pt-8 border-t border-gray-700 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} LearnBent. All Rights Reserved. Designed with <i className="fas fa-heart text-red-500 mx-1" />.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;