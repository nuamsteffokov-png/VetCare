// ==========================================
// ЗАПУСК
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    // PWA
    if ('serviceWorker' in navigator && (location.protocol === 'http:' || location.protocol === 'https:')) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }

    // Защита ЛК
    const isDashboard = !!document.querySelector('.dashboard-layout');
    if (isDashboard && localStorage.getItem('vetcare_logged_in') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    renderBreadcrumbs();
    updateNavigation();

    if (isDashboard) initDashboard();

    bindAllForms();

    // Заполнение врачей/услуг на страницах, где они есть
    renderDoctorsIfNeeded();
    renderServicesIfNeeded();
});

// ==========================================
// НАВИГАЦИЯ
// ==========================================
function updateNavigation() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const isLoggedIn = localStorage.getItem('vetcare_logged_in') === 'true';
    const userData = JSON.parse(localStorage.getItem('vetcare_user') || 'null');

    const links = (isLoggedIn && userData)
        ? [
            { href: 'index.html', text: 'Главная' },
            { href: 'about.html', text: 'О клинике' },
            { href: 'services.html', text: 'Услуги и Врачи' },
            { href: 'prices.html', text: 'Прайс' },
            { href: 'faq.html', text: 'FAQ' },
            { href: 'contacts.html', text: 'Контакты' },
            { href: 'reviews.html', text: 'Отзывы' },
            { href: 'dashboard.html', text: 'Кабинет' },
            { href: '#', text: 'Выйти', logout: true }
        ]
        : [
            { href: 'index.html', text: 'Главная' },
            { href: 'about.html', text: 'О клинике' },
            { href: 'services.html', text: 'Услуги и Врачи' },
            { href: 'prices.html', text: 'Прайс' },
            { href: 'faq.html', text: 'FAQ' },
            { href: 'contacts.html', text: 'Контакты' },
            { href: 'reviews.html', text: 'Отзывы' },
            { href: 'login.html', text: 'Войти', btn: 'btn-login' },
            { href: 'register.html', text: 'Регистрация', btn: 'btn-register' }
        ];

    nav.innerHTML = '';
    links.forEach(l => {
        const a = document.createElement('a');
        a.href = l.href;
        a.className = 'nav-link';
        if (l.btn) a.classList.add(l.btn);
        if (l.href === currentPage) a.classList.add('active');
        a.textContent = l.text;
        if (l.logout) a.onclick = e => { e.preventDefault(); logout(); };
        nav.appendChild(a);
    });
}

function toggleMenu() {
    document.querySelector('.nav')?.classList.toggle('active');
}

function logout() {
    localStorage.removeItem('vetcare_logged_in');
    window.location.href = 'index.html';
}

function handleAppointmentClick() {
    const isLoggedIn = localStorage.getItem('vetcare_logged_in') === 'true';
    window.location.href = isLoggedIn ? 'dashboard.html#appointment' : 'register.html';
}

// ==========================================
// РЕНДЕР ВРАЧЕЙ / УСЛУГ (из data.js)
// ==========================================
function renderDoctorsIfNeeded() {
    const grid = document.getElementById('doctorsGrid');
    if (!grid) return;
    grid.innerHTML = DOCTORS.map(d => `
        <div class="doctor-card-full">
            <div class="doctor-avatar-init" style="background:${d.color}">${escapeHtml(d.name.charAt(0))}</div>
            <h3>${escapeHtml(d.name)}</h3>
            <p class="doctor-spec-full">${escapeHtml(d.spec)}</p>
            <p class="doctor-exp-full">Стаж: ${d.exp} лет</p>
            <p class="doctor-desc">${escapeHtml(d.desc)}</p>
            <button class="btn btn-primary btn-small" onclick="handleAppointmentClick()">Записаться</button>
        </div>
    `).join('');
}

function renderServicesIfNeeded() {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;
    grid.innerHTML = SERVICES.map(s => `
        <div class="service-card-full">
            <h3>${escapeHtml(s.name)}</h3>
            <p>${escapeHtml(s.desc)}</p>
            <div class="service-price">от ${s.price.toLocaleString('ru-RU')} ₽</div>
        </div>
    `).join('');
}

// ==========================================
// ЛИЧНЫЙ КАБИНЕТ
// ==========================================
function initDashboard() {
    initDashboardTabs();
    loadUserData();
    populateDoctorSelects();
    displayPets();
    displayAppointments();
    updatePetSelect();
    initAppointmentSlots();
    checkVaccinationReminders();
    // Запрет прошедшей даты
    const d = document.getElementById('app-date');
    if (d) d.min = new Date().toISOString().split('T')[0];
    checkHash();
}

