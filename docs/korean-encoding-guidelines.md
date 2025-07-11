# 한글 인코딩 문제 예방 가이드라인

## 🛡️ 예방 조치

### 1. 개발 환경 설정

#### VS Code 설정 (.vscode/settings.json)
```json
{
  "files.encoding": "utf8",
  "files.autoGuessEncoding": false,
  "files.insertFinalNewline": true,
  "files.trimFinalNewlines": true,
  "files.trimTrailingWhitespace": true,
  "editor.formatOnSave": true
}
```

#### Git 설정
```bash
git config core.autocrlf false
git config core.safecrlf true
git config core.quotepath false
```

### 2. 개발 규칙

1. **항상 UTF-8 BOM 없이 저장**
2. **복사/붙여넣기 시 인코딩 확인**
3. **외부 소스에서 코드 가져올 때 주의**
4. **정기적인 인코딩 검사**

### 3. 정기 점검

- 주간: 새로 작성된 파일 인코딩 확인
- 월간: 전체 프로젝트 인코딩 검사
- 릴리즈 전: 전체 한글 주석 검증

### 4. 문제 발생 시 대응

1. 즉시 수정 작업 중단
2. 문제 파일 백업
3. 일괄 수정 스크립트 실행
4. 수정 결과 검증
5. Git 커밋

## 🔧 도구 활용

### 인코딩 검사 명령어
```powershell
# 프로젝트 전체 검사
python korean-encoding-analysis.ipynb

# 특정 파일 검사
file <filename>  # Linux/Mac
Get-Content <filename> -Encoding UTF8  # PowerShell
```

### 자동화 스크립트
- `fix-korean-encoding.ps1`: 일괄 수정
- `check-encoding.ps1`: 정기 점검 (생성 예정)

## 📊 품질 지표

- 인코딩 문제 파일 비율: 0% 목표
- 한글 주석 가독성: 100% 목표
- 개발자 만족도: 높음 유지
