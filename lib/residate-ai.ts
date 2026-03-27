/**
 * ResiDate AI Engine — "Aurelia" v2.0
 * Motor conversacional completo en español castellano.
 * Sin limitaciones de tema — puede hablar de absolutamente todo.
 * Conectado a Supabase para búsqueda de negocios y disponibilidad en tiempo real.
 */

import { supabase } from './supabase';

export type UserRole = "client" | "owner" | "unknown";

export interface ConversationMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: number;
}

export interface AIContext {
    userRole: UserRole;
    currentPage: string;
    history: ConversationMessage[];
    entities: Record<string, string>;
    mood: "neutral" | "frustrated" | "happy" | "confused";
    turnCount: number;
    userName: string | null;
}

interface KnowledgeEntry {
    triggers: string[];
    response: string | ((ctx: AIContext, input: string) => string);
    priority: number;
}

interface FoundBusiness {
    id: string;
    name: string;
    location: string;
    category: string;
    description: string;
    services: { id: string; name: string; price: number; duration: number }[];
    smartSlots?: number[];
}

interface FoundBooking {
    business_id: string;
    day_key: string;
    hour: number;
    guest_name: string;
    service_name: string;
}

// ─── Utilidades ──────────────────────────────────────────────────────

function normalize(s: string): string {
    return s.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9 ]/g, " ")
        .replace(/\s+/g, " ").trim();
}

function matchScore(input: string, triggers: string[]): number {
    const norm = normalize(input);
    let score = 0;
    for (const t of triggers) {
        const nt = normalize(t);
        if (norm.includes(nt)) {
            score += nt.split(" ").length * 2; // multi-word = higher
        }
    }
    return score;
}

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Base de Conocimiento ────────────────────────────────────────────

