const variants = {
  success: {
    background: '#dcfce7',
    color: '#166534',
  },
  warning: {
    background: '#fef3c7',
    color: '#92400e',
  },
  danger: {
    background: '#fee2e2',
    color: '#991b1b',
  },
  info: {
    background: '#dbeafe',
    color: '#1e40af',
  },
  neutral: {
    background: '#f5f5f4',
    color: '#57534e',
  },
}

export default function Badge({
  children,
  variant = 'neutral',
}) {
  const style = variants[variant] ?? variants.neutral

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 28,
        padding: '0 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        ...style,
      }}
    >
      {children}
    </span>
  )
}
