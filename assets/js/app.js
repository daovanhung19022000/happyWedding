import { playlist } from './music-list.js';
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

// Mode 1 = Miền Bắc (15/11), Mode 2 = Miền Nam (21/11). URL: ?mode=1 hoặc ?mode=2
export const eventModes = {
  bac: {
    title: "LỄ THÀNH HÔN (MIỀN BẮC)",
    badge: "Tiệc Mừng Miền Bắc",
    host: "Gia đình hai bên",
    dateText: "Chủ Nhật, ngày 15 tháng 11 năm 2026",
    lunarDate: "Tức ngày 07 tháng 10 năm Bính Ngọ",
    targetDate: "2026-11-15T10:30:00",
    welcomeTime: "10:30",
    partyTime: "11:00",
    venue: "Tư gia Nhà Trai",
    address: "Đường Lương Như Học, Tân Hưng, Thành Phố Hải Dương",
    mapLink: "https://maps.google.com/?q=Đường+Lương+Như+Học,+Tân+Hưng,+Hải+Dương",
    specialDateDay: 15,
    heroDateDisplay: "15 . 11 . 2026",
    saveTheDateShort: "15.11.2026",
    inviteWeekday: "Chủ Nhật",
    inviteDay: "15",
    inviteMonthLabel: "Tháng 11",
    inviteYear: "2026",
    inviteVenueTitle: "TƯ GIA NHÀ TRAI"
  },
  nam: {
    title: "TIỆC BÁO HỶ (MIỀN NAM)",
    badge: "Tiệc Mừng Miền Nam",
    host: "Gia Đình & Bạn Bè Miền Nam",
    dateText: "Thứ Bảy, ngày 21 tháng 11 năm 2026",
    lunarDate: "Tức ngày 13 tháng 10 năm Bính Ngọ",
    targetDate: "2026-11-21T15:00:00",
    welcomeTime: "15:00",
    partyTime: "17:00",
    venue: "Tư gia Nhà Gái",
    address: "Vĩnh Thạch, Biên Hoà, Tỉnh Đồng Nai",
    mapLink: "https://maps.google.com/?q=Vĩnh+Thạch,+Biên+Hoà,+Đồng+Nai",
    specialDateDay: 21,
    heroDateDisplay: "21 . 11 . 2026",
    saveTheDateShort: "21.11.2026",
    inviteWeekday: "Thứ Bảy",
    inviteDay: "21",
    inviteMonthLabel: "Tháng 11",
    inviteYear: "2026",
    inviteVenueTitle: "TƯ GIA NHÀ GÁI"
  }
};

function formatInviteHour(timeStr) {
  if (!timeStr) return "";
  return String(timeStr).replace(":", "h");
}

/** Chuẩn hóa ?mode= từ URL (1/2, bac/nam, trai/gai cũ → bac) */
export function resolveEventMode(modeParam) {
  if (!modeParam) return "bac";
  const key = String(modeParam).trim().toLowerCase();
  if (key === "1" || key === "bac" || key === "trai" || key === "gai") return "bac";
  if (key === "2" || key === "nam") return "nam";
  return eventModes[key] ? key : "bac";
}

// Khởi tạo trạng thái
let currentMode = "bac";
let currentTrackIndex = 0;
let isAudioPlaying = false;
let audioElement = new Audio();
let countdownInterval = null;

// Khởi tạo Sakura Petals Effect
function initSakuraPetals() {
  const container = document.getElementById('sakura-container');
  if (!container) return;

  const petalCount = 20;
  for (let i = 0; i < petalCount; i++) {
    createPetal(container);
  }
}

function createPetal(container) {
  const petal = document.createElement('div');
  petal.className = 'sakura-petal';
  const size = Math.random() * 12 + 10;
  petal.style.width = `${size}px`;
  petal.style.height = `${size * 1.3}px`;
  petal.style.left = `${Math.random() * 100}vw`;
  petal.style.animationDuration = `${Math.random() * 6 + 5}s, ${Math.random() * 3 + 2}s`;
  petal.style.animationDelay = `${Math.random() * 5}s, ${Math.random() * 2}s`;
  container.appendChild(petal);
}

