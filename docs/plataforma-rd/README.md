# Watchpost RD — Observatorio de ciberamenazas del Caribe

Documento de diseño para evolucionar Watchpost hacia un observatorio público e independiente
de ciberamenazas centrado en República Dominicana y el Caribe. Es un proyecto personal y de
portafolio: no está afiliado al CNCS, a CSIRT-RD ni a ninguna entidad gubernamental.

> Estado: diseño. Nada de esto está implementado todavía en el código del repositorio.

## 1. Principios

1. **Citar, no afirmar.** La plataforma reproduce lo que otras fuentes públicas ya publicaron,
   con atribución, fecha y estado de verificación. No genera acusaciones propias.
2. **Solo inteligencia y reconocimiento pasivo.** Los datos entran únicamente por conectores
   de fuentes abiertas. Sin agentes, sin escaneo activo, sin interacción con actores.
3. **Información de amenaza sí, datos personales no.** Se publica el máximo de contexto de
   amenaza y atribución; nunca datos personales ni contenido filtrado (ver §6).
4. **Estándares abiertos.** STIX 2.1 / TAXII 2.1, TLP 2.0, PAP, MITRE ATT&CK, código Admiralty.
5. **Español primero**, zona horaria `America/Santo_Domingo` (UTC-4, sin horario de verano).

## 2. Arquitectura en dos capas

| Capa | Contenido | Acceso |
|---|---|---|
| Laboratorio privado | OpenCTI, MISP, OpenSearch, conectores, datos crudos y borradores | Solo el analista, detrás de VPN |
| Sitio público | Datasets curados y agregados (TLP:CLEAR), análisis, metodología, perfil | Público, solo lectura |

La exportación es en un solo sentido (laboratorio → público) y pasa por una compuerta de
revisión que bloquea la publicación si detecta datos personales.

## 3. Stack

| Función | Herramientas |
|---|---|
| Inteligencia | OpenCTI + MISP (sincronización bidireccional) |
| Almacén y analítica | OpenSearch + OpenSearch Dashboards |
| Backend | FastAPI + PostgreSQL (SQLAlchemy, Alembic) |
| Orquestación | Prefect o APScheduler |
| Identidad y secretos | Keycloak (OIDC, MFA), OpenBao |
| Despliegue | Docker Compose (laboratorio) → Kubernetes (fase final) |
| Visualización pública | D3 (mapas, grafos, series) sobre las geometrías de `geo/` |

## 4. Catálogo de fuentes (abiertas y pasivas)

- **Vulnerabilidades:** CISA KEV, FIRST EPSS, NVD 2.0, OSV, CISA Vulnrichment.
- **Reputación e IOC:** abuse.ch, AlienVault OTX, AbuseIPDB, feeds por defecto de MISP.
- **Internet de RD:** LACNIC (recursos con `CC=DO`), RIPEstat, RouteViews/RIS, Routinator (RPKI),
  IODA y Cloudflare Radar (disponibilidad).
- **Superficie expuesta (pasiva):** Shodan InternetDB, Certificate Transparency (crt.sh), RDAP.
- **Reclamos públicos:** rastreadores de ransomware de acceso público, prensa especializada
  y avisos de CERTs, siempre citados.
- **Conocimiento:** MITRE ATT&CK, CAPEC, CWE, taxonomías y galaxias de MISP.
- **Eventos naturales:** USGS, NOAA NHC, GDACS.

Cada conector registra la licencia, los términos de redistribución y el TLP de su fuente.

## 5. Módulos

- **Centro de mando:** mapa coroplético de las 32 provincias, nivel de amenaza, indicadores y feed.
- **Radar de reclamos:** reclamos citados con estado de verificación y corroboración por fuentes.
- **Mapa del Caribe:** actividad por país, campañas multipaís y capas de eventos naturales.
- **Actores:** perfiles construidos con referencias públicas, grafo de relaciones y TTP en ATT&CK.
- **Vulnerabilidades KEV:** exposición agregada por sector y provincia (sin IP ni organizaciones).
- **Internet RD:** BGP, RPKI y conectividad por ASN, cruzados con eventos naturales.
- **Marca y phishing:** dominios similares detectados en Certificate Transparency.
- **Reportes:** panorama trimestral con juicios clave y lenguaje de probabilidad estimativa.
- **Datos abiertos:** feed STIX/TAXII y dataset histórico agregado con diccionario de datos.
- **Metodología, fuentes, transparencia y perfil profesional.**

## 6. Política de publicación

| Se publica | No se publica nunca |
|---|---|
| Nombre de la organización señalada en un reclamo público, citado y con estado de verificación | Nombres, correos, teléfonos o documentos de personas |
| Actor, alias, sector, país, fechas | Credenciales, contraseñas o tokens |
| Cifras declaradas por la fuente | Muestras, descargas o contenido filtrado |
| TTP y mapeo ATT&CK | Enlaces a sitios de filtración |
| Fuentes citadas con copia archivada | Afirmar un hecho como cierto |

**Estados de verificación:** reclamado (no verificado) · reportado por prensa · confirmado por la
organización · desmentido o retirado. **Derecho de respuesta y retiro** siempre disponibles.

**Base legal a revisar con un abogado local antes del lanzamiento:** Ley 172-13 (datos personales),
Ley 53-07 (delitos de alta tecnología) y el riesgo de difamación al nombrar organizaciones.

## 7. Refactorización del código actual

| Módulo actual | Destino |
|---|---|
| `watchpost/server.py` | FastAPI, con la lógica de dominio en `watchpost/services/` |
| `watchpost/db.py` | PostgreSQL para estado; OpenSearch para hallazgos |
| `watchpost/geo.py` (sintético) | `watchpost/enrich.py` con ASN, país y provincia reales |
| `watchpost/rules.py` | Reglas de inteligencia declarativas (YAML) |
| `watchpost/correlate.py` | Se reutiliza, agrupando por actor, campaña, sector y CVE |
| `watchpost/attack.py` | ATT&CK completo desde STIX |
| `watchpost/report.py`, `pdfwriter.py` | Boletines en español |
| `static/` | Interfaz en español; mapas con las geometrías de `geo/` |
| Nuevo `watchpost/connectors/` | Un cliente por fuente: fetch → STIX → enriquecimiento → destino |

## 8. Roadmap

1. **Fundaciones:** FastAPI + PostgreSQL, Docker, CI, español y zona horaria.
2. **Inteligencia RD:** conectores KEV, EPSS, LACNIC e InternetDB; mapa de provincias.
3. **Reclamos citados:** radar, estados de verificación, archivo de fuentes, compuerta de revisión.
4. **Análisis:** actores, reportes trimestrales, feed STIX/TAXII.
5. **Escala regional:** mapa del Caribe, BGP/RPKI, eventos naturales.

## 9. Recursos en esta carpeta

- `mockups/`: maquetas de referencia (datos y organizaciones ficticios).
- `geo/prov.json`: 32 provincias de RD (fuente: geoBoundaries, CC BY 4.0), simplificadas y con
  anillos en sentido horario para D3.
- `geo/carib.json`: países del Caribe y alrededores (fuente: Natural Earth, dominio público).

### Maquetas

| Vista | Archivo |
|---|---|
| Radar de reclamos | `mockups/08-radar.png` |
| Ficha de reclamo | `mockups/09-ficha-reclamo.png` |
| Ficha de actor | `mockups/07-ficha-actor.png` |
| Estadísticas | `mockups/10-estadisticas.png` |
| Metodología | `mockups/11-metodologia.png` |
| Política de datos | `mockups/15-politica-datos.png` |
