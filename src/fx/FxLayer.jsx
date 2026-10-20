import { useEffect, useRef } from 'react';
import { mountFx } from './fx.js';

// Canvas hiệu ứng phủ toàn màn hình, gắn một lần ở gốc ứng dụng
export default function FxLayer() {
  const ref = useRef(null);
  useEffect(() => mountFx(ref.current), []);
  return <canvas ref={ref} className="fx-layer" aria-hidden="true" />;
}
