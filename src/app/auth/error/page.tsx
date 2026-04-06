"use client";
export default function AuthError() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "100dvh", gap: 16, fontFamily: "sans-serif"
    }}>
      <h1 style={{ fontSize: 20 }}>Erreur d&apos;authentification</h1>
      <p style={{ color: "#888" }}>Une erreur est survenue lors de la connexion.</p>
      <a href="/" style={{ color: "#6366f1" }}>Retour à l&apos;accueil</a>
    </div>
  );
}