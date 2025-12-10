// // src/components/Statistics.jsx
// import { useEffect, useState, useRef } from "react";
// import "./Statistics.css"; // Import the new CSS file

// export default function Statistics() {
//   const [isVisible, setIsVisible] = useState(false);
//   const sectionRef = useRef(null);

//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       ([entry]) => {
//         if (entry.isIntersecting) {
//           setIsVisible(true);
//         }
//       },
//       { threshold: 0.3 }
//     );

//     if (sectionRef.current) {
//       observer.observe(sectionRef.current);
//     }

//     return () => {
//       if (sectionRef.current) {
//         observer.unobserve(sectionRef.current);
//       }
//     };
//   }, []);

//   const Counter = ({ end, duration = 2000 }) => {
//     const [count, setCount] = useState(0);

//     useEffect(() => {
//       if (!isVisible) return;

//       let startTime;
//       const startCount = 0;

//       const animate = (currentTime) => {
//         if (!startTime) startTime = currentTime;
//         const progress = (currentTime - startTime) / duration;

//         if (progress < 1) {
//           setCount(Math.floor(startCount + (end - startCount) * progress));
//           requestAnimationFrame(animate);
//         } else {
//           setCount(end);
//         }
//       };

//       requestAnimationFrame(animate);
//     }, [isVisible, end, duration]);

//     return <span>{count.toLocaleString()}</span>;
//   };

//   const stats = [
//     {
//       number: 50000,
//       suffix: "+",
//       label: "Students Enrolled",
//       description: "Active learners worldwide",
//       icon: "👨‍🎓",
//     },
//     {
//       number: 500,
//       suffix: "+",
//       label: "Courses Available",
//       description: "Comprehensive curriculum",
//       icon: "📚",
//     },
//     {
//       number: 98,
//       suffix: "%",
//       label: "Success Rate",
//       description: "Students get jobs",
//       icon: "🎯",
//     },
//     {
//       number: 15000,
//       suffix: "+",
//       label: "Projects Completed",
//       description: "Real-world experience",
//       icon: "🚀",
//     },
//   ];

//   return (
//     <section ref={sectionRef} className="statistics-section">
//       <div className="statistics-container">
//         <div className="statistics-header">
//           <h2 className="statistics-title">Trusted by Thousands of Learners</h2>
//           <p className="statistics-subtitle">
//             Join a community that's changing lives through technology education
//           </p>
//         </div>

//         <div className="statistics-grid">
//           {stats.map((stat, index) => (
//             <div key={index} className="statistics-card">
//               <div className="card-icon">{stat.icon}</div>
//               <div className="card-number">
//                 <Counter end={stat.number} />
//                 {stat.suffix}
//               </div>
//               <div className="card-label">{stat.label}</div>
//               <div className="card-description">{stat.description}</div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }




import { useEffect, useState, useRef } from "react";

export default function Statistics() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const Counter = ({ end, duration = 2000 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!isVisible) return;

      let startTime;
      const startCount = 0;

      const animate = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const progress = (currentTime - startTime) / duration;

        if (progress < 1) {
          setCount(Math.floor(startCount + (end - startCount) * progress));
          requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };

      requestAnimationFrame(animate);
    }, [isVisible, end, duration]);

    return <span>{count.toLocaleString()}</span>;
  };

  const stats = [
    {
      number: 50,
      suffix: "+",
      label: "Students Enrolled",
      description: "Active learners worldwide",
      icon: "👨‍🎓",
    },
    {
      number: 20,
      suffix: "+",
      label: "Courses Available",
      description: "Comprehensive curriculum",
      icon: "📚",
    },
    {
      number: 98,
      suffix: "%",
      label: "Success Rate",
      description: "Students get jobs",
      icon: "🎯",
    },
    {
      number: 10,
      suffix: "+",
      label: "Projects Completed",
      description: "Real-world experience",
      icon: "🚀",
    },
  ];

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-r from-teal-600 to-green-400 mb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Trusted by Thousands of Learners</h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Join a community that's changing lives through technology education
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20 transition-all duration-300 hover:bg-white/20 hover:scale-105">
              <div className="text-4xl mb-4">{stat.icon}</div>
              <div className="text-4xl font-bold text-white mb-2">
                <Counter end={stat.number} />
                {stat.suffix}
              </div>
              <div className="text-xl font-semibold text-blue-100 mb-2">{stat.label}</div>
              <div className="text-sm text-blue-200">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}