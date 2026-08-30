export default function PageHeader({
  title,
  description,
  action,
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 32,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
          {title}
        </h1>

        {description && (
          <p
            className="muted"
            style={{ marginTop: 8 }}
          >
            {description}
          </p>
        )}
      </div>

      {action && <div>{action}</div>}
    </div>
  )
}