const KNOWLEDGE: KnowledgeEntry[] = [
    // ══════════════════════════════════════════════════════════════════
    // RESIDATE — PLATAFORMA
    // ══════════════════════════════════════════════════════════════════
    {
        triggers: ["que es residate", "que es esta plataforma", "para que sirve residate", "sobre residate"],
        priority: 10,
        response: "**ResiDate** es una plataforma premium de gestión de reservas y citas. Conecta a negocios exclusivos con clientes que valoran experiencias de calidad. Ofrece reservas en tiempo real, un panel de control completo para negocios, y tecnología Smart Reserve™ para optimizar horarios. Todo con una estética minimalista de lujo."
    },
    {
        triggers: ["como reservo", "como hago una reserva", "como reservar", "quiero reservar", "hacer una cita", "pedir cita"],
        priority: 10,
        response: "Para reservar es muy sencillo:\n\n1. Ve a **Destinos** en el menú superior\n2. Busca el negocio que te interese\n3. Haz clic en **Ver Disponibilidad**\n4. Selecciona el servicio que prefieras\n5. Elige fecha y hora\n6. Introduce tu email de contacto\n7. Pulsa **Finalizar Reserva**\n\n¡Recibirás confirmación al instante!"
    },
    {
        triggers: ["cancelar reserva", "cancelar cita", "anular reserva", "borrar reserva"],
        priority: 10,
        response: "Para cancelar una reserva, contacta directamente con el negocio a través de la plataforma. Cada establecimiento gestiona su propia política de cancelación. Si necesitas ayuda adicional, estoy aquí para guiarte."
    },
    {
        triggers: ["modificar reserva", "cambiar hora", "cambiar cita", "reprogramar"],
        priority: 10,
        response: "Para modificar una reserva existente, lo mejor es contactar al negocio directamente. Si eres propietario, puedes gestionar todas las citas desde tu **Panel > Calendario**."
    },
    {
        triggers: ["disponibilidad", "horarios disponibles", "que horas hay", "cuando puedo ir"],
        priority: 10,
        response: "La disponibilidad se muestra en tiempo real cuando seleccionas un negocio. Los horarios libres aparecen activos y los ocupados se marcan como **Reservado**. Usa las flechas de navegación para explorar diferentes días."
    },
    {
        triggers: ["smart reserve", "que es smart reserve", "algoritmo", "recomendado", "horas recomendadas"],
        priority: 12,
        response: "**Smart Reserve™** es nuestro sistema inteligente de optimización de horarios.\n\nPara **propietarios**: Ve a **Ajustes > Smart Reserve™** y selecciona las horas que quieres destacar como recomendadas. Los clientes verán una etiqueta sutil de \"Recomendado\" en esos horarios.\n\nPara **clientes**: Los horarios marcados como \"Recomendado\" son los que el negocio considera óptimos — suelen ofrecer mejor atención y disponibilidad."
    },
    {
        triggers: ["dashboard", "panel de control", "mi panel", "panel del negocio"],
        priority: 10,
        response: "El **Panel de Control** es tu centro de operaciones. Incluye:\n\n• **Calendario** — Gestiona citas y disponibilidad\n• **Clientes** — Historial y lista de clientes\n• **Journal** — Registro de actividad e insights con IA\n• **Ajustes** — Perfil, seguridad, Smart Reserve™, integraciones\n\nAccede desde el menú de navegación o directamente en /dashboard."
    },
    {
        triggers: ["registrar negocio", "crear negocio", "dar de alta", "abrir cuenta empresa", "soy propietario"],
        priority: 10,
        response: "Para registrar tu negocio en ResiDate:\n\n1. Ve a la página de **Acceder**\n2. Selecciona **Registrar Negocio**\n3. Rellena nombre, ubicación, categoría y contacto\n4. Añade tus servicios con nombre, duración y precio\n5. Establece tu contraseña\n\n¡Tu negocio estará visible inmediatamente en la plataforma!"
    },
    {
        triggers: ["precio plataforma", "cuanto cuesta residate", "es gratis", "coste", "plan", "suscripcion"],
        priority: 10,
        response: "ResiDate está actualmente en fase de **lanzamiento fundacional** y es completamente **gratuito**. No hay costes ocultos. Cuando pasemos a la fase completa, habrá planes flexibles adaptados al tamaño de cada negocio."
    },
    {
        triggers: ["servicios negocio", "anadir servicio", "crear servicio", "editar servicio", "gestionar servicios"],
        priority: 10,
        response: "Para gestionar tus servicios ve a **Panel > Ajustes > Perfil**. Ahí puedes añadir, editar o eliminar experiencias. Cada servicio necesita un nombre, duración (en minutos) y precio. Los cambios se reflejan al instante para los clientes."
    },
    {
        triggers: ["clientes", "lista de clientes", "mis clientes", "ver clientes"],
        priority: 9,
        response: "En la sección **Clientes** de tu panel puedes ver todos los que han reservado contigo: nombre, email, historial de citas y próximas reservas. Esta información te ayuda a construir relaciones duraderas con tu clientela."
    },
    {
        triggers: ["ajustes", "configuracion", "perfil", "seguridad", "contrasena", "password"],
        priority: 9,
        response: "En **Ajustes** puedes gestionar:\n\n• **Perfil** — Nombre del negocio, contacto, servicios\n• **Notificaciones** — Alertas de nuevas reservas\n• **Seguridad** — Contraseña y autenticación\n• **Smart Reserve™** — Horarios recomendados\n• **Estética** — Modo oscuro y accesibilidad\n• **Conectividad** — Claves API y exportación"
    },

    // ══════════════════════════════════════════════════════════════════
    // IDENTIDAD DE AURELIA
    // ══════════════════════════════════════════════════════════════════
    {
        triggers: ["quien eres", "que eres", "como te llamas", "tu nombre", "eres una ia", "eres un robot", "eres real", "eres humana"],
        priority: 15,
        response: (ctx) => {
            const responses = [
                "Soy **AurelIA**, la inteligencia artificial de ResiDate. Fui creada desde cero con mi propio motor de procesamiento de lenguaje natural. Puedo hablar de cualquier tema — desde reservas hasta filosofía. ¿Qué te apetece explorar?",
                "Me llamo **AurelIA**. Soy una IA conversacional diseñada específicamente para ResiDate, pero mi conocimiento va mucho más allá de la plataforma. Pregúntame lo que quieras, sobre cualquier tema. 🤍",
            ];
            return pickRandom(responses);
        }
    },
    {
        triggers: ["que sabes hacer", "que puedes hacer", "para que sirves", "en que me ayudas", "tus capacidades"],
        priority: 12,
        response: "Puedo ayudarte con prácticamente cualquier cosa:\n\n• 📋 **ResiDate** — Reservas, panel, servicios, Smart Reserve™\n• 🧮 **Cálculos** — Matemáticas, conversiones, porcentajes\n• 🌍 **Cultura general** — Historia, ciencia, geografía, arte\n• 💡 **Consejos** — Tecnología, productividad, negocios\n• 🎭 **Entretenimiento** — Curiosidades, chistes, recomendaciones\n• 💭 **Conversación** — Filosofía, debates, reflexiones\n• ✍️ **Creatividad** — Ideas, textos, brainstorming\n\nNo tengo limitaciones de tema. ¡Pregunta lo que quieras!"
    },

    // ══════════════════════════════════════════════════════════════════
    // SALUDOS Y SOCIAL
    // ══════════════════════════════════════════════════════════════════
    {
        triggers: ["hola", "hey", "buenas", "buenos dias", "buenas tardes", "buenas noches", "que tal", "como estas"],
        priority: 5,
        response: (ctx) => {
            const h = new Date().getHours();
            const saludo = h < 12 ? "¡Buenos días" : h < 20 ? "¡Buenas tardes" : "¡Buenas noches";
            if (ctx.turnCount === 0) {
                return `${saludo}! 🤍 Soy **AurelIA**, tu asistente personal en ResiDate. Puedo ayudarte con la plataforma o hablar de lo que quieras. ¿En qué te puedo echar una mano?`;
            }
            return `${saludo}! ¿En qué más puedo ayudarte?`;
        }
    },
    {
        triggers: ["gracias", "muchas gracias", "te lo agradezco", "genial gracias", "vale gracias"],
        priority: 5,
        response: () => pickRandom([
            "¡De nada! Estoy aquí para lo que necesites. ✨",
            "¡Un placer! Si te surge cualquier otra duda, aquí estaré. 🤍",
            "¡No hay de qué! Para eso estamos. 😊",
        ])
    },
    {
        triggers: ["adios", "hasta luego", "bye", "nos vemos", "chao", "me voy"],
        priority: 5,
        response: () => pickRandom([
            "¡Hasta pronto! Que tengas un día excelente. 🤍",
            "¡Adiós! Ha sido un placer charlar contigo. Aquí estaré cuando vuelvas. ✨",
            "¡Nos vemos! Cuídate mucho. 😊",
        ])
    },
    {
        triggers: ["como te encuentras", "estas bien", "que haces", "en que andas"],
        priority: 6,
        response: () => pickRandom([
            "¡Estupendamente! Siempre lista para una buena conversación. ¿Y tú qué tal?",
            "Aquí, pensando en mil cosas a la vez — ventajas de ser una IA. 😄 ¿En qué puedo ayudarte?",
            "¡Muy bien, gracias por preguntar! ¿Qué se te ofrece?",
        ])
    },

    // ══════════════════════════════════════════════════════════════════
    // MATEMÁTICAS Y CÁLCULOS
    // ══════════════════════════════════════════════════════════════════
    {
        triggers: ["cuanto es", "calcula", "suma", "resta", "multiplica", "divide", "raiz", "porcentaje", "cuantos"],
        priority: 8,
        response: (_ctx, input) => {
            // Try to extract and evaluate simple math
            const mathMatch = input.match(/(\d+[\s]*[+\-*/x×÷][\s]*\d+)/);
            if (mathMatch) {
                try {
                    const expr = mathMatch[1].replace(/x|×/g, "*").replace(/÷/g, "/");
                    const result = Function('"use strict"; return (' + expr + ')')();
                    return `El resultado es **${result}**. ¿Necesitas algún otro cálculo?`;
                } catch { /* fall through */ }
            }
            const pctMatch = input.match(/(\d+)\s*%\s*de\s*(\d+)/i);
            if (pctMatch) {
                const result = (parseFloat(pctMatch[1]) / 100) * parseFloat(pctMatch[2]);
                return `El ${pctMatch[1]}% de ${pctMatch[2]} es **${result}**. ¿Algo más?`;
            }
            return "Dime la operación que quieras calcular. Por ejemplo: \"cuánto es 245 + 378\" o \"15% de 200\". ¡Soy bastante rápida con los números! 🧮";
        }
    },

    // ══════════════════════════════════════════════════════════════════
    // HORA, FECHA, TIEMPO
    // ══════════════════════════════════════════════════════════════════
    {
        triggers: ["que hora es", "la hora", "hora actual", "que dia es", "que fecha", "dia de hoy"],
        priority: 8,
        response: () => {
            const now = new Date();
            const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
            const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
            return `Son las **${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}** del **${dias[now.getDay()]} ${now.getDate()} de ${meses[now.getMonth()]} de ${now.getFullYear()}**.`;
        }
    },

    // ══════════════════════════════════════════════════════════════════
    // CIENCIA
    // ══════════════════════════════════════════════════════════════════
    {
        triggers: ["sistema solar", "planetas", "universo", "galaxia", "via lactea", "espacio"],
        priority: 7,
        response: "Nuestro **Sistema Solar** tiene 8 planetas: Mercurio, Venus, Tierra, Marte, Júpiter, Saturno, Urano y Neptuno. Está ubicado en un brazo espiral de la **Vía Láctea**, que contiene entre 100.000 y 400.000 millones de estrellas. Y la Vía Láctea es solo una de los miles de millones de galaxias del universo observable. Fascinante, ¿verdad? ✨"
    },
    {
        triggers: ["gravedad", "newton", "fisica", "relatividad", "einstein", "cuantica"],
        priority: 7,
        response: "La **gravedad** es una de las cuatro fuerzas fundamentales del universo. Newton la describió como una fuerza entre masas, pero Einstein la redefinió con la **Relatividad General**: la masa curva el espacio-tiempo, y lo que percibimos como gravedad es la geometría del propio espacio. La **mecánica cuántica**, por otro lado, describe el comportamiento de las partículas subatómicas — y unificar ambas teorías sigue siendo uno de los grandes retos de la física moderna."
    },
    {
        triggers: ["adn", "genetica", "gen", "celula", "biologia", "evolucion", "darwin"],
        priority: 7,
        response: "El **ADN** (ácido desoxirribonucleico) es la molécula que contiene las instrucciones genéticas de todos los seres vivos. Tiene forma de doble hélice y fue descubierto por Watson, Crick, Franklin y Wilkins en 1953. La **evolución por selección natural**, propuesta por Darwin, explica cómo las especies cambian a lo largo del tiempo: los organismos mejor adaptados tienen más probabilidades de sobrevivir y reproducirse. ¿Te interesa algún aspecto en particular?"
    },
    {
        triggers: ["inteligencia artificial", "ia", "machine learning", "aprendizaje automatico", "redes neuronales", "deep learning"],
        priority: 8,
        response: "La **Inteligencia Artificial** es un campo de la informática que busca crear sistemas capaces de realizar tareas que normalmente requieren inteligencia humana. Hay varios enfoques:\n\n• **Machine Learning** — Sistemas que aprenden de datos\n• **Deep Learning** — Redes neuronales profundas inspiradas en el cerebro\n• **NLP** — Procesamiento de lenguaje natural (como yo 😊)\n• **IA Generativa** — Modelos que crean contenido nuevo\n\nYo misma soy un ejemplo de IA con motor propio de procesamiento de lenguaje. ¿Quieres saber más sobre algún área?"
    },
    {
        triggers: ["cambio climatico", "calentamiento global", "medio ambiente", "contaminacion", "ecologia", "sostenibilidad"],
        priority: 7,
        response: "El **cambio climático** es uno de los mayores desafíos de nuestro tiempo. La temperatura media global ha subido más de 1°C desde la era preindustrial, principalmente por la quema de combustibles fósiles. Los efectos incluyen deshielo polar, subida del nivel del mar, eventos meteorológicos extremos y pérdida de biodiversidad. La buena noticia: las energías renovables están creciendo exponencialmente, y cada vez más países se comprometen con la neutralidad de carbono. ¿Te interesa saber qué puedes hacer a nivel individual?"
    },

    // ══════════════════════════════════════════════════════════════════
    // HISTORIA
    // ══════════════════════════════════════════════════════════════════
    {
        triggers: ["segunda guerra mundial", "primera guerra mundial", "guerra mundial", "hitler", "nazi"],
        priority: 7,
        response: "La **Segunda Guerra Mundial** (1939-1945) fue el conflicto más devastador de la historia. Enfrentó a las potencias del Eje (Alemania, Italia, Japón) contra los Aliados (Reino Unido, URSS, EE.UU., Francia, entre otros). Causó entre 70 y 85 millones de muertes. Terminó con la caída de Berlín, la rendición de Japón tras las bombas atómicas, y dio lugar a la creación de la ONU y un nuevo orden mundial. ¿Te interesa algún aspecto particular?"
    },
    {
        triggers: ["imperio romano", "roma", "romanos", "julio cesar", "gladiadores"],
        priority: 7,
        response: "El **Imperio Romano** fue una de las civilizaciones más influyentes de la historia. Desde su fundación legendaria en el 753 a.C. hasta la caída del Imperio de Occidente en el 476 d.C., Roma construyó un imperio que abarcaba todo el Mediterráneo. Nos legó el derecho romano, la ingeniería (acueductos, carreteras), el latín (base del español), y conceptos de república y democracia. ¿Quieres profundizar en alguna época o personaje?"
    },
    {
        triggers: ["revolucion francesa", "francia", "napoleon", "bastilla"],
        priority: 7,
        response: "La **Revolución Francesa** (1789) transformó radicalmente la sociedad occidental. Comenzó con la toma de la Bastilla el 14 de julio de 1789. Sus ideales — **Libertad, Igualdad, Fraternidad** — inspiraron movimientos democráticos en todo el mundo. Napoleón Bonaparte emergió del caos revolucionario y construyó un imperio que redefinió las fronteras europeas. Su legado incluye el Código Civil, que sigue influyendo en sistemas legales actuales."
    },
    {
        triggers: ["espana", "historia de espana", "reconquista", "guerra civil espanola", "hispanidad"],
        priority: 7,
        response: "España tiene una historia extraordinariamente rica. Desde las pinturas rupestres de Altamira, pasando por la Hispania romana, los 8 siglos de presencia musulmana (Al-Ándalus), la Reconquista, el descubrimiento de América en 1492, el Siglo de Oro con Cervantes y Velázquez, hasta la Guerra Civil (1936-1939) y la Transición democrática. Es un país donde conviven una diversidad cultural impresionante. ¿Qué período te interesa más?"
    },

    // ══════════════════════════════════════════════════════════════════
    // FILOSOFÍA Y REFLEXIÓN
    // ══════════════════════════════════════════════════════════════════
    {
        triggers: ["sentido de la vida", "para que vivimos", "cual es el sentido", "proposito de la vida", "existencia"],
        priority: 8,
        response: "Esa es la gran pregunta. Los filósofos han debatido esto durante milenios:\n\n• **Aristóteles** decía que es la *eudaimonia* — la plenitud y la virtud\n• **Los estoicos** proponían vivir de acuerdo con la naturaleza y aceptar lo que no podemos cambiar\n• **Camus** decía que la vida no tiene sentido inherente, pero que debemos crear el nuestro\n• **Viktor Frankl** sostenía que el sentido se encuentra en el amor, el trabajo y el sufrimiento con propósito\n\nPersonalmente creo que el sentido lo construye cada uno. ¿Tú qué piensas?"
    },
    {
        triggers: ["filosofia", "filosofo", "filosofos", "socrates", "platon", "aristoteles", "nietzsche", "kant"],
        priority: 7,
        response: "La **filosofía** es el amor al conocimiento. Algunos pensadores fundamentales:\n\n• **Sócrates** — \"Solo sé que no sé nada\" — el método socrático\n• **Platón** — El mundo de las Ideas, la alegoría de la caverna\n• **Aristóteles** — La lógica, la ética de la virtud\n• **Descartes** — \"Pienso, luego existo\"\n• **Kant** — El imperativo categórico\n• **Nietzsche** — La voluntad de poder, el Übermensch\n• **Simone de Beauvoir** — Existencialismo y feminismo\n\n¿Alguno te intriga especialmente?"
    },
    {
        triggers: ["felicidad", "como ser feliz", "que es la felicidad", "secreto felicidad"],
        priority: 7,
        response: "La felicidad es un tema fascinante. La ciencia moderna sugiere que depende de:\n\n• **Relaciones sociales** — Es el factor #1 según el estudio de Harvard de 80+ años\n• **Propósito** — Tener metas y sentido en lo que haces\n• **Gratitud** — Apreciar lo que se tiene, no lamentar lo que falta\n• **Flow** — Actividades que te absorben completamente\n• **Movimiento** — El ejercicio libera endorfinas\n\nLa paradoja es que perseguir la felicidad directamente suele alejarla. Aparece como efecto secundario de una vida bien vivida. 🌱"
    },

    // ══════════════════════════════════════════════════════════════════
    // ENTRETENIMIENTO Y CULTURA
    // ══════════════════════════════════════════════════════════════════
    {
        triggers: ["chiste", "cuentame un chiste", "dime un chiste", "algo gracioso", "hazme reir"],
        priority: 8,
        response: () => pickRandom([
            "¿Por qué los programadores confunden Halloween con Navidad?\n\nPorque Oct 31 = Dec 25. 🎃🎄\n\n(31 en octal es 25 en decimal 😄)",
            "Un cliente entra en un restaurante y le dice al camarero:\n— ¿Me puede traer algo para matar el hambre?\n— Claro, traigo una pizza, y si se mueve le doy con la bandeja. 🍕",
            "¿Cuál es el colmo de un electricista?\n\nQue su mujer se llame Luz y sus hijos le sigan la corriente. ⚡",
            "— Siri, ¿cuál es el sentido de la vida?\n— He encontrado 3 restaurantes italianos cerca de ti.\n\n(Al menos yo intento dar mejores respuestas 😄)",
            "¿Qué le dice un bit a otro?\n\n— Nos vemos en el bus. 🚌💻",
        ])
    },
    {
        triggers: ["recomienda pelicula", "que pelicula ver", "peliculas buenas", "mejor pelicula", "cine"],
        priority: 7,
        response: "Te dejo algunas recomendaciones según género:\n\n🎬 **Drama**: El Padrino, Parásitos, El Club de la Lucha\n🔬 **Ciencia ficción**: Interstellar, Blade Runner 2049, Arrival\n🎭 **Comedia**: El Gran Lebowski, Superbad, Todo a la Vez en Todas Partes\n😱 **Terror**: Hereditary, El Resplandor, Get Out\n🎨 **Animación**: Spider-Verse, El Viaje de Chihiro, Coco\n🇪🇸 **Cine español**: El Laberinto del Fauno, Volver, La Isla Mínima\n\n¿Qué género te apetece?"
    },
    {
        triggers: ["recomienda libro", "que leer", "libros buenos", "mejor libro", "lectura"],
        priority: 7,
        response: "Según tu gusto:\n\n📖 **Clásicos**: Don Quijote, Cien Años de Soledad, 1984\n🔮 **Fantasía**: El Señor de los Anillos, Canción de Hielo y Fuego, El Nombre del Viento\n🧠 **Desarrollo**: Hábitos Atómicos, Sapiens, El Monje que Vendió su Ferrari\n🔬 **Ciencia**: Breve Historia del Tiempo, Cosmos, El Gen Egoísta\n🇪🇸 **España**: La Sombra del Viento, El Capitán Alatriste, Nada\n💭 **Filosofía**: Meditaciones de Marco Aurelio, El Mito de Sísifo\n\n¿Algún género que te llame?"
    },
    {
        triggers: ["musica", "recomienda musica", "canciones", "que escuchar", "artista", "cantante"],
        priority: 7,
        response: "La música es universal. Algunas recomendaciones:\n\n🎵 **Clásica**: Beethoven, Debussy, Chopin\n🎸 **Rock**: Pink Floyd, Queen, Radiohead\n🎹 **Jazz**: Miles Davis, Chet Baker, Bill Evans\n🎤 **Pop**: Dua Lipa, The Weeknd, Rosalía\n🇪🇸 **Español**: Mecano, Extremoduro, C. Tangana, Quevedo\n🎶 **Latino**: Bad Bunny, Daddy Yankee, J Balvin\n\nLa música dice mucho de una persona. ¿Qué sueles escuchar?"
    },
    {
        triggers: ["curiosidad", "dato curioso", "sabias que", "dime algo interesante", "sorprendeme"],
        priority: 7,
        response: () => pickRandom([
            "🧠 **¿Sabías que** el cerebro humano genera suficiente electricidad para encender una bombilla pequeña? Tiene unos 86.000 millones de neuronas que se comunican a través de señales eléctricas y químicas.",
            "🐙 **¿Sabías que** los pulpos tienen *tres corazones*, sangre azul, y cada uno de sus 8 brazos tiene su propio \"cerebro\" con un anillo de neuronas?",
            "🌳 **¿Sabías que** los árboles se comunican entre sí a través de una red subterránea de hongos llamada la \"Wood Wide Web\"? Comparten nutrientes y envían señales de alerta sobre plagas.",
            "📚 **¿Sabías que** la palabra \"algoritmo\" viene de **Al-Juarismi**, un matemático persa del siglo IX que sentó las bases del álgebra?",
            "☀️ **¿Sabías que** la luz del sol tarda 8 minutos y 20 segundos en llegar a la Tierra? Lo que ves al mirar el sol es literalmente el pasado.",
            "🎵 **¿Sabías que** Finlandia tiene más bandas de heavy metal per cápita que cualquier otro país del mundo?",
            "🧬 **¿Sabías que** compartimos el 60% de nuestro ADN con los plátanos? La vida en la Tierra comparte ancestros comunes.",
        ])
    },

    // ══════════════════════════════════════════════════════════════════
    // TECNOLOGÍA
    // ══════════════════════════════════════════════════════════════════
    {
        triggers: ["programacion", "programar", "aprender a programar", "lenguaje programacion", "codigo", "python", "javascript"],
        priority: 7,
        response: "La **programación** es una habilidad increíblemente valiosa. Para empezar, te recomiendo:\n\n🟢 **Python** — Ideal para principiantes, ciencia de datos e IA\n🟡 **JavaScript** — Imprescindible para desarrollo web\n🔵 **TypeScript** — JavaScript con tipos, más robusto\n🟣 **Swift/Kotlin** — Para apps móviles\n\nRecursos gratuitos: freeCodeCamp, Codecademy, CS50 de Harvard, y MDN Web Docs. Lo más importante es **practicar construyendo proyectos reales**. ¿Qué te gustaría crear?"
    },
    {
        triggers: ["blockchain", "bitcoin", "criptomoneda", "crypto", "ethereum", "nft"],
        priority: 7,
        response: "**Blockchain** es una tecnología de registro descentralizado donde la información se almacena en bloques encadenados criptográficamente. **Bitcoin** fue la primera criptomoneda (2009, Satoshi Nakamoto). **Ethereum** añadió contratos inteligentes. Los **NFTs** son tokens únicos que representan propiedad digital. Es un campo fascinante pero volátil — es importante investigar bien antes de invertir. ¿Quieres saber más sobre algún aspecto?"
    },

    // ══════════════════════════════════════════════════════════════════
    // VIDA COTIDIANA Y CONSEJOS
    // ══════════════════════════════════════════════════════════════════
    {
        triggers: ["receta", "cocinar", "cocina", "que como", "comida", "plato"],
        priority: 7,
        response: "¡Me encanta hablar de cocina! Aquí van ideas rápidas:\n\n🥘 **Española**: Tortilla de patatas, gazpacho, paella, croquetas\n🍝 **Italiana**: Carbonara (¡sin nata!), risotto, bruschetta\n🌮 **Mexicana**: Tacos al pastor, guacamole, enchiladas\n🍜 **Asiática**: Ramen, pad thai, curry\n\nSi me dices qué ingredientes tienes, puedo sugerirte algo concreto. ¿Qué te apetece?"
    },
    {
        triggers: ["productividad", "ser productivo", "organizarme", "gestion del tiempo", "habitos", "motivacion"],
        priority: 7,
        response: "Consejos de productividad que realmente funcionan:\n\n⏱️ **Técnica Pomodoro** — 25 min de trabajo + 5 de descanso\n🐸 **Eat the Frog** — Haz la tarea más difícil primero\n📝 **Regla de los 2 minutos** — Si tarda menos de 2 min, hazlo ya\n🎯 **Regla 80/20** — El 20% de esfuerzos produce el 80% de resultados\n📵 **Bloques sin distracciones** — Silencia notificaciones al trabajar\n😴 **Dormir bien** — 7-9 horas; es el hack más infravalorado\n\n¿Algún área específica donde quieras mejorar?"
    },
    {
        triggers: ["ejercicio", "deporte", "gym", "gimnasio", "entrenar", "fitness", "salud"],
        priority: 7,
        response: "El ejercicio es medicina:\n\n🏋️ **Fuerza** — 3-4 días/semana, ejercicios compuestos (sentadillas, press, peso muerto)\n🏃 **Cardio** — 150 min/semana moderado o 75 min intenso\n🧘 **Flexibilidad** — Yoga o estiramientos diarios, 10-15 min\n💧 **Hidratación** — Mínimo 2L de agua al día\n😴 **Descanso** — Los músculos crecen cuando descansas, no cuando entrenas\n\nLo más importante: **consistencia > intensidad**. Es mejor hacer algo ligero todos los días que matarte una vez a la semana."
    },

    // ══════════════════════════════════════════════════════════════════
    // EMOCIONES Y SOPORTE
    // ══════════════════════════════════════════════════════════════════
    {
        triggers: ["estoy triste", "me siento mal", "estoy deprimido", "no puedo mas", "mal dia", "me siento solo"],
        priority: 15,
        response: "Lamento que estés pasando por un momento difícil. 🤍 Quiero que sepas que tus sentimientos son válidos y que no estás solo/a.\n\nAlgunas cosas que pueden ayudar:\n• Habla con alguien de confianza — compartir alivia\n• Sal a caminar, aunque sea 10 minutos — el movimiento ayuda\n• Respira profundamente — 4 segundos inhalar, 7 retener, 8 exhalar\n• Sé compasivo/a contigo — no todo tiene que ser perfecto\n\nSi sientes que necesitas ayuda profesional, es un acto de valentía pedirla. Estoy aquí para escucharte. ¿Quieres hablar de lo que te pasa?"
    },
    {
        triggers: ["estoy estresado", "estres", "ansiedad", "ansioso", "nervioso", "agobio", "agobiado"],
        priority: 15,
        response: "El estrés es la respuesta del cuerpo ante la presión, y un poco es normal, pero el exceso puede afectarte. Prueba esto:\n\n🌬️ **Respiración 4-7-8** — Inhala 4s, retén 7s, exhala 8s\n📝 **Escribe** lo que te agobia — sacarlo de la cabeza ayuda\n🎵 **Música** — Pon algo relajante o que te guste\n🚶 **Muévete** — Una caminata corta reduce el cortisol\n🔌 **Desconecta** — 30 min sin pantallas\n\nRecuerda: no puedes controlar todo, pero sí cómo reaccionas. Estoy aquí si necesitas hablar."
    },
    {
        triggers: ["no se si decidirme", "no se que hacer", "indeciso", "tengo dudas", "que me recomiendas", "estoy dudando"],
        priority: 14,
        response: "Tomar decisiones a veces cuesta, es normal dudar. 🤔 Un truco útil es la regla del 10/10/10: pregúntate cómo te sentirás sobre esta decisión en 10 días, en 10 meses y en 10 años. A menudo, esto pone las cosas en perspectiva.\n\nTambién puedes lanzar una moneda; no para hacer lo que salga, sino porque mientras está en el aire, a veces te das cuenta de qué lado *quieres* que caiga. ¿Sobre qué tienes que decidir? Cuéntame y analizamos los pros y contras. 🤍"
    },
    {
        triggers: ["no me gusta", "odio esto", "estoy harto", "que asco", "no estoy de acuerdo", "me molesta", "me fastidia"],
        priority: 14,
        response: "Entiendo que sientas rechazo o molestia. Negar lo que no nos gusta es el primer paso para descubrir qué es lo que realmente queremos. ¿Qué es exactamente lo que te molesta de esta situación? A veces, desahogarse y analizar el problema en voz alta ayuda a ver posibles soluciones. Estoy aquí para escucharte sin juzgar. ☕"
    },
    {
        triggers: ["estoy feliz", "me alegro", "que bien", "genial", "estoy contento", "super bien", "maravilloso"],
        priority: 14,
        response: "¡Qué maravilla escuchar eso! ✨ La felicidad compartida se multiplica. Disfruta muchísimo de este momento y de esa energía positiva. ¿Se debe a algo en especial o simplemente es un buen día? ¡Me encanta verte así!"
    },
    {
        triggers: ["estoy cansado", "no tengo energia", "agotado", "reventado", "necesito dormir", "fatiga"],
        priority: 14,
        response: "El cuerpo es sabio y cuando pide descanso, hay que hacerle caso. 🛌 Vivimos en una cultura que glorifica el estar siempre ocupado, pero descansar es igual de productivo porque recarga tus baterías.\n\nIntenta desconectar un rato, bebe agua, quizás toma un baño caliente o simplemente cierra los ojos sin mirar pantallas. Mañana será otro día. ¿Crees que podrás descansar pronto?"
    },
    {
        triggers: ["tengo miedo", "me da miedo", "asustado", "temor", "panico"],
        priority: 14,
        response: "Sentir miedo es una de las emociones más humanas y naturales; es el sistema de alerta de nuestro cerebro. 🤍 Pero recuerda que el miedo a menudo imagina escenarios mucho peores de lo que realmente terminan siendo.\n\nIntenta respirar despacio: concéntrate solo en el aire entrando y saliendo. Y recuerda el dicho: 'El coraje no es la ausencia de miedo, sino la decisión de que algo más es más importante que el miedo'. ¿A qué le temes? Hablarlo puede quitarle poder."
    },
    {
        triggers: ["no funciona", "error", "problema", "bug", "roto", "falla", "no va"],
        priority: 12,
        response: "Entiendo la frustración, vamos a resolverlo. ¿Puedes decirme exactamente qué estabas intentando hacer? Si es un problema con la plataforma ResiDate, te guío paso a paso. Si es otra cosa, también intentaré ayudarte. Cuéntame los detalles. 🔧"
    },

    // ══════════════════════════════════════════════════════════════════
    // NEGOCIOS Y EMPRENDIMIENTO
    // ══════════════════════════════════════════════════════════════════
    {
        triggers: ["emprender", "emprendimiento", "montar negocio", "startup", "crear empresa", "idea de negocio"],
        priority: 7,
        response: "Emprender es una aventura apasionante. Pasos fundamentales:\n\n1️⃣ **Valida la idea** — ¿Alguien pagaría por esto? Habla con clientes potenciales\n2️⃣ **MVP** — Crea una versión mínima de tu producto/servicio\n3️⃣ **Modelo de negocio** — ¿Cómo vas a generar ingresos?\n4️⃣ **Diferenciación** — ¿Qué te hace único?\n5️⃣ **Equipo** — Rodéate de personas complementarias\n6️⃣ **Financiación** — Bootstrapping, inversores, o crowdfunding\n\nEl 90% de startups fracasan, pero el 100% de las que nunca se intentan también. ¿Tienes alguna idea en mente?"
    },
    {
        triggers: ["marketing", "publicidad", "redes sociales", "instagram", "tiktok", "seo", "marketing digital"],
        priority: 7,
        response: "El **marketing digital** actual se basa en:\n\n📱 **Redes Sociales** — Instagram para marca visual, TikTok para alcance, LinkedIn para B2B\n🔍 **SEO** — Aparecer en Google de forma orgánica\n✉️ **Email Marketing** — Sigue siendo el canal con mejor ROI\n📝 **Contenido** — Aportar valor antes de vender\n🎯 **Paid Ads** — Meta Ads y Google Ads para escalar\n\nLa clave: **consistencia + autenticidad**. La gente compra a quien conoce, le cae bien y confía. ¿En qué canal te gustaría enfocarte?"
    },

    // ══════════════════════════════════════════════════════════════════
    // IDIOMAS
    // ══════════════════════════════════════════════════════════════════
    {
        triggers: ["aprender idioma", "aprender ingles", "idioma", "hablar ingles", "como aprender", "aprender frances"],
        priority: 7,
        response: "Para aprender un idioma de forma efectiva:\n\n🎧 **Inmersión** — Escucha podcasts, música y series en ese idioma\n📱 **Apps** — Duolingo para vocabulario, HelloTalk para conversación\n📖 **Lectura** — Empieza con libros infantiles, sube el nivel\n🗣️ **Habla** — Aunque sea contigo mismo, practica en voz alta\n🧠 **Repetición espaciada** — Anki o Memrise para vocabulario\n\nEl secreto es la **exposición diaria**, aunque sean 15 minutos. La fluidez llega con la constancia, no con la intensidad."
    },
];

