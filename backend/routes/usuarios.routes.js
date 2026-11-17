const express = require('express');
const ruta = express.Router();
const usuarioController = require('../controller/usuario.controller');
const { verificarToken, permitirRoles } = require('../middleware/auth.middleware');

//Todas necesitan sesión
ruta.use(verificarToken);

/**
 * @swagger
 * /users/me:
 *   get:
 *     tags: [Perfil]
 *     summary: Ver mi perfil
 *     description: Cualquier rol con sesión.
 *     security: [{ token: [] }]
 *     responses:
 *       "200": { description: Mis datos, content: { application/json: { schema: { $ref: "#/components/schemas/Usuario" } } } }
 *       "401": { $ref: "#/components/responses/SinSesion" }
 *   put:
 *     tags: [Perfil]
 *     summary: Editar mi nombre y email
 *     description: Cualquier rol con sesión. El rol no se puede cambiar desde aquí.
 *     security: [{ token: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 100 }
 *               email: { type: string, format: email }
 *     responses:
 *       "200": { description: Perfil actualizado, content: { application/json: { schema: { $ref: "#/components/schemas/Usuario" } } } }
 *       "400": { $ref: "#/components/responses/DatosInvalidos" }
 *       "401": { $ref: "#/components/responses/SinSesion" }
 *       "409": { $ref: "#/components/responses/Conflicto" }
 */
ruta.get("/me", usuarioController.getMe);
ruta.put("/me", usuarioController.updateMe);

/**
 * @swagger
 * /users/me/password:
 *   put:
 *     tags: [Perfil]
 *     summary: Cambiar mi contraseña
 *     description: Pide la contraseña actual. Cualquier rol con sesión.
 *     security: [{ token: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [actual, nueva]
 *             properties:
 *               actual: { type: string }
 *               nueva: { type: string, minLength: 8, description: Mínimo 8 caracteres y al menos un número }
 *     responses:
 *       "204": { description: Contraseña cambiada }
 *       "400": { $ref: "#/components/responses/DatosInvalidos" }
 *       "401": { $ref: "#/components/responses/SinSesion" }
 */
ruta.put("/me/password", usuarioController.changeMyPassword);

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Usuarios]
 *     summary: Listar usuarios
 *     description: |
 *       Solo admin, con filtros. Cliente y agente: 403.
 *     security: [{ token: [] }]
 *     parameters:
 *       - { name: role, in: query, schema: { $ref: "#/components/schemas/Rol" }, description: Filtrar por rol }
 *       - { name: q, in: query, schema: { type: string }, description: Buscar en nombre o email }
 *     responses:
 *       "200": { description: Lista de usuarios, content: { application/json: { schema: { type: array, items: { $ref: "#/components/schemas/Usuario" } } } } }
 *       "400": { $ref: "#/components/responses/DatosInvalidos" }
 *       "401": { $ref: "#/components/responses/SinSesion" }
 *       "403": { $ref: "#/components/responses/Prohibido" }
 */
ruta.get("/", permitirRoles("admin"), usuarioController.getUsers);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     tags: [Usuarios]
 *     summary: Cambiar el rol de un usuario o activarlo/desactivarlo
 *     description: Solo admin. Un admin no puede cambiarse su propio rol ni desactivarse (409).
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
 *               role: { $ref: "#/components/schemas/Rol" }
 *               is_active: { type: boolean }
 *     responses:
 *       "200": { description: Usuario actualizado, content: { application/json: { schema: { $ref: "#/components/schemas/Usuario" } } } }
 *       "400": { $ref: "#/components/responses/DatosInvalidos" }
 *       "401": { $ref: "#/components/responses/SinSesion" }
 *       "403": { $ref: "#/components/responses/Prohibido" }
 *       "404": { $ref: "#/components/responses/NoEncontrado" }
 *       "409": { $ref: "#/components/responses/Conflicto" }
 */
ruta.patch("/:id", permitirRoles("admin"), usuarioController.updateUser);

module.exports = ruta;
