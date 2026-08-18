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
 # Hacer esto antes de copiar todo el código (en la stage de 'Build') aprovecha la caché de Docker para acelerar futuras construcciones.
COPY package*.json ./
 # Instalar las dependencias del proyecto (esto es especiale para desarrollo porque instala todas las herramientas para dev, así que esta imagen de dependencies es la que se debe utilizar para desarrollo local [motanda la estapa/stage de build de abajo], ya que contiene todas las dependecias para development)
RUN npm ci
# Del anterior comando: ci (Clean Install): Es ideal para entornos automatizados porque se basa estrictamente en el archivo package-lock.json.


# ---- Build ----
#Toma como punto de partida todo lo que ya se hizo en la etapa dependencies, evitando reinstalar módulos.
 # Usar la etapa dependencies y nombrar esta etapa como build
FROM dependencies AS build
 # Copiar todos los archivos del proyecto al contenedor. Esto solo sirve para producción, porque en dev está el ''.:app/'' y el 'npm run start:dev'
 # que sobreescribirían este contenido copiado porque lo revisan constantemente con hot-reload. Pero en producción (con Render, y en general)
 # no utiliza el docker-compose (ni el hot-reload porque gasta muchos recursos revisar constantemente cambios para implementarlo, y la filosofía del
 # servidor/producción es hacer un solo despliegue cada que sea necesario, no manter revisando cambios constantemente), solo utiliza el Dockerfile, así
 # que sí es necesario copiar todos los archivos del proyecto en el build para montar la imagen en producción.
COPY . .
 # Compilar el código/proyecto recien copiado en la línea anterior. Esto convierte TypeScript a JavaScript, entre otras cosas —como empaquetar la app—,
 # y el resultado, pasado de TypeScript a JavaScript, y que queda en /dist, sí lo puede leer Node/V8
 # Esto es necesario ya que en el entorno de producción se necesita un build del proyecto para que se pueda ejecutar.
RUN npm run build


# ---- Production ----
# Lo de arriba es un comentario que indica la etapa final donde se creará la imagen definitiva que correrá en producción. Es importante, tener 
 # Descargar la imagen de node y crear un contenedor y nombrar esta etapa como dependencies
FROM node:20-alpine AS production
 # Crear carpeta app y establecer el directorio de trabajo en el contenedor
WORKDIR /app
 # Establecer el entorno de producción definiendo una variable de entorno que le avisa a Node.js y a sus librerías que la aplicación se está ejecutando en modo de producción, optimizando su rendimiento.
ENV NODE_ENV=production
 # Copiar los archivos package.json y package-lock.json al contenedor
COPY package*.json ./
 # Instalar las dependencias del proyecto sin incluir las dependencias de desarrollo; las que están marcadas como devDependencies (como linters, herramientas de prueba, TypeScript, @nestjs/cli, etc.), que sirven Y SON para desarrollo, no para producción.
RUN npm ci --omit=dev
 # Copiar los archivos compilados del proyecto al contenedor
 # Esta es la magia del Multi-stage: copia la carpeta compilada dist desde la etapa anterior (build) hacia la carpeta dist de este contenedor actual.Así dejas atrás todo el código fuente original y te quedas solo con el resultado final optimizado.
  # Nota personal: Esto lo que hace es copiar a esas carpetas del docker solo el resultado compilado del stage anterior "Build" (que compiló el código
  # utilizando todo lo que se necesitaba como npm, git o lo que sea, entonces da como resultado un JavaScript compilado (es decir el código pero pasado a JavaScript puro para
  # que pueda ser leido como JavaScript puro y no como TypeScript), porque con el 'npm ci --omit=dev' se
  # omitió esto, entre otras cosas, entonces la imagen no sabría como entende/compilar TypeScript si no se le envía el JavaScript compilado). Así no
  # se copia todo el código al docker, sino que en el docker solo queda el resultado compilado y las herramientas necesarias para compilar, sin todo lo demás.
COPY --from=build /app/dist ./dist
 # Exponer el puerto 3000 (solo es informativo, el real que abre el puerto y canaliza el tráfico está en el compose): Informa a Docker que el contenedor escuchará conexiones en el puerto 3000 en tiempo de ejecución (funciona principalmente como documentación informativa).
EXPOSE 3000
 # Ejecutar el proyecto: Establece el comando por defecto que se ejecutará de forma automática cuando el contenedor se encienda.En este caso, inicia la aplicación ejecutando el archivo JavaScript principal compilado.
 # Como en el 'RUN npm ci --omit=dev' se omitieron dependencias de desarrollo y herramientas de compilación, por seguridad y peso de la imagen (como TypeScript, @nestjs/cli, y todo lo que sabe compilar .ts)
 # y este comando ejecuta es JavaScript puro, por eso fue que se pasó el JavaScript puro "compilado"("compilado" porque en este caso solo significa que lo pasó de ts a js, pero nada más, dando como resultado
 # solamente código .js) con ,'COPY --from=build /app/dist ./dist', que Node sí puede ejecutar directamente sin ayuda de nadie.
CMD ["node", "dist/main.js"]
