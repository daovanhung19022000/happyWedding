import { playlist } from './music-list.js';
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';
import { initWishesLive, setWishGuestName } from './wishes-live.js';
import {
  eventModes,
  resolveEventMode,
  parseInviteFromLocation,
  buildGuestKey,
  modeKeyToCode,
} from './invite-config.js';

export { eventModes, resolveEventMode };

function formatInviteHour(timeStr) {
  if (!timeStr) return "";
  return String(timeStr).replace(":", "h");
}

// Khởi tạo trạng thái
let currentMode = "trai";
let currentTrackIndex = 0;
let isAudioPlaying = false;
let audioElement = new Audio();
let countdownInterval = null;

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
  const parsed = parseInviteFromLocation(window.location);
  const guestName = parsed.guestName;
  const role = parsed.role || urlParams.get('role');
  currentMode = parsed.mode;

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
    setWishGuestName(fullGreeting);
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

  const gallerySection = document.querySelector('.gallery-canvas-section');
  if (gallerySection && modal && img) {
    gallerySection.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof HTMLImageElement) || !target.closest('.gallery-item')) return;
      img.src = target.currentSrc || target.src;
      modal.classList.add('active');
    });
  }

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

    const parsedInvite = parseInviteFromLocation(window.location);
    const modeCode = modeKeyToCode(currentMode);
    const guestKey = parsedInvite.guestName
      ? buildGuestKey(modeCode, parsedInvite.guestName, parsedInvite.role || '')
      : null;

    const rsvpData = {
      name,
      attendance,
      guests,
      note,
      mode: currentMode,
      modeCode,
      guestNameRaw: parsedInvite.guestName,
      inviteRole: parsedInvite.role || '',
      guestKey,
      timestamp: new Date().toISOString(),
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

// Khởi chạy toàn bộ khi DOM load xong
document.addEventListener('DOMContentLoaded', () => {
  initAudioPlayer();
  handleQueryParams();
  initLightbox();
  initRSVPForm();
  initGiftDialog();
  initWishesLive();
  initGeneratorTool();
});
