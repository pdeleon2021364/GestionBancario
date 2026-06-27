import { useForm } from "react-hook-form"
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

export const RegisterForm = ({ onSuccess }) => {
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
    const registerUser = useAuthStore(state => state.register);
    const loading = useAuthStore(state => state.loading);

    const password = watch("password");

    const onSubmit = async (data) => {
        // Removemos confirmPassword y adaptamos nombres al contrato del backend.
        const { confirmPassword, firstName, lastName, ...rest } = data;
        if (loading) return;

        const payload = {
            ...rest,
            name: firstName.trim(),
            surname: lastName.trim(),
            username: rest.username.trim(),
            email: rest.email.trim().toLowerCase(),
            phone: rest.phone.trim(),
        };
        const res = await registerUser(payload);
        if (res.success) {
            toast.success("¡Su cuenta ya ha sido creada!", { duration: 4000 });
            onSuccess?.();
        } else {
            toast.error(res.error || "Error al crear la cuenta");
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Fila: Nombre + Apellido */}
            <div className="grid grid-cols-2 gap-3 animate-fadeInUp delay-100">
                <div>
                    <label htmlFor="firstName" className="label-futuristic block mb-1.5">
                        Nombre
                    </label>
                    <input
                        id="firstName"
                        type="text"
                        placeholder="Juan"
                        className="input-futuristic w-full px-4 py-3 rounded-xl"
                        {...register("firstName", {
                            required: "El nombre es requerido",
                            minLength: { value: 2, message: "Mínimo 2 caracteres" },
                            maxLength: { value: 25, message: "Máximo 25 caracteres" }
                        })}
                    />
                    {errors.firstName && (
                        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                            <span>⚠</span> {errors.firstName.message}
                        </p>
                    )}
                </div>
                <div>
                    <label htmlFor="lastName" className="label-futuristic block mb-1.5">
                        Apellido
                    </label>
                    <input
                        id="lastName"
                        type="text"
                        placeholder="Pérez"
                        className="input-futuristic w-full px-4 py-3 rounded-xl"
                        {...register("lastName", {
                            required: "El apellido es requerido",
                            minLength: { value: 2, message: "Mínimo 2 caracteres" },
                            maxLength: { value: 25, message: "Máximo 25 caracteres" }
                        })}
                    />
                    {errors.lastName && (
                        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                            <span>⚠</span> {errors.lastName.message}
                        </p>
                    )}
                </div>
            </div>

            {/* Usuario */}
            <div className="animate-fadeInUp delay-200">
                <label htmlFor="username" className="label-futuristic block mb-1.5">
                    Nombre de Usuario
                </label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>@</span>
                    <input
                        id="username"
                        type="text"
                        placeholder="juanperez123"
                        className="input-futuristic w-full pl-8 pr-4 py-3 rounded-xl"
                        {...register("username", {
                            required: "El usuario es requerido",
                            minLength: { value: 3, message: "Mínimo 3 caracteres" },
                            pattern: {
                                value: /^[a-zA-Z0-9_]+$/,
                                message: "Solo letras, números y guión bajo"
                            }
                        })}
                    />
                </div>
                {errors.username && (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                        <span>⚠</span> {errors.username.message}
                    </p>
                )}
            </div>

            {/* Teléfono */}
            <div className="animate-fadeInUp delay-300">
                <label htmlFor="phone" className="label-futuristic block mb-1.5">
                    Teléfono
                </label>
                <input
                    id="phone"
                    type="tel"
                    placeholder="12345678"
                    className="input-futuristic w-full px-4 py-3 rounded-xl"
                    {...register("phone", {
                        required: "El teléfono es requerido",
                        pattern: {
                            value: /^\d{8}$/,
                            message: "Debe tener exactamente 8 dígitos"
                        }
                    })}
                />
                {errors.phone && (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                        <span>⚠</span> {errors.phone.message}
                    </p>
                )}
            </div>

            {/* Correo Electrónico */}
            <div className="animate-fadeInUp delay-300">
                <label htmlFor="reg-email" className="label-futuristic block mb-1.5">
                    Correo Electrónico
                </label>
                <input
                    id="reg-email"
                    type="email"
                    placeholder="correo@banco.com"
                    className="input-futuristic w-full px-4 py-3 rounded-xl"
                    {...register("email", {
                        required: "El correo es requerido",
                        pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Correo inválido"
                        }
                    })}
                />
                {errors.email && (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                        <span>⚠</span> {errors.email.message}
                    </p>
                )}
            </div>

            {/* Contraseña */}
            <div className="animate-fadeInUp delay-400">
                <label htmlFor="reg-password" className="label-futuristic block mb-1.5">
                    Contraseña
                </label>
                <input
                    id="reg-password"
                    type="password"
                    placeholder="••••••••"
                    className="input-futuristic w-full px-4 py-3 rounded-xl"
                    {...register("password", {
                        required: "La contraseña es obligatoria",
                        minLength: { value: 8, message: "Mínimo 8 caracteres" },
                        pattern: {
                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
                            message: "Debe incluir mayúscula, minúscula, número y símbolo"
                        }
                    })}
                />
                {errors.password && (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                        <span>⚠</span> {errors.password.message}
                    </p>
                )}
            </div>

            {/* Confirmar Contraseña */}
            <div className="animate-fadeInUp delay-500">
                <label htmlFor="confirmPassword" className="label-futuristic block mb-1.5">
                    Confirmar Contraseña
                </label>
                <input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="input-futuristic w-full px-4 py-3 rounded-xl"
                    {...register("confirmPassword", {
                        required: "Confirma tu contraseña",
                        validate: value => value === password || "Las contraseñas no coinciden"
                    })}
                />
                {errors.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                        <span>⚠</span> {errors.confirmPassword.message}
                    </p>
                )}
            </div>

            {/* Submit */}
            <div className="pt-2">
                <button
                    type="submit"
                    className="btn-primary w-full py-3 px-4 rounded-xl text-sm"
                    disabled={loading || isSubmitting}
                >
                    {loading || isSubmitting ? "Creando cuenta..." : "Crear Cuenta →"}
                </button>
            </div>

            <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                Al registrarte aceptas nuestros{' '}
                <span className="hover:underline cursor-pointer" style={{ color: 'var(--main-blue)' }}>
                    Términos de Servicio
                </span>
            </p>
        </form>
    )
}
