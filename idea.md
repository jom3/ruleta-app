# idea.md — Ruleta de elementos por categoría (MVP)

## 1. Resumen

App web pública y multiusuario donde cada persona crea categorías con elementos (y variantes opcionales) y gira una ruleta animada que sortea un elemento por categoría. Los elementos que salieron recientemente tienen menos probabilidad de repetirse. Caso de uso principal: variar las tecnologías de los proyectos propios, aunque el usuario puede usarla para cualquier otra cosa.

## 2. Usuario final y problema

- **Usuario final:** cualquier persona que quiera sortear opciones. Caso principal: alguien que quiere forzarse a probar tecnologías distintas (ej. cada semana girar "Front" y "Back" y hacer un proyecto con lo que salga).
- **Problema:** sin un mecanismo externo, se tiende a repetir siempre las mismas opciones. La ruleta fuerza la variedad y reduce la probabilidad de repetir lo que salió hace poco.
- **Acceso:** la app se publica en un dominio abierto; cualquiera puede registrarse y usarla.

## 3. Glosario

- **Usuario:** persona con cuenta. Cada usuario solo ve y modifica sus propios datos.
- **Categoría:** grupo de elementos definido por el usuario (ej. "Front").
- **Elemento:** opción que puede salir en una categoría (ej. "React"). Antes se llamaba "tecnología"; se usa el término neutro "elemento".
- **Variante:** subopción opcional de un elemento (ej. "TS", "JS" para "React").
- **Giro:** cada vez que el usuario sortea una categoría.
- **Historial de giros:** registro interno de los resultados de los giros de cada categoría. Se usa para la penalización; no se muestra al usuario en el MVP.
- **Peso:** valor relativo de un elemento en el sorteo; la probabilidad es su peso dividido por la suma de los pesos de la categoría.

## 4. Funcionalidades del MVP

### F-01 — Registro e inicio de sesión con correo y contraseña
- **Prioridad:** esencial
- **Descripción:** el usuario crea una cuenta e inicia sesión con correo y contraseña.
- **Flujo:**
  1. El usuario abre el registro e ingresa correo y contraseña.
  2. El sistema valida los datos y crea la cuenta.
  3. El usuario queda dentro de la app, con estado inicial vacío (F-06).
  4. En visitas posteriores, el usuario inicia sesión con su correo y contraseña.
- **Reglas de negocio:**
  - Contraseña: mínimo 8 caracteres, sin exigir letras, números ni símbolos (la mezcla de caracteres queda para la versión 2).
  - Un correo solo puede tener una cuenta; no se duplican cuentas.
  - Si se registra un correo que ya existe, se avisa que ya tiene cuenta y que inicie sesión (con Google, si esa fue su vía de acceso).
  - Los datos de cada usuario están completamente separados de los de otros.
- **Casos de error y límite:**
  - Correo con formato inválido: se rechaza con mensaje.
  - Contraseña de menos de 8 caracteres: se rechaza con mensaje.
  - Credenciales incorrectas al iniciar sesión: se muestra un mensaje de error sin revelar cuál dato falló.
  - Correo ya registrado al crear cuenta: se avisa (riesgo menor aceptado: esto revela que el correo tiene cuenta).
  - Un usuario sin sesión no puede acceder a categorías, elementos ni giros.
- **Criterios de aceptación:**
  - Una persona nueva puede registrarse con correo y una contraseña de 8 o más caracteres y queda dentro de la app.
  - Un intento con contraseña de menos de 8 caracteres es rechazado con mensaje.
  - Registrar dos veces el mismo correo no crea una segunda cuenta y muestra el aviso.
  - Un usuario registrado puede cerrar sesión y volver a entrar con sus credenciales.
  - Un usuario sin sesión que intenta abrir una pantalla de la app es dirigido al inicio de sesión.

### F-02 — Gestión de categorías
- **Prioridad:** esencial
- **Descripción:** el usuario crea y borra sus categorías. No hay edición.
- **Flujo:**
  1. Crear: el usuario ingresa un nombre y confirma; la categoría aparece en su lista, sin elementos.
  2. Borrar: el usuario elige borrar una categoría, el sistema pide confirmación y, al confirmar, borra la categoría junto con sus elementos, variantes e historial de giros.
- **Reglas de negocio:**
  - El nombre es obligatorio (no vacío).
  - El nombre es único por usuario, sin distinguir mayúsculas ("Front" y "front" son el mismo nombre).
  - Borrar una categoría borra en cascada sus elementos, variantes e historial.
  - No hay edición; si hay un error, se borra y se crea de nuevo.
