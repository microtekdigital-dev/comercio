import * as React from 'react'

interface RepairOrderEmailProps {
  orderNumber: string
  customerName: string
  deviceType: string
  deviceBrand?: string
  deviceModel?: string
  estimatedCost: number
  message?: string
  companyName: string
}

export const RepairOrderEmail: React.FC<RepairOrderEmailProps> = ({
  orderNumber,
  customerName,
  deviceType,
  deviceBrand,
  deviceModel,
  estimatedCost,
  message,
  companyName,
}) => (
  <html>
    <head>
      <style>{`
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #2563eb;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background-color: #f9fafb;
          padding: 30px;
          border: 1px solid #e5e7eb;
        }
        .device-info {
          background-color: white;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
          border-left: 4px solid #2563eb;
        }
        .cost {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #6b7280;
          font-size: 14px;
        }
      `}</style>
    </head>
    <body>
      <div className="container">
        <div className="header">
          <h1>Presupuesto de Reparación</h1>
          <p>Orden #{orderNumber}</p>
        </div>
        
        <div className="content">
          <p>Estimado/a {customerName},</p>
          
          {message && (
            <p style={{ marginTop: '20px', marginBottom: '20px' }}>
              {message}
            </p>
          )}
          
          <div className="device-info">
            <h3 style={{ marginTop: 0 }}>Información del Dispositivo</h3>
            <p><strong>Tipo:</strong> {deviceType}</p>
            {deviceBrand && <p><strong>Marca:</strong> {deviceBrand}</p>}
            {deviceModel && <p><strong>Modelo:</strong> {deviceModel}</p>}
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '10px' }}>Costo Estimado:</p>
            <div className="cost">
              ${estimatedCost.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          
          <p style={{ marginTop: '30px' }}>
            Este presupuesto es una estimación basada en el diagnóstico inicial. 
            El costo final puede variar según los repuestos necesarios y la complejidad de la reparación.
          </p>
          
          <p>
            Para cualquier consulta, no dude en contactarnos.
          </p>
          
          <p style={{ marginTop: '30px' }}>
            Saludos cordiales,<br/>
            <strong>{companyName}</strong>
          </p>
        </div>
        
        <div className="footer">
          <p>Este es un correo automático, por favor no responder directamente.</p>
        </div>
      </div>
    </body>
  </html>
)
