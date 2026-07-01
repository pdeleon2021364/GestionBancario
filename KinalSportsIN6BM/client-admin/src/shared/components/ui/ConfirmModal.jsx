import { useUIStore } from "./store/uiStore";

export const ConfirmModal = () => {
    const { confirmModal, closeConfirm } = useUIStore();

    if (!confirmModal.isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-96 text-center shadow-lg">
                <h2 className="text-xl font-bold mb-2">{confirmModal.title}</h2>
                <p className="mb-4">{confirmModal.message}</p>

                <div className="flex justify-center gap-4 mt-4">
                    <button
                        onClick={closeConfirm}
                        className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition"
                    >
                        Cancelar
                    </button>

                    <button
                        onClick={() => {
                            confirmModal.onConfirm?.();
                            closeConfirm();
                        }}
                        className="px-5 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};