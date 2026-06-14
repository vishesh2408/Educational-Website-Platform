import React, { useEffect, useRef, useState } from 'react';

export default function Features() {
  const [isVisible, setIsVisible] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current);
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

  const features = [
    {
      title: "Interactive Learning",
      description:
        "Engage with hands-on coding exercises, real-time feedback, and interactive projects that make learning programming fun and effective.",
      icon: "💻",
    },
    {
      title: "Expert Mentorship",
      description:
        "Get personalized guidance from industry professionals with years of experience in software development and technology.",
      icon: "👨‍💼",
    },
    {
      title: "Real Projects",
      description:
        "Build your portfolio with real-world projects that showcase your skills to potential employers and clients.",
      icon: "🚀",
    },
    {
      title: "Career Support",
      description:
        "Access career guidance, interview preparation, and job placement assistance to land your dream tech job.",
      icon: "💼",
    },
    {
      title: "Community Access",
      description:
        "Join a thriving community of learners, share knowledge, collaborate on projects, and network with peers.",
      icon: "👥",
    },
    {
      title: "Lifetime Access",
      description:
        "Get lifetime access to course materials, updates, and new content additions to stay current with technology trends.",
      icon: "🔓",
    },
  ];

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
    <section className="py-20 relative">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Why Choose Our Platform?</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Discover the features that make our educational platform the perfect
            choice for your coding journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {features.map((feature, index) => (
            <div
              key={index}
              className="group rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur p-8 transition-all duration-300 cursor-pointer relative overflow-hidden hover:-translate-y-2 hover:shadow-lg shadow-sm dark:shadow-none"
            >
              <div className="w-16 h-16 rounded-xl mb-6 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-1 bg-[#167468]/10 border border-[#167468]/20">
                <span className="text-3xl">{feature.icon}</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
              <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-0">{feature.description}</p>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#167468] via-purple-500 to-blue-500 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
            </div>
          ))}
        </div>

        {/* Statistics */}
        <div ref={statsRef} className="mt-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Trusted by Thousands of Learners</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Join a community that's changing lives through technology education
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-gray-200 dark:border-white/20 transition-all duration-300 hover:bg-gray-50 dark:hover:bg-white/20 hover:scale-105 shadow-sm dark:shadow-none"
              >
                <div className="text-4xl mb-4">{stat.icon}</div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  <Counter end={stat.number} />
                  {stat.suffix}
                </div>
                <div className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">{stat.label}</div>
                <div className="text-sm text-gray-500 dark:text-gray-300">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}