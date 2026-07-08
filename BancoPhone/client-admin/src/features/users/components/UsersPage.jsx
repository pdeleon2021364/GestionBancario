import { useEffect, useMemo, useState } from "react";
import { useUserManagementStore } from "../store/useUserManagementStore.js";
import { useAuthStore } from "../../auth/store/authStore.js";
import { showError, showSuccess } from "../../../shared/utils/toast.js";

const getSafeImageUrl = (value) => {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.includes("default-avatar_ewzxwx")) return "";
  return /^(https?:|data:image\/)/i.test(trimmed) ? trimmed : "";
};

const normalizeUser = (user) => ({
  id: user?.id ?? user?.Id,
  name: user?.name ?? user?.Name ?? "",
  surname: user?.surname ?? user?.Surname ?? "",
  username: user?.username ?? user?.Username ?? "",
  email: user?.email ?? user?.Email ?? "",
  phone: user?.phone ?? user?.Phone ?? "",
  role: user?.role ?? user?.Role ?? "USER_ROLE",
  status: Boolean(user?.status ?? user?.Status),
  isEmailVerified: Boolean(user?.isEmailVerified ?? user?.IsEmailVerified),
  profilePicture: getSafeImageUrl(user?.profilePicture ?? user?.ProfilePicture),
  createdAt: user?.createdAt ?? user?.CreatedAt,
  updatedAt: user?.updatedAt ?? user?.UpdatedAt,
});

