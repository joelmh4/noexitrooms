const express = require('express');
const ruta = express.Router();
const usuarioController = require('../controller/usuario.controller');
const limitarIntentos = require('../middleware/limitarIntentos.middleware');

//Documentación: http://localhost:3000/api/docs

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Autenticación]
 *     summary: Crear una cuenta de cliente
 *     security: []
 *     description: |
 *       Pública. La cuenta nace SIEMPRE con rol `cliente`: si el cuerpo trae `role`, se ignora.
 *       La contraseña se guarda con bcrypt. Devuelve la sesión ya iniciada.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 100, example: Carla Sanz }
 *               email: { type: string, format: email, example: carla@ejemplo.test }
 *               password: { type: string, minLength: 8, description: Mínimo 8 caracteres y al menos un número, example: Secreta123 }
 *     responses:
 *       "201": { description: Cuenta creada, content: { application/json: { schema: { $ref: "#/components/schemas/Sesion" } } } }
 *       "400": { $ref: "#/components/responses/DatosInvalidos" }
 *       "409": { $ref: "#/components/responses/Conflicto" }
 */
ruta.post("/register", usuarioController.signUp);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Autenticación]
 *     summary: Iniciar sesión
 *     security: []
 *     description: |
 *       Pública. Devuelve un token JWT y los datos del usuario. Tras 10 intentos fallidos en 15 minutos
 *       para el mismo email y la misma IP responde 429.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: pedro@ejemplo.test }
 *               password: { type: string, example: Demo1234! }
 *     responses:
 *       "200": { description: Sesión iniciada, content: { application/json: { schema: { $ref: "#/components/schemas/Sesion" } } } }
 *       "400": { $ref: "#/components/responses/DatosInvalidos" }
 *       "401": { $ref: "#/components/responses/SinSesion" }
 *       "403": { $ref: "#/components/responses/Prohibido" }
 *       "429": { description: Demasiados intentos fallidos }
 */
ruta.post("/login", limitarIntentos, usuarioController.logIn);

module.exports = ruta;
