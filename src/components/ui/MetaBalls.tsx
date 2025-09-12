'use client';

import React, { useEffect, useRef } from 'react';

interface MetaBallsProps {
  className?: string;
  count?: number;
  speed?: number;
}

export function MetaBalls({ className = '', count = 5, speed = 0.5 }: MetaBallsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Meta balls data
    const balls = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width / window.devicePixelRatio,
      y: Math.random() * canvas.height / window.devicePixelRatio,
      vx: (Math.random() - 0.5) * speed * 2,
      vy: (Math.random() - 0.5) * speed * 2,
      radius: 50 + Math.random() * 100,
    }));

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

      // Update ball positions
      balls.forEach(ball => {
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Bounce off edges
        if (ball.x < 0 || ball.x > canvas.width / window.devicePixelRatio) ball.vx *= -1;
        if (ball.y < 0 || ball.y > canvas.height / window.devicePixelRatio) ball.vy *= -1;

        // Keep in bounds
        ball.x = Math.max(0, Math.min(canvas.width / window.devicePixelRatio, ball.x));
        ball.y = Math.max(0, Math.min(canvas.height / window.devicePixelRatio, ball.y));
      });

      // Create gradient for each ball
      balls.forEach(ball => {
        const gradient = ctx.createRadialGradient(
          ball.x, ball.y, 0,
          ball.x, ball.y, ball.radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [count, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ background: 'transparent' }}
    />
  );
}
