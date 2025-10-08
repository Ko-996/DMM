"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, ArrowLeft, UserPlus } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useBeneficiarias } from "@/hooks/useBeneficiarias"
import { useSectores } from "@/hooks/useSectores"

export default function NuevaBeneficiariaPage() {
  const router = useRouter()
  const { createBeneficiaria } = useBeneficiarias()
  const { sectores, loading: sectoresLoading } = useSectores()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    nombre: "",
    dpi: "",
    edad: "",
    fechaNacimiento: "",
    direccion: "",
    sector: "",
    telefono: "",
    email: "",
    habitantes: "",
    terreno: "",
    documentoImagenFrente: null as File | null,
    documentoImagenReverso: null as File | null,
  })
  const [imagePreviewFrente, setImagePreviewFrente] = useState<string | null>(null)
  const [imagePreviewReverso, setImagePreviewReverso] = useState<string | null>(null)

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value

    // Validaciones por campo
    switch (field) {
      case "nombre":
        processedValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "")
        break
      case "dpi":
        processedValue = value.replace(/[^0-9]/g, "").slice(0, 13)
        break
      case "telefono":
        processedValue = value.replace(/[^0-9-]/g, "")
        break
      case "edad":
      case "habitantes":
        processedValue = value.replace(/[^0-9]/g, "")
        break
    }

    setFormData((prev) => ({
      ...prev,
      [field]: processedValue,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, tipo: "frente" | "reverso") => {
    const file = e.target.files?.[0] || null

    // Validar tamaño del archivo (máximo 10MB)
    if (file && file.size > 10 * 1024 * 1024) {
      toast.error('El archivo es muy grande. Máximo 10MB permitido.')
      return
    }

    // Validar tipo de archivo
    if (file && !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG y WEBP.')
      return
    }

    if (tipo === "frente") {
      setFormData((prev) => ({
        ...prev,
        documentoImagenFrente: file,
      }))

      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setImagePreviewFrente(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setImagePreviewFrente(null)
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        documentoImagenReverso: file,
      }))

      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setImagePreviewReverso(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setImagePreviewReverso(null)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const loadingToast = toast.loading("Registrando beneficiaria...", {
      description: "Por favor espere mientras se procesa el registro",
    })

    try {
      // Validar campos requeridos
      if (!formData.nombre || !formData.dpi || !formData.edad || !formData.fechaNacimiento || 
          !formData.direccion || !formData.sector || !formData.telefono || !formData.habitantes) {
        toast.dismiss(loadingToast)
        toast.error('Por favor complete todos los campos requeridos')
        setIsLoading(false)
        return
      }

      // Validar que se hayan subido ambas imágenes
      if (!formData.documentoImagenFrente || !formData.documentoImagenReverso) {
        toast.dismiss(loadingToast)
        toast.error('Por favor suba ambas imágenes del DPI (frente y reverso)')
        setIsLoading(false)
        return
      }

      // Encontrar el ID del sector seleccionado
      const sectorSeleccionado = sectores.find(s => s.sector === formData.sector)
      if (!sectorSeleccionado) {
        toast.dismiss(loadingToast)
        toast.error('Sector seleccionado no válido')
        setIsLoading(false)
        return
      }

      // Preparar datos de la beneficiaria (sin las imágenes)
      const beneficiariaData = {
        nombre: formData.nombre.trim(),
        dpi: formData.dpi.trim(),
        edad: parseInt(formData.edad),
        fecha_nacimiento: formData.fechaNacimiento,
        direccion: formData.direccion.trim(),
        id_sector: sectorSeleccionado.id_sector,
        telefono: formData.telefono.trim(),
        correo: formData.email?.trim() || '',
        habitantes_domicilio: parseInt(formData.habitantes),
        inmuebles: formData.terreno?.trim() || '',
        estado: 'A' as const,
      }

      // Preparar imágenes separadas
      const images = {
        dpi_frente: formData.documentoImagenFrente,
        dpi_reverso: formData.documentoImagenReverso,
      }

      /*console.log('Datos a enviar:', beneficiariaData)
      console.log('Imágenes a enviar:', {
        frente: images.dpi_frente?.name,
        reverso: images.dpi_reverso?.name
      })*/

      // Llamar a la API con datos e imágenes
      const success = await createBeneficiaria(beneficiariaData, images)
      
      if (success) {
        toast.dismiss(loadingToast)
        
        toast.success("Beneficiaria registrada exitosamente", {
          description: `${formData.nombre} ha sido agregada al sistema`,
          icon: <UserPlus className="h-4 w-4" />,
          duration: 4000,
        })

        setTimeout(() => {
          router.push("/beneficiarias")
        }, 1500)
      } else {
        toast.dismiss(loadingToast)
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error('Error al registrar beneficiaria:', error)
      toast.error('Error inesperado al registrar beneficiaria')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/beneficiarias")
  }

  return (
    <ProtectedRoute allowedRoles={["Directora", "Administrador", "Tecnica"]}>
      <div className="min-h-screen">
        <Navbar />

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/beneficiarias"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a Beneficiarias
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Registrar Nueva Beneficiaria</h1>
          <p className="mt-2 text-gray-600">
            Complete todos los campos requeridos para registrar una nueva beneficiaria
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Información Personal */}
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Datos básicos de identificación de la beneficiaria</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre Completo *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => handleInputChange("nombre", e.target.value)}
                      placeholder="Ingrese el nombre completo"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dpi">Número de DPI *</Label>
                    <Input
                      id="dpi"
                      value={formData.dpi}
                      onChange={(e) => handleInputChange("dpi", e.target.value)}
                      placeholder="0000000000000"
                      maxLength={13}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edad">Edad *</Label>
                    <Input
                      id="edad"
                      type="number"
                      value={formData.edad}
                      onChange={(e) => handleInputChange("edad", e.target.value)}
                      placeholder="Edad en años"
                      min="18"
                      max="100"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fechaNacimiento">Fecha de Nacimiento *</Label>
                    <Input
                      id="fechaNacimiento"
                      type="date"
                      value={formData.fechaNacimiento}
                      onChange={(e) => handleInputChange("fechaNacimiento", e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Imágenes del DPI - Frente y Reverso */}
                <div className="space-y-4">
                  <Label>Imágenes del Documento de Identificación *</Label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* DPI Frente */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">DPI - Frente *</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                        {imagePreviewFrente ? (
                          <div className="space-y-3">
                            <img
                              src={imagePreviewFrente}
                              alt="Vista previa del DPI - Frente"
                              className="mx-auto max-w-full h-32 object-contain rounded-lg border"
                            />
                            <div>
                              <label htmlFor="documentoImagenFrente" className="cursor-pointer">
                                <span className="text-xs font-medium text-blue-600 hover:text-blue-700">
                                  Cambiar imagen
                                </span>
                              </label>
                              <input
                                id="documentoImagenFrente"
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={(e) => handleFileChange(e, "frente")}
                              />
                            </div>
                            <p className="text-xs text-green-600">{formData.documentoImagenFrente?.name}</p>
                          </div>
                        ) : (
                          <div>
                            <Upload className="mx-auto h-8 w-8 text-gray-400" />
                            <div className="mt-2">
                              <label htmlFor="documentoImagenFrente" className="cursor-pointer">
                                <span className="text-xs font-medium text-gray-900">Subir frente del DPI</span>
                                <span className="block text-xs text-gray-500">PNG, JPG, WEBP hasta 10MB</span>
                              </label>
                              <input
                                id="documentoImagenFrente"
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={(e) => handleFileChange(e, "frente")}
                                required
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DPI Reverso */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">DPI - Reverso *</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                        {imagePreviewReverso ? (
                          <div className="space-y-3">
                            <img
                              src={imagePreviewReverso}
                              alt="Vista previa del DPI - Reverso"
                              className="mx-auto max-w-full h-32 object-contain rounded-lg border"
                            />
                            <div>
                              <label htmlFor="documentoImagenReverso" className="cursor-pointer">
                                <span className="text-xs font-medium text-blue-600 hover:text-blue-700">
                                  Cambiar imagen
                                </span>
                              </label>
                              <input
                                id="documentoImagenReverso"
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={(e) => handleFileChange(e, "reverso")}
                              />
                            </div>
                            <p className="text-xs text-green-600">{formData.documentoImagenReverso?.name}</p>
                          </div>
                        ) : (
                          <div>
                            <Upload className="mx-auto h-8 w-8 text-gray-400" />
                            <div className="mt-2">
                              <label htmlFor="documentoImagenReverso" className="cursor-pointer">
                                <span className="text-xs font-medium text-gray-900">Subir reverso del DPI</span>
                                <span className="block text-xs text-gray-500">PNG, JPG, WEBP hasta 10MB</span>
                              </label>
                              <input
                                id="documentoImagenReverso"
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={(e) => handleFileChange(e, "reverso")}
                                required
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información de Contacto */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Contacto</CardTitle>
                <CardDescription>Datos de ubicación y contacto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección Completa *</Label>
                  <Textarea
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => handleInputChange("direccion", e.target.value)}
                    placeholder="Ingrese la dirección completa"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sector">Sector *</Label>
                    <Select 
                      onValueChange={(value) => handleInputChange("sector", value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={sectoresLoading ? "Cargando sectores..." : "Seleccione el sector"} />
                      </SelectTrigger>
                      <SelectContent>
                        {sectores.length > 0 ? (
                          sectores.map((sector, index) => (
                            <SelectItem key={`sector-${sector.id_sector}-${index}`} value={sector.sector}>
                              {sector.sector}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-sectores" disabled>
                            No hay sectores disponibles
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono *</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => handleInputChange("telefono", e.target.value)}
                      placeholder="0000-0000"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Información Socioeconómica */}
            <Card>
              <CardHeader>
                <CardTitle>Información Socioeconómica</CardTitle>
                <CardDescription>Datos sobre la situación familiar y económica</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="habitantes">Cantidad de Habitantes en la Vivienda *</Label>
                    <Input
                      id="habitantes"
                      type="number"
                      value={formData.habitantes}
                      onChange={(e) => handleInputChange("habitantes", e.target.value)}
                      placeholder="Número de personas"
                      min="1"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="terreno">Inmuebles (Cuerdas de Terreno)</Label>
                    <Input
                      id="terreno"
                      value={formData.terreno}
                      onChange={(e) => handleInputChange("terreno", e.target.value)}
                      placeholder="Ej: 2.5 cuerdas"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-center gap-4 mt-8 pb-8">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="px-8 border-gray-300 bg-white"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="px-8">
              {isLoading ? "Registrando..." : "Registrar Beneficiaria"}
            </Button>
          </div>
        </form>
      </main>

      <footer className="bg-gray-800 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 Dirección Municipal de la Mujer de Salcajá. Todos los derechos reservados.</p>
    
          <div className="flex items-center justify-center mt-2 space-x-2">
            <img
              src="/images/logoUMG.jpg"
              alt="Logo Dirección Municipal de Mujeres de Salcajá"
              className="h-8 w-8 rounded-full object-cover shadow-lg"
            />
            <span >UMG</span>
          </div>
        </div>
      </footer>
      </div>
    </ProtectedRoute>
  )
}