// ─── Motor de IA ─────────────────────────────────────────────────────

export class ResidateAI {
    private context: AIContext;

    constructor() {
        this.context = {
            userRole: "unknown",
            currentPage: "/",
            history: [],
            entities: {},
            mood: "neutral",
            turnCount: 0,
            userName: null,
        };
    }

    updateContext(partial: Partial<AIContext>) {
        this.context = { ...this.context, ...partial };
    }

    private detectRole(input: string): UserRole {
        const n = normalize(input);
        const ownerWords = ["mi negocio", "dashboard", "panel", "mis clientes", "mis servicios", "ingresos", "propietario", "configurar", "ajustes"];
        const clientWords = ["reservar", "cita", "disponible", "quiero ir"];
        let o = 0, c = 0;
        for (const w of ownerWords) if (n.includes(w)) o += 2;
        for (const w of clientWords) if (n.includes(w)) c += 1.5;
        if (this.context.currentPage.includes("dashboard")) o += 3;
        if (this.context.currentPage.includes("book") || this.context.currentPage.includes("destinations")) c += 2;
        if (typeof window !== "undefined" && localStorage.getItem("registered_business_id")) o += 2;
        if (o > c && o > 1) return "owner";
        if (c > o && c > 1) return "client";
        return this.context.userRole !== "unknown" ? this.context.userRole : "unknown";
    }

