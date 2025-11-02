'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import ContactModal from '@/components/ContactModal';
import { getRandomChannels, type ChannelData } from '@/lib/channels-data';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeCanvasRef = useRef<HTMLCanvasElement>(null);

  // Random channels selection - regenerates on each page load
  const randomChannels = useMemo(() => getRandomChannels(8), []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Constellation background animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create star points for constellations
    const stars: Array<{x: number, y: number, vx: number, vy: number, brightness: number, twinkle: number}> = [];

    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
        brightness: Math.random() * 0.5 + 0.5,
        twinkle: Math.random() * Math.PI * 2
      });
    }

    let animationId: number;
    const animate = () => {
      // Clear with pure dark background
      ctx.fillStyle = '#0a0a1f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw constellation lines first
      stars.forEach((star, i) => {
        star.x += star.vx;
        star.y += star.vy;

        if (star.x < 0 || star.x > canvas.width) star.vx *= -1;
        if (star.y < 0 || star.y > canvas.height) star.vy *= -1;

        // Draw connecting lines to nearby stars
        stars.slice(i + 1).forEach(other => {
          const dx = star.x - other.x;
          const dy = star.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            const opacity = (1 - dist / 150) * 0.4;
            const gradient = ctx.createLinearGradient(star.x, star.y, other.x, other.y);
            gradient.addColorStop(0, `rgba(168, 85, 247, ${opacity * star.brightness})`);
            gradient.addColorStop(0.5, `rgba(251, 191, 36, ${opacity})`);
            gradient.addColorStop(1, `rgba(168, 85, 247, ${opacity * other.brightness})`);

            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      // Draw stars on top
      stars.forEach(star => {
        // Twinkling effect
        star.twinkle += 0.05;
        const pulse = Math.sin(star.twinkle) * 0.3 + 0.7;
        const currentBrightness = star.brightness * pulse;

        // Star glow
        const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, 4);
        gradient.addColorStop(0, `rgba(251, 191, 36, ${currentBrightness})`);
        gradient.addColorStop(0.4, `rgba(251, 191, 36, ${currentBrightness * 0.5})`);
        gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');

        ctx.beginPath();
        ctx.arc(star.x, star.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Bright center point
        ctx.beginPath();
        ctx.arc(star.x, star.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentBrightness})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, []);

  // Wireframe Globe Animation
  useEffect(() => {
    const canvas = globeCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 200;
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = 80;

    let rotation = 0;

    const drawWireframeGlobe = () => {
      ctx.clearRect(0, 0, size, size);

      // Draw latitude lines (parallels)
      for (let lat = -80; lat <= 80; lat += 20) {
        ctx.beginPath();
        const latRad = (lat * Math.PI) / 180;
        const r = radius * Math.cos(latRad);
        const y = centerY - radius * Math.sin(latRad);

        for (let lon = 0; lon <= 360; lon += 5) {
          const lonRad = ((lon + rotation) * Math.PI) / 180;
          const x = centerX + r * Math.sin(lonRad);
          const z = r * Math.cos(lonRad);

          // Visibility check (back-face culling)
          if (z > 0) {
            if (lon === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
        }

        const gradient = ctx.createLinearGradient(centerX - radius, y, centerX + radius, y);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
        gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.8)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.3)');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(168, 85, 247, 0.6)';
        ctx.stroke();
      }

      // Draw longitude lines (meridians)
      for (let lon = 0; lon < 360; lon += 20) {
        ctx.beginPath();
        for (let lat = -90; lat <= 90; lat += 5) {
          const latRad = (lat * Math.PI) / 180;
          const lonRad = ((lon + rotation) * Math.PI) / 180;

          const r = radius * Math.cos(latRad);
          const x = centerX + r * Math.sin(lonRad);
          const y = centerY - radius * Math.sin(latRad);
          const z = r * Math.cos(lonRad);

          if (z > 0) {
            if (lat === -90) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
        }

        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, 'rgba(251, 191, 36, 0.8)');
        gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.6)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.3)');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(251, 191, 36, 0.5)';
        ctx.stroke();
      }

      // Draw equator highlight
      ctx.beginPath();
      for (let lon = 0; lon <= 360; lon += 2) {
        const lonRad = ((lon + rotation) * Math.PI) / 180;
        const x = centerX + radius * Math.sin(lonRad);
        const z = radius * Math.cos(lonRad);

        if (z > 0) {
          if (lon === 0) {
            ctx.moveTo(x, centerY);
          } else {
            ctx.lineTo(x, centerY);
          }
        }
      }
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.9)';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(251, 191, 36, 0.8)';
      ctx.stroke();

      rotation += 0.3;
      requestAnimationFrame(drawWireframeGlobe);
    };

    drawWireframeGlobe();
  }, []);

  const channels = [
    { name: 'Углерод', icon: 'C', color: 'from-purple-400 to-purple-600', angle: 0 },
    { name: 'Водород', icon: 'H', color: 'from-blue-400 to-blue-600', angle: 45 },
    { name: 'Кислород', icon: 'O', color: 'from-cyan-400 to-cyan-600', angle: 90 },
    { name: 'Азот', icon: 'N', color: 'from-green-400 to-green-600', angle: 135 },
    { name: 'Фосфор', icon: 'P', color: 'from-yellow-400 to-yellow-600', angle: 180 },
    { name: 'Серебро', icon: 'Ag', color: 'from-gray-300 to-gray-500', angle: 225 },
    { name: 'Золото', icon: 'Au', color: 'from-yellow-300 to-yellow-500', angle: 270 },
    { name: 'ЗОИ', icon: 'Ζ', color: 'from-pink-400 to-purple-600', angle: 315 }
  ];

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0a0a1f]">
      {/* Particle canvas background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
      />

      <div className="relative z-10">
        {/* 3D Hero Section - Earth Protection */}
        <section className="min-h-screen flex items-center justify-center relative px-4 py-20">

          {/* Central Earth with protection field */}
          <div
            className="earth-container"
            style={{
              transform: `perspective(1000px) rotateY(${mousePosition.x * 10}deg) rotateX(${-mousePosition.y * 10}deg)`
            }}
          >
            {/* Protection Shield - Octagon */}
            <div className="protection-shield">
              <div className="shield-ring"></div>
              <div className="shield-ring" style={{animationDelay: '1s'}}></div>
              <div className="shield-ring" style={{animationDelay: '2s'}}></div>
            </div>

            {/* Central Earth */}
            <div className="earth-sphere">
              <div className="earth-glow"></div>
              <div className="earth-surface"></div>

              {/* Logo overlay */}
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <img
                  src="/logo.png"
                  alt="ОКТАВА"
                  className="w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-2xl animate-float-gentle"
                  style={{filter: 'drop-shadow(0 0 40px rgba(255, 215, 0, 0.8))'}}
                />
              </div>
            </div>

            {/* 8 Orbital Channels */}
            {channels.map((channel, i) => (
              <div
                key={i}
                className="orbital-channel"
                style={{
                  '--angle': `${channel.angle}deg`,
                  '--delay': `${i * 0.2}s`
                } as React.CSSProperties}
              >
                <div className={`channel-node bg-gradient-to-br ${channel.color}`}>
                  <div className="text-white font-bold text-xl">{channel.icon}</div>
                  <div className="channel-label">{channel.name}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Hero Text Overlay */}
          <div className="absolute inset-x-0 top-20 text-center z-30 px-4">
            <div className="inline-block px-6 py-3 rounded-full bg-yellow-400/10 border border-yellow-400/30 backdrop-blur-sm mb-6 animate-pulse-slow">
              <span className="text-yellow-300 text-sm sm:text-base font-medium">Терраэнергетика • Защита Земли</span>
            </div>
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black mb-4 leading-none">
              <span className="hero-title">ОКТАВА</span>
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 font-light mb-6">
              Система 108 Энергетических Каналов
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="absolute inset-x-0 bottom-20 flex justify-center gap-4 px-4 z-30 flex-wrap">
            <a
              href="/matrix.html"
              className="premium-button-primary group/btn"
            >
              <span className="relative z-10 flex items-center gap-2">
                Открыть Матрицу
                <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </a>

            <button
              onClick={() => setIsModalOpen(true)}
              className="premium-button-secondary group/btn"
            >
              <span className="relative z-10">Получить Посвящение</span>
            </button>
          </div>
        </section>

        {/* Content Section - Isometric Cards */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

          {/* About Section */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-500 mb-6">
              Уникальная природа энергий
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Энергии духовного источника, адаптированные для земного плана.
              Безопасная интеграция под защитой космических хранителей.
            </p>
          </div>

          {/* Isometric Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">

            <div className="iso-card group">
              <div className="iso-card-inner bg-gradient-to-br from-purple-600/20 to-indigo-600/20">
                <div className="text-5xl mb-4">🌍</div>
                <h3 className="text-2xl font-bold text-yellow-400 mb-3">Терраэнергетика</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Энергии земного происхождения с безопасной структурой.
                  Адаптированы для материального плана.
                </p>
              </div>
            </div>

            <div className="iso-card group">
              <div className="iso-card-inner bg-gradient-to-br from-indigo-600/20 to-blue-600/20">
                <div className="text-5xl mb-4">🕊️</div>
                <h3 className="text-2xl font-bold text-yellow-400 mb-3">Совместимость</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Работают со всеми религиозными эгрегорами и космическими частотами планеты.
                </p>
              </div>
            </div>

            <div className="iso-card group">
              <div className="iso-card-inner bg-gradient-to-br from-blue-600/20 to-cyan-600/20">
                <div className="text-5xl mb-4">⚡</div>
                <h3 className="text-2xl font-bold text-yellow-400 mb-3">108 Каналов</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Связь с элементами Менделеева. Полная матрица для трансформации сознания.
                </p>
              </div>
            </div>

            <div className="iso-card group">
              <div className="iso-card-inner bg-gradient-to-br from-cyan-600/20 to-green-600/20">
                <div className="text-5xl mb-4">🧘</div>
                <h3 className="text-2xl font-bold text-yellow-400 mb-3">Магистры</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Посвящение от трёх Магистров-Прогрессоров космоэнергетики.
                </p>
              </div>
            </div>

            <div className="iso-card group">
              <div className="iso-card-inner bg-gradient-to-br from-green-600/20 to-yellow-600/20">
                <div className="text-5xl mb-4">👥</div>
                <h3 className="text-2xl font-bold text-yellow-400 mb-3">Социум</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Управление эгрегорами, удача в обществе, создание структур.
                </p>
              </div>
            </div>

            <div className="iso-card group">
              <div className="iso-card-inner bg-gradient-to-br from-yellow-600/20 to-orange-600/20">
                <div className="text-5xl mb-4">🛡️</div>
                <h3 className="text-2xl font-bold text-yellow-400 mb-3">Защита</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Энергетическая защита, наполнение жизненной силой и восстановление.
                </p>
              </div>
            </div>

          </div>

          {/* Stats Banner - Crystalline style */}
          <div className="crystal-banner relative p-8 sm:p-12 mb-20 overflow-visible">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-indigo-600/20 to-yellow-500/20 backdrop-blur-xl"></div>
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-8">

              <div className="crystal-stat-card group">
                <div className="crystal-stat-inner">
                  <div className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-yellow-600 mb-3 group-hover:scale-110 transition-transform duration-300">108</div>
                  <div className="text-gray-200 text-lg font-medium">Энергетических каналов</div>
                </div>
              </div>

              <div className="crystal-stat-card group">
                <div className="crystal-stat-inner">
                  <div className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-purple-600 mb-3 group-hover:scale-110 transition-transform duration-300">8</div>
                  <div className="text-gray-200 text-lg font-medium">Основных элементов</div>
                </div>
              </div>

              <div className="crystal-stat-card group">
                <div className="crystal-stat-inner">
                  <div className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-indigo-600 mb-3 group-hover:scale-110 transition-transform duration-300">∞</div>
                  <div className="text-gray-200 text-lg font-medium">Возможностей развития</div>
                </div>
              </div>

            </div>
          </div>

          {/* 3D Channel Carousel */}
          <div className="mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-500 mb-4 text-center">
              Примеры Энергетических Каналов
            </h2>
            <p className="text-gray-300 text-center mb-12 max-w-2xl mx-auto">
              Каждый канал связан с элементом таблицы Менделеева и имеет уникальные свойства
            </p>

            <div className="carousel-container">
              <div className="carousel-track">
                {/* Wireframe Earth Globe in center */}
                <div className="carousel-earth">
                  <canvas
                    ref={globeCanvasRef}
                    className="wireframe-globe"
                  />
                </div>

                {randomChannels.map((channel, index) => {
                  const categoryMap = {
                    master: 'master-card',
                    base: 'base-card',
                    special: 'special-card',
                    rare: 'rare-card'
                  };
                  const cardClass = categoryMap[channel.category];

                  const categoryLabel = {
                    master: 'Мастер-канал',
                    base: 'Базовый канал',
                    special: 'Специальный канал',
                    rare: 'Редкий канал'
                  };

                  return (
                    <div key={index} className={`carousel-card ${cardClass}`}>
                      <div className="card-element">{channel.element}</div>
                      <h3 className="card-title">{channel.name}</h3>
                      <div className="card-subtitle">{categoryLabel[channel.category]}</div>
                      <p className="card-description">{channel.description}</p>
                      <div className="card-tags">
                        {channel.tags.slice(0, 2).map((tag, i) => (
                          <span key={i} className="tag-badge">{tag}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-center mt-12">
              <a
                href="/matrix.html"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-purple-500/50 hover:scale-105"
              >
                Открыть полную матрицу 108 каналов
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          </div>

          {/* Timeline - История развития */}
          <div className="mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-500 mb-12 text-center">
              История Системы ОКТАВА
            </h2>

            <div className="timeline">
              <div className="timeline-item" data-index="1">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <div className="timeline-year">2020</div>
                  <h3 className="timeline-title">Открытие Системы</h3>
                  <p className="timeline-description">
                    Магистры-Прогрессоры получили доступ к древним знаниям о 108 энергетических каналах,
                    связанных с таблицей Менделеева
                  </p>
                </div>
              </div>

              <div className="timeline-item" data-index="2">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <div className="timeline-year">2021</div>
                  <h3 className="timeline-title">Первые Посвящения</h3>
                  <p className="timeline-description">
                    Начало передачи посвящений ученикам. Формирование базовых протоколов работы с энергиями
                  </p>
                </div>
              </div>

              <div className="timeline-item" data-index="3">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <div className="timeline-year">2023</div>
                  <h3 className="timeline-title">Расширение Практики</h3>
                  <p className="timeline-description">
                    Интеграция системы ОКТАВА с традиционными эгрегорами. Открытие новых применений каналов
                  </p>
                </div>
              </div>

              <div className="timeline-item" data-index="4">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <div className="timeline-year">2025</div>
                  <h3 className="timeline-title">Эпоха Терраэнергетики</h3>
                  <p className="timeline-description">
                    Система ОКТАВА становится доступна широкому кругу практиков. Начало новой эры духовного развития
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonials Slider */}
          <div className="mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-500 mb-12 text-center">
              Отзывы Практиков
            </h2>

            <div className="testimonials-slider">
              <div className="testimonial-card">
                <div className="testimonial-quote">"</div>
                <p className="testimonial-text">
                  После посвящения в систему ОКТАВА моя жизнь изменилась кардинально. Каналы Золота и Серебра
                  помогли мне выйти на новый уровень материального благополучия, а канал ЗОИ дал понимание
                  вечной природы души.
                </p>
                <div className="testimonial-author">
                  <div className="testimonial-name">Елена М.</div>
                  <div className="testimonial-role">Практик 2 года</div>
                </div>
              </div>

              <div className="testimonial-card">
                <div className="testimonial-quote">"</div>
                <p className="testimonial-text">
                  Как целитель с 15-летним стажем, я работал со многими системами. ОКТАВА превзошла все
                  ожидания - связь с элементами даёт невероятную точность и глубину работы с клиентами.
                </p>
                <div className="testimonial-author">
                  <div className="testimonial-name">Дмитрий К.</div>
                  <div className="testimonial-role">Мастер-целитель</div>
                </div>
              </div>

              <div className="testimonial-card">
                <div className="testimonial-quote">"</div>
                <p className="testimonial-text">
                  Магистры системы ОКТАВА - настоящие профессионалы. Передача посвящения была мощной и
                  безопасной. Чувствую постоянную поддержку и защиту космических хранителей.
                </p>
                <div className="testimonial-author">
                  <div className="testimonial-name">Анна С.</div>
                  <div className="testimonial-role">Ученица 1-го блока</div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-500 mb-12 text-center">
              Частые Вопросы
            </h2>

            <div className="faq-accordion max-w-3xl mx-auto">
              <details className="faq-item">
                <summary className="faq-question">
                  Что такое система ОКТАВА?
                  <svg className="faq-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="faq-answer">
                  ОКТАВА - это уникальная терраэнергетическая система из 108 энергетических каналов,
                  связанных с элементами таблицы Менделеева. Система была открыта Магистрами-Прогрессорами
                  космоэнергетики и адаптирована специально для материального плана Земли.
                </div>
              </details>

              <details className="faq-item">
                <summary className="faq-question">
                  Как получить посвящение?
                  <svg className="faq-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="faq-answer">
                  Посвящение передаётся тремя Магистрами-Прогрессорами космоэнергетики. Для получения
                  посвящения необходимо заполнить форму на сайте, после чего с вами свяжется Магистр
                  для согласования времени и условий передачи.
                </div>
              </details>

              <details className="faq-item">
                <summary className="faq-question">
                  Безопасна ли система ОКТАВА?
                  <svg className="faq-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="faq-answer">
                  Да, система полностью безопасна. Энергии ОКТАВА имеют земное происхождение и работают
                  под защитой космических хранителей. Система совместима со всеми религиозными эгрегорами
                  и не конфликтует с другими духовными практиками.
                </div>
              </details>

              <details className="faq-item">
                <summary className="faq-question">
                  Можно ли совмещать ОКТАВА с другими системами?
                  <svg className="faq-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="faq-answer">
                  Да, система ОКТАВА прекрасно дополняет другие энергетические практики. Многие практики
                  успешно сочетают ОКТАВА с Рейки, космоэнергетикой, цигун и другими методами.
                </div>
              </details>

              <details className="faq-item">
                <summary className="faq-question">
                  Сколько времени занимает обучение?
                  <svg className="faq-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="faq-answer">
                  Обучение проходит в индивидуальном темпе. Базовое посвящение занимает один сеанс,
                  после чего начинается период интеграции энергий (21 день). Полное освоение системы
                  может занять от нескольких месяцев до года, в зависимости от вашей практики.
                </div>
              </details>
            </div>
          </div>

          {/* Warning */}
          <div className="text-center p-6 rounded-2xl bg-purple-900/30 border border-purple-500/30 backdrop-blur-sm">
            <p className="text-gray-300">
              ⚠️ <strong className="text-yellow-400">Важно:</strong> Система ОКТАВА — инструмент развития, а не магическая палочка.
              Работайте честно, этично, с пониманием ответственности.
            </p>
          </div>

        </section>
      </div>

      <ContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </main>
  );
}
