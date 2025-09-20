const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const gif1 = document.getElementById('gif1');
const gif2 = document.getElementById('gif2');
const heartMessage = document.getElementById('heart-message');
const messageContainer = document.querySelector('.message-container');

const fullText = ["TE AMO"];
let fontSize = 100;
let lineHeight = 120;
let heartScale = 15;

const gif1Pos = { x: 0, y: 0 };
const gif2Pos = { x: 0, y: 0 };

const stars = [];
const shootingStars = [];
let dots = [];
let targetDotsQueue = [];
let currentCharIndex = 0;
let animationDone = false;
let shooterToggle = true;

// 💌 Mensaje lateral
const heartMessageText = "Siempre juntos, Kams ❤️. Gracias por estar conmigo y por cada momento que compartimos. Eres lo más importante en mi vida y te amo con todo mi corazón.";
let typedText = "";
let typedIndex = 0;
let typingInterval = null;

// Detectar si es dispositivo móvil
function isMobileDevice() {
  return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
}

function resizeCanvas() {
  const isMobile = isMobileDevice();
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Ajustar parámetros según dispositivo
  const scaleFactor = isMobile ? 
    Math.min(1, canvas.width / 500) : // Factor diferente para móviles
    Math.min(1, canvas.width / 700);
    
  fontSize = isMobile ? 70 * scaleFactor : 90 * scaleFactor;
  lineHeight = isMobile ? 90 * scaleFactor : 110 * scaleFactor;
  heartScale = isMobile ? 12 * scaleFactor : 14 * scaleFactor;

  gif1Pos.x = gif1.offsetLeft + gif1.offsetWidth / 2;
  gif1Pos.y = canvas.height - (gif1.offsetHeight / 2);

  gif2Pos.x = gif2.offsetLeft + gif2.offsetWidth / 2;
  gif2Pos.y = canvas.height - (gif2.offsetHeight / 2);

  // Ajustar número de estrellas según dispositivo
  stars.length = 0;
  const starCount = isMobile ? 100 : 200;
  
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
      delta: (Math.random() * 0.02) + 0.005
    });
  }
  
  resetAnimation();
}

function resetAnimation() {
  dots = [];
  targetDotsQueue = [];
  currentCharIndex = 0;
  animationDone = false;
  typedText = "";
  clearInterval(typingInterval);
  heartMessage.innerHTML = "";
  messageContainer.classList.remove('show');
  document.querySelector('.side-image').classList.remove('show');
  generateAllTargetDots();
  gif1.src = "https://i.pinimg.com/originals/e5/c5/4c/e5c54cd43fd75a7ec5b7cf0f65838ec3.gif";
  gif2.src = "https://i.pinimg.com/originals/e5/c5/4c/e5c54cd43fd75a7ec5b7cf0f65838ec3.gif";
}

function generateHeartDots() {
    const heartDots = [];
    const scale = heartScale; 
    const pointsCount = 150;
    const offsetX = canvas.width / 2;
    const offsetY = canvas.height / 2 + (fontSize * 1.2);

    for (let i = 0; i < pointsCount; i++) {
        const t = (i / pointsCount) * 2 * Math.PI;
        const x = scale * 16 * Math.pow(Math.sin(t), 3);
        const y = -scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        heartDots.push({ x: offsetX + x, y: offsetY + y });
    }
    return heartDots;
}

function generateAllTargetDots() {
  const tempCtx = document.createElement('canvas').getContext('2d');
  tempCtx.font = `bold ${fontSize}px Arial`;
  const startY = (canvas.height - fullText.length * lineHeight) / 2 + fontSize / 2 - (fontSize * 1.5);

  fullText.forEach((line, lineIndex) => {
    const lineWidth = tempCtx.measureText(line).width;
    let xCursor = (canvas.width - lineWidth) / 2;
    const y = startY + lineIndex * lineHeight;

    for (let char of line) {
      if (char === " ") {
        xCursor += tempCtx.measureText(" ").width;
        targetDotsQueue.push([]);
        continue;
      }
      const charDots = generateCharDots(char, xCursor, y);
      targetDotsQueue.push(charDots);
      xCursor += tempCtx.measureText(char).width;
    }
  });

  const heartShapeDots = generateHeartDots();
  targetDotsQueue.push(heartShapeDots);
}