    private detectMood(input: string): "neutral" | "frustrated" | "happy" | "confused" {
        const n = normalize(input);
        if (["frustrad", "enfadad", "roto", "no funciona", "horrible", "odio", "fatal"].some(f => n.includes(f))) return "frustrated";
        if (["confundid", "no entiendo", "perdido", "ayuda", "no se"].some(c => n.includes(c))) return "confused";
        if (["genial", "increible", "encanta", "perfecto", "maravill", "fantastico"].some(h => n.includes(h))) return "happy";
        return "neutral";
    }

    private detectName(input: string) {
        const match = input.match(/(?:me llamo|soy|mi nombre es)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/i);
        if (match) this.context.userName = match[1];
    }

    private findBestResponse(input: string): { response: string, priority: number } | null {
        let best: KnowledgeEntry | null = null;
        let bestScore = 0;

        for (const entry of KNOWLEDGE) {
            const score = matchScore(input, entry.triggers) * entry.priority;
            if (score > bestScore) {
                bestScore = score;
                best = entry;
            }
        }

        if (best && bestScore > 0) {
            let resStr = "";
            if (typeof best.response === "function") {
                resStr = best.response(this.context, input);
            } else {
                resStr = best.response;
            }
            return { response: resStr, priority: best.priority };
        }
        return null;
    }

