"use client";
import { loginWithGoogle, loginEmail } from "@/infrastructure/auth/firebaseAuthService";
import { useState } from "react";


export default function LoginPage() {
const [email, setEmail] = useState("");
const [pass, setPass] = useState("");


return (
<div className="max-w-md mx-auto py-20">
<h1 className="text-3xl font-bold mb-6">Iniciar sesión</h1>


<button
onClick={loginWithGoogle}
className="w-full py-3 bg-black text-white rounded-xl mb-6"
>
Iniciar con Google
</button>


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
onClick={() => loginEmail(email, pass)}
className="w-full py-3 bg-gray-900 text-white rounded-xl"
>
Entrar
</button>
</div>
);
}