function generateCharDots(char, x, y) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.font = `bold ${fontSize}px Arial`;
  tempCtx.fillText(char, x, y);

  const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height).data;
  const charDots = [];
  const density = 5;

  for (let yPos = 0; yPos < canvas.height; yPos += density) {
    for (let xPos = 0; xPos < canvas.width; xPos += density) {
      const index = (yPos * canvas.width + xPos) * 4;
      if (imageData[index + 3] > 128) {
        charDots.push({ x: xPos, y: yPos });
      }
    }
  }
  return charDots;
}

function shootDot() {
    if (animationDone) return;

    while (currentCharIndex < targetDotsQueue.length && targetDotsQueue[currentCharIndex].length === 0) {
        currentCharIndex++;
    }

    const currentTargets = targetDotsQueue[currentCharIndex];
    if (!currentTargets) return;

    const batchSize = (currentCharIndex === targetDotsQueue.length - 1) ? 3 : 1;

    for (let i = 0; i < batchSize; i++) {
        if (currentTargets.length === 0) break;
        
        const target = currentTargets.shift();
        if (!target) continue;

        const shooterPos = shooterToggle ? gif1Pos : gif2Pos;
        shooterToggle = !shooterToggle;

        dots.push({
            x: shooterPos.x,
            y: shooterPos.y - 20,
            vx: 0,
            vy: 0,
            targetX: target.x,
            targetY: target.y,
        });
    }

    if (currentTargets.length === 0) {
        currentCharIndex++;
        if (currentCharIndex >= targetDotsQueue.length) {
            if (!animationDone) {
                animationDone = true;
                const celebrationGif = "https://i.pinimg.com/originals/7e/f6/9c/7ef69cd0a6b0b78526c8ce983b3296fc.gif";
                gif1.src = celebrationGif;
                gif2.src = celebrationGif;

                // 💌 Iniciar escritura del mensaje lateral
                setTimeout(() => {
                  messageContainer.classList.add('show');
                  
                  // Mostrar la imagen lateral
                  document.querySelector('.side-image').classList.add('show');
                  
                  typedText = "";
                  typedIndex = 0;
                  clearInterval(typingInterval);
                  
                  // Ajustar velocidad de escritura para móviles
                  const typingSpeed = isMobileDevice() ? 90 : 70;
                  
                  typingInterval = setInterval(() => {
                    if (typedIndex < heartMessageText.length) {
                        typedText += heartMessageText[typedIndex];
                        heartMessage.innerHTML = typedText + '<span class="typing-cursor"></span>';
                        typedIndex++;
                    } else {
                        clearInterval(typingInterval);
                        heartMessage.innerHTML = typedText;
                    }
                  }, typingSpeed);
                }, 1000);
            }
        }
    }
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#0a0a23");
  gradient.addColorStop(1, "#2c014e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawStars() {
  stars.forEach(star => {
    star.alpha += star.delta;
    if (star.alpha <= 0 || star.alpha >= 1) star.delta *= -1;
    ctx.save();
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function createShootingStar() {
  const startX = Math.random() * canvas.width;
  const startY = Math.random() * canvas.height / 2;
  shootingStars.push({
    x: startX,
    y: startY,
    length: Math.random() * 300 + 100,
    speed: Math.random() * 10 + 6,
    angle: Math.PI / 4,
    opacity: 1
  });
}

function drawShootingStars() {
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const s = shootingStars[i];
    const endX = s.x - Math.cos(s.angle) * s.length;
    const endY = s.y - Math.sin(s.angle) * s.length;

    const gradient = ctx.createLinearGradient(s.x, s.y, endX, endY);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${s.opacity})`);
    gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    s.x += Math.cos(s.angle) * s.speed;
    s.y += Math.sin(s.angle) * s.speed;
    s.opacity -= 0.01;

    if (s.opacity <= 0) {
      shootingStars.splice(i, 1);
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  drawBackground();
  drawStars();
  drawShootingStars();

  dots.forEach(dot => {
    const dx = dot.targetX - dot.x;
    const dy = dot.targetY - dot.y;
    dot.vx += dx * 0.0025;
    dot.vy += dy * 0.0025;
    dot.vx *= 0.96;
    dot.vy *= 0.96;
    dot.x += dot.vx;
    dot.y += dot.vy;
    ctx.fillStyle = "rgba(255, 105, 180, 0.9)";
    ctx.font = `${14 * Math.min(1, canvas.width / 400)}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("❤️", dot.x, dot.y);
  });
}

// Event listeners
window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', () => {
  setTimeout(resizeCanvas, 100);
});

// Iniciar animaciones
animate();
setInterval(shootDot, 20);
setInterval(createShootingStar, 1500);