- **Casos de error y límite:**
  - Nombre vacío: se rechaza con mensaje.
  - Nombre repetido (sin distinguir mayúsculas): se rechaza con mensaje.
  - Cancelar la confirmación de borrado: no se borra nada.
- **Criterios de aceptación:**
  - Se puede crear una categoría con nombre válido y aparece en la lista.
  - Crear "Front" teniendo "front" es rechazado con mensaje.
  - Crear una categoría con nombre vacío es rechazado con mensaje.
  - Borrar pide confirmación; al confirmar, desaparecen la categoría, sus elementos, variantes e historial.
  - Dos usuarios distintos pueden tener categorías con el mismo nombre sin conflicto.

### F-03 — Gestión de elementos y variantes
- **Prioridad:** esencial
- **Descripción:** dentro de una categoría, el usuario crea y borra elementos; dentro de un elemento, crea y borra variantes opcionales. No hay edición.
- **Flujo:**
  1. Crear elemento: el usuario elige una categoría, ingresa un nombre y confirma; el elemento aparece en la categoría, sin variantes.
  2. Crear variante: el usuario elige un elemento, ingresa un nombre y confirma; la variante aparece bajo el elemento.
  3. Borrar elemento: tras confirmación, se borra el elemento y sus variantes.
  4. Borrar variante: se borra solo esa variante.
- **Reglas de negocio:**
  - Los nombres son obligatorios (no vacíos).
  - Nombre de elemento único dentro de su categoría, sin distinguir mayúsculas.
  - Nombre de variante único dentro de su elemento, sin distinguir mayúsculas.
  - Un elemento puede tener cero, una o varias variantes.
  - Si se borra un elemento, deja de contar para la penalización.
  - Si se necesita otra versión de algo, se crea como variante (no como elemento duplicado).
- **Casos de error y límite:**
  - Nombre vacío o repetido: se rechaza con mensaje.
  - Borrar un elemento que salió en los últimos giros: se permite; deja de contar para la penalización.
  - Borrar elementos hasta quedar con menos de 2 en la categoría: se permite; el giro quedará bloqueado (F-04).
- **Criterios de aceptación:**
  - Se puede crear un elemento con nombre válido en una categoría.
  - Crear "React" teniendo "react" en la misma categoría es rechazado; en otra categoría del mismo usuario sí se permite.
  - Se pueden crear 0, 1 o varias variantes en un elemento; una variante repetida (sin distinguir mayúsculas) en el mismo elemento es rechazada.
  - Borrar un elemento también borra sus variantes.

### F-04 — Giro (sorteo con penalización)
- **Prioridad:** esencial
- **Descripción:** el usuario gira una categoría y el sistema sortea un elemento (y una variante, si el elemento tiene) aplicando la regla de penalización.
- **Flujo:**
  1. El usuario elige una categoría y pulsa girar.
  2. El sistema verifica que la categoría tenga al menos 2 elementos.
  3. El sistema calcula los pesos según el historial de la categoría (ver regla de penalización).
  4. El sistema sortea un elemento según esos pesos.
  5. Si el elemento tiene variantes, sortea una con igual probabilidad entre todas.
  6. El sistema registra el giro en el historial de la categoría y entrega el resultado (elemento + variante si tiene) a la animación (F-05).
- **Reglas de negocio — penalización (por categoría):**
  - Sin historial, todos los elementos pesan igual.
  - El elemento que salió en el último giro de la categoría pesa 1/10 de su peso normal.
  - El elemento que salió en el giro anterior pesa 1/2 de su peso normal.
  - Si un mismo elemento salió en ambos giros, se aplica solo 1/10 (no se acumulan).
  - Los demás elementos mantienen su peso normal.
  - Las probabilidades se reajustan para sumar 100%.
  - Se penaliza el elemento completo, no la variante; las variantes no tienen penalización en el MVP.
  - Ningún elemento queda con probabilidad 0: todos pueden salir.
  - Solo cuentan los 2 últimos giros de esa misma categoría; los giros de otras categorías no influyen.
  - Si el historial tiene menos de 2 giros, solo se penaliza con lo que haya.
  - Un elemento borrado deja de contar para la penalización.
  - El mínimo de 2 elementos cuenta el total de la categoría, aunque estén penalizados.
  - Ejemplo (10 elementos, con 2 giros en el historial y elementos distintos): último ≈ 1%, anterior ≈ 6%, cada uno de los demás ≈ 12%.
