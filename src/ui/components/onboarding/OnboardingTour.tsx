
"use client";

import { useEffect, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_STORAGE_KEY = "zeta_prop_onboarding_views";
const MAX_VIEWS = 3;

export default function OnboardingTour() {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        if (!hasMounted) return;

        // Check view count
        const views = parseInt(localStorage.getItem(TOUR_STORAGE_KEY) || "0", 10);
        if (views >= MAX_VIEWS) return;

        // Give a small delay for UI to render completely
        const timer = setTimeout(() => {
            startTour(views);
        }, 1500);

        return () => clearTimeout(timer);
    }, [hasMounted]);

    const startTour = (currentViews: number) => {
        const driverObj = driver({
            showProgress: true,
            animate: true,
            doneBtnText: "Entendido",
            nextBtnText: "Siguiente",
            prevBtnText: "Atrás",
            progressText: "Paso {{current}} de {{total}}",
            steps: [
                {
                    popover: {
                        title: "¡Bienvenido a Zeta Prop! 🚀",
                        description: "Te guiaremos rápidamente por los módulos principales para que saques el máximo provecho a la plataforma."
                    }
                },
                {
                    element: "#nav-item-propiedades",
                    popover: {
                        title: "Propiedades",
                        description: "Aquí es donde cargas y gestionas todo tu inventario. Podrás agregar nuevas propiedades, editarlas y compartirlas.",
                        side: "right",
                        align: "center"
                    }
                },
                {
                    element: "#nav-item-alquileres",
                    popover: {
                        title: "Alquileres",
                        description: "Administra contratos, vencimientos y actualizaciones de tus alquileres activos.",
                        side: "right",
                        align: "center"
                    }
                },
                {
                    element: "#nav-item-finanzas",
                    popover: {
                        title: "Finanzas",
                        description: "Lleva el control de ingresos, egresos y comisiones de tu inmobiliaria.",
                        side: "right",
                        align: "center"
                    }
                },
                {
                    element: "#nav-item-soporte",
                    popover: {
                        title: "Soporte",
                        description: "¿Necesitás ayuda? Acá podrás crear tickets de soporte y ver el estado de tus consultas.",
                        side: "right",
                        align: "center"
                    }
                },
                {
                    element: "#nav-item-novedades-zeta",
                    popover: {
                        title: "Novedades",
                        description: "Enterate de las últimas actualizaciones y mejoras que agregamos a Zeta Prop.",
                        side: "right",
                        align: "center"
                    }
                }
            ],
            onDestroyStarted: () => {
                // Determine if we should count this as a view
                // For simplicity, we count every initiation as a view, or maybe on completion?
                // Request says "aparezca ... hasta 3 veces". Assuming seeing it counts.
                // We'll increment here to ensure even if they skip, it counts.
                const newCount = currentViews + 1;
                localStorage.setItem(TOUR_STORAGE_KEY, newCount.toString());
                driverObj.destroy();
            }
        });

        driverObj.drive();
    };

    return null; // Logic only component
}
