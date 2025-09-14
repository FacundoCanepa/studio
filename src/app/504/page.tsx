// [504]
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function TimeoutPage() {
  const [seconds, setSeconds] = useState(10);
  const router = useRouter();

  useEffect(() => {
    const t = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (seconds === 0) router.refresh();
  }, [seconds, router]);

  return (
    <main className="relative min-h-screen bg-white text-gray-900">
      {/* fondo sutil */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background:radial-gradient(circle_at_1px_1px,#000_1px,transparent_1px)] [background-size:12px_12px]" />

      <section className="container mx-auto max-w-screen-lg px-6 py-24 md:py-32 text-center">
        <motion.h1
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-5xl md:text-6xl font-extrabold tracking-tight"
        >
          Conexión lenta o tiempo agotado
        </motion.h1>

        <motion.p
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mt-5 text-gray-600 max-w-2xl mx-auto"
        >
          No pudimos cargar el contenido a tiempo. Reintentamos en{" "}
          <span className="font-semibold text-gray-900">{seconds}s</span>.
        </motion.p>

        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mt-8"
        >
          <button
            onClick={() => router.refresh()}
            className="rounded-2xl bg-black text-white px-6 py-3 font-medium shadow-[0_10px_30px_-10px_rgba(0,0,0,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black transition"
            aria-label="Reintentar"
          >
            Reintentar ahora
          </button>
        </motion.div>

        {/* barra de progreso */}
        <div className="mx-auto mt-8 h-2 w-full max-w-md overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-gray-900 transition-[width] duration-1000 ease-linear"
            style={{ width: `${((10 - seconds) / 10) * 100}%` }}
            aria-hidden
          />
        </div>
      </section>

      {/* Marquee inferior */}
      <div className="absolute bottom-0 w-full overflow-hidden border-t border-black/10 bg-white/70 backdrop-blur">
        <div className="animate-[marquee_18s_linear_infinite] whitespace-nowrap py-3 text-sm text-gray-700">
          <span className="mx-8">Optimizando la carga…</span>
          <span className="mx-8">Reintentando recursos…</span>
          <span className="mx-8">Mejorando tu experiencia…</span>
          <span className="mx-8">Vestigio — performance first</span>
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
