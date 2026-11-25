// ==========================================
// УТИЛИТЫ
// ==========================================

// Экранирование HTML (защита от XSS)
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Кастомные уведомления вместо alert()
function showNotification(message, type = 'success') {
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }
    const note = document.createElement('div');
    note.className = 'notification notification-' + type;
    note.textContent = message;
    container.appendChild(note);
    requestAnimationFrame(() => note.classList.add('show'));
    setTimeout(() => {
        note.classList.remove('show');
        setTimeout(() => note.remove(), 300);
    }, 3500);
}

// Валидация email
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Валидация телефона
function isValidPhone(phone) {
    const digits = (phone || '').replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
}

// Маска телефона +7 (___) ___-__-__
function applyPhoneMask(input) {
    input.addEventListener('input', function() {
        let v = this.value.replace(/\D/g, '');
        if (v.startsWith('8')) v = '7' + v.slice(1);
        if (v && !v.startsWith('7')) v = '7' + v;
        v = v.slice(0, 11);
        let f = '';
        if (v.length > 0) f = '+7';
        if (v.length > 1) f += ' (' + v.slice(1, 4);
        if (v.length >= 5) f += ') ' + v.slice(4, 7);
        if (v.length >= 8) f += '-' + v.slice(7, 9);
        if (v.length >= 10) f += '-' + v.slice(9, 11);
        this.value = f;
    });
}

// Rate limit — не чаще 1 раза в минуту
function canSubmit(key, ms = 60000) {
    const last = parseInt(localStorage.getItem('vetcare_rl_' + key) || '0', 10);
    return Date.now() - last > ms;
}
function markSubmit(key) {
    localStorage.setItem('vetcare_rl_' + key, Date.now().toString());
}

// Inline-ошибка под полем
function setFieldError(input, message) {
    clearFieldError(input);
    input.classList.add('input-error');
    const err = document.createElement('span');
    err.className = 'field-error';
    err.textContent = message;
    input.parentNode.appendChild(err);
}
function clearFieldError(input) {
    input.classList.remove('input-error');
    const err = input.parentNode.querySelector('.field-error');
    if (err) err.remove();
}

// Хлебные крошки
function renderBreadcrumbs() {
    const c = document.querySelector('.breadcrumbs');
    if (!c) return;
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const titles = {
        'about.html': 'О клинике',
        'services.html': 'Услуги и Врачи',
        'contacts.html': 'Контакты',
        'reviews.html': 'Отзывы',
        'prices.html': 'Прайс-лист',
        'faq.html': 'Вопросы и ответы',
        'dashboard.html': 'Личный кабинет',
        'login.html': 'Вход',
        'register.html': 'Регистрация'
    };
    if (page === 'index.html' || !titles[page]) { c.style.display = 'none'; return; }
    c.innerHTML = `<a href="index.html">Главная</a> <span>›</span> <span>${titles[page]}</span>`;
}

// SVG-аватар с инициалом и цветом
function renderAvatar(name, color) {
    const initial = (name || '?').charAt(0).toUpperCase();
    return `<div class="avatar-init" style="background:${color || '#2c5f2d'}">${escapeHtml(initial)}</div>`;
}