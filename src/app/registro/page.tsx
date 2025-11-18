"use client";
import { registerEmail } from "@/infrastructure/auth/firebaseAuthService";
import { useState } from "react";


export default function RegistroPage() {
const [email, setEmail] = useState("");
const [pass, setPass] = useState("");


return (
<div className="max-w-md mx-auto py-20">
<h1 className="text-3xl font-bold mb-6">Crear cuenta</h1>


<input
className="border p-2 w-full mb-3"
placeholder="Email"
value={email}
onChange={(e) => setEmail(e.target.value)}
/>
<input
type="password"
className="border p-2 w-full mb-6"
placeholder="Contraseña"
value={pass}
onChange={(e) => setPass(e.target.value)}
/>


<button
onClick={() => registerEmail(email, pass)}
className="w-full py-3 bg-black text-white rounded-xl"
>
Registrarme
</button>
</div>
);
}