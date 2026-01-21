const map = L.map('map').setView([52.2309, 21.01453], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

const markers = [];
let exchangesData = [];

const itemsPerPage = 10;
let currentPage = 1;
let highlightedExchangeIndex = null;

function buildRatesHtml(rates, status, url) {
  const linkHtml = url
    ? `<a class="exchange-link" href="${url}" target="_blank" rel="noopener noreferrer">Перейти на сайт</a>`
    : '';

  if (Array.isArray(rates) && rates.length) {
    const rows = rates
      .map(rate => `
        <tr>
          <td>${rate.currency || ''}</td>
          <td>${rate.buy || ''}</td>
          <td>${rate.sell || ''}</td>
        </tr>
      `)
      .join('');

    return `
      <div class="rates-block">
        ${linkHtml}
        <div class="rates-title">Курсы</div>
        <table class="rates-table">
          <thead>
            <tr>
              <th>Валюта</th>
              <th>Покупка</th>
              <th>Продажа</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  if (status === 'needs_api' || status === 'needs_source') {
    return `${linkHtml}<p>Курсы доступны только через калькулятор/закрытый API.</p>`;
  }

  return `${linkHtml}<p>Информация о курсе временно недоступна.</p>`;
}

async function loadData() {
  try {
    const response = await fetch('/api/exchanges');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    exchangesData = Array.isArray(data)
      ? data.map((exchange, index) => ({ ...exchange, __index: index }))
      : [];

    renderAllMarkers();
    renderExchanges();
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
  }
}

function renderAllMarkers() {
  markers.forEach(marker => map.removeLayer(marker));
  markers.length = 0;

  exchangesData.forEach((exchange) => {
    const lat = Number(exchange.lat);
    const lng = Number(exchange.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    const marker = L.marker([lat, lng])
      .addTo(map)
      .bindPopup(exchange.name);

    marker.exchangeIndex = exchange.__index;

    marker.on('click', () => {
      const page = Math.floor(marker.exchangeIndex / itemsPerPage) + 1;

      // Всегда обновляем текущую страницу и подсветку
      if (page !== currentPage) {
        currentPage = page;
      }
      highlightedExchangeIndex = marker.exchangeIndex;
      renderExchanges();

      map.setView([lat, lng], 13);
      markers.forEach(m => m.closePopup());
      marker.openPopup();
    });

    markers.push(marker);
  });
}

function renderExchanges() {
  const buttonsSection = document.getElementById('buttonsSection');
  buttonsSection.innerHTML = '';

  const filterValue = document.getElementById('sortField').value.toLowerCase();
  const filteredData = exchangesData.filter(exchange =>
    (exchange.name || '').toLowerCase().includes(filterValue)
  );

  if (
    highlightedExchangeIndex !== null &&
    !filteredData.some(exchange => exchange.__index === highlightedExchangeIndex)
  ) {
    highlightedExchangeIndex = null;
  }

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  if (currentPage > totalPages) currentPage = totalPages;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageItems = filteredData.slice(startIndex, startIndex + itemsPerPage);

  pageItems.forEach((exchange) => {
    const button = document.createElement('button');
    button.className = 'exchangeButton';

    const globalIndex = exchange.__index;
    button.dataset.index = globalIndex;

    // Добавляем стрелочку рядом с названием (по умолчанию — вправо)
    button.innerHTML = `
      <div class="exchangeContent">
        <div class="exchangeIcon">📍</div>
        <div class="exchangeName">${exchange.name}</div>
        <span class="toggleArrow" style="margin-left:auto; cursor:pointer;">▶</span>
      </div>
    `;

    const arrow = button.querySelector('.toggleArrow');

    const exchangeDetails = document.createElement('div');
    exchangeDetails.className = 'exchange-details';
    exchangeDetails.innerHTML = buildRatesHtml(
      exchange.rates,
      exchange.rate_status,
      exchange.url
    );

    // Клик по кнопке — показываем стрелочку, скрываем у остальных и детали
    button.addEventListener('click', (e) => {
      if (e.target === arrow) return; // Игнорируем клик по стрелке здесь

      // Скрываем стрелки и детали у всех обменников
      document.querySelectorAll('.toggleArrow').forEach(a => a.textContent = '▶');
      document.querySelectorAll('.exchange-details').forEach(d => d.classList.remove('show'));

      arrow.textContent = '▼';
      exchangeDetails.classList.add('show');

      highlightedExchangeIndex = globalIndex;

      // Снимаем выделение со всех кнопок, выделяем текущую
      document.querySelectorAll('.exchangeButton.active').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      const marker = markers.find(m => m.exchangeIndex === globalIndex);
      if (marker) {
        map.setView([exchange.lat, exchange.lng], 13);
        markers.forEach(m => m.closePopup());
        marker.openPopup();
      }
    });

    // Клик по стрелочке — раскрываем/скрываем детали
    arrow.addEventListener('click', (e) => {
      e.stopPropagation(); // чтобы не срабатывал клик на кнопку

      const isShown = exchangeDetails.classList.contains('show');

      // Скрываем все детали и ставим стрелки вправо
      document.querySelectorAll('.exchange-details').forEach(d => d.classList.remove('show'));
      document.querySelectorAll('.toggleArrow').forEach(a => a.textContent = '▶');
      document.querySelectorAll('.exchangeButton.active').forEach(btn => btn.classList.remove('active'));

      if (!isShown) {
        exchangeDetails.classList.add('show');
        arrow.textContent = '▼';
        button.classList.add('active');
        highlightedExchangeIndex = globalIndex;
      } else {
        arrow.textContent = '▶';
        highlightedExchangeIndex = null;
      }
    });

    if (highlightedExchangeIndex === globalIndex) {
      button.classList.add('active');
      arrow.textContent = '▼';
      exchangeDetails.classList.add('show');
      setTimeout(() => {
        button.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }

    buttonsSection.appendChild(button);
    buttonsSection.appendChild(exchangeDetails);
  });

  renderPagination(filteredData.length);
}

function renderPagination(totalItems) {
  const buttonsSection = document.getElementById('buttonsSection');

  const oldPagination = document.getElementById('paginationControls');
  if (oldPagination) oldPagination.remove();

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return;

  const paginationDiv = document.createElement('div');
  paginationDiv.id = 'paginationControls';
  paginationDiv.style.marginTop = '10px';
  paginationDiv.style.display = 'flex';
  paginationDiv.style.justifyContent = 'center';
  paginationDiv.style.gap = '10px';

  const prevBtn = document.createElement('button');
  prevBtn.textContent = '← Предыдущая';
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      highlightedExchangeIndex = null;
      renderExchanges();
    }
  };
  paginationDiv.appendChild(prevBtn);

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Следующая →';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      highlightedExchangeIndex = null;
      renderExchanges();
    }
  };
  paginationDiv.appendChild(nextBtn);

  buttonsSection.appendChild(paginationDiv);
}

document.getElementById('sortField').addEventListener('input', () => {
  currentPage = 1;
  highlightedExchangeIndex = null;
  renderExchanges();
});

function highlightExchangeInList() {
  document.querySelectorAll('.exchangeButton.active').forEach(btn =>
    btn.classList.remove('active')
  );

  if (highlightedExchangeIndex === null) return;

  const button = document.querySelector(`.exchangeButton[data-index="${highlightedExchangeIndex}"]`);
  if (button) {
    button.classList.add('active');
    button.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

loadData();
