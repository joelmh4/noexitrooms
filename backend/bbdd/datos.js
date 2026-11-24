// Datos de ejemplo de NoExitRooms. Los carga bbdd/carga-inicial.js (npm run carga).
// Todos los usuarios de prueba tienen la contraseña Demo1234!

// Hash de bcrypt de "Demo1234!" (en la base de datos nunca se guarda la contraseña tal cual)
const PASSWORD = "$2b$10$MmIX7ggb5lxY8Eys0r73NuxeYP3YbFQCIwa3Fa.Rm1ptprhcJiXBm";

const usuarios = [
    { _id: 1, name: "Florentino Pérez", email: "admin@noexitrooms.test", password: PASSWORD, role: "admin" },
    { _id: 2, name: "José Luis Ábalos", email: "abalos@noexitrooms.test", password: PASSWORD, role: "agente" },
    { _id: 3, name: "Sergio Ramos", email: "ramos@noexitrooms.test", password: PASSWORD, role: "agente" },
    { _id: 4, name: "Pedro Sánchez", email: "pedro@ejemplo.test", password: PASSWORD, role: "cliente" },
    { _id: 5, name: "Cristiano Ronaldo", email: "cristiano@ejemplo.test", password: PASSWORD, role: "cliente" },
    { _id: 6, name: "Rosalía", email: "rosalia@ejemplo.test", password: PASSWORD, role: "cliente" },
    { _id: 7, name: "Santiago Abascal", email: "abascal@ejemplo.test", password: PASSWORD, role: "cliente" }
];

const salas = [
    {
        _id: 1,
        name: "La acampada de Sol",
        slug: "la-acampada-de-sol",
        theme: "Humor",
        difficulty: 4,
        duration_min: 60,
        min_players: 2,
        max_players: 6,
        price_per_person: 22,
        description: "Llegasteis a la acampada de la Puerta del Sol solo para ver qué tal y ahora sois de la comisión de logística. Para iros hay que aprobar vuestra salida en asamblea.",
        tagline: "La asamblea no se disuelve hasta que haya consenso. Y nunca hay consenso.",
        min_age: 14,
        challenges: "Conseguir el turno de palabra en una asamblea sin fin\nMontar la tienda de campaña con las instrucciones de otra tienda\nReunir los votos de todas las comisiones",
        image_url: "img/salas/la-acampada-de-sol/principal.webp"
    },
    {
        _id: 2,
        name: "El almacén de las mascarillas",
        slug: "el-almacen-de-las-mascarillas",
        theme: "Humor",
        difficulty: 3,
        duration_min: 60,
        min_players: 3,
        max_players: 6,
        price_per_person: 20,
        description: "Una nave llena de cajas de mascarillas compradas por la vía rápida. Encontrad la caja buena y cuadrad las facturas antes de que llegue la UCO. Sala de humor: personajes caricaturizados y ficticios.",
        tagline: "Mil cajas de mascarillas. Solo una es la buena. La UCO llega en 60 minutos.",
        min_age: 12,
        challenges: "Encontrar la caja buena entre cientos de cajas iguales\nCuadrar las facturas de la oficina de los archivadores\nDescifrar la agenda de llamadas antes de que suene el timbre",
        image_url: "img/salas/el-almacen-de-las-mascarillas/principal.webp"
    },
    {
        _id: 3,
        name: "El manicomio de San Tomás",
        slug: "el-manicomio-de-san-tomas",
        theme: "Terror",
        difficulty: 5,
        duration_min: 150,
        min_players: 4,
        max_players: 7,
        price_per_person: 26,
        description: "En 1974 el pabellón C era el centro de cálculo donde encerraban a los programadores de COBOL. El hermano Tomás dejó un programa a medias y esta noche el mainframe se ha vuelto a encender. Solo mayores de 18.",
        tagline: "IDENTIFICATION DIVISION. PROGRAM-ID. SALIR. Nadie lo ha compilado nunca.",
        min_age: 18,
        challenges: "Ordenar las tarjetas perforadas del programa del hermano Tomás\nEncontrar el punto que falta en la PROCEDURE DIVISION\nCompilar el programa SALIR antes de que se apague la luz",
        image_url: "img/salas/el-manicomio-de-san-tomas/principal.webp"
    },
    {
        _id: 4,
        name: "El despertar del Perro",
        slug: "el-despertar-del-perro",
        theme: "Humor",
        difficulty: 2,
        duration_min: 60,
        min_players: 2,
        max_players: 5,
        price_per_person: 18,
        description: "El Presidente se despierta en La Moncloa sin apoyos y con una moción de censura a las 12:00. Su equipo de confianza ha desaparecido con las piezas del plan. Sala de humor: personajes caricaturizados y ficticios.",
        tagline: "Manual de resistencia: 60 minutos para seguir en el sillón.",
        min_age: 8,
        challenges: "Encontrar a Ábalos, a Koldo y a Santos Cerdán por el palacio\nSuperar la prueba de la cátedra\nTocar la partitura del hermano músico",
        image_url: "img/salas/el-despertar-del-perro/principal.webp"
    },
    {
        _id: 5,
        name: "Operación David",
        slug: "operacion-david",
        theme: "Espionaje",
        difficulty: 4,
        duration_min: 75,
        min_players: 3,
        max_players: 6,
        price_per_person: 24,
        description: "Quedan 75 minutos para la entrega del proyecto trimestral y el agente David solo acepta un trabajo perfecto. Recuperad el código, desplegadlo y entregádselo a tiempo.",
        tagline: "Un proyecto. Un profesor. Ni un solo localhost.",
        min_age: 14,
        challenges: "Recuperar el repositorio de una memoria USB cifrada\nDesplegar la web sin un solo localhost\nDocumentar la API con Swagger antes de la entrega",
        image_url: "img/salas/operacion-david/principal.webp"
    },
    {
        _id: 6,
        name: "El camarote del capitán Eduardo \"El Panzas\"",
        slug: "el-camarote-del-capitan-eduardo-el-panzas",
        theme: "Aventura",
        difficulty: 1,
        duration_min: 45,
        min_players: 2,
        max_players: 4,
        price_per_person: 16,
        description: "El barco se hunde y el capitán Eduardo ha escondido la llave del bote salvavidas en algún lugar del camarote. La despensa, eso sí, está vacía.",
        tagline: "El barco se hunde. La llave está en la despensa. La despensa está vacía.",
        min_age: 6,
        challenges: "Leer el cuaderno de bitácora del capitán\nAbrir el baúl con la combinación correcta\nEncontrar la llave del bote salvavidas",
        image_url: "img/salas/el-camarote-del-capitan-eduardo-el-panzas/principal.webp"
    }
];

