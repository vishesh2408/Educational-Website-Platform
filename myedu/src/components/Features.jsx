import React from 'react';

export default function Features() {
  const features = [
    {
      title: "Interactive Learning",
      description:
        "Engage with hands-on coding exercises, real-time feedback, and interactive projects that make learning programming fun and effective.",
      bgColor: "#dbeafe",
      iconColor: "#3b82f6",
      icon: "💻",
    },
    {
      title: "Expert Mentorship",
      description:
        "Get personalized guidance from industry professionals with years of experience in software development and technology.",
      bgColor: "#dcfce7",
      iconColor: "#22c55e",
      icon: "👨‍💼",
    },
    {
      title: "Real Projects",
      description:
        "Build your portfolio with real-world projects that showcase your skills to potential employers and clients.",
      bgColor: "#fef3c7",
      iconColor: "#f59e0b",
      icon: "🚀",
    },
    {
      title: "Career Support",
      description:
        "Access career guidance, interview preparation, and job placement assistance to land your dream tech job.",
      bgColor: "#fce7f3",
      iconColor: "#ec4899",
      icon: "💼",
    },
    {
      title: "Community Access",
      description:
        "Join a thriving community of learners, share knowledge, collaborate on projects, and network with peers.",
      bgColor: "#e0e7ff",
      iconColor: "#6366f1",
      icon: "👥",
    },
    {
      title: "Lifetime Access",
      description:
        "Get lifetime access to course materials, updates, and new content additions to stay current with technology trends.",
      bgColor: "#f0fdf4",
      iconColor: "#16a34a",
      icon: "🔓",
    },
  ];

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900 relative" >
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-800 dark:text-white mb-4">Why Choose Our Platform?</h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Discover the features that make our educational platform the perfect
            choice for your coding journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {features.map((feature, index) => (
            <div key={index} className="bg-white dark:bg-color-card-bg-dark rounded-2xl p-8 shadow-sm transition-all duration-300 border border-black/5 dark:border-color-border-dark cursor-pointer relative overflow-hidden hover:transform hover:-translate-y-2 hover:shadow-lg group">
              <div
                className="w-16 h-16 rounded-xl mb-6 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-1"
                style={{
                  backgroundColor: feature.bgColor,
                }}
              >
                <span className="text-3xl">{feature.icon}</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">{feature.title}</h3>
              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-0">{feature.description}</p>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}