// Khởi tạo Audio Player (Phát ngẫu nhiên / lần lượt)
function initAudioPlayer() {
  const audioBtn = document.getElementById('audio-toggle-btn');
  const audioDisk = document.getElementById('audio-disk');
  if (!audioBtn) return;

  // Chọn ngẫu nhiên 1 bài hát lúc mở trang
  currentTrackIndex = Math.floor(Math.random() * playlist.length);
  audioElement.src = playlist[currentTrackIndex].url;
  audioElement.preload = "auto";

  // Khi hết bài thì tự chuyển bài tiếp theo
  audioElement.addEventListener('ended', () => {
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    audioElement.src = playlist[currentTrackIndex].url;
    audioElement.play();
  });

  const togglePlay = () => {
    if (isAudioPlaying) {
      audioElement.pause();
      isAudioPlaying = false;
      audioDisk.classList.remove('spinning');
    } else {
      audioElement.play().then(() => {
        isAudioPlaying = true;
        audioDisk.classList.add('spinning');
      }).catch(err => console.log('Chờ người dùng tương tác để phát nhạc:', err));
    }
  };

  audioBtn.addEventListener('click', togglePlay);

  const tryAutoPlay = () => {
    if (!isAudioPlaying) togglePlay();
  };

  window.addEventListener('wedding:first-open', tryAutoPlay, { once: true });

  const firstInteract = () => {
    tryAutoPlay();
    document.removeEventListener('click', firstInteract);
  };
  document.addEventListener('click', firstInteract);
}

// Xử lý Query Parameters (Cá nhân hóa khách mời & Chế độ)
function handleQueryParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const guestName = urlParams.get('to') || urlParams.get('guest');
  const role = urlParams.get('role');
  const modeParam = urlParams.get('mode');

  currentMode = resolveEventMode(modeParam);

  // Cập nhật thanh chào khách mời
  const guestBanner = document.getElementById('guest-banner');
  const guestDisplay = document.getElementById('guest-name-display');
  const rsvpNameInput = document.getElementById('rsvp-name');
  const wishNameInput = document.getElementById('wish-name');

  const fullGreeting = guestName ? (role ? `${role} ${guestName}` : guestName) : null;
  const inviteGuestTitle = document.getElementById('invite-guest-title');

  if (fullGreeting) {
    if (guestDisplay) guestDisplay.textContent = fullGreeting;
    if (guestBanner) guestBanner.style.display = 'flex';
    if (rsvpNameInput) rsvpNameInput.value = fullGreeting;
    if (wishNameInput) wishNameInput.value = fullGreeting;
    if (inviteGuestTitle) inviteGuestTitle.textContent = fullGreeting.toUpperCase();
  } else {
    if (guestBanner) guestBanner.style.display = 'none';
    if (inviteGuestTitle) inviteGuestTitle.textContent = 'QUÝ KHÁCH';
  }

  updateModeUI(currentMode);
}

