# Círculo logístico y empresas partner

Documento de contexto para retomar el desarrollo. Resume lo conversado en octubre de 2026 con Johan (sistemas, Agroindustrial Andahuasi S.A.A.). No es un diseño cerrado de órdenes de compra ni de almacén: fija el modelo, las decisiones ya tomadas y el orden en que se quiere seguir.

Fecha de corte: 21 de octubre de 2026.

## Para qué sirve

El legado SIGERP (VB.NET, WinForms, desde inicios de los 2000, TFS en `D:\TFS\SIGERP`) sigue operando. Al lado está el stack web: `api-andahuasi-pe` y `erp-andahuasi`. La idea no es reescribir el ERP de un golpe. Es agregar valor sobre lo que ya existe: visibilidad, amarre y seguimiento, empezando por el presupuesto de consumo.

Quien retome el trabajo debe leer este archivo antes de proponer pantallas o tablas nuevas.

## El modelo que el software tiene que soportar

No es un arreglo temporal. Llevan unos 17 años así, y desde 2024 las compras y ventas legales pasan por empresas partner.

| Empresa | Id | Papel |
|---|---|---|
| Agraria (Andahuasi S.A.A.) | `02` | Sistema de registro contable. Aquí se hace el presupuesto y la solicitud de compra. Aquí viven los asientos. Base `AndahuasiBD`. |
| San Nicolás | `05` | Partner. Compra, vende, contrata personal eventual y transfiere documentos a la agraria. |
| KM 41.5 | `06` | Partner. Mismo papel que San Nicolás. |

Campo y fábrica siguen operando con trabajadores accionistas. Los estables siguen en la agraria y cobran en efectivo. Los eventuales los contratan KM 41.5 y San Nicolás y se les paga por banco, con planilla formal.

Una sola operación física puede tener varias personas jurídicas:

```text
Proveedor o cliente real
        │
        ▼
Partner (KM 41.5 o San Nicolás)
  compra, venta, personal eventual, documento legal
        │
        ▼  transferencia documental
Agraria
  asiento, inventario y costo
  en contabilidad el "proveedor" o "cliente" es la partner
```

Las partner no tienen en SIGERP contabilidad, banco, caja ni tesorería. El análisis de cuenta de proveedores de la agraria (`ProcesoAnalisisCuenta`, cuenta 42102, `CuentaCorriente`) sigue existiendo, pero ahora casi solo habla de las partner. El proveedor real quedó fuera de esa cuenta corriente. No se rompió por un bug: el modelo cambió y el análisis no lo siguió.

No conviene montar un segundo ERP financiero (contabilidad + tesorería) dentro de cada partner. Conviene una capa de trazabilidad: esta deuda o este documento de la partner corresponde a este proveedor real, esta orden y este comprobante. La agraria sigue haciendo el asiento contra la partner.

## El círculo que se quiere unir

El proceso logístico de materiales empieza en el presupuesto y sigue en la agraria. En presupuesto el rubro se llama **consumo**. En solicitud, orden de compra e ingreso de almacén se llama **materiales**. Se decidió no uniformar el nombre: cada momento conserva el suyo. En pantalla el título es «Presupuesto de consumo» y el subtítulo «Materiales».

```text
Presupuesto de consumo (anual, agraria)
        │
        ▼
Solicitud de compra de materiales
        │
        ▼
Orden de compra
        │
        ▼
Ingreso de almacén
        │
        ▼
Salida de almacén
```

Ese círculo es el que hay que poder seguir de punta a punta, y más adelante cruzarlo con la transferencia partner → agraria, para que no se pierda quién compró de verdad, a qué centro de costo fue y qué documento contable lo reflejó.

Hoy el amarre entre eslabones está flojo o muerto. El presupuesto y la solicitud comparten centro de costo, ítem y mes, pero la solicitud ya no guarda de qué partida salió la cantidad.

## Dónde vive cada eslabón hoy

