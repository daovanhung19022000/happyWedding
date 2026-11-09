import { INVITE_LOOK_KIMONO, INVITE_LOOK_MODERN, isInviteLook } from './invite-look.js';

/** Trang /view hoặc /view2 — đọc từ `data-invite-view-look` trên body. */
export function getViewAdminLook() {
  const raw = document.body?.dataset?.inviteViewLook;
  return raw === INVITE_LOOK_MODERN ? INVITE_LOOK_MODERN : INVITE_LOOK_KIMONO;
}

export function getViewAdminLookLabel(look = getViewAdminLook()) {
  return look === INVITE_LOOK_MODERN ? 'Ảnh hiện đại (70%)' : 'Ảnh kimono (30%)';
}

export { isInviteLook };
