/**
 * VentureLab AI Widget Loader
 * Embeds the VentureLab conversational chat assistant into any website.
 *
 * Usage:
 * <script src="https://your-domain.com/widget.js" data-business-slug="apex-institute"></script>
 */
(function () {
  const currentScript = document.currentScript;
  const businessSlug = (currentScript && currentScript.getAttribute("data-business-slug")) || "apex-institute";
  const baseUrl = (currentScript && currentScript.src) ? new URL(currentScript.src).origin : window.location.origin;

  // Create launcher button
  const button = document.createElement("button");
  if(document.getElementById("venturelab-launcher")) return;
  button.setAttribute("aria-label", "Open business assistant");
  button.setAttribute("aria-expanded", "false");
  button.id = "venturelab-launcher";
  button.style.position = "fixed";
  button.style.bottom = "24px";
  button.style.right = "24px";
  button.style.width = "60px";
  button.style.height = "60px";
  button.style.borderRadius = "30px";
  button.style.backgroundColor = "#086f60";
  button.style.color = "#ffffff";
  button.style.border = "none";
  button.style.cursor = "pointer";
  button.style.boxShadow = "0 10px 25px -5px rgba(8, 111, 96, 0.25)";
  button.style.zIndex = "999998";
  button.style.display = "flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.transition = "transform 0.2s ease, background-color 0.2s ease";
  button.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;

  // Create iframe container
  const container = document.createElement("div");
  container.id = "venturelab-chat-container";
  container.style.position = "fixed";
  container.style.bottom = "96px";
  container.style.right = "24px";
  container.style.width = "400px";
  container.style.maxWidth = "calc(100vw - 48px)";
  container.style.height = "620px";
  container.style.maxHeight = "calc(100vh - 120px)";
  container.style.borderRadius = "16px";
  container.style.overflow = "hidden";
  container.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.5)";
  container.style.border = "1px solid rgba(255, 255, 255, 0.1)";
  container.style.zIndex = "999999";
  container.style.display = "none";
  container.style.transition = "opacity 0.2s ease, transform 0.2s ease";

  const iframe = document.createElement("iframe");
  iframe.src = `${baseUrl}/c/${encodeURIComponent(businessSlug)}`;
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  iframe.title = "VentureLab AI Assistant";

  container.appendChild(iframe);
  document.body.appendChild(button);
  document.body.appendChild(container);

  let isOpen = false;
  button.addEventListener("click", () => {
    isOpen = !isOpen;
    button.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      container.style.display = "block";
      button.style.backgroundColor = "#3730a3";
      button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
    } else {
      container.style.display = "none";
      button.style.backgroundColor = "#086f60";
      button.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
    }
  });
})();
