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
1. **Pestaña "General":**
   - **Node:** `pve`
   - **VM ID:** `159`
   - **Hostname:** `44581626A`
   - **Unprivileged container:** Activado (Checked)
   - **Nesting:** Activado (Checked)
2. **Pestaña "Template":**
   - Plantilla seleccionada: `debian-12-standard_12.7-1_amd64.tar.zst`
3. **Pestaña "Root Disk":**
   - **Storage:** `local-lvm`
   - **Disk size (GiB):** `8`
4. **Pestaña "CPU":**
   - **Cores:** `1`
5. **Pestaña "Memory":**
   - **Memory (MiB):** `128`
   - **Swap (MiB):** `128`
6. **Pestaña "Network":**
   - **Name:** `eth0`
   - **Bridge:** `vmbr0`
   - **Firewall:** Activado (Checked)
   - **IPv4:** Static
   - **IPv4/CIDR:** `172.16.90.159/24`
   - **Gateway (IPv4):** `172.16.90.1`
7. **Pestaña "DNS":**
   - **DNS server:** `172.16.90.1`

El contenedor se inicializó correctamente y quedó operativo con la dirección IP **`172.16.90.159`**.

### Paso 2.2: Creación del Contenedor de la Base de Datos (`44581626DB`)
1. **Pestaña "General":**
   - **Node:** `pve`
   - **VM ID:** `162` (el ID 160 y 161 estaban en uso por otros estudiantes)
   - **Hostname:** `44581626DB`
   - **Unprivileged container:** Activado (Checked)
   - **Nesting:** Activado (Checked)
2. **Pestaña "Template":**
   - Plantilla seleccionada: `debian-12-standard_12.7-1_amd64.tar.zst`
3. **Pestaña "Root Disk":**
   - **Storage:** `local-lvm`
   - **Disk size (GiB):** `8`
4. **Pestaña "CPU":**
   - **Cores:** `1`
5. **Pestaña "Memory":**
   - **Memory (MiB):** `128`
   - **Swap (MiB):** `128`
6. **Pestaña "Network":**
   - **Name:** `eth0`
   - **Bridge:** `vmbr0`
   - **Firewall:** Activado (Checked)
   - **IPv4:** Static
   - **IPv4/CIDR:** `172.16.90.162/24`
   - **Gateway (IPv4):** `172.16.90.1`
7. **Pestaña "DNS":**
   - **DNS server:** `172.16.90.1`

El contenedor se inicializó correctamente y quedó operativo con la dirección IP **`172.16.90.162`**.

---

*(El informe se irá completando a medida que desarrollemos la app y realicemos el despliegue)*