// Cập nhật thông tin giao diện theo mode (Miền Bắc / Miền Nam)
export function updateModeUI(modeKey) {
  currentMode = resolveEventMode(modeKey);
  const modeData = eventModes[currentMode];
  if (!modeData) return;

  // Cập nhật các trường thông tin sự kiện
  const titleEl = document.getElementById('event-mode-title');
  const badgeEl = document.getElementById('event-badge');
  const dateEl = document.getElementById('event-date-text');
  const lunarEl = document.getElementById('event-lunar-text');
  const welcomeEl = document.getElementById('event-welcome-time');
  const partyEl = document.getElementById('event-party-time');
  const venueEl = document.getElementById('event-venue-text');
  const addressEl = document.getElementById('event-address-text');
  const mapBtn = document.getElementById('event-map-btn');
  const heroDateBadge = document.getElementById('hero-date-badge');
  const heroDateOnPhoto = document.getElementById('hero-date-on-photo');
  const saveTheDateShort = document.getElementById('save-the-date-short');
  const inviteWeekday = document.getElementById('invite-weekday');
  const inviteSideTime = document.getElementById('invite-side-time');
  const inviteDayNum = document.getElementById('invite-day-num');
  const inviteMonthLabel = document.getElementById('invite-month-label');
  const inviteYear = document.getElementById('invite-year');
  const inviteLunarParen = document.getElementById('invite-lunar-paren');
  const inviteScheduleWelcome = document.getElementById('invite-schedule-welcome');
  const inviteScheduleParty = document.getElementById('invite-schedule-party');
  const inviteVenueTitle = document.getElementById('invite-venue-title');
  const inviteAddress = document.getElementById('invite-address');
  const inviteMapLink = document.getElementById('invite-map-link');

  if (titleEl) titleEl.textContent = modeData.title;
  if (badgeEl) badgeEl.textContent = modeData.badge;
  if (dateEl) dateEl.textContent = modeData.dateText;
  if (lunarEl) lunarEl.textContent = modeData.lunarDate;
  if (welcomeEl) welcomeEl.textContent = modeData.welcomeTime;
  if (partyEl) partyEl.textContent = modeData.partyTime;
  if (venueEl) venueEl.textContent = modeData.venue;
  if (addressEl) addressEl.textContent = modeData.address;
  if (mapBtn) mapBtn.href = modeData.mapLink;
  const dateOnHero = modeData.heroDateDisplay;
  if (heroDateBadge) heroDateBadge.textContent = dateOnHero;
  if (heroDateOnPhoto) heroDateOnPhoto.textContent = dateOnHero;
  if (saveTheDateShort) saveTheDateShort.textContent = modeData.saveTheDateShort;
  if (inviteWeekday) inviteWeekday.textContent = modeData.inviteWeekday;
  if (inviteSideTime) inviteSideTime.textContent = formatInviteHour(modeData.welcomeTime);
  if (inviteDayNum) inviteDayNum.textContent = modeData.inviteDay;
  if (inviteMonthLabel) inviteMonthLabel.textContent = modeData.inviteMonthLabel;
  if (inviteYear) inviteYear.textContent = `Năm ${modeData.inviteYear}`;
  if (inviteLunarParen) inviteLunarParen.textContent = `(${modeData.lunarDate})`;
  if (inviteScheduleWelcome) inviteScheduleWelcome.textContent = formatInviteHour(modeData.welcomeTime);
  if (inviteScheduleParty) inviteScheduleParty.textContent = formatInviteHour(modeData.partyTime);
  if (inviteVenueTitle) inviteVenueTitle.textContent = modeData.inviteVenueTitle;
  if (inviteAddress) inviteAddress.textContent = modeData.address;
  if (inviteMapLink) inviteMapLink.href = modeData.mapLink;

  renderWeddingCalendar(modeData.specialDateDay);

  // Cập nhật đồng hồ đếm ngược
  startCountdown(modeData.targetDate);
}

/** Lịch tháng 11/2026 — highlight ngày cưới theo mode */
function renderWeddingCalendar(specialDay) {
  const grid = document.getElementById('wedding-calendar-grid');
  if (!grid) return;

  const year = 2026;
  const monthIndex = 10; // November
  const firstDow = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  grid.replaceChildren();

  for (let i = 0; i < firstDow; i += 1) {
    const pad = document.createElement('span');
    pad.className = 'wedding-calendar-day is-empty';
    pad.setAttribute('aria-hidden', 'true');
    grid.appendChild(pad);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cell = document.createElement('span');
    cell.className = 'wedding-calendar-day';
    cell.setAttribute('role', 'gridcell');
    cell.textContent = String(day);
    if (day === specialDay) {
      cell.classList.add('is-wedding');
      cell.setAttribute('aria-current', 'date');
    }
    grid.appendChild(cell);
  }
}

