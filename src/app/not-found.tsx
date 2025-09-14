// [404]
"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import Image from "next/image";

export default function NotFound() {
  const [mx, setMx] = useState(0);
  const [my, setMy] = useState(0);

  // Efecto "magnet" suave sobre el botón
  function onMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    setMx(x * 0.12);
    setMy(y * 0.12);
  }

  return (
    <main
      role="main"
      className="relative min-h-screen overflow-hidden bg-[#F5F5DC] text-gray-900"
    >
      {/* Fondo ruido sutil */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-multiply [background:radial-gradient(circle_at_1px_1px,#000_1px,transparent_1px)] [background-size:10px_10px]" />

      <section className="container mx-auto max-w-screen-xl px-6 py-24 md:py-32">
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-[18vw] leading-none font-extrabold tracking-tight md:text-[12vw] lg:text-[10vw] text-[#6B8E23] select-none"
          aria-label="404"
        >
          404
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-6 max-w-2xl text-lg md:text-xl text-gray-700"
        >
          Esta página se perdió en el vestigio. Probá volver al inicio o
          explorá nuestras notas, tips y looks.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-10"
        >
          <Link
            href="/"
            onMouseMove={onMouseMove}
            onMouseLeave={() => {
              setMx(0);
              setMy(0);
            }}
            className="relative inline-flex items-center justify-center rounded-2xl bg-[#6B8E23] px-7 py-3 text-white font-medium shadow-[0_10px_30px_-10px_rgba(107,142,35,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B8E23] transition-[transform,box-shadow]"
            style={{
              transform: `translate3d(${mx}px, ${my}px, 0)`,
            }}
            aria-label="Volver al inicio"
          >
            Volver al inicio
          </Link>
        </motion.div>

        {/* Frase “editorial” animada al estilo hero uxmachina */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.8 }}
          className="mt-16 border-t border-black/10 pt-8"
        >
          <p className="text-sm uppercase tracking-[.2em] text-gray-600">
            Minimalismo • Moda • Mentalidad
          </p>
        </motion.div>
      </section>

      {/* Marquee suave en el borde inferior */}
      <div className="absolute bottom-0 w-full overflow-hidden border-t border-black/10 bg-white/60 backdrop-blur">
        <div className="animate-[marquee_20s_linear_infinite] whitespace-nowrap py-3 text-sm text-gray-700">
          <span className="mx-8">
            Estilo que perdura
          </span>
          <span className="mx-8">Vestir bien empieza por cuidarte</span>
          <span className="mx-8">
             Vestigio — edición diaria
          </span>
          <span className="mx-8">Descubrí combinaciones y guías</span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </main>
  );
}
