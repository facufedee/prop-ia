import { User } from "lucide-react";


export default function DashboardNavbar() {
return (
<header className="w-full h-16 bg-white border-b shadow-sm flex items-center justify-end px-6">
<div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition">
<User className="w-5 h-5 text-gray-700" />
<span className="text-gray-800 font-medium">Usuario</span>
</div>
</header>
);
}