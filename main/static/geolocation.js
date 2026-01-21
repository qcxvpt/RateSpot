// geolocation.js

let userMarker = null;
let locationErrorShown = false;

function updateUserLocation(position) {
  const { latitude, longitude } = position.coords;

  if (userMarker) {
    userMarker.setLatLng([latitude, longitude]);
  } else {
    userMarker = L.marker([latitude, longitude], {
      icon: L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
        iconSize: [25, 25],
        iconAnchor: [12, 12]
      })
    })
      .addTo(map)
      .bindPopup('Вы здесь')
      .openPopup();

    // Центрируем карту один раз при первом определении
    map.setView([latitude, longitude], 13);
  }
}

function handleLocationError(error) {
  console.error('Ошибка геолокации:', error.message);
  if (!locationErrorShown) {
    alert('Не удалось определить ваше местоположение');
    locationErrorShown = true;
  }
}

if (navigator.geolocation) {
  navigator.geolocation.watchPosition(updateUserLocation, handleLocationError, {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 10000
  });
} else {
  alert('Геолокация не поддерживается этим браузером');
}
