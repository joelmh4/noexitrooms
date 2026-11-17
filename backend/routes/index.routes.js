// Todas las rutas de la API cuelgan de /api. Cada módulo tiene su archivo.
const express = require('express');
const ruta = express.Router();
const { salud } = require('../controller/salud.controller');
const estadisticaController = require('../controller/estadistica.controller');
const { verificarToken, permitirRoles } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Sistema]
 *     summary: Estado de la API y de la conexión con la base de datos
 *     security: []
 *     description: No necesita sesión. Devuelve 503 si la API no llega a MySQL.
 *     responses:
 *       "200":
 *         description: Todo funciona
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 api: { type: string, example: ok }
 *                 baseDeDatos: { type: string, example: ok }
 *                 hora: { type: string, format: date-time }
 *       "503":
 *         description: La base de datos no responde
 */
ruta.get("/health", salud);

ruta.use("/auth", require('./auth.routes'));
ruta.use("/users", require('./usuarios.routes'));
ruta.use("/categories", require('./categorias.routes'));
ruta.use("/tickets", require('./tickets.routes'));
ruta.use("/rooms", require('./salas.routes'));
ruta.use("/bookings", require('./reservas.routes'));

/**
 * @swagger
 * /stats:
 *   get:
 *     tags: [Panel]
 *     summary: Métricas del panel
 *     description: |
 *       Agente: solo las de sus tickets. Admin: las de todo el equipo, los tickets sin asignar,
 *       con la carga de cada agente y las reservas. Cliente: 403.
 *       `activos` son los tickets abiertos, en curso o pendientes del cliente.
 *     security: [{ token: [] }]
 *     responses:
 *       "200":
 *         description: Métricas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tickets:
 *                   type: object
 *                   properties:
 *                     total: { type: integer, example: 5 }
 *                     activos: { type: integer, example: 3 }
 *                     por_estado:
 *                       type: object
 *                       properties:
 *                         abierto: { type: integer }
 *                         en_curso: { type: integer }
 *                         pendiente_cliente: { type: integer }
 *                         resuelto: { type: integer }
 *                         cerrado: { type: integer }
 *                     activos_por_prioridad:
 *                       type: object
 *                       properties: { baja: { type: integer }, media: { type: integer }, alta: { type: integer } }
 *                     por_categoria:
 *                       type: array
 *                       items: { type: object, properties: { id: { type: integer }, name: { type: string }, n: { type: integer } } }
 *                     sin_asignar:
 *                       type: object
 *                       description: Solo admin. Tickets sin agente que no están cerrados
 *                       properties: { total: { type: integer }, alta: { type: integer } }
 *                     horas_medias_hasta_resolver: { type: number, nullable: true, example: 2.2, description: Desde que se abre hasta el primer «resuelto» }
 *                     creados_ultimos_7_dias:
 *                       type: array
 *                       items: { type: object, properties: { dia: { type: string, example: "2026-10-27" }, n: { type: integer } } }
 *                 agentes:
 *                   type: array
 *                   description: Solo admin
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       name: { type: string }
 *                       activos: { type: integer }
 *                       pendientes_cliente: { type: integer }
 *                       resueltos: { type: integer }
 *                 reservas:
 *                   type: object
 *                   description: Solo admin
 *                   properties:
 *                     pendientes_de_confirmar: { type: integer }
 *                     proximos_7_dias: { type: integer }
 *       "401": { $ref: "#/components/responses/SinSesion" }
 *       "403": { $ref: "#/components/responses/Prohibido" }
 */
ruta.get("/stats", verificarToken, permitirRoles("agente", "admin"), estadisticaController.resumen);

module.exports = ruta;
