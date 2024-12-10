const USER_API_URL = 'http://localhost:3001/login'; // URL para login
const JUEGOS_API_URL = 'http://localhost:3001/juegos'; // URL para juegos

document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname;

  if (currentPage.endsWith('index.html')) {
    manejarLoginYRegistro();
  }

  if (currentPage.endsWith('table.html')) {
    manejarJuegos();
  }
});

// Manejo de Login y Registro
function manejarLoginYRegistro() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const showRegisterForm = document.getElementById('show-register-form');
  const backToLogin = document.getElementById('back-to-login');

  // Alternar entre formularios
  showRegisterForm.addEventListener('click', () => {
    document.querySelector('.login-section').style.display = 'none';
    document.querySelector('#register-section').style.display = 'block';
  });

  backToLogin.addEventListener('click', () => {
    document.querySelector('.login-section').style.display = 'block';
    document.querySelector('#register-section').style.display = 'none';
  });

  // Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('correo-login').value.trim();
    const password = document.getElementById('pswd-login').value.trim();

    try {
      const response = await fetch(USER_API_URL);
      if (!response.ok) throw new Error('Error al obtener usuarios.');

      const usuarios = await response.json();
      const usuario = usuarios.find((u) => u.username === username && u.password === password);

      if (usuario) {
        localStorage.setItem('authToken', JSON.stringify({ username, id: usuario.id }));
        localStorage.setItem('usuarioNombre', usuario.username);
        window.location.href = 'table.html';
      } else {
        mostrarError('login-error', 'Usuario o contraseña incorrectos.');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      mostrarError('login-error', 'Ocurrió un error al iniciar sesión.');
    }
  });

  // Registro
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nuevoUsuario = {
      id: Date.now().toString(),
      username: document.getElementById('correo-register').value.trim(),
      password: document.getElementById('pswd-register').value.trim(),
    };

    try {
      const response = await fetch(USER_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoUsuario),
      });

      if (!response.ok) throw new Error('Error al registrar usuario.');

      mostrarMensaje('register-success', 'Usuario registrado exitosamente.');
      registerForm.reset();
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      mostrarError('register-error', 'No se pudo registrar el usuario.');
    }
  });
}

// Manejo de Juegos
function manejarJuegos() {
  const nombreUsuario = document.getElementById('nombre-usuario');
  const tarjetasContainer = document.getElementById('tarjetas-container');
  const logoutBtn = document.getElementById('logout-btn');
  const addGameForm = document.getElementById('add-game-form');
  const gameSuccessDiv = document.getElementById('game-success');
  const gameErrorDiv = document.getElementById('game-error');
  const searchInput = document.getElementById('search-input'); // Campo de búsqueda

  let juegos = []; // Almacenaremos los juegos aquí para hacer la búsqueda

  const usuarioNombre = localStorage.getItem('usuarioNombre');
  if (!usuarioNombre) {
    alert('Debes iniciar sesión.');
    window.location.href = 'index.html';
    return;
  }

  nombreUsuario.textContent = `Usuario: ${usuarioNombre}`;
  obtenerJuegos();

  // Función para obtener juegos
  async function obtenerJuegos() {
    try {
      const response = await fetch(JUEGOS_API_URL);
      if (!response.ok) throw new Error('Error al obtener juegos.');

      juegos = await response.json(); // Guardamos los juegos para hacer la búsqueda
      mostrarJuegos(juegos); // Mostramos todos los juegos inicialmente
    } catch (error) {
      console.error('Error al obtener juegos:', error);
    }
  }

  // Función para mostrar juegos
  function mostrarJuegos(juegos) {
    tarjetasContainer.innerHTML = '';

    juegos.forEach((juego) => {
      const tarjeta = document.createElement('div');
      tarjeta.classList.add('tarjeta');
      tarjeta.innerHTML = `
        <img src="${juego.imagen}" alt="${juego.nombre}">
        <h2>${juego.nombre}</h2>
        <p><strong>Plataforma:</strong> ${juego.plataforma}</p>
        <p><strong>Jugadores:</strong> ${juego.jugadores}</p>
        <button class="detalle-btn" data-id="${juego.id}">Ver Detalle</button>
        <button class="delete-btn" data-id="${juego.id}">Eliminar</button>
      `;

      const detalleBtn = tarjeta.querySelector('.detalle-btn');
      const deleteBtn = tarjeta.querySelector('.delete-btn');

      detalleBtn.addEventListener('click', () => mostrarDetalle(juego));
      deleteBtn.addEventListener('click', () => eliminarJuego(juego.id));

      tarjetasContainer.appendChild(tarjeta);
    });
  }

  // Filtrar y mostrar juegos en base a búsqueda
  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const juegosFiltrados = juegos.filter(juego =>
      juego.nombre.toLowerCase().includes(searchTerm)
    );
    mostrarJuegos(juegosFiltrados);
  });

  // Función para mostrar detalles del juego en un modal
  function mostrarDetalle(juego) {
    const modal = document.getElementById('detalle-modal');
    const closeModal = document.getElementById('close-modal');

    document.getElementById('detalle-nombre').textContent = juego.nombre;
    document.getElementById('detalle-imagen').src = juego.imagen;
    document.getElementById('detalle-plataforma').textContent = juego.plataforma;
    document.getElementById('detalle-jugadores').textContent = juego.jugadores;

    modal.style.display = 'flex';

    closeModal.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  // Función para eliminar un juego
  async function eliminarJuego(juegoId) {
    try {
      const response = await fetch(`${JUEGOS_API_URL}/${juegoId}`, { method: 'DELETE' });

      if (!response.ok) throw new Error('Error al eliminar el juego.');

      gameSuccessDiv.textContent = 'Juego eliminado exitosamente.';
      gameSuccessDiv.style.display = 'block';
      gameErrorDiv.style.display = 'none';

      obtenerJuegos();
    } catch (error) {
      console.error('Error al eliminar el juego:', error);
      gameErrorDiv.textContent = 'Error al eliminar el juego.';
      gameErrorDiv.style.display = 'block';
      gameSuccessDiv.style.display = 'none';
    }
  }

  // Añadir un juego
  addGameForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombreJuego = document.getElementById('nombre-juego').value.trim();
    const plataformaJuego = document.getElementById('plataforma-juego').value.trim();
    const jugadoresJuego = document.getElementById('jugadores-juego').value.trim();
    const imagenJuego = document.getElementById('imagen-juego').value.trim();

    const nuevoJuego = {
      nombre: nombreJuego,
      plataforma: plataformaJuego,
      jugadores: jugadoresJuego,
      imagen: imagenJuego,
    };

    try {
      const response = await fetch(JUEGOS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoJuego),
      });

      if (!response.ok) throw new Error('Error al agregar el juego.');

      gameSuccessDiv.textContent = 'Juego agregado exitosamente.';
      gameSuccessDiv.style.display = 'block';
      gameErrorDiv.style.display = 'none';

      obtenerJuegos(); // Actualizar la lista de juegos
      addGameForm.reset(); // Resetear el formulario
    } catch (error) {
      console.error('Error al agregar el juego:', error);
      gameErrorDiv.textContent = 'Error al agregar el juego.';
      gameErrorDiv.style.display = 'block';
      gameSuccessDiv.style.display = 'none';
    }
  });

  // Cerrar sesión
  logoutBtn.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
  });
}
