SET NAMES utf8mb4;
DROP DATABASE IF EXISTS noexitrooms;
CREATE DATABASE noexitrooms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'noexitrooms'@'localhost' IDENTIFIED BY 'cambia-esto';
GRANT ALL PRIVILEGES ON noexitrooms.* TO 'noexitrooms'@'localhost';
USE noexitrooms;

CREATE TABLE usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  hash_contrasena VARCHAR(255) NOT NULL,
  rol ENUM('cliente', 'agente', 'admin') NOT NULL DEFAULT 'cliente',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE salas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(120) NOT NULL UNIQUE,
  tematica VARCHAR(50) NOT NULL,
  dificultad TINYINT UNSIGNED NOT NULL,
  duracion_min SMALLINT UNSIGNED NOT NULL,
  jugadores_min TINYINT UNSIGNED NOT NULL,
  jugadores_max TINYINT UNSIGNED NOT NULL,
  precio_persona DECIMAL(6,2) NOT NULL,
  descripcion TEXT NOT NULL,
  lema VARCHAR(150),
  edad_minima TINYINT UNSIGNED NOT NULL DEFAULT 0,
  pruebas TEXT,
  url_imagen VARCHAR(255),
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  activa BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE reservas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT UNSIGNED NOT NULL,
  sala_id INT UNSIGNED NOT NULL,
  fecha_hora DATETIME NOT NULL,
  jugadores TINYINT UNSIGNED NOT NULL,
  estado ENUM('pendiente', 'confirmada', 'cancelada') NOT NULL DEFAULT 'pendiente',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
  FOREIGN KEY (sala_id) REFERENCES salas(id),
  UNIQUE (sala_id, fecha_hora)
);

CREATE TABLE tickets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT UNSIGNED NOT NULL,
  agente_id INT UNSIGNED,
  categoria_id INT UNSIGNED NOT NULL,
  sala_id INT UNSIGNED,
  reserva_id INT UNSIGNED,
  asunto VARCHAR(150) NOT NULL,
  descripcion TEXT NOT NULL,
  prioridad ENUM('baja', 'media', 'alta') NOT NULL DEFAULT 'media',
  estado ENUM('abierto', 'en_curso', 'pendiente_cliente', 'resuelto', 'cerrado') NOT NULL DEFAULT 'abierto',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cerrado_en DATETIME,
  FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
  FOREIGN KEY (agente_id) REFERENCES usuarios(id),
  FOREIGN KEY (categoria_id) REFERENCES categorias(id),
  FOREIGN KEY (sala_id) REFERENCES salas(id),
  FOREIGN KEY (reserva_id) REFERENCES reservas(id)
);

CREATE TABLE mensajes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT UNSIGNED NOT NULL,
  autor_id INT UNSIGNED NOT NULL,
  texto TEXT NOT NULL,
  nota_interna BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (autor_id) REFERENCES usuarios(id)
);

CREATE TABLE historial_estados (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT UNSIGNED NOT NULL,
  autor_id INT UNSIGNED NOT NULL,
  estado_anterior ENUM('abierto', 'en_curso', 'pendiente_cliente', 'resuelto', 'cerrado'),
  estado_nuevo ENUM('abierto', 'en_curso', 'pendiente_cliente', 'resuelto', 'cerrado') NOT NULL,
  fecha_cambio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (autor_id) REFERENCES usuarios(id)
);

INSERT INTO usuarios (id, nombre, email, hash_contrasena, rol) VALUES
(1, 'Florentino Pérez', 'admin@noexitrooms.test', '$2b$10$MmIX7ggb5lxY8Eys0r73NuxeYP3YbFQCIwa3Fa.Rm1ptprhcJiXBm', 'admin'),
(2, 'José Luis Ábalos', 'abalos@noexitrooms.test', '$2b$10$MmIX7ggb5lxY8Eys0r73NuxeYP3YbFQCIwa3Fa.Rm1ptprhcJiXBm', 'agente'),
(3, 'Sergio Ramos', 'ramos@noexitrooms.test', '$2b$10$MmIX7ggb5lxY8Eys0r73NuxeYP3YbFQCIwa3Fa.Rm1ptprhcJiXBm', 'agente'),
(4, 'Pedro Sánchez', 'pedro@ejemplo.test', '$2b$10$MmIX7ggb5lxY8Eys0r73NuxeYP3YbFQCIwa3Fa.Rm1ptprhcJiXBm', 'cliente'),
(5, 'Cristiano Ronaldo', 'cristiano@ejemplo.test', '$2b$10$MmIX7ggb5lxY8Eys0r73NuxeYP3YbFQCIwa3Fa.Rm1ptprhcJiXBm', 'cliente'),
(6, 'Rosalía', 'rosalia@ejemplo.test', '$2b$10$MmIX7ggb5lxY8Eys0r73NuxeYP3YbFQCIwa3Fa.Rm1ptprhcJiXBm', 'cliente'),
(7, 'Santiago Abascal', 'abascal@ejemplo.test', '$2b$10$MmIX7ggb5lxY8Eys0r73NuxeYP3YbFQCIwa3Fa.Rm1ptprhcJiXBm', 'cliente');

