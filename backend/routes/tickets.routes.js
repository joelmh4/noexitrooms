const express = require('express');
const ruta = express.Router();
const ticketController = require('../controller/ticket.controller');
const { verificarToken, permitirRoles } = require('../middleware/auth.middleware');

//Todas necesitan sesión. Lo que ve cada rol y si el ticket es suyo se comprueba en el controlador.
ruta.use(verificarToken);

/**
 * @swagger
 * /tickets:
 *   get:
 *     tags: [Tickets]
 *     summary: Listar los tickets que puedo ver
 *     description: Cada rol recibe solo lo suyo (ver la etiqueta Tickets). Los filtros se suman.
 *     security: [{ token: [] }]
 *     parameters:
 *       - { name: status, in: query, schema: { $ref: "#/components/schemas/Estado" } }
 *       - { name: priority, in: query, schema: { $ref: "#/components/schemas/Prioridad" } }
 *       - { name: category_id, in: query, schema: { type: integer } }
 *       - { name: customer_id, in: query, schema: { type: integer } }
 *       - { name: agent_id, in: query, schema: { type: string }, description: "Id del agente o `ninguno` para los que están sin asignar" }
 *       - { name: q, in: query, schema: { type: string }, description: "Busca en asunto y descripción, o por código (NXR-0004)" }
 *       - { name: orden, in: query, schema: { type: string, enum: [recientes, antiguos, prioridad], default: recientes } }
 *     responses:
 *       "200": { description: Tickets, content: { application/json: { schema: { type: array, items: { $ref: "#/components/schemas/Ticket" } } } } }
 *       "400": { $ref: "#/components/responses/DatosInvalidos" }
 *       "401": { $ref: "#/components/responses/SinSesion" }
 *   post:
 *     tags: [Tickets]
 *     summary: Abrir un ticket
 *     description: |
 *       Cliente o admin. Nace en estado `abierto`; la descripción se guarda también como primer mensaje.
 *       El admin puede abrirlo en nombre de un cliente con `customer_id`. Si se indica `booking_id`,
 *       la reserva tiene que ser del cliente y la sala se toma de ella.
 *     security: [{ token: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, description, category_id]
 *             properties:
 *               subject: { type: string, minLength: 5, maxLength: 150, example: Cambio de fecha de la partida }
 *               description: { type: string, minLength: 20, maxLength: 2000, example: ¿Podemos pasarla al domingo a la misma hora? }
 *               category_id: { type: integer, example: 1 }
 *               priority: { allOf: [{ $ref: "#/components/schemas/Prioridad" }], default: media }
 *               room_id: { type: integer, nullable: true }
 *               booking_id: { type: integer, nullable: true }
 *               customer_id: { type: integer, description: Solo admin }
 *     responses:
 *       "201": { description: Ticket creado, content: { application/json: { schema: { $ref: "#/components/schemas/TicketDetalle" } } } }
 *       "400": { $ref: "#/components/responses/DatosInvalidos" }
 *       "401": { $ref: "#/components/responses/SinSesion" }
 *       "403": { $ref: "#/components/responses/Prohibido" }
 */
ruta.get("/", ticketController.findAll);
ruta.post("/", permitirRoles("cliente", "admin"), ticketController.create);

/**
 * @swagger
 * /tickets/{id}:
 *   parameters: [{ $ref: "#/components/parameters/IdTicket" }]
 *   get:
 *     tags: [Tickets]
 *     summary: Ver un ticket con sus mensajes y su historial
 *     security: [{ token: [] }]
 *     responses:
 *       "200": { description: Ticket, content: { application/json: { schema: { $ref: "#/components/schemas/TicketDetalle" } } } }
 *       "401": { $ref: "#/components/responses/SinSesion" }
 *       "404": { $ref: "#/components/responses/NoEncontrado" }
 *   patch:
 *     tags: [Tickets]
 *     summary: Cambiar la prioridad o la categoría
 *     description: El agente que lleva el ticket o el admin.
 *     security: [{ token: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               priority: { $ref: "#/components/schemas/Prioridad" }
 *               category_id: { type: integer }
 *     responses:
 *       "200": { description: Ticket actualizado, content: { application/json: { schema: { $ref: "#/components/schemas/TicketDetalle" } } } }
 *       "400": { $ref: "#/components/responses/DatosInvalidos" }
 *       "401": { $ref: "#/components/responses/SinSesion" }
 *       "403": { $ref: "#/components/responses/Prohibido" }
 *       "404": { $ref: "#/components/responses/NoEncontrado" }
 */