function initDashboardTabs() {
    document.querySelectorAll('.dash-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            switchDashboardTab(link.getAttribute('data-tab'));
        });
    });
}

function switchDashboardTab(name) {
    document.querySelectorAll('.dash-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
    const link = document.querySelector(`[data-tab="${name}"]`);
    const tab = document.getElementById('tab-' + name);
    if (link) link.classList.add('active');
    if (tab) tab.classList.add('active');
}

function checkHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById('tab-' + hash)) switchDashboardTab(hash);
}

window.addEventListener('hashchange', () => {
    if (document.querySelector('.dashboard-layout')) checkHash();
});

function populateDoctorSelects() {
    const appDoctor = document.getElementById('app-doctor');
    if (appDoctor) appDoctor.innerHTML = '<option value="">Выберите врача</option>' +
        DOCTORS.map(d => `<option value="${d.id}">${escapeHtml(d.name)} — ${escapeHtml(d.spec)}</option>`).join('');
    const fbDoctor = document.getElementById('fb-doctor');
    if (fbDoctor) fbDoctor.innerHTML = '<option value="">Выберите врача</option>' +
        DOCTORS.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
}

function loadUserData() {
    const u = JSON.parse(localStorage.getItem('vetcare_user') || 'null');
    if (!u) return;
    const name = document.getElementById('user-name');
    const email = document.getElementById('user-email');
    const av = document.querySelector('.user-avatar');
    if (name) name.textContent = u.fio;
    if (email) email.textContent = u.email;
    if (av) { av.textContent = (u.fio || '?').charAt(0).toUpperCase(); av.style.background = '#2c5f2d'; }
    const setFio = document.getElementById('set-fio');
    const setEmail = document.getElementById('set-email');
    const setPhone = document.getElementById('set-phone');
    if (setFio) setFio.value = u.fio || '';
    if (setEmail) setEmail.value = u.email || '';
    if (setPhone) setPhone.value = u.phone || '';
}

function showPetForm() { document.getElementById('petForm').style.display = 'block'; }
function hidePetForm() { document.getElementById('petForm').style.display = 'none'; }

// --- ПИТОМЦЫ С МЕДКАРТОЙ ---
function displayPets() {
    const list = document.getElementById('petsList');
    if (!list) return;
    const pets = JSON.parse(localStorage.getItem('vetcare_pets') || '[]');
    if (!pets.length) {
        list.innerHTML = '<p style="color:#666;padding:20px;">У вас пока нет питомцев.</p>';
        return;
    }
    list.innerHTML = pets.map(pet => {
        const vaccs = pet.vaccinations || [];
        const history = pet.history || [];
        return `
        <div class="pet-card">
            <div class="pet-card-header">
                <span class="pet-icon">${getAnimalIcon(pet.species)}</span>
                <h4>${escapeHtml(pet.name)}</h4>
            </div>
            <div class="pet-card-body">
                <p><strong>Вид:</strong> ${escapeHtml(pet.species)}</p>
                <p><strong>Порода:</strong> ${escapeHtml(pet.breed)}</p>
                <p><strong>Возраст:</strong> ${escapeHtml(pet.age)} лет</p>
                <p><strong>Вес:</strong> ${escapeHtml(pet.weight)} кг</p>
            </div>
            <div class="med-card">
                <div class="med-section">
                    <div class="med-header">
                        <strong>💉 Прививки</strong>
                        <button class="btn-link" onclick="openAddVaccination(${pet.id})">+ Добавить</button>
                    </div>
                    ${vaccs.length ? vaccs.map(v => `
                        <div class="med-row">
                            <span>${escapeHtml(v.name)}</span>
                            <small>${escapeHtml(v.date)} → ${escapeHtml(v.nextDate)}</small>
                        </div>`).join('') : '<p class="med-empty">Нет записей</p>'}
                </div>
                <div class="med-section">
                    <div class="med-header">
                        <strong>📋 История визитов</strong>
                    </div>
                    ${history.length ? history.map(h => `
                        <div class="med-row">
                            <span>${escapeHtml(h.date)} — ${escapeHtml(h.diagnosis)}</span>
                            <small>${escapeHtml(h.doctor)}</small>
                        </div>`).join('') : '<p class="med-empty">Нет записей</p>'}
                </div>
            </div>
        </div>`;
    }).join('');
}