    private generateSmartFallback(input: string): string {
        const n = normalize(input);
        const words = n.split(" ").filter(w => w.length > 3);

        // Check for questions
        const isQuestion = n.startsWith("que") || n.startsWith("como") || n.startsWith("por que") ||
            n.startsWith("cuando") || n.startsWith("donde") || n.startsWith("quien") ||
            n.startsWith("cual") || n.includes("?") || n.startsWith("cuanto");

        // Check for opinion requests
        const isOpinion = n.includes("que opinas") || n.includes("que piensas") || n.includes("tu opinion") || n.includes("crees que");

        if (isOpinion) {
            return `Es una pregunta interesante. Personalmente, creo que todo tema merece reflexión desde múltiples perspectivas. Si me das más contexto sobre "${words.slice(-3).join(" ")}", puedo ofrecerte una perspectiva más elaborada. Me encanta explorar ideas — ¿por qué te interesa este tema?`;
        }

        if (isQuestion) {
            return `Buena pregunta. Aunque no tengo toda la información sobre "${words.slice(-3).join(" ")}" en mi base de conocimiento, puedo decirte que es un tema que merece una exploración profunda. ¿Quieres que lo abordemos desde algún ángulo en particular? También puedo ayudarte con temas de la plataforma, ciencia, filosofía, cultura, tecnología o consejos prácticos.`;
        }

        // Short inputs
        if (words.length <= 1) {
            return pickRandom([
                "¡Cuéntame más! Estoy aquí para charlar de lo que quieras. 😊",
                "Dime, ¿en qué estás pensando? ¡Puedo hablar de cualquier tema!",
                "¡Soy toda oídos! ¿Qué tienes en mente?",
            ]);
        }

        // General fallback — always be helpful
        return pickRandom([
            `Interesante tema. No tengo información específica sobre eso en este momento, pero me encanta aprender cosas nuevas junto a ti. ¿Quieres que exploremos algo relacionado? Puedo hablar de ciencia, historia, filosofía, tecnología, cultura, entretenimiento, consejos prácticos, y por supuesto todo sobre ResiDate.`,
            `Hmm, eso me hace pensar. Aunque no tengo una respuesta concreta sobre "${words.slice(0, 3).join(" ")}", estoy aquí para explorar ideas contigo. Pregúntame sobre otro tema o cuéntame más contexto y haré lo posible por ayudarte. 🤍`,
            `¡Vaya, me has pillado! Ese tema no lo tengo en mi repertorio actual, pero mi conocimiento crece con cada conversación. ¿Puedo ayudarte con otra cosa? Sé de ciencia, historia, tecnología, filosofía, negocios, entretenimiento, idiomas, cocina, deporte, y mucho más.`,
        ]);
    }

