import * as React from "react"

interface QuoteEmailProps {
  quoteNumber: string
  companyName: string
  customerName: string
  quoteDate: string
  validUntil: string
  total: string
  currency: string
  message: string
  items: Array<{
    product_name: string
    variant_name?: string | null
    quantity: number
    unit_price: number
    total: number
  }>
}

export const QuoteEmail: React.FC<QuoteEmailProps> = ({
  quoteNumber,
  companyName,
  customerName,
  quoteDate,
  validUntil,
  total,
  currency,
  message,
  items,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Presupuesto {quoteNumber}</title>
      </head>
      <body
        style={{
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          lineHeight: "1.6",
          color: "#333",
          maxWidth: "600px",
          margin: "0 auto",
          padding: "20px",
          backgroundColor: "#f3f4f6",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "30px",
            borderRadius: "10px 10px 0 0",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              color: "white",
              margin: 0,
              fontSize: "28px",
            }}
          >
            Presupuesto {quoteNumber}
          </h1>
          <p
            style={{
              color: "rgba(255, 255, 255, 0.9)",
              margin: "10px 0 0 0",
              fontSize: "16px",
            }}
          >
            {companyName}
          </p>
        </div>

        {/* Content */}
        <div
          style={{
            background: "#ffffff",
            padding: "40px",
            border: "1px solid #e5e7eb",
            borderTop: "none",
            borderRadius: "0 0 10px 10px",
          }}
        >
          <p style={{ fontSize: "16px", marginBottom: "20px" }}>
            Estimado/a {customerName},
          </p>

          <p
            style={{
              fontSize: "16px",
              marginBottom: "30px",
              whiteSpace: "pre-line",
            }}
          >
            {message}
          </p>

          {/* Quote Details */}
          <div
            style={{
              background: "#f9fafb",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "30px",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "8px 0",
                      fontWeight: 600,
                      color: "#6b7280",
                    }}
                  >
                    Fecha:
                  </td>
                  <td style={{ padding: "8px 0", textAlign: "right" }}>
                    {quoteDate}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "8px 0",
                      fontWeight: 600,
                      color: "#6b7280",
                    }}
                  >
                    Válido hasta:
                  </td>
                  <td style={{ padding: "8px 0", textAlign: "right" }}>
                    {validUntil}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Items Table */}
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              marginBottom: "15px",
              color: "#1f2937",
            }}
          >
            Detalle
          </h2>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "30px",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid #e5e7eb",
                  backgroundColor: "#f9fafb",
                }}
              >
                <th
                  style={{
                    padding: "12px 8px",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#6b7280",
                  }}
                >
                  Producto
                </th>
                <th
                  style={{
                    padding: "12px 8px",
                    textAlign: "right",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#6b7280",
                  }}
                >
                  Cant.
                </th>
                <th
                  style={{
                    padding: "12px 8px",
                    textAlign: "right",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#6b7280",
                  }}
                >
                  Precio
                </th>
                <th
                  style={{
                    padding: "12px 8px",
                    textAlign: "right",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#6b7280",
                  }}
                >
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <td
                    style={{
                      padding: "12px 8px",
                      fontSize: "14px",
                    }}
                  >
                    {item.product_name}
                    {item.variant_name && (
                      <div style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginTop: "4px",
                      }}>
                        {item.variant_name}
                      </div>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "12px 8px",
                      textAlign: "right",
                      fontSize: "14px",
                    }}
                  >
                    {item.quantity}
                  </td>
                  <td
                    style={{
                      padding: "12px 8px",
                      textAlign: "right",
                      fontSize: "14px",
                    }}
                  >
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td
                    style={{
                      padding: "12px 8px",
                      textAlign: "right",
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total */}
          <div
            style={{
              background: "#f9fafb",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#1f2937",
                }}
              >
                Total:
              </span>
              <span
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#667eea",
                }}
              >
                {total}
              </span>
            </div>
          </div>

          {/* Validity Warning */}
          <div
            style={{
              background: "#fef3c7",
              border: "1px solid #fbbf24",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#92400e",
                fontSize: "14px",
              }}
            >
              <strong>⏰ Importante:</strong> Este presupuesto es válido hasta
              el {validUntil}.
            </p>
          </div>

          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "30px" }}>
            Quedamos a su disposición para cualquier consulta o aclaración.
          </p>

          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "20px" }}>
            Saludos cordiales,
            <br />
            <strong>{companyName}</strong>
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: "30px",
            padding: "20px",
            color: "#9ca3af",
            fontSize: "12px",
          }}
        >
          <p>Este email fue enviado por {companyName}</p>
          <p style={{ marginTop: "10px" }}>
            © {new Date().getFullYear()} Todos los derechos reservados
          </p>
        </div>
      </body>
    </html>
  )
}