function openAddVaccination(petId) {
    const name = prompt('Название прививки (например, Бешенство):');
    if (!name) return;
    const date = prompt('Дата прививки (ГГГГ-ММ-ДД):', new Date().toISOString().split('T')[0]);
    if (!date) return;
    const nextDate = prompt('Дата следующей (ГГГГ-ММ-ДД):', '');
    const pets = JSON.parse(localStorage.getItem('vetcare_pets') || '[]');
    const pet = pets.find(p => p.id === petId);
    if (!pet) return;
    pet.vaccinations = pet.vaccinations || [];
    pet.vaccinations.push({ name, date, nextDate: nextDate || '—' });
    localStorage.setItem('vetcare_pets', JSON.stringify(pets));
    displayPets();
    showNotification('Прививка добавлена');
}

// --- НАПОМИНАНИЯ ---
function checkVaccinationReminders() {
    const banner = document.getElementById('vaccinationReminder');
    if (!banner) return;
    const pets = JSON.parse(localStorage.getItem('vetcare_pets') || '[]');
    const today = new Date();
    const reminders = [];
    pets.forEach(pet => {
        (pet.vaccinations || []).forEach(v => {
            if (!v.nextDate || v.nextDate === '—') return;
            const d = new Date(v.nextDate);
            if (isNaN(d.getTime())) return;
            const days = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
            if (days >= 0 && days <= 30) {
                reminders.push(`У питомца <strong>${escapeHtml(pet.name)}</strong> через ${days} дн. — ${escapeHtml(v.name)}`);
            }
        });
    });
    if (reminders.length) {
        banner.innerHTML = `<div class="reminder-block">🔔 ${reminders.join('<br>')}</div>`;
        banner.style.display = 'block';
    } else {
        banner.style.display = 'none';
    }
}

// --- СЛОТЫ ЗАПИСИ ---
function initAppointmentSlots() {
    const doctor = document.getElementById('app-doctor');
    const date = document.getElementById('app-date');
    const slotsBox = document.getElementById('app-slots');
    if (!doctor || !date || !slotsBox) return;

    function render() {
        slotsBox.innerHTML = '';
        const d = doctor.value, dt = date.value;
        if (!d || !dt) { slotsBox.innerHTML = '<p class="med-empty">Выберите врача и дату, чтобы увидеть слоты</p>'; return; }
        const slots = getAvailableSlots(d, dt);
        if (!slots.length) { slotsBox.innerHTML = '<p class="med-empty">На эту дату свободных слотов нет</p>'; return; }
        slots.forEach(s => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'slot-btn';
            b.textContent = s;
            b.onclick = () => {
                slotsBox.querySelectorAll('.slot-btn').forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                document.getElementById('app-time').value = s;
            };
            slotsBox.appendChild(b);
        });
    }
    doctor.addEventListener('change', render);
    date.addEventListener('change', render);
    render();
}

function getAvailableSlots(doctorId, dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    if (isNaN(date.getTime())) return [];
    const day = date.getDay();
    const hours = day === 0 ? SCHEDULE.sunday : (day === 6 ? SCHEDULE.saturday : SCHEDULE.weekdays);
    const appts = JSON.parse(localStorage.getItem('vetcare_appointments') || '[]');
    const busy = appts.filter(a => a.doctor_id === String(doctorId) && a.date === dateStr).map(a => a.time);
    const now = new Date();
    const isToday = dateStr === now.toISOString().split('T')[0];
    const cur = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    return hours.filter(h => !busy.includes(h) && (!isToday || h > cur));
}

