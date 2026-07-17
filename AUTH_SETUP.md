# Global K-Route 회원 기능 설정

## 구현 범위

- 아이디, 이메일, 비밀번호 회원가입
- 가입 시 이메일 인증 생략 및 자동 로그인
- BCrypt 비밀번호 해시 저장
- TiDB에 해시만 저장하는 로그인 세션과 HttpOnly 쿠키
- 이메일 기반 아이디 안내
- 30분 유효 일회용 링크 기반 비밀번호 재설정
- 비밀번호 변경 시 기존 로그인 세션 전체 만료
- CSRF 보호와 Vercel 동일 출처 백엔드 프록시

## TiDB 준비

운영 프로필은 `spring.jpa.hibernate.ddl-auto=validate`이므로 첫 배포 전에
`backend/kroute/kroute/src/main/resources/db/manual/001_auth_schema.sql`을 TiDB에서 한 번 실행한다.

개발 프로필의 `ddl-auto=update`로 먼저 테이블을 만들었더라도 운영 DB에는 SQL 실행 여부를 직접 확인한다.

## Mailjet 준비

1. Mailjet 계정을 만들고 발신자 이메일 또는 발신 도메인을 인증한다.
2. API Key와 Secret Key를 발급한다.
3. Cloud Run의 `kroute-api` 서비스 환경 변수에 아래 값을 추가한다.

```text
MAILJET_API_KEY=발급한 API Key
MAILJET_SECRET_KEY=발급한 Secret Key
MAILJET_FROM_EMAIL=Mailjet에서 인증한 발신 주소
MAILJET_FROM_NAME=Global K-Route
FRONTEND_BASE_URL=https://global-k-route.vercel.app
AUTH_SECURE_COOKIE=true
AUTH_SESSION_DAYS=7
PASSWORD_RESET_MINUTES=30
```

Mailjet API는 HTTPS 443을 사용하므로 Cloud Run의 SMTP 25번 포트 제한과 관계없다.

## Vercel 준비

Vercel 프로젝트 환경 변수에 아래 값을 추가하고 재배포한다.

```text
BACKEND_API_URL=https://kroute-api-984756319017.asia-northeast3.run.app
```

`NEXT_PUBLIC_API_BASE_URL`은 브라우저가 Cloud Run을 직접 호출하던 기존 설정이다. 새 코드는
`/backend-api` 프록시를 사용하므로 `BACKEND_API_URL`로 교체하는 것을 권장한다. 이 값에는
`/api`를 붙이지 않는다.

## 로컬 실행

백엔드 `.env`에는 `.env.example`의 Mailjet 및 인증 변수를 실제 값으로 구성한다. 로컬 HTTP에서는
`AUTH_SECURE_COOKIE=false`, `FRONTEND_BASE_URL=http://localhost:3000`을 사용한다. 백엔드는 DB가 연결되는
`dev` 프로필로 실행해야 하며, 기본 `local` 프로필에서는 회원 API가 활성화되지 않는다.

프론트엔드 `.env.local`에는 아래 값을 사용한다.

```text
BACKEND_API_URL=http://localhost:8081
NEXT_PUBLIC_KAKAO_MAP_APP_KEY=기존 JavaScript 키
```

## 확인 순서

1. 회원가입 후 `user_accounts`, `auth_sessions` 테이블에 행이 생성되는지 확인한다.
2. 새로고침 후에도 로그인 상태가 유지되는지 확인한다.
3. 로그아웃 후 동일 세션으로 `/api/auth/me`가 비로그인 상태를 반환하는지 확인한다.
4. 아이디 찾기 메일에 가입 아이디가 표시되는지 확인한다.
5. 비밀번호 재설정 메일 링크가 Vercel 주소로 열리는지 확인한다.
6. 새 비밀번호로 로그인되고 이전 비밀번호와 기존 세션이 더 이상 동작하지 않는지 확인한다.

## 보안 기준

- DB에는 원문 비밀번호, 원문 로그인 토큰, 원문 재설정 토큰을 저장하지 않는다.
- 아이디 찾기와 비밀번호 찾기는 계정 존재 여부를 화면 응답으로 노출하지 않는다.
- Mailjet Secret Key와 DB 비밀번호는 GitHub 및 Vercel의 공개 환경 변수에 넣지 않는다.
- 운영 전 계정 복구 요청 횟수 제한, 휴면 토큰 정리 배치, 개인정보 처리방침을 추가 검토한다.
