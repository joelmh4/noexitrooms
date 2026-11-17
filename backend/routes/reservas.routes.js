const express = require('express');
const ruta = express.Router();
const reservaController = require('../controller/reserva.controller');
const { verificarToken, permitirRoles } = require('../middleware/auth.middleware');

//Todas necesitan sesión
ruta.use(verificarToken);

/**
 * @swagger
 * /bookings:
 *   get:
 *     tags: [Reservas]
 *     summary: Todas las reservas (equipo)
 *     description: Agente o admin.
 *     security: [{ token: [] }]
 *     parameters:
 *       - { name: status, in: query, schema: { type: string, enum: [pendiente, confirmada, cancelada] } }
 *       - { name: room_id, in: query, schema: { type: integer } }
 *       - { name: from, in: query, schema: { type: string, example: "2026-10-29" } }
 *     responses:
 *       "200": { description: Reservas, content: { application/json: { schema: { type: array, items: { $ref: "#/components/schemas/Reserva" } } } } }
 *       "400": { $ref: "#/components/responses/DatosInvalidos" }
 *       "401": { $ref: "#/components/responses/SinSesion" }
 *       "403": { $ref: "#/components/responses/Prohibido" }
 *   post:
 *     tags: [Reservas]
 *     summary: Reservar una sala
 *     description: |
 *       Solo cliente. La hora tiene que ser un pase de la sala y no haber pasado, y los jugadores tienen que caber.
 *       Si otra persona tiene ese hueco responde 409.
 *     security: [{ token: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [room_id, starts_at, players]
 *             properties:
 *               room_id: { type: integer, example: 1 }
 *               starts_at: { type: string, example: "2026-11-07T18:00" }
 *               players: { type: integer, example: 4 }
 *     responses:
 *       "201": { description: Reserva creada (pendiente), content: { application/json: { schema: { $ref: "#/components/schemas/Reserva" } } } }
 *       "400": { $ref: "#/components/responses/DatosInvalidos" }
 *       "401": { $ref: "#/components/responses/SinSesion" }
 *       "403": { $ref: "#/components/responses/Prohibido" }
 *       "409": { $ref: "#/components/responses/Conflicto" }
 */
ruta.post("/", permitirRoles("cliente"), reservaController.create);
ruta.get("/", permitirRoles("agente", "admin"), reservaController.findAll);

/**
 * @swagger
 * /bookings/me:
 *   get:
 *     tags: [Reservas]
 *     summary: Mis reservas
 *     description: Solo cliente. De la más lejana a la más antigua.
 *     security: [{ token: [] }]
 *     responses:
 *       "200": { description: Reservas, content: { application/json: { schema: { type: array, items: { $ref: "#/components/schemas/Reserva" } } } } }
 *       "401": { $ref: "#/components/responses/SinSesion" }
 *       "403": { $ref: "#/components/responses/Prohibido" }
 */
ruta.get("/me", permitirRoles("cliente"), reservaController.findMine);

//El cliente solo puede cancelar las suyas (se comprueba en el controlador)
/**
 * @swagger
 * /bookings/{id}/status:
 *   patch:
 *     tags: [Reservas]
 *     summary: Confirmar o cancelar una reserva
 *     description: |
 *       Agente o admin: confirmar o cancelar. Cliente: solo cancelar una suya que no haya empezado (las de otros dan 404).
 *       Una reserva cancelada no se recupera; su hueco queda libre para otra reserva.
 *     security: [{ token: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [pendiente, confirmada, cancelada] }
 *     responses:
 *       "200": { description: Reserva actualizada, content: { application/json: { schema: { $ref: "#/components/schemas/Reserva" } } } }
 *       "400": { $ref: "#/components/responses/DatosInvalidos" }
 *       "401": { $ref: "#/components/responses/SinSesion" }
 *       "403": { $ref: "#/components/responses/Prohibido" }
 *       "404": { $ref: "#/components/responses/NoEncontrado" }
 *       "409": { $ref: "#/components/responses/Conflicto" }
 */
ruta.patch("/:id/status", reservaController.updateStatus);

module.exports = ruta;
