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
  GraduationCap,
} from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useCapacitaciones } from "@/hooks/useCapacitaciones"

export default function CapacitacionesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedCapacitacion, setSelectedCapacitacion] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sectoresCapacitacion, setSectoresCapacitacion] = useState<any[]>([])
  const [beneficiariasCapacitacion, setBeneficiariasCapacitacion] = useState<any[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [sectoresPorCapacitacion, setSectoresPorCapacitacion] = useState<{[key: number]: any[]}>({})
  const [loadingSectores, setLoadingSectores] = useState<{[key: number]: boolean}>({})
  const [cantidadBeneficiarias, setCantidadBeneficiarias] = useState<{[key: number]: number}>({})
  const [loadingCantidad, setLoadingCantidad] = useState<{[key: number]: boolean}>({})

  // Hook para obtener capacitaciones de la API
  const { capacitaciones, loading, error, getSectoresCapacitacion, getBeneficiariasCapacitacion, getBeneficiariasDetalleCapacitacion, getCantidadBeneficiariasCapacitacion, deleteCapacitacion, fetchCapacitaciones } = useCapacitaciones()

  const filteredCapacitaciones = capacitaciones.filter(
    (capacitacion) =>
      capacitacion.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      capacitacion.descripcion.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Función optimizada para cargar datos de capacitaciones con throttling
  const loadCapacitacionData = async (capacitacionId: number) => {
    try {
      // Cargar sectores y cantidad en paralelo
      const [sectoresResponse, cantidadResponse] = await Promise.allSettled([
        getSectoresCapacitacion(capacitacionId),
        getCantidadBeneficiariasCapacitacion(capacitacionId)
      ])

      // Procesar sectores
      if (sectoresResponse.status === 'fulfilled' && sectoresResponse.value.success) {
        setSectoresPorCapacitacion(prev => ({
          ...prev,
          [capacitacionId]: sectoresResponse.value.data || []
        }))
      } else {
        setSectoresPorCapacitacion(prev => ({
          ...prev,
          [capacitacionId]: []
        }))
      }

      // Procesar cantidad
      if (cantidadResponse.status === 'fulfilled' && cantidadResponse.value.success) {
        setCantidadBeneficiarias(prev => ({
          ...prev,
          [capacitacionId]: cantidadResponse.value.data?.cantidad || 0
        }))
      } else {
        setCantidadBeneficiarias(prev => ({
          ...prev,
          [capacitacionId]: 0
        }))
      }
    } catch (error) {
      console.error(`Error loading data for capacitacion ${capacitacionId}:`, error)
    }
  }

  // Cargar datos de capacitaciones de forma optimizada con delay
  useEffect(() => {
    if (capacitaciones.length > 0) {
      // Cargar datos en lotes de 2 capacitaciones a la vez con delay
      const batchSize = 2
      const batches = []
      
      for (let i = 0; i < capacitaciones.length; i += batchSize) {
        batches.push(capacitaciones.slice(i, i + batchSize))
      }

      // Procesar cada lote con un delay
      batches.forEach((batch, batchIndex) => {
        setTimeout(() => {
          batch.forEach((capacitacion) => {
            const capacitacionId = capacitacion.id_capacitacion
            if (capacitacionId && 
                (!sectoresPorCapacitacion[capacitacionId] || cantidadBeneficiarias[capacitacionId] === undefined)) {
              loadCapacitacionData(capacitacionId)
            }
          })
        }, batchIndex * 500) // 500ms entre lotes para evitar sobrecarga
      })
    }
  }, [capacitaciones])

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "activo":
        return "bg-green-100 text-yellow-800"
      case "completado":
        return "bg-green-100 text-green-800"
      case "en proceso":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleViewDetails = async (capacitacion: any) => {
    const capacitacionId = capacitacion.id_capacitacion || capacitacion.id
    setSelectedCapacitacion(capacitacion)
    setShowDetailsModal(true)
    setLoadingDetails(true)
    
    try {
      // Cargar sectores y beneficiarias de la capacitación
      const [sectoresResponse, beneficiariasResponse] = await Promise.allSettled([
        getSectoresCapacitacion(capacitacionId),
        getBeneficiariasDetalleCapacitacion(capacitacionId)
      ])

      if (sectoresResponse.status === 'fulfilled' && sectoresResponse.value.success) {
        setSectoresCapacitacion(sectoresResponse.value.data || [])
      } else {
        setSectoresCapacitacion([])
      }

      if (beneficiariasResponse.status === 'fulfilled' && beneficiariasResponse.value.success) {
        setBeneficiariasCapacitacion(beneficiariasResponse.value.data || [])
      } else {
        setBeneficiariasCapacitacion([])
      }
    } catch (error) {
      console.error('Error loading details:', error)
      setSectoresCapacitacion([])
      setBeneficiariasCapacitacion([])
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleDeleteCapacitacion = (capacitacion: any) => {
    setSelectedCapacitacion(capacitacion)
    setShowDeleteModal(true)
  }

  const calcularEdad = (fechaNacimiento: string) => {
    try {
      const fecha = new Date(fechaNacimiento)
      const hoy = new Date()
      const edad = hoy.getFullYear() - fecha.getFullYear()
      const mes = hoy.getMonth() - fecha.getMonth()
      
      if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
        return `${edad - 1} años`
      }
      
      return `${edad} años`
    } catch (error) {
      console.error('Error calculando edad:', error)
      return 'No especificada'
    }
  }

  const confirmDelete = async () => {
    if (!selectedCapacitacion) return

    setIsDeleting(true)

    try {
      const success = await deleteCapacitacion(selectedCapacitacion.id_capacitacion)
      
      if (success) {
        toast.success("Capacitación eliminada exitosamente", {
          description: `${selectedCapacitacion.nombre} ha sido eliminada del sistema`,
          icon: <CheckCircle className="h-4 w-4" />,
          duration: 4000,
        })

        setShowDeleteModal(false)
        setSelectedCapacitacion(null)
        
        // Recargar la lista de capacitaciones
        await fetchCapacitaciones()
      } else {
        toast.error("Error al eliminar capacitación", {
          description: "No se pudo eliminar la capacitación",
          duration: 4000,
        })
      }
      
    } catch (error) {
      console.error('Error deleting capacitacion:', error)
      toast.error("Error al eliminar capacitación", {
        description: "Hubo un problema al eliminar la capacitación",
        duration: 4000,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const exportToCSV = () => {
    const participants = beneficiariasCapacitacion || []
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "No.,Nombre,DPI,Sector,Edad,Firma de Asistencia\n" +
      participants.map((b: any, index: number) => `${index + 1},${b.nombre},${b.dpi},${b.sector},${b.edad},`).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `participantes_${selectedCapacitacion.nombre.replace(/\s+/g, "_")}.csv`)
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
      const participants = beneficiariasCapacitacion || []

      const worksheetData = [
        ["Dirección Municipal de la Mujer de Salcajá"],
        ["Lista de participantes"],
        [`Capacitación: ${selectedCapacitacion.nombre}`],
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
      XLSX.writeFile(workbook, `participantes_${selectedCapacitacion.nombre.replace(/\s+/g, "_")}.xlsx`)

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

      const participants = beneficiariasCapacitacion || []
      const doc = new jsPDF()

      // Título del documento
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("Dirección Municipal de la Mujer de Salcajá", 105, 20, { align: "center" })

      doc.setFontSize(14)
      doc.text("Lista de participantes", 105, 30, { align: "center" })

      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text(`Capacitación: ${selectedCapacitacion.nombre}`, 20, 45)
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
      doc.save(`participantes_${selectedCapacitacion.nombre.replace(/\s+/g, "_")}.pdf`)

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

  const exportCapacitacionReportToCSV = () => {
    const capacitacion = selectedCapacitacion
    const participants = beneficiariasCapacitacion || []

    let csvContent =
      "data:text/csv;charset=utf-8," +
      "Campo,Valor\n" +
      `Nombre de la Capacitación,${capacitacion.nombre}\n` +
      `Descripción,${capacitacion.descripcion}\n` +
      `Tipo de Capacitación,${capacitacion.tipo_capacitacion}\n` +
      `Estado,${capacitacion.estado}\n` +
      `Fecha de Inicio,${new Date(capacitacion.fecha_inicio).toLocaleDateString()}\n` +
      `Fecha de Finalización,${new Date(capacitacion.fecha_fin).toLocaleDateString()}\n` +
      `Alcance,"${capacitacion.alcance}"\n` +
      `Población Meta,"${capacitacion.poblacion_meta}"\n` +
      `Recursos Materiales,"${capacitacion.recursos_materiales}"\n` +
      `Recursos Económicos,"${capacitacion.recursos_economicos}"\n` +
      `Observaciones,"${capacitacion.observaciones}"\n` +
      `Cobertura de la Capacitación,"${sectoresCapacitacion.map((c: any) => c.nombre || c.sector || c.nombre_sector).join(", ")}"\n` +
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
    link.setAttribute("download", `reporte_capacitacion_${capacitacion.nombre.replace(/\s+/g, "_")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success("Reporte exportado exitosamente", {
      description: "El archivo CSV ha sido descargado",
      icon: <Download className="h-4 w-4" />,
      duration: 3000,
    })
  }

  const exportCapacitacionReportToExcel = async () => {
    try {
      const XLSX = await import("xlsx")
      const capacitacion = selectedCapacitacion
      const participants = beneficiariasCapacitacion || []

      const worksheetData = [
        ["Dirección Municipal de la Mujer de Salcajá"],
        ["Reporte Detallado de la Capacitación"],
        [`Fecha de Generación: ${new Date().toLocaleDateString()}`],
        [""],
        ["Información General"],
        ["Nombre de la Capacitación", capacitacion.nombre],
        ["Descripción", capacitacion.descripcion],
        ["Tipo de Capacitación", capacitacion.tipo_capacitacion],
        ["Estado", capacitacion.estado],
        ["Fecha de Inicio", new Date(capacitacion.fecha_inicio).toLocaleDateString()],
        ["Fecha de Finalización", new Date(capacitacion.fecha_fin).toLocaleDateString()],
        ["Número de Beneficiarias", participants.length],
        [""],
        ["Alacance y Población"],
        ["Alcance", capacitacion.alcance],
        ["Población Meta", capacitacion.poblacion_meta],
        ["Cobertura de la capacitación", sectoresCapacitacion.map((c: any) => c.nombre || c.sector || c.nombre_sector).join(", ")],
        [""],
        ["Recursos"],
        ["Recursos Materiales", capacitacion.recursos_materiales],
        ["Recursos Económicos", capacitacion.recursos_economicos],
        [""],
        ["Observaciones", capacitacion.observaciones || "N/A"],
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
        { wch: 70 }, // Valor/Nombre
        { wch: 20 }, // DPI
        { wch: 25 }, // Sector
        { wch: 10 }, // Edad
      ]
      worksheet["!cols"] = colWidths

      // Crear libro de trabajo
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte Capacitación")

      // Descargar archivo
      XLSX.writeFile(workbook, `reporte_capacitacion_${capacitacion.nombre.replace(/\s+/g, "_")}.xlsx`)

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

  const exportCapacitacionReportToPDF = async () => {
    try {
      const jsPDF = (await import("jspdf")).default
      const autoTable = (await import("jspdf-autotable")).default
      const capacitacion = selectedCapacitacion
      const doc = new jsPDF()

      // Título del documento
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("Dirección Municipal de la Mujer de Salcajá", 105, 20, { align: "center" })

      doc.setFontSize(14)
      doc.text("Reporte detallado de la capacitación", 105, 30, { align: "center" })

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
        "Nombre de la Capacitación": capacitacion.nombre,
        Descripción: capacitacion.descripcion,
        "Tipo de Capacitación": capacitacion.tipo_capacitacion,
        Estado: capacitacion.estado,
        "Fecha de Inicio": new Date(capacitacion.fecha_inicio).toLocaleDateString(),
        "Fecha de Finalización": new Date(capacitacion.fecha_fin).toLocaleDateString(),
      })

      // Alcance y Población
      addSection("Alcance y Población", {
        Alcance: capacitacion.alcance,
        "Población Meta": capacitacion.poblacion_meta,
        "Cobertura de la Capacitación": sectoresCapacitacion.map((c: any) => c.nombre || c.sector || c.nombre_sector).join(", "),
      })

      // Recursos
      addSection("Recursos", {
        "Recursos Materiales": capacitacion.recursos_materiales,
        "Recursos Económicos": capacitacion.recursos_economicos,
      })

      // Observaciones
      if (capacitacion.observaciones) {
        addSection("Observaciones", {
          Observaciones: capacitacion.observaciones,
        })
      }

      const participants = beneficiariasCapacitacion || []
      if (participants.length > 0) {
        // Verificar si necesitamos una nueva página
        if (yPosition > 200) {
          doc.addPage()
          yPosition = 20
        }

        // Título de la sección de participantes
        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")
        doc.text("Lista de Participantes", 20, yPosition)
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
      doc.save(`reporte_capacitacion_${capacitacion.nombre.replace(/\s+/g, "_")}.pdf`)

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
              <p className="mt-4 text-gray-600">Cargando capacitaciones...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Capacitaciones</h1>
              <p className="mt-2 text-gray-600"></p>
            </div>            
          </div>
          <div className="w-full justify-end flex gap-6"> 
              <Button asChild>
              <Link href="/capacitaciones/nueva">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Capacitación
              </Link>
            </Button>
            </div>

          {/* Barra de búsqueda */}
          <div className="mb-6 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar capacitaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
          </div>

          {/* Lista de capacitaciones */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando capacitaciones...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
                <p>Error al cargar capacitaciones</p>
                <p className="text-sm text-gray-500">{error}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
                {filteredCapacitaciones.sort((a, b) => a.estado === "en proceso" ? -1 : 1).map((capacitacion, index) => (
                <Card key={capacitacion.id_capacitacion || `capacitacion-${index}`} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{capacitacion.nombre}</CardTitle>
                      <Badge className={getEstadoColor(capacitacion.estado)}>{capacitacion.estado}</Badge>
                    </div>
                    <CardDescription className="text-sm">{capacitacion.descripcion}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        {loadingCantidad[capacitacion.id_capacitacion] ? (
                          <span className="text-sm text-gray-500">Cargando...</span>
                        ) : (
                          `${cantidadBeneficiarias[capacitacion.id_capacitacion] || 0} participantes`
                        )}
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <div className="flex flex-wrap gap-1">
                          {loadingSectores[capacitacion.id_capacitacion] ? (
                            <span className="text-sm text-gray-500">Cargando sectores...</span>
                          ) : sectoresPorCapacitacion[capacitacion.id_capacitacion] && sectoresPorCapacitacion[capacitacion.id_capacitacion].length > 0 ? (
                            sectoresPorCapacitacion[capacitacion.id_capacitacion].map((sector: any, index: number) => (
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
                        {new Date(capacitacion.fecha_inicio).toLocaleDateString()} -{" "}
                        {new Date(capacitacion.fecha_fin).toLocaleDateString()}
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        {capacitacion.tipo_capacitacion}
                      </div>

                      <div className="pt-2 border-t">
                        <p className="text-sm font-medium text-gray-900">Recursos económicos: {capacitacion.recursos_economicos || "No especificado"}</p>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => handleViewDetails(capacitacion)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalles
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                          <Link href={`/capacitaciones/${capacitacion.id_capacitacion}/editar`}>Editar</Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                          onClick={() => handleDeleteCapacitacion(capacitacion)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredCapacitaciones.length === 0 && (
                <div className="text-center py-12 col-span-full">
                  <p className="text-gray-500">No se encontraron capacitaciones que coincidan con la búsqueda.</p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Modal de confirmación de eliminación */}
        {showDeleteModal && selectedCapacitacion && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Eliminar Capacitación</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    ¿Estás seguro de que quieres eliminar "{selectedCapacitacion.nombre}"? Esta acción no se puede deshacer y se eliminarán todos los datos asociados..
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
        {showDetailsModal && selectedCapacitacion && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    
                    <h2 className="text-2xl font-bold text-gray-900">{selectedCapacitacion.nombre}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getEstadoColor(selectedCapacitacion.estado)}>{selectedCapacitacion.estado}</Badge>
                    <span className="text-sm text-gray-500">
                      {selectedCapacitacion.fecha_inicio ? new Date(selectedCapacitacion.fecha_inicio).toLocaleDateString() : "No especificada"}
                      {" - "}
                      {selectedCapacitacion.fecha_fin ? new Date(selectedCapacitacion.fecha_fin).toLocaleDateString() : "No especificada"}
                    </span>
                    </div>
                    </div>
                      <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowDetailsModal(false)
                      setSelectedCapacitacion(null)
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
                      <DropdownMenuItem onClick={exportCapacitacionReportToCSV}>
                        <FileText className="h-4 w-4 mr-2" />
                        Reporte CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={exportCapacitacionReportToExcel}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Reporte Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={exportCapacitacionReportToPDF}>
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
                        <p className="text-sm text-gray-900 mt-1">{selectedCapacitacion.descripcion}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-900">Tipo de Capacitación</Label>
                        <p className="text-sm text-gray-900 mt-1">{selectedCapacitacion.tipo_capacitacion}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-900">Recursos materiales</Label>
                        <p className="text-sm text-gray-900 mt-1">{selectedCapacitacion.recursos_materiales}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-900">Recursos económicos</Label>
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedCapacitacion.recursos_economicos || "No especificado"}
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
                        <p className="text-sm text-gray-900 mt-1">{selectedCapacitacion.alcance}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-900">Población Meta</Label>
                        <p className="text-sm text-gray-900 mt-1">{selectedCapacitacion.poblacion_meta}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-900">Cobertura</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {loadingDetails ? (
                            <span className="text-sm text-gray-500">Cargando sectores...</span>
                          ) : sectoresCapacitacion && sectoresCapacitacion.length > 0 ? (
                            sectoresCapacitacion.map((sector: any, index: number) => (
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

                {/* Participantes de la Capacitación */}
                <Card className="mt-6">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg">Participantes de la Capacitación</CardTitle>
                        <CardDescription>
                          {loadingDetails ? "Cargando participantes..." : `${beneficiariasCapacitacion.length} participantes inscritos`}
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
                        <p>Cargando participantes...</p>
                      </div>
                    ) : beneficiariasCapacitacion && beneficiariasCapacitacion.length > 0 ? (
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
                          {beneficiariasCapacitacion.map((beneficiaria: any, index: number) => (
                            <TableRow key={beneficiaria.id || `beneficiaria-${index}`}>
                              <TableCell className="font-medium">{index + 1}</TableCell>
                              <TableCell className="">{beneficiaria.nombre || beneficiaria.nombre_completo}</TableCell>
                              <TableCell>{beneficiaria.dpi || beneficiaria.numero_dpi}</TableCell>
                              <TableCell>{beneficiaria.sector || beneficiaria.nombre_sector}</TableCell>
                              <TableCell>
                                {beneficiaria.edad 
                                  ? `${beneficiaria.edad} años` 
                                  : beneficiaria.fecha_nacimiento 
                                    ? calcularEdad(beneficiaria.fecha_nacimiento)
                                    : beneficiaria.fechaNacimiento
                                      ? calcularEdad(beneficiaria.fechaNacimiento)
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
                        <p>No hay participantes asignados a esta capacitación</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {selectedCapacitacion.observaciones && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Observaciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-900">{selectedCapacitacion.observaciones}</p>
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
                      setSelectedCapacitacion(null)
                    }}
                  >
                    Cerrar
                  </Button>
                  <Button asChild>
                    <Link href={`/capacitaciones/${selectedCapacitacion.id_capacitacion}/editar`}>Editar Capacitación</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="bg-gray-800 text-white py-4 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 Dirección Municipal de la Mujer de Salcajá. Todos los derechos reservados.</p>
          <p>Desarrollado por: Kevin Rafael Ovalle Lemus.</p>
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
