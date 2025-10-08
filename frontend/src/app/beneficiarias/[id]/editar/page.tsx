"use client"

import type React from "react"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useBeneficiarias } from "@/hooks/useBeneficiarias"
import { useSectores } from "@/hooks/useSectores"
import { Beneficiaria } from "@/lib/api"

export default function EditarBeneficiariaPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { getBeneficiaria, updateBeneficiaria } = useBeneficiarias()
  const { sectores, loading: sectoresLoading, error: sectoresError } = useSectores()
  const [isLoading, setIsLoading] = useState(false)
  const [beneficiaria, setBeneficiaria] = useState<Beneficiaria | null>(null)
  const [loading, setLoading] = useState(true)
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
    estado: "activa" as "activa" | "inactiva",
    documentoImagenFrente: null as File | null,
    documentoImagenReverso: null as File | null,
  })
  const [imagePreviewFrente, setImagePreviewFrente] = useState<string | null>(null)
  const [imagePreviewReverso, setImagePreviewReverso] = useState<string | null>(null)

  const { id } = use(params)

  // Cargar datos de la beneficiaria al montar el componente
  useEffect(() => {
    let isMounted = true

    const loadBeneficiaria = async () => {
      try {
        setLoading(true)
        const beneficiariaData = await getBeneficiaria(parseInt(id))
        
        if (isMounted && beneficiariaData) {
          setBeneficiaria(beneficiariaData)
          setFormData({
            nombre: beneficiariaData.nombre,
            dpi: beneficiariaData.dpi,
            edad: beneficiariaData.edad.toString(),
            fechaNacimiento: beneficiariaData.fecha_nacimiento,
            direccion: beneficiariaData.direccion,
            sector: beneficiariaData.sector,
            telefono: beneficiariaData.telefono,
            email: beneficiariaData.correo,
            habitantes: beneficiariaData.habitantes_domicilio.toString(),
            terreno: beneficiariaData.inmuebles,
            estado: beneficiariaData.estado as "activa" | "inactiva",
            documentoImagenFrente: null,
            documentoImagenReverso: null,
          })
          
          // Cargar las imágenes existentes si están disponibles
          if (beneficiariaData.dpi_frente_url) {
            setImagePreviewFrente(beneficiariaData.dpi_frente_url)
          }
          if (beneficiariaData.dpi_reverso_url) {
            setImagePreviewReverso(beneficiariaData.dpi_reverso_url)
          }
        } else if (isMounted) {
          toast.error('Beneficiaria no encontrada')
          router.push('/beneficiarias')
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error al cargar beneficiaria:', error)
          toast.error('Error al cargar los datos de la beneficiaria')
          router.push('/beneficiarias')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (id) {
      loadBeneficiaria()
    }

    return () => {
      isMounted = false
    }
  }, [id])

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value

    // Validaciones por campo
    switch (field) {
      case "nombre":
        // Solo letras, espacios y acentos
        processedValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "")
        break
      case "dpi":
        // Solo números, máximo 13 dígitos
        processedValue = value.replace(/[^0-9]/g, "").slice(0, 13)
        break
      case "telefono":
        // Solo números y guiones
        processedValue = value.replace(/[^0-9-]/g, "")
        break
      case "edad":
      case "habitantes":
        // Solo números
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

    if (tipo === "frente") {
      setFormData((prev) => ({
        ...prev,
        documentoImagenFrente: file,
      }))

      // Crear preview de la imagen
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

      // Crear preview de la imagen
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

    // Mostrar notificación de proceso
    const loadingToast = toast.loading("Actualizando beneficiaria...", {
      description: "Por favor espere mientras se guardan los cambios",
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

      // Encontrar el ID del sector seleccionado
      const sectorSeleccionado = sectores.find(s => s.sector === formData.sector)
      if (!sectorSeleccionado) {
        toast.dismiss(loadingToast)
        toast.error('Sector seleccionado no válido')
        setIsLoading(false)
        return
      }

      // Preparar los datos para enviar
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
        estado: formData.estado,
      }

      //console.log('Datos a actualizar:', beneficiariaData)

      // Preparar las imágenes nuevas si se subieron
      const images = {
        dpi_frente: formData.documentoImagenFrente,
        dpi_reverso: formData.documentoImagenReverso,
      }

      // Preparar las keys de las imágenes existentes
      const existingImages = {
        dpi_frente: beneficiaria?.dpi_frente,
        dpi_reverso: beneficiaria?.dpi_reverso,
      }

      /*console.log('Imágenes nuevas:', {
        frente: images.dpi_frente?.name,
        reverso: images.dpi_reverso?.name
      })
      console.log('Keys existentes:', existingImages)*/

      // Llamar a la API real con imágenes
      const success = await updateBeneficiaria(parseInt(id), beneficiariaData, images, existingImages)
      
      if (success) {
        toast.dismiss(loadingToast)
        toast.success("Beneficiaria actualizada exitosamente", {
          description: `Los datos de ${formData.nombre} han sido actualizados`,
          icon: <CheckCircle className="h-4 w-4" />,
          duration: 4000,
        })

        // Redirigir después de un momento
        setTimeout(() => {
          router.push("/beneficiarias")
        }, 1500)
      } else {
        toast.dismiss(loadingToast)
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error('Error al actualizar beneficiaria:', error)
      toast.error('Error inesperado al actualizar beneficiaria')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/beneficiarias")
  }

  if (loading) {
      return (
        <ProtectedRoute allowedRoles={["Directora", "Administrador"]}>
          <div className="min-h-screen">
            <Navbar />
            <main className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando datos de la beneficiaria...</p>
              </div>
            </main>
          </div>
        </ProtectedRoute>
      )
    }

  
  return (
    <ProtectedRoute>
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
          <h1 className="text-3xl font-bold text-gray-900">Editar Beneficiaria</h1>
          <p className="mt-2 text-gray-600">
            Modifique los campos necesarios para actualizar la información de la beneficiaria
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando datos de la beneficiaria...</p>
            </div>
          </div>
        ) : (
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
                  <Label>Imágenes del Documento de Identificación</Label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* DPI Frente */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">DPI - Frente</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        {imagePreviewFrente ? (
                          <div className="space-y-3">
                            <img
                              src={imagePreviewFrente}
                              alt="Vista previa del DPI - Frente"
                              className="mx-auto max-w-full h-32 object-contain rounded-lg border"
                              onError={(e) => {
                                //console.error('Error cargando imagen DPI frente:', e);
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNhZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
                                //e.currentTarget.alt = "Imagen no disponible";
                              }}
                            />
                            <div>
                              <label htmlFor="documentoImagenFrente" className="cursor-pointer">
                                <span className="text-xs font-medium text-blue-600 hover:text-blue-700">
                                  {formData.documentoImagenFrente ? 'Cambiar imagen' : 'Actualizar imagen'}
                                </span>
                              </label>
                              <input
                                id="documentoImagenFrente"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, "frente")}
                              />
                            </div>
                            {formData.documentoImagenFrente ? (
                              <p className="text-xs text-green-600">{formData.documentoImagenFrente.name}</p>
                            ) : (
                              <p className="text-xs text-blue-600">Imagen existente cargada</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <Upload className="mx-auto h-8 w-8 text-gray-400" />
                            <div className="mt-2">
                              <label htmlFor="documentoImagenFrente" className="cursor-pointer">
                                <span className="text-xs font-medium text-gray-900">Subir frente del DPI</span>
                                <span className="block text-xs text-gray-500">PNG, JPG hasta 10MB</span>
                              </label>
                              <input
                                id="documentoImagenFrente"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, "frente")}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DPI Reverso */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">DPI - Reverso</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        {imagePreviewReverso ? (
                          <div className="space-y-3">
                            <img
                              src={imagePreviewReverso}
                              alt="Vista previa del DPI - Reverso"
                              className="mx-auto max-w-full h-32 object-contain rounded-lg border"
                              onError={(e) => {
                                //console.error('Error cargando imagen DPI reverso:', e);
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNhZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
                                //e.currentTarget.alt = "Imagen no disponible";
                              }}
                            />
                            <div>
                              <label htmlFor="documentoImagenReverso" className="cursor-pointer">
                                <span className="text-xs font-medium text-blue-600 hover:text-blue-700">
                                  {formData.documentoImagenReverso ? 'Cambiar imagen' : 'Actualizar imagen'}
                                </span>
                              </label>
                              <input
                                id="documentoImagenReverso"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, "reverso")}
                              />
                            </div>
                            {formData.documentoImagenReverso ? (
                              <p className="text-xs text-green-600">{formData.documentoImagenReverso.name}</p>
                            ) : (
                              <p className="text-xs text-blue-600">Imagen existente cargada</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <Upload className="mx-auto h-8 w-8 text-gray-400" />
                            <div className="mt-2">
                              <label htmlFor="documentoImagenReverso" className="cursor-pointer">
                                <span className="text-xs font-medium text-gray-900">Subir reverso del DPI</span>
                                <span className="block text-xs text-gray-500">PNG, JPG hasta 10MB</span>
                              </label>
                              <input
                                id="documentoImagenReverso"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, "reverso")}
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
                    <Select value={formData.sector} onValueChange={(value) => handleInputChange("sector", value)}>
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

            {/* Estado de la Beneficiaria */}
            <Card>
              <CardHeader>
                <CardTitle>Estado de la Beneficiaria</CardTitle>
                <CardDescription>Estado actual en el sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado *</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value: "activa" | "inactiva") => handleInputChange("estado", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activa">Activa</SelectItem>
                      <SelectItem value="inactiva">Inactiva</SelectItem>
                    </SelectContent>
                  </Select>
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
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="px-8">
              {isLoading ? "Actualizando..." : "Actualizar Beneficiaria"}
            </Button>
          </div>
        </form>
        )}
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