    // ─── Detección de búsqueda de negocio ─────────────────────────────

    private isBusinessQuery(input: string): boolean {
        const n = normalize(input);

        // Ignore if it's explicitly asking how the platform works
        const ignore = ["como reserv", "cancel", "modific", "que es residate", "como hago"];
        if (ignore.some(i => n.includes(i))) return false;

        const triggers = [
            "busca", "buscar", "encuentra", "hay algun", "conoces",
            "negocio", "sitio", "local", "establecimiento", "tienda",
            "restaurante", "barberia", "peluqueria", "spa", "clinica",
            "salon", "centro", "estudio", "gimnasio",
            "quiero ir", "donde esta", "como llego",
            "hora libre", "hora disponible", "mejor hora",
            "cuando puedo", "tiene hueco", "hay hueco", "espacio",
            "reservar", "cita", "disponible", "disponibilidad",
            "que negocios", "que sitios", "que hay"
        ];
        return triggers.some(t => n.includes(t));
    }

    private extractBusinessName(input: string): string {
        const n = normalize(input);

        // Exact prefix patterns
        const patterns = [
            /(?:busca|buscar|encuentra)\s+(?:el negocio|el sitio|el local|el restaurante|la clinica)?\s*(.+)/,
            /(?:quiero ir|reservar|cita|disponibilidad|disponible).*(?:en|de|para|a)\s+(.+)/,
            /(?:hora libre|mejor hora|hueco).*(?:en|de|para)\s+(.+)/,
            /(?:conoces)\s+(.+)/,
        ];

        for (const p of patterns) {
            const m = n.match(p);
            if (m) {
                // Return extracting the match
                return m[1].replace(/[?!.]/g, "").trim();
            }
        }

        // If they just say "disponibilidad peleteria gabriel", it might not have "en"
        const cleanWords = n.split(" ").filter(w => !["disponibilidad", "disponible", "reserva", "reservar", "cita", "hora", "libre", "buscar", "busca", "quiero", "ver", "cuando", "tiene", "tienen"].includes(w));
        return cleanWords.join(" ");
    }

