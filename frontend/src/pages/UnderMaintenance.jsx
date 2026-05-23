function UnderMaintenance() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background:
          'radial-gradient(circle at top, rgba(255, 183, 77, 0.24), transparent 35%), linear-gradient(135deg, #081120 0%, #121a2f 45%, #1f2937 100%)',
        color: '#f8fafc',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          borderRadius: '28px',
          padding: '40px 32px',
          background: 'rgba(15, 23, 42, 0.82)',
          border: '1px solid rgba(148, 163, 184, 0.24)',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.35)',
          backdropFilter: 'blur(18px)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            marginBottom: '24px',
            background: 'linear-gradient(135deg, #f59e0b, #fb7185)',
            color: '#0f172a',
            fontSize: '34px',
            fontWeight: 800,
            letterSpacing: '0.08em',
          }}
        >
          M
        </div>

        <p
          style={{
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.24em',
            fontSize: '12px',
            color: '#fbbf24',
          }}
        >
          Temporary Notice
        </p>
        <h1
          style={{
            margin: '14px 0 12px',
            fontSize: 'clamp(32px, 5vw, 56px)',
            lineHeight: 1.05,
            color: '#ffffff',
          }}
        >
          Under Maintenance
        </h1>
        <p
          style={{
            margin: '0 auto',
            maxWidth: '520px',
            fontSize: '16px',
            lineHeight: 1.7,
            color: '#cbd5e1',
          }}
        >
          The portal is temporarily under maintenance. Working on updates right now.
        </p>
      </div>
    </div>
  );
}

export default UnderMaintenance;
