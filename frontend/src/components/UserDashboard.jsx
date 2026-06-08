

// import React from 'react';
// import { Outlet } from 'react-router-dom';
// import Header from './Header';
// import Footer from './Footer';
// import '../App.css'; // Ensure global styles are applied


// function UserDashboard({ theme, toggleTheme, user, logout, isMenuOpen, setIsMenuOpen }) {
//   return (
//     <>


//       <div className="flex flex-col "> 
//       <Header
//         theme={theme}
//         toggleTheme={toggleTheme}
//         user={user}
//         logout={logout}
//         isMenuOpen={isMenuOpen}
//         setIsMenuOpen={setIsMenuOpen}
//       />

//       {/* The Outlet content now has flex-grow, which tells it to expand and fill all available vertical space, pushing the footer down. */}
//       <main className="flex-grow">
//         <Outlet />
//       </main>

//       <Footer />
//     </div>
//     </>
//   );
// }

// export default UserDashboard;




import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import '../App.css';

function UserDashboard() {
  return (
    // FINAL FIX: This is the correct sticky footer layout for a fixed header.
    // It's a flex column that takes up at least the full screen height.
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* This `main` tag is the key. It grows to fill all vertical space.
         The `pt-16` class adds padding at the top to prevent content from
         being hidden behind the fixed header. */}
      <main className="flex-grow pt-16">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default UserDashboard;