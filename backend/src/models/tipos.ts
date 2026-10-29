// Tipos del dominio, iguales a las tablas de sql/esquema.sql

export type Rol = "cliente" | "agente" | "admin";
export const ROLES: readonly Rol[] = ["cliente", "agente", "admin"];

export type EstadoTicket = "abierto" | "en_curso" | "pendiente_cliente" | "resuelto" | "cerrado";
export const ESTADOS: readonly EstadoTicket[] = ["abierto", "en_curso", "pendiente_cliente", "resuelto", "cerrado"];

export type Prioridad = "baja" | "media" | "alta";
export const PRIORIDADES: readonly Prioridad[] = ["baja", "media", "alta"];

export type EstadoReserva = "pendiente" | "confirmada" | "cancelada";

export interface Usuario {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: Rol;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Lo que se puede enviar al frontend: nunca el hash
export type UsuarioPublico = Pick<Usuario, "id" | "name" | "email" | "role" | "is_active" | "created_at">;

export interface Sala {
  id: number;
  name: string;
  slug: string;
  theme: string;
  difficulty: number;
  duration_min: number;
  min_players: number;
  max_players: number;
  price_per_person: number; // DECIMAL llega como texto desde mysql2: se pasa a número al leerlo
  description: string;
  tagline: string | null;
  min_age: number;
  image_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Categoria {
  id: number;
  name: string;
  is_active: boolean;
}

export interface Reserva {
  id: number;
  customer_id: number;
  room_id: number;
  starts_at: Date;
  players: number;
  status: EstadoReserva;
  created_at: Date;
}

export interface Ticket {
  id: number;
  customer_id: number;
  agent_id: number | null;
  category_id: number;
  room_id: number | null;
  booking_id: number | null;
  subject: string;
  description: string;
  priority: Prioridad;
  status: EstadoTicket;
  created_at: Date;
  updated_at: Date;
  closed_at: Date | null;
}

export interface MensajeTicket {
  id: number;
  ticket_id: number;
  author_id: number;
  body: string;
  is_internal: boolean;
  created_at: Date;
}

export interface CambioEstado {
  id: number;
  ticket_id: number;
  changed_by_id: number;
  old_status: EstadoTicket | null;
  new_status: EstadoTicket;
  changed_at: Date;
}

// Código visible del ticket: NXR-0042
export const codigoTicket = (id: number) => `NXR-${String(id).padStart(4, "0")}`;