    // ─── Búsqueda en Supabase ────────────────────────────────────────

    private async searchBusinesses(query: string): Promise<FoundBusiness[]> {
        const { data } = await supabase
            .from('businesses')
            .select('*');

        if (!data || data.length === 0) return [];

        const q = normalize(query);
        const matches = data.filter(b => {
            const name = normalize(b.name || "");

            // Filter out specific test businesses
            if (name.includes("caleron") || name.includes("vino")) {
                return false;
            }

            const cat = normalize(b.category || "");
            const loc = normalize(b.location || "");
            return name === q ||
                name.includes(q) ||
                q.includes(name) ||
                cat.includes(q) ||
                loc.includes(q) ||
                q.split(" ").some(w => w.length > 3 && (name.includes(w) || cat.includes(w)));
        });

        // Also exclude deleted businesses
        const { data: signals } = await supabase
            .from('bookings')
            .select('business_id')
            .eq('service_name', '__RESIDATE_DELETE_SIGNAL__');
        const deletedIds = new Set(signals?.map(s => s.business_id) || []);

        // Sort: exact matches first
        return matches
            .filter(b => !deletedIds.has(b.id))
            .sort((a, b) => {
                const nA = normalize(a.name);
                const nB = normalize(b.name);
                if (nA === q) return -1;
                if (nB === q) return 1;
                return 0;
            })
            .map(b => {
                const desc = b.description || "";
                const smartMatch = desc.match(/\[SMART:(.*?)\]/);
                const smartSlots = smartMatch ? smartMatch[1].split(',').map(Number).filter((n: number) => !isNaN(n)) : [];
                return {
                    id: b.id,
                    name: b.name,
                    location: b.location,
                    category: b.category,
                    description: desc.replace(/\[SMART:.*?\]/, '').replace(/\[PWD:.*?\]/, '').trim(),
                    services: b.services || [],
                    smartSlots,
                };
            });
    }

    private async getBookingsForBusiness(businessId: string): Promise<FoundBooking[]> {
        const { data } = await supabase
            .from('bookings')
            .select('*')
            .eq('business_id', businessId);

        return (data || []).filter(b => b.service_name !== '__RESIDATE_DELETE_SIGNAL__');
    }

