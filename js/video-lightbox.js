/**
 * HAKURA — "Sente o nosso Espaço" video lightbox (#hakuraVideoDialog).
 *
 * - The video is imported here (not written in the HTML), so Vite bundles it
 *   but the browser only downloads it when the visitor opens the lightbox.
 * - Opens with any [data-video-open] button and starts playing with sound
 *   (allowed, because it follows the visitor's click).
 * - Closes with the X, the Escape key or a click outside the video; closing
 *   pauses it, and opening again continues from the same point.
 * - To change the video: replace assets/videos/hakura_espaco.mp4 (vertical
 *   9:16, H.264) and assets/images/video_espaco_poster.webp (its first frame).
 */
import videoUrl from '../assets/videos/hakura_espaco.mp4';
import posterUrl from '../assets/images/video_espaco_poster.webp';

const dialog = document.getElementById('hakuraVideoDialog');
const video = dialog && dialog.querySelector('video');

function open() {
  if (!dialog || !video || dialog.open) return;
  if (!video.getAttribute('src')) {
    video.poster = posterUrl;
    video.src = videoUrl;
  }
  document.documentElement.classList.add('hk-dialog-open');
  if (window.lenis && window.lenis.stop) window.lenis.stop();
  dialog.showModal();
  const playing = video.play();
  // If the browser still blocks playback, the visible controls let the visitor start it.
  if (playing && playing.catch) playing.catch(() => {});
}

if (dialog && video) {
  document.querySelectorAll('[data-video-open]').forEach((btn) => btn.addEventListener('click', open));
  dialog.querySelectorAll('[data-video-close]').forEach((btn) => btn.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    video.pause();
    document.documentElement.classList.remove('hk-dialog-open');
    if (window.lenis && window.lenis.start) window.lenis.start();
  });
}
