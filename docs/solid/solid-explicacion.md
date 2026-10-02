# Principios SOLID: Fundamentos y Conceptos Generales

Los principios SOLID son cinco directrices fundamentales de diseno de software orientado a objetos, introducidas por Robert C. Martin (Uncle Bob). Su objetivo principal es crear software comprensible, flexible, desacoplado y facil de mantener a lo largo del tiempo.

---

## 1. S — Single Responsibility Principle (Principio de Responsabilidad Unica)

> **"Una clase debe tener una sola razon para cambiar."**

- **Concepto:** Cada modulo o clase debe responsabilizarse de una unica funcionalidad dentro del sistema.
- **Problema que evita:** Evita las "clases dios" o archivos gigantes de mil lineas donde se mezcla logica de negocio, sentencias SQL, formateo HTTP y envio de correos.
- **Beneficio:** Modificar un detalle (por ejemplo, cambiar la plantilla del correo de aviso) no pone en riesgo la persistencia en la base de datos.

---

## 2. O — Open/Closed Principle (Principio de Abierto / Cerrado)

> **"Las entidades de software deben estar abiertas a extension, pero cerradas a modificacion."**

- **Concepto:** Debe ser posible anadir nuevas funcionalidades o comportamientos al sistema sin reescribir ni romper el codigo existente que ya funciona y esta probado.
- **Problema que evita:** Evita tener que alterar codigo base cada vez que el negocio solicita una nueva caracteristica, reduciendo el riesgo de efectos colaterales y regresiones.
- **Beneficio:** Se agregan nuevos roles, estados o tipos de comprobantes mediante extension de catalogos o nuevos adaptadores.

---

## 3. L — Liskov Substitution Principle (Principio de Sustitucion de Liskov)

> **"Si S es un subtipo de T, entonces los objetos de tipo T pueden ser sustituidos por objetos de tipo S sin alterar el funcionamiento del programa."**

- **Concepto:** Las clases hijas o derivadas deben respetar el contrato de su clase padre y comportarse como ella sin causar excepciones inesperadas.
- **Problema que evita:** Evita estructuras fragiles donde se deben colocar condicionales de tipo `if (objeto instanceof Especial)` para que el codigo no explote.
- **Beneficio:** Permite que excepciones como `BusinessError` hereden de la clase nativa `Error` de JavaScript, permitiendo que el middleware de errores centralizado las procese de forma transparente.

---

## 4. I — Interface Segregation Principle (Principio de Segregacion de Interfaces)

> **"Los clientes no deben verse obligados a depender de interfaces que no utilizan."**

- **Concepto:** Es preferible tener multiples interfaces o metodos especificos y pequenos en lugar de una interfaz masiva y generica.
- **Problema que evita:** Evita que componentes que solo necesitan actualizar un estado carguen metodos pesados de auditoria masiva o exportacion a Excel.
- **Beneficio:** Mantiene las clases ligeras, cohesivas y enfocadas solo en las dependencias estrictamente necesarias.

---

## 5. D — Dependency Inversion Principle (Principio de Inversion de Dependencias)

> **"Los modulos de alto nivel no deben depender de modulos de bajo nivel. Ambos deben depender de abstracciones."**

- **Concepto:** Las reglas de negocio (alto nivel) no deben crear directamente con `new` sus conexiones a bases de datos o servicios externos (bajo nivel). En su lugar, estas dependencias se reciben desde afuera (Inyeccion de Dependencias).
- **Problema que evita:** Acoplamiento severo a librerias externas o motores de bases de datos concretos.
- **Beneficio:** Permite sustituir la base de datos real por objetos simulados (`mocks`) durante las pruebas unitarias, ejecutando cientos de tests en segundos sin internet ni dependencias externas.
