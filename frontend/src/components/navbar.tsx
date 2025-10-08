"use client"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, BarChart3, FolderOpen, Users, UserPlus, LogOut, Shield, GraduationCap } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { usePermissions } from "@/hooks/usePermissions"
import { useEffect, useState } from "react"

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { 
    canAccessDashboard, 
    canAccessProyectos, 
    canAccessCapacitaciones, 
    canAccessBeneficiarias 
  } = usePermissions()

  // Debug logging temporal
  //console.log('Navbar - Usuario:', user)
  /*console.log('Navbar - Permisos:', {
    canAccessDashboard: canAccessDashboard(),
    canAccessProyectos: canAccessProyectos(),
    canAccessCapacitaciones: canAccessCapacitaciones(),
    canAccessBeneficiarias: canAccessBeneficiarias()
  })*/

  const handleLogout = async () => {
    await logout()
  }

  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart3, canAccess: canAccessDashboard() },
    { href: "/proyectos", label: "Proyectos", icon: FolderOpen, canAccess: canAccessProyectos() },
    { href: "/capacitaciones", label: "Capacitaciones", icon: GraduationCap, canAccess: canAccessCapacitaciones() },
    { href: "/beneficiarias", label: "Beneficiarias", icon: Users, canAccess: canAccessBeneficiarias() },
    { href: "/beneficiarias/nueva", label: "Registrar Beneficiaria", icon: UserPlus, canAccess: canAccessBeneficiarias() },
  ]

  // Filtrar elementos según los permisos del usuario
  const visibleMenuItems = menuItems.filter((item) => item.canAccess)
  
  //console.log('Navbar - Elementos del menú:', menuItems)
  //console.log('Navbar - Elementos visibles:', visibleMenuItems)

  return (
    <div className="relative mb-6">
      <div className="relative h-32">
        {/* Background image with wavy bottom */}
        <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
        style={{ 
          backgroundImage: "url('/images/image.jpg')", 
          backgroundSize: "100% 400px",
          backgroundPosition: "100% 60%",
          height: "140px",//144
          clipPath: "polygon(0 0, 100% 0, 100% 75%, 98% 78%, 96% 82%, 94% 85%, 92% 87%, 90% 89%, 87% 90%, 84% 91%, 81% 91%, 78% 90%, 75% 88%, 72% 85%, 69% 82%, 66% 78%, 63% 75%, 60% 73%, 57% 72%, 54% 72%, 51% 73%, 48% 75%, 45% 78%, 42% 82%, 39% 85%, 36% 88%, 33% 90%, 30% 91%, 27% 91%, 24% 90%, 21% 89%, 18% 87%, 15% 85%, 12% 82%, 9% 78%, 6% 75%, 3% 72%, 0 70%)"
        }}
      >
        <div className="absolute inset-0"></div>
      </div>
      
    
      {/* First border - Transparent/Semi-transparent */}
        
      <div 
        className="absolute w-full" 
        style={{ 
          top: "0px",
          height: "154px",
          background: "rgba(255,255,255,0.1)",
          clipPath: "polygon(0 0, 100% 0, 100% 77%, 98% 80%, 96% 84%, 94% 87%, 92% 89%, 90% 91%, 87% 92%, 84% 93%, 81% 93%, 78% 92%, 75% 90%, 72% 87%, 69% 84%, 66% 80%, 63% 77%, 60% 75%, 57% 74%, 54% 74%, 51% 75%, 48% 77%, 45% 80%, 42% 84%, 39% 87%, 36% 90%, 33% 92%, 30% 93%, 27% 93%, 24% 92%, 21% 91%, 18% 89%, 15% 87%, 12% 84%, 9% 80%, 6% 77%, 3% 74%, 0 72%)"
        }}
      ></div>
      
      <div 
        className="absolute w-full" 
        style={{ 
          top: "0px",
          height: "164px",
          background: "rgba(59, 130, 246, 0.1)", // blue-500 with opacity
          clipPath: "polygon(0 0, 100% 0, 100% 78%, 98% 81%, 96% 85%, 94% 88%, 92% 90%, 90% 92%, 87% 93%, 84% 94%, 81% 94%, 78% 93%, 75% 91%, 72% 88%, 69% 85%, 66% 81%, 63% 78%, 60% 76%, 57% 75%, 54% 75%, 51% 76%, 48% 78%, 45% 81%, 42% 85%, 39% 88%, 36% 91%, 33% 93%, 30% 94%, 27% 94%, 24% 93%, 21% 92%, 18% 90%, 15% 88%, 12% 85%, 9% 81%, 6% 78%, 3% 75%, 0 73%)"
        }}
      ></div>

        {/* Navbar content */}
        <nav className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Link href="/dashboard" className="flex-shrink-0">
                  <h1 className="text-xl items-center font-bold text-white drop-shadow-lg">
                    Dirección Municipal de la Mujer<br/>de Salcajá
                  </h1>
                </Link>
              </div>

              <div className="flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 backdrop-blur-sm">
                      <Menu className="h-5 w-5" strokeWidth={5}/>
                      <span className="sr-only">Abrir menú</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {visibleMenuItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link
                            href={item.href}
                            className={`flex items-center gap-2 ${pathname === item.href ? "bg-gray-100" : ""}`}
                          >
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      )
                    })}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </div>
  )
}
