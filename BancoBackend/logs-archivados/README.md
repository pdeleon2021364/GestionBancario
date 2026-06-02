# Logs archivados

Esta carpeta guarda archivos `.log` generados al levantar servicios locales durante pruebas.

Estos archivos sirven para revisar salida de consola, errores de arranque y mensajes de diagnostico sin mezclarlos con el codigo fuente. No son parte de la ejecucion de la aplicacion: moverlos aqui no cambia rutas de API, componentes, configuracion funcional ni base de datos.

Si un servicio se vuelve a iniciar con redireccion de salida, puede crear nuevos logs. Es normal y se pueden archivar aqui de nuevo cuando ya no se esten usando.
