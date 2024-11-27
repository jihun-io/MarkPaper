<img src="https://github.com/user-attachments/assets/46caf6ee-3bd4-4c28-a6a3-132e01e384e4" width=320>

<h1 style="text-align: center;">MarkPaper</h1>
<p style="text-align: center;">마크다운으로 시작하는 깔끔한 문서 제작</p>

<img width="800" alt="image" src="https://github.com/user-attachments/assets/dd0ef010-a583-44e7-a90f-88f084da21c8" alt="MarkPaper의 스크린샷. 샘플 문서가 마크다운으로 작성되어 있고, 마크다운으로 작성된 문서가 렌더링되어 실제 문서처럼 표시되고 있다.">


## 1. 프로젝트 소개
MarkPaper는 마크다운으로 깔끔한 문서를 만들고 인쇄할 수 있는 애플리케이션입니다.

기존의 마크다운 에디터들은 문서 작성과 미리보기에 초점이 맞춰져 있어, 실제 인쇄물 제작에는 한계가 있었습니다. 특히 서체 선택이나 스타일링과 같은 세부적인 디자인 요소를 조정하기 어려웠죠. MarkPaper는 이러한 한계를 극복하고자 합니다.

MarkPaper를 사용하면 마크다운의 간결함을 유지하면서도 HTML과 CSS를 활용해 문서를 자유롭게 디자인할 수 있습니다. 워드프로세서 없이도 깔끔한 인쇄물을 만들고 싶은 마크다운 애호가들을 위한 도구이죠.

## 2. 기능
- 마크다운 문서 열기, 작성, 저장
- 사진 첨부 및 저장
- 페이지 나누기
- 서체 선택 및 기본 글자 크기 설정
- 용지 설정 (A4, A5, Letter, Legal)
- 렌더링된 마크다운 문서 미리 보기
- 인쇄 및 PDF 저장
- 일부 HTML 태그 및 CSS 지원

### 2.1. 기능 상세
1. MarkPaper는 기본 확장자로 `*.mp`를 사용합니다. `*.mp` 파일 내부에 사진을 저장하기 때문에 자유롭게 사진 첨부가 가능합니다. 물론, `*.md` 파일로도 저장할 수 있습니다.
2. Windows 탐색기 혹은 macOS Finder에서 `*.mp` 혹은 `*.md` 파일을 더블 클릭하여 바로 열 수 있습니다. 연결 프로그램 설정이 필요할 수 있습니다.
3. 마크다운과 더불어 일부 HTML 코드를 지원합니다. `<div>`와 `style` 속성으로 레이아웃을 구성할 수 있습니다. HTML 코드를 작성할 때는 들여쓰기를 사용할 수 없습니다.
4. Monaco 에디터를 사용하므로, Visual Studio Code에서 코드를 작성하는 것과 동일한 환경을 제공합니다.

## 3. 기술 스택
- Electron, React, JavaScript, Zustand

## 4. 지원하는 운영체제
- Windows
- macOS

## 5. MarkPaper 사용 방법
### 5.1. 마크다운
기본적으로 마크다운 문법을 지원합니다. 
```
# 머리말 1
## 머리말 2
기본 **굵은 글씨** *이탤릭* ***굵은 이탤릭***  ~~취소선~~
[링크](https://example.com)
```

#### 5.1.1. 이미지 삽입
`![이미지 이름](이미지 경로)`로 이미지를 삽입할 수 있습니다. 웹 주소를 입력하여 파일을 웹에서 불러올 수 있으며, PC에 저장된 파일을 '사진 삽입' 버튼 클릭 혹은 드래그 앤 드롭으로 삽입할 수도 있습니다. 마크다운으로 추가된 이미지는 `style` 태그로 CSS에서 `img` 태그를 지정하여 스타일을 지정할 수 있지만, 개별적으로 인라인 스타일은 지정할 수 없습니다.

```
![첨부 경로 사진]($image.jpg)
![웹 경로 사진](https://placehold.co/600x400)
```

#### 5.1.2. 페이지 나누기
`---pagebreak---` 구문으로 인쇄될 페이지를 나눌 수 있습니다. `---pagebreak---` 구문 이후에 나오는 텍스트는 다음 페이지에 이어서 출력됩니다.

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

#### 5.2.1. 이미지 삽입
MarkPaper는 `img` 태그로도 이미지를 삽입할 수 있습니다. 마크다운 문법과는 달리 개별적으로 인라인 스타일을 지정할 수 있습니다. 

```
<img src="$image.jpg" alt="예제 사진" width=320 style="float: left; margin-right: 1em;">
```

### 5.3. CSS
#### 5.3.1. 인라인 스타일
HTML 요소의 `style` 속성으로 직접 제어할 수 있습니다. 예를 들어, 문단을 가운데 정렬하려면 다음과 같이 작성할 수 있습니다.

```
<p style="text-align: center;">이 문단은 가운데 정렬이 적용된 문단입니다.</p>
```

`width: 100vw`로 페이지 전체 너비를, `height: 100vh`로 페이지 전체 높이를 지정할 수 있습니다. 예를 들어, 특정 페이지에서 전체 페이지의 레이아웃을 구성하고 페이지의 하단에 특정 콘텐츠를 고정시키려면 다음과 같이 작성할 수 있습니다.
```
<div style="height: 100vh; display: flex; flex-direction: column; justify-content: space-between;"> 
<div>

메인 영역 (상단에 고정)

</div>  

<div>

푸터 영역 (하단에 고정)

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

`.prose` 선택자를 활용하여 문서의 글자 크기를 지정할 수 있습니다. 기본 값은 12pt입니다. 상단 도구 막대에서도 문서의 기본 글자 크기를 지정할 수 있습니다. 글자 크기는 일반 텍스트 기준이며, 머리말과 같이 글자 크기가 다른 요소들은 설정한 글자 크기와 비례하여 증가하거나 감소합니다.

```
<style>
.prose {
  font-size: 14pt;
}
</style>
```

또한, `.prose` 선택자에서 서체를 설정할 수 있습니다. 기본 값은 Pretendard입니다. 상단 도구 막대에서도 문서의 기본 서체를 지정할 수 있습니다. 서체는 현재 Pretendard(`Pretendard`), 본명조(`SourceHanSerif`), Koddi UD 온고딕(`KoddiUDOnGothic`)을 지원합니다.

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
Monaco 에디터에서 작성된 마크다운은 미리 보기 영역에 실시간으로 보여집니다. 인쇄 환경과 유사하지만, 페이지의 구분은 없습니다. 대신, `---pagebreak---`로 구분된 영역은 점선으로 분리되어 표시됩니다.

### 5.6. 인쇄 및 PDF 저장
상단 도구 막대에서 인쇄 버튼을 누르면 인쇄 미리 보기 창이 표시됩니다. 이 창에서 출력 결과물을 미리 볼 수 있으며, 프린터로 인쇄하거나 PDF 파일로 저장할 수 있습니다.

## 6. 향후 로드맵
- 목차 자동 생성 기능
- 문서 서식 편집 기능
- 페이지 하단 각주 기능
- LaTeX 문법 지원
- 더 많은 서체 지원
