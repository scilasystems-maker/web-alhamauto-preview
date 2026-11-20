/* Alhamauto · Volkswagen Huertas Motor */
(function () {
  'use strict';

  var raiz = document.documentElement;
  var reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Aparición suave de bloques al hacer scroll (.revelar) ---------- */
  // Sin IntersectionObserver no se oculta nada: el contenido siempre se ve.
  if ('IntersectionObserver' in window) {
    raiz.classList.add('js');
    var observadorRevelar = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('revelado');
        observadorRevelar.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
    document.querySelectorAll('.revelar, .revelar-lineas').forEach(function (el) { observadorRevelar.observe(el); });
  }

  /* ---------- Cabecera: fondo blanco al hacer scroll ---------- */
  var cabecera = document.getElementById('cabecera');
  var pendiente = false;

  function actualizarCabecera() {
    pendiente = false;
    cabecera.classList.toggle('cabecera--solida', window.scrollY > 8);
  }
  window.addEventListener('scroll', function () {
    if (!pendiente) { pendiente = true; requestAnimationFrame(actualizarCabecera); }
  }, { passive: true });
  actualizarCabecera();

  /* ---------- Menú lateral ---------- */
  var botonAbrir = document.getElementById('abrir-menu');
  var botonCerrar = document.getElementById('cerrar-menu');
  var menu = document.getElementById('menu');
  var velo = document.getElementById('velo');
  var contenido = document.getElementById('contenido');

  function enfocables() {
    return menu.querySelectorAll('a[href], button:not([disabled])');
  }

  function abrirMenu() {
    raiz.classList.add('menu-abierto');
    botonAbrir.setAttribute('aria-expanded', 'true');
    contenido.inert = true;
    cabecera.inert = true;
    // Espera a que el panel sea visible para poder darle el foco
    requestAnimationFrame(function () { botonCerrar.focus(); });
  }

  function cerrarMenu(devolverFoco) {
    if (!raiz.classList.contains('menu-abierto')) return;
    raiz.classList.remove('menu-abierto');
    botonAbrir.setAttribute('aria-expanded', 'false');
    contenido.inert = false;
    cabecera.inert = false;
    if (devolverFoco !== false) botonAbrir.focus();
  }

  botonAbrir.addEventListener('click', abrirMenu);
  botonCerrar.addEventListener('click', function () { cerrarMenu(); });
  velo.addEventListener('click', function () { cerrarMenu(); });

  menu.addEventListener('click', function (e) {
    if (e.target.closest('a[href^="#"]')) cerrarMenu(false);
  });

  document.addEventListener('keydown', function (e) {
    if (!raiz.classList.contains('menu-abierto')) return;
    if (e.key === 'Escape') { cerrarMenu(); return; }
    if (e.key === 'Tab') {
      var lista = enfocables();
      var primero = lista[0];
      var ultimo = lista[lista.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    }
  });

  /* ---------- Modelos: showroom (un modelo cada vez) ---------- */
  // Flechas, miniaturas, teclas ← → con el foco dentro, y deslizar con el dedo o el ratón.
  // El que entra viene del lado hacia el que se avanza y el que sale se va hacia el otro.
  // Un aviso para lectores de pantalla dice qué modelo se muestra.
  var showroom = document.getElementById('modelos');
  if (showroom && showroom.classList.contains('showroom')) {
    var diapos = [].slice.call(showroom.querySelectorAll('.vehiculo'));
    var minis = [].slice.call(showroom.querySelectorAll('.miniatura'));
    var contador = showroom.querySelector('[data-actual]');
    var aviso = showroom.querySelector('.showroom__aviso');
    var listaMinis = showroom.querySelector('.showroom__miniaturas');
    var actualShow = 0;
    var temporizadorSalida = null;

    var irA = function (i, sentido) {
      var total = diapos.length;
      i = (i + total) % total;
      if (i === actualShow) return;
      if (sentido === undefined) sentido = i > actualShow ? 1 : -1;
      showroom.style.setProperty('--sentido', sentido);

      var anterior = diapos[actualShow];
      diapos.forEach(function (d) { d.classList.remove('saliendo'); });
      anterior.classList.remove('activo');
      anterior.classList.add('saliendo');
      clearTimeout(temporizadorSalida);
      temporizadorSalida = setTimeout(function () { anterior.classList.remove('saliendo'); }, 900);

      actualShow = i;
      diapos[i].classList.add('activo');
      minis.forEach(function (m, k) { m.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      if (contador) contador.textContent = String(i + 1).padStart(2, '0');
      if (aviso) aviso.textContent = diapos[i].getAttribute('aria-label');

      // Que la miniatura activa quede a la vista en la tira (móvil)
      var mini = minis[i];
      if (mini && listaMinis) {
        var izq = mini.offsetLeft - (listaMinis.clientWidth - mini.offsetWidth) / 2;
        listaMinis.scrollTo({ left: izq, behavior: reducirMovimiento.matches ? 'auto' : 'smooth' });
      }
    };

    showroom.querySelector('[data-anterior]').addEventListener('click', function () { irA(actualShow - 1, -1); });
    showroom.querySelector('[data-siguiente]').addEventListener('click', function () { irA(actualShow + 1, 1); });
    minis.forEach(function (m) {
      m.addEventListener('click', function () { irA(parseInt(m.dataset.ir, 10)); });
    });

    showroom.addEventListener('keydown', function (e) {
      if (e.target.closest('input, textarea, select')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); irA(actualShow + 1, 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); irA(actualShow - 1, -1); }
    });

    // Deslizar (dedo o ratón) sobre la escena
    var lista = showroom.querySelector('.showroom__lista');
    var inicioX = null, inicioY = null;
    // Sin esto, arrastrar la foto inicia el "arrastrar imagen" del navegador y cancela el gesto
    lista.addEventListener('dragstart', function (e) { e.preventDefault(); });
    lista.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || e.target.closest('a')) return;
      inicioX = e.clientX; inicioY = e.clientY;
    });
    window.addEventListener('pointercancel', function () { inicioX = null; });
    window.addEventListener('pointerup', function (e) {
      if (inicioX === null) return;
      var dx = e.clientX - inicioX, dy = e.clientY - inicioY;
      inicioX = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) irA(actualShow + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    });
    lista.style.touchAction = 'pan-y';   // el desplazamiento vertical de la página sigue funcionando
  }

  /* ---------- Secciones ligadas al scroll: frase (2) y foto que se abre (4) ---------- */
  // Cada sección alta tiene un bloque fijo; el avance p (0 → 1) es lo recorrido de la sección.
  // Con movimiento reducido no se añaden las clases y todo queda visible y quieto.
  var avanceSeccion = function (el) {
    var r = el.getBoundingClientRect();
    var recorrido = r.height - window.innerHeight;
    return recorrido > 0 ? Math.min(1, Math.max(0, -r.top / recorrido)) : 1;
  };
  var acotar = function (x) { return Math.min(1, Math.max(0, x)); };
  var suave = function (t) { return 1 - Math.pow(1 - t, 3); };

  var escenas = [];

  // 2. Frase: las palabras se encienden de gris a blanco
  var frase = document.querySelector('.frase');
  if (frase) {
    var palabras = [].slice.call(frase.querySelectorAll('.palabra'));
    escenas.push({
      el: frase, clase: 'frase--animada',
      pintar: function (p) {
        // Se encienden durante el 15–80 % del recorrido; queda un respiro con la frase completa
        var n = palabras.length;
        palabras.forEach(function (w, i) { w.classList.toggle('encendida', p >= 0.15 + (i + 0.5) * 0.65 / n); });
      },
      quitar: function () { palabras.forEach(function (w) { w.classList.remove('encendida'); }); }
    });
  }

  // 4. Nuevos y de ocasión: la foto se abre del recuadro a la pantalla completa y después sale el texto
  var stock = document.getElementById('nuevos-ocasion');
  if (stock) {
    escenas.push({
      el: stock, clase: 'stock--animada',
      pintar: function (p) {
        // 0–45 %: la foto se abre; 47 %: entra el título; 55–75 %: aparece el resto del texto
        stock.style.setProperty('--abre', suave(acotar(p / 0.45)).toFixed(4));
        stock.classList.toggle('titulo-visible', p >= 0.47);
        stock.style.setProperty('--texto-visible', acotar((p - 0.55) / 0.2).toFixed(3));
      },
      quitar: function () { stock.style.removeProperty('--abre'); stock.style.removeProperty('--texto-visible'); stock.classList.remove('titulo-visible'); }
    });
  }

  if (escenas.length && 'IntersectionObserver' in window) {
    var visibles = [];
    var pendienteEscenas = false;
    var pintarEscenas = function () {
      pendienteEscenas = false;
      visibles.forEach(function (e) { e.pintar(avanceSeccion(e.el)); });
    };
    var activarEscenas = function () {
      escenas.forEach(function (e) {
        if (reducirMovimiento.matches) { e.el.classList.remove(e.clase); e.quitar(); }
        else { e.el.classList.add(e.clase); e.pintar(avanceSeccion(e.el)); }
      });
    };
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        var e = escenas.filter(function (x) { return x.el === en.target; })[0];
        var i = visibles.indexOf(e);
        if (en.isIntersecting && i < 0) visibles.push(e);
        if (!en.isIntersecting && i >= 0) visibles.splice(i, 1);
        if (!reducirMovimiento.matches) e.pintar(avanceSeccion(e.el));
      });
    });
    escenas.forEach(function (e) { obs.observe(e.el); });
    window.addEventListener('scroll', function () {
      if (reducirMovimiento.matches || pendienteEscenas || !visibles.length) return;
      pendienteEscenas = true;
      requestAnimationFrame(pintarEscenas);
    }, { passive: true });
    window.addEventListener('resize', function () { if (!reducirMovimiento.matches) pintarEscenas(); });
    if (reducirMovimiento.addEventListener) reducirMovimiento.addEventListener('change', activarEscenas);
    activarEscenas();
  }

  /* ---------- Taller pieza a pieza: sección fija con el coche cruzando ---------- */
  // Progreso p de 0 a 1 mientras la sección (alta) pasa por la pantalla:
  // - el coche avanza de derecha a izquierda (mira hacia la izquierda);
  // - cada recuadro aparece al pasar su umbral; en móvil se ve solo el actual;
  // - al final aparece el botón de cita.
  // Sin JS o con movimiento reducido no se añade .taller--animado y todo queda visible.
  var taller = document.getElementById('taller');
  if (taller && 'IntersectionObserver' in window) {
    var piezas = [].slice.call(taller.querySelectorAll('.pieza'));
    var cita = taller.querySelector('.taller__cita');
    var coche = taller.querySelector('.taller__coche');
    var progreso = document.createElement('div');
    progreso.className = 'taller__progreso';
    progreso.setAttribute('aria-hidden', 'true');
    piezas.forEach(function () { progreso.appendChild(document.createElement('span')); });
    taller.querySelector('.taller__piezas').insertAdjacentElement('afterend', progreso);
    var marcas = [].slice.call(progreso.children);

    // Umbrales de aparición: el primer punto nada más llegar, el resto hasta el 60 %;
    // la cita al 70 %, con el coche ya aparcado. Queda un tramo corto para leerlo antes de seguir.
    var umbral = function (i) { return 0.02 + i * 0.58 / Math.max(1, piezas.length - 1); };
    var UMBRAL_CITA = 0.7;
    var tallerEnPantalla = false;
    var pendienteTaller = false;

    // Posición horizontal del coche (en vw) según el progreso: entra por la derecha, frena y
    // se queda aparcado en el centro (desde el 62 %), junto al botón de cita. Ya no se va.
    var APARCA = 0.62;
    var posicionCoche = function (p) {
      if (p >= APARCA) return 0;
      var a = p / APARCA;
      return 70 * Math.pow(1 - a, 3);   // 70 → 0, frenando
    };

    var pintarTaller = function () {
      pendienteTaller = false;
      var r = taller.getBoundingClientRect();
      var recorrido = r.height - window.innerHeight;
      var p = recorrido > 0 ? Math.min(1, Math.max(0, -r.top / recorrido)) : 1;

      // Coche: entra por la derecha, cruza y sale por la izquierda (en vw)
      var x = posicionCoche(p);
      coche.style.transform = 'translate3d(' + x.toFixed(2) + 'vw,0,0)';

      var actual = -1;
      piezas.forEach(function (pz, i) {
        var visible = p >= umbral(i);
        pz.classList.toggle('visible', visible);
        if (visible) actual = i;
        marcas[i].classList.toggle('hecho', visible);
      });
      piezas.forEach(function (pz, i) { pz.classList.toggle('actual', i === actual); });
      cita.classList.toggle('visible', p >= UMBRAL_CITA);
    };

    var activarTaller = function () {
      if (reducirMovimiento.matches) {
        taller.classList.remove('taller--animado');
        coche.style.transform = '';
        return;
      }
      taller.classList.add('taller--animado');
      pintarTaller();
    };

    new IntersectionObserver(function (e) {
      tallerEnPantalla = e[0].isIntersecting;
      // Solo se mueve en la versión animada (con movimiento reducido el coche queda quieto y centrado)
      if (tallerEnPantalla && taller.classList.contains('taller--animado')) pintarTaller();
    }).observe(taller);
    window.addEventListener('scroll', function () {
      if (tallerEnPantalla && !pendienteTaller && taller.classList.contains('taller--animado')) {
        pendienteTaller = true;
        requestAnimationFrame(pintarTaller);
      }
    }, { passive: true });
    window.addEventListener('resize', function () { if (taller.classList.contains('taller--animado')) pintarTaller(); });
    if (reducirMovimiento.addEventListener) reducirMovimiento.addEventListener('change', activarTaller);
    activarTaller();
  }

  /* ---------- Formulario de contacto ---------- */
  // 1) Los enlaces con data-motivo (y data-modelo) llegan al formulario con el motivo ya elegido.
  //    También se admite ?motivo=…&modelo=… en la URL, para enlaces desde fuera.
  // 2) Validación propia con mensajes en español (el navegador no muestra sus globos: novalidate).
  // 3) Envío: si el formulario tiene data-endpoint (servicio de envío o webhook de n8n), manda
  //    JSON por POST y muestra el resultado real. Si está vacío, NO simula el envío: avisa de que
  //    aún no está conectado y no manda los datos a ningún sitio.
  var formulario = document.getElementById('formulario-contacto');
  if (formulario) {
    var campoMotivo = formulario.elements.motivo;
    var campoModelo = formulario.elements.modelo;
    var estado = formulario.querySelector('.formulario__estado');
    var botonEnviar = formulario.querySelector('.formulario__enviar');
    var REGEX_TELEFONO = /^(\+34|0034)?[\s.\-]*[6789]([\s.\-]*\d){8}$/;
    var REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    var marcarError = function (campo, hayError) {
      var error = document.getElementById(campo.id + '-error');
      campo.setAttribute('aria-invalid', hayError ? 'true' : 'false');
      if (error) error.hidden = !hayError;
    };

    var elegirMotivo = function (motivo, modelo) {
      if (motivo && campoMotivo.querySelector('option[value="' + motivo + '"]')) {
        campoMotivo.value = motivo;
        marcarError(campoMotivo, false);
      }
      if (modelo) campoModelo.value = modelo;
    };

    document.addEventListener('click', function (e) {
      var enlace = e.target.closest('a[data-motivo]');
      if (enlace) elegirMotivo(enlace.dataset.motivo, enlace.dataset.modelo);
    });

    try {
      var params = new URLSearchParams(location.search);
      elegirMotivo(params.get('motivo'), params.get('modelo'));
    } catch (err) {}

    var validar = function () {
      var el = formulario.elements;
      var errores = [];
      var comprobar = function (campo, ok) { marcarError(campo, !ok); if (!ok) errores.push(campo); };
      comprobar(el.motivo, !!el.motivo.value);
      comprobar(el.nombre, el.nombre.value.trim().length > 1);
      comprobar(el.telefono, REGEX_TELEFONO.test(el.telefono.value.trim()));
      comprobar(el.email, !el.email.value.trim() || REGEX_EMAIL.test(el.email.value.trim()));
      comprobar(el.privacidad, el.privacidad.checked);
      return errores;
    };

    // Al corregir un campo con error, el aviso desaparece en cuanto es válido
    formulario.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true') validar();
    });
    formulario.addEventListener('change', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true') validar();
    });

    var mostrarEstado = function (texto, esError) {
      estado.textContent = texto;
      estado.classList.toggle('formulario__estado--error', !!esError);
      estado.hidden = false;
    };

    formulario.addEventListener('submit', function (e) {
      e.preventDefault();
      estado.hidden = true;

      var errores = validar();
      if (errores.length) { errores[0].focus(); return; }

      // Campo trampa relleno: es un robot; no se envía nada
      if (formulario.elements.web.value) return;

      var endpoint = (formulario.dataset.endpoint || '').trim();
      if (!endpoint) {
        mostrarEstado('Este formulario todavía no está conectado, así que tu mensaje no se ha enviado. ' +
          'Mientras tanto, llámanos al 968 630 264.', true);
        return;
      }

      var el = formulario.elements;
      var datos = {
        motivo: el.motivo.value,
        motivoTexto: el.motivo.options[el.motivo.selectedIndex].text,
        modelo: el.modelo.value.trim(),
        nombre: el.nombre.value.trim(),
        telefono: el.telefono.value.trim(),
        email: el.email.value.trim(),
        mensaje: el.mensaje.value.trim(),
        privacidadAceptada: true,
        concesionario: 'Alhamauto',
        pagina: location.href,
        fecha: new Date().toISOString()
      };

      botonEnviar.disabled = true;
      botonEnviar.textContent = 'Enviando…';
      var controlador = 'AbortController' in window ? new AbortController() : null;
      var limite = setTimeout(function () { if (controlador) controlador.abort(); }, 15000);

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
        signal: controlador ? controlador.signal : undefined
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        formulario.reset();
        mostrarEstado('Gracias. Hemos recibido tu mensaje y te contestaremos lo antes posible.', false);
      }).catch(function () {
        mostrarEstado('No hemos podido enviar tu mensaje. Inténtalo de nuevo o llámanos al 968 630 264.', true);
      }).then(function () {
        clearTimeout(limite);
        botonEnviar.disabled = false;
        botonEnviar.textContent = 'Enviar';
      });
    });
  }

  /* ---------- Enlace con # al cargar (p. ej. .../#nosotros) ---------- */
  // Las secciones animadas que van antes cambian de altura al arrancar, así que el salto
  // automático del navegador (y más con desplazamiento suave) puede quedarse corto o pasarse.
  // Cuando la página ya tiene su altura final, se salta a la sección sin animación.
  if (location.hash.length > 1) {
    var irAlAncla = function () {
      var destino = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (!destino) return;
      raiz.style.scrollBehavior = 'auto';
      destino.scrollIntoView();
      requestAnimationFrame(function () { raiz.style.scrollBehavior = ''; });
    };
    irAlAncla();
    window.addEventListener('load', irAlAncla);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(irAlAncla);
  }

  /* ---------- Botón flotante de WhatsApp ---------- */
  // Visible solo cuando la portada ya ha quedado atrás, y se aparta mientras haya algún
  // botón importante en la franja de abajo de la pantalla (para no taparlo).
  var whatsapp = document.getElementById('whatsapp');
  if (whatsapp && 'IntersectionObserver' in window) {
    var portadaVista = true;
    var protegidosEnFranja = [];
    var actualizarWhatsapp = function () {
      whatsapp.classList.toggle('visible', !portadaVista && !protegidosEnFranja.length);
    };
    new IntersectionObserver(function (e) {
      // "Bajar de la portada": cuando queda menos de un 15 % de ella a la vista
      portadaVista = e[0].intersectionRatio > 0.15;
      actualizarWhatsapp();
    }, { threshold: [0, 0.15, 0.3] }).observe(document.getElementById('inicio'));

    // Franja inferior de 120 px: lo que el botón podría tapar
    var franja = function () { return '-' + Math.max(0, window.innerHeight - 120) + 'px 0px 0px 0px'; };
    var crearVigia = function () {
      var vigia = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          var i = protegidosEnFranja.indexOf(en.target);
          if (en.isIntersecting && i < 0) protegidosEnFranja.push(en.target);
          if (!en.isIntersecting && i >= 0) protegidosEnFranja.splice(i, 1);
        });
        actualizarWhatsapp();
      }, { rootMargin: franja() });
      document.querySelectorAll('.formulario__enviar, .formulario__estado, .campo--casilla, .showroom__flechas, .taller__cita, .nosotros__botones, .stock__botones, .pie__abajo, .servicio__flecha')
        .forEach(function (el) { vigia.observe(el); });
      return vigia;
    };
    var vigiaActual = crearVigia();
    var altoAnterior = window.innerHeight;
    window.addEventListener('resize', function () {
      if (Math.abs(window.innerHeight - altoAnterior) < 80) return; // la barra del móvil al hacer scroll
      altoAnterior = window.innerHeight;
      vigiaActual.disconnect(); protegidosEnFranja = []; vigiaActual = crearVigia();
    });
  }

  /* ---------- Portada: vídeo de YouTube en bucle con la foto como respaldo ---------- */
  // Solo se ve el tramo [INICIO, FIN) del vídeo, en bucle, gobernado con la API de YouTube
  // (nunca vuelve al principio del vídeo).
  //
  // Por qué dos reproductores: en móvil YouTube pinta su icono de pausa unos 4 s cada vez que
  // el vídeo arranca o salta, aunque no haya controles. Así que cada vuelta se prepara oculta:
  // el reproductor que espera salta a INICIO − PREVIO sin verse, deja pasar ese icono y aparece
  // con fundido justo en INICIO, mientras el otro ha fundido hacia la foto antes de FIN.
  // Si solo hay un reproductor disponible, él mismo hace el salto oculto (la foto se ve más rato).
  // Si nada funciona, se queda la foto.
  var capaYT = document.getElementById('portada-yt');
  var ahorroDatos = navigator.connection && navigator.connection.saveData;

  if (capaYT && !reducirMovimiento.matches && !ahorroDatos) {
    var VIDEO = capaYT.dataset.video;
    var INICIO = parseFloat(capaYT.dataset.inicio);  // 116 s = 1:56
    var FIN = parseFloat(capaYT.dataset.fin);        // 132,5 s: el rótulo del vídeo entra a las 2:13
    var FUNDIDO = 0.5;                               // s; igual que --fundido en el CSS
    var PREVIO = 4.5;                                // s que se reproduce oculto antes de INICIO
    // El icono de pausa solo aparece en pantallas táctiles (móviles y tabletas). En un ordenador
    // sin pantalla táctil no hay espera: salta directo a 1:56 y aparece en cuanto se reproduce.
    var TACTIL = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    var PREVIO_SALTO = TACTIL ? PREVIO : 0;          // espera oculta al arrancar o al saltar
    var TIEMPO_MAXIMO = 20000;                       // ms: si no se ha visto nada, nos quedamos con la foto
    var EST = { ESPERA: 0, PREVIO: 1, ACTIVO: 2 };

    var reproductores = [];
    var reloj = null;
    var enPantalla = true;
    var algunaVezVisto = false;

    var hayAPI = function (r) { return r && r.listo && !r.roto && r.yt && r.yt.getCurrentTime; };
    var otro = function (r) { return reproductores[1 - r.n]; };

    var mostrar = function (r) { r.capa.classList.add('visible'); };
    var ocultar = function (r) { if (r) r.capa.classList.remove('visible'); };

    var reanudarSiParado = function (r) {
      // playVideo() solo si de verdad está parado: si ya se reproduce no hace falta
      var e = r.yt.getPlayerState();
      if (e !== YT.PlayerState.PLAYING && e !== YT.PlayerState.BUFFERING) r.yt.playVideo();
    };

    var quitarSubtitulos = function (r) {
      try { r.yt.unloadModule('captions'); r.yt.unloadModule('cc'); } catch (e) {}
    };

    // Prepara una vuelta: salta (oculto) a INICIO − previo y reproduce.
    // Sin indicar previo: PREVIO_SALTO (0 en ordenador, 4,5 s en táctil).
    var prepararVuelta = function (r, previo) {
      r.previo = previo === undefined ? PREVIO_SALTO : previo;
      ocultar(r);
      r.estado = EST.PREVIO;
      r.relevoPedido = false;
      r.haceElRelevo = false;
      r.momentoSalto = Date.now();
      r.yt.seekTo(INICIO - r.previo, true);
      reanudarSiParado(r);
    };

    var dejarEnEspera = function (r) {
      ocultar(r);
      r.estado = EST.ESPERA;
      try { r.yt.pauseVideo(); } catch (e) {}
    };

    var abandonar = function () {
      clearInterval(reloj);
      reproductores.forEach(ocultar);
      setTimeout(function () {
        reproductores.forEach(function (r) { try { r.yt.destroy(); } catch (e) {} });
        if (capaYT.parentNode) capaYT.remove();
      }, FUNDIDO * 1000 + 100);
    };

    var vigilarUno = function (r) {
      if (!hayAPI(r) || r.estado === EST.ESPERA) return;
      var estadoYT = r.yt.getPlayerState();
      if (estadoYT !== YT.PlayerState.PLAYING) {
        // Si debería estar preparando su vuelta y sigue parado (autoplay remolón), se insiste
        if (r.estado === EST.PREVIO && estadoYT !== YT.PlayerState.BUFFERING && Date.now() - r.momentoSalto > 2000) {
          r.momentoSalto = Date.now();
          r.yt.playVideo();
        }
        return;
      }
      var t = r.yt.getCurrentTime();

      if (r.estado === EST.PREVIO) {
        if (t >= INICIO && t < FIN - FUNDIDO) {
          // Llega a 1:56: fundido de entrada
          r.estado = EST.ACTIVO;
          algunaVezVisto = true;
          mostrar(r);
        } else if ((t < INICIO - r.previo - 1 || t >= FIN) && Date.now() - r.momentoSalto > 1500) {
          prepararVuelta(r); // el salto no surtió efecto: se repite
        }
        return;
      }

      // ACTIVO
      if (t < INICIO - 0.25) { prepararVuelta(r); return; } // posición inesperada: nunca se ve fuera del tramo

      // Con PREVIO segundos de margen, el otro reproductor empieza a preparar la siguiente vuelta
      if (!r.relevoPedido && t >= FIN - PREVIO) {
        r.relevoPedido = true;
        var o = otro(r);
        // El relevo se prepara siempre con margen (oculto), así entra justo cuando este termina
        if (hayAPI(o) && o.estado === EST.ESPERA) prepararVuelta(o, PREVIO);
        else r.haceElRelevo = true; // no hay relevo: lo hará él mismo al terminar
      }

      if (t >= FIN - FUNDIDO) ocultar(r); // fundido de salida hacia la foto antes de 2:12,5

      if (t >= FIN) {
        if (r.haceElRelevo) prepararVuelta(r);
        else dejarEnEspera(r);
      }
    };

    var vigilar = function () { reproductores.forEach(vigilarUno); };

    var crearReproductor = function (n, arrancar) {
      var capa = document.createElement('div');
      capa.className = 'portada__yt-capa';
      var hueco = document.createElement('div');
      capa.appendChild(hueco);
      capaYT.appendChild(capa);

      var r = { n: n, capa: capa, estado: EST.ESPERA, listo: false, roto: false };
      reproductores[n] = r;

      r.yt = new YT.Player(hueco, {
        host: 'https://www.youtube-nocookie.com',
        videoId: VIDEO,
        width: 1920,
        height: 1080,
        playerVars: {
          autoplay: arrancar ? 1 : 0, mute: 1, controls: 0, disablekb: 1, fs: 0, rel: 0,
          playsinline: 1, iv_load_policy: 3, cc_load_policy: 0,
          start: Math.floor(INICIO - PREVIO_SALTO),
          origin: location.protocol.indexOf('http') === 0 ? location.origin : undefined
        },
        events: {
          onReady: function () {
            r.listo = true;
            r.yt.mute();
            quitarSubtitulos(r);
            var iframe = r.yt.getIframe();
            iframe.setAttribute('tabindex', '-1');
            iframe.setAttribute('title', 'Vídeo de fondo: Volkswagen Tiguan en carretera');
            if (arrancar && enPantalla) prepararVuelta(r);
            if (!reloj) reloj = setInterval(vigilar, 100);
          },
          onStateChange: function (e) {
            if (e.data === YT.PlayerState.PLAYING) quitarSubtitulos(r);
            else if (e.data === YT.PlayerState.ENDED && r.estado !== EST.ESPERA) prepararVuelta(r); // nunca al principio
          },
          onError: function () {
            // vídeo borrado, privado o no insertable
            r.roto = true;
            ocultar(r);
            if (reproductores.every(function (x) { return !x || x.roto; })) abandonar();
          }
        }
      });
      return r;
    };

    var empezar = function () {
      crearReproductor(0, true);
      crearReproductor(1, false); // el relevo se carga a la vez, parado y oculto
    };

    // Si en un tiempo razonable no se ha visto nada (red lenta, autoplay bloqueado…), foto.
    // El plazo solo corre con la portada a la vista: quien baja antes de que el vídeo aparezca
    // no lo pierde; al volver arriba, el plazo empieza de nuevo.
    var vigilante = null;
    var armarVigilante = function () {
      clearTimeout(vigilante);
      if (algunaVezVisto) return;
      vigilante = setTimeout(function () { if (!algunaVezVisto && enPantalla) abandonar(); }, TIEMPO_MAXIMO);
    };
    armarVigilante();

    // Fuera de pantalla se pausa para no gastar batería ni datos; al volver, vuelta nueva desde 1:56
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entradas) {
        enPantalla = entradas[0].isIntersecting;
        if (enPantalla) armarVigilante(); else clearTimeout(vigilante);
        var listos = reproductores.filter(hayAPI);
        if (!listos.length) return;
        if (enPantalla) {
          // Al reanudar tras una pausa YouTube enseña su barra de título unos segundos, también
          // en ordenador: la vuelta se prepara oculta (con la foto a la vista) y entra en 1:56
          if (listos.every(function (r) { return r.estado === EST.ESPERA; })) prepararVuelta(listos[0], PREVIO);
        } else {
          listos.forEach(dejarEnEspera);
        }
      }, { threshold: 0 }).observe(document.getElementById('inicio'));
    }

    // Carga de la API de YouTube (sin romper otros posibles usos de onYouTubeIframeAPIReady)
    if (window.YT && window.YT.Player) {
      empezar();
    } else {
      var previo = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof previo === 'function') previo();
        empezar();
      };
      var api = document.createElement('script');
      api.src = 'https://www.youtube.com/iframe_api';
      api.async = true;
      api.onerror = abandonar;
      document.head.appendChild(api);
    }
  }
})();