- **Casos de error y límite:**
  - Categoría con 0 o 1 elementos: no se puede girar y se muestra un aviso.
  - Primer giro de una categoría: todos con el mismo peso.
  - Fallo al guardar el giro o al calcular el resultado: se muestra un mensaje de error y no se registra un giro incompleto.
- **Criterios de aceptación:**
  - Una categoría con menos de 2 elementos no permite girar y muestra un aviso.
  - En una categoría de 10 elementos con 2 giros previos de elementos distintos, las probabilidades calculadas son aproximadamente 1% (último), 6% (anterior) y 12% (cada uno de los demás).
  - Si el mismo elemento salió en los 2 últimos giros, su peso es 1/10 (no se acumula).
  - Todo elemento tiene probabilidad mayor que 0 de salir.
  - Si el elemento ganador tiene variantes, el resultado incluye una variante; si no tiene, solo el elemento.
  - Los giros de una categoría no alteran las probabilidades de otra categoría.
  - Cada giro queda registrado en el historial de su categoría.

### F-05 — Animación de ruleta
- **Prioridad:** esencial
- **Descripción:** al girar se muestra una animación de ruleta que termina mostrando el resultado.
- **Flujo:**
  1. El usuario pulsa girar.
  2. El botón de girar se bloquea.
  3. Se muestra una animación de ruleta de unos 4 segundos.
  4. La animación termina mostrando el ganador (elemento + variante si tiene).
  5. El botón de girar se desbloquea.
- **Reglas de negocio:**
  - El resultado se decide antes de la animación; la animación solo lo muestra.
  - El botón queda bloqueado mientras gira, para evitar giros dobles.
  - Solo se muestra el resultado ganador; no se muestra lista de giros pasados.
  - El giro queda registrado en el historial al pulsar el botón, aunque el usuario cierre la página durante la animación.
  - La interfaz (incluida la animación) debe verse bien en móvil, tablet y escritorio.
- **Casos de error y límite:**
  - Pulsar girar repetidamente: solo cuenta el primer giro.
  - Cerrar o recargar la página durante la animación: el giro ya quedó registrado.
- **Criterios de aceptación:**
  - Al pulsar girar se ve una animación de ruleta de aproximadamente 4 segundos que termina en el resultado.
  - El resultado mostrado coincide con el resultado registrado en el historial.
  - Durante la animación el botón de girar no responde a nuevos clics.
  - La animación y el resultado se ven correctamente en móvil, tablet y escritorio.

### F-06 — Estado inicial vacío
- **Prioridad:** importante
- **Descripción:** un usuario nuevo empieza sin categorías, elementos ni variantes, y ve un mensaje que le indica qué hacer primero.
- **Flujo:**
  1. El usuario nuevo entra por primera vez.
  2. Ve su lista vacía y un mensaje que le indica crear su primera categoría.
- **Reglas de negocio:**
  - No hay datos de ejemplo precargados.
  - Cada usuario define sus propias categorías y elementos.
- **Casos de error y límite:**
  - Usuario que borra todas sus categorías: vuelve a ver el mensaje de estado vacío.
- **Criterios de aceptación:**
  - Una cuenta nueva no tiene ninguna categoría y muestra un mensaje que indica qué hacer primero.
  - Si el usuario borra todas sus categorías, vuelve a verse ese mensaje.

### F-07 — Recuperar contraseña por correo
- **Prioridad:** importante
- **Descripción:** si un usuario con cuenta de correo y contraseña la olvida, puede restablecerla mediante un correo.
- **Flujo:**
  1. En el inicio de sesión, el usuario elige "olvidé mi contraseña" e ingresa su correo.
  2. El sistema envía un correo con un enlace para restablecerla.
  3. El usuario abre el enlace, ingresa una nueva contraseña y queda restablecida.
- **Reglas de negocio:**
  - La nueva contraseña cumple la misma regla que en el registro (mínimo 8 caracteres).
  - Depende de una integración de envío de correos (ver sección 7).
- **Casos de error y límite:**
  - Correo sin cuenta: se muestra un mensaje; el comportamiento exacto respecto a revelar si el correo existe queda como pregunta abierta.
  - Enlace expirado o inválido: se informa y se permite solicitar otro.
  - Nueva contraseña de menos de 8 caracteres: se rechaza con mensaje.