| Eslabón | Dónde | Estado al 21 oct 2026 |
|---|---|---|
| Presupuesto anual de consumo (`TransPptoId` `02`) | Desktop `Presupuesto7.vb` y, en construcción, web | Primera versión web escrita. Sin menú ni permiso. |
| Presupuesto de emergencia (`06`) | Desktop, módulo propio | Se queda en desktop. Solo mejorar notificación y amarres. |
| Solicitud de compra de materiales | Desktop, Gestión operativa, `SolicitudCompraNuevo.vb` | Sigue en agraria. No graba referencia de presupuesto. |
| Orden de compra, ingreso y salida de almacén | Desktop | Aún no se rediseñan. Entran después del amarre presupuesto → solicitud. |
| Análisis de cuenta de proveedores | Contabilidad desktop | Solo ve partners. La capa de proveedor real está pendiente. |
| Planilla y telecrédito de partners | Web ya existente | `05` y `06` leen `BDEMPRESA`. No es contabilidad. |

El plan contable de 5 dígitos (`Presupuesto.vb` y tablas sin el `7`) quedó en 2019. Todo lo nuevo usa el plan de 7 dígitos. El sufijo `7` en formulario o tabla significa esa versión.

## Decisiones ya tomadas

1. No reescribir el ERP. Un feature a la vez, misma arquitectura que fertilización y RR.HH.: controller, servicio, ports, repositorio Dapper, modelos, páginas Razor.
2. Si hay que tocar algo fuera de la carpeta del feature (`ApplicationAuthorization.cs`, menú SQL, `andahuasi-pages.css`, `CLAUDE.md`, `Program.cs`, otro feature, `Presupuesto7.vb`), listar qué se crea, modifica o elimina y esperar confirmación.
3. El primer feature web es solo el presupuesto anual de consumo. Empresa de la sesión (agraria `02`). No se escriben detalles de 5 dígitos. No entran mano de obra, ventas, producción, inversiones, activos fijos, servicios de terceros ni cargas diversas en esta versión, aunque el título debe poder distinguirlos después con un icono.
4. Emergencia `06` no se captura en web. El desktop ya tiene solicitud, autorización, precio, presupuestar, acceso a la solicitud de compra y correos. Más adelante: mejor aviso si el correo falla y amarre del `06` hacia la solicitud. Una bandeja web de solo lectura («mis emergencias pendientes») es opcional y no sustituye el formulario.
5. En presupuesto se dice consumo. En solicitud, orden e ingreso se dice materiales.
6. No revivir `SolComMatCabRefPpto` como único amarre. Es un id por cabecera, el `INSERT` actual ni lo graba, y desde 2024 está vacío (7 762 solicitudes, 0 con referencia; en toda la historia 578, la última hacia 2017). No existe `SolicitudCompraMaterialPresupuesto`. Las tablas puente de activo y de servicios existen y tenían 0 filas.
7. El amarre futuro es al saldo, no a un solo documento. El stock del centro + ítem + mes suma partidas `02`, `03`, `05` y `06`. La emergencia inyecta saldo. La solicitud descuenta y deja rastro. Al grabar la solicitud, repartir la cantidad en automático (FIFO: primero anual `02`, luego emergencia `06`, o por fecha) en una tabla puente por línea: solicitud, detalle, `PptoCompCabId`, ítem, cantidad, `TransPptoId`. El usuario puede forzar una emergencia concreta. No se le obliga a elegir la cabecera anual.
8. Dos miradas del presupuesto, porque servicentro y electricistas cargan líneas de centros que no son suyos:
   - **Mis centros:** el centro de costo pertenece al GDS del trabajador (`CentroCosto.GerenciaId`, `DptoId`, `SeccId`).
   - **Cargado por mi gente:** el usuario que grabó pertenece a mi GDS, aunque el centro sea de otra área.
   Cada línea debe mostrar quién la cargó. Ver toda la empresa exige un permiso fuera del feature. Ese permiso no está hecho.