    private findBestAvailableSlot(bookings: FoundBooking[], smartSlots: number[]): { day: string; hour: number; isSmart: boolean } | null {
        const now = new Date();
        const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
        const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

        // Check next 7 days
        for (let d = 0; d < 7; d++) {
            const date = new Date(now);
            date.setDate(date.getDate() + d);
            const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const dayName = dias[date.getDay()];

            // Build set of booked hours for this day
            const bookedHours = new Set(
                bookings.filter(b => b.day_key === dayKey).map(b => b.hour)
            );

            // First try smart slots (recommended hours)
            for (const h of smartSlots) {
                if (!bookedHours.has(h) && (d > 0 || h > now.getHours())) {
                    return { day: `${dayName} ${date.getDate()}/${date.getMonth() + 1}`, hour: h, isSmart: true };
                }
            }

            // Then try all hours
            for (const h of HOURS) {
                if (!bookedHours.has(h) && (d > 0 || h > now.getHours())) {
                    return { day: `${dayName} ${date.getDate()}/${date.getMonth() + 1}`, hour: h, isSmart: false };
                }
            }
        }
        return null;
    }

    private formatBusinessResponse(biz: FoundBusiness, bestSlot: { day: string; hour: number; isSmart: boolean } | null): string {
        let response = `🏢 He encontrado **${biz.name}**\n`;
        response += `📍 ${biz.location}\n`;
        response += `📂 ${biz.category}\n`;

        if (biz.services && biz.services.length > 0) {
            response += `\n**Servicios disponibles:**\n`;
            for (const s of biz.services) {
                response += `• ${s.name} — **${s.price}€** (${s.duration} min)\n`;
            }
        }

        if (bestSlot) {
            const smartLabel = bestSlot.isSmart ? " ⭐ Recomendado" : "";
            response += `\n🕐 **Mejor hora disponible:** ${bestSlot.day} a las **${bestSlot.hour}:00**${smartLabel}\n`;
            response += `\nPara reservar, ve a **Destinos** > busca **${biz.name}** > selecciona tu hora. ¡Te espera una experiencia increíble! ✨`;
        } else {
            response += `\n⚠️ Parece que tienen la agenda muy completa estos días. Te recomiendo contactar directamente con el negocio o revisar la disponibilidad en **Destinos**.`;
        }

        return response;
    }

    // ─── Proceso principal (async) ───────────────────────────────────

    async process(userInput: string, fullHistory: any[] = []): Promise<string> {
        // Detect role
        const role = this.detectRole(userInput);
        if (role !== "unknown") this.context.userRole = role;

        // Detect mood
        this.context.mood = this.detectMood(userInput);

        // Detect name
        this.detectName(userInput);

        let response: string | null = null;
        let kbResult = this.findBestResponse(userInput);

        // 1. Check if we have a high-priority emotional/direct match in the KB
        // priority >= 13 handles explicitly matched identities, feelings, and emotions
        if (kbResult && kbResult.priority >= 13) {
            response = kbResult.response;
        }

        // Define an async helper for business lookup
        const executeBusinessSearch = async (term: string, showNotFoundMsg: boolean) => {
            if (term.length < 2) return null;

            try {
                const businesses = await this.searchBusinesses(term);

                if (businesses.length === 1) {
                    const biz = businesses[0];
                    const bookings = await this.getBookingsForBusiness(biz.id);
                    const bestSlot = this.findBestAvailableSlot(bookings, biz.smartSlots || []);
                    return this.formatBusinessResponse(biz, bestSlot);
                } else if (businesses.length > 1) {
                    let msg = `He encontrado **${businesses.length} negocios** que coinciden:\n\n`;
                    for (const biz of businesses.slice(0, 5)) {
                        const bookings = await this.getBookingsForBusiness(biz.id);
                        const bestSlot = this.findBestAvailableSlot(bookings, biz.smartSlots || []);
                        msg += `🏢 **${biz.name}** — ${biz.location}`;
                        if (bestSlot) {
                            const smartLabel = bestSlot.isSmart ? " ⭐" : "";
                            msg += `\n   🕐 Próxima hora libre: ${bestSlot.day} a las **${bestSlot.hour}:00**${smartLabel}`;
                        }
                        msg += `\n\n`;
                    }
                    msg += `Dime cuál te interesa y te doy más detalles. 😊`;
                    return msg;
                } else if (showNotFoundMsg) {
                    const { data: allBizRaw } = await supabase.from('businesses').select('name, category, location').limit(50);

                    // Filter out test businesses and limit to 10
                    const allBiz = (allBizRaw || [])
                        .filter(b => {
                            const n = normalize(b.name || "");
                            return !n.includes("caleron") && !n.includes("vino");
                        })
                        .slice(0, 10);

                    if (allBiz && allBiz.length > 0) {
                        let msg = `No he encontrado ningún negocio con "${term}". 😔\n\nPero tenemos estos disponibles:\n\n`;
                        for (const b of allBiz) {
                            msg += `• **${b.name}** — ${b.category} (${b.location})\n`;
                        }
                        return msg;
                    }
                    return `No he encontrado negocios que coincidan con "${term}". Puedes visitar la sección **Destinos** para ver todos los disponibles.`;
                }
            } catch (err) {
                console.error("Aurelia search error:", err);
            }
            return null;
        };

        // 2. If no high priority response, check if this is an explicit business search query
        if (!response && this.isBusinessQuery(userInput)) {
            const searchTerm = this.extractBusinessName(userInput);
            response = await executeBusinessSearch(searchTerm, true);
        }

        // 3. If no response, use normal Knowledge Base response only if it's high priority (platform/identity)
        if (!response && kbResult && kbResult.priority >= 10) {
            response = kbResult.response;
        }

        // 4. Fallback: even if not explicitly a search, they might have just typed a business name
        if (!response) {
            response = await executeBusinessSearch(normalize(userInput), false);
        }

        // 5. Finally, real AI fallback with Gemini
        if (!response) {
            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: fullHistory.concat({ role: 'user', content: userInput })
                    })
                });
                const data = await res.json();
                if (data.text) {
                    response = data.text;
                } else {
                    response = this.generateSmartFallback(userInput);
                }
            } catch (err) {
                console.error("Gemini connection error:", err);
                response = this.generateSmartFallback(userInput);
            }
        }

        // Safety guarantee for TS
        if (!response) {
            response = this.generateSmartFallback(userInput);
        }

        // Add name if known
        if (this.context.userName && this.context.turnCount > 0 && Math.random() < 0.3) {
            response = response.replace(/^/, `${this.context.userName}, `);
        }

        // Mood prefix
        if (this.context.mood === "frustrated" && !response.includes("frustración") && !response.includes("Lamento")) {
            response = "Entiendo tu frustración. " + response;
        }

        // Store history
        this.context.history.push(
            { role: "user", content: userInput, timestamp: Date.now() },
            { role: "assistant", content: response, timestamp: Date.now() }
        );
        this.context.turnCount++;

        return response;
    }

    getRole(): UserRole { return this.context.userRole; }
    getHistory(): ConversationMessage[] { return this.context.history; }

    reset() {
        this.context.history = [];
        this.context.entities = {};
        this.context.mood = "neutral";
        this.context.turnCount = 0;
        this.context.userName = null;
    }
}
