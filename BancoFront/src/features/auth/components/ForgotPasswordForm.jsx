import { useForm } from "react-hook-form"
import { requestPasswordReset } from "../../../shared/api";
import { showSuccess, showError } from "../../../shared/utils/toast";

export const ForgotPasswordForm = ({ onSwitch }) => {

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      await requestPasswordReset({ email: data.email });
      showSuccess("Correo de recuperación enviado. Revisa tu bandeja.");
    } catch (err) {
      const message = err.response?.data?.message || "Error al enviar el correo";
      showError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="animate-fadeInUp delay-100">

        <label className="label-futuristic block mb-2">
          Correo Electrónico
        </label>

        <input
          type="email"
          placeholder="correo@banco.com"
          className="input-futuristic w-full px-4 py-3 rounded-xl"
          {...register("email", {
            required: "El correo es obligatorio"
          })}
        />

        {errors.email && (
          <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
            <span>⚠</span> {errors.email.message}
          </p>
        )}
      </div>

      <div className="animate-fadeInUp delay-200 pt-1">
        <button
          type="submit"
          className="btn-primary w-full py-3 rounded-xl text-sm"
        >
          Enviar Correo
        </button>
      </div>

      <p className="text-center text-sm animate-fadeInUp delay-300"
        style={{ color: 'var(--text-secondary)' }}>
        ¿Recordaste tu contraseña?{" "}
        <button
          type="button"
          className="font-semibold hover:underline transition-colors"
          style={{ color: 'var(--blue-mid)' }}
          onClick={onSwitch}
        >
          Iniciar Sesión
        </button>
      </p>
    </form>
  )
}
