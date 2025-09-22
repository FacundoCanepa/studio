
"use client";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import Link from "next/link";
import { Cookie } from "lucide-react";

declare global {
  interface Window { dataLayer: any[]; gtag: (...args:any[])=>void }
}

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("consentAccepted");
    if (!accepted) {
        setTimeout(() => setShow(true), 2000);
    }
  }, []);

  const consent = (ad_storage: "granted" | "denied") => {
    const analytics_storage = 'granted'; // Siempre permitimos analytics por ahora
    // @ts-ignore
    window.gtag?.('consent', 'update', { ad_storage, analytics_storage });
    localStorage.setItem("consentAccepted", ad_storage === "granted" ? "1" : "0");
    setShow(false);
  };

  if (!show) return null;

  return (
     <div className="fixed bottom-0 right-0 z-50 p-4 sm:p-6 w-full sm:max-w-md">
      <Card className="shadow-2xl">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Cookie className="h-5 w-5"/> Tu Privacidad</CardTitle>
            <CardDescription>
                Usamos cookies para mejorar la experiencia y mostrar anuncios relevantes. Puedes aceptar todo o solo lo esencial.
                Lee nuestra <Link href="/politica-de-privacidad" className="underline">Política de Privacidad</Link>.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 w-full">
            <Button
              onClick={() => consent("denied")}
              variant="secondary"
              className="flex-1"
            >
              Solo esenciales
            </Button>
            <Button
              onClick={() => consent("granted")}
              className="flex-1"
            >
              Aceptar todo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
