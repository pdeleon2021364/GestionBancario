import { useEffect, useMemo, useState } from "react";
import { deleteUser, getAllUsers, getUserById, updateUser } from "../../../shared/api/auth";
import { showError, showSuccess } from "../../../shared/utils/toast";
import { useAuthStore } from "../../auth/store/authStore";

const emptyForm = {
    name: "",
    surname: "",
    username: "",
    email: "",
    phone: "",
    role: "USER_ROLE",
    status: false,
};

const normalizeUser = (user) => ({
    id: user.id ?? user.Id,
    name: user.name ?? user.Name ?? "",
    surname: user.surname ?? user.Surname ?? "",
    username: user.username ?? user.Username ?? "",
    email: user.email ?? user.Email ?? "",
    phone: user.phone ?? user.Phone ?? "",
    role: user.role ?? user.Role ?? "USER_ROLE",
    status: Boolean(user.status ?? user.Status),
    isEmailVerified: Boolean(user.isEmailVerified ?? user.IsEmailVerified),
    profilePicture: user.profilePicture ?? user.ProfilePicture ?? "",
    createdAt: user.createdAt ?? user.CreatedAt,
    updatedAt: user.updatedAt ?? user.UpdatedAt,
});

const formatDate = (value) => {
    if (!value) return "Sin fecha";
    return new Intl.DateTimeFormat("es-GT", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
};

const getErrorMessage = (error, fallback) =>
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.message ||
    fallback;

const UserAvatar = ({ user }) => (
    <div className="user-avatar">
        {user.profilePicture ? (
            <img src={user.profilePicture} alt={user.username} />
        ) : (
            <span>{(user.name || user.username || "U").slice(0, 1).toUpperCase()}</span>
        )}
    </div>
);

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
    const currentUser = useAuthStore((state) => state.user);
    const [users, setUsers] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const { users: data } = await getAllUsers();
            setUsers((data || []).map(normalizeUser));
        } catch (error) {
            showError(getErrorMessage(error, "No se pudieron cargar los usuarios"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        const search = query.trim().toLowerCase();
        if (!search) return users;

        return users.filter((user) =>
            [
                user.name,
                user.surname,
                user.username,
                user.email,
                user.phone,
                user.role,
            ]
                .join(" ")
                .toLowerCase()
                .includes(search),
        );
    }, [query, users]);

    const stats = useMemo(() => ({
        total: users.length,
        admins: users.filter((user) => user.role === "ADMIN_ROLE").length,
        active: users.filter((user) => user.status).length,
        verified: users.filter((user) => user.isEmailVerified).length,
    }), [users]);

    const openProfile = async (user) => {
        try {
            const data = await getUserById(user.id);
            setSelectedUser(normalizeUser(data));
        } catch (error) {
            showError(getErrorMessage(error, "No se pudo abrir el perfil"));
        }
    };

    const openEditor = (user) => {
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
        setForm((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!editingUser) return;

        try {
            setSaving(true);
            const updated = normalizeUser(await updateUser(editingUser.id, form));
            setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)));
            setEditingUser(null);
            setForm(emptyForm);
            showSuccess("Usuario actualizado correctamente");
        } catch (error) {
            showError(getErrorMessage(error, "No se pudo actualizar el usuario"));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (user) => {
        const confirmed = window.confirm(`Eliminar a ${user.username}? Esta accion no se puede deshacer.`);
        if (!confirmed) return;

        try {
            await deleteUser(user.id);
            setUsers((current) => current.filter((item) => item.id !== user.id));
            if (selectedUser?.id === user.id) setSelectedUser(null);
            showSuccess("Usuario eliminado correctamente");
        } catch (error) {
            showError(getErrorMessage(error, "No se pudo eliminar el usuario"));
        }
    };

    return (
        <section className="users-admin-page animate-fadeInUp">
            <div className="users-admin-header">
                <div>
                    <p className="dash-label">Gestion de usuarios</p>
                    <h1>Usuarios registrados</h1>
                    <p>Busca, revisa perfiles, edita datos y elimina usuarios desde el panel administrativo.</p>
                </div>
                <button type="button" className="users-refresh" onClick={loadUsers} disabled={loading}>
                    Actualizar
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
                    placeholder="Buscar por nombre, usuario, correo, telefono o rol"
                />
                <span>{filteredUsers.length} resultado(s)</span>
            </div>

            <div className="users-table-shell">
                {loading ? (
                    <div className="users-empty">Cargando usuarios...</div>
                ) : filteredUsers.length === 0 ? (
                    <div className="users-empty">No hay usuarios que coincidan con la busqueda.</div>
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
                                            <small>{user.phone || "Sin telefono"}</small>
                                        </div>
                                    </td>
                                    <td><RoleBadge role={user.role} /></td>
                                    <td><StatusBadge active={user.status} /></td>
                                    <td>{formatDate(user.createdAt)}</td>
                                    <td>
                                        <div className="user-actions">
                                            <button type="button" onClick={() => openProfile(user)}>Ver</button>
                                            <button type="button" onClick={() => openEditor(user)}>Editar</button>
                                            <button
                                                type="button"
                                                className="danger"
                                                onClick={() => handleDelete(user)}
                                                disabled={currentUser?.id === user.id && user.role === "ADMIN_ROLE"}
                                                title={currentUser?.id === user.id ? "No elimines tu propio admin desde la tabla" : "Eliminar usuario"}
                                            >
                                                Eliminar
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
                            <span><strong>Telefono</strong>{selectedUser.phone || "Sin telefono"}</span>
                            <span><strong>Rol</strong>{selectedUser.role}</span>
                            <span><strong>Estado</strong>{selectedUser.status ? "Activo" : "Inactivo"}</span>
                            <span><strong>Email verificado</strong>{selectedUser.isEmailVerified ? "Si" : "No"}</span>
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
                            <label>Telefono<input className="input-futuristic" name="phone" value={form.phone} onChange={handleChange} required pattern="\d{8}" maxLength={8} /></label>
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