// Đồng hồ đếm ngược
function startCountdown(targetDateStr) {
  if (countdownInterval) clearInterval(countdownInterval);

  const targetTime = new Date(targetDateStr).getTime();

  const update = () => {
    const now = new Date().getTime();
    const distance = targetTime - now;

    if (distance < 0) {
      document.getElementById('cd-days').textContent = "00";
      document.getElementById('cd-hours').textContent = "00";
      document.getElementById('cd-minutes').textContent = "00";
      document.getElementById('cd-seconds').textContent = "00";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById('cd-days').textContent = String(days).padStart(2, '0');
    document.getElementById('cd-hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('cd-minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('cd-seconds').textContent = String(seconds).padStart(2, '0');
  };

  update();
  countdownInterval = setInterval(update, 1000);
}

// Lightbox xem ảnh
function initLightbox() {
  const modal = document.getElementById('lightbox-modal');
  const img = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('lightbox-close');

  document.querySelectorAll('.gallery-item img').forEach(item => {
    item.addEventListener('click', () => {
      img.src = item.src;
      modal.classList.add('active');
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }
}

// Xử lý RSVP (Xác nhận tham dự)
function initRSVPForm() {
  const form = document.getElementById('rsvp-form');
  const statusMsg = document.getElementById('rsvp-status-msg');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('rsvp-name').value.trim();
    const attendance = form.elements['attendance'].value;
    const guestsEl = document.getElementById('rsvp-guests');
    const noteEl = document.getElementById('rsvp-note');
    const guests = guestsEl ? guestsEl.value : '1';
    const note = noteEl ? noteEl.value.trim() : '';

    if (!name) {
      alert("Vui lòng nhập tên của bạn!");
      return;
    }

    const rsvpData = {
      name,
      attendance,
      guests,
      note,
      mode: currentMode,
      timestamp: new Date().toISOString()
    };

    try {
      if (isFirebaseConfigured() && window.firebaseDb) {
        // Lưu Firestore nếu đã cấu hình Firebase
        await window.firebaseDb.collection("rsvps").add(rsvpData);
      } else {
        // Lưu LocalStorage dự phòng
        const localRSVP = JSON.parse(localStorage.getItem('wedding_rsvps') || '[]');
        localRSVP.push(rsvpData);
        localStorage.setItem('wedding_rsvps', JSON.stringify(localRSVP));
      }

      statusMsg.hidden = false;
      statusMsg.style.color = '#155724';
      statusMsg.style.backgroundColor = '#d4edda';
      statusMsg.textContent = 'Cảm ơn bạn! Thông tin phản hồi đã được ghi nhận.';
      form.reset();
      const attendingDefault = form.querySelector('input[name="attendance"][value="attending"]');
      if (attendingDefault) attendingDefault.checked = true;
    } catch (error) {
      console.error(error);
      alert("Đã xảy ra lỗi khi gửi. Vui lòng thử lại!");
    }
  });
}

// Lời chúc mừng (Guestbook)
const defaultWishes = [
  { name: "Hội Bạn Thân", text: "Chúc hai bạn trăm năm hạnh phúc, răng long đầu bạc, sớm sinh quý tử nhé!", time: "Hôm nay" },
  { name: "Gia đình Bác Ba", text: "Chúc cháu Hùng và cháu Trang mãi mãi yêu thương, hòa thuận và viên mãn!", time: "Hôm qua" },
  { name: "Đồng nghiệp", text: "Happy Wedding! Chúc cặp đôi đẹp nhất năm một hành trình hôn nhân ngập tràn nụ cười!", time: "2 ngày trước" }
];

function initWishesSection() {
  const form = document.getElementById('wish-form');
  const listContainer = document.getElementById('wishes-list');
  if (!listContainer) return;

  const renderWishes = (items) => {
    listContainer.innerHTML = '';
    items.forEach(w => {
      const el = document.createElement('div');
      el.className = 'wish-item';
      el.innerHTML = `
        <div class="wish-author">
          <span>${w.name}</span>
          <span class="wish-time">${w.time || 'Vừa xong'}</span>
        </div>
        <div class="wish-text">${w.text}</div>
      `;
      listContainer.appendChild(el);
    });
  };

  // Tải dữ liệu dự phòng ban đầu
  let localWishes = JSON.parse(localStorage.getItem('wedding_wishes') || '[]');
  const allInitialWishes = [...localWishes, ...defaultWishes];
  renderWishes(allInitialWishes);

  // Lắng nghe realtime từ Firestore nếu Firebase đã sẵn sàng
  if (isFirebaseConfigured() && window.firebaseDb) {
    try {
      window.firebaseDb.collection("wishes")
        .orderBy("timestamp", "desc")
        .limit(50)
        .onSnapshot((snapshot) => {
          const firestoreWishes = [];
          snapshot.forEach(doc => {
            firestoreWishes.push(doc.data());
          });
          if (firestoreWishes.length > 0) {
            renderWishes(firestoreWishes);
          }
        }, (err) => {
          console.warn("Chưa tạo index hoặc Firestore rules cần cập nhật:", err);
        });
    } catch (e) {
      console.warn("Lỗi listener Firestore:", e);
    }
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('wish-name').value.trim();
      const text = document.getElementById('wish-message').value.trim();

      if (!name || !text) {
        alert("Vui lòng nhập tên và lời chúc!");
        return;
      }

      const now = new Date();
      const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} - ${now.getDate()}/${now.getMonth() + 1}`;

      const newWish = {
        name,
        text,
        time: timeStr,
        timestamp: now.toISOString()
      };

      try {
        if (isFirebaseConfigured() && window.firebaseDb) {
          await window.firebaseDb.collection("wishes").add(newWish);
        } else {
          localWishes.unshift(newWish);
          localStorage.setItem('wedding_wishes', JSON.stringify(localWishes));
          renderWishes([newWish, ...allInitialWishes]);
        }
        form.reset();
        alert("Cảm ơn lời chúc yêu thương của bạn!");
      } catch (err) {
        console.error("Lỗi gửi lời chúc:", err);
        // Fallback lưu local nếu có lỗi mạng
        localWishes.unshift(newWish);
        localStorage.setItem('wedding_wishes', JSON.stringify(localWishes));
        renderWishes([newWish, ...allInitialWishes]);
        form.reset();
        alert("Cảm ơn lời chúc yêu thương của bạn!");
      }
    });
  }
}

// Công cụ tạo Link thiệp mời & Mã QR cá nhân hóa
function initGeneratorTool() {
  const genBtn = document.getElementById('gen-link-btn');
  const copyBtn = document.getElementById('copy-link-btn');
  const resultBox = document.getElementById('qr-result-box');
  const linkDisplay = document.getElementById('generated-link-display');
  const qrImg = document.getElementById('generated-qr-img');

  if (!genBtn) return;

  genBtn.addEventListener('click', () => {
    const guest = document.getElementById('gen-guest-name').value.trim();
    const role = document.getElementById('gen-role-select').value;
    const mode = document.getElementById('gen-mode-select').value;

    if (!guest) {
      alert("Vui lòng nhập tên khách mời!");
      return;
    }

    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    params.set('to', guest);
    if (role) params.set('role', role);
    params.set('mode', mode);

    const fullUrl = `${baseUrl}?${params.toString()}`;

    linkDisplay.textContent = fullUrl;
    // Dùng QuickChart API để gen QR code sắc nét
    qrImg.src = `https://quickchart.io/qr?text=${encodeURIComponent(fullUrl)}&size=200&dark=942233`;
    resultBox.classList.add('active');
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const url = linkDisplay.textContent;
      navigator.clipboard.writeText(url).then(() => {
        alert("Đã sao chép liên kết mời vào bộ nhớ tạm!");
      });
    });
  }
}

