// src/pages/Calendar.tsx (SIN Actividad Libre dinámica)

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar"; 
import Footer from "@/components/Footer"; 
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, AlertTriangle } from "lucide-react"; 
import { Button } from "@/components/ui/button"; 
import EventPopup from "@/components/EventPopup"; 
import { ChessEvent } from "@/lib/types/events"; 

// --- Función generateFreeActivities ELIMINADA ---
// Ya no necesitamos esta función aquí

// --- Componente Calendar ---
const Calendar = () => { 
  // --- Estado ---
  const [allEvents, setAllEvents] = useState<ChessEvent[]>([]); 
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null); 
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<ChessEvent | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // --- Carga de Datos desde API ---
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);
      console.log("Iniciando fetch de eventos (solo API)..."); 

      try {
        // ***** URL de tu API de SheetDB *****
        const apiUrl = 'https://sheetdb.io/api/v1/trlw7j47anj23'; 
        // ***********************************

        const response = await fetch(apiUrl);
        console.log("Respuesta fetch recibida, status:", response.status); 
        if (!response.ok) {
          throw new Error(`Error ${response.status}: No se pudo obtener los eventos de la API`);
        }
        
        const dataFromApi = await response.json();
        console.log("Datos recibidos de la API:", dataFromApi); 

        if (!Array.isArray(dataFromApi)) {
          console.error("La respuesta de la API no es un array:", dataFromApi);
          throw new Error("Formato de datos inesperado desde la API.");
        }

        // Transformar datos: Parsear fechas y asegurar estructura
        const fetchedUpcomingEvents = dataFromApi.map((item: any): ChessEvent | null => {
          try {
            const eventDateStr = item.Fecha; 
            const eventDate = new Date(eventDateStr + 'T00:00:00'); 

            if (isNaN(eventDate.getTime())) {
              console.warn(`Fecha inválida "${eventDateStr}" para el evento "${item.Titulo || 'Desconocido'}"`);
              return null; 
            }

            return {
              id: item.ID ? parseInt(item.ID) : Math.random(), 
              title: item.Titulo || "Sin título",
              date: eventDate,
              time: item.Hora || "",
              description: item.Descripcion || "",
              priceSocios: item.PrecioSocios || "", 
              priceNoSocios: item.PrecioNoSocios || "",
              whatsapp: item.Whatsapp || "",
              eventType: item.TipoEvento || "standard", 
              isRecurring: String(item.EsRecurrente).toUpperCase() === 'TRUE' 
            };
          } catch (mapError) {
              console.error("Error mapeando el item:", item, mapError);
              return null; 
          }
        }).filter(event => event !== null) as ChessEvent[]; 

        console.log("Eventos parseados desde API:", fetchedUpcomingEvents); 

        // --- Sección de Actividad Libre ELIMINADA ---
        // Ya no generamos ni combinamos las actividades libres aquí

        // --- Ordenar y Establecer Eventos ---
        // Simplemente ordenamos los eventos obtenidos de la API
        const sortedEvents = fetchedUpcomingEvents.sort((a, b) => 
          a.date.getTime() - b.date.getTime()
        );
        console.log("Total eventos (solo API) ordenados:", sortedEvents.length); 

        setAllEvents(sortedEvents); // Guardamos solo los eventos de la API ordenados

      } catch (err) {
        console.error("Error completo al cargar/procesar eventos:", err);
        setError(err instanceof Error ? err.message : "Ocurrió un error desconocido al cargar eventos.");
      } finally {
        setIsLoading(false);
        console.log("Carga de eventos finalizada."); 
      }
    };

    fetchEvents();
  }, []); 

  // --- Lógica del Calendario (sin cambios) ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  const goToPrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const monthName = currentMonth.toLocaleString("es-ES", { month: "long" });
  const year = currentMonth.getFullYear();
  const daysInMonth = getDaysInMonth(year, currentMonth.getMonth());
  const firstDayOfMonth = getFirstDayOfMonth(year, currentMonth.getMonth());
  const weekdays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  // Filtrar eventos para el mes actual desde el estado 'allEvents'
  const eventsThisMonth = useMemo(() => {
    console.log(`Filtrando eventos para ${monthName} ${year} desde ${allEvents.length} eventos totales.`); 
    return allEvents.filter(event => {
      if (!(event.date instanceof Date) || isNaN(event.date.getTime())) {
         return false; 
      }
      return event.date.getMonth() === currentMonth.getMonth() && 
             event.date.getFullYear() === currentMonth.getFullYear();
    });
  }, [allEvents, currentMonth]);
  console.log("Eventos filtrados para este mes:", eventsThisMonth); 

  const getEventForDay = (day: number) => {
    return eventsThisMonth.find(event => {
       if (!(event.date instanceof Date) || isNaN(event.date.getTime())) return false; 
      return event.date.getDate() === day;
    }) || null;
  };

  const handleDayClick = (day: number) => {
    const event = getEventForDay(day); 
    if (event) {
      setSelectedEvent(event);
      setIsPopupOpen(true);
    }
  };

  // Funciones de estilo (No cambiaron, pero el caso 'activity' ya no se usará)
  const getEventTypeClasses = (eventType: 'blitz' | 'rapid' | 'standard' | 'activity' | undefined) => { 
    switch(eventType) {
      case "blitz": return "bg-red-700 text-white";
      case "rapid": return "bg-purple-700 text-white";
      case "activity": return "bg-green-700 text-white"; // Ya no se usa pero no molesta
      case "standard": default: return "bg-blue-700 text-white";
    }
  };
  const getEventCardBorderClass = (eventType: 'blitz' | 'rapid' | 'standard' | 'activity' | undefined) => { 
    switch(eventType) {
      case "blitz": return "border-red-200";
      case "rapid": return "border-purple-200";
      case "activity": return "border-green-200"; // Ya no se usa
      case "standard": default: return "border-blue-200";
    }
  };
  const getCalendarDateBoxClass = (eventType: 'blitz' | 'rapid' | 'standard' | 'activity' | undefined) => { 
    switch(eventType) {
      case "blitz": return "bg-red-100 border-red-200 text-red-700";
      case "rapid": return "bg-purple-100 border-purple-200 text-purple-700";
      case "activity": return "bg-green-100 border-green-200 text-green-700"; // Ya no se usa
      case "standard": default: return "bg-blue-100 border-blue-200 text-blue-700";
    }
  };

  // --- Renderizado ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />

      {/* Header */}
      <div className="pt-28 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-900/10 text-blue-900 rounded-full mb-4">
              Eventos Próximos
            </span>
            <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-blue-900">Calendario de Eventos</h1>
            <p className="max-w-2xl mx-auto text-blue-800/80">
              Mantente al día con nuestros próximos torneos, clases y eventos especiales.
              {/* ELIMINADO: <span className="font-medium text-green-700"> Martes y Jueves hay actividad libre a las 18:00 hs.</span> */}
            </p>
          </div>
        </div>
      </div>

      {/* Calendario */}
      <section className="py-10 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
             {/* Indicador de Carga y Error (igual) */}
             {isLoading && ( <div className="text-center py-10 text-blue-600"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />Cargando eventos...</div> )}
             {error && !isLoading && ( <div className="text-center py-10 text-red-600 bg-red-50 p-4 rounded-lg border border-red-200"><AlertTriangle className="h-8 w-8 mx-auto mb-2" /><p className="font-semibold">Error al cargar eventos:</p><p className="text-sm">{error}</p></div> )}

            {/* Mostrar Calendario (igual) */}
            {(!isLoading || allEvents.length > 0) && !error && (
              <>
                {/* Calendar header (igual) */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-semibold text-blue-900">{monthName.charAt(0).toUpperCase() + monthName.slice(1)} {year}</h3>
                    <div className="flex space-x-2">
                       {/* ... botones prev/next ... */}
                        <Button variant="outline" size="icon" onClick={goToPrevMonth} className="border-blue-200 text-blue-800 hover:bg-blue-50"><ChevronLeft className="h-5 w-5" /><span className="sr-only">Mes anterior</span></Button>
                        <Button variant="outline" size="icon" onClick={goToNextMonth} className="border-blue-200 text-blue-800 hover:bg-blue-50"><ChevronRight className="h-5 w-5" /><span className="sr-only">Mes siguiente</span></Button>
                    </div>
                </div>

                {/* Calendar grid (igual) */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-blue-100">
                    <div className="grid grid-cols-7 border-b border-blue-100">{weekdays.map((day) => ( <div key={day} className="py-3 text-center text-sm font-medium text-blue-700">{day}</div> ))}</div>
                    <div className="grid grid-cols-7 gap-px bg-blue-50">
                        {Array.from({ length: firstDayOfMonth }).map((_, index) => ( <div key={`empty-${index}`} className="bg-white py-4 md:py-6" /> ))}
                        {Array.from({ length: daysInMonth }).map((_, index) => {
                        const day = index + 1;
                        const event = getEventForDay(day);
                        const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth.getMonth() && new Date().getFullYear() === currentMonth.getFullYear();
                        return (
                            <div key={`day-${day}`} className={`bg-white py-2 px-1 relative h-20 md:h-24 ${event ? "cursor-pointer hover:bg-gray-50 transition-colors duration-150" : ""}`} onClick={() => handleDayClick(day)}>
                            <div className={`calendar-day mx-auto w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold ${isToday ? "border-2 border-blue-500" : ""} ${event ? getEventTypeClasses(event.eventType) : "text-gray-700"}`}>{day}</div>
                             {event && ( <div className={`mt-1 text-center text-[10px] leading-tight truncate px-0.5 rounded ${getEventTypeClasses(event.eventType)}`}>{event.title}</div> )}
                            </div>
                        );})}
                    </div>
                </div>
                
                {/* Leyenda (SIN Actividad Libre) */}
                  <div className="mt-6 flex flex-wrap gap-4 justify-center">
                    <div className="flex items-center"> <div className="w-3 h-3 bg-blue-700 rounded-full mr-1.5"></div> <span className="text-xs text-blue-700">Estándar</span> </div>
                    <div className="flex items-center"> <div className="w-3 h-3 bg-red-700 rounded-full mr-1.5"></div> <span className="text-xs text-red-700">Blitz</span> </div>
                    <div className="flex items-center"> <div className="w-3 h-3 bg-purple-700 rounded-full mr-1.5"></div> <span className="text-xs text-purple-700">Rapid</span> </div>
                    {/* ELIMINADO: <div className="flex items-center"><div className="w-3 h-3 bg-green-700 rounded-full mr-1.5"></div><span className="text-xs text-green-700">Act. Libre</span></div> */}
                  </div>

                {/* Upcoming events list (igual) */}
                <div className="mt-12">
                  <h4 className="text-xl font-semibold mb-4 text-blue-900">Próximos Eventos ({monthName})</h4>
                  <div className="space-y-4">
                    {eventsThisMonth.length > 0 ? (
                      eventsThisMonth.map(event => {
                         if (!(event.date instanceof Date) || isNaN(event.date.getTime())) { return null; } 
                        const eventDate = event.date; 
                        return ( <div key={event.id} className={`flex items-start p-4 bg-white rounded-lg shadow-sm border ${getEventCardBorderClass(event.eventType)} hover:shadow-md transition-shadow cursor-pointer`} onClick={() => { setSelectedEvent(event); setIsPopupOpen(true); }}>
                            {/* Date Box */}
                            <div className={`h-14 w-14 flex-shrink-0 rounded-md ${getCalendarDateBoxClass(event.eventType)} border flex flex-col items-center justify-center mr-4`}> <span className="text-sm font-medium">{eventDate.toLocaleString('es-ES', { month: 'short' })}</span> <span className="text-lg font-bold">{eventDate.getDate()}</span> </div>
                            {/* Event Details */}
                            <div className="flex-1 min-w-0"> <h5 className={`text-base font-semibold mb-1 truncate ${ event.eventType === "blitz" ? "text-red-700" : event.eventType === "rapid" ? "text-purple-700" : event.eventType === "activity" ? "text-green-700" : "text-blue-900" }`}>{event.title}</h5> <p className="text-sm text-blue-700 truncate">{event.time} {event.priceSocios !== 'Gratuito' ? `• Socios: ${event.priceSocios} / No Socios: ${event.priceNoSocios}` : '• Gratuito'}</p> </div>
                          </div> );
                      })
                    ) : ( <div className="text-center py-8 text-blue-400"> <CalendarIcon className="h-10 w-10 mx-auto mb-3 text-blue-300" /> <p>No hay eventos programados para {monthName}</p> </div> )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Event details popup (igual) */}
      <EventPopup event={selectedEvent} isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />

      {/* Pie de página (igual) */}
      <Footer />
    </div>
  );
};

export default Calendar;