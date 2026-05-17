import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/store/authStore";
import {
    getProfile,
    uploadProfileAvatar,
    deleteProfileAvatar,
    updateMyProfile,
} from "../../shared/api/auth";
import { showError, showSuccess } from "../../shared/utils/toast";

const getSafeImageUrl = (value) => {
    if (!value || typeof value !== "string") return "";
    const trimmed = value.trim();
    if (trimmed.includes("default-avatar_ewzxwx")) return "";
    return /^(https?:\/\/|data:image\/)/i.test(trimmed) ? trimmed : "";
};

const normalizeUser = (user) => ({
    id: user?.id ?? user?.Id,
    name: user?.name ?? user?.Name ?? "",
    surname: user?.surname ?? user?.Surname ?? "",
    username: user?.username ?? user?.Username ?? "",
    email: user?.email ?? user?.Email ?? "",
    phone: user?.phone ?? user?.Phone ?? "",
    role: user?.role ?? user?.Role ?? "USER_ROLE",
    profilePicture: getSafeImageUrl(user?.profilePicture ?? user?.ProfilePicture),
});

export const ProfilePage = () => {
    const navigate = useNavigate();
    const authUser = useAuthStore((state) => state.user);
    const setAuthState = useAuthStore.setState;
    const fileInputRef = useRef(null);
    const [profile, setProfile] = useState(() => normalizeUser(authUser || {}));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [fileLabel, setFileLabel] = useState("Seleccionar foto...");
    const [previewUrl, setPreviewUrl] = useState("");

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                const response = await getProfile();
                const normalized = normalizeUser(response?.user ?? response);
                setProfile(normalized);
                setAuthState((current) => ({ ...current, user: normalized }));
            } catch (error) {
                showError(error?.response?.data?.message || "No se pudo cargar el perfil.");
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [setAuthState]);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setProfile((current) => ({ ...current, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            setSaving(true);
            const response = await updateMyProfile({
                name: profile.name,
                surname: profile.surname,
                email: profile.email,
                phone: profile.phone,
            });
            const normalized = normalizeUser(response?.user ?? response);
            setProfile(normalized);
            setAuthState((current) => ({ ...current, user: normalized }));
            showSuccess("Perfil actualizado correctamente");
        } catch (error) {
            showError(error?.response?.data?.message || "No se pudo actualizar el perfil.");
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            showError("Solo se permiten archivos de imagen.");
            return;
        }

        const localPreviewUrl = URL.createObjectURL(file);
        setPreviewUrl((current) => {
            if (current) URL.revokeObjectURL(current);
            return localPreviewUrl;
        });

        try {
            setUploading(true);
            const response = await uploadProfileAvatar(file);
            const normalized = normalizeUser(response?.user ?? response);
            setProfile(normalized);
            setAuthState((current) => ({ ...current, user: normalized }));
            setPreviewUrl((current) => {
                if (current) URL.revokeObjectURL(current);
                return "";
            });
            setFileLabel(file.name);
            showSuccess("Foto de perfil actualizada correctamente");
        } catch (error) {
            setPreviewUrl((current) => {
                if (current) URL.revokeObjectURL(current);
                return "";
            });
            showError(error?.response?.data?.message || "No se pudo subir la foto de perfil.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemoveAvatar = async () => {
        const confirmed = window.confirm("¿Deseas eliminar tu foto de perfil y usar el avatar por defecto?");
        if (!confirmed) return;

        try {
            setDeleting(true);
            setPreviewUrl((current) => {
                if (current) URL.revokeObjectURL(current);
                return "";
            });
            const response = await deleteProfileAvatar();
            const normalized = normalizeUser(response?.user ?? response);
            setProfile(normalized);
            setAuthState((current) => ({ ...current, user: normalized }));
            showSuccess("Foto de perfil eliminada correctamente");
            setFileLabel("Seleccionar foto...");
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (error) {
            showError(error?.response?.data?.message || "No se pudo eliminar la foto de perfil.");
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <section className="users-admin-page animate-fadeInUp">
                <div className="users-empty">Cargando perfil...</div>
            </section>
        );
    }

    const avatarUrl = previewUrl || getSafeImageUrl(profile.profilePicture);
    const initials = (profile.name || profile.username || "Usuario").slice(0, 1).toUpperCase();

    return (
        <section className="users-admin-page animate-fadeInUp">
            <div className="users-admin-header">
                <div>
                    <p className="dash-label">Mi perfil</p>
                    <h1>Gestiona tu foto de perfil</h1>
                    <p>Sube, edita o elimina tu avatar cuando lo necesites.</p>
                </div>
                <button type="button" className="users-refresh" onClick={() => navigate(-1)}>
                    Volver
                </button>
            </div>

            <div className="users-table-shell">
                <div className="user-modal" style={{ maxWidth: "680px", margin: "0 auto" }}>
                    <div className="profile-avatar-row">
                        <div className="user-avatar profile-avatar-preview">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={profile.username}
                                />
                            ) : (
                                <span>{initials}</span>
                            )}
                        </div>
                        <div className="profile-avatar-copy">
                            <p className="dash-label" style={{ marginBottom: "8px" }}>
                                Foto de perfil
                            </p>
                            <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>
                                Puedes subir una nueva imagen o borrar la actual para volver al avatar por defecto.
                            </p>
                            <label className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                                {uploading ? "Subiendo..." : "Subir nueva foto"}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    style={{ display: "none" }}
                                    disabled={uploading || deleting}
                                />
                            </label>
                            <button
                                type="button"
                                className="danger"
                                onClick={handleRemoveAvatar}
                                disabled={deleting || uploading || !avatarUrl}
                                style={{ marginLeft: "12px" }}
                            >
                                {deleting ? "Eliminando..." : "Eliminar foto"}
                            </button>
                            <p style={{ marginTop: "12px", color: "var(--text-secondary)" }}>{fileLabel}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} style={{ marginTop: "28px" }}>
                        <div className="edit-grid">
                            <label>
                                Nombre
                                <input
                                    className="input-futuristic"
                                    name="name"
                                    value={profile.name}
                                    onChange={handleChange}
                                    required
                                    maxLength={30}
                                />
                            </label>
                            <label>
                                Apellido
                                <input
                                    className="input-futuristic"
                                    name="surname"
                                    value={profile.surname}
                                    onChange={handleChange}
                                    required
                                    maxLength={30}
                                />
                            </label>
                            <label>
                                Usuario
                                <input
                                    className="input-futuristic"
                                    name="username"
                                    value={profile.username}
                                    disabled
                                />
                            </label>
                            <label>
                                Email
                                <input
                                    className="input-futuristic"
                                    type="email"
                                    name="email"
                                    value={profile.email}
                                    onChange={handleChange}
                                    required
                                />
                            </label>
                            <label>
                                Teléfono
                                <input
                                    className="input-futuristic"
                                    name="phone"
                                    value={profile.phone}
                                    onChange={handleChange}
                                    inputMode="numeric"
                                    maxLength={8}
                                />
                            </label>
                        </div>
                        <button type="submit" className="btn-primary save-user" disabled={saving}>
                            {saving ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
};
