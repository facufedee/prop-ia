import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { adminDb } from "../src/infrastructure/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

async function seed() {
  try {
    const email = "inmobiliariadeprueba1@gmail.com";
    
    // Find the user by email in Firestore
    const userSnapshot = await adminDb.collection("users").where("email", "==", email).get();
    
    let userId;
    
    if (userSnapshot.empty) {
      console.log(`Usuario no encontrado en Firestore con email ${email}. Creando un documento de usuario falso para la prueba...`);
      // Create a fake user doc if not found just to tie properties to it
      const newUserRef = await adminDb.collection("users").add({
        email: email,
        displayName: "Inmobiliaria Prueba",
        role: "inmobiliaria",
        subscription: "pro",
        createdAt: FieldValue.serverTimestamp()
      });
      userId = newUserRef.id;
      console.log("Usuario falso creado, UID:", userId);
    } else {
      userId = userSnapshot.docs[0].id;
      console.log("Usuario encontrado en Firestore, UID:", userId);
    }
    
    const types = ["Casa", "Departamento", "PH", "Lote", "Local", "Oficina"];
    const cities = ["Palermo, CABA", "Belgrano, CABA", "Morón, Buenos Aires", "Castelar, Buenos Aires", "Rosario, Santa Fe", "Córdoba, Córdoba"];
    
    let count = 0;
    for (let i = 0; i < 24; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const doc = {
        userId: userId,
        title: `${type} en venta/alquiler - Oportunidad #${i+1}`,
        description: `Excelente ${type.toLowerCase()} con inmejorable ubicación. Ideal inversión. Amplio y luminoso.`,
        property_type: type,
        type: Math.random() > 0.5 ? "Venta" : "Alquiler",
        price: Math.floor(Math.random() * 200000) + 50000,
        currency: "USD",
        address: `Calle Falsa ${100 + i}`,
        city: cities[Math.floor(Math.random() * cities.length)],
        status: "active",
        rooms: Math.floor(Math.random() * 5) + 1,
        bathrooms: Math.floor(Math.random() * 3) + 1,
        squareMeters: Math.floor(Math.random() * 200) + 30,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };
      
      await adminDb.collection("properties").add(doc);
      count++;
    }
    
    console.log(`¡Éxito! Se cargaron ${count} propiedades activas de prueba para el usuario ${email}. UID usado: ${userId}`);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

seed();
