"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Plus, X, Search, Users, FolderPlus } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useProyectos } from "@/hooks/useProyectos"
import { useBeneficiarias } from "@/hooks/useBeneficiarias"
import { useSectores } from "@/hooks/useSectores"
//import { hasPermission } from "@/lib/auth"

interface Beneficiaria {
  id_beneficiario: number
  nombre: string
  dpi: string
  sector: string
  edad: number
}

interface Sector {
  id_sector: number
  sector: string
  descripcion?: string
}

export default function NuevoProyectoPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showBeneficiariasModal, setShowBeneficiariasModal] = useState(false)
  const [showSectoresModal, setShowSectoresModal] = useState(false)
  const [searchBeneficiarias, setSearchBeneficiarias] = useState("")
  const [searchSectores, setSearchSectores] = useState("")

  // Hooks para obtener datos
  const { createProyecto, asignarBeneficiariosProyecto, asignarSectoresProyecto } = useProyectos()
  const { beneficiarias, loading: loadingBeneficiarias } = useBeneficiarias()
  const { sectores, loading: loadingSectores } = useSectores()

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    tipoProyecto: "",
    planteamientoProblema: "",
    objetivosGenerales: "",
    objetivosEspecificos: "",
    alcance: "",
    poblacionMeta: "",
    recursosMateriales: "",
    recursosEconomicos: "",
    fechaInicio: "",
    fechaFin: "",
    observaciones: "",
  })

  const [beneficiariasSeleccionadas, setBeneficiariasSeleccionadas] = useState<Beneficiaria[]>([])
  const [sectoresSeleccionados, setSectoresSeleccionados] = useState<Sector[]>([])

  const beneficiariasFiltered = beneficiarias.filter(
    (beneficiaria) =>
      !beneficiariasSeleccionadas.find((selected) => selected.id_beneficiario === beneficiaria.id_beneficiario) &&
      (beneficiaria.nombre.toLowerCase().includes(searchBeneficiarias.toLowerCase()) ||
        beneficiaria.dpi.includes(searchBeneficiarias)),
  )

  const sectoresFiltrados = sectores.filter(
    (sector) =>
      !sectoresSeleccionados.find((selected) => selected.id_sector === sector.id_sector) &&
      (sector.sector.toLowerCase().includes(searchSectores.toLowerCase())),
  )

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAgregarBeneficiaria = (beneficiaria: Beneficiaria) => {
    setBeneficiariasSeleccionadas((prev) => [...prev, beneficiaria])
  }

  const handleEliminarBeneficiaria = (id: number) => {
    setBeneficiariasSeleccionadas((prev) => prev.filter((b) => b.id_beneficiario !== id))
  }

  const handleAgregarSector = (sector: Sector) => {
    setSectoresSeleccionados((prev) => [...prev, sector])
  }

  const handleEliminarSector = (id: number) => {
    setSectoresSeleccionados((prev) => prev.filter((s) => s.id_sector !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Preparar datos del proyecto
      const proyectoData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        tipo_proyecto: formData.tipoProyecto,
        planteamiento_problema: formData.planteamientoProblema,
        objetivos_generales: formData.objetivosGenerales,
        objetivos_especificos: formData.objetivosEspecificos,
        alcance: formData.alcance,
        poblacion_meta: formData.poblacionMeta,
        recursos_materiales: formData.recursosMateriales,
        recursos_economicos: formData.recursosEconomicos,
        fecha_inicio: formData.fechaInicio,
        fecha_fin: formData.fechaFin,
        observaciones: formData.observaciones,
      }

      // Crear el proyecto
      const result = await createProyecto(proyectoData)
      
      if (result.success && result.id) {
        //console.log('✅ Proyecto creado con ID:', result.id)
        
        let beneficiariasAsignadas = 0
        let sectoresAsignados = 0
        
        // Asignar beneficiarias si hay alguna seleccionada
        if (beneficiariasSeleccionadas.length > 0) {
          //console.log('👥 Asignando beneficiarias:', beneficiariasSeleccionadas.map(b => b.id_beneficiario))
          const beneficiariosIds = beneficiariasSeleccionadas.map(b => b.id_beneficiario)
          const beneficiariasSuccess = await asignarBeneficiariosProyecto(result.id, beneficiariosIds)
          
          if (beneficiariasSuccess) {
            beneficiariasAsignadas = beneficiariasSeleccionadas.length
            //console.log('✅ Beneficiarias asignadas exitosamente')
          } else {
            //console.error('❌ Error al asignar beneficiarias')
          }
        }
        
        // Asignar sectores si hay alguno seleccionado
        if (sectoresSeleccionados.length > 0) {
          //console.log('🏢 Asignando sectores:', sectoresSeleccionados.map(s => s.id_sector))
          const sectoresIds = sectoresSeleccionados.map(s => s.id_sector)
          const sectoresSuccess = await asignarSectoresProyecto(result.id, sectoresIds)
          
          if (sectoresSuccess) {
            sectoresAsignados = sectoresSeleccionados.length
            //console.log('✅ Sectores asignados exitosamente')
          } else {
            //console.error('❌ Error al asignar sectores')
          }
        }
        
        toast.success("Proyecto creado exitosamente", {
          description: `${formData.nombre} ha sido creado con ${beneficiariasAsignadas} beneficiarias y ${sectoresAsignados} sectores`,
          icon: <FolderPlus className="h-4 w-4" />,
          duration: 4000,
        })

        // Redirigir después de un momento
        setTimeout(() => {
          router.push("/proyectos")
        }, 1500)
      } else {
        console.error('Error en la creación del proyecto:', result)
        toast.error("Error al crear proyecto", {
          description: result.message || "No se pudo crear el proyecto",
          duration: 4000,
        })
      }
    } catch (error) {
      console.error('Error creating proyecto:', error)
      toast.error("Error al crear proyecto", {
        description: "Hubo un problema al crear el proyecto",
        duration: 4000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/proyectos")
  }

  /*useEffect(() => {
    if (!hasPermission("create_project")) {
      router.push("/proyectos")
    }
  }, [router])

  if (!hasPermission("create_project")) {
    return null
  }*/

  return (
    <ProtectedRoute allowedRoles={["Directora", "Administrador"]}>
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/proyectos" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a Proyectos
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Proyecto</h1>
          <p className="mt-2 text-gray-600">Complete todos los campos requeridos para crear un nuevo proyecto</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Información Básica del Proyecto */}
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
                <CardDescription>Datos generales del proyecto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre del Proyecto *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => handleInputChange("nombre", e.target.value)}
                      placeholder="Ingrese el nombre del proyecto"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipoProyecto">Tipo de Proyecto *</Label>
                    <Select onValueChange={(value) => handleInputChange("tipoProyecto", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione el tipo de proyecto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="capacitacion">Capacitación</SelectItem>
                        <SelectItem value="viveres">Víveres</SelectItem>
                        <SelectItem value="huertos">Huertos</SelectItem>
                        <SelectItem value="microcreditos">Microcréditos</SelectItem>
                        <SelectItem value="salud">Salud</SelectItem>
                        <SelectItem value="educacion">Educación</SelectItem>
                        <SelectItem value="infraestructura">Infraestructura</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fechaInicio">Fecha de Inicio *</Label>
                    <Input
                      id="fechaInicio"
                      type="date"
                      value={formData.fechaInicio}
                      onChange={(e) => handleInputChange("fechaInicio", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fechaFin">Fecha de Finalización *</Label>
                    <Input
                      id="fechaFin"
                      type="date"
                      value={formData.fechaFin}
                      onChange={(e) => handleInputChange("fechaFin", e.target.value)}
                      min={formData.fechaInicio || undefined}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción *</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange("descripcion", e.target.value)}
                    placeholder="Descripción general del proyecto"
                    rows={3}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Planteamiento y Objetivos */}
            <Card>
              <CardHeader>
                <CardTitle>Planteamiento y Objetivos</CardTitle>
                <CardDescription>Definición del problema y objetivos del proyecto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="planteamientoProblema">Planteamiento del Problema *</Label>
                  <Textarea
                    id="planteamientoProblema"
                    value={formData.planteamientoProblema}
                    onChange={(e) => handleInputChange("planteamientoProblema", e.target.value)}
                    placeholder="Describa el problema que el proyecto pretende resolver"
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objetivosGenerales">Objetivos Generales *</Label>
                  <Textarea
                    id="objetivosGenerales"
                    value={formData.objetivosGenerales}
                    onChange={(e) => handleInputChange("objetivosGenerales", e.target.value)}
                    placeholder="Objetivos generales del proyecto"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objetivosEspecificos">Objetivos Específicos *</Label>
                  <Textarea
                    id="objetivosEspecificos"
                    value={formData.objetivosEspecificos}
                    onChange={(e) => handleInputChange("objetivosEspecificos", e.target.value)}
                    placeholder="Objetivos específicos del proyecto"
                    rows={4}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Alcance y Población */}
            <Card>
              <CardHeader>
                <CardTitle>Alcance y Población Meta</CardTitle>
                <CardDescription>Definición del alcance y población objetivo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="alcance">Alcance *</Label>
                  <Textarea
                    id="alcance"
                    value={formData.alcance}
                    onChange={(e) => handleInputChange("alcance", e.target.value)}
                    placeholder="Defina el alcance del proyecto"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="poblacionMeta">Población Meta *</Label>
                  <Textarea
                    id="poblacionMeta"
                    value={formData.poblacionMeta}
                    onChange={(e) => handleInputChange("poblacionMeta", e.target.value)}
                    placeholder="Describa la población objetivo del proyecto"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                  <Label htmlFor="coberturaCapacitacion">Cobertura del proyecto *</Label>
                  <Button
                    type="button"
                    onClick={() => setShowSectoresModal(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Sectores
                  </Button>
                  </div>
                  {loadingSectores ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300 animate-pulse" />
                      <p>Cargando sectores...</p>
                    </div>
                  ) : sectoresSeleccionados.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No hay sectores asignados</p>
                      <p className="text-sm">Haga clic en "Agregar Sectores" para asignar sectores</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="secondary" className="text-sm">
                          {sectoresSeleccionados.length} sectores asignados
                        </Badge>
                      </div>
                      <div>
                      <Table className="w-full md:w-[500px] mx-auto">
                        <TableHeader>
                          <TableRow className="bg-gray-100">
                            <TableHead className="text-gray-700 font-semibold">Sector</TableHead>
                            <TableHead className="text-gray-700 font-semibold text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sectoresSeleccionados.map((sector) => (
                            <TableRow key={sector.id_sector}>
                              <TableCell className="font-medium">{sector.sector}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEliminarSector(sector.id_sector)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recursos */}
            <Card>
              <CardHeader>
                <CardTitle>Recursos del Proyecto</CardTitle>
                <CardDescription>Recursos materiales y económicos necesarios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recursosMateriales">Recursos Materiales *</Label>
                  <Textarea
                    id="recursosMateriales"
                    value={formData.recursosMateriales}
                    onChange={(e) => handleInputChange("recursosMateriales", e.target.value)}
                    placeholder="Liste los recursos materiales necesarios"
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recursosEconomicos">Recursos Económicos *</Label>
                  <Textarea
                    id="recursosEconomicos"
                    value={formData.recursosEconomicos}
                    onChange={(e) => handleInputChange("recursosEconomicos", e.target.value)}
                    placeholder="Detalle el presupuesto y recursos económicos"
                    rows={4}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Beneficiarias del Proyecto */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Beneficiarias del Proyecto</CardTitle>
                    <CardDescription>Seleccione las beneficiarias que participarán en el proyecto</CardDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setShowBeneficiariasModal(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Beneficiarias
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {beneficiariasSeleccionadas.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay beneficiarias seleccionadas</p>
                    <p className="text-sm">Haga clic en "Agregar Beneficiarias" para seleccionar participantes</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="secondary" className="text-sm">
                        {beneficiariasSeleccionadas.length} beneficiarias seleccionadas
                      </Badge>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-100">
                          <TableHead className="text-gray-700 font-semibold">Nombre</TableHead>
                          <TableHead className="text-gray-700 font-semibold">DPI</TableHead>
                          <TableHead className="text-gray-700 font-semibold">Sector</TableHead>
                          <TableHead className="text-gray-700 font-semibold">Edad</TableHead>
                          <TableHead className="text-gray-700 font-semibold text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {beneficiariasSeleccionadas.map((beneficiaria) => (
                          <TableRow key={beneficiaria.id_beneficiario}>
                            <TableCell className="font-medium">{beneficiaria.nombre}</TableCell>
                            <TableCell>{beneficiaria.dpi}</TableCell>
                            <TableCell>{beneficiaria.sector}</TableCell>
                            <TableCell>{beneficiaria.edad} años</TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEliminarBeneficiaria(beneficiaria.id_beneficiario)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/*Modal para seleccionar sectores*/}
              {showSectoresModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
                    <div className="p-6 border-b">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Agregar Sectores</h2>
                        <Button type="button" variant="ghost" size="icon" onClick={() => setShowSectoresModal(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder="Buscar sectores..."
                            value={searchSectores}
                            onChange={(e) => setSearchSectores(e.target.value)}
                            className="pl-10 bg-white"
                          />
                        </div>
                      </div>
                    </div>
  
                    <div className="p-6 overflow-y-auto max-h-96">
                      {loadingSectores ? (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300 animate-pulse" />
                          <p>Cargando sectores...</p>
                        </div>
                      ) : sectoresFiltrados.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>No se encontraron sectores disponibles</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-100">
                              <TableHead className="text-gray-700 font-semibold">Sector</TableHead>
                              <TableHead className="text-gray-700 font-semibold text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sectoresFiltrados.map((sector) => (
                              <TableRow key={sector.id_sector}>
                                <TableCell className="font-medium">{sector.sector}</TableCell>
                                <TableCell className="text-right">
                                  <Button type="button" size="sm" onClick={() => handleAgregarSector(sector)}>
                                    Agregar
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
  
                    <div className="p-6 border-t bg-gray-50">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setShowSectoresModal(false)}>
                          Cerrar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {/* Observaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Observaciones</CardTitle>
                <CardDescription>Información adicional sobre el proyecto</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    value={formData.observaciones}
                    onChange={(e) => handleInputChange("observaciones", e.target.value)}
                    placeholder="Observaciones adicionales (opcional)"
                    rows={4}
                  />
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
              {isLoading ? "Creando Proyecto..." : "Crear Proyecto"}
            </Button>
          </div>
        </form>

        {/* Modal para seleccionar beneficiarias */}
        {showBeneficiariasModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Seleccionar Beneficiarias</h2>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setShowBeneficiariasModal(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar beneficiarias por nombre o DPI..."
                      value={searchBeneficiarias}
                      onChange={(e) => setSearchBeneficiarias(e.target.value)}
                      className="pl-10 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-96">
                {beneficiariasFiltered.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No se encontraron beneficiarias disponibles</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead className="text-gray-700 font-semibold">Nombre</TableHead>
                        <TableHead className="text-gray-700 font-semibold">DPI</TableHead>
                        <TableHead className="text-gray-700 font-semibold">Sector</TableHead>
                        <TableHead className="text-gray-700 font-semibold">Edad</TableHead>
                        <TableHead className="text-gray-700 font-semibold text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {beneficiariasFiltered.map((beneficiaria) => (
                        <TableRow key={beneficiaria.id_beneficiario}>
                          <TableCell className="font-medium">{beneficiaria.nombre}</TableCell>
                          <TableCell>{beneficiaria.dpi}</TableCell>
                          <TableCell>{beneficiaria.sector}</TableCell>
                          <TableCell>{beneficiaria.edad} años</TableCell>
                          <TableCell className="text-right">
                            <Button type="button" size="sm" onClick={() => handleAgregarBeneficiaria(beneficiaria)}>
                              Agregar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50">
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowBeneficiariasModal(false)}>
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>
          </div>
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
