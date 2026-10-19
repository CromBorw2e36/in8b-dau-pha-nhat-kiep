import { useRef, useState } from 'react';
import { makeCode, readCode, applyBackup, describe, copyText, downloadText, hasData } from '../game/backup.js';
import { load } from '../game/engine.js';

export default function Backup({ onRestored }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(null); // 'export' | 'import'
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(null);
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);
  const codeRef = useRef(null);

  const say = (t, bad) => setMsg({ t, bad });

  const doExport = async (how) => {
    setMode('export'); setPending(null);
    if (!hasData()) return say('Chưa có dữ liệu nào để sao lưu.', true);
    const c = await makeCode();
    setCode(c);
    if (how === 'copy') {
      if (await copyText(c)) say(`Đã sao chép mã (${(c.length / 1024).toFixed(1)} KB). Dán vào ghi chú hoặc gửi sang máy khác.`);
      else { say('Trình duyệt không cho tự sao chép. Hãy bấm giữ vào ô bên dưới để chọn rồi copy.'); setTimeout(() => codeRef.current?.select(), 50); }
    } else say(`Đã tải về file ${downloadText(c)}.`);
  };

  const check = async (text) => {
    setMsg(null); setPending(null);
    try {
      const data = await readCode(text);
      setPending(data);
    } catch (e) { say(e.message, true); }
  };

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const text = await f.text();
    setInput(text);
    check(text);
  };

  const confirmRestore = () => {
    const cur = load();
    if (cur && pending.save && !window.confirm(`Kiếp đang chơi của ${cur.name} (${cur.age} tuổi) sẽ bị thay thế. Tiếp tục?`)) return;
    applyBackup(pending);
    setPending(null); setInput('');
    say('Khôi phục thành công!');
    onRestored();
  };

  return (
    <section className="panel frame">
      <button className="panel-head" onClick={() => setOpen((v) => !v)}>
        <span>Sao lưu & khôi phục</span><span className="toggle">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="backup">
          <p className="muted small">Dữ liệu chỉ nằm trên trình duyệt này. Hãy sao lưu để không mất khi xóa dữ liệu duyệt web, hoặc để chuyển sang máy khác.</p>
          <div className="row2">
            <button className="btn" onClick={() => doExport('copy')}>Sao chép mã</button>
            <button className="btn" onClick={() => doExport('file')}>Tải file</button>
          </div>
          {mode === 'export' && code && (
            <textarea ref={codeRef} className="code" readOnly value={code} rows={3} onFocus={(e) => e.target.select()} />
          )}

          <button className="btn ghost" onClick={() => { setMode('import'); setMsg(null); }}>Khôi phục từ mã hoặc file</button>
          {mode === 'import' && (
            <>
              <textarea className="code" rows={3} placeholder="Dán mã sao lưu (bắt đầu bằng DPNK1.) vào đây" value={input}
                onChange={(e) => { setInput(e.target.value); setPending(null); setMsg(null); }} />
              <div className="row2">
                <button className="btn" disabled={!input.trim()} onClick={() => check(input)}>Kiểm tra mã</button>
                <button className="btn" onClick={() => fileRef.current?.click()}>Chọn file…</button>
              </div>
              <input ref={fileRef} type="file" accept=".txt,text/plain" hidden onChange={onFile} />
            </>
          )}

          {pending && (
            <div className="restore-box">
              <p>Tìm thấy: {describe(pending)}.</p>
              <button className="btn primary" onClick={confirmRestore}>Khôi phục</button>
            </div>
          )}
          {msg && <p className={'small ' + (msg.bad ? 'bad-text' : 'good-text')}>{msg.t}</p>}
        </div>
      )}
    </section>
  );
}
