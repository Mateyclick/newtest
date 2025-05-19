import { useEffect, useRef } from "react";
import { HistoryMilestone } from "@/lib/types/history";

interface HistorySectionProps {
  milestones: HistoryMilestone[];
}

const HistorySection = ({ milestones }: HistorySectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    itemRefs.current.forEach((item) => {
      if (item) observer.observe(item);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section id="history" className="py-12 md:py-16 bg-gray-50">
      <div className="section-container mx-auto max-w-6xl px-4" ref={sectionRef}>
        <div className="relative">
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gray-200 hidden md:block" />

          {milestones.map((milestone, index) => (
            <div
              key={milestone.year}
              ref={(el) => (itemRefs.current[index] = el)}
              className="reveal mb-8 last:mb-0"
            >
              {/* Mobile View */}
              <div className="md:hidden">
                <div className="bg-white rounded-lg shadow p-4 mb-3">
                  <div className="text-xs font-medium bg-gray-100 rounded-full px-2 py-0.5 mb-2">
                    {milestone.year}
                  </div>
                  <h3 className="text-base font-semibold mb-2">{milestone.title}</h3>
                  <p className="text-gray-600 text-sm">{milestone.description}</p>
                </div>
                {milestone.image && (
                  <div className="rounded-lg shadow overflow-hidden">
                    <img
                      src={milestone.image}
                      alt={milestone.title}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Desktop View */}
              <div className={`relative hidden md:flex items-center gap-6 ${index % 2 === 0 ? "flex-row-reverse" : ""}`}>
                <div className="absolute left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white bg-black z-10" />

                <div className="w-1/2">
                  <div className={`p-5 bg-white rounded-lg shadow-md ${index % 2 === 0 ? "text-left" : "text-right"}`}>
                    <div className="text-xs font-medium bg-gray-100 rounded-full px-2 py-0.5 mb-2">
                      {milestone.year}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{milestone.title}</h3>
                    <p className="text-gray-600 text-sm">{milestone.description}</p>
                  </div>
                </div>

                <div className="w-1/2">
                  {milestone.image && (
                    <div className="rounded-lg shadow overflow-hidden">
                      <img
                        src={milestone.image}
                        alt={milestone.title}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HistorySection;
