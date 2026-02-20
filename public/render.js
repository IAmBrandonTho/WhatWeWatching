export function render(state) {
  document.body.dataset.connection = state.connection;

  const video = document.querySelector("video");
  if (!video) return;

  if (!state.video.hasStream) {
    video.srcObject = null;
  }
}
