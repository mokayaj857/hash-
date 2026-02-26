"use client";

import { useState, useRef, useEffect } from "react";

type Tab        = "record" | "verify";
type RecordStep = "idle" | "recording" | "preview" | "signing" | "processing" | "success";
type VerifyStep = "idle" | "hashing" | "verified" | "failed";

/* ─── helpers ─────────────────────────────────────────────── */
async function sha256(blob: Blob): Promise<string> {
  const buf  = await blob.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,"0")).join("");
}
const fakeTx   = () => "0x" + Array.from({length:64},()=>Math.floor(Math.random()*16).toString(16)).join("");
const fakeAddr = () => "0x" + Array.from({length:40},()=>Math.floor(Math.random()*16).toString(16)).join("");
const short    = (h:string) => h.slice(0,10)+"…"+h.slice(-8);
const fmt      = (s:number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

/* ─── QR ─────────────────────────────────────────────────── */
function QRCode({data,accent}:{data:string;accent:string}) {
  const S=21;
  const cells:boolean[][]=Array.from({length:S},(_,r)=>
    Array.from({length:S},(_,c)=>((data.charCodeAt((r*S+c)%data.length)||0)+r*3+c*7)%4!==0)
  );
  [[0,0],[0,14],[14,0]].forEach(([r0,c0])=>{
    for(let r=r0;r<r0+7;r++)for(let c=c0;c<c0+7;c++)
      cells[r][c]=r===r0||r===r0+6||c===c0||c===c0+6||(r>=r0+2&&r<=r0+4&&c>=c0+2&&c<=c0+4);
  });
  const cell=8;
  return(
    <svg width={S*cell+24} height={S*cell+24} className="rounded-2xl bg-white p-3 shrink-0">
      {cells.map((row,r)=>row.map((on,c)=>on
        ?<rect key={`${r}-${c}`} x={c*cell+12} y={r*cell+12} width={cell-1} height={cell-1} rx={1} fill={accent}/>
        :null
      ))}
    </svg>
  );
}

/* ─── Button ─────────────────────────────────────────────── */
function Btn({children,onClick,disabled=false,gold=false,outline=false,red=false,className="",full=false}:{
  children:React.ReactNode;onClick?:()=>void;disabled?:boolean;
  gold?:boolean;outline?:boolean;red?:boolean;className?:string;full?:boolean;
}) {
  return(
    <button onClick={onClick} disabled={disabled}
      className={[
        "relative flex items-center justify-center gap-2 px-5 py-3 rounded-xl",
        "font-mono text-[11px] tracking-[0.16em] uppercase transition-all duration-300",
        "disabled:opacity-30 disabled:cursor-not-allowed overflow-hidden group",
        full?"w-full":"",
        gold&&!outline?"bg-[#D4A843] text-black hover:bg-[#e2bc52] hover:shadow-[0_0_32px_rgba(212,168,67,0.6)] active:scale-[0.98]":"",
        red&&!outline ?"bg-[#e05252] text-white hover:bg-[#e86060] hover:shadow-[0_0_28px_rgba(224,82,82,0.55)] active:scale-[0.98]":"",
        outline&&gold ?"border border-[#D4A843]/40 text-[#D4A843] hover:bg-[#D4A843]/10 hover:border-[#D4A843]/70":"",
        outline&&!gold&&!red?"border border-white/15 text-white/55 hover:bg-white/[0.06] hover:text-white/90":"",
        className,
      ].filter(Boolean).join(" ")}>
      {(gold||red)&&!outline&&(
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-white/20 skew-x-[-18deg] transition-transform duration-700 pointer-events-none"/>
      )}
      {children}
    </button>
  );
}

/* ─── Field row ──────────────────────────────────────────── */
function Row({label,value,color="text-white/80"}:{label:string;value:string;color?:string}) {
  return(
    <div className="flex justify-between items-start gap-4 py-3 border-b border-white/[0.06] last:border-0">
      <span className="font-mono text-[10px] text-white/45 tracking-[0.14em] uppercase shrink-0 leading-relaxed">{label}</span>
      <span className={`font-mono text-[11px] ${color} text-right break-all leading-relaxed`}>{value}</span>
    </div>
  );
}

/* ─── Glass box ──────────────────────────────────────────── */
function Glass({children,className=""}:{children:React.ReactNode;className?:string}) {
  return(
    <div className={`rounded-2xl ${className}`} style={{
      background:"rgba(255,255,255,0.04)",
      border:"1px solid rgba(255,255,255,0.09)",
      boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06)",
    }}>{children}</div>
  );
}

