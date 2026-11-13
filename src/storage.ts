import seedFlows from '../lib/flows';
import seedPrices from '../lib/prices.json';
import {POST as importCSV} from './import-csv';
const key = 'bitcoin-flow-v1';
type Store = {flow: Record<string, any>; price: Record<string, any>; note: Record<string, any>};
function read(): Store {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : {flow:{},price:{},note:{}};
}
function write(store: Store) {
  localStorage.setItem(key, JSON.stringify(store));
}
export function restore(raw: string) {
  const data = JSON.parse(raw);
  for (const kind of ['flow','price','note']) {
    if (!data[kind] || typeof data[kind] !== 'object' || Array.isArray(data[kind])) throw Error('올바른 전체 백업 파일이 아닙니다.');
  }
  for (const row of Object.values(data.flow) as any[]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date) || !Array.isArray(row.values) || row.values.length!==12 || row.values.some((v:any)=>v!==null&&!Number.isFinite(v))) throw Error('ETF 백업 값 오류');
  }
  for (const row of Object.values(data.price) as any[]) if (!row.date || !Number.isFinite(row.price) || row.price<=0) throw Error('가격 백업 값 오류');
  for (const row of Object.values(data.note) as any[]) if (!row.id || !row.title || !row.snapshot || !row.snapshot.start) throw Error('메모 백업 값 오류');
  if (!confirm('현재 브라우저의 기록을 백업 내용으로 교체할까요?')) return;
  write(data);
}
export async function putRecords(kind: string, rows: any[]) {
  const store = read();
  const collection = store[kind as keyof Store];
  for (const row of rows) collection[row.id || row.date] = row;
  write(store);
}
function merged(seed:any[], changes:Record<string,any>) {
  const map = new Map(seed.map(row=>[row.date,row]));
  for (const row of Object.values(changes)) map.set(row.date,row);
  return [...map.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
export async function localFetch(path:string, options:RequestInit = {}):Promise<Response> {
  try {
    const store = read();
    if (path === '/api/data') return Response.json({flows:merged(seedFlows,store.flow),prices:merged(seedPrices,store.price)});
    if (path === '/api/notes') {
      if (!options.method) return Response.json(Object.values(store.note).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));
      const note = JSON.parse(String(options.body));
      if (options.method === 'DELETE') delete store.note[note.id];
      else {
        if (!note.title?.trim() || !note.memo?.trim() || !note.reason?.trim()) throw Error('제목과 관찰 및 근거를 입력하세요.');
        note.id = crypto.randomUUID();
        note.createdAt = new Date().toISOString();
        store.note[note.id] = note;
      }
      write(store);
      return Response.json(note);
    }
    if (path === '/api/import') return importCSV(new Request('https://local.invalid/import',{method:'POST',body:options.body}));
    if (path === '/api/refresh') {
      const messages = ['ETF는 CSV 추가·정정으로 갱신하세요. GitHub Pages에서는 원본 ETF 표를 직접 수집할 수 없습니다.'];
      let priceCount = 0;
      try {
        const response = await globalThis.fetch('https://api.coinbase.com/v2/prices/BTC-USD/historic?period=year',{signal:AbortSignal.timeout(15000)});
        if (!response.ok) throw Error('HTTP '+response.status);
        const data = await response.json();
        const prices = data.data.prices.map((row:any)=>({date:new Date(Number(row.time)*1000).toISOString().slice(0,10),price:Number(row.price)})).filter((row:any)=>row.date<new Date().toISOString().slice(0,10)&&Number.isFinite(row.price)&&row.price>0);
        await putRecords('price',prices);
        priceCount = prices.length;
      } catch { messages.push('BTC 갱신 실패 · 네트워크 또는 CORS 제한. 기존 데이터를 유지합니다.'); }
      return Response.json({priceCount,flowCount:0,messages});
    }
    return Response.json({error:'지원하지 않는 작업입니다.'},{status:404});
  } catch (error) {
    return Response.json({error:String(error)},{status:400});
  }
}
