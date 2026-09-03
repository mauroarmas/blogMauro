## 🖥️ Fase 1: La Infraestructura (Proxmox Web GUI)

1. **Pestaña "Summary de contenedor":**
   * Hemos creado un contenedor LXC (Linux Container). Se le asignó 128MB de RAM, 1 Core vCPU y 8 gb de disco."
2. **Pestaña "Network"**
   * El contenedor está aislado dentro de la red del hipervisor esto mediante un bridge vmbr0 con una IP estática, gateway y se comunica con internet a través de un proxy inverso configurado en el Nginx principal de la universidad."

## ⚙️ IR AL CONTENEDOR DE DB - Fase 2: El Entorno del Contenedor (Terminal)

1. **Muestra el servicio de la aplicación:**
   ```bash
      systemctl status postgresql
   ```
   * *Qué decir:* "La base de datos PostgreSQL no se ejecuta manualmente, sino que está daemonizada como un servicio de `systemd` llamado `postgresql`. Esto garantiza que la aplicación se inicie automáticamente si el contenedor se reinicia o si ocurre una falla."


## 🗄️ Fase 3: La Base de Datos (PostgreSQL en Terminal)
**Objetivo:** Demostrar la persistencia de datos y el control backend.

1. **Entra a la terminal del contenedor de la Base de Datos (`44581626DB`)** y conéctate:
   ```bash
   su - postgres
   psql
   \c blogdb
   ```
2. **Muestra las tablas y el contenido actual:**
   ```sql
   \dt
   SELECT id, title, status FROM posts;
   ```
   * *Qué decir:* "Aquí estamos conectados directamente al motor de base de datos PostgreSQL que corre en su propio entorno aislado en producción. Usando comandos SQL estándar podemos ver las tablas y los artículos que actualmente componen el portafolio."
3. **Realiza un cambio en vivo (La "Magia"):**
   * *Qué decir:* "Para demostrar que todo está conectado, voy a cambiar el estado de un artículo directamente desde la base de datos."
   ```sql
   UPDATE posts SET title = '[Modificado en DB] ' || title WHERE id = 1;
   SELECT id, title FROM posts WHERE id = 1;
   ```
---

## 🌐 Fase 4: La Interfaz de Usuario y Sincronización
**Objetivo:** Mostrar el resultado final y el panel de administración.

1. **Abre el navegador web** y entra a la URL pública de tu blog: `https://nap.frt.utn.edu.ar/44581626/`
2. **Muestra el cambio:**
   * *Qué decir:* "Si recargamos la página web pública, podemos ver inmediatamente el artículo con el título que acabo de modificar mediante la consulta SQL en la terminal."
3. **Ingresa al panel de Administrador:** `https://nap.frt.utn.edu.ar/44581626/admin`
4. **Crea un nuevo Post desde la web:**
   * Llena un título ("Post de prueba para exposición"), ponlo como "Publicado" y dale a guardar.
5. **Vuelve a la terminal (donde seguías en PostgreSQL) y verifica:**
   ```sql
   SELECT id, title FROM posts ORDER BY id DESC LIMIT 3;
   ```
   * "La operación que acabo de hacer desde la interfaz gráfica ya está persistida correctamente en la base de datos de nuestro contenedor."

