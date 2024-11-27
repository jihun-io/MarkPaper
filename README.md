<h1 style="text-align: center;">MarkPaper</h1>
<p style="text-align: center;">마크다운으로 시작하는 깔끔한 문서 제작</p>

## 1. 프로젝트 소개
MarkPaper는 마크다운 및 일부 HTML 태그와 CSS를 활용하여 인쇄물을 제작할 수 있는 애플리케이션입니다.

"마크다운을 활용하여 깔끔한 종이 문서나 PDF 문서를 만들 수 없을까?"라는 질문에서 시작한 프로젝트입니다. 다른 마크다운 에디터나 Notion이 대안이 될 수 있겠지만, 인쇄물을 출력하는 용도로는 서체나 서체 크기와 같은 스타일링이 제한되어 있다는 점이 만족스럽지 않았습니다. MarkPaper는 저와 같은 마크다운 애호가들이 워드프로세서 없이 마크다운만으로 손쉽게 인쇄물을 출력할 수 있도록 하기 위해 개발되었습니다.

## 2. 기능
- 마크다운 문서 열기, 작성, 저장
- 출력 결과의 페이지 나누기
- 서체 선택 및 문서의 기본 글자 크기 설정
- 렌더링된 마크다운 문서 미리 보기
- 인쇄 및 PDF 저장
- 일부 HTML 태그 및 CSS 지원

### 2.1. 기능 상세
1. 마크다운과 더불어 일부 HTML 코드를 지원합니다. `<div>`와 `style` 속성으로 레이아웃을 구성할 수 있습니다. 단, HTML 코드를 작성할 때는 들여쓰기를 사용할 수 없습니다.
2. Windows 탐색기 혹은 macOS Finder에서 *.md 파일을 더블 클릭하여 바로 열 수 있습니다. 연결 프로그램 설정이 필요할 수 있습니다.
3. Monaco 에디터를 사용하므로, Visual Studio Code에서 코드를 작성하는 것과 동일한 환경을 제공합니다.

## 3. 기술 스택
- Electron, React, Zustand, Monaco 에디터

## 4. 지원하는 운영체제
- Windows
- macOS

## 5. MarkPaper 사용법
### 5.1. 마크다운
기본적으로 마크다운 문법의 전체를 지원합니다. 

또한, `---pagebreak---`로 페이지를 나눌 수 있습니다.

```
첫 번째 페이지입니다.

---pagebreak---

두 번째 페이지입니다.
```

### 5.2. HTML
MarkPaper는 일부 HTML 문법을 지원합니다. 지원하는 태그의 목록은 다음과 같습니다. 
- 레이아웃: `div`
- 텍스트: `span`, `p`, `a`, `br`
- 이미지: `img`, `svg`, `path`
- 머리말: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`
- 표: `table`, `thead`, `tbody`, `tr`, `th`, `td`
- 스타일: `style`


### 5.3. CSS
#### 5.3.1. 인라인 스타일
HTML 요소의 `style` 속성으로 직접 제어할 수 있습니다. 예를 들어, 문단을 가운데 정렬하려면 다음과 같이 작성할 수 있습니다.

```
<p style="text-align: center;">이 문단은 가운데 정렬이 적용된 문단입니다.</p>
```

`width: 100vw`로 페이지 전체 너비를, `height: 100vh`로 페이지 전체 높이를 지정할 수 있습니다. 예를 들어, 특정 페이지에서 레이아웃을 구성하고 페이지의 하단에 특정 콘텐츠를 고정시키려면 다음과 같이 작성할 수 있습니다.
```
<div style="height: 100vh; display: flex; flex-direction: column; justify-content: space-between;"> 
<div>

메인 영역

</div>  

<div>

푸터 영역

</div>
</div>
```

#### 5.3.2. `<style>` 태그
MarkPaper는 style 태그를 활용하여 CSS를 작성할 수 있으며, 선택자는 `.prose`로 시작해야 합니다. 예를 들어 다음과 같습니다.
```
<style>
.prose {
  font-family: SourceHanSerif;
}

.prose p {
  line-height: 2;
  text-indent: 1em;
}
</style>
```

`.prose` 선택자에서 글자 크기를 지정할 수 있습니다. 기본 값은 12pt입니다. 상단 도구 막대에서도 문서의 기본 글자 크기를 지정할 수 있습니다. 

```
<style>
.prose {
  font-size: 14pt;
}
</style>
```

또한, `.prose` 선택자에서 서체를 설정할 수 있습니다. 기본 값은 Pretendard입니다. 상단 도구 막대에서도 문서의 기본 서체를 지정할 수 있습니다. 지원하는 서체는 현재 Pretendard(`Pretendard`), 본명조(`SourceHanSerif`), Koddi UD 온고딕(`KoddiUDOnGothic`)입니다.

```
<style>
.prose {
  font-family: SourceHanSerif;
}
</style>
```

### 5.4. Monaco 에디터
MarkPaper는 Visual Studio Code에서 사용 중인 Monaco 에디터를 사용 중입니다. VS Code에서 사용 가능한 단축 키의 일부를 사용할 수 있습니다.

에디터의 기본 언어는 마크다운으로 설정되어 있으며, 기본 들여쓰기 방식은 2칸 공백입니다.

### 5.5. 미리 보기
Monaco 에디터에서 작성된 마크다운은 미리 보기 영역에 실시간으로 보여집니다. 인쇄 환경과 유사하지만, 페이지 구분 없이 보여집니다.

### 5.6. 인쇄 및 PDF 저장
상단 도구 막대에서 인쇄 버튼을 누르면 인쇄 미리 보기 창이 표시됩니다. 이 창에서 출력 결과물을 미리 볼 수 있으며, 프린터로 인쇄하거나 PDF 파일로 저장할 수 있습니다.

## 6. 향후 로드맵
- [ ] 목차 자동 생성 기능
- [ ] 문서 서식 편집 기능
- [ ] 페이지 하단 각주 기능
- [ ] LaTeX 문법 지원
- [ ] 더 많은 서체 지원
