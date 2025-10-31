document.addEventListener("DOMContentLoaded", () => {
    fetch("reviews.json")
      .then(response => response.json())
      .then(data => {
        const grid = document.getElementById("reviews-grid");
  
        data.forEach(review => {
          const card = document.createElement("div");
          card.className = "review-card";
  
          const content = document.createElement("div");
          content.className = "review-content";
  
          const slider = document.createElement("div");
          slider.className = "review-slider";
  
          review.images.forEach((src, i) => {
            const img = document.createElement("img");
            img.src = src;
            img.alt = `${review.title} image`;
            img.classList.add(i === 0 ? "active" : "inactive");
            slider.appendChild(img);
          });
  
          const text = document.createElement("div");
          text.className = "review-text";
          text.innerHTML = `
            <h2 class="card-title">${review.title}</h2>
            <p class="stars">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</p>
            <p class="comments">${review.comments}</p>
          `;
  
          content.appendChild(slider);
          content.appendChild(text);
          card.appendChild(content);
          grid.appendChild(card);
  
          // Slideshow logic
          const images = slider.querySelectorAll("img");
          let current = 0;
          let interval;
  
          const showImage = index => {
            images.forEach(img => {
              img.classList.remove("active");
              img.classList.add("inactive");
            });
            images[index].classList.remove("inactive");
            images[index].classList.add("active");
          };
  
          const startSlideshow = () => {
            showImage(current);
            interval = setInterval(() => {
              current = (current + 1) % images.length;
              showImage(current);
            }, 3000);
          };
  
          const resetSlideshow = () => {
            clearInterval(interval);
            current = 0;
            startSlideshow();
          };
  
          if (images.length > 0) {
            images.forEach(img => img.classList.add("inactive"));
            startSlideshow();
          }
  
          slider.addEventListener("click", resetSlideshow);
        });
      })
      .catch(error => {
        console.error("Error loading reviews:", error);
        document.getElementById("reviews-grid").innerHTML = "<p>Unable to load reviews.</p>";
      });
  });
  