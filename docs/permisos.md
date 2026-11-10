# Permisos por rol

Hay tres roles: **cliente**, **agente** (soporte) y **administrador**. El visitante sin sesión solo ve la web pública. Todos los permisos los comprueba el backend en cada petición; la web solo esconde lo que el usuario no puede usar para que la pantalla tenga sentido.

## Cómo lo comprueba el backend

1. **`autenticar`** (`backend/src/middleware/autenticar.ts`) lee el token JWT de la cabecera `Authorization: Bearer ...`. Sin token, o con uno caducado o falso, responde **401**.
2. **`permitir(...roles)`** (`backend/src/middleware/permitir.ts`) mira el rol del usuario del token. Si no está en la lista de la ruta, responde **403**.
3. **Propiedad del recurso:** los servicios filtran por el usuario. Un cliente que pide un ticket que no es suyo, o un agente que pide uno que no tiene asignado, recibe **404**, igual que si no existiera, para no revelar qué tickets hay.

El registro público siempre crea la cuenta con rol cliente, aunque se envíe otro rol en la petición. Solo el administrador cambia roles, y no puede quitarse el suyo.

## Matriz de autorización

| Operación | Visitante | Cliente | Agente | Admin |
| --- | --- | --- | --- | --- |
| Ver la web pública y el catálogo de salas | Sí | Sí | Sí | Sí |
| Crear cuenta | Sí (siempre cliente) | No | No | No |
| Editar su perfil y contraseña | No | Sí | Sí | Sí |
| Reservar una sesión y ver sus reservas | No | Sí | No | No |
| Confirmar reservas | No | No | Sí | Sí |
| Abrir un ticket | No | Sí | No | Sí |
| Ver tickets | No | Solo los suyos | Solo los asignados a él | Todos |
| Responder un ticket | No | Solo los suyos | Solo los asignados a él | Todos |
| Escribir notas internas (el cliente no las ve) | No | No | Sí | Sí |
| Cambiar estado y prioridad | No | Cerrar un resuelto o pedir reabrirlo | En los suyos, sin cerrar | Todos los cambios |
| Asignar o reasignar tickets | No | No | No | Sí |
| Ver métricas del panel | No | No | Las de sus tickets | Todas |
| Gestionar usuarios y roles | No | No | No | Sí |
| Gestionar categorías de tickets | No | No | No | Sí |
| Crear, editar y borrar salas | No | No | No | Sí |

## Reglas del ciclo de un ticket

- Todo ticket nace **Abierto**.
- El agente puede pasarlo a **En curso**, **Pendiente del cliente** o **Resuelto**, y devolverlo a En curso. No puede cerrarlo.
- Si el cliente responde a un ticket en Pendiente del cliente, vuelve solo a **En curso**.
- Un ticket **Resuelto** lo cierra el cliente (confirmando) o el administrador. El cliente también puede pedir que se reabra.
- Cada cambio guarda quién lo hizo, cuándo, el estado anterior y el nuevo (`ticket_status_history`).

Una sala con tickets o reservas no se borra (409): se desactiva, para no perder el historial.
