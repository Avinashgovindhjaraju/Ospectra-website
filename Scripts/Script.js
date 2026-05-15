
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");
const bottomimg = document.querySelector(".bj-bannerbottomimg");

hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  navMenu.classList.toggle("active");

  function updateBottomImgDisplay() {
    if (window.innerWidth <= 990) {
      bottomimg.style.display = "flex";
    } else {
      bottomimg.style.display = "none";
    }
  }
  // Toggle body overflow
  document.body.style.overflow = document.body.style.overflow === 'hidden' ? 'auto' : 'hidden';
  

  updateBottomImgDisplay();
  window.addEventListener("resize", updateBottomImgDisplay);
})

document.querySelectorAll(".nav-link").forEach(n => n.
    addEventListener('click', () =>{
        hamburger.classList.remove("active");
        navMenu.classList.remove("active");
}));


function openDemo() {
    document.getElementById('book-demo').style.display = 'flex';
}

function closeDemo() {
    document.getElementById('book-demo').style.display = 'none';
}
