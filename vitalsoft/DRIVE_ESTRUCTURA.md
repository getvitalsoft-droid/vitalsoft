# VitalSoft — Estructura de Google Drive

## Carpeta raíz compartida contigo (admin)
```
📁 VitalSoft — Clientes/
```

## Por cada cliente nuevo crear:
```
📁 VitalSoft — Clientes/
  📁 [NombreCliente] — [Plan] — [MesAño]/
    📁 01_Material_Original/
    📁 02_Shorts_Entregados/
    📁 03_Revisiones/
    📁 04_Archivos_Finales/
    📄 INSTRUCCIONES.txt
```

## Ejemplo real:
```
📁 VitalSoft — Clientes/
  📁 JavierMartinez — Growth — Jun2025/
    📁 01_Material_Original/
        episodio_42_raw.mp4
        episodio_43_raw.mp4
    📁 02_Shorts_Entregados/
        javier_ep42_clip_01_v1.mp4
        javier_ep42_clip_02_v1.mp4
        javier_ep43_clip_01_v1.mp4
    📁 03_Revisiones/
        javier_ep42_clip_01_v2.mp4   ← tras pedir cambio
    📁 04_Archivos_Finales/
        javier_ep42_clip_01_final.mp4
        javier_ep42_clip_02_final.mp4
    📄 INSTRUCCIONES.txt
```

## Naming de archivos
```
[cliente]_[episodio]_clip_[número]_[versión].mp4

Ejemplos:
  javier_ep42_clip_01_v1.mp4    ← primera entrega
  javier_ep42_clip_01_v2.mp4    ← tras revisión
  javier_ep42_clip_01_final.mp4 ← aprobado
```

## INSTRUCCIONES.txt (plantilla para cada cliente)
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BIENVENIDO A TU ESPACIO VITALSOFT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📂 CÓMO FUNCIONA ESTA CARPETA

01_Material_Original/
→ Sube aquí tus episodios o grabaciones en bruto.
→ Formatos aceptados: MP4, MOV, AVI, MKV
→ Calidad mínima: audio claro, sin ruido extremo

02_Shorts_Entregados/
→ Aquí encontrarás los clips editados listos para publicar.
→ Revísalos y dinos si necesitas algún ajuste.

03_Revisiones/
→ Si pediste cambios, la versión revisada estará aquí.

04_Archivos_Finales/
→ Versiones definitivas aprobadas por ti.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PLAZOS IMPORTANTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏱️ El plazo de entrega (24-48h) empieza cuando:
   1. Subas el material a esta carpeta
   2. Nuestro equipo valide que es apto para edición

Si el material tiene problemas de calidad, te avisaremos
antes de empezar para que puedas corregirlo.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTACTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📧 getvitalsoft@gmail.com
🌐 vitalsoft.pro
```

## Permisos por carpeta

| Carpeta | Cliente | VitalSoft |
|---------|---------|-----------|
| 01_Material_Original | Editor (puede subir) | Editor |
| 02_Shorts_Entregados | Lector (solo ver/descargar) | Editor |
| 03_Revisiones | Lector | Editor |
| 04_Archivos_Finales | Lector | Editor |

**Importante:** Nunca dar permiso "Editor" completo al cliente en toda la carpeta.
Solo en 01_Material_Original para que pueda subir sus archivos.

## Checklist al crear cliente nuevo

- [ ] Crear carpeta con formato [Nombre] — [Plan] — [MesAño]
- [ ] Crear las 4 subcarpetas
- [ ] Crear y subir INSTRUCCIONES.txt
- [ ] Dar acceso de Editor al cliente solo en 01_Material_Original
- [ ] Copiar el link de la carpeta raíz y guardarlo en el order de Supabase
- [ ] Enviar el link al cliente por email (o esperar onboarding donde lo pide)
