// src/pages/Profile.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext'; // Asegúrate que la ruta a AuthContext sea correcta
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Navbar from '@/components/Navbar'; // Importa Navbar (ajusta la ruta si es necesario)
import Footer from '@/components/Footer';   // Importa Footer (ajusta la ruta o elimínalo si no lo usas aquí)
import { Loader2 } from 'lucide-react'; // Para un indicador de carga
import { Badge } from "@/components/ui/badge"; // Para mostrar el rol de socio
import { format } from 'date-fns'; // Para formatear la fecha de socio_hasta
import { es } from 'date-fns/locale'; // Para formatear la fecha en español (opcional)

export default function Profile() {
  const { user, profile, loading } = useAuth();

  // Descomenta estos logs si necesitas depurar los valores
  // console.log("Página Perfil -> Estado de Carga (loading):", loading);
  // console.log("Página Perfil -> Objeto User (de Supabase Auth):", user);
  // console.log("Página Perfil -> Objeto Profile (de tu tabla 'profiles'):", profile);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-20 md:pt-24">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-xl text-gray-700">Cargando perfil...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/iniciar-sesion" replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-20 md:pt-24">
          <Card className="w-full max-w-md p-6 shadow-lg">
            <CardTitle className="text-2xl mb-4 text-red-600">Perfil no Disponible</CardTitle>
            <CardContent>
              <p className="text-gray-600 mb-2">
                No pudimos cargar la información de tu perfil.
              </p>
              <p className="text-sm text-gray-500">
                Intenta recargar la página. Si el problema persiste, contacta al administrador.
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Preparamos los datos para mostrar, con fallbacks
  const displayName = profile.display_name || (profile.email ? profile.email.split('@')[0] : 'Usuario del Club');
  const email = profile.email || 'Email no disponible';
  const avatarUrl = profile.avatar_url || undefined;
  const avatarFallback = displayName.charAt(0).toUpperCase();
  const esSocio = profile.roles?.socio === true;
  const socioHasta = profile.socio_hasta 
    ? format(new Date(profile.socio_hasta), 'PPP', { locale: es }) 
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 py-8 md:py-12 pt-20 md:pt-24">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 md:p-8">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-white shadow-md">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="text-3xl md:text-4xl bg-gray-300 text-gray-800">
                    {avatarFallback}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl md:text-3xl text-white">
                    {displayName}
                  </CardTitle>
                  <CardDescription className="text-blue-100">{email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Estado de Membresía</h3>
                {esSocio ? (
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1">
                    Socio Activo
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-sm px-3 py-1">No Socio</Badge>
                )}
                {esSocio && socioHasta && (
                  <p className="text-sm text-gray-600 mt-2">Membresía válida hasta: {socioHasta}</p>
                )}
                 {/* Mostrar si es site_admin (opcional, más para depuración o si el admin quiere verlo) */}
                 {profile.roles?.site_admin && (
                  <Badge variant="destructive" className="mt-2 ml-2 text-sm px-3 py-1">Administrador del Sitio</Badge>
                )}
              </div>
              
              {/* Puedes añadir más información o secciones aquí en el futuro */}

            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}