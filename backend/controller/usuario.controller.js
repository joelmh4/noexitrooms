// Registro, inicio de sesión, perfil propio y gestión de usuarios por el administrador
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const { Usuario } = require("../model");
const { ROLES } = require("../model/usuario.model");
const { firmarToken } = require("../middleware/auth.middleware");
const { ErrorApi } = require("../middleware/errores.middleware");
const v = require("../utils/validacion");

const COSTE_BCRYPT = 10;
// Hash de relleno: si el email no existe se compara igual, para que la respuesta tarde lo mismo
// y no se pueda averiguar qué emails están registrados midiendo el tiempo
const HASH_RELLENO = bcrypt.hashSync("relleno-no-valido", COSTE_BCRYPT);

// Mismo orden que antes: primero clientes, luego agentes y luego admins; dentro, por nombre
const ordenarPorRol = lista =>
    lista.sort((a, b) => ROLES.indexOf(a.role) - ROLES.indexOf(b.role) || a.name.localeCompare(b.name, "es"));

class UsuarioController {

    // POST /auth/register { name, email, password }
    async signUp(req, res) {
        const errores = {};
        const name = v.texto(errores, "name", req.body?.name, { min: 2, max: 100, nombre: "El nombre" });
        const email = v.email(errores, req.body?.email);
        const password = v.passwordNueva(errores, "password", req.body?.password);
        v.comprobar(errores);

        if (await Usuario.findOne({ where: { email } })) throw ErrorApi.conflicto("Ya existe una cuenta con ese email.");

        // req.body.role se ignora a propósito: nadie puede registrarse como agente o admin
        const passwordEncriptado = await bcrypt.hash(password, COSTE_BCRYPT);
        const usuario = await Usuario.create({ name, email, password_hash: passwordEncriptado, role: "cliente" });

        const datos = usuario.toJSON();
        return res.status(201).json({ token: firmarToken(datos), usuario: datos });
    }

    // POST /auth/login { email, password }
    async logIn(req, res) {
        const errores = {};
        const email = v.email(errores, req.body?.email);
        const password = typeof req.body?.password === "string" ? req.body.password : "";
        if (!password) errores.password = "Escribe tu contraseña.";
        v.comprobar(errores);

        //Con el scope "conPassword" pedimos también el hash, que el modelo oculta
        const user = await Usuario.scope("conPassword").findOne({ where: { email } });
        const isTruePassword = await bcrypt.compare(password, user ? user.password_hash : HASH_RELLENO);

        if (!user || !isTruePassword) throw ErrorApi.sinSesion("El email o la contraseña no son correctos.");
        if (!user.is_active) throw ErrorApi.prohibido("Esta cuenta está desactivada. Escríbenos desde Contacto.");

        const usuario = user.toJSON();
        return res.status(200).json({ token: firmarToken(usuario), usuario });
    }

    // GET /users/me
    async getMe(req, res) {
        return res.status(200).json(req.usuario);
    }

    // PUT /users/me { name, email }
    async updateMe(req, res) {
        const errores = {};
        const name = v.texto(errores, "name", req.body?.name, { min: 2, max: 100, nombre: "El nombre" });
        const email = v.email(errores, req.body?.email);
        v.comprobar(errores);

        if (await Usuario.findOne({ where: { email, id: { [Op.ne]: req.usuario.id } } })) {
            throw ErrorApi.conflicto("Ese email ya lo usa otra cuenta.");
        }
        await Usuario.update({ name, email }, { where: { id: req.usuario.id } });
        return res.status(200).json(await Usuario.findByPk(req.usuario.id));
    }

    // PUT /users/me/password { actual, nueva }
    async changeMyPassword(req, res) {
        const errores = {};
        const actual = typeof req.body?.actual === "string" ? req.body.actual : "";
        if (!actual) errores.actual = "Escribe tu contraseña actual.";
        const nueva = v.passwordNueva(errores, "nueva", req.body?.nueva);
        v.comprobar(errores);

        const user = await Usuario.scope("conPassword").findByPk(req.usuario.id);
        if (!user || !(await bcrypt.compare(actual, user.password_hash))) {
            throw ErrorApi.datosInvalidos({ actual: "La contraseña actual no es correcta." });
        }
        user.password_hash = await bcrypt.hash(nueva, COSTE_BCRYPT);
        await user.save();
        return res.status(204).end();
    }

    // GET /users?role=&q= · solo admin
    async getUsers(req, res) {
        const errores = {};
        const filtro = {};
        if (req.query.role) filtro.role = v.unoDe(errores, "role", req.query.role, ROLES);
        v.comprobar(errores);
        const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
        //Op.like = LIKE de SQL: busca el texto dentro del nombre o del email
        if (q) filtro[Op.or] = [{ name: { [Op.like]: `%${q}%` } }, { email: { [Op.like]: `%${q}%` } }];

        const result = await Usuario.findAll({ where: filtro });
        return res.status(200).json(ordenarPorRol(result.map(u => u.toJSON())));
    }

    // PATCH /users/:id { role?, is_active? } · solo admin
    async updateUser(req, res) {
        const id = v.idDeRuta(req.params.id);
        const errores = {};
        const cambios = {};
        if (req.body?.role !== undefined) cambios.role = v.unoDe(errores, "role", req.body.role, ROLES);
        if (req.body?.is_active !== undefined) {
            if (typeof req.body.is_active !== "boolean") errores.is_active = "Tiene que ser true o false.";
            else cambios.is_active = req.body.is_active;
        }
        if (!Object.keys(cambios).length && !Object.keys(errores).length) errores.cambios = "Envía role o is_active.";
        v.comprobar(errores);

        // Un admin no puede quitarse a sí mismo el rol ni desactivarse: la web se quedaría sin nadie que la administre
        if (id === req.usuario.id) throw ErrorApi.conflicto("No puedes cambiar tu propio rol ni desactivar tu cuenta.");

        const usuario = await Usuario.findByPk(id);
        if (!usuario) throw ErrorApi.noEncontrado("Ese usuario no existe.");
        await usuario.update(cambios);
        return res.status(200).json(usuario);
    }
}

module.exports = new UsuarioController();
