import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { CalendarIcon, Search } from "lucide-react";
import { toast } from "sonner";
import { Profile } from "@/lib/types/profile";
import { PostgrestError } from '@supabase/supabase-js';

const DIFFICULTY_OPTIONS = ['Fácil', 'Medio', 'Difícil', 'Muy Difícil'] as const;
type DifficultyLevel = typeof DIFFICULTY_OPTIONS[number];

const TURN_OPTIONS = [{value: "w", label: "Blancas"}, {value: "b", label: "Negras"}] as const;
type TurnValue = typeof TURN_OPTIONS[number]['value'];

export default function AdminPage() {
  const { profile } = useAuth();
  const [searchEmail, setSearchEmail] = useState("");
  const [foundUser, setFoundUser] = useState<Profile | null>(null);
  const [socioHastaDate, setSocioHastaDate] = useState<Date | undefined>(undefined);

  const [fen, setFen] = useState("");
  const [solution, setSolution] = useState("");
  const [turn, setTurn] = useState<TurnValue>("w");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("Medio");
  const [description, setDescription] = useState("");
  const [sourcePgn, setSourcePgn] = useState("");
  const [event, setEvent] = useState("");
  const [whitePlayer, setWhitePlayer] = useState("");
  const [blackPlayer, setBlackPlayer] = useState("");
  const [whiteElo, setWhiteElo] = useState("");
  const [blackElo, setBlackElo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchUser = async () => {
    // ... (código de searchUser sin cambios)
    if (!searchEmail.trim()) {
      toast.error("Por favor ingrese un email para buscar.");
      return;
    }
    console.log("Buscando usuario con email:", searchEmail.trim());
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', searchEmail.trim())
      .single();

    if (error || !data) {
      console.error("Error buscando usuario o usuario no encontrado:", error);
      toast.error("Usuario no encontrado o error al buscar.");
      setFoundUser(null);
      setSocioHastaDate(undefined);
      return;
    }
    console.log("Usuario encontrado:", data);
    setFoundUser(data as Profile);
    setSocioHastaDate(data.socio_hasta ? new Date(data.socio_hasta) : undefined);
  };

  const updateMemberStatus = async (isMember: boolean) => {
    // ... (código de updateMemberStatus sin cambios)
    if (!foundUser || !foundUser.id) {
      toast.error("No se ha seleccionado un usuario para actualizar.");
      return;
    }
    console.log(`Actualizando estado de socio para ${foundUser.email} a: ${isMember}, Socio hasta: ${socioHastaDate}`);

    const newSocioHasta = isMember && socioHastaDate ? socioHastaDate.toISOString().split('T')[0] : null;

    const updateData: Partial<Profile> & { roles: { socio: boolean, site_admin?: boolean } } = {
      roles: { ...foundUser.roles, socio: isMember },
      socio_hasta: newSocioHasta
    };
    console.log("Datos a actualizar en profiles:", updateData);

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', foundUser.id);

    if (error) {
      console.error("Error al actualizar estado de socio:", error);
      toast.error(`Error al actualizar: ${error.message}`);
      return;
    }
    toast.success(`Usuario ${foundUser.email} ${isMember ? 'ahora es' : 'ya no es'} socio.`);

    const { data: updatedUserData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', foundUser.id)
        .single();
    if (updatedUserData) {
        setFoundUser(updatedUserData as Profile);
        setSocioHastaDate(updatedUserData.socio_hasta ? new Date(updatedUserData.socio_hasta) : undefined);
    }
  };

  const validateTacticsPuzzle = () => {
    if (!fen.trim()) return "FEN (Posición Inicial) es requerido";
    if (!solution.trim()) return "Solución (en SAN) es requerida";
    if (!turn) return "Turno de Juego es requerido";
    if (!category.trim()) return "Categoría es requerida";
    if (!difficulty) return "Dificultad es requerida";
    return null;
  };

  const saveTacticsPuzzle = async (e: React.FormEvent) => {
    console.log("[DEBUG] saveTacticsPuzzle INICIADO");
    setIsSubmitting(true);
    let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined; // Para almacenar el ID del timeout

    try {
      console.log("[DEBUG] Form submission started (apuntando a tactics_puzzles)");
      e.preventDefault();

      console.log("[DEBUG] Validando datos del puzzle...");
      const validationError = validateTacticsPuzzle();
      if (validationError) {
        console.log("[DEBUG] Validation error:", validationError);
        toast.error(validationError);
        // No necesitamos return aquí porque finally se ejecutará
        throw new Error("Validation Error"); // Lanzar error para que lo capture el catch y ponga isSubmitting false
      }
      console.log("[DEBUG] Validación del puzzle pasada.");

      console.log("[DEBUG] Verificando profile.id...");
      if (!profile?.id) {
        toast.error("Error crítico: No se pudo identificar al usuario admin.");
        console.error("[DEBUG] saveTacticsPuzzle: profile.id es nulo o undefined.");
        throw new Error("Profile ID nulo");
      }
      console.log("[DEBUG] profile.id verificado:", profile.id);

      const sanitizedPuzzleData = {
        fen: fen.trim(),
        solution_moves_san: solution.trim(),
        turn: turn.trim().toLowerCase() as TurnValue,
        category: category.trim(),
        difficulty_level: difficulty,
        description: description?.trim() || null,
        source_game_pgn: sourcePgn?.trim() || null,
        event_name: event?.trim() || null,
        white_player: whitePlayer?.trim() || null,
        black_player: blackPlayer?.trim() || null,
        white_elo: whiteElo.trim() ? parseInt(whiteElo.trim()) : null,
        black_elo: blackElo.trim() ? parseInt(blackElo.trim()) : null,
        created_by_user_id: profile.id,
        is_active: true
      };

      console.log("[DEBUG] Enviando DATOS SANITIZADOS a tactics_puzzles:", sanitizedPuzzleData);

      console.log("[DEBUG] Obteniendo sesión de Supabase (await supabase.auth.getSession())...");
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log("[DEBUG] supabase.auth.getSession() completado.");

      if (sessionError) {
        console.error("[DEBUG] Auth session error:", sessionError);
        toast.error(`Error de sesión de autenticación: ${sessionError.message}`);
        throw sessionError; // Lanzar para que lo capture el catch
      }

      if (!sessionData.session) {
        console.error("[DEBUG] No active session found. Session data:", sessionData);
        toast.error("Error de autenticación. No hay sesión activa. Por favor, inicie sesión nuevamente.");
        throw new Error("No active session");
      }
      console.log("[DEBUG] Sesión de Supabase obtenida correctamente. User ID:", sessionData.session.user.id);

      if (sessionData.session.user.id !== sanitizedPuzzleData.created_by_user_id) {
          console.error("[DEBUG] DISCREPANCIA DE IDs! session.user.id:", sessionData.session.user.id, "vs sanitizedPuzzleData.created_by_user_id:", sanitizedPuzzleData.created_by_user_id);
          toast.error("Error crítico: Discrepancia en IDs de usuario. Contactar soporte.");
          throw new Error("Discrepancia de IDs");
      }
      console.log("[DEBUG] IDs de usuario coinciden. Procediendo a insertar en tactics_puzzles.");

      console.log("[DEBUG] Definiendo insertPromise para tactics_puzzles...");
      const insertPromise = supabase
        .from('tactics_puzzles')
        .insert(sanitizedPuzzleData)
        .select();
      console.log("[DEBUG] insertPromise definida para tactics_puzzles.");

      console.log("[DEBUG] Definiendo timeoutPromise...");
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => { // Guardamos el ID del timeout
          console.warn("[DEBUG] TIMEOUT ALCANZADO para tactics_puzzles después de 10s");
          reject(new Error('La operación tardó demasiado (Timeout 10s)'));
        }, 10000);
      });
      console.log("[DEBUG] timeoutPromise definida. Timeout ID:", timeoutId);

      console.log("[DEBUG] Preparando para ejecutar Promise.race para tactics_puzzles...");
      type InsertResponse = { data: any[] | null; error: PostgrestError | null };

      const result = await Promise.race([
        insertPromise as Promise<InsertResponse>,
        timeoutPromise
      ]);

      // Si llegamos aquí, significa que una de las promesas se resolvió.
      // Si fue insertPromise, limpiamos el timeout. Si fue timeoutPromise, ya rechazó.
      if (timeoutId) {
        clearTimeout(timeoutId);
        console.log("[DEBUG] Timeout limpiado (clearTimeout).");
      }

      console.log("[DEBUG] Promise.race completado. Resultado:", result); // Este log es posterior a la limpieza del timeout si insert ganó

      const { data, error } = result as InsertResponse; // result aquí es el de la promesa que ganó (insert o error de timeout)

      if (error) { // Este error vendría de insertPromise si falló antes del timeout
        console.error("[DEBUG] Error de Supabase en tactics_puzzles (desde insertPromise):", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        toast.error(`Error al guardar el problema: ${error.message}`);
        throw error; // Lanzar para que lo capture el catch general
      }

      if (!data || data.length === 0) {
          console.error("[DEBUG] Supabase no devolvió datos de tactics_puzzles, pero no hubo error explícito. Resultado completo:", result);
          toast.error("Error al guardar: Supabase no confirmó la inserción con datos. Revise RLS y logs de Supabase.");
          throw new Error("No data returned from Supabase insert");
      }

      console.log("[DEBUG] Puzzle guardado exitosamente en tactics_puzzles:", data);
      toast.success("Problema guardado exitosamente");

      setFen("");
      setSolution("");
      setTurn("w");
      setCategory("");
      setDifficulty("Medio");
      setDescription("");
      setSourcePgn("");
      setEvent("");
      setWhitePlayer("");
      setBlackPlayer("");
      setWhiteElo("");
      setBlackElo("");
      console.log("[DEBUG] Campos del formulario reseteados.");

    } catch (error: any) { // Catch general para todos los errores lanzados en el try
      console.error("[DEBUG] ERROR GENERAL EN EL BLOQUE CATCH de saveTacticsPuzzle:", {
        error, // El objeto de error completo
        originalMessage: error?.message,
        name: error?.name,
        stack: error?.stack
      });

      // El toast de error ya se habrá mostrado en los bloques if(error) o if(!profile.id) etc.
      // Si el error es por timeout, Promise.race lo habrá lanzado y aquí lo capturamos.
      // Si no es un error de Toast ya mostrado, mostramos uno genérico.
      if (error?.message && !toast.isActive(error.message)) { // Evitar toasts duplicados si ya se mostraron
         if (error.message.includes("Timeout") || error.message.includes("tardó demasiado")) {
            toast.error(error.message);
         } else if (!["Validation Error", "Profile ID nulo", "No active session", "Discrepancia de IDs"].includes(error.message)) {
            // Solo mostrar toast para errores no manejados explícitamente arriba que ya tienen su propio toast.
            toast.error(`Error inesperado al guardar: ${error?.message || 'Error desconocido'}`);
         }
      } else if (!error?.message) {
         toast.error('Error inesperado al guardar: Error desconocido');
      }
    } finally {
      if (timeoutId) { // Asegurarse de limpiar el timeout en finally si aún existe (ej. si hubo un error antes del Promise.race)
        clearTimeout(timeoutId);
        console.log("[DEBUG] Timeout limpiado en finally (por si acaso).");
      }
      setIsSubmitting(false);
      console.log("[DEBUG] saveTacticsPuzzle BLOQUE FINALLY ejecutado. isSubmitting: false");
    }
  };

  // ... (resto del JSX del componente sin cambios)
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Administración del Sitio</h1>

          <Tabs defaultValue="tactics">
            <TabsList className="mb-8">
              <TabsTrigger value="members">Gestión de Socios</TabsTrigger>
              <TabsTrigger value="tactics">Problemas de Táctica</TabsTrigger>
            </TabsList>

            <TabsContent value="members">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <Input
                    placeholder="Email del usuario"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={searchUser}>
                    <Search className="mr-2 h-4 w-4" />
                    Buscar
                  </Button>
                </div>

                {foundUser && (
                  <div className="space-y-4 p-6 border rounded-lg bg-white shadow-sm">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`socio-switch-${foundUser.id}`}>Estado de Socio</Label>
                      <Switch
                        id={`socio-switch-${foundUser.id}`}
                        checked={foundUser.roles?.socio || false}
                        onCheckedChange={(checked) => updateMemberStatus(checked)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Socio Hasta</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {socioHastaDate ? format(socioHastaDate, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={socioHastaDate}
                            onSelect={setSocioHastaDate}
                            initialFocus
                            disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="tactics">
              <form onSubmit={saveTacticsPuzzle} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fen">FEN (Posición Inicial) *</Label>
                  <Input
                    id="fen"
                    required
                    value={fen}
                    onChange={(e) => setFen(e.target.value)}
                    placeholder="r1bk3r/p2pBpNp/n4n2/1p1NP2P/6P1/3P4/P1P1K3/q5b1 w - - 0 1"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="solution">Solución (en SAN) *</Label>
                  <Textarea
                    id="solution"
                    required
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    placeholder="1.Ne7# o 1.Qg5+ hxg5 2.Nxf6#"
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="turn">Turno de Juego *</Label>
                    <Select required value={turn} onValueChange={(value) => setTurn(value as TurnValue)} disabled={isSubmitting}>
                      <SelectTrigger id="turn">
                        <SelectValue placeholder="Seleccionar turno" />
                      </SelectTrigger>
                      <SelectContent>
                        {TURN_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría *</Label>
                    <Input
                      id="category"
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Ej: Jaque Mate en 2, Sacrificio"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Dificultad *</Label>
                    <Select required value={difficulty} onValueChange={(value) => setDifficulty(value as DifficultyLevel)} disabled={isSubmitting}>
                      <SelectTrigger id="difficulty">
                        <SelectValue placeholder="Seleccionar dificultad" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTY_OPTIONS.map(level => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción (Opcional)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descripción opcional del problema"
                      rows={2}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <h3 className="text-lg font-medium pt-4 border-t mt-6">Datos Extras (Opcional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="sourcePgn">Partida Origen (PGN o enlace)</Label>
                    <Input
                      id="sourcePgn"
                      value={sourcePgn}
                      onChange={(e) => setSourcePgn(e.target.value)}
                      placeholder="PGN o enlace a la partida"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event">Evento</Label>
                    <Input
                      id="event"
                      value={event}
                      onChange={(e) => setEvent(e.target.value)}
                      placeholder="Nombre del torneo o evento"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whitePlayer">Jugador Blancas</Label>
                    <Input
                      id="whitePlayer"
                      value={whitePlayer}
                      onChange={(e) => setWhitePlayer(e.target.value)}
                      placeholder="Nombre del jugador"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="blackPlayer">Jugador Negras</Label>
                    <Input
                      id="blackPlayer"
                      value={blackPlayer}
                      onChange={(e) => setBlackPlayer(e.target.value)}
                      placeholder="Nombre del jugador"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whiteElo">ELO Blancas</Label>
                    <Input
                      id="whiteElo"
                      type="number"
                      value={whiteElo}
                      onChange={(e) => setWhiteElo(e.target.value)}
                      placeholder="Ej: 2400"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="blackElo">ELO Negras</Label>
                    <Input
                      id="blackElo"
                      type="number"
                      value={blackElo}
                      onChange={(e) => setBlackElo(e.target.value)}
                      placeholder="Ej: 2350"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Guardar Problema'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}