export default function Input({
  label,
  id,
  error,
  className = '',
  ...props
}) {
  return (
    <div>
      {label && (
        <label className="label" htmlFor={id}>
          {label}
        </label>
      )}

      <input
        id={id}
        className={`input ${className}`.trim()}
        {...props}
      />

      {error && (
        <p style={{ marginTop: 6, color: '#b91c1c', fontSize: 13 }}>
          {error}
        </p>
      )}
    </div>
  )
}