const categorias = [
    { _id: 1, name: "Reservas y cambios de fecha" },
    { _id: 2, name: "Bonos y tarjetas regalo" },
    { _id: 3, name: "Grupos y eventos de empresa" },
    { _id: 4, name: "Objetos perdidos" },
    { _id: 5, name: "Reclamaciones sobre la experiencia" },
    { _id: 6, name: "Cuenta y acceso" }
];

// starts_at es la hora de Madrid, como texto
const reservas = [
    { _id: 1, customer_id: 4, room_id: 1, starts_at: "2026-10-31T18:00:00", players: 5, status: "confirmada" },
    { _id: 2, customer_id: 5, room_id: 2, starts_at: "2026-10-18T20:00:00", players: 4, status: "confirmada" },
    { _id: 3, customer_id: 6, room_id: 3, starts_at: "2026-10-31T19:30:00", players: 6, status: "confirmada" },
    { _id: 4, customer_id: 5, room_id: 1, starts_at: "2026-10-30T20:00:00", players: 4, status: "confirmada" },
    { _id: 5, customer_id: 6, room_id: 5, starts_at: "2026-11-01T18:00:00", players: 3, status: "pendiente" },
    { _id: 6, customer_id: 5, room_id: 4, starts_at: "2026-10-29T18:00:00", players: 2, status: "confirmada" },
    { _id: 7, customer_id: 4, room_id: 3, starts_at: "2026-11-02T16:00:00", players: 5, status: "confirmada" }
];

const tickets = [
    {
        _id: 1, customer_id: 4, agent_id: null, category_id: 3, room_id: null, booking_id: null,
        subject: "Presupuesto para cumpleaños de 12 personas",
        description: "¿Podemos dividirnos en dos salas a la vez?",
        priority: "baja", status: "cerrado", created_at: "2026-10-12T10:15:00Z", closed_at: "2026-10-14T12:00:00Z"
    },
    {
        _id: 2, customer_id: 5, agent_id: 3, category_id: 4, room_id: 2, booking_id: 2,
        subject: "Me dejé las gafas en El almacén de las mascarillas",
        description: "Son unas gafas negras de pasta, creo que en la oficina de los archivadores.",
        priority: "media", status: "resuelto", created_at: "2026-10-19T09:30:00Z", closed_at: null
    },
    {
        _id: 3, customer_id: 4, agent_id: 2, category_id: 2, room_id: null, booking_id: null,
        subject: "El código del bono regalo no funciona",
        description: "Al canjear el código BONO-7731 me dice que no es válido.",
        priority: "alta", status: "pendiente_cliente", created_at: "2026-10-24T17:45:00Z", closed_at: null
    },
    {
        _id: 4, customer_id: 4, agent_id: 2, category_id: 1, room_id: 1, booking_id: 1,
        subject: "Cambio de fecha de la partida del sábado",
        description: "¿Podemos pasar la partida del sábado al domingo a la misma hora?",
        priority: "media", status: "en_curso", created_at: "2026-10-26T18:02:00Z", closed_at: null
    },
    {
        _id: 5, customer_id: 6, agent_id: null, category_id: 1, room_id: null, booking_id: null,
        subject: "¿Se puede jugar con niños de 10 años?",
        description: "Somos dos adultos y dos niños de 10 y 12 años.",
        priority: "baja", status: "abierto", created_at: "2026-10-27T09:10:00Z", closed_at: null
    }
];