9. El centro de costo se puede cambiar antes de grabar. Al grabar queda fijo. Otro centro es otro documento. Las 12 cabeceras mensuales se crean al grabar, junto con las líneas, no al presionar Enter.
10. El comodín de búsqueda del centro es `*`, no `%`. `camion*24` encuentra «camion volvo nro 24». Un `%` escrito por el usuario es literal. El `%` del `LIKE` lo pone el servidor, en un parámetro.

## Presupuesto de consumo: cómo está armado

Formulario desktop: `D:\TFS\SIGERP\Presupuesto\Presupuesto\Formularios\Presupuesto7.vb`.

Tablas: `PresupuestoCompraCabecera`, `PresupuestoCompraDetalle7`, `PrecioCompraProyectado`.

`TransPptoId` en `TransaccionPresupuestal`:

| Id | Uso |
|---|---|
| `02` | Anual. Es el que edita la web. |
| `03` | Ajustes. |
| `04` | Presupuesto real de almacén. |
| `05` | Parada. |
| `06` | Emergencia. Desktop. |

Un presupuesto que el usuario ve como un documento del año son 12 cabeceras, una por mes, con los mismos 5 dígitos finales. El id es: dígito de empresa sin cero + `TransPptoId` + año + mes de 2 dígitos + correlativo de 5. Ejemplo: `20220271200239` = empresa 2, transacción `02`, año 2027, mes 12, correlativo `00239`. El desktop solo inserta los meses con cantidad. La web, al grabar, inserta las 12 cabeceras.

Correlativo de consumo anual: `TipMovId` `1`, `MovId` `5`, `CorrMes` `0`, se incrementa `CorrPrimero` con `UPDLOCK`/`HOLDLOCK`. Consumirlo en producción está aceptado mientras las pruebas sean el presupuesto 2027 de sistemas del propio usuario.

Códigos:

- Ítem de almacén, 8 dígitos: `GrpAlmId`(2) + `ClsAlmId`(3) + `IteAlmId`(3).
- Centro de costo, 15 dígitos: `CenCostCost`(2) + `CenCostCamp`(5) + `CenCostProd`(2) + `CenCostResp`(2) + `ActivId`(2) + `TareaId`(2).
- Cuenta de 7 dígitos: `GrupoAlmacen.IteAlmCtaCompra7`.
- Monto guardado en el detalle (`PptoCompDetMonto`) queda en 0, igual que el desktop. El monto que se muestra es cantidad del mes por `PrecioCompraProyectado` de ese mes (`MonedaId` `01`). Si los precios del año no son iguales, la columna Precio dice «Varía». El total anual es la suma de (cantidad del mes × precio del mes), no un solo precio por la cantidad del año.
- El pie de la grilla suma solo dinero, con «S/». No suma cantidades de ítems distintos.

Centro activo (empresa `02` y `04`): `CenCostEstado` distinto de `0`, `CenCostAgr` distinto de `0`, `CenCostCost` distinto de `00`, y la sección funcional activa. Empresa `01` usa `CenCostInd`. Empresa `03` usa `CenCostMan`. Si el centro existe y está inactivo, no se puede usar. Si el código no tiene 15 dígitos: «Ingrese correctamente el código del centro de costo.»

Periodo: `EstadoPresupuesto`, abierto solo si `EstPptoEstad` = 1 para la transacción, el año del presupuesto y el mes calendario del servidor. Si está cerrado: «El periodo de registro presupuestal está cerrado o no está autorizado. Consulte con el jefe presupuestal.»

Si ya existe un anual del mismo centro, año y usuario, no se crea otro. Sin líneas locales, se abre el documento. Con líneas sin grabar, se advierte y se ofrece el enlace.

## Cómo se ingresa en la web

Rutas ya escritas, sin `[Acceso]` y sin fila de menú. Cualquier usuario logueado puede abrirlas.

- `/presupuesto/consumo` — bandeja.
- `/presupuesto/consumo/nuevo` — alta.
- `/presupuesto/consumo/{anio}/{correlativo}` — documento grabado.