- **Criterios de aceptación:**
  - Un usuario que solicita recuperar su contraseña recibe un correo con un enlace.
  - Con el enlace puede establecer una contraseña nueva de 8 o más caracteres y luego iniciar sesión con ella.
  - Un enlace inválido o expirado no permite cambiar la contraseña y muestra un mensaje.

### F-08 — Inicio de sesión con Google
- **Prioridad:** importante
- **Descripción:** el usuario puede registrarse o entrar con su cuenta de Google.
- **Flujo:**
  1. El usuario elige entrar con Google y autoriza.
  2. Si el correo no tiene cuenta, se crea una y el usuario entra.
  3. Si el correo ya tiene cuenta (por correo y contraseña), entra a esa misma cuenta con sus mismos datos.
- **Reglas de negocio:**
  - No se crea una cuenta duplicada para un correo existente.
  - Si alguien se registra con correo y contraseña con un correo que ya existe por Google, se le avisa que ya tiene cuenta y que entre con Google.
- **Casos de error y límite:**
  - El usuario cancela la autorización de Google: vuelve al inicio de sesión sin cambios.
  - Fallo de Google: se muestra un mensaje de error y se puede usar correo y contraseña.
- **Criterios de aceptación:**
  - Un usuario puede crear cuenta y entrar usando Google.
  - Entrar con Google usando un correo que ya tiene cuenta manual lleva a la misma cuenta, con las mismas categorías y datos, y no crea otra.
  - Registrar con correo y contraseña un correo que ya existe por Google muestra el aviso indicando que entre con Google.
  - Si Google falla o se cancela, el MVP sigue funcionando con correo y contraseña.

## 5. Entidades y datos principales (conceptual)

- **Usuario:** correo; forma(s) de acceso (correo y contraseña y/o Google). Un correo = una cuenta.
- **Categoría:** nombre. Pertenece a un usuario. Un usuario tiene muchas categorías.
- **Elemento:** nombre. Pertenece a una categoría. Una categoría tiene muchos elementos.
- **Variante:** nombre. Pertenece a un elemento. Un elemento tiene cero o más variantes.
- **Giro (historial):** registra qué elemento (y variante, si aplica) salió en una categoría y en qué orden. Pertenece a una categoría.

**Relaciones:** Usuario 1—N Categoría 1—N Elemento 1—N Variante. Categoría 1—N Giro; cada giro referencia un elemento.

**Restricciones de unicidad (sin distinguir mayúsculas):** nombre de categoría único por usuario; nombre de elemento único por categoría; nombre de variante único por elemento.

**Borrado:** borrar categoría borra elementos, variantes e historial. Borrar elemento borra sus variantes y deja de contar para la penalización.

## 6. Fuera de alcance (explícito)

- Botón "girar de nuevo" (versión 2).
- Penalización de variantes (versión 2; en el MVP todas las variantes tienen igual probabilidad).
- Ejemplos o categorías precargadas.
- Lista o pantalla de giros pasados (el historial es solo interno).
- Edición de categorías, elementos o variantes (se borra y se crea de nuevo).
- Verificación de correo.
- Exigir mezcla de tipos de caracteres en la contraseña (versión 2).
- Ruleta con lógica distinta a la descrita (el uso para otros fines es posible gracias al lenguaje neutro, pero no hay funcionalidad específica para ellos).

## 7. Integraciones externas

- **Google (inicio de sesión):** permite registrarse o entrar con cuenta de Google (F-08).
- **Envío de correos:** necesario para recuperar contraseña (F-07). Proveedor: por definir.

## 8. Tecnologías

- **Tipo de proyecto:** aplicación web pública, responsive (móvil, tablet y escritorio).
- **Frontend / framework:** Astro, incluyendo uso de islands donde se requiera interactividad. Al usar Astro con renderizado en servidor, se necesita el adapter correspondiente.
- **Base de datos:** SQL en Neon.
- **Hosting y dominio:** Vercel, con el dominio que ofrece Vercel (sin dominio propio).
- **Testing:** Vitest.
- **Autenticación (correo y contraseña, Google):** por definir.
- **Servicio de envío de correos:** por definir.
- **Acceso a datos (cómo la app se conecta a Neon):** por definir.
- **Lenguaje (JavaScript o TypeScript):** por definir.

## 9. Estructura sugerida del proyecto

Genérica, adaptada a Astro; ajustar cuando se definan las tecnologías pendientes.

