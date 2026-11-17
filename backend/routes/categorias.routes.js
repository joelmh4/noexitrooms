const express = require('express');
const ruta = express.Router();
const categoriaController = require('../controller/categoria.controller');
const { verificarToken, permitirRoles } = require('../middleware/auth.middleware');
const { pideTodas } = require('../utils/validacion');

//Pública; solo con ?all=1 exige sesión (y el controlador comprueba que sea admin)
const sesionSiPideTodas = (req, res, next) => (pideTodas(req.query.all) ? verificarToken(req, res, next) : next());

/**
 * @swagger
 * /categories:
 *   get:
 *     tags: [Categorías]
 *     summary: Listar categorías
 *     security: []
 *     description: Pública, solo las activas. Con `?all=1` también las desactivadas (solo admin).
 *     parameters:
 *       - { name: all, in: query, schema: { type: string, enum: ["1"] } }
 *     responses:
 *       "200": { description: Categorías, content: { application/json: { schema: { type: array, items: { $ref: "#/components/schemas/Categoria" } } } } }
 *       "401": { $ref: "#/components/responses/SinSesion" }
 *       "403": { $ref: "#/components/responses/Prohibido" }
 *   post:
 *     tags: [Categorías]
 *     summary: Crear una categoría
 *     description: Solo admin.
 *     security: [{ token: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, minLength: 3, maxLength: 80, example: Accesibilidad }
 *     responses:
 *       "201": { description: Creada, content: { application/json: { schema: { $ref: "#/components/schemas/Categoria" } } } }
 *       "400": { $ref: "#/components/responses/DatosInvalidos" }
 *       "401": { $ref: "#/components/responses/SinSesion" }
 *       "403": { $ref: "#/components/responses/Prohibido" }
 *       "409": { $ref: "#/components/responses/Conflicto" }
 */
ruta.get("/", sesionSiPideTodas, categoriaController.findAll);
ruta.post("/", verificarToken, permitirRoles("admin"), categoriaController.create);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     tags: [Categorías]
 *     summary: Renombrar o activar/desactivar una categoría
 *     description: Solo admin. Las categorías no se borran, se desactivan (los tickets antiguos la conservan).
 *     security: [{ token: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, minLength: 3, maxLength: 80 }
 *               is_active: { type: boolean }
 *     responses:
 *       "200": { description: Actualizada, content: { application/json: { schema: { $ref: "#/components/schemas/Categoria" } } } }
 *       "400": { $ref: "#/components/responses/DatosInvalidos" }
 *       "401": { $ref: "#/components/responses/SinSesion" }
 *       "403": { $ref: "#/components/responses/Prohibido" }
 *       "404": { $ref: "#/components/responses/NoEncontrado" }
 *       "409": { $ref: "#/components/responses/Conflicto" }
 */
ruta.put("/:id", verificarToken, permitirRoles("admin"), categoriaController.updateById);

module.exports = ruta;
