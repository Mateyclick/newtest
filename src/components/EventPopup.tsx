
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChessEvent } from "@/lib/types/events";
import { Clock, User, Wallet } from "lucide-react";

interface EventPopupProps {
  event: ChessEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

const EventPopup = ({ event, isOpen, onClose }: EventPopupProps) => {
  if (!event) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", { 
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  };

  const handleRegister = () => {
    const message = `¡Hola! Quiero registrarme para el torneo:
    
*Evento:* ${event.title}
*Fecha:* ${formatDate(event.date)}
*Hora:* ${event.time}`;

    const whatsappUrl = `https://wa.me/${event.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md glass-effect">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-france">{event.title}</DialogTitle>
          <DialogDescription>
            <div className="text-base text-gray-600">{formatDate(event.date)}</div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-france mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Hora</p>
              <p className="text-gray-600">{event.time}</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <User className="h-5 w-5 text-france mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Precio Socios</p>
              <p className="text-gray-600">{event.priceSocios}</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Wallet className="h-5 w-5 text-france mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Precio No Socios</p>
              <p className="text-gray-600">{event.priceNoSocios}</p>
            </div>
          </div>
          
          {event.description && (
            <div className="pt-2">
              <p className="font-medium">Detalles</p>
              <p className="text-gray-600 mt-1">{event.description}</p>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button onClick={handleRegister} className="w-full sm:w-auto bg-france hover:bg-france/90 hover:scale-[1.02] transition-all duration-300 shadow-btn">
            Registrarse por WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventPopup;
