(function () {
    const bubble = document.createElement("div");
    bubble.id = "chat-bubble";
    bubble.innerHTML = "💬";
    Object.assign(bubble.style, {
      position: "fixed",
      top: "50%",
      right: "20px",
      width: "50px",
      height: "50px",
      background: "#0078d4",
      color: "white",
      fontSize: "24px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      zIndex: 9999,
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      transition: "transform 0.3s ease",
      transform: "translateY(-50%)"
    });
    
    // Add periodic animation
    setInterval(() => {
      bubble.classList.add("animate");
      setTimeout(() => bubble.classList.remove("animate"), 1800);
    }, 8000);
  
    const iframe = document.createElement("iframe");
    iframe.src = "chat-widget.html";
    iframe.style.position = "fixed";
    iframe.style.top = "50%";
    iframe.style.right = "80px";
    iframe.style.transform = "translateY(-50%)";
    iframe.style.left = "auto";
    iframe.style.width = "320px";
    iframe.style.height = "440px";
    iframe.style.border = "none";
    iframe.style.borderRadius = "8px";
    iframe.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
    iframe.style.display = "none";
    iframe.style.zIndex = 9998;
  
    bubble.addEventListener("click", () => {
      iframe.style.display = iframe.style.display === "none" ? "block" : "none";
    });
  
    document.body.appendChild(bubble);
    document.body.appendChild(iframe);
  })();

const style = document.createElement("style");
style.textContent = `
@keyframes wiggle {
  0%, 100% { transform: translateY(-50%) rotate(0deg); }
  25% { transform: translateY(-50%) rotate(-15deg); }
  75% { transform: translateY(-50%) rotate(15deg); }
}

@keyframes pulse {
  0%, 100% { transform: translateY(-50%) scale(1); }
  50% { transform: translateY(-50%) scale(1.25); }
}

#chat-bubble.animate {
  animation: wiggle 0.6s ease-in-out, pulse 1.2s ease-in-out;
  animation-delay: 0s, 0.6s;
  animation-iteration-count: 1, 1;
}
`;
document.head.appendChild(style);
  