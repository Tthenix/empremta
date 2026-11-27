export default function TxLink({ hash, explorerTxUrl, label = 'Ver en Stellar' }) {
  if (!hash || !explorerTxUrl) return null
  const href = `${explorerTxUrl}${hash}`
  return (
    <a className="tx-link" href={href} target="_blank" rel="noreferrer">
      {label}
    </a>
  )
}
