export default function ErrorMsg({ children }) {
  if (!children) return null
  return (
    <div className="error-box" role="alert">
      {children}
    </div>
  )
}
