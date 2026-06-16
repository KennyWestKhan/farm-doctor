import { createPortal } from 'react-dom';
import { useLang } from '../i18n.jsx';
import SupplierList from './SupplierList.jsx';

/**
 * Slide-up sheet listing suppliers for a treatment. Portaled to document.body so
 * position:fixed is viewport-relative even when an animated/transformed ancestor
 * would otherwise become its containing block.
 */
export default function SupplierSheet({ region, productName, onClose }) {
  const { t } = useLang();
  return createPortal(
    <>
      <div className="sheet-scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheet__grip" />
        <div className="between" style={{ marginBottom: 12 }}>
          <h3>{t('find_suppliers')}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>{productName}</p>
        <SupplierList region={region} productName={productName} />
      </div>
    </>,
    document.body
  );
}