INSERT INTO salas (id, nombre, slug, tematica, dificultad, duracion_min, jugadores_min, jugadores_max, precio_persona, descripcion, lema, edad_minima, pruebas, url_imagen) VALUES
(1, 'La acampada de Sol', 'la-acampada-de-sol', 'Humor', 4, 60, 2, 6, 22.00, 'Llegasteis a la acampada de la Puerta del Sol solo para ver qué tal y ahora sois de la comisión de logística. Para iros hay que aprobar vuestra salida en asamblea.', 'La asamblea no se disuelve hasta que haya consenso. Y nunca hay consenso.', 14, 'Conseguir el turno de palabra en una asamblea sin fin\nMontar la tienda de campaña con las instrucciones de otra tienda\nReunir los votos de todas las comisiones', 'img/salas/la-acampada-de-sol/principal.webp'),
(2, 'El almacén de las mascarillas', 'el-almacen-de-las-mascarillas', 'Humor', 3, 60, 3, 6, 20.00, 'Una nave llena de cajas de mascarillas compradas por la vía rápida. Encontrad la caja buena y cuadrad las facturas antes de que llegue la UCO. Sala de humor: personajes caricaturizados y ficticios.', 'Mil cajas de mascarillas. Solo una es la buena. La UCO llega en 60 minutos.', 12, 'Encontrar la caja buena entre cientos de cajas iguales\nCuadrar las facturas de la oficina de los archivadores\nDescifrar la agenda de llamadas antes de que suene el timbre', 'img/salas/el-almacen-de-las-mascarillas/principal.webp'),
(3, 'El manicomio de San Tomás', 'el-manicomio-de-san-tomas', 'Terror', 5, 150, 4, 7, 26.00, 'En 1974 el pabellón C era el centro de cálculo donde encerraban a los programadores de COBOL. El hermano Tomás dejó un programa a medias y esta noche el mainframe se ha vuelto a encender. Solo mayores de 18.', 'IDENTIFICATION DIVISION. PROGRAM-ID. SALIR. Nadie lo ha compilado nunca.', 18, 'Ordenar las tarjetas perforadas del programa del hermano Tomás\nEncontrar el punto que falta en la PROCEDURE DIVISION\nCompilar el programa SALIR antes de que se apague la luz', 'img/salas/el-manicomio-de-san-tomas/principal.webp'),
(4, 'El despertar del Perro', 'el-despertar-del-perro', 'Humor', 2, 60, 2, 5, 18.00, 'El Presidente se despierta en La Moncloa sin apoyos y con una moción de censura a las 12:00. Su equipo de confianza ha desaparecido con las piezas del plan. Sala de humor: personajes caricaturizados y ficticios.', 'Manual de resistencia: 60 minutos para seguir en el sillón.', 8, 'Encontrar a Ábalos, a Koldo y a Santos Cerdán por el palacio\nSuperar la prueba de la cátedra\nTocar la partitura del hermano músico', 'img/salas/el-despertar-del-perro/principal.webp'),
(5, 'Operación David', 'operacion-david', 'Espionaje', 4, 75, 3, 6, 24.00, 'Quedan 75 minutos para la entrega del proyecto trimestral y el agente David solo acepta un trabajo perfecto. Recuperad el código, desplegadlo y entregádselo a tiempo.', 'Un proyecto. Un profesor. Ni un solo localhost.', 14, 'Recuperar el repositorio de una memoria USB cifrada\nDesplegar la web sin un solo localhost\nDocumentar la API con Swagger antes de la entrega', 'img/salas/operacion-david/principal.webp'),
(6, 'El camarote del capitán Eduardo "El Panzas"', 'el-camarote-del-capitan-eduardo-el-panzas', 'Aventura', 1, 45, 2, 4, 16.00, 'El barco se hunde y el capitán Eduardo ha escondido la llave del bote salvavidas en algún lugar del camarote. La despensa, eso sí, está vacía.', 'El barco se hunde. La llave está en la despensa. La despensa está vacía.', 6, 'Leer el cuaderno de bitácora del capitán\nAbrir el baúl con la combinación correcta\nEncontrar la llave del bote salvavidas', 'img/salas/el-camarote-del-capitan-eduardo-el-panzas/principal.webp');