// Scroll reveal animations
function initGiftDialog() {
  const openBtn = document.getElementById('gift-envelope-open');
  const dialog = document.getElementById('gift-dialog');
  const closeBtn = document.getElementById('gift-dialog-close');
  if (!openBtn || !dialog || !closeBtn) return;
  if (openBtn.dataset.giftBound === '1') return;
  openBtn.dataset.giftBound = '1';

  const openDialog = () => {
    dialog.hidden = false;
    dialog.classList.add('is-open');
    dialog.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  };

  const closeDialog = () => {
    dialog.hidden = true;
    dialog.classList.remove('is-open');
    dialog.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    openBtn.focus();
  };

  openBtn.addEventListener('click', openDialog);
  closeBtn.addEventListener('click', closeDialog);
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeDialog();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !dialog.hidden) closeDialog();
  });
}

let scrollRevealObserver = null;
let openingEntrancePlayed = false;

const REVEAL_MEDIA_SELECTOR =
  '.hero-arch-wrap, .hero-signature-col, .polaroid-photo-box, .polaroid-card-body, ' +
  '.invite-triptych__item, .gallery-grid-item, .formal-invite-schedule-illus, ' +
  '.gift-envelope-wrap';

const REVEAL_TEXT_SELECTOR =
  'h1, h2, h3, h4, h5, h6, p, li, .hero-eyebrow, .hero-journey-tagline, .hero-date-ribbon, ' +
  '.rsvp-form-heading, .form-group-item, .rsvp-submit-btn, a.formal-invite-directions, ' +
  '.formal-invite-schedule-text, .album-section-title, .footer-couple-title, ' +
  '.footer-script-thankyou, .footer-closing-text, .wedding-calendar-countdown, ' +
  '.wedding-calendar-grid';

