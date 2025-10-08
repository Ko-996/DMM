"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import {
  Plus,
  Search,
  Users,
  Calendar,
  MapPin,
  Trash2,
  Eye,
  Download,
  X,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  AlertTriangle,
  FolderPlus,
} from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useProyectos } from "@/hooks/useProyectos"

export default function ProyectosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sectoresProyecto, setSectoresProyecto] = useState<any[]>([])
  const [beneficiariasProyecto, setBeneficiariasProyecto] = useState<any[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [sectoresPorProyecto, setSectoresPorProyecto] = useState<{[key: number]: any[]}>({})
  const [loadingSectores, setLoadingSectores] = useState<{[key: number]: boolean}>({})
  const [cantidadBeneficiarias, setCantidadBeneficiarias] = useState<{[key: number]: number}>({})
  const [loadingCantidad, setLoadingCantidad] = useState<{[key: number]: boolean}>({})

  // Hook para obtener proyectos de la API
  const { proyectos, loading, error, getProyectoSectores, getProyectoBeneficiariosDetalle, getCantidadBeneficiariasProyecto, deleteProyecto, fetchProyectos } = useProyectos()

  // Filtrar proyectos basado en el término de búsqueda
  const proyectosFiltrados = proyectos.filter((proyecto) =>
    proyecto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proyecto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proyecto.tipo_proyecto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proyecto.estado?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Función optimizada para cargar datos de proyectos con throttling
  const loadProyectoData = async (proyectoId: number) => {
    try {
      // Cargar sectores y cantidad en paralelo
      const [sectoresResponse, cantidadResponse] = await Promise.allSettled([
        getProyectoSectores(proyectoId),
        getCantidadBeneficiariasProyecto(proyectoId)
      ])

      // Procesar sectores
      if (sectoresResponse.status === 'fulfilled' && sectoresResponse.value.success) {
        setSectoresPorProyecto(prev => ({
          ...prev,
          [proyectoId]: sectoresResponse.value.data || []
        }))
      } else {
        setSectoresPorProyecto(prev => ({
          ...prev,
          [proyectoId]: []
        }))
      }

      // Procesar cantidad
      if (cantidadResponse.status === 'fulfilled' && cantidadResponse.value.success) {
        setCantidadBeneficiarias(prev => ({
          ...prev,
          [proyectoId]: cantidadResponse.value.data?.cantidad || 0
        }))
      } else {
        setCantidadBeneficiarias(prev => ({
          ...prev,
          [proyectoId]: 0
        }))
      }
    } catch (error) {
      console.error(`Error loading data for proyecto ${proyectoId}:`, error)
    }
  }

  // Cargar datos de proyectos de forma optimizada con delay
  useEffect(() => {
    if (proyectos.length > 0) {
      // Cargar datos en lotes de 2 proyectos a la vez con delay
      const batchSize = 2
      const batches = []
      
      for (let i = 0; i < proyectos.length; i += batchSize) {
        batches.push(proyectos.slice(i, i + batchSize))
      }

      // Procesar cada lote con un delay
      batches.forEach((batch, batchIndex) => {
        setTimeout(() => {
          batch.forEach((proyecto) => {
            const proyectoId = proyecto.id_proyecto || proyecto.id_proyecto
            if (proyectoId && 
                (!sectoresPorProyecto[proyectoId] || cantidadBeneficiarias[proyectoId] === undefined)) {
              loadProyectoData(proyectoId)
            }
          })
        }, batchIndex * 500) // 500ms entre lotes para evitar sobrecarga
      })
    }
  }, [proyectos])

  const getEstadoColor = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'en proceso':
        return "bg-blue-100 text-blue-800"
      case 'completado':
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleViewDetails = async (proyecto: any) => {
    const proyectoId = proyecto.id_proyecto || proyecto.id
    if (!proyectoId || proyectoId === undefined) {
      console.warn('handleViewDetails: proyecto Id is undefined or invalid:', proyecto)
      toast.error("Error: ID del proyecto no válido")
      return
    }
    
    setSelectedProject(proyecto)
    setShowDetailsModal(true)
    setLoadingDetails(true)

    try {
      // Cargar sectores y beneficiarias del proyecto seleccionado
      const [sectoresResponse, beneficiariasResponse] = await Promise.allSettled([
        getProyectoSectores(proyectoId),
        getProyectoBeneficiariosDetalle(proyectoId)
      ])

      if (sectoresResponse.status === 'fulfilled' && sectoresResponse.value.success) {
        setSectoresProyecto(sectoresResponse.value.data || [])
      } else {
        setSectoresProyecto([])
      }

      if (beneficiariasResponse.status === 'fulfilled' && beneficiariasResponse.value.success) {
        setBeneficiariasProyecto(beneficiariasResponse.value.data || [])
      } else {
        setBeneficiariasProyecto([])
      }
    } catch (error) {
      console.error('Error loading proyecto details:', error)
      toast.error("Error al cargar los detalles del proyecto")
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleDeleteClick = (proyecto: any) => {
    setSelectedProject(proyecto)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    const proyectoId = selectedProject?.id_proyecto || selectedProject?.id
    if (!selectedProject || !proyectoId || proyectoId === undefined) {
      console.warn('confirmDelete: Project id is undefined or invalid:', selectedProject)
      toast.error("Error: ID del proyecto no válido")
      return
    }

    setIsDeleting(true)

    try {
      const success = await deleteProyecto(proyectoId)
      
      if (success) {
        toast.success("Proyecto eliminado exitosamente", {
          description: `${selectedProject.nombre} ha sido eliminado del sistema`,
          icon: <CheckCircle className="h-4 w-4" />,
          duration: 4000,
        })

        setShowDeleteModal(false)
        setSelectedProject(null)
        
        // Recargar la lista de proyectos
        await fetchProyectos()
      } else {
        toast.error("Error al eliminar proyecto", {
          description: "No se pudo eliminar el proyecto",
          duration: 4000,
        })
      }
      
    } catch (error) {
      console.error('Error deleting proyecto:', error)
      toast.error("Error al eliminar proyecto", {
        description: "Hubo un problema al eliminar el proyecto",
        duration: 4000,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Sin fecha'
    try {
      return new Date(dateString).toLocaleDateString('es-GT')
    } catch {
      return dateString
    }
  }

  const exportToCSV = () => {
    const participants = beneficiariasProyecto || []
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "No.,Nombre,DPI,Sector,Edad,Firma de Asistencia\n" +
      participants.map((b: any, index: number) => `${index + 1},${b.nombre},${b.dpi},${b.sector},${b.edad},`).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `participantes_${selectedProject.nombre.replace(/\s+/g, "_")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Mostrar notificación de éxito
    toast.success("Lista exportada exitosamente", {
      description: "El archivo CSV ha sido descargado",
      icon: <Download className="h-4 w-4" />,
      duration: 3000,
    })
  }
  
  const exportToExcel = async () => {
    try {
      const XLSX = await import("xlsx")
      const participants = beneficiariasProyecto || []

      const worksheetData = [
        ["Dirección Municipal de la Mujer de Salcajá"],
        ["Lista de participantes"],
        [`Proyecto: ${selectedProject.nombre}`],
        [`Fecha: ${new Date().toLocaleDateString()}`],
        [""],
        ["No.", "Nombre", "DPI", "Firma de Asistencia"],
      ]

      participants.forEach((participant: any, index: number) => {
        worksheetData.push([
          index + 1,
          participant.nombre,
          participant.dpi,
          //participant.sector,
          //participant.edad,
          "",
        ])
      })

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 5 }, // No.
        { wch: 30 }, // Nombre
        { wch: 15 }, // DPI
        { wch: 25 }, // Firma
      ]
      worksheet["!cols"] = colWidths

      // Crear libro de trabajo
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Participantes")

      // Descargar archivo
      XLSX.writeFile(workbook, `participantes_${selectedProject.nombre.replace(/\s+/g, "_")}.xlsx`)

      // Mostrar notificación de éxito
      toast.success("Lista exportada exitosamente", {
        description: "El archivo Excel ha sido descargado",
        icon: <FileSpreadsheet className="h-4 w-4" />,
        duration: 3000,
      })
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
      toast.error("Error al exportar a Excel", {
        description: "Asegúrate de que las dependencias estén instaladas",
        duration: 4000,
      })
    }
  }
  
  
    const exportToPDF = async () => {
      try {
        const jsPDF = (await import("jspdf")).default
        const autoTable = (await import("jspdf-autotable")).default
  
        const participants = beneficiariasProyecto || []
        const doc = new jsPDF()
  
        // Título del documento
        doc.setFontSize(16)
        doc.setFont("helvetica", "bold")
        doc.text("Dirección Municipal de la Mujer de Salcajá", 105, 20, { align: "center" })
  
        doc.setFontSize(14)
        doc.text("Lista de participantes", 105, 30, { align: "center" })
  
        doc.setFontSize(12)
        doc.setFont("helvetica", "normal")
        doc.text(`Proyecto: ${selectedProject.nombre}`, 20, 45)
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 55)
        doc.text(`Total de Participantes: ${participants.length}`, 20, 65)
  
        // Preparar datos para la tabla
        const tableData = participants.map((participant: any, index: number) => [
          index + 1,
          participant.nombre,
          participant.dpi,
          "", // Columna vacía para firma
        ])
  
        // Crear tabla
        autoTable(doc, {
          head: [["No.", "Nombre", "DPI", "Firma de Asistencia"]],
          body: tableData,
          startY: 75,
          styles: {
            fontSize: 10,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: "bold",
          },
          columnStyles: {
            0: { cellWidth: 15, halign: "center" }, // No.
            1: { cellWidth: 80 }, // Nombre
            2: { cellWidth: 35 }, // DPI
            3: { cellWidth: 40 }, // Firma
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
          margin: { top: 75, left: 20, right: 10 },
        })
  
        // Agregar línea para firmas si hay espacio
        const finalY = (doc as any).lastAutoTable.finalY || 75
        if (finalY < 250) {
          doc.setFontSize(10)
          doc.text("Firma del Responsable: _________________________", 60, finalY + 30)
        }
  
        // Descargar PDF
        doc.save(`participantes_${selectedProject.nombre.replace(/\s+/g, "_")}.pdf`)
  
        // Mostrar notificación de éxito
        toast.success("Lista exportada exitosamente", {
          description: "El archivo PDF ha sido descargado",
          icon: <FileText className="h-4 w-4" />,
          duration: 3000,
        })
      } catch (error) {
        console.error("Error al exportar a PDF:", error)
        toast.error("Error al exportar a PDF", {
          description: "Asegúrate de que las dependencias estén instaladas",
          duration: 4000,
        })
      }
    }
  
    const exportProyectoReportToCSV = () => {
      const proyecto = selectedProject
      const participants = beneficiariasProyecto || []
  
      let csvContent =
        "data:text/csv;charset=utf-8," +
        "Campo,Valor\n" +
        `Nombre del Proyecto,${proyecto.nombre}\n` +
        `Descripción,${proyecto.descripcion}\n` +
        `Tipo de Proyecto,${proyecto.tipo_proyecto}\n` +
        `Estado,${proyecto.estado}\n` +
        `Fecha de Inicio,${new Date(proyecto.fecha_inicio).toLocaleDateString()}\n` +
        `Fecha de Finalización,${new Date(proyecto.fecha_fin).toLocaleDateString()}\n` +
        `Planteamiento del Problema,${proyecto.planteamiento_problema}\n` +
        `Objetivos Generales,${proyecto.objetivos_generales}\n` +
        `Objetivos Específicos,${proyecto.objetivos_especificos}\n` +
        `Alcance,"${proyecto.alcance}"\n` +
        `Población Meta,"${proyecto.poblacion_meta}"\n` +
        `Recursos Materiales,"${proyecto.recursos_materiales}"\n` +
        `Recursos Económicos,"${proyecto.recursos_economicos}"\n` +
        `Observaciones,"${proyecto.observaciones}"\n` +
        `Cobertura del Proyecto,"${sectoresProyecto.map((c: any) => c.nombre || c.sector || c.nombre_sector).join(", ")}"\n` +
        `Número de Beneficiarias,${participants.length}\n\n` +
        "Lista de participantes\n" +
        "No.,Nombre,DPI,Sector,Edad\n"
  
      // Añadir participantes al CSV
      participants.forEach((participant: any, index: number) => {
        csvContent += `${index + 1},${participant.nombre},${participant.dpi},${participant.sector},${participant.edad}\n`
      })
  
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `reporte_proyecto_${proyecto.nombre.replace(/\s+/g, "_")}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
  
      toast.success("Reporte exportado exitosamente", {
        description: "El archivo CSV ha sido descargado",
        icon: <Download className="h-4 w-4" />,
        duration: 3000,
      })
    }
  
    const exportProyectoReportToExcel = async () => {
      try {
        const XLSX = await import("xlsx")
        const proyecto = selectedProject
        const participants = beneficiariasProyecto || []
  
        const worksheetData = [
          ["Dirección Municipal de la Mujer de Salcajá"],
          ["Reporte Detallado del Proyecto"],
          [`Fecha de Generación: ${new Date().toLocaleDateString()}`],
          [""],
          ["Información General"],
          ["Nombre del Proyecto", proyecto.nombre],
          ["Descripción", proyecto.descripcion],
          ["Tipo de Proyecto", proyecto.tipo_proyecto],
          ["Estado", proyecto.estado],
          ["Fecha de Inicio", new Date(proyecto.fecha_inicio).toLocaleDateString()],
          ["Fecha de Finalización", new Date(proyecto.fecha_fin).toLocaleDateString()],
          ["Número de Beneficiarias", participants.length],
          [""],
          ["Planteamiento y Objetivos"],
          ["Planteamiento del Problema", proyecto.planteamiento_problema],
          ["Objetivos Generales", proyecto.objetivos_generales],
          ["Objetivos Específicos", proyecto.objetivos_especificos],
          [""],
          ["Alacance y Población"],
          ["Alcance", proyecto.alcance],
          ["Población Meta", proyecto.poblacion_meta],
          ["Cobertura del Proyecto", sectoresProyecto.map((c: any) => c.nombre || c.sector || c.nombre_sector).join(", ")],
          [""],
          ["Recursos"],
          ["Recursos Materiales", proyecto.recursos_materiales],
          ["Recursos Económicos", proyecto.recursos_economicos],
          [""],
          ["Observaciones", proyecto.observaciones || "N/A"],
        ]
  
        if (participants.length > 0) {
          worksheetData.push(
            [""],
            ["Lista de participantes"],
            [`Total de Participantes: ${participants.length}`],
            [""],
            ["No.", "Nombre", "DPI", "Sector", "Edad"],
          )
  
          participants.forEach((participant: any, index: number) => {
            worksheetData.push([index + 1, participant.nombre, participant.dpi, participant.sector, participant.edad])
          })
        }
  
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
  
        // Ajustar ancho de columnas
        const colWidths = [
          { wch: 30 }, // Campo/No.
          { wch: 80 }, // Valor/Nombre
          { wch: 20 }, // DPI
          { wch: 25 }, // Sector
          { wch: 10 }, // Edad
        ]
        worksheet["!cols"] = colWidths
  
        // Crear libro de trabajo
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte Proyecto")
  
        // Descargar archivo
        XLSX.writeFile(workbook, `reporte_proyecto_${proyecto.nombre.replace(/\s+/g, "_")}.xlsx`)
  
        toast.success("Reporte exportado exitosamente", {
          description: "El archivo Excel ha sido descargado",
          icon: <FileSpreadsheet className="h-4 w-4" />,
          duration: 3000,
        })
      } catch (error) {
        console.error("Error al exportar a Excel:", error)
        toast.error("Error al exportar a Excel", {
          description: "Asegúrate de que las dependencias estén instaladas",
          duration: 4000,
        })
      }
    }
  
    const exportProyectoReportToPDF = async () => {
      try {
        const jsPDF = (await import("jspdf")).default
        const autoTable = (await import("jspdf-autotable")).default
        const proyecto = selectedProject
        const doc = new jsPDF()
  
        // Título del documento
        doc.setFontSize(16)
        doc.setFont("helvetica", "bold")
        doc.text("Dirección Municipal de la Mujer de Salcajá", 105, 20, { align: "center" })
  
        doc.setFontSize(14)
        doc.text("Reporte detallado del Proyecto", 105, 30, { align: "center" })
  
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.text(`Fecha de Generación: ${new Date().toLocaleDateString()}`, 105, 40, { align: "center" })
  
        let yPosition = 55
  
        // Función para añadir sección
        const addSection = (title: string, content: { [key: string]: string }) => {
          doc.setFontSize(12)
          doc.setFont("helvetica", "bold")
          doc.text(title, 20, yPosition)
          yPosition += 10
  
          doc.setFontSize(10)
          doc.setFont("helvetica", "normal")
  
          Object.entries(content).forEach(([key, value]) => {
            if (yPosition > 270) {
              doc.addPage()
              yPosition = 20
            }
  
            doc.setFont("helvetica", "bold")
            doc.text(`${key}:`, 20, yPosition)
            doc.setFont("helvetica", "normal")
  
            const lines = doc.splitTextToSize(value || "N/A", 150)
            doc.text(lines, 20, yPosition + 5)
            yPosition += 5 + lines.length * 5 + 3
          })
  
          yPosition += 5
        }
  
        // Información General
        addSection("Información General", {
          "Nombre del Proyecto": proyecto.nombre,
          Descripción: proyecto.descripcion,
          "Tipo de Proyecto": proyecto.tipo_proyecto,
          Estado: proyecto.estado,
          "Fecha de Inicio": new Date(proyecto.fecha_inicio).toLocaleDateString(),
          "Fecha de Finalización": new Date(proyecto.fecha_fin).toLocaleDateString(),
        })
  
        // Alcance y Población
        addSection("Alcance y Población", {
          Alcance: proyecto.alcance,
          "Población Meta": proyecto.poblacion_meta,
          "Cobertura del Proyecto": sectoresProyecto.map((c: any) => c.nombre || c.sector || c.nombre_sector).join(", "),
        })
  
        // Recursos
        addSection("Recursos", {
          "Recursos Materiales": proyecto.recursos_materiales,
          "Recursos Económicos": proyecto.recursos_economicos,
        })
  
        // Observaciones
        if (proyecto.observaciones) {
          addSection("Observaciones", {
            Observaciones: proyecto.observaciones,
          })
        }
  
        const participants = beneficiariasProyecto || []
        if (participants.length > 0) {
          // Verificar si necesitamos una nueva página
          if (yPosition > 200) {
            doc.addPage()
            yPosition = 20
          }
  
          // Título de la sección de participantes
          doc.setFontSize(12)
          doc.setFont("helvetica", "bold")
          doc.text("Lista de Participantes", 85, yPosition )
          yPosition += 10
  
          doc.setFontSize(10)
          doc.setFont("helvetica", "normal")
          doc.text(`Total de Participantes: ${participants.length}`, 20, yPosition)
          yPosition += 10
  
          // Preparar datos para la tabla de participantes
          const tableData = participants.map((participant: any, index: number) => [
            index + 1,
            participant.nombre,
            participant.dpi,
            participant.sector,
            participant.edad,
          ])
  
          // Crear tabla de participantes
          autoTable(doc, {
            head: [["No.", "Nombre", "DPI", "Sector", "Edad"]],
            body: tableData,
            startY: yPosition,
            styles: {
              fontSize: 9,
              cellPadding: 2,
            },
            headStyles: {
              fillColor: [41, 128, 185],
              textColor: 255,
              fontStyle: "bold",
            },
            columnStyles: {
              0: { cellWidth: 15, halign: "center" }, // No.
              1: { cellWidth: 65 }, // Nombre
              2: { cellWidth: 30 }, // DPI
              3: { cellWidth: 40 }, // Sector
              4: { cellWidth: 15 }, // Edad
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245],
            },
            margin: { top: yPosition, left: 23, right: 20 },
          })
        }
  
        // Descargar PDF
        doc.save(`reporte_proyecto_${proyecto.nombre.replace(/\s+/g, "_")}.pdf`)
  
        toast.success("Reporte exportado exitosamente", {
          description: "El archivo PDF ha sido descargado",
          icon: <FileText className="h-4 w-4" />,
          duration: 3000,
        })
      } catch (error) {
        console.error("Error al exportar a PDF:", error)
        toast.error("Error al exportar a PDF", {
          description: "Asegúrate de que las dependencias estén instaladas",
          duration: 4000,
        })
      }
    }
  

  if (loading) {
    return (
      <ProtectedRoute>
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando proyectos...</p>
          </div>
        </main>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar proyectos</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => fetchProyectos()} variant="outline">
              Intentar de nuevo
            </Button>
          </div>
        </main>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["Directora", "Administrador"]}>
      <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
        <Navbar />

        <main className="w-11/12 mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-gray-900">Proyectos</h1>
              <p className="mt-2 text-gray-600"></p>
            </div>            
          </div>
          <div className="w-full justify-end flex gap-6"> 
              <Button asChild>
              <Link href="/proyectos/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Proyecto
              </Link>
            </Button>
            </div>

          {/* Barra de búsqueda */}
          <div className="mb-6 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar proyectos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
          </div>

          {/* Lista de proyectos */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando proyectos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
                <p>Error al cargar proyectos</p>
                <p className="text-sm text-gray-500">{error}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
                {proyectosFiltrados.sort((a, b) => a.estado === "en proceso" ? -1 : 1).map((proyecto, index) => (
                <Card key={proyecto.id_proyecto || proyecto.id_proyecto || `proyecto-${index}`} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{proyecto.nombre}</CardTitle>
                      <Badge className={getEstadoColor(proyecto.estado)}>{proyecto.estado}</Badge>
                    </div>
                    <CardDescription className="text-sm">{proyecto.descripcion}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        {loadingCantidad[proyecto.id_proyecto || proyecto.id_proyecto] ? (
                          <span className="text-sm text-gray-500">Cargando...</span>
                        ) : (
                          `${cantidadBeneficiarias[proyecto.id_proyecto || proyecto.id_proyecto] || 0} beneficiarias`
                        )}
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <div className="flex flex-wrap gap-1">
                          {loadingSectores[proyecto.id_proyecto || proyecto.id_proyecto] ? (
                            <span className="text-sm text-gray-500">Cargando sectores...</span>
                          ) : sectoresPorProyecto[proyecto.id_proyecto || proyecto.id_proyecto] && sectoresPorProyecto[proyecto.id_proyecto || proyecto.id_proyecto].length > 0 ? (
                            sectoresPorProyecto[proyecto.id_proyecto || proyecto.id_proyecto].map((sector: any, index: number) => (
                              <Badge key={sector.id || `sector-${index}`} variant="secondary" className="text-xs">
                                {sector.nombre || sector.sector || sector.nombre_sector}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">Sin sectores asignados</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(proyecto.fecha_inicio)} - {formatDate(proyecto.fecha_fin)}
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <FolderPlus className="h-4 w-4 mr-2" />
                        {proyecto.tipo_proyecto || 'Sin tipo'}
                      </div>

                      <div className="pt-2 border-t">
                        <p className="text-sm font-medium text-gray-900">Recursos económicos: {proyecto.recursos_economicos || "No especificado"}</p>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => handleViewDetails(proyecto)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalles
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                          <Link href={proyecto.id_proyecto || proyecto.id_proyecto ? `/proyectos/${proyecto.id_proyecto || proyecto.id_proyecto}/editar` : '#'}>
                            <FileText className="h-4 w-4 mr-1" />
                            Editar
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                          onClick={() => handleDeleteClick(proyecto)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {proyectosFiltrados.length === 0 && (
                <div className="text-center py-12 col-span-full">
                  <p className="text-gray-500">No se encontraron proyectos que coincidan con la búsqueda.</p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Modal de confirmación de eliminación */}
        {showDeleteModal && selectedProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Eliminar Proyecto</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    ¿Estás seguro de que quieres eliminar "{selectedProject.nombre}"? Esta acción no se puede deshacer y se eliminarán todos los datos asociados.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isDeleting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 hover:bg-destructive/60 hover:text-white"
                    onClick={() => confirmDelete()}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Eliminando..." : "Eliminar"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de detalles */}
        {showDetailsModal && selectedProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedProject.nombre}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getEstadoColor(selectedProject.estado)}>{selectedProject.estado}</Badge>
                    <span className="text-sm text-gray-500">
                      {selectedProject.fecha_inicio ? formatDate(selectedProject.fecha_inicio) : "No especificada"}
                      {" - "}
                      {selectedProject.fecha_fin ? formatDate(selectedProject.fecha_fin) : "No especificada"}
                    </span>
                    </div>
                    </div>
                      <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowDetailsModal(false)
                      setSelectedProject(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="flex items-center gap-2 bg-transparent" size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                          Descargar Reporte
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={exportProyectoReportToCSV}>
                          <FileText className="h-4 w-4 mr-2" />
                          Reporte CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={exportProyectoReportToExcel}>
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Reporte Excel
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={exportProyectoReportToPDF}>
                          <FileText className="h-4 w-4 mr-2" />
                          Reporte PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Información General */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Información General</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold text-gray-900">Descripción</Label>
                        <p className="text-sm text-gray-900 mt-1">{selectedProject.descripcion}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-900">Tipo de Proyecto</Label>
                        <p className="text-sm text-gray-900 mt-1">{selectedProject.tipo_proyecto}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-900">Recursos materiales</Label>
                        <p className="text-sm text-gray-900 mt-1">{selectedProject.recursos_materiales}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-900">Recursos económicos</Label>
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedProject.recursos_economicos || "No especificado"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Alcance y Población */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Alcance y Población</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold text-gray-900">Alcance</Label>
                        <p className="text-sm text-gray-900 mt-1">{selectedProject.alcance}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-900">Población Meta</Label>
                        <p className="text-sm text-gray-900 mt-1">{selectedProject.poblacion_meta}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-900">Cobertura del Proyecto</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {loadingDetails ? (
                            <span className="text-sm text-gray-500">Cargando sectores...</span>
                          ) : sectoresProyecto && sectoresProyecto.length > 0 ? (
                            sectoresProyecto.map((sector: any, index: number) => (
                              <Badge key={sector.id || `sector-${index}`} variant="secondary" className="text-xs">
                                {sector.nombre || sector.sector || sector.nombre_sector}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">Sin sectores asignados</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Planteamiento y Objetivos */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Planteamiento y Objetivos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold text-gray-900">Planteamiento del Problema</Label>
                        <p className="text-sm text-gray-900 mt-1">{selectedProject.planteamiento_problema}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-900">Objetivos Generales</Label>
                        <p className="text-sm text-gray-900 mt-1">{selectedProject.objetivos_generales}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-900">Objetivos Específicos</Label>
                        <p className="text-sm text-gray-900 mt-1">{selectedProject.objetivos_especificos}</p>
                      </div>
                    </CardContent>
                  </Card>

                {/* Beneficiarias del Proyecto */}
                <Card className="mt-6">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg">Beneficiarias del Proyecto</CardTitle>
                        <CardDescription>
                          {loadingDetails ? "Cargando beneficiarias..." : `${beneficiariasProyecto.length} beneficiarias asignadas`}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button className="flex items-center gap-2" size="sm">
                            <Download className="h-4 w-4" />
                            Exportar Lista
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={exportToCSV}>
                            <FileText className="h-4 w-4 mr-2" />
                            Exportar CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={exportToExcel}>
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Exportar Excel
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={exportToPDF}>
                            <FileText className="h-4 w-4 mr-2" />
                            Exportar PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingDetails ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p>Cargando beneficiarias...</p>
                      </div>
                    ) : beneficiariasProyecto && beneficiariasProyecto.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-100">
                            <TableHead className="text-gray-700 font-semibold">No.</TableHead>
                            <TableHead className="text-gray-700 font-semibold">Nombre</TableHead>
                            <TableHead className="text-gray-700 font-semibold">DPI</TableHead>
                            <TableHead className="text-gray-700 font-semibold">Sector</TableHead>
                            <TableHead className="text-gray-700 font-semibold">Edad</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {beneficiariasProyecto.map((beneficiaria: any, index: number) => (
                            <TableRow key={beneficiaria.id || `beneficiaria-${index}`}>
                              <TableCell className="font-medium">{index + 1}</TableCell>
                              <TableCell className="">{beneficiaria.nombre || beneficiaria.nombre_completo}</TableCell>
                              <TableCell>{beneficiaria.dpi || beneficiaria.numero_dpi}</TableCell>
                              <TableCell>{beneficiaria.sector || beneficiaria.nombre_sector}</TableCell>
                              <TableCell>
                                {beneficiaria.edad 
                                  ? `${beneficiaria.edad} años` 
                                  : beneficiaria.fecha_nacimiento 
                                    ? `${new Date().getFullYear() - new Date(beneficiaria.fecha_nacimiento).getFullYear()} años`
                                    : beneficiaria.fechaNacimiento
                                      ? `${new Date().getFullYear() - new Date(beneficiaria.fechaNacimiento).getFullYear()} años`
                                      : 'No especificada'
                                }
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No hay beneficiarias asignadas a este proyecto</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {selectedProject.observaciones && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Observaciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-900">{selectedProject.observaciones}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50 flex-shrink-0">
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowDetailsModal(false)
                      setSelectedProject(null)
                    }}
                  >
                    Cerrar
                  </Button>
                  <Button asChild>
                    <Link href={selectedProject.id_proyecto || selectedProject.id ? `/proyectos/${selectedProject.id_proyecto || selectedProject.id}/editar` : '#'}>Editar Proyecto</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="bg-gray-800 text-white py-4 mt-12">
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