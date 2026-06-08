# Trabajo Práctico Final: Blog Personal y Consolidación de Servidores
**Materia:** Virtualización: Consolidación de servidores  
**Alumno:** Mauro Armas (DNI: 44581626)  
**Institución:** UTN-FRT  

---

## 1. Introducción y Topología

Este informe documenta el desarrollo, implementación y despliegue de un servicio de **Blog Personal** en una infraestructura de virtualización sobre **Proxmox Virtual Environment (PVE)**.

La topología del sistema consta de:
- **Acceso a Internet:** Vía la dirección `nap.frt.utn.edu.ar`.
- **Servidor de Aplicación (Contenedor 1):** Aloja el backend y frontend de la aplicación web desarrollada en Next.js.
- **Servidor de Base de Datos (Contenedor 2):** Aloja el motor de base de datos relacional PostgreSQL.

Ambos servicios corren de forma aislada sobre contenedores Linux (LXC) con recursos sumamente acotados (128 MB RAM, 1 CPU, 8 GB Almacenamiento).

---

## 2. Configuración de la Infraestructura en Proxmox

Para cumplir con la consigna, se crearon y configuraron dos contenedores de Linux (LXC) utilizando la interfaz de administración web de Proxmox.

### Paso 2.1: Creación del Contenedor de la Aplicación (`44581626A`)
1. **VM ID:** `159` | **Hostname:** `44581626A`
2. **Plantilla:** `debian-12-standard_12.7-1_amd64.tar.zst`
3. **RAM:** `128 MiB` | **Swap:** `128 MiB` | **Disco:** `8 GiB`
4. **Red:** IP estática `172.16.90.159/24` (Gateway/DNS: `172.16.90.1`)

### Paso 2.2: Creación del Contenedor de la Base de Datos (`44581626DB`)
1. **VM ID:** `162` | **Hostname:** `44581626DB`
2. **Plantilla:** `debian-12-standard_12.7-1_amd64.tar.zst`
3. **RAM:** `128 MiB` | **Swap:** `128 MiB` | **Disco:** `8 GiB`
4. **Red:** IP estática `172.16.90.162/24` (Gateway/DNS: `172.16.90.1`)

---

## 3. Despliegue de los Servicios (Guía Paso a Paso)

A continuación, sigue estos pasos al pie de la letra. Abre la consola web de Proxmox para cada contenedor.

### FASE 3.1: Configurar el Contenedor 2 (Base de Datos)
Ingresa a la consola del contenedor **`162` (44581626DB)** y ejecuta:

**1. Instalar PostgreSQL y servidor Web ligero para Adminer:**
```bash
apt-get update
apt-get install -y postgresql postgresql-contrib lighttpd php-cgi php-pgsql wget
```

**2. Optimizar PostgreSQL para 128MB RAM:**
```bash
sed -i "s/^#shared_buffers = 128MB/shared_buffers = 16MB/" /etc/postgresql/15/main/postgresql.conf
sed -i "s/^#work_mem = 4MB/work_mem = 2MB/" /etc/postgresql/15/main/postgresql.conf
sed -i "s/^#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/15/main/postgresql.conf
```

**3. Permitir conexiones desde el Contenedor 1:**
```bash
echo "host    all             all             172.16.90.159/32          scram-sha-256" >> /etc/postgresql/15/main/pg_hba.conf
systemctl restart postgresql
```

**4. Crear la Base de Datos y el Usuario:**
```bash
su - postgres
psql -c "CREATE USER mauro WITH PASSWORD 'utn2026';"
psql -c "CREATE DATABASE blogdb OWNER mauro;"
psql -d blogdb -c "
CREATE TABLE posts (
  id SERIAL PRIMARY KEY, slug VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL, excerpt TEXT, content TEXT,
  tag VARCHAR(100), status VARCHAR(50) NOT NULL DEFAULT 'draft',
  read_time INTEGER, published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);"
exit
```

**5. Instalar Adminer (Tu "phpMyAdmin"):**
```bash
lighty-enable-mod fastcgi fastcgi-php
systemctl restart lighttpd
wget https://github.com/vrana/adminer/releases/download/v4.8.1/adminer-4.8.1.php -O /var/www/html/adminer.php
```
*¡Listo! La DB corre en `172.16.90.162` y Adminer en `http://172.16.90.162/adminer.php`.*

---

### FASE 3.2: Compilar el código (En tu máquina local)
Abre una terminal en tu computadora (en la carpeta `Portafolio`) y ejecuta:
```bash
npm run build
```
Esto creará una carpeta oculta `.next/standalone`. Esta carpeta es mágica: contiene tu aplicación comprimida sin todo el peso de desarrollo, lista para entrar en un contenedor de 128MB.

### FASE 3.3: Configurar el Contenedor 1 (Aplicación Web)
Ingresa a la consola del contenedor **`159` (44581626A)** y ejecuta:

**1. Instalar Node.js:**
```bash
apt-get update
apt-get install -y curl
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
```

**2. Subir tu código compilado:**
Desde tu computadora local, debes enviar el build al contenedor 1 vía SCP (reemplaza `root@172.16.90.159` con el método que uses para pasar archivos al contenedor, por ejemplo WinSCP si usas Windows, o comando scp):
```bash
# Ejecutar en tu máquina local:
scp -r .next/standalone root@172.16.90.159:/var/www/blog
scp -r public root@172.16.90.159:/var/www/blog/public
scp -r .next/static root@172.16.90.159:/var/www/blog/.next/static
```

**3. Levantar el servicio:**
Vuelve a la consola del contenedor **159** y ejecuta:
```bash
cd /var/www/blog
export PORT=80
export NODE_ENV=production
export DATABASE_URL="postgres://mauro:utn2026@172.16.90.162:5432/blogdb"
node server.js
```
*Si funciona sin errores, tu blog ya está público en `http://172.16.90.159`.*
