/* ═══════════════════════════════════════════
   SUBVERSE — Particles Module
   Floating luminous particles on a canvas
   ═══════════════════════════════════════════ */

(function initParticles(){
  const canvas = document.getElementById('particles');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  const particles = [];
  const COUNT = 70;

  function resize(){
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor(){ this.spawn(); }
    spawn(){
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.r = Math.random() * 1.6 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.12;
      this.vy = (Math.random() - 0.5) * 0.12;
      this.alpha = Math.random() * 0.35 + 0.08;
      this.baseAlpha = this.alpha;
      this.pulse = Math.random() * Math.PI * 2;
      this.pulseSpeed = Math.random() * 0.008 + 0.003;
      // Aurora colors: purple / cyan / teal
      const hues = [260, 200, 170, 280];
      this.hue = hues[Math.floor(Math.random() * hues.length)];
    }
    update(){
      this.x += this.vx;
      this.y += this.vy;
      this.pulse += this.pulseSpeed;
      this.alpha = this.baseAlpha + Math.sin(this.pulse) * 0.1;
      if(this.x < -10 || this.x > W + 10 || this.y < -10 || this.y > H + 10){
        this.spawn();
      }
    }
    draw(){
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, 65%, 72%, ${Math.max(0, this.alpha)})`;
      ctx.fill();
    }
  }

  for(let i = 0; i < COUNT; i++) particles.push(new Particle());

  // Draw connecting lines between nearby particles
  function drawLines(){
    for(let i = 0; i < particles.length; i++){
      for(let j = i + 1; j < particles.length; j++){
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < 120){
          const alpha = (1 - dist / 120) * 0.04;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(167, 139, 250, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function loop(){
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawLines();
    requestAnimationFrame(loop);
  }
  loop();
})();
