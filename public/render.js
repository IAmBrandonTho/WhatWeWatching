export function render(state) {
  document.body.dataset.connection = state.connection;

  const video = document.querySelector("video");
  if (video) {
    if (state.video.hasStream && state.video.stream) {
      if (video.srcObject !== state.video.stream) {
        video.srcObject = state.video.stream;
        video.play().catch(()=>{});
      }
    } else {
      video.srcObject = null;
    }
  }

  const list = document.querySelector("[data-people-list]");
  if (list) {
    list.innerHTML = state.peers.map(p=>`<li>${p}</li>`).join("");
  }
}