const mensajes = [
    { ticket_id: 1, author_id: 4, body: "¿Podemos dividirnos en dos salas a la vez?", is_internal: false, created_at: "2026-10-12T10:15:00Z" },
    { ticket_id: 1, author_id: 1, body: "Sí, os reservamos El despertar del Perro y El almacén de las mascarillas a la misma hora. Os enviamos el presupuesto por aquí.", is_internal: false, created_at: "2026-10-12T13:00:00Z" },
    { ticket_id: 2, author_id: 5, body: "Son unas gafas negras de pasta, creo que en la oficina de los archivadores.", is_internal: false, created_at: "2026-10-19T09:30:00Z" },
    { ticket_id: 2, author_id: 3, body: "Las tenemos en recepción. Puedes pasar a recogerlas cuando quieras.", is_internal: false, created_at: "2026-10-19T11:05:00Z" },
    { ticket_id: 3, author_id: 4, body: "Al canjear el código BONO-7731 me dice que no es válido.", is_internal: false, created_at: "2026-10-24T17:45:00Z" },
    { ticket_id: 3, author_id: 2, body: "El bono caducó el 30/09. Revisa si tienes otro código o mándanos foto del bono.", is_internal: false, created_at: "2026-10-24T18:30:00Z" },
    { ticket_id: 3, author_id: 2, body: "Si lo compró en la campaña de verano, se puede ampliar 1 mes.", is_internal: true, created_at: "2026-10-24T18:31:00Z" },
    { ticket_id: 4, author_id: 4, body: "¿Podemos pasar la partida del sábado al domingo a la misma hora?", is_internal: false, created_at: "2026-10-26T18:02:00Z" },
    { ticket_id: 4, author_id: 2, body: "¡Hola Pedro! El domingo a las 18:00 está libre. ¿Seguís siendo 5 personas?", is_internal: false, created_at: "2026-10-26T19:12:00Z" },
    { ticket_id: 5, author_id: 6, body: "Somos dos adultos y dos niños de 10 y 12 años.", is_internal: false, created_at: "2026-10-27T09:10:00Z" }
];

const historial = [
    { ticket_id: 1, changed_by_id: 4, old_status: null, new_status: "abierto", changed_at: "2026-10-12T10:15:00Z" },
    { ticket_id: 1, changed_by_id: 1, old_status: "abierto", new_status: "resuelto", changed_at: "2026-10-12T13:00:00Z" },
    { ticket_id: 1, changed_by_id: 4, old_status: "resuelto", new_status: "cerrado", changed_at: "2026-10-14T12:00:00Z" },
    { ticket_id: 2, changed_by_id: 5, old_status: null, new_status: "abierto", changed_at: "2026-10-19T09:30:00Z" },
    { ticket_id: 2, changed_by_id: 3, old_status: "abierto", new_status: "en_curso", changed_at: "2026-10-19T10:00:00Z" },
    { ticket_id: 2, changed_by_id: 3, old_status: "en_curso", new_status: "resuelto", changed_at: "2026-10-19T11:05:00Z" },
    { ticket_id: 3, changed_by_id: 4, old_status: null, new_status: "abierto", changed_at: "2026-10-24T17:45:00Z" },
    { ticket_id: 3, changed_by_id: 2, old_status: "abierto", new_status: "en_curso", changed_at: "2026-10-24T18:00:00Z" },
    { ticket_id: 3, changed_by_id: 2, old_status: "en_curso", new_status: "pendiente_cliente", changed_at: "2026-10-24T18:30:00Z" },
    { ticket_id: 4, changed_by_id: 4, old_status: null, new_status: "abierto", changed_at: "2026-10-26T18:02:00Z" },
    { ticket_id: 4, changed_by_id: 2, old_status: "abierto", new_status: "en_curso", changed_at: "2026-10-26T19:10:00Z" },
    { ticket_id: 5, changed_by_id: 6, old_status: null, new_status: "abierto", changed_at: "2026-10-27T09:10:00Z" }
];

module.exports = { usuarios, salas, categorias, reservas, tickets, mensajes, historial };
