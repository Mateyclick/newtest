import { Facebook, Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-france text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sobre el Club */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
                <span className="text-france text-base font-bold">♞</span>
              </div>
              <span className="text-lg font-playfair font-bold text-white tracking-tight">Club Trebejos</span>
            </div>
            <p className="mb-4 text-sm leading-relaxed font-lora">
              Club histórico de ajedrez de Montevideo, promoviendo el juego ciencia en Uruguay desde 1972.
              Organizamos torneos, clases y eventos para todas las edades y niveles.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://www.facebook.com/ClubTrebejosMontevideo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-celeste transition-colors duration-300"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://www.instagram.com/clubdeajedrezlostrebejos/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-celeste transition-colors duration-300"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="https://www.youtube.com/@clubtrebejosmontevideo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-celeste transition-colors duration-300"
                aria-label="YouTube"
              >
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="text-base font-playfair font-bold text-white mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="inline-block py-1 text-sm text-white hover:text-celeste transition-colors duration-300 relative animated-link font-lora">
                  Inicio
                </a>
              </li>
              <li>
                <a href="/historia" className="inline-block py-1 text-sm text-white hover:text-celeste transition-colors duration-300 relative animated-link font-lora">
                  Historia
                </a>
              </li>
              <li>
                <a href="/calendario" className="inline-block py-1 text-sm text-white hover:text-celeste transition-colors duration-300 relative animated-link font-lora">
                  Calendario
                </a>
              </li>
              <li>
                <a href="/resultados" className="inline-block py-1 text-sm text-white hover:text-celeste transition-colors duration-300 relative animated-link font-lora">
                  Resultados
                </a>
              </li>
              <li>
                <a href="/cursos" className="inline-block py-1 text-sm text-white hover:text-celeste transition-colors duration-300 relative animated-link font-lora">
                  Clases
                </a>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-base font-playfair font-bold text-white mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-celeste mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-lora">Andes 1412, Montevideo, Uruguay</span>
              </li>
              <li className="flex items-start">
                <Phone className="h-5 w-5 text-celeste mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-lora">+598 1234 5678</span>
              </li>
              <li className="flex items-start">
                <Mail className="h-5 w-5 text-celeste mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-lora">contacto@clubtrebejos.org.uy</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;