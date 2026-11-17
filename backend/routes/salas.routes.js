const express = require('express');
const ruta = express.Router();
const salaController = require('../controller/sala.controller');
const { verificarToken, sesionOpcional, permitirRoles } = require('../middleware/auth.middleware');

//Públicas. Con sesión: ?all=1 (admin) y la marca "tuya" en los huecos.
/**
 * @swagger
 * /rooms:
 *   get:
 *     tags: [Salas]
 *     summary: Catálogo de salas
 *     description: Pública, solo las activas. Con `?all=1` también las desactivadas (solo admin, con token).
 *     security: []
 *     parameters:
 *       - { name: q, in: query, schema: { type: string }, description: "Busca en nombre, frase y descripción" }
 *       - { name: theme, in: query, schema: { type: string, example: Humor } }
 *       - { name: difficulty, in: query, schema: { type: integer, minimum: 1, maximum: 5 } }
 *       - { name: players, in: query, schema: { type: integer }, description: Salas en las que cabe ese número de jugadores }
 *       - { name: orden, in: query, schema: { type: string, enum: [nombre, dificultad, precio, duracion], default: nombre } }
 *       - { name: all, in: query, schema: { type: string, enum: ["1"] } }
 *     responses:
 *       "200": { description: Salas, content: { application/json: { schema: { type: array, items: { $ref: "#/components/schemas/Sala" } } } } }
 *       "400": { $ref: "#/components/responses/DatosInvalidos" }
 *       "403": { $ref: "#/components/responses/Prohibido" }
 *   post:
 *     tags: [Salas]
 *     summary: Crear una sala
 *     description: Solo admin. El slug se genera a partir del nombre.
 *     security: [{ token: [] }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: "#/components/schemas/DatosSala" } } } }
 *     responses:
 *       "201": { description: Sala creada, content: { application/json: { schema: { $ref: "#/components/schemas/Sala" } } } }
 *       "400": { $ref: "#/components/responses/DatosInvalidos" }
 *       "401": { $ref: "#/components/responses/SinSesion" }
 *       "403": { $ref: "#/components/responses/Prohibido" }
 *       "409": { $ref: "#/components/responses/Conflicto" }
 */
ruta.get("/", sesionOpcional, salaController.findAll);
ruta.post("/", verificarToken, permitirRoles("admin"), salaController.create);

/**
 * @swagger
 * /rooms/{id}/slots:
 *   get:
 *     tags: [Reservas]
 *     summary: Horarios de una sala con su disponibilidad
 *     description: |
 *       Pública. No dice quién ha reservado, solo `libre`, `ocupada` o `pasada`. Si se envía el token de un cliente,
 *       sus reservas salen como `tuya`. Pases: 10, 12, 16, 18, 20 y 22 h; las salas de más de 2 h, 10, 16 y 19:30.
 *     security: []
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: integer } }
 *       - { name: from, in: query, schema: { type: string, example: "2026-10-31" }, description: "Primer día (por defecto, hoy en Madrid)" }
 *       - { name: days, in: query, schema: { type: integer, minimum: 1, maximum: 31, default: 7 } }
 *     responses:
 *       "200":
 *         description: Días con sus horas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   fecha: { type: string, example: "2026-10-31" }
 *                   horas:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         hora: { type: string, example: "18:00" }
 *                         starts_at: { type: string, example: "2026-10-31T18:00:00" }
 *                         estado: { type: string, enum: [libre, ocupada, tuya, pasada] }
 *       "400": { $ref: "#/components/responses/DatosInvalidos" }
 *       "404": { $ref: "#/components/responses/NoEncontrado" }
 */
ruta.get("/:id/slots", sesionOpcional, salaController.findSlots);

/**
 * @swagger
 * /rooms/{id}:
 *   parameters:
 *     - { name: id, in: path, required: true, schema: { type: string, example: el-manicomio-de-san-tomas }, description: "Id numérico. En GET también vale el slug." }
 *   get:
 *     tags: [Salas]
 *     summary: Ver una sala activa
 *     description: Pública. Acepta el slug (`el-manicomio-de-san-tomas`) o el id.
 *     security: []
 *     responses:
 *       "200": { description: Sala, content: { application/json: { schema: { $ref: "#/components/schemas/Sala" } } } }
 *       "404": { $ref: "#/components/responses/NoEncontrado" }
 *   put:
 *     tags: [Salas]
 *     summary: Editar una sala
 *     description: Solo admin. Se envían todos los datos de la sala (también sirve para desactivarla con `is_active false`).
 *     security: [{ token: [] }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: "#/components/schemas/DatosSala" } } } }
 *     responses:
 *       "200": { description: Sala guardada, content: { application/json: { schema: { $ref: "#/components/schemas/Sala" } } } }
 *       "400": { $ref: "#/components/responses/DatosInvalidos" }
 *       "401": { $ref: "#/components/responses/SinSesion" }
 *       "403": { $ref: "#/components/responses/Prohibido" }
 *       "404": { $ref: "#/components/responses/NoEncontrado" }
 *       "409": { $ref: "#/components/responses/Conflicto" }
 *   delete:
 *     tags: [Salas]
 *     summary: Borrar una sala
 *     description: Solo admin. Si tiene tickets o reservas responde 409 y hay que desactivarla.
 *     security: [{ token: [] }]
 *     responses:
 *       "204": { description: Sala borrada }
 *       "401": { $ref: "#/components/responses/SinSesion" }
 *       "403": { $ref: "#/components/responses/Prohibido" }
 *       "404": { $ref: "#/components/responses/NoEncontrado" }
 *       "409": { $ref: "#/components/responses/Conflicto" }
 */
ruta.get("/:slug", salaController.findBySlug);
ruta.put("/:id", verificarToken, permitirRoles("admin"), salaController.updateById);
ruta.delete("/:id", verificarToken, permitirRoles("admin"), salaController.deleteById);

module.exports = ruta;
