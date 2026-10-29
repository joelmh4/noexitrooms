-- =====================================================================
-- NoExitRooms · Esquema de base de datos (MySQL 8)
-- Proyecto trimestral DAW · Joel, Edu e Iván · v1 27/10/2026
--
-- Orden: borrar tablas, crear tablas, insertar datos de ejemplo.
-- Contraseña de TODOS los usuarios de prueba: Demo1234!
-- (guardada con bcrypt, coste 10; nunca en texto plano)
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS ticket_status_history;
DROP TABLE IF EXISTS ticket_messages;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS ticket_categories;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- Usuarios: el registro público siempre crea rol 'cliente'.
-- Agentes y administradores solo los crea/cambia un administrador.
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('cliente','agente','admin') NOT NULL DEFAULT 'cliente',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Salas: entidad del CRUD temático. Se desactivan (is_active = FALSE)
-- en lugar de borrarse si ya tienen tickets o reservas.
-- ---------------------------------------------------------------------
CREATE TABLE rooms (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(100) NOT NULL,
  slug             VARCHAR(120) NOT NULL,
  theme            VARCHAR(50)  NOT NULL,
  difficulty       TINYINT UNSIGNED NOT NULL,
  duration_min     SMALLINT UNSIGNED NOT NULL,
  min_players      TINYINT UNSIGNED NOT NULL,
  max_players      TINYINT UNSIGNED NOT NULL,
  price_per_person DECIMAL(6,2) NOT NULL,
  description      TEXT NOT NULL,
  tagline          VARCHAR(150) NULL,
  min_age          TINYINT UNSIGNED NOT NULL DEFAULT 0,
  image_url        VARCHAR(255) NULL,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_rooms_name UNIQUE (name),
  CONSTRAINT uq_rooms_slug UNIQUE (slug),
  CONSTRAINT ck_rooms_difficulty CHECK (difficulty BETWEEN 1 AND 5),
  CONSTRAINT ck_rooms_duration   CHECK (duration_min BETWEEN 15 AND 180),
  CONSTRAINT ck_rooms_players    CHECK (min_players >= 1 AND max_players >= min_players),
  CONSTRAINT ck_rooms_price      CHECK (price_per_person >= 0),
  CONSTRAINT ck_rooms_min_age    CHECK (min_age <= 99),
  INDEX idx_rooms_theme (theme),
  INDEX idx_rooms_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Categorías de ticket (las administra el admin).
-- ---------------------------------------------------------------------
CREATE TABLE ticket_categories (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(80) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT uq_ticket_categories_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Reservas (MEJORA OPCIONAL: segunda entidad de la temática).
-- Si no se implementa, se puede omitir junto con tickets.booking_id.
-- ---------------------------------------------------------------------
CREATE TABLE bookings (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id INT UNSIGNED NOT NULL,
  room_id     INT UNSIGNED NOT NULL,
  starts_at   DATETIME NOT NULL,
  players     TINYINT UNSIGNED NOT NULL,
  status      ENUM('pendiente','confirmada','cancelada') NOT NULL DEFAULT 'pendiente',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_room     FOREIGN KEY (room_id)     REFERENCES rooms(id) ON DELETE RESTRICT,
  CONSTRAINT uq_bookings_slot UNIQUE (room_id, starts_at),
  CONSTRAINT ck_bookings_players CHECK (players >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Tickets. El código visible (NXR-0042) se genera en la API a partir
-- del id: 'NXR-' + id con 4 cifras. Estado inicial: 'abierto'.
-- ---------------------------------------------------------------------
CREATE TABLE tickets (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id INT UNSIGNED NOT NULL,
  agent_id    INT UNSIGNED NULL,
  category_id INT UNSIGNED NOT NULL,
  room_id     INT UNSIGNED NULL,
  booking_id  INT UNSIGNED NULL,
  subject     VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  priority    ENUM('baja','media','alta') NOT NULL DEFAULT 'media',
  status      ENUM('abierto','en_curso','pendiente_cliente','resuelto','cerrado') NOT NULL DEFAULT 'abierto',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  closed_at   DATETIME NULL,
  CONSTRAINT fk_tickets_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_tickets_agent    FOREIGN KEY (agent_id)    REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_tickets_category FOREIGN KEY (category_id) REFERENCES ticket_categories(id) ON DELETE RESTRICT,
  CONSTRAINT fk_tickets_room     FOREIGN KEY (room_id)     REFERENCES rooms(id) ON DELETE SET NULL,
  CONSTRAINT fk_tickets_booking  FOREIGN KEY (booking_id)  REFERENCES bookings(id) ON DELETE SET NULL,
  INDEX idx_tickets_customer (customer_id),
  INDEX idx_tickets_agent (agent_id),
  INDEX idx_tickets_status (status),
  INDEX idx_tickets_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Respuestas de un ticket (historial de conversación).
-- is_internal = nota interna visible solo para agente/admin (mejora).
-- ---------------------------------------------------------------------
CREATE TABLE ticket_messages (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_id   INT UNSIGNED NOT NULL,
  author_id   INT UNSIGNED NOT NULL,
  body        TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_messages_ticket (ticket_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Historial de cambios de estado (trazabilidad).
-- old_status es NULL en el registro de creación del ticket.
-- ---------------------------------------------------------------------
CREATE TABLE ticket_status_history (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_id     INT UNSIGNED NOT NULL,
  changed_by_id INT UNSIGNED NOT NULL,
  old_status    ENUM('abierto','en_curso','pendiente_cliente','resuelto','cerrado') NULL,
  new_status    ENUM('abierto','en_curso','pendiente_cliente','resuelto','cerrado') NOT NULL,
  changed_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_ticket FOREIGN KEY (ticket_id)     REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_history_user   FOREIGN KEY (changed_by_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_history_ticket (ticket_id, changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- DATOS DE EJEMPLO (ficticios)
-- =====================================================================
SET @pwd = '$2b$10$MmIX7ggb5lxY8Eys0r73NuxeYP3YbFQCIwa3Fa.Rm1ptprhcJiXBm'; -- Demo1234!

INSERT INTO users (id, name, email, password_hash, role) VALUES
  (1, 'Admin NoExitRooms', 'admin@noexitrooms.test',   @pwd, 'admin'),
  (2, 'Marta Gil',         'marta@noexitrooms.test',   @pwd, 'agente'),
  (3, 'Sergio Pardo',      'sergio@noexitrooms.test',  @pwd, 'agente'),
  (4, 'Lucía Fernández',   'lucia@ejemplo.test',       @pwd, 'cliente'),
  (5, 'Pablo Ruiz',        'pablo@ejemplo.test',       @pwd, 'cliente'),
  (6, 'Ana Torres',        'ana@ejemplo.test',         @pwd, 'cliente');

INSERT INTO rooms (id, name, slug, theme, difficulty, duration_min, min_players, max_players, price_per_person, description, tagline, min_age, is_active) VALUES
  (1, 'La acampada de Sol',          'la-acampada-de-sol',          'Humor',        4,  60, 2, 6, 22.00, 'Llegasteis a la acampada de la Puerta del Sol solo para ver qué tal y ahora sois de la comisión de logística. Para iros hay que aprobar vuestra salida en asamblea.', 'La asamblea no se disuelve hasta que haya consenso. Y nunca hay consenso.', 14, TRUE),
  (2, 'El almacén de las mascarillas', 'el-almacen-de-las-mascarillas', 'Humor',     3,  60, 3, 6, 20.00, 'Una nave llena de cajas de mascarillas compradas por la vía rápida. Encontrad la caja buena y cuadrad las facturas antes de que llegue la UCO. Sala de humor: personajes caricaturizados y ficticios.', 'Mil cajas de mascarillas. Solo una es la buena. La UCO llega en 60 minutos.', 12, TRUE),
  (3, 'El manicomio de San Tomás',   'el-manicomio-de-san-tomas',   'Terror',          5, 150, 4, 7, 26.00, 'En 1974 el pabellón C era el centro de cálculo donde encerraban a los programadores de COBOL. El hermano Tomás dejó un programa a medias y esta noche el mainframe se ha vuelto a encender. Solo mayores de 18.', 'IDENTIFICATION DIVISION. PROGRAM-ID. SALIR. Nadie lo ha compilado nunca.', 18, TRUE),
  (4, 'El despertar del Perro',      'el-despertar-del-perro',      'Humor',        2,  60, 2, 5, 18.00, 'El Presidente se despierta en La Moncloa sin apoyos y con una moción de censura a las 12:00. Su equipo de confianza ha desaparecido con las piezas del plan. Sala de humor: personajes caricaturizados y ficticios.', 'Manual de resistencia: 60 minutos para seguir en el sillón.', 8, TRUE),
  (5, 'Operación David',             'operacion-david',             'Espionaje',       4,  75, 3, 6, 24.00, 'Quedan 75 minutos para la entrega del proyecto trimestral y el agente David solo acepta un trabajo perfecto. Recuperad el código, desplegadlo y entregádselo a tiempo.', 'Un proyecto. Un profesor. Ni un solo localhost.', 14, TRUE),
  (6, 'El camarote del capitán Eduardo "El Panzas"', 'el-camarote-del-capitan-eduardo-el-panzas', 'Aventura', 1, 45, 2, 4, 16.00, 'El barco se hunde y el capitán Eduardo ha escondido la llave del bote salvavidas en algún lugar del camarote. La despensa, eso sí, está vacía.', 'El barco se hunde. La llave está en la despensa. La despensa está vacía.', 6, TRUE);

-- Foto principal de cada sala (ruta relativa a la web; la galería sale del slug: galeria-1..3.webp)
UPDATE rooms SET image_url = CONCAT('img/salas/', slug, '/principal.webp');

INSERT INTO ticket_categories (id, name) VALUES
  (1, 'Reservas y cambios de fecha'),
  (2, 'Bonos y tarjetas regalo'),
  (3, 'Grupos y eventos de empresa'),
  (4, 'Objetos perdidos'),
  (5, 'Reclamaciones sobre la experiencia'),
  (6, 'Cuenta y acceso');

INSERT INTO bookings (id, customer_id, room_id, starts_at, players, status) VALUES
  (1, 4, 1, '2026-10-31 18:00:00', 5, 'confirmada'),
  (2, 5, 2, '2026-10-18 20:00:00', 4, 'confirmada'),
  (3, 6, 3, '2026-10-31 19:30:00', 6, 'confirmada'),
  (4, 5, 1, '2026-10-30 20:00:00', 4, 'confirmada'),
  (5, 6, 5, '2026-11-01 18:00:00', 3, 'pendiente'),
  (6, 5, 4, '2026-10-29 18:00:00', 2, 'confirmada'),
  (7, 4, 3, '2026-11-02 16:00:00', 5, 'confirmada');

INSERT INTO tickets (id, customer_id, agent_id, category_id, room_id, booking_id, subject, description, priority, status, created_at, closed_at) VALUES
  (1, 4, NULL, 3, NULL, NULL, 'Presupuesto para cumpleaños de 12 personas', '¿Podemos dividirnos en dos salas a la vez?', 'baja', 'cerrado', '2026-10-12 10:15:00', '2026-10-14 12:00:00'),
  (2, 5, 3,    4, 2,    2,    'Me dejé las gafas en El almacén de las mascarillas', 'Son unas gafas negras de pasta, creo que en la oficina de los archivadores.', 'media', 'resuelto', '2026-10-19 09:30:00', NULL),
  (3, 4, 2,    2, NULL, NULL, 'El código del bono regalo no funciona', 'Al canjear el código BONO-7731 me dice que no es válido.', 'alta', 'pendiente_cliente', '2026-10-24 17:45:00', NULL),
  (4, 4, 2,    1, 1,    1,    'Cambio de fecha de la partida del sábado', '¿Podemos pasar la partida del sábado al domingo a la misma hora?', 'media', 'en_curso', '2026-10-26 18:02:00', NULL),
  (5, 6, NULL, 1, NULL, NULL, '¿Se puede jugar con niños de 10 años?', 'Somos dos adultos y dos niños de 10 y 12 años.', 'baja', 'abierto', '2026-10-27 09:10:00', NULL);

INSERT INTO ticket_messages (ticket_id, author_id, body, is_internal, created_at) VALUES
  (1, 4, '¿Podemos dividirnos en dos salas a la vez?', FALSE, '2026-10-12 10:15:00'),
  (1, 1, 'Sí, os reservamos El despertar del Perro y El almacén de las mascarillas a la misma hora. Os enviamos el presupuesto por aquí.', FALSE, '2026-10-12 13:00:00'),
  (2, 5, 'Son unas gafas negras de pasta, creo que en la oficina de los archivadores.', FALSE, '2026-10-19 09:30:00'),
  (2, 3, 'Las tenemos en recepción. Puedes pasar a recogerlas cuando quieras.', FALSE, '2026-10-19 11:05:00'),
  (3, 4, 'Al canjear el código BONO-7731 me dice que no es válido.', FALSE, '2026-10-24 17:45:00'),
  (3, 2, 'El bono caducó el 30/09. Revisa si tienes otro código o mándanos foto del bono.', FALSE, '2026-10-24 18:30:00'),
  (3, 2, 'Si lo compró en la campaña de verano, se puede ampliar 1 mes.', TRUE, '2026-10-24 18:31:00'),
  (4, 4, '¿Podemos pasar la partida del sábado al domingo a la misma hora?', FALSE, '2026-10-26 18:02:00'),
  (4, 2, '¡Hola Lucía! El domingo a las 18:00 está libre. ¿Seguís siendo 5 personas?', FALSE, '2026-10-26 19:12:00'),
  (5, 6, 'Somos dos adultos y dos niños de 10 y 12 años.', FALSE, '2026-10-27 09:10:00');

INSERT INTO ticket_status_history (ticket_id, changed_by_id, old_status, new_status, changed_at) VALUES
  (1, 4, NULL, 'abierto', '2026-10-12 10:15:00'),
  (1, 1, 'abierto', 'resuelto', '2026-10-12 13:00:00'),
  (1, 4, 'resuelto', 'cerrado', '2026-10-14 12:00:00'),
  (2, 5, NULL, 'abierto', '2026-10-19 09:30:00'),
  (2, 3, 'abierto', 'en_curso', '2026-10-19 10:00:00'),
  (2, 3, 'en_curso', 'resuelto', '2026-10-19 11:05:00'),
  (3, 4, NULL, 'abierto', '2026-10-24 17:45:00'),
  (3, 2, 'abierto', 'en_curso', '2026-10-24 18:00:00'),
  (3, 2, 'en_curso', 'pendiente_cliente', '2026-10-24 18:30:00'),
  (4, 4, NULL, 'abierto', '2026-10-26 18:02:00'),
  (4, 2, 'abierto', 'en_curso', '2026-10-26 19:10:00'),
  (5, 6, NULL, 'abierto', '2026-10-27 09:10:00');