/* ═══════════════════════════════════════════════════════════
   RECORD TAB
═══════════════════════════════════════════════════════════ */
function RecordTab() {
  const [step,setStep]         = useState<RecordStep>("idle");
  const [elapsed,setElapsed]   = useState(0);
  const [videoURL,setVideoURL] = useState<string|null>(null);
  const [hash,setHash]         = useState<string|null>(null);
  const [txHash,setTxHash]     = useState<string|null>(null);
  const [password,setPassword] = useState("");
  const [pwError,setPwError]   = useState(false);
  const [progress,setProgress] = useState(0);
  const [qrData,setQrData]     = useState<string|null>(null);
  const [wallet]               = useState(fakeAddr);

  const liveRef   = useRef<HTMLVideoElement>(null);
  const mrRef     = useRef<MediaRecorder|null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef  = useRef<ReturnType<typeof setInterval>|null>(null);
  const streamRef = useRef<MediaStream|null>(null);

  useEffect(()=>{
    navigator.mediaDevices.getUserMedia({video:true,audio:true})
      .then(s=>{streamRef.current=s;if(liveRef.current){liveRef.current.srcObject=s;liveRef.current.play();}})
      .catch(()=>{});
    return()=>{streamRef.current?.getTracks().forEach(t=>t.stop());clearInterval(timerRef.current!);};
  },[]);

  const startRec=()=>{
    if(!streamRef.current)return;
    chunksRef.current=[];
    const mr=new MediaRecorder(streamRef.current,{mimeType:"video/webm;codecs=vp8,opus"});
    mr.ondataavailable=e=>{if(e.data.size>0)chunksRef.current.push(e.data);};
    mr.onstop=async()=>{
      const blob=new Blob(chunksRef.current,{type:"video/webm"});
      setVideoURL(URL.createObjectURL(blob));
      setHash(await sha256(blob));
      setStep("preview");
    };
    mr.start();mrRef.current=mr;
    setElapsed(0);
    timerRef.current=setInterval(()=>setElapsed(s=>s+1),1000);
    setStep("recording");
  };

  const stopRec=()=>{mrRef.current?.stop();clearInterval(timerRef.current!);};

  const sign=()=>{
    if(password.length<6){setPwError(true);return;}
    setPwError(false);setStep("processing");setProgress(0);
    const iv=setInterval(()=>setProgress(p=>{
      if(p>=100){
        clearInterval(iv);
        const tx=fakeTx();
        setTxHash(tx);
        setQrData(JSON.stringify({tx,hash,wallet,ts:Date.now()}));
        setStep("success");
        return 100;
      }
      return p+1.4;
    }),50);
  };

  const download=()=>{
    if(!videoURL)return;
    const a=document.createElement("a");a.href=videoURL;a.download=`hashmark_${Date.now()}.webm`;a.click();
  };

  const reset=()=>{setStep("idle");setVideoURL(null);setHash(null);setTxHash(null);setPassword("");setQrData(null);setProgress(0);};

  /* Step descriptions */
  const desc:Record<RecordStep,string>={
    idle:      "Point your camera and press Start — every frame will be cryptographically fingerprinted.",
    recording: "Recording in progress. Press Stop when done.",
    preview:   "Review your clip, then authenticate it on-chain.",
    signing:   "Confirm the transaction details and sign with your wallet password.",
    processing:"Broadcasting your video's SHA-256 fingerprint to the Hashmark AppChain…",
    success:   "Authenticated. Your video is permanently sealed on the immutable ledger.",
  };

  return(
    <div className="flex flex-col gap-5 h-full">

      {/* Step description */}
      <p className="font-mono text-[11px] text-white/55 tracking-[0.05em] leading-relaxed shrink-0">
        {desc[step]}
      </p>

      {/* ── IDLE / RECORDING ── */}
      {(step==="idle"||step==="recording")&&(
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Viewfinder */}
          <div className={[
            "relative flex-1 min-h-0 rounded-2xl overflow-hidden transition-all duration-500",
            step==="recording"
              ?"ring-2 ring-red-500/60 shadow-[0_0_50px_rgba(239,68,68,0.2)]"
              :"ring-1 ring-[#D4A843]/25 hover:ring-[#D4A843]/45",
          ].join(" ")} style={{minHeight:220}}>
            <video ref={liveRef} muted playsInline
              className="w-full h-full object-cover block"
              style={{transform:"scaleX(-1)"}}/>
            {/* fallback */}
            <div className="absolute inset-0 -z-10 flex items-center justify-center bg-[#080814]">
              <span className="font-mono text-[11px] text-white/20 tracking-[0.2em] uppercase">Awaiting Camera</span>
            </div>

            {/* Scan beam */}
            {step==="recording"&&(
              <>
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-red-500/[0.07] via-transparent to-red-500/[0.07]"/>
                <div className="absolute left-0 right-0 h-[2px] pointer-events-none"
                  style={{background:"linear-gradient(90deg,transparent,rgba(239,68,68,0.95),transparent)",boxShadow:"0 0 20px rgba(239,68,68,1)",animation:"scanBeam 2.2s linear infinite"}}/>
              </>
            )}

            {/* Corner brackets */}
            {(["tl","tr","bl","br"] as const).map(p=>(
              <div key={p} className="absolute w-5 h-5 pointer-events-none" style={{
                ...(p.includes("t")?{top:12}:{bottom:12}),
                ...(p.includes("l")?{left:12}:{right:12}),
                borderTop:    p.includes("t")?`1.5px solid ${step==="recording"?"rgba(239,68,68,0.85)":"rgba(212,168,67,0.7)"}`:"none",
                borderBottom: p.includes("b")?`1.5px solid ${step==="recording"?"rgba(239,68,68,0.85)":"rgba(212,168,67,0.7)"}`:"none",
                borderLeft:   p.includes("l")?`1.5px solid ${step==="recording"?"rgba(239,68,68,0.85)":"rgba(212,168,67,0.7)"}`:"none",
                borderRight:  p.includes("r")?`1.5px solid ${step==="recording"?"rgba(239,68,68,0.85)":"rgba(212,168,67,0.7)"}`:"none",
              }}/>
            ))}

            {/* REC badge */}
            {step==="recording"&&(
              <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-red-500/45">
                <div className="w-2 h-2 rounded-full bg-red-500" style={{animation:"blink 1s ease-in-out infinite"}}/>
                <span className="font-mono text-[11px] text-white tracking-widest font-medium">REC {fmt(elapsed)}</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-center shrink-0">
            {step==="idle"&&(
              <Btn red onClick={startRec} className="px-12 gap-3">
                <span className="w-3 h-3 rounded-full bg-white/30 shrink-0"/>
                Start Recording
              </Btn>
            )}
            {step==="recording"&&(
              <Btn outline onClick={stopRec} className="px-12 !border-red-500/45 !text-red-400 hover:!bg-red-500/10">
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                Stop Recording
              </Btn>
            )}
          </div>
        </div>
      )}

      {/* ── PREVIEW ── */}
      {step==="preview"&&videoURL&&(
        <div className="flex flex-col gap-4 flex-1 min-h-0" style={{animation:"fadeUp 0.5s ease both"}}>
          <div className="relative flex-1 min-h-0 rounded-2xl overflow-hidden ring-1 ring-emerald-500/35" style={{minHeight:180}}>
            <video src={videoURL} controls className="w-full h-full object-cover block"/>
            <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-emerald-500/45">
              <span className="font-mono text-[10px] text-emerald-400 tracking-widest font-medium">✓ CAPTURED</span>
            </div>
          </div>
          <Glass className="p-4">
            <div className="font-mono text-[10px] text-emerald-400/70 tracking-[0.18em] uppercase mb-2 font-medium">SHA-256 Fingerprint</div>
            <div className="font-mono text-[10px] text-white/55 break-all leading-relaxed">{hash}</div>
          </Glass>
          <div className="flex gap-3 shrink-0">
            <Btn outline onClick={reset} className="flex-1">Re-record</Btn>
            <Btn gold onClick={()=>setStep("signing")} className="flex-[2]">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Authenticate on Blockchain
            </Btn>
          </div>
        </div>
      )}

      {/* ── SIGNING ── */}
      {step==="signing"&&(
        <div className="flex flex-col gap-5 flex-1" style={{animation:"fadeUp 0.5s ease both"}}>
          <Glass className="p-5">
            <div className="font-mono text-[10px] text-[#D4A843]/65 tracking-[0.2em] uppercase mb-3 font-medium">Transaction Details</div>
            <Row label="Action"   value="Authenticate Media"  color="text-white/85"/>
            <Row label="Hash"     value={short(hash||"")}     color="text-[#D4A843]"/>
            <Row label="Wallet"   value={short(wallet)}       color="text-[#4A9EDB]"/>
            <Row label="Network"  value="Hashmark AppChain"   color="text-emerald-400"/>
            <Row label="Est. Gas" value="≈ 0.0003 HMK"        color="text-white/60"/>
          </Glass>

          <div>
            <label className="block font-mono text-[10px] text-white/55 tracking-[0.16em] uppercase mb-2 font-medium">
              Wallet Password
            </label>
            <input
              type="password" value={password}
              onChange={e=>{setPassword(e.target.value);setPwError(false);}}
              placeholder="Enter password to sign…"
              className={[
                "w-full px-4 py-3 rounded-xl font-mono text-[13px] text-white outline-none transition-all duration-300",
                "placeholder:text-white/25",
                pwError
                  ?"bg-red-500/[0.07] border border-red-500/55 focus:border-red-400/80"
                  :"bg-white/[0.05] border border-white/12 focus:border-[#D4A843]/50 focus:bg-[#D4A843]/[0.04]",
              ].join(" ")}
            />
            {pwError&&<p className="mt-2 font-mono text-[10px] text-red-400 tracking-[0.1em]">Minimum 6 characters required</p>}
          </div>

          <div className="flex gap-3 mt-auto">
            <Btn outline onClick={()=>setStep("preview")} className="flex-1">Back</Btn>
            <Btn gold onClick={sign} className="flex-[2]">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              Sign & Authenticate
            </Btn>
          </div>
        </div>
      )}

      {/* ── PROCESSING ── */}
      {step==="processing"&&(
        <div className="flex flex-col items-center justify-center flex-1 gap-8" style={{animation:"fadeUp 0.5s ease both"}}>
          <div className="relative w-28 h-28">
            {[0,1,2].map(i=>(
              <div key={i} className="absolute rounded-full border-2" style={{
                inset:i*14,
                borderColor:`rgba(${["212,168,67","74,158,219","155,89,232"][i]},0.15)`,
                borderTopColor:`rgba(${["212,168,67","74,158,219","155,89,232"][i]},1)`,
                animation:`spin ${1+i*0.45}s linear infinite`,
              }}/>
            ))}
            <div className="absolute inset-0 flex items-center justify-center font-mono text-[15px] font-bold text-[#D4A843]">
              {Math.round(progress)}%
            </div>
          </div>
          <div className="text-center space-y-2">
            <div className="font-serif text-2xl font-light text-white">Anchoring to Ledger</div>
            <div className="font-mono text-[11px] text-white/50 tracking-[0.1em]">
              {progress<30?"Computing cryptographic fingerprint…"
               :progress<60?"Broadcasting to AppChain nodes…"
               :progress<85?"Awaiting block confirmation…"
               :"Sealing immutable record…"}
            </div>
          </div>
          <div className="w-full h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full rounded-full"
              style={{width:`${progress}%`,background:"linear-gradient(90deg,#D4A843,#9B59E8)",boxShadow:"0 0 14px rgba(212,168,67,0.7)",transition:"width 0.08s linear"}}/>
          </div>
        </div>
      )}

      {/* ── SUCCESS ── */}
      {step==="success"&&qrData&&txHash&&hash&&(
        <div className="flex flex-col gap-5 flex-1 overflow-y-auto" style={{animation:"fadeUp 0.6s ease both"}}>
          {/* Success header */}
          <div className="flex items-center gap-4 p-4 rounded-2xl"
            style={{background:"rgba(62,201,122,0.08)",border:"1.5px solid rgba(62,201,122,0.3)",boxShadow:"0 0 36px rgba(62,201,122,0.1)"}}>
            <div className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-2xl"
              style={{background:"rgba(62,201,122,0.15)",border:"2px solid rgba(62,201,122,0.5)",boxShadow:"0 0 24px rgba(62,201,122,0.35)",animation:"popIn 0.5s cubic-bezier(0.4,0,0.2,1) both"}}>
              ✓
            </div>
            <div>
              <div className="font-serif text-xl font-light text-emerald-400 mb-0.5">Successfully Authenticated</div>
              <div className="font-mono text-[10px] text-emerald-400/55 tracking-[0.1em]">Permanently sealed on the Hashmark ledger</div>
            </div>
          </div>

          {/* QR + info */}
          <div className="flex gap-5 flex-wrap items-start">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <QRCode data={qrData} accent="#3EC97A"/>
              <span className="font-mono text-[9px] text-white/35 tracking-[0.14em] uppercase">Scan to verify</span>
            </div>
            <Glass className="flex-1 min-w-[180px] p-4">
              <Row label="TX Hash"    value={short(txHash)} color="text-[#4A9EDB]"/>
              <Row label="Video Hash" value={short(hash)}   color="text-[#D4A843]"/>
              <Row label="Wallet"     value={short(wallet)} color="text-[#9B59E8]"/>
              <Row label="Network"    value="Hashmark AppChain" color="text-emerald-400"/>
              <Row label="Timestamp"  value={new Date().toISOString().slice(0,19).replace("T"," ")} color="text-white/65"/>
              <Row label="Status"     value="Immutable ✓"  color="text-emerald-400"/>
            </Glass>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 flex-wrap shrink-0">
            <Btn gold onClick={download} className="flex-1 min-w-[120px]">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download
            </Btn>
            <Btn gold outline onClick={()=>{
              const blob=new Blob([JSON.stringify({txHash,hash,wallet,ts:new Date().toISOString()},null,2)],{type:"application/json"});
              const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="hashmark_cert.json";a.click();
            }} className="flex-1 min-w-[120px]">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Certificate
            </Btn>
            <Btn outline onClick={reset} className="flex-1 min-w-[90px]">New</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VERIFY TAB
═══════════════════════════════════════════════════════════ */
function VerifyTab() {
  const [step,setStep]         = useState<VerifyStep>("idle");
  const [drag,setDrag]         = useState(false);
  const [fileName,setFileName] = useState<string|null>(null);
  const [hash,setHash]         = useState<string|null>(null);
  const [videoURL,setVideoURL] = useState<string|null>(null);
  const [txHash]               = useState(fakeTx);
  const [wallet]               = useState(fakeAddr);
  const inputRef               = useRef<HTMLInputElement>(null);

  const processFile=async(file:File)=>{
    if(!file.type.startsWith("video/"))return;
    setFileName(file.name);setVideoURL(URL.createObjectURL(file));setStep("hashing");
    const h=await sha256(file);setHash(h);
    await new Promise(r=>setTimeout(r,2000));
    setStep(Math.random()>0.25?"verified":"failed");
  };
  const reset=()=>{setStep("idle");setHash(null);setFileName(null);setVideoURL(null);};

  return(
    <div className="flex flex-col gap-5 flex-1 min-h-0">

      {/* ── DROP ZONE ── */}
      {step==="idle"&&(
        <div
          onDragOver={e=>{e.preventDefault();setDrag(true);}}
          onDragLeave={()=>setDrag(false)}
          onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f)processFile(f);}}
          onClick={()=>inputRef.current?.click()}
          className={[
            "flex-1 flex flex-col items-center justify-center gap-6 rounded-2xl cursor-pointer transition-all duration-400",
            drag
              ?"border-2 border-dashed border-[#D4A843] bg-[#D4A843]/[0.06] scale-[1.01] shadow-[0_0_40px_rgba(212,168,67,0.18)]"
              :"border-2 border-dashed border-white/[0.1] hover:border-[#D4A843]/40 hover:bg-[#D4A843]/[0.03]",
          ].join(" ")} style={{minHeight:200,animation:"fadeUp 0.5s ease both"}}>
          <input ref={inputRef} type="file" accept="video/*" className="hidden"
            onChange={e=>{const f=e.target.files?.[0];if(f)processFile(f);}}/>

          <div className={[
            "w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all duration-400",
            drag?"bg-[#D4A843]/20 border-2 border-[#D4A843]/55 scale-110 shadow-[0_0_44px_rgba(212,168,67,0.45)]":"bg-white/[0.05] border border-white/10",
          ].join(" ")} style={{animation:drag?"none":"breathe 4s ease-in-out infinite"}}>
            🎬
          </div>

          <div className="text-center space-y-2 px-4">
            <div className="font-serif text-[22px] font-light text-white">Drop your video to verify</div>
            <div className="font-mono text-[10px] text-white/40 tracking-[0.16em]">OR CLICK TO BROWSE — MP4, WEBM, MOV</div>
          </div>

          <div className="flex items-center gap-5 flex-wrap justify-center px-4">
            {["SHA-256 Hashed","Blockchain Verified","Tamper-Proof"].map(t=>(
              <div key={t} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4A843]/65"/>
                <span className="font-mono text-[9px] text-white/40 tracking-[0.1em] uppercase">{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── HASHING ── */}
      {step==="hashing"&&(
        <div className="flex-1 flex flex-col items-center justify-center gap-8" style={{animation:"fadeUp 0.5s ease both"}}>
          <div className="relative w-24 h-24">
            {[0,1].map(i=>(
              <div key={i} className="absolute rounded-full border-2" style={{
                inset:i*16,
                borderColor:`rgba(${["212,168,67","155,89,232"][i]},0.15)`,
                borderTopColor:`rgba(${["212,168,67","155,89,232"][i]},1)`,
                animation:`spin ${1+i*0.55}s linear infinite`,
              }}/>
            ))}
            <div className="absolute inset-0 flex items-center justify-center text-2xl">🔍</div>
          </div>
          <div className="text-center">
            <div className="font-serif text-[22px] font-light text-white mb-2">Analysing Video</div>
            <div className="font-mono text-[11px] text-white/45 tracking-[0.1em]">Computing SHA-256 · Querying ledger…</div>
          </div>
          {hash&&<div className="font-mono text-[9px] text-white/25 max-w-xs text-center break-all leading-relaxed px-4">{hash}</div>}
        </div>
      )}

      {/* ── VERIFIED ── */}
      {step==="verified"&&hash&&(
        <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto" style={{animation:"fadeUp 0.5s ease both"}}>
          {videoURL&&(
            <div className="rounded-2xl overflow-hidden ring-1 ring-emerald-500/35 shrink-0" style={{maxHeight:190}}>
              <video src={videoURL} controls className="w-full block object-cover"/>
            </div>
          )}
          <div className="flex items-center gap-4 p-4 rounded-2xl"
            style={{background:"rgba(62,201,122,0.07)",border:"1.5px solid rgba(62,201,122,0.28)",boxShadow:"0 0 30px rgba(62,201,122,0.09)"}}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0"
              style={{background:"rgba(62,201,122,0.13)",border:"2px solid rgba(62,201,122,0.45)",animation:"popIn 0.4s cubic-bezier(0.4,0,0.2,1) both"}}>✓</div>
            <div>
              <div className="font-serif text-[18px] font-light text-emerald-400 mb-0.5">Authenticity Verified</div>
              <div className="font-mono text-[10px] text-emerald-400/55 tracking-[0.08em]">{fileName} — found on Hashmark ledger</div>
            </div>
          </div>
          <Glass className="p-4">
            <div className="font-mono text-[10px] text-white/35 tracking-[0.2em] uppercase mb-3 font-medium">Blockchain Record</div>
            <Row label="SHA-256"     value={hash}           color="text-[#D4A843]"/>
            <Row label="TX Hash"     value={short(txHash)}  color="text-[#4A9EDB]"/>
            <Row label="Recorded By" value={short(wallet)}  color="text-[#9B59E8]"/>
            <Row label="Network"     value="Hashmark AppChain" color="text-emerald-400"/>
            <Row label="Recorded"    value="2025-01-15 14:32:08 UTC" color="text-white/65"/>
            <Row label="Block"       value="#4,872,341"     color="text-white/65"/>
          </Glass>
          <Btn outline onClick={reset} full>Verify Another</Btn>
        </div>
      )}

      {/* ── FAILED ── */}
      {step==="failed"&&(
        <div className="flex-1 flex flex-col items-center justify-center gap-6" style={{animation:"fadeUp 0.5s ease both"}}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
            style={{background:"rgba(219,74,74,0.1)",border:"2px solid rgba(219,74,74,0.45)",boxShadow:"0 0 32px rgba(219,74,74,0.2)"}}>✕</div>
          <div className="text-center space-y-2 px-4">
            <div className="font-serif text-2xl text-red-400">Not Verified</div>
            <div className="font-mono text-[11px] text-white/50 tracking-[0.06em] max-w-[280px] leading-relaxed">
              This video was not found on the Hashmark ledger or has been altered since authentication.
            </div>
          </div>
          {hash&&(
            <Glass className="w-full p-4">
              <div className="font-mono text-[10px] text-red-400/55 tracking-[0.16em] uppercase mb-2 font-medium">Computed Hash</div>
              <div className="font-mono text-[10px] text-white/40 break-all leading-relaxed">{hash}</div>
            </Glass>
          )}
          <Btn red onClick={reset}>Try Another Video</Btn>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════ */
export default function HashmarkApp() {
  const [tab,setTab] = useState<Tab>("record");
  const BG_VIDEO     = "/videos/hashmark-bg.mp4"; // ← your video path

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Mono:wght@300;400&display=swap');
        .font-serif{font-family:'Cormorant Garamond',Georgia,serif;}
        .font-mono{font-family:'DM Mono',monospace;}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body,#root,#__next{width:100%;height:100%;background:#060610;-webkit-font-smoothing:antialiased;}
        body{overflow:hidden;}
        input::placeholder{color:rgba(255,255,255,0.22);}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:rgba(212,168,67,0.25);border-radius:4px;}
        @keyframes scanBeam{0%{top:0;opacity:0}5%{opacity:1}95%{opacity:1}100%{top:100%;opacity:0}}
        @keyframes blink{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.9)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes breathe{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.06);opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes popIn{from{opacity:0;transform:scale(0.55)}to{opacity:1;transform:scale(1)}}
        @keyframes logoIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes cardIn{from{opacity:0;transform:translateY(28px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
      `}</style>

      {/* ══ Background video ══ */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video autoPlay muted loop playsInline src={BG_VIDEO}
          className="absolute inset-0 w-full h-full object-cover"
          style={{filter:"brightness(0.22) saturate(1.4)"}}/>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c0820]/75 via-transparent to-black/60"/>
        <div className="absolute inset-0 bg-gradient-to-t from-[#060610]/85 via-transparent to-transparent"/>
        <div className="absolute inset-0" style={{background:"radial-gradient(ellipse at 50% 0%, rgba(212,168,67,0.055) 0%, transparent 55%)"}}/>
      </div>

      {/* ══ Full-screen layout ══ */}
      <div className="fixed inset-0 z-10 flex flex-col items-center overflow-hidden">

        {/* ─── LOGO HEADER — outside the card ─── */}
        <header
          className="w-full shrink-0 flex items-center justify-between px-6 sm:px-10 py-4"
          style={{animation:"logoIn 0.8s cubic-bezier(0.4,0,0.2,1) both 0.05s"}}
        >
          {/* Left: Hash logo + wordmark + badge */}
          <div className="flex items-center gap-3">
            {/* Icon box */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{background:"rgba(212,168,67,0.1)",border:"1px solid rgba(212,168,67,0.22)"}}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <line x1="6"  y1="2"  x2="4"  y2="18" stroke="#D4A843" strokeWidth="1.6" strokeLinecap="round"/>
                <line x1="13" y1="2"  x2="11" y2="18" stroke="#D4A843" strokeWidth="1.6" strokeLinecap="round"/>
                <line x1="2"  y1="7"  x2="18" y2="7"  stroke="#D4A843" strokeWidth="1.6" strokeLinecap="round"/>
                <line x1="1.5"y1="13" x2="17.5"y2="13"stroke="#D4A843" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            {/* Wordmark */}
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[15px] tracking-[0.3em] text-white uppercase leading-none">HASHMARK</span>
              <span className="font-mono text-[8px] tracking-[0.16em] text-[#D4A843] px-2 py-[3px] border border-[#D4A843]/28 rounded-md bg-[#D4A843]/[0.08] uppercase leading-none">
                PROTOCOL
              </span>
            </div>
          </div>

          {/* Right: Ledger Live status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{background:"rgba(62,201,122,0.08)",border:"1px solid rgba(62,201,122,0.2)"}}>
            <div className="w-[5px] h-[5px] rounded-full bg-emerald-400 shrink-0"
              style={{animation:"blink 2s ease-in-out infinite"}}/>
            <span className="font-mono text-[9px] text-emerald-400 tracking-[0.18em] uppercase">Ledger Live</span>
          </div>
        </header>

        {/* Thin gold rule under header */}
        <div className="w-full shrink-0 px-6 sm:px-10">
          <div className="h-[1px]" style={{background:"linear-gradient(90deg,transparent,rgba(212,168,67,0.2) 35%,rgba(155,89,232,0.15) 70%,transparent)"}}/>
        </div>

        {/* ─── CARD — centred, fills remaining height ─── */}
        <div className="flex-1 min-h-0 w-full flex items-center justify-center px-4 py-4 sm:py-5">
          <div
            className="w-full flex flex-col overflow-hidden"
            style={{
              maxWidth:520,
              height:"100%",
              maxHeight:780,
              background:"rgba(10,10,22,0.82)",
              backdropFilter:"blur(32px)",
              WebkitBackdropFilter:"blur(32px)",
              border:"1px solid rgba(255,255,255,0.08)",
              borderRadius:24,
              boxShadow:"0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
              animation:"cardIn 0.9s cubic-bezier(0.4,0,0.2,1) both 0.15s",
            }}
          >
            {/* Top shimmer */}
            <div className="absolute left-8 right-8 h-[1px] top-0 pointer-events-none"
              style={{background:"linear-gradient(90deg,transparent,rgba(212,168,67,0.35) 40%,rgba(155,89,232,0.22) 70%,transparent)"}}/>

            {/* ── Card header: tabs + section title ── */}
            <div className="px-6 pt-6 pb-0 shrink-0">

              {/* Tab switcher */}
              <div className="flex gap-1.5 p-1.5 rounded-2xl mb-5"
                style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                {([
                  {id:"record" as Tab,
                   icon:<svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.8"/></svg>,
                   label:"Record & Authenticate"},
                  {id:"verify" as Tab,
                   icon:<svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
                   label:"Verify Videos"},
                ]).map(({id,icon,label})=>{
                  const active=tab===id;
                  return(
                    <button key={id} onClick={()=>setTab(id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[11px] transition-all duration-300"
                      style={{
                        background:active?"rgba(212,168,67,0.12)":"transparent",
                        border:active?"1px solid rgba(212,168,67,0.25)":"1px solid transparent",
                        boxShadow:active?"0 0 24px rgba(212,168,67,0.1)":"none",
                        color:active?"#D4A843":"rgba(255,255,255,0.38)",
                      }}>
                      {icon}
                      <span className="font-mono text-[10px] tracking-[0.14em] uppercase">{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Section title */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-[3px] h-[20px] rounded-full shrink-0"
                  style={{background:"linear-gradient(180deg,#D4A843,#9B59E8)"}}/>
                <span className="font-serif text-[20px] font-light text-white leading-snug">
                  {tab==="record"?"Record Authenticated Video":"Verify Video Authenticity"}
                </span>
              </div>

              {/* Divider */}
              <div className="h-px mb-5" style={{background:"linear-gradient(90deg,rgba(212,168,67,0.28),transparent)"}}/>
            </div>

            {/* ── Card body ── */}
            <div className="flex-1 min-h-0 px-6 pb-6 overflow-y-auto flex flex-col">
              {tab==="record"?<RecordTab/>:<VerifyTab/>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}