# Bitcoin Flow — GitHub Pages

미국 현물 비트코인 ETF와 BTC 가격 분석 대시보드입니다.

## GitHub에 올리고 배포하기

1. GitHub에서 저장소를 생성합니다.
2. 이 폴더 안의 파일을 저장소 최상위에 올립니다. `package.json`, `index.html`, `.github/workflows/pages.yml`이 최상위 기준으로 해당 위치에 있어야 합니다. `.github` 폴더도 반드시 포함하세요.
3. 저장소의 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 선택합니다.
4. `main` 또는 `master` 브랜치에 푸시하면 Actions에서 빌드와 배포가 실행됩니다. 설정을 나중에 했다면 Actions의 **Build and deploy GitHub Pages → Run workflow**를 실행합니다.
5. 완료 후 Actions 배포 결과 또는 Settings → Pages에 표시된 주소를 엽니다. 일반 저장소는 `https://사용자명.github.io/저장소명/` 형태입니다.

저장소 이름을 바꿔도 상대경로로 자산을 로드합니다. GitHub Pages 활성화 가능 여부는 저장소 공개 범위와 계정 플랜에 따릅니다.

## PC에서 실행하기

Node.js 22.12 이상을 설치한 뒤 실행합니다.

```bash
npm ci
npm run dev
```

배포용 빌드와 확인

```bash
npm run build
npm run preview
```

## 저장 및 데이터 갱신

- 포함된 ETF 스냅샷은 Farside Investors의 2024-01-11~2026-11-12 자료입니다. 수집 시점은 2026-11-13이며 최신 행은 부분 집계입니다.
- BTC 기준가격은 Coinbase의 2025-11-13~2026-11-12 일별 값입니다. 미국 주식시장 종가와 시각이 같지 않습니다.
- 메모와 CSV로 추가한 데이터는 이 사이트 주소의 브라우저 localStorage에 저장됩니다. PC, 브라우저, 사이트 주소가 달라지면 자동 공유되지 않습니다.
- 데이터 관리의 **전체 기록 백업**과 **백업 복원**으로 옮길 수 있습니다. 브라우저 데이터 삭제 전에 백업하세요.
- 새로고침은 Coinbase 가격 이력을 요청합니다. CORS 또는 네트워크 제한으로 실패하면 기존 자료를 유지하고 실패 메시지를 표시합니다.
- ETF 최신 자료는 데이터 관리에서 CSV로 추가·정정합니다. GitHub Pages는 서버 코드를 실행하지 않으며 원본 ETF 사이트 접근 제한도 있어 ETF 자동 수집은 포함하지 않았습니다.
- 서버 API, 비밀 키, ChatGPT 로그인, Cloudflare DB 설정이 필요하지 않습니다. GitHub Pages에 접속 가능한 사람은 포함된 시장 데이터와 화면을 볼 수 있습니다. 개인 메모는 사용자 브라우저에 저장됩니다.

## 분석

기간, 가격 범위, 순유입·순유출 임계값, 집계 상태를 조절할 수 있습니다. 부분 집계는 기본 통계에서 제외됩니다. 확정 상태는 출처와 함께 사용자가 검증하여 입력한 CSV 값에만 부여합니다.

이후 수익률은 조건일 대비 1·7·30달력일 뒤 기준가격으로 계산합니다. 없는 날짜는 표본에서 제외합니다. 과거 유사 구간은 가격 변화와 평균 순흐름의 차이로 비교합니다. 계산 기준은 화면에 표시됩니다.

## 주요 파일

- `src/App.tsx` 화면 및 분석 조건
- `src/storage.ts` 브라우저 저장, 데이터 요청, 백업 복원
- `src/import-csv.ts` CSV 검증
- `lib/model.ts` 통계 계산
- `lib/flow-data/*.json`, `lib/flows.ts`, `lib/prices.json` 초기 데이터
- `.github/workflows/pages.yml` GitHub Pages 자동 빌드·배포

## 작은 ETF 데이터 파일 버전

기존 `lib/flows.json`은 삭제하고 `lib/flows.ts`와 `lib/flow-data/` 폴더 전체를 업로드하세요. `src/App.tsx`와 `src/storage.ts`도 함께 교체해야 합니다. ETF 데이터는 파일당 8,000바이트 이하로 분할되어 빌드할 때 합쳐집니다. 모든 과거 데이터와 날짜 순서를 보존합니다. 전체 ZIP 내용으로 저장소를 교체하면 됩니다.

### 기존 저장소에 적용

기존 `lib` 폴더 전체를 삭제한 다음 이번 ZIP의 `lib` 폴더로 교체하세요. 이전 버전의 미사용 connector 파일과 utils.ts는 빌드 오류를 일으킬 수 있어 제거했습니다. `src/App.tsx`와 `src/storage.ts`도 이번 파일로 덮어쓰세요. 새 저장소에는 ZIP 내용 전체를 최상위에 업로드하면 됩니다.