Alta, de arriba hacia abajo:

1. Título «Presupuesto de consumo», icono, año visible. Sin selector de tipo.
2. Centro de costos. Enter busca los 15 dígitos. Doble clic abre el buscador por nombre. Ayuda: «Enter filtra. * deja texto en medio: camion*24.» Se puede cambiar hasta grabar.
3. Abajo, los ítems. Agregar abre un modal del kit: primero el ítem de almacén; luego código, descripción, unidad y precio proyectado de solo lectura. Cada mes es un interruptor: apagado = cantidad 0 e input deshabilitado; encendido = cantidad obligatoria mayor que 0. Cancelar y un solo Guardar.
4. La grilla muestra código, descripción, precio, Ene–Dic, total cantidad y total S/. Un segmentado Cantidad | Monto cambia solo las celdas de los meses.
5. Un solo primario: Grabar. Recién ahí se crean las 12 cabeceras y las líneas. Si una línea posterior falla, igual se va al detalle para no crear un segundo documento.

En el detalle el centro es de solo lectura: «Quedó fijo al grabar el presupuesto.»

Carpetas del feature:

- API: `src\Models\Presupuesto\Consumo`, `src\BusinessCore\Presupuesto\Consumo`, `src\Infrastructure\Presupuesto\Consumo`, `src\SigerpApi\Controllers\Presupuesto\Consumo`.
- ERP: `Pages\Presupuesto\Consumo`. El CSS de esta pantalla está en la propia página, no en `andahuasi-pages.css`.

## Qué falta, en el orden acordado

1. Cerrar el presupuesto de consumo que ya está escrito: menú, permiso, y la mirada «ver toda la empresa» si se pide. Probar de punta a punta con el presupuesto 2027 de sistemas.
2. En desktop, sin rehacer el formulario de emergencia: que al presupuestar quede el vínculo al `PptoCompCabId` `06`, y mejorar el aviso (autorizar, presupuestar, observar, correo vacío o fallido).
3. Solicitud de compra: saldo visible de centro + ítem + mes (`02` + `06` y los otros que ya suma el desktop) y tabla puente de consumo por línea. FIFO automático. No un solo `RefPpto`.
4. Recién después, orden de compra, ingreso de almacén y salida de almacén, conservando el nombre materiales y el rastro hasta la partida de presupuesto.
5. En paralelo, cuando toque compras de verdad: la capa proveedor real → documento partner → transferencia → asiento de agraria. Eso explica la cuenta corriente. No reemplaza Contabilidad ni crea tesorería en la partner.

Fuera de este corte: edición web de cargas, inversiones, terceros y tributos; mano de obra; ventas; producción; reescritura de `Presupuesto7.vb`.

## Cómo está corrido en local

La API de este feature se levantó con entorno Production y `--no-launch-profile`, en `https://localhost:7255`, porque el perfil `https` fuerza Development y otra base. El ERP se deja en Development, `https://localhost:7091`, para que llame a esa API local. Si el ERP arranca con `appsettings.json` de no-Development, llama a `https://api.andahuasi.com`, que no tiene este feature.

`scripts/start-dev.ps1` sigue subiendo la API en Development. No usarlo mientras se quiera la base de producción.

En Development, `ConnectionStringResolver` usa siempre la cadena de la agraria. En Production, la empresa `02` lee `AndahuasiBD` y las partner `05`/`06` leen `BDEMPRESA`. No copiar contraseñas de los `appsettings` a chats ni a este documento.

Razor y el repositorio no se recargan solos: después de un cambio hay que reiniciar el proceso. Compilar a una carpeta temporal si el `.exe` está tomado (`MSB3027`).

## Cómo retomar en otro chat

Pedir que se lea `docs/logistica/circulo-logistico.md` en `erp-andahuasi` y decir en qué eslabón se sigue. El corte natural es terminar consumo (menú y permiso) o pasar al amarre de la solicitud. No abrir órdenes de compra ni tesorería de partner antes de eso, salvo que se pida explícitamente.
