"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  X,
  User,
  MapPin,
  Phone,
  Mail,
  UsersIcon,
  Home,
  CheckCircle,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useBeneficiarias } from "@/hooks/useBeneficiarias"
import { Beneficiaria } from "@/lib/api"
import { ProtectedRoute } from "@/components/ProtectedRoute"

// Using Beneficiaria from API types

export default function BeneficiariasPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedBeneficiaria, setSelectedBeneficiaria] = useState<Beneficiaria | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { beneficiarias, loading, deleteBeneficiaria } = useBeneficiarias()

  // Using data from API hook

  const filteredBeneficiarias = beneficiarias.filter(
    (beneficiaria) =>
      beneficiaria.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      beneficiaria.dpi.includes(searchTerm) ||
      beneficiaria.sector.toLowerCase().includes(searchTerm.toLowerCase())||
      beneficiaria.estado.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDeleteBeneficiaria = (beneficiaria: Beneficiaria) => {
    setSelectedBeneficiaria(beneficiaria)
    setShowDeleteModal(true)
  }

  const handleViewDetails = (beneficiaria: Beneficiaria) => {
    setSelectedBeneficiaria(beneficiaria)
    setShowDetailsModal(true)
  }

  const confirmDelete = async () => {
    if (!selectedBeneficiaria) return

    setIsDeleting(true)

    const success = await deleteBeneficiaria(selectedBeneficiaria.id_beneficiario)
    
    if (success) {
      setShowDeleteModal(false)
      setSelectedBeneficiaria(null)
    }
    
      setIsDeleting(false)
  }

  const exportBeneficiariasToCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "No.,Nombre,DPI,Edad,Teléfono,Email,Dirección,Sector,Habitantes,Terreno,Estado,Fecha de Registro\n" +
      beneficiarias
        .map(
          (b, index) =>
            `${index + 1},"${b.nombre}",${b.dpi},${b.edad},${b.telefono},"${b.correo}","${b.direccion}",${b.sector},${b.habitantes_domicilio},"${b.inmuebles}",${b.estado},${b.fechaRegistro ? new Date(b.fechaRegistro).toLocaleDateString() : 'N/A'}`,
        )
        .join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `reporte_beneficiarias_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success("Reporte exportado exitosamente", {
      description: "El archivo CSV ha sido descargado",
      icon: <Download className="h-4 w-4" />,
      duration: 3000,
    })
  }

  const exportBeneficiariasToExcel = async () => {
    try {
      const XLSX = await import("xlsx")

      const activas = beneficiarias.filter((b) => b.estado === "activa" || b.estado === "A").length
        const inactivas = beneficiarias.filter((b) => b.estado === "inactiva" || b.estado === "I").length
        const promedioEdad = Math.round(beneficiarias.reduce((sum, b) => sum + b.edad, 0) / beneficiarias.length)

      const worksheetData = [
        ["Dirección Municipal de la Mujer"],
        ["Reporte General de Beneficiarias"],
        [`Fecha de Generación: ${new Date().toLocaleDateString()}`],
        [`Total de Beneficiarias: ${beneficiarias.length}`],
        [`Total de Beneficiarias activas: ${activas}`],
        [`Total de Beneficiarias inactivas: ${inactivas}`],
        [`Promedio de Edad: ${promedioEdad} años`],
        [""],
        [
          "No.",
          "Nombre",
          "DPI",
          "Edad",
          "Teléfono",
          "Email",
          "Dirección",
          "Sector",
          "Habitantes",
          "Terreno",
          "Estado",
        ],
      ]

      beneficiarias.forEach((beneficiaria:any, index:number) => {
        worksheetData.push([
          index + 1,
          beneficiaria.nombre,
          beneficiaria.dpi,
          beneficiaria.edad,
          beneficiaria.telefono,
          beneficiaria.correo,
          beneficiaria.direccion,
          beneficiaria.sector,
          beneficiaria.habitantes_domicilio,
          beneficiaria.inmuebles,
          beneficiaria.estado,
        ])
      })

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 5 }, // No.
        { wch: 25 }, // Nombre
        { wch: 15 }, // DPI
        { wch: 8 }, // Edad
        { wch: 12 }, // Teléfono
        { wch: 25 }, // Email
        { wch: 40 }, // Dirección
        { wch: 15 }, // Sector
        { wch: 10 }, // Habitantes
        { wch: 12 }, // Terreno
        { wch: 10 }, // Estado
      ]

        
      worksheet["!cols"] = colWidths

      // Crear libro de trabajo
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Beneficiarias")

      // Descargar archivo
      XLSX.writeFile(workbook, `reporte_beneficiarias_${new Date().toISOString().split("T")[0]}.xlsx`)

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

  const exportBeneficiariasToPDF = async () => {
    try {
      const jsPDF = (await import("jspdf")).default
      const autoTable = (await import("jspdf-autotable")).default

      const doc = new jsPDF("l") // Orientación horizontal para más columnas

      // Título del documento
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("Dirección Municipal de la Mujer", 148, 20, { align: "center" })

      doc.setFontSize(14)
      doc.text("Reporte General de Beneficiarias", 148, 30, { align: "center" })

      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text(`Fecha de Generación: ${new Date().toLocaleDateString()}`, 148, 40, { align: "center" })
      doc.text(`Total de Beneficiarias: ${beneficiarias.length}`, 148, 50, { align: "center" })

      // Preparar datos para la tabla
      const tableData = beneficiarias.map((beneficiaria, index) => [
        index + 1,
        beneficiaria.nombre,
        beneficiaria.dpi,
        beneficiaria.edad,
        beneficiaria.telefono,
        beneficiaria.sector,
        beneficiaria.habitantes_domicilio,
        beneficiaria.inmuebles,
        beneficiaria.estado,
      ])

      // Crear tabla
      autoTable(doc, {
        head: [
          ["No.", "Nombre", "DPI", "Edad", "Teléfono", "Sector", "Habitantes", "Terreno", "Estado"],
        ],
        body: tableData,
        startY: 60,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 15, halign: "center" }, // No.
          1: { cellWidth: 55 }, // Nombre
          2: { cellWidth: 30 }, // DPI
          3: { cellWidth: 15, halign: "center" }, // Edad
          4: { cellWidth: 25 }, // Teléfono
          5: { cellWidth: 25 }, // Sector
          6: { cellWidth: 20, halign: "center" }, // Habitantes
          7: { cellWidth: 20 }, // Terreno
          8: { cellWidth: 25 }, // Estado
          //9: { cellWidth: 25 }, // Fecha Registro
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 20, left: 35, right: 10 },
      })

      // Agregar estadísticas al final
      const finalY = (doc as any).lastAutoTable.finalY || 60
      if (finalY < 180) {
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.text("ESTADÍSTICAS GENERALES", 20, finalY + 20)

        doc.setFont("helvetica", "normal")
        const activas = beneficiarias.filter((b) => b.estado === "activa" || b.estado === "A").length
        const inactivas = beneficiarias.filter((b) => b.estado === "inactiva" || b.estado === "I").length
        const promedioEdad = Math.round(beneficiarias.reduce((sum, b) => sum + b.edad, 0) / beneficiarias.length)

        doc.text(`• Total de Beneficiarias: ${beneficiarias.length}`, 20, finalY + 30)
        doc.text(`• Beneficiarias Activas: ${activas}`, 20, finalY + 40)
        doc.text(`• Beneficiarias Inactivas: ${inactivas}`, 20, finalY + 50)
        doc.text(`• Promedio de Edad: ${promedioEdad} años`, 20, finalY + 60)
      }

      // Descargar PDF
      doc.save(`reporte_beneficiarias_${new Date().toISOString().split("T")[0]}.pdf`)

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

  const exportBeneficiariaDetailToCSV = () => {
    if (!selectedBeneficiaria) return

    const beneficiaria = selectedBeneficiaria
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Campo,Valor\\n" +
      `Nombre Completo,${beneficiaria.nombre}\\n` +
      `DPI,${beneficiaria.dpi}\\n` +
      `Edad,${beneficiaria.edad} años\\n` +
      `Fecha de Nacimiento,${new Date(beneficiaria.fecha_nacimiento).toLocaleDateString()}\\n` +
      `Teléfono,${beneficiaria.telefono}\\n` +
      `Email,${beneficiaria.correo}\\n` +
      `Dirección,\"${beneficiaria.direccion}\"\\n` +
      `Sector,${beneficiaria.sector}\\n` +
      `Habitantes en Vivienda,${beneficiaria.habitantes_domicilio} personas\\n` +
      `Terreno,${beneficiaria.inmuebles}\\n` +
      `Estado,${beneficiaria.estado}\\n`

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `detalle_beneficiaria_${beneficiaria.nombre.replace(/\\s+/g, "_")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success("Detalles exportados exitosamente", {
      description: "El archivo CSV ha sido descargado",
      icon: <Download className="h-4 w-4" />,
      duration: 3000,
    })
  }

  const exportBeneficiariaDetailToExcel = async () => {
    if (!selectedBeneficiaria) return

    try {
      const XLSX = await import("xlsx")
      const beneficiaria = selectedBeneficiaria

      const worksheetData = [
        ["Dirección Municipal de la Mujer"],
        ["Detalle de Beneficiaria"],
        [`Fecha de Generación: ${new Date().toLocaleDateString()}`],
        [""],
        ["Información Personal"],
        ["Campo", "Valor"],
        ["Nombre Completo", beneficiaria.nombre],
        ["DPI", beneficiaria.dpi],
        ["Edad", `${beneficiaria.edad} años`],
        ["Fecha de Nacimiento", new Date(beneficiaria.fecha_nacimiento).toLocaleDateString()],
        [""],
        ["Información de Contacto"],
        ["Teléfono", beneficiaria.telefono],
        ["Email", beneficiaria.correo],
        ["Dirección", beneficiaria.direccion],
        ["Sector", beneficiaria.sector],
        [""],
        ["Información Socioeconómica"],
        ["Habitantes en Vivienda", `${beneficiaria.habitantes_domicilio} personas`],
        ["Terreno", beneficiaria.inmuebles],
        [""],
        ["Información del Registro"],
        ["Estado", beneficiaria.estado],
        /*[""],
        ["DOCUMENTOS"],
        ["DPI Frente", beneficiaria.dpi_frente ? "Disponible" : "No disponible"],
        ["DPI Reverso", beneficiaria.dpi_reverso ? "Disponible" : "No disponible"],*/
      ]

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 30 }, // Campo
        { wch: 50 }, // Valor
      ]
      worksheet["!cols"] = colWidths

      // Crear libro de trabajo
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Detalle Beneficiaria")

      // Descargar archivo
      XLSX.writeFile(workbook, `detalle_beneficiaria_${beneficiaria.nombre.replace(/\\s+/g, "_")}.xlsx`)

      toast.success("Detalles exportados exitosamente", {
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

  // Función auxiliar para convertir URL a base64 usando proxy del backend
const urlToBase64 = async (beneficiariaId: number, tipo: 'frente' | 'reverso'): Promise<string> => {
  try {
    // Usar proxy del backend en lugar de URL firmada directamente
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
    const proxyUrl = `${API_URL}/beneficiarias/${beneficiariaId}/imagen/${tipo}`
    
    //console.log(`Cargando imagen desde proxy: ${proxyUrl}`)
    
    const response = await fetch(proxyUrl, {
      credentials: 'include'  // Incluir cookies de autenticación
    })
    
    if (!response.ok) {
      throw new Error(`Error al cargar imagen: ${response.statusText}`)
    }
    
    const blob = await response.blob()
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error converting image to base64:', error)
    throw error
  }
}

// Función para obtener dimensiones de imagen
const getImageDimensions = (base64: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = reject
    img.src = base64
  })
}

const exportBeneficiariaDetailToPDF = async () => {
  if (!selectedBeneficiaria) return

  // Mostrar toast de carga
  const loadingToast = toast.loading("Generando PDF...", {
    description: "Procesando imágenes y creando documento",
  })

  try {
    const jsPDF = (await import("jspdf")).default
    const beneficiaria = selectedBeneficiaria
    const doc = new jsPDF()

    // Título del documento
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("Dirección Municipal de la Mujer", 105, 20, { align: "center" })

    doc.setFontSize(14)
    doc.text("Detalle de Beneficiaria", 105, 30, { align: "center" })

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

    // Información Personal
    addSection("Información Personal", {
      "Nombre Completo": beneficiaria.nombre,
      DPI: beneficiaria.dpi,
      Edad: `${beneficiaria.edad} años`,
      "Fecha de Nacimiento": new Date(beneficiaria.fecha_nacimiento).toLocaleDateString(),
    })

    // Información de Contacto
    addSection("Información de Contacto", {
      Teléfono: beneficiaria.telefono,
      Email: beneficiaria.correo || "N/A",
      Dirección: beneficiaria.direccion,
      Sector: beneficiaria.sector,
    })

    // Información Socioeconómica
    addSection("Información Socioeconómica", {
      "Habitantes en Vivienda": `${beneficiaria.habitantes_domicilio} personas`,
      Terreno: beneficiaria.inmuebles || "N/A",
    })

    // Información del Registro
    addSection("Información del Registro", {
      Estado: beneficiaria.estado === 'A' || beneficiaria.estado === 'activa' ? 'Activa' : 'Inactiva',
    })

    // Agregar imágenes del DPI si están disponibles
    if (beneficiaria.dpi_frente || beneficiaria.dpi_reverso) {
      // Nueva página para imágenes
      doc.addPage()
      yPosition = 20

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Documento Personal de Identificación", 105, yPosition, { align: "center" })
      yPosition += 15

      try {
        // DPI Frente
        if (beneficiaria.dpi_frente) {
          doc.setFontSize(12)
          doc.setFont("helvetica", "bold")
          doc.text("DPI - Frente", 20, yPosition)
          yPosition += 10

          //console.log('Cargando imagen frente...')
          
          // Convertir URL a base64 usando proxy
          const base64Frente = await urlToBase64(beneficiaria.id_beneficiario, 'frente')
          
          // Obtener dimensiones originales
          const dimensions = await getImageDimensions(base64Frente)
          
          //console.log('Dimensiones imagen frente:', dimensions)
          
          // Calcular dimensiones para el PDF (ancho máximo 170mm, altura máxima 80mm)
          const maxWidth = 170
          const maxHeight = 80
          let imgWidth = maxWidth
          let imgHeight = (dimensions.height * maxWidth) / dimensions.width

          if (imgHeight > maxHeight) {
            imgHeight = maxHeight
            imgWidth = (dimensions.width * maxHeight) / dimensions.height
          }

          // Centrar la imagen
          const xPosition = (doc.internal.pageSize.width - imgWidth) / 2

          // Agregar imagen al PDF
          doc.addImage(base64Frente, 'JPEG', xPosition, yPosition, imgWidth, imgHeight)
          yPosition += imgHeight + 15

          // Si no hay espacio para la segunda imagen, crear nueva página
          if (yPosition > 200) {
            doc.addPage()
            yPosition = 20
          }
        }

        // DPI Reverso
        if (beneficiaria.dpi_reverso) {
          doc.setFontSize(12)
          doc.setFont("helvetica", "bold")
          doc.text("DPI - Reverso", 20, yPosition)
          yPosition += 10

          //console.log('Cargando imagen reverso...')
          
          // Convertir URL a base64 usando proxy
          const base64Reverso = await urlToBase64(beneficiaria.id_beneficiario, 'reverso')
          
          // Obtener dimensiones originales
          const dimensions = await getImageDimensions(base64Reverso)
          
          //console.log('Dimensiones imagen reverso:', dimensions)
          
          // Calcular dimensiones para el PDF
          const maxWidth = 170
          const maxHeight = 80
          let imgWidth = maxWidth
          let imgHeight = (dimensions.height * maxWidth) / dimensions.width

          if (imgHeight > maxHeight) {
            imgHeight = maxHeight
            imgWidth = (dimensions.width * maxHeight) / dimensions.height
          }

          // Centrar la imagen
          const xPosition = (doc.internal.pageSize.width - imgWidth) / 2

          // Agregar imagen al PDF
          doc.addImage(base64Reverso, 'JPEG', xPosition, yPosition, imgWidth, imgHeight)
          yPosition += imgHeight + 10
        }
        
        //console.log('Imágenes agregadas exitosamente al PDF')
        
      } catch (error) {
        console.error('Error al agregar imágenes al PDF:', error)
        
        // Si falla la carga de imágenes, mostrar mensaje
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.text("Error al cargar las imágenes del DPI.", 20, yPosition)
        doc.text("Por favor, consulte el sistema en línea para visualizar las imágenes.", 20, yPosition + 10)
        
        toast.dismiss(loadingToast)
        toast.warning("PDF generado con advertencias", {
          description: "No se pudieron cargar todas las imágenes. El documento contiene la información textual.",
          duration: 4000,
        })
      }
    } else {
      // Si no hay imágenes disponibles
      if (yPosition > 200) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("Documento Personal de Identificación", 20, yPosition)
      yPosition += 15

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text("No hay imágenes del DPI disponibles en el sistema.", 20, yPosition)
    }

    // Descargar PDF
    doc.save(`detalle_beneficiaria_${beneficiaria.nombre.replace(/\s+/g, "_")}.pdf`)

    // Cerrar toast de carga y mostrar éxito
    toast.dismiss(loadingToast)
    toast.success("Detalles exportados exitosamente", {
      description: "El archivo PDF ha sido descargado con las imágenes del DPI",
      icon: <FileText className="h-4 w-4" />,
      duration: 3000,
    })
  } catch (error) {
    console.error("Error al exportar a PDF:", error)
    toast.dismiss(loadingToast)
    toast.error("Error al exportar a PDF", {
      description: "Ocurrió un error al generar el documento. Por favor, intente nuevamente.",
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
              <p className="mt-4 text-gray-600">Cargando beneficiarias...</p>
            </div>
          </main>
        </ProtectedRoute>
      )
    }

  return (
    <ProtectedRoute allowedRoles={["Directora", "Administrador", "Tecnica"]}>
      <div className="min-h-screen">
        <Navbar />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">Beneficiarias</h1>
            
          </div>
          </div>
          <div className="w-full justify-end flex gap-6">
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 border-t bg-white ">
                  <Download className="h-4 w-4" />
                  Descargar Reporte
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportBeneficiariasToCSV}>
                  <FileText className="h-4 w-4 mr-2" />
                  Reporte CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportBeneficiariasToExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Reporte Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportBeneficiariasToPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Reporte PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          <Button asChild>
            <Link href="/beneficiarias/nueva">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Beneficiaria
            </Link>
          </Button>
          </div>
        

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Beneficiarias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : beneficiarias.length.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                 {loading ? "..." : beneficiarias.filter(b => b.estado === "activa" || b.estado === "A").length.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Inactivas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {loading ? "..." : beneficiarias.filter(b => b.estado === "inactiva").length.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Promedio Edad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : beneficiarias.length > 0 
                  ? Math.round(beneficiarias.reduce((sum, b) => sum + b.edad, 0) / beneficiarias.length)
                  : 0} años
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barra de búsqueda */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nombre, DPI, sector o estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </div>

        {/* Tabla de beneficiarias */}
        <div className="overflow-hidden rounded-xl shadow-md border border-gray-200">
          <Table className="w-full border-collapse">
            <TableHeader>
              <TableRow className="bg-gray-800 hover:bg-gray-900 text-white">
                <TableHead className="font-bold text-white first:rounded-tl-lg">Nombre</TableHead>
                <TableHead className="font-bold text-white">DPI</TableHead>
                <TableHead className="font-bold text-white">Edad</TableHead>
                <TableHead className="font-bold text-white">Teléfono</TableHead>
                <TableHead className="font-bold text-white">Sector</TableHead>
                <TableHead className="font-bold text-white">Estado</TableHead>
                <TableHead className="font-bold text-white text-right last:rounded-tr-lg">Acciones</TableHead>
              </TableRow>
            </TableHeader>
              <TableBody className="bg-white">
                {filteredBeneficiarias.map((beneficiaria, index) => (
                  <TableRow key={beneficiaria.id_beneficiario || `beneficiaria-${index}`}>
                    <TableCell className="font-medium">{beneficiaria.nombre}</TableCell>
                    <TableCell>{beneficiaria.dpi}</TableCell>
                    <TableCell>{beneficiaria.edad} años</TableCell>
                    <TableCell>{beneficiaria.telefono}</TableCell>
                    <TableCell>{beneficiaria.sector}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          beneficiaria.estado === "activa" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }
                      >
                        {beneficiaria.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(beneficiaria)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/beneficiarias/${beneficiaria.id_beneficiario}/editar`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteBeneficiaria(beneficiaria)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          

        {filteredBeneficiarias.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron beneficiarias que coincidan con la búsqueda.</p>
          </div>
        )}
      </main>

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && selectedBeneficiaria && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Eliminar Beneficiaria</h3>
                <p className="text-sm text-gray-500 mb-4">
                  ¿Está seguro que desea eliminar a la beneficiaria "{selectedBeneficiaria.nombre}"? Esta acción no se
                  puede deshacer y se eliminarán todos los datos asociados.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Advertencia:</strong> Se eliminarán todos los registros de participación en proyectos y el
                    historial asociado.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSelectedBeneficiaria(null)
                  }}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button 
                type="button" 
                variant="destructive" 
                className="hover:bg-destructive/60 hover:text-white"
                onClick={confirmDelete} disabled={isDeleting}>
                  {isDeleting ? "Eliminando..." : "Eliminar Beneficiaria"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalles de la beneficiaria */}
      {showDetailsModal && selectedBeneficiaria && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{selectedBeneficiaria.nombre}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      className={
                        selectedBeneficiaria.estado === "activa"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {selectedBeneficiaria.estado}
                    </Badge>
                    <span className="text-sm text-gray-500">
                       
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedBeneficiaria(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                        <Download className="h-4 w-4" />
                        Descargar Detalles
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={exportBeneficiariaDetailToCSV}>
                        <FileText className="h-4 w-4 mr-2" />
                        Detalles CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={exportBeneficiariaDetailToExcel}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Detalles Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={exportBeneficiariaDetailToPDF}>
                        <FileText className="h-4 w-4 mr-2" />
                        Detalles PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
            </div>

            
            

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Información Personal */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Información Personal
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-semibold text-gray-900">Nombre Completo</Label>
                          <p className="text-sm text-gray-900 mt-1">{selectedBeneficiaria.nombre}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-gray-900">DPI</Label>
                          <p className="text-sm text-gray-900 mt-1">{selectedBeneficiaria.dpi}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-semibold text-gray-900">Edad</Label>
                          <p className="text-sm text-gray-900 mt-1">{selectedBeneficiaria.edad} años</p>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-gray-900">Fecha de Nacimiento</Label>
                          <p className="text-sm text-gray-900 mt-1">
                            {new Date(selectedBeneficiaria.fecha_nacimiento).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Información de Contacto
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold text-gray-900">Dirección</Label>
                        <p className="text-sm text-gray-900 mt-1">{selectedBeneficiaria.direccion}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-semibold text-gray-900">Sector</Label>
                          <p className="text-sm text-gray-900 mt-1">{selectedBeneficiaria.sector}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            Teléfono
                          </Label>
                          <p className="text-sm text-gray-900 mt-1">{selectedBeneficiaria.telefono}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          Correo Electrónico
                        </Label>
                        <p className="text-sm text-gray-900 mt-1">{selectedBeneficiaria.correo}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Home className="h-5 w-5" />
                        Información Socioeconómica
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                            <UsersIcon className="h-4 w-4" />
                            Habitantes en la Vivienda
                          </Label>
                          <p className="text-sm text-gray-900 mt-1">{selectedBeneficiaria.habitantes_domicilio} personas</p>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-gray-900">Terreno</Label>
                          <p className="text-sm text-gray-900 mt-1">{selectedBeneficiaria.inmuebles}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Imágenes del DPI */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Documento de Identificación</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* DPI Frente */}
                        <div>
                          <Label className="text-sm font-medium text-gray-600 mb-2 block">DPI - Frente</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                            {selectedBeneficiaria.dpi_frente_url ? (
                              <div className="text-center">
                                <img
                                  src={selectedBeneficiaria.dpi_frente_url}
                                  alt={`DPI Frente de ${selectedBeneficiaria.nombre}`}
                                  className="w-full h-auto rounded-lg shadow-sm"
                                  onError={(e) => {
                                    //console.error('Error cargando imagen DPI frente:', e);
                                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNhZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
                                    //e.currentTarget.alt = "Imagen no disponible";
                                  }}
                                />
                                <p className="text-xs text-gray-500 mt-2">Frente del DPI</p>
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <User className="mx-auto h-8 w-8 text-gray-400" />
                                <p className="mt-2 text-xs text-gray-500">No hay imagen del frente disponible</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* DPI Reverso */}
                        <div>
                          <Label className="text-sm font-medium text-gray-600 mb-2 block">DPI - Reverso</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                            {selectedBeneficiaria.dpi_reverso_url ? (
                              <div className="text-center">
                                <img
                                  src={selectedBeneficiaria.dpi_reverso_url}
                                  alt={`DPI Reverso de ${selectedBeneficiaria.nombre}`}
                                  className="w-full h-auto rounded-lg shadow-sm"
                                  onError={(e) => {
                                    //console.error('Error cargando imagen DPI reverso:', e);
                                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNhZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
                                    //e.currentTarget.alt = "Imagen no disponible";
                                  }}
                                />
                                <p className="text-xs text-gray-500 mt-2">Reverso del DPI</p>
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <User className="mx-auto h-8 w-8 text-gray-400" />
                                <p className="mt-2 text-xs text-gray-500">No hay imagen del reverso disponible</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-center">
                          <p className="text-xs text-gray-500">DPI: {selectedBeneficiaria.dpi}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex-shrink-0">
              
                
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowDetailsModal(false)
                      setSelectedBeneficiaria(null)
                    }}
                  >
                    Cerrar
                  </Button>
                  <Button asChild>
                    <Link href={`/beneficiarias/${selectedBeneficiaria.id_beneficiario}/editar`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Beneficiaria
                    </Link>
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
