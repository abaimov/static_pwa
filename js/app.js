window.addEventListener('load', async () => {
    if ('serviceWorker' in navigator) {
        try {
            const reg = await navigator.serviceWorker.register('/sw.js');
            console.log('Service worker register success', reg);
        } catch (e) {
            console.log('Service worker register fail');
        }
    }

    const deviceType = detectDevice();
    console.log(`User is visiting from: ${deviceType}`);

    // Проверка, установлено ли приложение
    checkAppInstallation(deviceType);

    // Показ баннера в зависимости от устройства
    if (deviceType === 'iOS') {
        showInstallBanner('iOS');
    } else if (deviceType === 'Desktop') {
        showInstallBanner('Desktop');
    }

    await loadPosts();
});

async function loadPosts() {
    const res = await fetch('https://express-pwa.onrender.com/api/link');
    const data = await res.json();
    console.log(data);
    const container = document.querySelector('#dynamic_link');
    container.innerHTML = toCard(data);
}

function toCard(data) {
    return `
    <div class="card">
      <div class="card-title">
        ${data.url}
      </div>
      <div class="card-body">
        ${data.text}
      </div>
    </div>
  `;
}

function detectDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (/android/i.test(userAgent)) {
        return 'Android';
    }
    if (/iPhone|iPad|iPod/i.test(userAgent)) {
        return 'iOS';
    }
    if (/Windows|Macintosh|Linux/.test(userAgent)) {
        return 'Desktop';
    }

    return 'Unknown Device';
}

// Функция для проверки, установлено ли приложение
let deferredPrompt; // Для хранения события beforeinstallprompt
function checkAppInstallation(device) {
    if (device === 'iOS') {
        if (window.navigator.standalone) {
            console.log('App is installed as PWA on iOS');
        } else {
            console.log('App is not installed on iOS');
        }
    } else if (device === 'Desktop') {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();  // Останавливаем стандартное поведение
            deferredPrompt = e;  // Сохраняем событие для использования позже
            console.log('App can be installed as PWA on Desktop');
            showInstallBanner('Desktop');
        });

        // Проверка установки через `window.matchMedia` для поддержки десктопных PWA
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('App is installed as PWA on Desktop');
        } else {
            console.log('App is not installed on Desktop');
        }
    }
}

// Функция для показа баннера в зависимости от устройства
function showInstallBanner(device) {
    const banner = document.createElement('div');
    banner.id = 'install-banner';
    banner.style.position = 'fixed';
    banner.style.bottom = '10px';
    banner.style.left = '10px';
    banner.style.right = '10px';
    banner.style.backgroundColor = '#fff';
    banner.style.color = '#333';
    banner.style.border = '1px solid #ccc';
    banner.style.borderRadius = '10px';
    banner.style.padding = '15px';
    banner.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    banner.style.textAlign = 'center';
    banner.style.zIndex = '1000';

    // Контент баннера для iOS
    if (device === 'iOS') {
        banner.innerHTML = `
            <p>Чтобы установить это приложение на iPhone:</p>
            <div>
                <div>Нажмите значок <strong>Поделиться</strong> внизу экрана.</div>
                <div>Выберите <strong>Добавить на главный экран</strong>.</div>
            </div>
        `;
    }

    // Контент баннера для Desktop
    if (device === 'Desktop') {
        banner.innerHTML = `
            <p>Чтобы установить это приложение на ваш компьютер:</p>
            <div>
                <div>Нажмите на значок <strong>Добавить на рабочий стол</strong> в браузере.</div>
                <div>Следуйте инструкциям, чтобы закрепить приложение.</div>
            </div>
            <button id="install-app" style="padding: 10px 15px; background-color: #007BFF; color: white; border: none; border-radius: 5px; cursor: pointer;">Установить</button>
        `;
    }

    // Кнопка закрытия
    banner.innerHTML += `
        <button id="close-banner" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 18px; cursor: pointer;">&times;</button>
    `;

    // Добавить баннер в body
    document.body.appendChild(banner);

    // Закрытие баннера
    const closeButton = document.getElementById('close-banner');
    closeButton.addEventListener('click', () => {
        banner.style.display = 'none';
    });

    // Кнопка установки для Desktop и Android
    const installButton = document.getElementById('install-app');
    if (installButton && deferredPrompt) {
        installButton.addEventListener('click', () => {
            // Показываем диалоговое окно установки
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the A2HS prompt');
                } else {
                    console.log('User dismissed the A2HS prompt');
                }
                deferredPrompt = null; // Сбрасываем
            });
        });
    }
}