```
/
├── src/
│   ├── pages/          # Páginas y rutas (inicio de sesión, registro, recuperar contraseña, panel de categorías, giro)
│   ├── components/     # Componentes de interfaz; islands solo para lo interactivo (ruleta, formularios)
│   ├── layouts/        # Diseños base
│   ├── lib/            # Lógica del dominio (regla de penalización, sorteo, validaciones de nombres)
│   ├── db/             # Acceso a la base de datos y definición de datos
│   └── styles/         # Estilos globales
├── tests/              # Pruebas de Vitest (o junto al código que prueban)
├── public/             # Recursos estáticos
├── README.md
└── (configuración de Astro, adapter de Vercel y variables de entorno)
```

Recomendación: mantener la regla de penalización y las validaciones separadas de la interfaz, para poder probarlas de forma aislada.

## 10. Requisitos de calidad para el desarrollo

- **Testing (Vitest):** probar como mínimo
  - el cálculo de pesos y probabilidades de la penalización (sin historial, con 1 giro, con 2 giros, mismo elemento en ambos giros, elemento borrado);
  - que ningún elemento tenga probabilidad 0;
  - el sorteo de variantes con igual probabilidad y el caso sin variantes;
  - las validaciones de nombres (vacíos, repetidos sin distinguir mayúsculas) en categorías, elementos y variantes;
  - la validación de contraseña (mínimo 8 caracteres);
  - el bloqueo de giro con menos de 2 elementos;
  - el aislamiento de datos entre usuarios.
  - Otras herramientas de prueba (por ejemplo para pruebas de interfaz completas): por definir.
- **Manejo de errores:** mensajes claros al usuario ante nombres inválidos, credenciales incorrectas, fallos de Google, fallos de envío de correo y fallos al guardar un giro. Ningún error debe dejar datos a medias (ej. un giro incompleto).
- **Responsive:** verificar la interfaz en móvil, tablet y escritorio, incluida la animación.
- **Seguridad básica:** cada consulta de datos debe limitarse al usuario autenticado; las contraseñas no se guardan en texto plano; los secretos van en variables de entorno, nunca en el repositorio.
- **Documentación básica (README):** qué es el proyecto, cómo instalarlo y ejecutarlo, variables de entorno necesarias, cómo correr las pruebas, cómo desplegar.
- **Control de versiones:** commits pequeños y con mensajes claros, uno por cambio lógico.

## 11. Supuestos (aprobados)

- La animación de ruleta dura aproximadamente 4 segundos.
- "React" y "react" se consideran el mismo nombre (no se distingue mayúsculas).
- El giro queda registrado en el historial al pulsar el botón, aunque el usuario cierre la página durante la animación.
- Meta de adopción: al menos 5 personas distintas del autor se registran y hacen un giro en el primer mes.
- Si alguien entra con Google con un correo que ya tiene cuenta manual, entra a esa misma cuenta.
- Se acepta el riesgo menor de que el aviso de correo ya registrado revele que ese correo tiene cuenta.
- La app se accede desde cualquier dispositivo con la misma cuenta y los mismos datos.

## 12. Preguntas abiertas

- Servicio de autenticación y de envío de correos: por definir.
- Lenguaje (JavaScript o TypeScript) y forma de acceder a la base de datos desde la app: por definir.
- Al borrar un elemento que estaba en los 2 últimos giros: ¿la ventana de penalización sigue contando esos 2 giros (con uno sin elemento) o se toman los 2 últimos giros cuyo elemento aún existe? No definido.
- Recuperar contraseña con un correo sin cuenta: ¿se revela que no existe o se muestra un mensaje genérico? No definido.
- Qué pasa con la contraseña de una cuenta creada solo con Google si el usuario pide recuperarla: no definido.

## 13. Instrucciones para agentes de desarrollo

- Trabajar por pasos pequeños y verificables; completar una funcionalidad (F-01 a F-08) antes de pasar a la siguiente, empezando por las esenciales.
- No añadir funcionalidades fuera del alcance (ver sección 6).
- Usar siempre los términos del glosario (categoría, elemento, variante, giro) en código, textos y documentación.
- Cada funcionalidad se considera lista solo cuando se cumplen sus criterios de aceptación.
- No elegir por cuenta propia las tecnologías marcadas como "por definir"; pedir confirmación.
- Ante cualquier duda o ambigüedad (incluidas las preguntas abiertas), pedir confirmación antes de decidir.