INSERT INTO categorias (id, nombre) VALUES
(1, 'Reservas y cambios de fecha'),
(2, 'Bonos y tarjetas regalo'),
(3, 'Grupos y eventos de empresa'),
(4, 'Objetos perdidos'),
(5, 'Reclamaciones sobre la experiencia'),
(6, 'Cuenta y acceso');

INSERT INTO reservas (id, cliente_id, sala_id, fecha_hora, jugadores, estado) VALUES
(1, 4, 1, '2026-10-31 18:00:00', 5, 'confirmada'),
(2, 5, 2, '2026-10-18 20:00:00', 4, 'confirmada'),
(3, 6, 3, '2026-10-31 19:30:00', 6, 'confirmada'),
(4, 5, 1, '2026-10-30 20:00:00', 4, 'confirmada'),
(5, 6, 5, '2026-11-01 18:00:00', 3, 'pendiente'),
(6, 5, 4, '2026-10-29 18:00:00', 2, 'confirmada'),
(7, 4, 3, '2026-11-02 16:00:00', 5, 'confirmada');

INSERT INTO tickets (id, cliente_id, agente_id, categoria_id, sala_id, reserva_id, asunto, descripcion, prioridad, estado, creado_en, cerrado_en) VALUES
(1, 4, NULL, 3, NULL, NULL, 'Presupuesto para cumpleaños de 12 personas', '¿Podemos dividirnos en dos salas a la vez?', 'baja', 'cerrado', '2026-10-12 10:15:00', '2026-10-14 12:00:00'),
(2, 5, 3, 4, 2, 2, 'Me dejé las gafas en El almacén de las mascarillas', 'Son unas gafas negras de pasta, creo que en la oficina de los archivadores.', 'media', 'resuelto', '2026-10-19 09:30:00', NULL),
(3, 4, 2, 2, NULL, NULL, 'El código del bono regalo no funciona', 'Al canjear el código BONO-7731 me dice que no es válido.', 'alta', 'pendiente_cliente', '2026-10-24 17:45:00', NULL),
(4, 4, 2, 1, 1, 1, 'Cambio de fecha de la partida del sábado', '¿Podemos pasar la partida del sábado al domingo a la misma hora?', 'media', 'en_curso', '2026-10-26 18:02:00', NULL),
(5, 6, NULL, 1, NULL, NULL, '¿Se puede jugar con niños de 10 años?', 'Somos dos adultos y dos niños de 10 y 12 años.', 'baja', 'abierto', '2026-10-27 09:10:00', NULL);

INSERT INTO mensajes (ticket_id, autor_id, texto, nota_interna, creado_en) VALUES
(1, 4, '¿Podemos dividirnos en dos salas a la vez?', FALSE, '2026-10-12 10:15:00'),
(1, 1, 'Sí, os reservamos El despertar del Perro y El almacén de las mascarillas a la misma hora. Os enviamos el presupuesto por aquí.', FALSE, '2026-10-12 13:00:00'),
(2, 5, 'Son unas gafas negras de pasta, creo que en la oficina de los archivadores.', FALSE, '2026-10-19 09:30:00'),
(2, 3, 'Las tenemos en recepción. Puedes pasar a recogerlas cuando quieras.', FALSE, '2026-10-19 11:05:00'),
(3, 4, 'Al canjear el código BONO-7731 me dice que no es válido.', FALSE, '2026-10-24 17:45:00'),
(3, 2, 'El bono caducó el 30/09. Revisa si tienes otro código o mándanos foto del bono.', FALSE, '2026-10-24 18:30:00'),
(3, 2, 'Si lo compró en la campaña de verano, se puede ampliar 1 mes.', TRUE, '2026-10-24 18:31:00'),
(4, 4, '¿Podemos pasar la partida del sábado al domingo a la misma hora?', FALSE, '2026-10-26 18:02:00'),
(4, 2, '¡Hola Pedro! El domingo a las 18:00 está libre. ¿Seguís siendo 5 personas?', FALSE, '2026-10-26 19:12:00'),
(5, 6, 'Somos dos adultos y dos niños de 10 y 12 años.', FALSE, '2026-10-27 09:10:00');

INSERT INTO historial_estados (ticket_id, autor_id, estado_anterior, estado_nuevo, fecha_cambio) VALUES
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