const formatDate = (value) => {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const UserAvatar = ({ user }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = (user?.name || user?.username || "U").slice(0, 1).toUpperCase();
  const imageUrl = !imageFailed ? getSafeImageUrl(user?.profilePicture) : "";

  return (
    <div className="user-avatar">
      {imageUrl ? (
        <img src={imageUrl} alt={user?.username} onError={() => setImageFailed(true)} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};

const StatusBadge = ({ active }) => (
  <span className={`user-badge ${active ? "active" : "inactive"}`}>
    {active ? "Activo" : "Inactivo"}
  </span>
);

const RoleBadge = ({ role }) => (
  <span className={`role-badge ${role === "ADMIN_ROLE" ? "admin" : "user"}`}>
    {role === "ADMIN_ROLE" ? "Admin" : "Usuario"}
  </span>
);

export const UsersPage = () => {
  const { users, loading, error, fetchUsers, updateUserRole } = useUserManagementStore();
  const currentUser = useAuthStore((state) => state.user);
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ name: "", surname: "", username: "", email: "", phone: "", role: "USER_ROLE", status: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error]);

  const normalizedUsers = useMemo(() => (users || []).map(normalizeUser), [users]);

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return normalizedUsers;

    return normalizedUsers.filter((user) =>
      [user.name, user.surname, user.username, user.email, user.phone, user.role]
        .join(" ")
        .toLowerCase()
        .includes(search),
    );
  }, [normalizedUsers, query]);

  const stats = useMemo(() => ({
    total: normalizedUsers.length,
    admins: normalizedUsers.filter((user) => user.role === "ADMIN_ROLE").length,
    active: normalizedUsers.filter((user) => user.status).length,
    verified: normalizedUsers.filter((user) => user.isEmailVerified).length,
  }), [normalizedUsers]);

  const handleOpenProfile = (user) => setSelectedUser(user);

  const handleOpenEditor = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      surname: user.surname,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    });
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!editingUser) return;

    try {
      setSaving(true);
      const result = await updateUserRole(editingUser.id, form.role);
      if (result.success) {
        showSuccess("Usuario actualizado correctamente");
        setEditingUser(null);
        setForm({ name: "", surname: "", username: "", email: "", phone: "", role: "USER_ROLE", status: false });
      } else {
        showError(result.error || "No se pudo actualizar el usuario");
      }
    } catch (err) {
      showError(err?.message || "No se pudo actualizar el usuario");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="users-admin-page animate-fadeInUp">
      <div className="users-admin-header">
        <div>
          <p className="dash-label">Gestión de usuarios</p>
          <h1>Usuarios registrados</h1>
          <p>Explora perfiles, filtra por nombre y mantén el control de roles desde un panel moderno.</p>
        </div>
        <button type="button" className="users-refresh" onClick={() => fetchUsers(undefined, { force: true })} disabled={loading}>
          {loading ? "Cargando..." : "Actualizar"}
        </button>
      </div>

      <div className="users-stats">
        <div><span>{stats.total}</span><small>Total</small></div>
        <div><span>{stats.active}</span><small>Activos</small></div>
        <div><span>{stats.verified}</span><small>Verificados</small></div>
        <div><span>{stats.admins}</span><small>Admins</small></div>
      </div>

      <div className="users-toolbar">
        <input
          className="input-futuristic users-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre, usuario, correo, teléfono o rol"
        />
        <span>{filteredUsers.length} resultado(s)</span>
      </div>

      <div className="users-table-shell">
        {loading && normalizedUsers.length === 0 ? (
          <div className="users-empty">Cargando usuarios...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="users-empty">No hay usuarios que coincidan con la búsqueda.</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Contacto</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      <UserAvatar user={user} />
                      <div>
                        <strong>{user.name} {user.surname}</strong>
                        <span>@{user.username}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="user-contact">
                      <span>{user.email}</span>
                      <small>{user.phone || "Sin teléfono"}</small>
                    </div>
                  </td>
                  <td><RoleBadge role={user.role} /></td>
                  <td><StatusBadge active={user.status} /></td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <div className="user-actions">
                      <button type="button" onClick={() => handleOpenProfile(user)}>Ver</button>
                      <button type="button" onClick={() => handleOpenEditor(user)}>Editar</button>
                      <button type="button" className="btn-primary" onClick={() => handleOpenEditor(user)}>
                        Cambiar rol
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedUser && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <article className="user-modal">
            <button type="button" className="modal-close" onClick={() => setSelectedUser(null)}>Cerrar</button>
            <UserAvatar user={selectedUser} />
            <h2>{selectedUser.name} {selectedUser.surname}</h2>
            <p>@{selectedUser.username}</p>
            <div className="profile-grid">
              <span><strong>Email</strong>{selectedUser.email}</span>
              <span><strong>Teléfono</strong>{selectedUser.phone || "Sin teléfono"}</span>
              <span><strong>Rol</strong>{selectedUser.role}</span>
              <span><strong>Estado</strong>{selectedUser.status ? "Activo" : "Inactivo"}</span>
              <span><strong>Email verificado</strong>{selectedUser.isEmailVerified ? "Sí" : "No"}</span>
              <span><strong>Actualizado</strong>{formatDate(selectedUser.updatedAt)}</span>
            </div>
          </article>
        </div>
      )}

      {editingUser && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="user-modal edit-modal" onSubmit={handleSubmit}>
            <button type="button" className="modal-close" onClick={() => setEditingUser(null)}>Cerrar</button>
            <p className="dash-label">Editar usuario</p>
            <h2>{editingUser.username}</h2>
            <div className="edit-grid">
              <label>Nombre<input className="input-futuristic" name="name" value={form.name} onChange={handleChange} required maxLength={25} /></label>
              <label>Apellido<input className="input-futuristic" name="surname" value={form.surname} onChange={handleChange} required maxLength={25} /></label>
              <label>Usuario<input className="input-futuristic" name="username" value={form.username} onChange={handleChange} required maxLength={50} /></label>
              <label>Email<input className="input-futuristic" type="email" name="email" value={form.email} onChange={handleChange} required /></label>
              <label>Teléfono<input className="input-futuristic" name="phone" value={form.phone} onChange={handleChange} required pattern="\\d{8}" maxLength={8} /></label>
              <label>Rol
                <select className="input-futuristic" name="role" value={form.role} onChange={handleChange}>
                  <option value="USER_ROLE">Usuario</option>
                  <option value="ADMIN_ROLE">Admin</option>
                </select>
              </label>
            </div>
            <label className="status-toggle">
              <input type="checkbox" name="status" checked={form.status} onChange={handleChange} />
              Cuenta activa
            </label>
            <button type="submit" className="btn-primary save-user" disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
};
