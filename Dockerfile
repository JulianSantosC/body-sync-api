# Info personal: ************* Este Dockerfile tiene la receta para construir la imagen de mi API, y es utilizada en docker-compose *********
# Este archivo utiliza una estrategia multi-etapa (Multi-stage build).
# Sirve para crear imágenes muy ligeras y separar el entorno de desarrollo del de producción.
# *********************


# ---- Dependencies ----
 # Descargar la imagen de node y crear un contenedor y nombrar esta etapa como dependencies
FROM node:20-alpine AS dependencies
 # Crear carpeta app y establecer el directorio de trabajo en el contenedor
WORKDIR /app
 # Copiar los archivos package.json y package-lock.json desde el pc actual al contenedor
 # Hacer esto antes de copiar todo el código aprovecha la caché de Docker para acelerar futuras construcciones.
COPY package*.json ./
 # Instalar las dependencias del proyecto
RUN npm ci
# Del anterior comando: ci (Clean Install): Es ideal para entornos automatizados porque se basa estrictamente en el archivo package-lock.json.


# ---- Build ----
#Toma como punto de partida todo lo que ya se hizo en la etapa dependencies, evitando reinstalar módulos.
 # Usar la etapa dependencies y nombrar esta etapa como build
FROM dependencies AS build
 # Copiar todos los archivos del proyecto al contenedor
COPY . .
 # Compilar el proyecto. (normalmente convierte TypeScript a JavaScript o empaqueta la app)
 # Esto es necesario ya que en el entorno de producción se necesita un build del proyecto para que se pueda ejecutar.
RUN npm run build


# ---- Production ----
# Lo de arriba es un comentario que indica la etapa final donde se creará la imagen definitiva que correrá en producción.
 # Descargar la imagen de node y crear un contenedor y nombrar esta etapa como dependencies
FROM node:20-alpine AS production
 # Crear carpeta app y establecer el directorio de trabajo en el contenedor
WORKDIR /app
 # Establecer el entorno de producción definiendo una variable de entorno que le avisa a Node.js y a sus librerías que la aplicación se está ejecutando en modo de producción, optimizando su rendimiento.
ENV NODE_ENV=production
 # Copiar los archivos package.json y package-lock.json al contenedor
COPY package*.json ./
 # Instalar las dependencias del proyecto sin incluir las dependencias de desarrollo; las que están marcadas como devDependencies (como linters, herramientas de prueba o TypeScript)
RUN npm ci --omit=dev
 # Copiar los archivos compilados del proyecto al contenedor
 # Esta es la magia del Multi-stage: copia la carpeta compilada dist desde la etapa anterior (build) hacia la carpeta dist de este contenedor actual.Así dejas atrás todo el código fuente original y te quedas solo con el resultado final optimizado.
COPY --from=build /app/dist ./dist # Nota persona: Esto lo que hace es copiar a esas carpetas del docker solo el resultado compilado del stage anterior "Build" (que compiló el código utilizando todo lo que se necesitaba como npm, git o lo que sea). Así no se copia todo el código al docker, sino que en el docker solo el resultado compilado
 # Exponer el puerto 3000 (solo es informativo, el real que abre el puerto y canaliza el tráfico está en el compose): Informa a Docker que el contenedor escuchará conexiones en el puerto 3000 en tiempo de ejecución (funciona principalmente como documentación informativa).
EXPOSE 3000
 # Ejecutar el proyecto: Establece el comando por defecto que se ejecutará de forma automática cuando el contenedor se encienda.En este caso, inicia la aplicación ejecutando el archivo JavaScript principal compilado.
CMD ["node", "dist/main.js"]
