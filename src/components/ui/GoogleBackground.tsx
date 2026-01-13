import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Particle {
    x: number;
    y: number;
    originX: number;
    originY: number;
    size: number;
    color: string;
    vx: number;
    vy: number;
    friction: number;
    ease: number;
    angle: number;
    opacity: number;
}

interface GoogleBackgroundProps {
    className?: string;
    count?: number;
}

export function GoogleBackground({ className, count = 1000 }: GoogleBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouse = useRef({ x: 0, y: 0, active: false });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        let time = 0;

        const colors = [
            'rgba(66, 133, 244, ',  // Google Blue
            'rgba(26, 115, 232, ',  // Mid Blue
            'rgba(138, 180, 248, ', // Light Blue
        ];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init();
        };

        const init = () => {
            particles = [];
            for (let i = 0; i < count; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const baseOpacity = Math.random() * 0.4 + 0.1;
                particles.push({
                    x,
                    y,
                    originX: x,
                    originY: y,
                    size: Math.random() * 2 + 0.5,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    vx: 0,
                    vy: 0,
                    friction: 0.9,
                    ease: 0.02,
                    angle: Math.random() * Math.PI * 2,
                    opacity: baseOpacity,
                });
            }
        };

        const animate = () => {
            time += 0.005;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p) => {
                // 1. Wavy base movement (Tamoj)
                p.vx += Math.cos(time + p.angle) * 0.08;
                p.vy += Math.sin(time + p.angle) * 0.08;

                // 2. Mouse interaction
                const dx = mouse.current.x - p.x;
                const dy = mouse.current.y - p.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (mouse.current.active) {
                    // Global follow logic (RESTORED for visibility)
                    // We use a distance-based weight to make them follow but not clump
                    const followForce = 0.0005;
                    p.vx += dx * followForce;
                    p.vy += dy * followForce;

                    // Repulsion "Hole" logic
                    const holeSize = 100;
                    if (distance < holeSize) {
                        const repulsionForce = (holeSize - distance) * 0.05;
                        const angle = Math.atan2(dy, dx);
                        p.vx -= Math.cos(angle) * repulsionForce;
                        p.vy -= Math.sin(angle) * repulsionForce;
                    }
                }

                // 3. Return to origin (Elastic effect)
                // This is what keeps them "scattered" and prevents clumps
                p.vx += (p.originX - p.x) * p.ease;
                p.vy += (p.originY - p.y) * p.ease;

                // Apply physics
                p.vx *= p.friction;
                p.vy *= p.friction;
                p.x += p.vx;
                p.y += p.vy;

                // Draw particle
                ctx.fillStyle = `${p.color}${p.opacity})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouse.current.x = e.clientX;
            mouse.current.y = e.clientY;
            mouse.current.active = true;
        };

        const handleMouseLeave = () => {
            mouse.current.active = false;
        };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);

        resize();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, [count]);

    return (
        <canvas
            ref={canvasRef}
            className={cn("fixed inset-0 pointer-events-none select-none z-0", className)}
            style={{ background: 'transparent' }}
        />
    );
}
