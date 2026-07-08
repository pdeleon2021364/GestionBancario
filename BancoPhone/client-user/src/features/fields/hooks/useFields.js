import { useState, useEffect, useCallback } from "react";
import userClient from "../../../shared/api/userClient.js";

const mapFieldToViewModel = (field) => ({
    ...field,
    name: field.fieldName,
    image: field.photo,
    // El backend no expone ubicación textual para canchas.
    location: `${field.fieldType || "Tipo N/D"} • ${field.capacity || "Capacidad N/D"}`,
    // La disponibilidad visible se deriva de si la cancha está activa.
    isAvailable: Boolean(field.isActive),
});

export const useFields = () => {
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getFields = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await userClient.get("/fields");
            const rawFields = response.data.data || response.data || [];
            setFields(rawFields.map(mapFieldToViewModel));
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Error al obtener canchas");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        getFields();
    }, [getFields]);

    return { fields, loading, error, getFields };
};