ruta.get("/:id", ticketController.findById);
ruta.patch("/:id", permitirRoles("agente", "admin"), ticketController.updateById);

/**
 * @swagger
 * /tickets/{id}/messages:
 *   parameters: [{ $ref: "#/components/parameters/IdTicket" }]
 *   post:
 *     tags: [Tickets]
 *     summary: Responder en un ticket
 *     description: |
 *       El cliente del ticket, el agente que lo lleva o el admin. `is_internal: true` es una nota que el cliente
 *       no ve (solo equipo). Si el cliente contesta a un ticket `pendiente_cliente`, vuelve a `en_curso`.
 *       En un ticket cerrado responde 409.
 *     security: [{ token: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [body]
 *             properties:
 *               body: { type: string, maxLength: 5000, example: El domingo a las 18:00 está libre. }
 *               is_internal: { type: boolean, default: false }
 *     responses:
 *       "201": { description: Mensaje guardado; devuelve el ticket actualizado, content: { application/json: { schema: { $ref: "#/components/schemas/TicketDetalle" } } } }
 *       "400": { $ref: "#/components/responses/DatosInvalidos" }
 *       "401": { $ref: "#/components/responses/SinSesion" }
 *       "403": { $ref: "#/components/responses/Prohibido" }
 *       "404": { $ref: "#/components/responses/NoEncontrado" }
 *       "409": { $ref: "#/components/responses/Conflicto" }
 */
ruta.post("/:id/messages", ticketController.addMessage);

/**
 * @swagger
 * /tickets/{id}/status:
 *   parameters: [{ $ref: "#/components/parameters/IdTicket" }]
 *   patch:
 *     tags: [Tickets]
 *     summary: Cambiar el estado
 *     description: |
 *       Cada cambio queda en el historial con quién y cuándo.
 *       - Cliente: de `resuelto` a `cerrado` (confirma el cierre) o a `abierto` (pide reabrir).
 *       - Agente que lo lleva: cualquier estado menos `cerrado`, y no puede reabrir uno cerrado.
 *       - Admin: cualquier cambio.
 *     security: [{ token: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { $ref: "#/components/schemas/Estado" }
 *     responses:
 *       "200": { description: Estado cambiado, content: { application/json: { schema: { $ref: "#/components/schemas/TicketDetalle" } } } }
 *       "400": { $ref: "#/components/responses/DatosInvalidos" }
 *       "401": { $ref: "#/components/responses/SinSesion" }
 *       "403": { $ref: "#/components/responses/Prohibido" }
 *       "404": { $ref: "#/components/responses/NoEncontrado" }
 */
ruta.patch("/:id/status", ticketController.updateStatus);

/**
 * @swagger
 * /tickets/{id}/assign:
 *   parameters: [{ $ref: "#/components/parameters/IdTicket" }]
 *   patch:
 *     tags: [Tickets]
 *     summary: Asignar o reasignar el ticket
 *     description: Solo admin. Asigna el ticket a cualquier agente activo (o `null` para dejarlo sin asignar). Cliente y agente, 403.
 *     security: [{ token: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [agent_id]
 *             properties:
 *               agent_id: { type: integer, nullable: true, example: 2 }
 *     responses:
 *       "200": { description: Ticket asignado, content: { application/json: { schema: { $ref: "#/components/schemas/TicketDetalle" } } } }
 *       "400": { $ref: "#/components/responses/DatosInvalidos" }
 *       "401": { $ref: "#/components/responses/SinSesion" }
 *       "403": { $ref: "#/components/responses/Prohibido" }
 *       "404": { $ref: "#/components/responses/NoEncontrado" }
 */
ruta.patch("/:id/assign", permitirRoles("admin"), ticketController.assign);

module.exports = ruta;