const OPENING_ENTRANCE_ROOTS = 'header.canvas-top-bar, .hero-canvas-section';

function shouldSkipRevealEl(el) {
  if (!el || el.classList.contains('scroll-reveal')) return true;
  if (el.closest('#envelope-intro, #gift-dialog, #guest-banner')) return true;
  if (el.closest('.hero-hearts-orbit, .wedding-calendar-bg, .wedding-calendar-scrim')) return true;
  if (el.hidden || el.getAttribute('aria-hidden') === 'true') return true;
  if (el.matches('hr, .formal-invite-rule, .album-section-rule, .polaroid-family-rule')) return true;
  const text = (el.textContent || '').trim();
  if (el.matches('p, span, li') && text.length === 0) return true;
  return false;
}

function isInsideRevealMedia(el) {
  const host = el.closest(REVEAL_MEDIA_SELECTOR);
  if (!host) return false;
  if (host === el) return false;
  if (host.matches('.rsvp-box-card')) return false;
  return true;
}

function pickRevealVariant(el) {
  if (
    el.classList.contains('gallery-grid-item') ||
    el.classList.contains('invite-triptych__item') ||
    el.classList.contains('hero-arch-wrap') ||
    el.classList.contains('wedding-calendar-grid') ||
    el.classList.contains('polaroid-photo-box') ||
    el.classList.contains('formal-invite-schedule-illus') ||
    el.classList.contains('hero-signature-col') ||
    el.classList.contains('gift-envelope-wrap') ||
    el.matches('img')
  ) {
    return 'zoom';
  }
  if (
    el.classList.contains('polaroid-card-body--bride') ||
    el.classList.contains('couple-polaroid-matrix__photo--bride')
  ) {
    return 'merge-left';
  }
  if (
    el.classList.contains('polaroid-card-body--groom') ||
    el.classList.contains('couple-polaroid-matrix__photo--groom')
  ) {
    return 'merge-right';
  }
  return 'text';
}

function collectSectionRevealTargets(section) {
  const ordered = [];
  const seen = new Set();

  const push = (el) => {
    if (shouldSkipRevealEl(el) || seen.has(el)) return;
    seen.add(el);
    ordered.push(el);
  };

  if (section.matches('header.canvas-top-bar')) {
    section.querySelectorAll(':scope > *').forEach(push);
    return ordered;
  }

  section.querySelectorAll(REVEAL_MEDIA_SELECTOR).forEach(push);

  section.querySelectorAll(REVEAL_TEXT_SELECTOR).forEach((el) => {
    if (shouldSkipRevealEl(el)) return;
    if (isInsideRevealMedia(el)) return;
    if (el.closest('.invite-triptych__item, .gallery-grid-item, .formal-invite-schedule-illus')) return;
    if (el.closest('.polaroid-card-body') && !el.classList.contains('polaroid-card-body')) return;
    if (el.closest('.hero-arch-wrap') && !el.closest('.hero-arch-overlay, .hero-text-block')) return;
    push(el);
  });

  section.querySelectorAll('img').forEach((img) => {
    if (shouldSkipRevealEl(img)) return;
    if (img.closest(REVEAL_MEDIA_SELECTOR)) return;
    if (img.closest('.gift-envelope-icon')) return;
    push(img);
  });

  return ordered;
}

