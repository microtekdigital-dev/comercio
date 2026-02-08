import * as React from "react";

interface InvitationEmailProps {
  inviteLink: string;
  companyName: string;
  invitedBy: string;
  role: "admin" | "employee";
}

export const InvitationEmail: React.FC<InvitationEmailProps> = ({
  inviteLink,
  companyName,
  invitedBy,
  role,
}) => {
  const roleText = role === "admin" ? "Administrador" : "Empleado";

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Invitación a {companyName}</title>
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
            ¡Has sido invitado!
          </h1>
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
          <p style={{ fontSize: "16px", marginBottom: "20px" }}>Hola,</p>

          <p style={{ fontSize: "16px", marginBottom: "20px" }}>
            <strong>{invitedBy}</strong> te ha invitado a unirte a{" "}
            <strong>{companyName}</strong> como <strong>{roleText}</strong>.
          </p>

          <p style={{ fontSize: "16px", marginBottom: "30px" }}>
            Haz clic en el botón de abajo para aceptar la invitación y crear tu
            cuenta:
          </p>

          {/* CTA Button */}
          <div style={{ textAlign: "center", margin: "40px 0" }}>
            <a
              href={inviteLink}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                padding: "14px 40px",
                textDecoration: "none",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "16px",
                display: "inline-block",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            >
              Aceptar Invitación
            </a>
          </div>

          {/* Alternative Link */}
          <p
            style={{
              fontSize: "14px",
              color: "#6b7280",
              marginTop: "30px",
              paddingTop: "20px",
              borderTop: "1px solid #e5e7eb",
            }}
          >
            O copia y pega este enlace en tu navegador:
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "#9ca3af",
              wordBreak: "break-all",
            }}
          >
            {inviteLink}
          </p>

          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "30px" }}>
            Esta invitación expira en 7 días.
          </p>

          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "20px" }}>
            Si no esperabas esta invitación, puedes ignorar este email.
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
  );
};
