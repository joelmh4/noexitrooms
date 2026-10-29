/* =====================================================================
   Datos de ejemplo del boceto.
   Son los mismos que el script 05_esquema_mysql.sql para que el boceto
   y la base de datos cuenten la misma historia. Cuando el backend esté
   listo, este archivo deja de usarse (ver MODO_DEMO en api.js).
   ===================================================================== */

const DATOS_DEMO = {
  // En la base de datos la contraseña va cifrada con bcrypt.
  // Aquí solo la usa el modo demo para simular el login.
  usuarios: [
    { id: 1, name: "Admin NoExitRooms", email: "admin@noexitrooms.test",  password: "Demo1234!", role: "admin",   is_active: true, created_at: "2026-09-01T10:00:00" },
    { id: 2, name: "Marta Gil",         email: "marta@noexitrooms.test",  password: "Demo1234!", role: "agente",  is_active: true, created_at: "2026-09-01T10:00:00" },
    { id: 3, name: "Sergio Pardo",      email: "sergio@noexitrooms.test", password: "Demo1234!", role: "agente",  is_active: true, created_at: "2026-09-02T10:00:00" },
    { id: 4, name: "Lucía Fernández",   email: "lucia@ejemplo.test",      password: "Demo1234!", role: "cliente", is_active: true, created_at: "2026-10-01T10:00:00" },
    { id: 5, name: "Pablo Ruiz",        email: "pablo@ejemplo.test",      password: "Demo1234!", role: "cliente", is_active: true, created_at: "2026-10-05T10:00:00" },
    { id: 6, name: "Ana Torres",        email: "ana@ejemplo.test",        password: "Demo1234!", role: "cliente", is_active: true, created_at: "2026-10-20T10:00:00" }
  ],

  salas: [
    {
      id: 1, name: "La acampada de Sol", slug: "la-acampada-de-sol", image_url: "img/salas/la-acampada-de-sol/principal.webp", theme: "Humor",
      difficulty: 4, duration_min: 60, min_players: 2, max_players: 6, price_per_person: 22, min_age: 14, is_active: true,
      tagline: "La asamblea no se disuelve hasta que haya consenso. Y nunca hay consenso.",
      description: "Llegasteis a la acampada de la Puerta del Sol solo para ver qué tal y ahora sois de la comisión de logística. Para iros hay que aprobar vuestra salida en asamblea.",
      pruebas: ["Conseguir el turno de palabra en una asamblea sin fin", "Montar la tienda de campaña con las instrucciones de otra tienda", "Reunir los votos de todas las comisiones"]
    },
    {
      id: 2, name: "El almacén de las mascarillas", slug: "el-almacen-de-las-mascarillas", image_url: "img/salas/el-almacen-de-las-mascarillas/principal.webp", theme: "Humor",
      difficulty: 3, duration_min: 60, min_players: 3, max_players: 6, price_per_person: 20, min_age: 12, is_active: true,
      tagline: "Mil cajas de mascarillas. Solo una es la buena. La UCO llega en 60 minutos.",
      description: "Una nave llena de cajas de mascarillas compradas por la vía rápida. Encontrad la caja buena y cuadrad las facturas antes de que llegue la UCO. Sala de humor: personajes caricaturizados y ficticios.",
      pruebas: ["Encontrar la caja buena entre cientos de cajas iguales", "Cuadrar las facturas de la oficina de los archivadores", "Descifrar la agenda de llamadas antes de que suene el timbre"]
    },
    {
      id: 3, name: "El manicomio de San Tomás", slug: "el-manicomio-de-san-tomas", image_url: "img/salas/el-manicomio-de-san-tomas/principal.webp", theme: "Terror",
      difficulty: 5, duration_min: 150, min_players: 4, max_players: 7, price_per_person: 26, min_age: 18, is_active: true,
      tagline: "IDENTIFICATION DIVISION. PROGRAM-ID. SALIR. Nadie lo ha compilado nunca.",
      description: "En 1974 el pabellón C era el centro de cálculo donde encerraban a los programadores de COBOL. El hermano Tomás dejó un programa a medias y esta noche el mainframe se ha vuelto a encender. Solo mayores de 18.",
      pruebas: ["Ordenar las tarjetas perforadas del programa del hermano Tomás", "Encontrar el punto que falta en la PROCEDURE DIVISION", "Compilar el programa SALIR antes de que se apague la luz"]
    },
    {
      id: 4, name: "El despertar del Perro", slug: "el-despertar-del-perro", image_url: "img/salas/el-despertar-del-perro/principal.webp", theme: "Humor",
      difficulty: 2, duration_min: 60, min_players: 2, max_players: 5, price_per_person: 18, min_age: 8, is_active: true,
      tagline: "Manual de resistencia: 60 minutos para seguir en el sillón.",
      description: "El Presidente se despierta en La Moncloa sin apoyos y con una moción de censura a las 12:00. Su equipo de confianza ha desaparecido con las piezas del plan. Sala de humor: personajes caricaturizados y ficticios.",
      pruebas: ["Encontrar a Ábalos, a Koldo y a Santos Cerdán por el palacio", "Superar la prueba de la cátedra", "Tocar la partitura del hermano músico"]
    },
    {
      id: 5, name: "Operación David", slug: "operacion-david", image_url: "img/salas/operacion-david/principal.webp", theme: "Espionaje",
      difficulty: 4, duration_min: 75, min_players: 3, max_players: 6, price_per_person: 24, min_age: 14, is_active: true,
      tagline: "Un proyecto. Un profesor. Ni un solo localhost.",
      description: "Quedan 75 minutos para la entrega del proyecto trimestral y el agente David solo acepta un trabajo perfecto. Recuperad el código, desplegadlo y entregádselo a tiempo.",
      pruebas: ["Recuperar el repositorio de una memoria USB cifrada", "Desplegar la web sin un solo localhost", "Documentar la API con Swagger antes de la entrega"]
    },
    {
      id: 6, name: 'El camarote del capitán Eduardo "El Panzas"', slug: "el-camarote-del-capitan-eduardo-el-panzas", image_url: "img/salas/el-camarote-del-capitan-eduardo-el-panzas/principal.webp", theme: "Aventura",
      difficulty: 1, duration_min: 45, min_players: 2, max_players: 4, price_per_person: 16, min_age: 6, is_active: true,
      tagline: "El barco se hunde. La llave está en la despensa. La despensa está vacía.",
      description: "El barco se hunde y el capitán Eduardo ha escondido la llave del bote salvavidas en algún lugar del camarote. La despensa, eso sí, está vacía.",
      pruebas: ["Leer el cuaderno de bitácora del capitán", "Abrir el baúl con la combinación correcta", "Encontrar la llave del bote salvavidas"]
    }
  ],

  categorias: [
    { id: 1, name: "Reservas y cambios de fecha", is_active: true },
    { id: 2, name: "Bonos y tarjetas regalo", is_active: true },
    { id: 3, name: "Grupos y eventos de empresa", is_active: true },
    { id: 4, name: "Objetos perdidos", is_active: true },
    { id: 5, name: "Reclamaciones sobre la experiencia", is_active: true },
    { id: 6, name: "Cuenta y acceso", is_active: true }
  ],

  // Reservas (tabla bookings). Una sala no puede tener dos reservas a la misma hora.
  reservas: [
    { id: 1, customer_id: 4, room_id: 1, starts_at: "2026-10-31T18:00:00", players: 5, status: "confirmada", created_at: "2026-10-20T11:00:00" },
    { id: 2, customer_id: 5, room_id: 2, starts_at: "2026-10-18T20:00:00", players: 4, status: "confirmada", created_at: "2026-10-10T17:30:00" },
    { id: 3, customer_id: 6, room_id: 3, starts_at: "2026-10-31T19:30:00", players: 6, status: "confirmada", created_at: "2026-10-22T09:00:00" },
    { id: 4, customer_id: 5, room_id: 1, starts_at: "2026-10-30T20:00:00", players: 4, status: "confirmada", created_at: "2026-10-23T19:15:00" },
    { id: 5, customer_id: 6, room_id: 5, starts_at: "2026-11-01T18:00:00", players: 3, status: "pendiente",  created_at: "2026-10-27T21:40:00" },
    { id: 6, customer_id: 5, room_id: 4, starts_at: "2026-10-29T18:00:00", players: 2, status: "confirmada", created_at: "2026-10-25T10:05:00" },
    { id: 7, customer_id: 4, room_id: 3, starts_at: "2026-11-02T16:00:00", players: 5, status: "confirmada", created_at: "2026-10-26T12:20:00" }
  ],

  tickets: [
    { id: 1, customer_id: 4, agent_id: null, category_id: 3, room_id: null, subject: "Presupuesto para cumpleaños de 12 personas", description: "¿Podemos dividirnos en dos salas a la vez?", priority: "baja", status: "cerrado", created_at: "2026-10-12T10:15:00", updated_at: "2026-10-14T12:00:00", closed_at: "2026-10-14T12:00:00" },
    { id: 2, customer_id: 5, agent_id: 3, category_id: 4, room_id: 2, subject: "Me dejé las gafas en El almacén de las mascarillas", description: "Son unas gafas negras de pasta, creo que en la oficina de los archivadores.", priority: "media", status: "resuelto", created_at: "2026-10-19T09:30:00", updated_at: "2026-10-19T11:05:00", closed_at: null },
    { id: 3, customer_id: 4, agent_id: 2, category_id: 2, room_id: null, subject: "El código del bono regalo no funciona", description: "Al canjear el código BONO-7731 me dice que no es válido.", priority: "alta", status: "pendiente_cliente", created_at: "2026-10-24T17:45:00", updated_at: "2026-10-24T18:31:00", closed_at: null },
    { id: 4, customer_id: 4, agent_id: 2, category_id: 1, room_id: 1, subject: "Cambio de fecha de la partida del sábado", description: "¿Podemos pasar la partida del sábado al domingo a la misma hora?", priority: "media", status: "en_curso", created_at: "2026-10-26T18:02:00", updated_at: "2026-10-26T19:12:00", closed_at: null },
    { id: 5, customer_id: 6, agent_id: null, category_id: 1, room_id: null, subject: "¿Se puede jugar con niños de 10 años?", description: "Somos dos adultos y dos niños de 10 y 12 años.", priority: "baja", status: "abierto", created_at: "2026-10-27T09:10:00", updated_at: "2026-10-27T09:10:00", closed_at: null }
  ],

  mensajes: [
    { id: 1,  ticket_id: 1, author_id: 4, body: "¿Podemos dividirnos en dos salas a la vez?", is_internal: false, created_at: "2026-10-12T10:15:00" },
    { id: 2,  ticket_id: 1, author_id: 1, body: "Sí, os reservamos El despertar del Perro y El almacén de las mascarillas a la misma hora. Os enviamos el presupuesto por aquí.", is_internal: false, created_at: "2026-10-12T13:00:00" },
    { id: 3,  ticket_id: 2, author_id: 5, body: "Son unas gafas negras de pasta, creo que en la oficina de los archivadores.", is_internal: false, created_at: "2026-10-19T09:30:00" },
    { id: 4,  ticket_id: 2, author_id: 3, body: "Las tenemos en recepción. Puedes pasar a recogerlas cuando quieras.", is_internal: false, created_at: "2026-10-19T11:05:00" },
    { id: 5,  ticket_id: 3, author_id: 4, body: "Al canjear el código BONO-7731 me dice que no es válido.", is_internal: false, created_at: "2026-10-24T17:45:00" },
    { id: 6,  ticket_id: 3, author_id: 2, body: "El bono caducó el 30/09. Revisa si tienes otro código o mándanos foto del bono.", is_internal: false, created_at: "2026-10-24T18:30:00" },
    { id: 7,  ticket_id: 3, author_id: 2, body: "Si lo compró en la campaña de verano, se puede ampliar 1 mes.", is_internal: true, created_at: "2026-10-24T18:31:00" },
    { id: 8,  ticket_id: 4, author_id: 4, body: "¿Podemos pasar la partida del sábado al domingo a la misma hora?", is_internal: false, created_at: "2026-10-26T18:02:00" },
    { id: 9,  ticket_id: 4, author_id: 2, body: "¡Hola Lucía! El domingo a las 18:00 está libre. ¿Seguís siendo 5 personas?", is_internal: false, created_at: "2026-10-26T19:12:00" },
    { id: 10, ticket_id: 5, author_id: 6, body: "Somos dos adultos y dos niños de 10 y 12 años.", is_internal: false, created_at: "2026-10-27T09:10:00" }
  ],

  historial: [
    { id: 1,  ticket_id: 1, changed_by_id: 4, old_status: null, new_status: "abierto", changed_at: "2026-10-12T10:15:00" },
    { id: 2,  ticket_id: 1, changed_by_id: 1, old_status: "abierto", new_status: "resuelto", changed_at: "2026-10-12T13:00:00" },
    { id: 3,  ticket_id: 1, changed_by_id: 4, old_status: "resuelto", new_status: "cerrado", changed_at: "2026-10-14T12:00:00" },
    { id: 4,  ticket_id: 2, changed_by_id: 5, old_status: null, new_status: "abierto", changed_at: "2026-10-19T09:30:00" },
    { id: 5,  ticket_id: 2, changed_by_id: 3, old_status: "abierto", new_status: "en_curso", changed_at: "2026-10-19T10:00:00" },
    { id: 6,  ticket_id: 2, changed_by_id: 3, old_status: "en_curso", new_status: "resuelto", changed_at: "2026-10-19T11:05:00" },
    { id: 7,  ticket_id: 3, changed_by_id: 4, old_status: null, new_status: "abierto", changed_at: "2026-10-24T17:45:00" },
    { id: 8,  ticket_id: 3, changed_by_id: 2, old_status: "abierto", new_status: "en_curso", changed_at: "2026-10-24T18:00:00" },
    { id: 9,  ticket_id: 3, changed_by_id: 2, old_status: "en_curso", new_status: "pendiente_cliente", changed_at: "2026-10-24T18:30:00" },
    { id: 10, ticket_id: 4, changed_by_id: 4, old_status: null, new_status: "abierto", changed_at: "2026-10-26T18:02:00" },
    { id: 11, ticket_id: 4, changed_by_id: 2, old_status: "abierto", new_status: "en_curso", changed_at: "2026-10-26T19:10:00" },
    { id: 12, ticket_id: 5, changed_by_id: 6, old_status: null, new_status: "abierto", changed_at: "2026-10-27T09:10:00" }
  ]
};
