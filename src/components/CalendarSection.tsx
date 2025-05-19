
import { useState, useMemo, useEffect } from "react";
import { ChessEvent } from "@/lib/types/events";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventPopup from "./EventPopup";

interface CalendarSectionProps {
  events: ChessEvent[];
}

const CalendarSection = ({ events }: CalendarSectionProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<ChessEvent | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Generate recurring free activities for the current month
  const recurringEvents = useMemo(() => {
    console.log("Generando eventos recurrentes para", currentMonth.toLocaleDateString());
    const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const activities: ChessEvent[] = [];
    
    let currentDate = new Date(startDate);
    
    while(currentDate <= endDate) {
      // Tuesday is 2, Thursday is 4
      if(currentDate.getDay() === 2 || currentDate.getDay() === 4) {
        console.log(`Creando actividad libre para: ${currentDate.toLocaleDateString()}`);
        activities.push({
          id: currentDate.getTime(),
          title: "Actividad Libre ♟️",
          date: new Date(currentDate),
          description: "Juego libre y práctica abierta para todos los niveles",
          priceSocios: "Gratuito",
          priceNoSocios: "Gratuito",
          whatsapp: "",
          time: "18:00 hs",
          isRecurring: true,
          eventType: "activity"
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    console.log(`Total de actividades libres generadas: ${activities.length}`);
    return activities;
  }, [currentMonth]);

  // Ensure we regenerate activities when the month changes
  useEffect(() => {
    console.log("Mes cambiado a:", currentMonth.toLocaleDateString());
  }, [currentMonth]);

  const allEvents = useMemo(() => {
    const eventsWithTypes = events.map(event => {
      if (event.eventType) return event;
      
      const lowerTitle = event.title.toLowerCase();
      let eventType: 'blitz' | 'rapid' | 'standard' | 'activity' = "standard";
      
      if (lowerTitle.includes("blitz")) {
        eventType = "blitz";
      } else if (lowerTitle.includes("rápido") || lowerTitle.includes("rapid")) {
        eventType = "rapid";
      }
      
      return {...event, eventType};
    });
    
    console.log("Eventos regulares:", eventsWithTypes.length);
    console.log("Actividades recurrentes:", recurringEvents.length);
    
    const combined = [...eventsWithTypes, ...recurringEvents].sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );
    
    console.log("Total eventos combinados:", combined.length);
    return combined;
  }, [events, recurringEvents]);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const goToPrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const monthName = currentMonth.toLocaleString("default", { month: "long" });
  const year = currentMonth.getFullYear();

  const daysInMonth = getDaysInMonth(year, currentMonth.getMonth());
  const firstDayOfMonth = getFirstDayOfMonth(year, currentMonth.getMonth());
  const weekdays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const eventsThisMonth = useMemo(() => {
    const filtered = allEvents.filter(event => 
      event.date.getMonth() === currentMonth.getMonth() && 
      event.date.getFullYear() === currentMonth.getFullYear()
    );
    console.log(`Eventos para ${monthName} ${year}:`, filtered.length);
    return filtered;
  }, [allEvents, currentMonth, monthName, year]);

  const getEventsForDay = (day: number) => {
    const dayEvents = eventsThisMonth.filter(event => event.date.getDate() === day);
    return dayEvents;
  };

  const handleDayClick = (day: number) => {
    const events = getEventsForDay(day);
    if(events.length > 0) {
      setSelectedEvent(events[0]);
      setIsPopupOpen(true);
    }
  };

  const getEventTypeClasses = (eventType: 'blitz' | 'rapid' | 'standard' | 'activity' | undefined) => {
    switch(eventType) {
      case "blitz":
        return "text-red-700 bg-red-100/80 rounded px-1";
      case "rapid":
        return "text-purple-700 bg-purple-100/80 rounded px-1";
      case "activity":
        return "text-green-700 bg-green-100/80 rounded px-1";
      case "standard":
      default:
        return "text-blue-700 bg-blue-100/80 rounded px-1";
    }
  };

  const getCalendarDayClasses = (eventType: 'blitz' | 'rapid' | 'standard' | 'activity' | undefined) => {
    switch(eventType) {
      case "blitz":
        return "bg-red-50 text-red-700";
      case "rapid":
        return "bg-purple-50 text-purple-700";
      case "activity":
        return "bg-green-50 text-green-700";
      case "standard":
      default:
        return "bg-blue-50 text-blue-700";
    }
  };

  const getCalendarCardClasses = (eventType: 'blitz' | 'rapid' | 'standard' | 'activity' | undefined) => {
    switch(eventType) {
      case "blitz":
        return "border-red-100 bg-red-50";
      case "rapid":
        return "border-purple-100 bg-purple-50";
      case "activity":
        return "border-green-100 bg-green-50";
      case "standard":
      default:
        return "border-blue-100 bg-blue-50";
    }
  };

  const getCalendarDateBoxClasses = (eventType: 'blitz' | 'rapid' | 'standard' | 'activity' | undefined) => {
    switch(eventType) {
      case "blitz":
        return "bg-red-100 border-red-200 text-red-700";
      case "rapid":
        return "bg-purple-100 border-purple-200 text-purple-700";
      case "activity":
        return "bg-green-100 border-green-200 text-green-700";
      case "standard":
      default:
        return "bg-blue-100 border-blue-200 text-blue-700";
    }
  };

  return (
    <section id="calendar" className="py-24">
      <div className="section-container">
        <div className="text-center mb-16 reveal">
          <span className="inline-block px-3 py-1 text-sm font-medium bg-black/5 rounded-full mb-4">
            Eventos Próximos
          </span>
          <h2 className="text-4xl md:text-5xl font-semibold mb-4">Calendario de Eventos</h2>
          <p className="max-w-2xl mx-auto text-gray-600">
            Mantente al día con nuestras actividades libres y eventos especiales. 
            <span className="text-green-600 font-medium"> Martes y Jueves siempre hay actividad libre!</span>
          </p>
        </div>

        <div className="max-w-3xl mx-auto reveal">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold">
              {monthName.charAt(0).toUpperCase() + monthName.slice(1)} {year}
            </h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="icon" onClick={goToPrevMonth}>
                <ChevronLeft className="h-5 w-5" />
                <span className="sr-only">Mes anterior</span>
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-5 w-5" />
                <span className="sr-only">Mes siguiente</span>
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-7 border-b">
              {weekdays.map((day) => (
                <div key={day} className="py-3 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px bg-gray-100">
              {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                <div key={`empty-${index}`} className="bg-white py-4 md:py-6" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const eventsForDay = getEventsForDay(day);
                const isToday = 
                  new Date().getDate() === day &&
                  new Date().getMonth() === currentMonth.getMonth() &&
                  new Date().getFullYear() === currentMonth.getFullYear();

                const eventType = eventsForDay.length > 0 ? eventsForDay[0].eventType : undefined;

                return (
                  <div 
                    key={`day-${day}`} 
                    className={`bg-white py-2 px-1 relative ${eventsForDay.length > 0 ? "cursor-pointer" : ""}`}
                    onClick={() => handleDayClick(day)}
                  >
                    <div 
                      className={`calendar-day mx-auto 
                        ${isToday ? "border-2 border-primary" : ""} 
                        ${eventsForDay.length > 0 ? getCalendarDayClasses(eventType) : ""}`}
                    >
                      {day}
                    </div>
                    {eventsForDay.map(event => (
                      <div key={event.id} className="mt-1 px-1">
                        <div className={`text-xs truncate font-medium text-center ${getEventTypeClasses(event.eventType)}`}>
                          {event.title}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            <h4 className="text-xl font-semibold mb-4">Próximos Eventos</h4>
            <div className="space-y-4">
              {eventsThisMonth.length > 0 ? (
                eventsThisMonth.map(event => (
                  <div 
                    key={event.id}
                    className={`p-4 rounded-lg shadow-sm border ${getCalendarCardClasses(event.eventType)} hover:shadow-md transition-shadow cursor-pointer`}
                    onClick={() => {
                      setSelectedEvent(event);
                      setIsPopupOpen(true);
                    }}
                  >
                    <div className="flex items-start">
                      <div className={`h-14 w-14 flex-shrink-0 rounded-md border flex flex-col items-center justify-center mr-4 ${getCalendarDateBoxClasses(event.eventType)}`}>
                        <span className="text-sm font-medium">
                          {event.date.toLocaleString('default', { month: 'short' })}
                        </span>
                        <span className="text-lg font-bold">{event.date.getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className={`text-base font-semibold mb-1 truncate ${
                          event.eventType === "blitz" ? "text-red-700" :
                          event.eventType === "rapid" ? "text-purple-700" :
                          event.eventType === "activity" ? "text-green-700" :
                          "text-blue-700"
                        }`}>
                          {event.title}
                        </h5>
                        <p className="text-sm text-gray-600 truncate">{event.description}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                  <p>No hay eventos este mes</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <EventPopup
        event={selectedEvent}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
      />
    </section>
  );
};

export default CalendarSection;