function applyRevealClasses(section, delayOffset = 0) {
  collectSectionRevealTargets(section).forEach((el, i) => {
    if (el.classList.contains('scroll-reveal')) return;
    const variant = pickRevealVariant(el);
    el.classList.add('scroll-reveal', `scroll-reveal--${variant}`);
    const delay = Math.min(delayOffset + i * 0.06, 0.45);
    el.style.setProperty('--reveal-delay', `${delay}s`);
  });
}

function markOpeningRevealTargets() {
  const canvas = document.getElementById('app-canvas');
  if (!canvas) return;
  canvas.querySelectorAll(OPENING_ENTRANCE_ROOTS).forEach((root) => applyRevealClasses(root));
}

function markScrollRevealTargets() {
  const canvas = document.getElementById('app-canvas');
  if (!canvas) return;

  canvas.querySelectorAll('header.canvas-top-bar, section, footer.canvas-footer-section').forEach((section) => {
    applyRevealClasses(section);
  });

  canvas.querySelectorAll('.reveal-fade-up:not(.scroll-reveal)').forEach((el) => {
    el.classList.add('scroll-reveal', 'scroll-reveal--text');
  });
}

function ensureScrollRevealObserver() {
  if (scrollRevealObserver) return;

  scrollRevealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible', 'active');
        scrollRevealObserver.unobserve(entry.target);
      });
    },
    { root: null, threshold: 0.08, rootMargin: '0px 0px -10% 0px' }
  );
}

function bindScrollRevealElements() {
  const canvas = document.getElementById('app-canvas');
  if (!canvas) return;

  const reveals = canvas.querySelectorAll('.scroll-reveal:not(.is-visible), .reveal-fade-up:not(.is-visible)');
  if (!reveals.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    reveals.forEach((el) => el.classList.add('is-visible', 'active'));
    return;
  }

  ensureScrollRevealObserver();
  reveals.forEach((el) => scrollRevealObserver.observe(el));
}

function getOpeningEntranceTargets() {
  const canvas = document.getElementById('app-canvas');
  if (!canvas) return [];

  const list = [];
  const seen = new Set();
  canvas.querySelectorAll(OPENING_ENTRANCE_ROOTS).forEach((root) => {
    collectSectionRevealTargets(root).forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      list.push(el);
    });
  });
  return list;
}

function playOpeningEntrance() {
  if (openingEntrancePlayed) return;

  const canvas = document.getElementById('app-canvas');
  if (!canvas) return;

  const targets = getOpeningEntranceTargets();
  if (!targets.length) return;

  openingEntrancePlayed = true;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach((el) => el.classList.add('is-visible', 'active'));
    return;
  }

  document.body.classList.add('intro-entrance-playing');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      targets.forEach((el, i) => {
        const base = 0.18;
        const stagger = Math.min(i * 0.08, 0.64);
        el.style.setProperty('--reveal-delay', `${base + stagger}s`);
        el.classList.add('is-visible', 'active');
        scrollRevealObserver?.unobserve(el);
      });

      window.setTimeout(() => {
        document.body.classList.remove('intro-entrance-playing');
      }, 1400);
    });
  });
}

function bootScrollReveal() {
  markScrollRevealTargets();
  ensureScrollRevealObserver();
  playOpeningEntrance();
  window.setTimeout(() => bindScrollRevealElements(), 120);
}

// Khởi chạy toàn bộ khi DOM load xong
document.addEventListener('DOMContentLoaded', () => {
  initSakuraPetals();
  initAudioPlayer();
  handleQueryParams();
  initLightbox();
  initRSVPForm();
  initGiftDialog();
  initWishesSection();
  initGeneratorTool();

  const startRevealWhenReady = () => {
    if (!document.body.classList.contains('intro-complete')) return;
    bootScrollReveal();
  };

  window.addEventListener(
    'wedding:intro-revealing',
    () => {
      markOpeningRevealTargets();
      window.setTimeout(() => playOpeningEntrance(), 420);
    },
    { once: true }
  );

  if (document.body.classList.contains('intro-complete')) {
    startRevealWhenReady();
  } else {
    window.addEventListener('wedding:intro-complete', startRevealWhenReady, { once: true });
  }
});
