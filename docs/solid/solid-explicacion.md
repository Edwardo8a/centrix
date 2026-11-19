# Principios SOLID: Fundamentos y Conceptos Generales

Los principios SOLID son cinco directrices de diseno de software orientado a objetos introducidas por Robert C. Martin (Uncle Bob), enfocadas en crear sistemas flexibles, desacoplados, testeables y faciles de mantener a lo largo del tiempo.

---

## 1. S - Single Responsibility Principle (Responsabilidad Unica)

> **"Una clase debe tener una sola razon para cambiar."**

- **Concepto:** Cada clase o modulo debe responsabilizarse de una unica funcion en el sistema.
- **En Centrix:** Separamos Controladores (solo manejan HTTP), Commands (solo transportan datos), Handlers (solo ejecutan un caso de uso), Repositorios (solo escriben en BD), ReadModels (solo leen de BD) y Servicios (solo gestionan tokens o auth).

---

## 2. O - Open/Closed Principle (Abierto / Cerrado)

> **"Las entidades de software deben estar abiertas a extension, pero cerradas a modificacion."**

- **Concepto:** Debe ser posible anadir nuevas funcionalidades al sistema sin alterar ni poner en riesgo el codigo base que ya funciona y esta probado.
- **En Centrix:** Para incorporar un nuevo endpoint, se crea un nuevo Command y Handler (o Query) independiente, sin modificar los handlers existentes.

---

## 3. L - Liskov Substitution Principle (Sustitucion de Liskov)

> **"Los objetos de un programa deben poder ser reemplazados por instancias de sus subtipos sin alterar el correcto funcionamiento del programa."**

- **Concepto:** Las clases hijas o derivadas deben respetar el contrato y comportamiento esperado por los consumidores.
- **En Centrix:** Errores como `BusinessError` y `ValidationError` extienden de la clase nativa `Error` de JavaScript, permitiendo que el middleware `errorHandler.js` los procese polimorficamente sin fallos.

---

## 4. I - Interface Segregation Principle (Segregacion de Interfaces)

> **"Ningun cliente debe ser obligado a depender de metodos que no utiliza."**

- **Concepto:** Es preferible tener interfaces especificas y pequenas en lugar de una interfaz gigante con metodos innecesarios.
- **En Centrix:** Dividimos los accesos a datos en repositorios de escritura (`UserRepository`, `TicketRepository`) y modelos de lectura (`UserReadModel`, `TicketReadModel`, `DepartmentReadModel`). Los contratos se formalizan en `src/contracts/index.js` mediante JSDoc.

---

## 5. D - Dependency Inversion Principle (Inversion de Dependencias)

> **"Los modulos de alto nivel no deben depender de modulos de bajo nivel; ambos deben depender de abstracciones."**

- **Concepto:** El codigo de negocio no debe instanciar directamente clientes de base de datos o librerias externas.
- **En Centrix:** Todos los colaboradores se inyectan a traves del constructor y se configuran centralizadamente en `src/config/container.js` (Composition Root).