// --- ПИТОМЦЫ В SELECT ---
function updatePetSelect() {
    const s = document.getElementById('app-pet');
    if (!s) return;
    const pets = JSON.parse(localStorage.getItem('vetcare_pets') || '[]');
    s.innerHTML = '<option value="">Выберите питомца</option>' +
        pets.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(p.species)})</option>`).join('');
}

function displayAppointments() {
    const box = document.getElementById('appointmentsList');
    if (!box) return;
    const appts = JSON.parse(localStorage.getItem('vetcare_appointments') || '[]');
    if (!appts.length) {
        box.innerHTML = '<h3>Мои записи</h3><p style="color:#666;">У вас пока нет записей.</p>';
        return;
    }
    box.innerHTML = '<h3>Мои записи</h3>' + appts.map(a => `
        <div class="appointment-card">
            <h4>${escapeHtml(a.service)}</h4>
            <p><strong>Дата:</strong> ${escapeHtml(a.date)} в ${escapeHtml(a.time)}</p>
            <p><strong>Врач:</strong> ${escapeHtml(a.doctor_name)}</p>
            ${a.comment ? `<p><strong>Комментарий:</strong> ${escapeHtml(a.comment)}</p>` : ''}
            <span class="status status-new">${escapeHtml(a.status)}</span>
        </div>
    `).join('');
}

function getAnimalIcon(species) {
    const icons = {
        'Собака': '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2c5f2d" stroke-width="2"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5"/><path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75z"/></svg>',
        'Кошка': '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2c5f2d" stroke-width="2"><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75z"/></svg>',
        'Птица': '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2c5f2d" stroke-width="2"><path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/><path d="m20 7 2 .5-2 .5"/><path d="M10 18v3"/><path d="M14 17.75V21"/><path d="M7 18a6 6 0 0 0 3.84-10.61"/></svg>',
        'Грызун': '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2c5f2d" stroke-width="2"><path d="M12 2a5 5 0 0 1 5 5v2a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z"/><path d="M9 14h6"/><path d="M7 18h10"/><path d="M8 22h8"/></svg>',
        'Другое': '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2c5f2d" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>'
    };
    return icons[species] || icons['Другое'];
}

// ==========================================
// ФОРМЫ
// ==========================================
function bindAllForms() {
    // Регистрация
    const rf = document.getElementById('registerForm');
    if (rf) rf.addEventListener('submit', e => {
        e.preventDefault();
        const pass = document.getElementById('reg-password');
        const conf = document.getElementById('reg-password-confirm');
        let ok = true;
        if (pass.value.length < 6) { setFieldError(pass, 'Минимум 6 символов'); ok = false; } else clearFieldError(pass);
        if (pass.value !== conf.value) { setFieldError(conf, 'Пароли не совпадают'); ok = false; } else clearFieldError(conf);
        if (!ok) return;
        const data = {
            fio: document.getElementById('reg-fio').value.trim(),
            email: document.getElementById('reg-email').value.trim(),
            phone: document.getElementById('reg-phone').value,
            password: pass.value
        };
        if (!isValidEmail(data.email)) { setFieldError(document.getElementById('reg-email'), 'Некорректный email'); return; }
        localStorage.setItem('vetcare_user', JSON.stringify(data));
        showNotification('Регистрация успешна!');
        setTimeout(() => window.location.href = 'login.html', 800);
    });

    // Вход
    const lf = document.getElementById('loginForm');
    if (lf) lf.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const pass = document.getElementById('login-password').value;
        const u = JSON.parse(localStorage.getItem('vetcare_user') || 'null');
        if (u && u.email === email && u.password === pass) {
            localStorage.setItem('vetcare_logged_in', 'true');
            window.location.href = 'dashboard.html';
        } else {
            setFieldError(document.getElementById('login-password'), 'Неверный email или пароль');
        }
    });

    // Обратная связь
    ['feedbackForm', 'contactForm'].forEach(id => {
        const f = document.getElementById(id);
        if (!f) return;
        f.addEventListener('submit', e => {
            e.preventDefault();
            if (!canSubmit(id)) { showNotification('Подождите минуту перед повторной отправкой', 'error'); return; }
            const email = f.querySelector('input[type="email"]');
            if (email && !isValidEmail(email.value)) { setFieldError(email, 'Некорректный email'); return; }
            markSubmit(id);
            showNotification('Спасибо! Сообщение отправлено.');
            f.reset();
        });
    });

    // Отзыв в ЛК
    const df = document.getElementById('dashboardFeedbackForm');
    if (df) df.addEventListener('submit', e => {
        e.preventDefault();
        const u = JSON.parse(localStorage.getItem('vetcare_user') || '{}');
        const sel = document.getElementById('fb-doctor');
        const docName = sel.options[sel.selectedIndex].text;
        const r = document.querySelector('input[name="rating"]:checked');
        if (!r) { showNotification('Выберите оценку', 'error'); return; }
        const review = {
            id: Date.now(),
            user_name: u.fio || 'Аноним',
            user_email: u.email || '',
            doctor_id: sel.value,
            doctor_name: docName,
            rating: r.value,
            comment: document.getElementById('fb-comment').value,
            date: new Date().toLocaleDateString('ru-RU')
        };
        const arr = JSON.parse(localStorage.getItem('vetcare_reviews') || '[]');
        arr.unshift(review);
        localStorage.setItem('vetcare_reviews', JSON.stringify(arr));
        showNotification('Отзыв опубликован!');
        df.reset();
    });

    // Добавление питомца
    const ap = document.getElementById('addPetForm');
    if (ap) ap.addEventListener('submit', e => {
        e.preventDefault();
        const pet = {
            id: Date.now(),
            name: document.getElementById('pet-name').value.trim(),
            species: document.getElementById('pet-species').value,
            breed: document.getElementById('pet-breed').value.trim(),
            age: document.getElementById('pet-age').value,
            weight: document.getElementById('pet-weight').value,
            vaccinations: [],
            history: []
        };
        const pets = JSON.parse(localStorage.getItem('vetcare_pets') || '[]');
        pets.push(pet);
        localStorage.setItem('vetcare_pets', JSON.stringify(pets));
        displayPets(); updatePetSelect(); ap.reset(); hidePetForm();
        showNotification('Питомец добавлен!');
    });

    // Запись на приём
    const af = document.getElementById('appointmentForm');
    if (af) af.addEventListener('submit', e => {
        e.preventDefault();
        const time = document.getElementById('app-time').value;
        if (!time) { showNotification('Выберите время из слотов', 'error'); return; }
        const sel = document.getElementById('app-doctor');
        const appt = {
            id: Date.now(),
            pet_id: document.getElementById('app-pet').value,
            doctor_id: sel.value,
            doctor_name: sel.options[sel.selectedIndex].text,
            service: document.getElementById('app-service').value,
            date: document.getElementById('app-date').value,
            time,
            comment: document.getElementById('app-comment').value,
            status: 'Новая'
        };
        const arr = JSON.parse(localStorage.getItem('vetcare_appointments') || '[]');
        arr.push(appt);
        localStorage.setItem('vetcare_appointments', JSON.stringify(arr));
        displayAppointments(); af.reset();
        document.getElementById('app-slots').innerHTML = '';
        showNotification('Запись создана!');
    });

    // Настройки
    const sf = document.getElementById('settingsForm');
    if (sf) sf.addEventListener('submit', e => {
        e.preventDefault();
        const u = JSON.parse(localStorage.getItem('vetcare_user') || '{}');
        u.fio = document.getElementById('set-fio').value.trim();
        u.email = document.getElementById('set-email').value.trim();
        u.phone = document.getElementById('set-phone').value;
        const np = document.getElementById('set-password').value;
        if (np) u.password = np;
        localStorage.setItem('vetcare_user', JSON.stringify(u));
        loadUserData(); updateNavigation();
        showNotification('Настройки сохранены!');
        document.getElementById('set-password').value = '';
    });

    // Быстрая запись (модалка на главной)
    const qf = document.getElementById('quickAppointmentForm');
    if (qf) qf.addEventListener('submit', e => {
        e.preventDefault();
        const phone = document.getElementById('quick-phone');
        if (!isValidPhone(phone.value)) { setFieldError(phone, 'Введите корректный телефон'); return; }
        if (!canSubmit('quick')) { showNotification('Подождите минуту', 'error'); return; }
        markSubmit('quick');
        const req = {
            id: Date.now(),
            name: document.getElementById('quick-name').value,
            phone: phone.value,
            service: document.getElementById('quick-service').value,
            date: new Date().toLocaleString('ru-RU')
        };
        const arr = JSON.parse(localStorage.getItem('vetcare_quick_requests') || '[]');
        arr.unshift(req);
        localStorage.setItem('vetcare_quick_requests', JSON.stringify(arr));
        closeQuickAppointment();
        showNotification('Заявка принята! Перезвоним в течение 15 минут.');
        qf.reset();
    });

    // Маска телефона
    document.querySelectorAll('input[type="tel"]').forEach(applyPhoneMask);
}

// Модалка быстрой записи
function openQuickAppointment(e) {
    if (e) e.preventDefault();
    const m = document.getElementById('quickAppointmentModal');
    if (m) m.classList.add('show');
    document.body.style.overflow = 'hidden';
    const sel = document.getElementById('quick-service');
    if (sel && !sel.options.length) {
        sel.innerHTML = '<option value="">Выберите услугу</option>' +
            SERVICES.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join('');
    }
}
function closeQuickAppointment() {
    const m = document.getElementById('quickAppointmentModal');
    if (m) m.classList.remove('show');
    document.body.style.overflow = '';
}

// ==========================================
// КНОПКА "НАВЕРХ"
// ==========================================
const scrollToTopBtn = document.getElementById('scrollToTopBtn');
if (scrollToTopBtn) {
    window.addEventListener('scroll', () => {
        scrollToTopBtn.style.display = (window.scrollY > 300) ? 'flex' : 'none';
    });
    scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}