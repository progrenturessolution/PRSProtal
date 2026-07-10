import { useEffect, useState } from "react";

export default function MaintenancePage() {
  const targetDate = new Date("2026-07-11T12:00:00+05:30").getTime();
  const [timeLeft, setTimeLeft] = useState(targetDate - Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = targetDate - Date.now();
      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(timer);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const formatTime = () => {
    if (timeLeft <= 0) return { hours: "00", minutes: "00", seconds: "00" };
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    return {
      hours: String(hours).padStart(2, "0"),
      minutes: String(minutes).padStart(2, "0"),
      seconds: String(seconds).padStart(2, "0"),
    };
  };

  const { hours, minutes, seconds } = formatTime();

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(circle at center, #324162 0%, #1e293b 100%)",
      color: "#ffffff",
      fontFamily: "'Inter', sans-serif",
      padding: "20px",
      textAlign: "center"
    }}>
      {/* Glow effect overlay */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        pointerEvents: "none"
      }} />

      {/* Main Container */}
      <div style={{
        maxWidth: "600px",
        background: "rgba(255, 255, 255, 0.04)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "24px",
        padding: "40px 30px",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
        zIndex: 1
      }}>
        {/* Logo / Brand Header */}
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "700", letterSpacing: "0.2em", textTransform: "uppercase", color: "#38bdf8", margin: 0 }}>
            Progrentures Solution
          </h2>
          <div style={{ height: "2px", width: "40px", background: "#38bdf8", margin: "12px auto" }} />
        </div>

        {/* Maintenance Message */}
        <h1 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "16px", color: "#ffffff", letterSpacing: "-0.02em" }}>
          System Under Maintenance
        </h1>
        <p style={{ fontSize: "15px", color: "#94a3b8", lineHeight: "1.6", marginBottom: "32px" }}>
          We are currently performing scheduled upgrades and backend optimizations to improve your portal experience. Access will resume shortly.
        </p>

        {/* Countdown Timer */}
        <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "32px" }}>
          {/* Hours Card */}
          <div style={{ minWidth: "80px", background: "rgba(255, 255, 255, 0.06)", borderRadius: "16px", padding: "16px 8px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ fontSize: "36px", fontWeight: "800", color: "#ffffff" }}>{hours}</div>
            <div style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "#94a3b8", marginTop: "4px", letterSpacing: "0.05em" }}>Hours</div>
          </div>
          {/* Colon */}
          <div style={{ fontSize: "36px", fontWeight: "800", color: "rgba(255, 255, 255, 0.3)", alignSelf: "center" }}>:</div>
          {/* Minutes Card */}
          <div style={{ minWidth: "80px", background: "rgba(255, 255, 255, 0.06)", borderRadius: "16px", padding: "16px 8px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ fontSize: "36px", fontWeight: "800", color: "#ffffff" }}>{minutes}</div>
            <div style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "#94a3b8", marginTop: "4px", letterSpacing: "0.05em" }}>Minutes</div>
          </div>
          {/* Colon */}
          <div style={{ fontSize: "36px", fontWeight: "800", color: "rgba(255, 255, 255, 0.3)", alignSelf: "center" }}>:</div>
          {/* Seconds Card */}
          <div style={{ minWidth: "80px", background: "rgba(255, 255, 255, 0.06)", borderRadius: "16px", padding: "16px 8px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ fontSize: "36px", fontWeight: "800", color: "#38bdf8" }}>{seconds}</div>
            <div style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "#94a3b8", marginTop: "4px", letterSpacing: "0.05em" }}>Seconds</div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "10px" }}>
          Target Completion: 11th July 2026, 12:00 PM Local Time
        </div>
      </div>

      <div style={{ marginTop: "24px", fontSize: "11px", color: "rgba(255, 255, 255, 0.4)", zIndex: 1 }}>
        &copy; {new Date().getFullYear()} Progrentures Solution Pvt. Ltd. All rights reserved.
      </div>
    </div>
  );
}
