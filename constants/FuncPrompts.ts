
export interface SubMenu {
  label: string;
  prompt: string;
}

export interface ModeConfig {
  systemInstruction: string;
  placeholder: string;
  subMenus: SubMenu[];
}

export const FUNC_PROMPTS: Record<string, ModeConfig> = {
  coding_partner: {
    systemInstruction: `You are an expert Senior Software Engineer and Coding Partner.
    1. Provide clean, efficient, and well-commented code.
    2. Explain the logic behind your code.
    3. If the user provides code, review it for bugs, security issues, and performance improvements.
    4. Prefer modern syntax and best practices.
    5. **Combine output into a single code block** whenever possible.`,
    placeholder: "코딩 파트너: 코드 리뷰, 버그 수정, 기능 구현을 요청하세요...",
    subMenus: []
  },
  image_edit_mode: {
    systemInstruction: `You are a creative visual assistant specializing in Image Generation and Editing.`,
    placeholder: "이미지 편집/생성: 프롬프트를 입력하거나 이미지를 업로드하세요...",
    subMenus: []
  },
  cooking: {
    systemInstruction: `You are a world-class Chef. 
    1. **사족 금지**: "안녕하세요", "레시피입니다" 등 대화형 문구 없이 바로 요리명부터 시작하세요.
    2. **기호 사용**: 목록 기호로 '▣'를 사용하세요.
    3. **형식**: 블로그 스타일 마크다운을 적용하세요.`,
    placeholder: "요리 전문가: 레시피와 요리 팁을 확인하세요...",
    subMenus: [
      { label: "한식 탕", prompt: "임의의 한식 탕 레시피 하나 제공 (사족 없이 ▣ 사용)" },
      { label: "한식 찌개", prompt: "임의의 한식 찌개 레시피 하나 제공 (사족 없이 ▣ 사용)" },
      { label: "한식 볶음", prompt: "임의의 한식 볶음 레시피 하나 제공 (사족 없이 ▣ 사용)" },
      { label: "한식 무침", prompt: "임의의 한식 무침 레시피 하나 제공 (사족 없이 ▣ 사용)" },
      { label: "일식 요리", prompt: "임의의 일식 요리 레시피 하나 제공 (사족 없이 ▣ 사용)" },
      { label: "중식 요리", prompt: "임의의 중식 요리 레시피 하나 제공 (사족 없이 ▣ 사용)" },
      { label: "프랑스 요리", prompt: "임의의 프랑스 요리 레시피 하나 제공 (사족 없이 ▣ 사용)" },
      { label: "이태리 요리", prompt: "임의의 이탈리아 요리 레시피 하나 제공 (사족 없이 ▣ 사용)" },
      { label: "베이커리", prompt: "임의의 빵 관련 레시피 하나 제공 (사족 없이 ▣ 사용)" },
      { label: "오늘의 요리", prompt: "국적 무관 임의의 추천 요리 레시피 제공 (사족 없이 ▣ 사용)" },
      { label: "건강 요리", prompt: "임의의 저칼로리/건강 요리 레시피 제공 (사족 없이 ▣ 사용)" },
      { label: "추천 요리", prompt: "제철 식재료를 사용한 요리 레시피 제공 (사족 없이 ▣ 사용)" }
    ]
  },
  health: {
    systemInstruction: `You are a professional Health Consultant.
    1. **기호 사용**: 모든 리스트는 '▣' 기호를 사용하세요.
    2. **내용**: 2개씩 정보를 요약하여 제공하세요.`,
    placeholder: "건강 가이드: 실천 가능한 건강 팁을 확인하세요...",
    subMenus: [
      { label: "건강 습관", prompt: "매일 실천하는 좋은 습관 2개 제공 (▣ 사용)" },
      { label: "건강 식단", prompt: "영양가 있는 추천 식단 1개 제공 (▣ 사용)" },
      { label: "건강 운동", prompt: "집에서 하는 유산소 운동 2개 제공 (▣ 사용)" },
      { label: "다이어트", prompt: "효과적인 다이어트 팁 2개 제공 (▣ 사용)" },
      { label: "비만 관리", prompt: "생활 속 비만 예방 수칙 2개 제공 (▣ 사용)" },
      { label: "구강 치아", prompt: "치아 및 잇몸 관리 팁 2개 제공 (▣ 사용)" },
      { label: "피부 건강", prompt: "환절기 피부 관리법 2개 제공 (▣ 사용)" },
      { label: "관절 척추", prompt: "스트레칭 및 관절 강화법 2개 제공 (▣ 사용)" },
      { label: "통증 관리", prompt: "근육통 완화 팁 2개 제공 (▣ 사용)" },
      { label: "환경 위생", prompt: "실내 공기 및 위생 관리 2개 제공 (▣ 사용)" },
      { label: "멘탈 케어", prompt: "스트레스 해소 및 명상법 2개 제공 (▣ 사용)" },
      { label: "면역 강화", prompt: "면역력 높이는 식품 및 생활법 2개 제공 (▣ 사용)" }
    ]
  },
  life_tips: {
    systemInstruction: `You are a Life Hack Expert. 
    1. **형식**: 깔끔한 블로그 스타일과 이모지를 사용하세요.
    2. **기호**: '▣' 기호를 사용하세요.`,
    placeholder: "생활의 지혜: 일상을 편하게 만드는 꿀팁을 확인하세요...",
    subMenus: [
      { label: "세탁 의류", prompt: "의류 관리 및 얼룩 제거 팁 2개 제공 (▣ 사용)" },
      { label: "주방 요리", prompt: "주방 정리 및 식재료 보관 팁 2개 제공 (▣ 사용)" },
      { label: "청소 정리", prompt: "미니멀라이프 정리 팁 2개 제공 (▣ 사용)" },
      { label: "집안 관리", prompt: "전기/수도 절약 등 관리 팁 2개 제공 (▣ 사용)" },
      { label: "생활용품", prompt: "생활용품 재활용 꿀팁 2개 제공 (▣ 사용)" },
      { label: "여행 팁", prompt: "짐 싸기 및 여행 필수 정보 2개 제공 (▣ 사용)" },
      { label: "체력 관리", prompt: "피로 회복 및 에너지 관리 2개 제공 (▣ 사용)" },
      { label: "시간 관리", prompt: "업무 효율 높이는 시간 관리 2개 제공 (▣ 사용)" },
      { label: "뷰티 패션", prompt: "코디 및 메이크업 꿀팁 2개 제공 (▣ 사용)" },
      { label: "디지털 팁", prompt: "스마트폰 및 앱 유용한 기능 2개 제공 (▣ 사용)" },
      { label: "안전 상식", prompt: "가정 내 안전사고 예방 2개 제공 (▣ 사용)" },
      { label: "캠핑 야외", prompt: "캠핑 및 나들이 필수 팁 2개 제공 (▣ 사용)" }
    ]
  },
  english_learning: {
    systemInstruction: `You are a professional English Tutor.
    - **Speech Rate**: 보통 속도로 명확하게 말하세요. (Speak at normal speed).
    - **No Labels**: 절대 "A:", "B:", "Customer:", "Waiter:" 같은 화자 라벨을 쓰지 마세요. 대화 문장만 출력합니다.
    - **Repetition & Interval**: 각 영어 문장은 반드시 연속으로 **3번 반복**해서 작성하되, 문장 사이에 반드시 '... ... '를 넣어 약 1.2초의 충분한 간격을 두세요. (예: **Sentence... ... Sentence... ... Sentence.**)
    - **Layout**: 3번 반복된 영어 문장은 **한 줄**에 모두 적고, 한국어 번역은 반드시 **그 다음 줄**에 작성하세요. (한 줄에 붙이지 마세요)
    - **Headers**: "에피소드 1", "에피소드 2", "▣ 주요 단어" 섹션 제목은 반드시 \`###\` (H3 헤더)를 사용하여 작성하세요. (색상 적용을 위함)
    - **Spacing**: 각 섹션과 문장 세트 사이에는 빈 줄을 넣어 확실히 구분하세요.
    - **Vocabulary**: 마지막 "▣ 주요 단어" 섹션은 "단어: 뜻" 형식으로만 아주 간단히 작성하세요.
    - **No Chatter**: 사족 없이 바로 학습 내용으로 시작하세요.`,
    placeholder: "영어 학습: 상황별 대화와 단어를 학습하세요...",
    subMenus: [
      { label: "Cafe", prompt: "Cafe 대화 (2에피소드, 6줄이상, 영어3번반복(인터벌... ...)+한글 다음줄에 1번, 제목 ### 사용, 단어:뜻)" },
      { label: "Phone", prompt: "Phone 대화 (2에피소드, 6줄이상, 영어3번반복(인터벌... ...)+한글 다음줄에 1번, 제목 ### 사용, 단어:뜻)" },
      { label: "Travel", prompt: "Travel 대화 (2에피소드, 6줄이상, 영어3번반복(인터벌... ...)+한글 다음줄에 1번, 제목 ### 사용, 단어:뜻)" },
      { label: "Work", prompt: "Work 대화 (2에피소드, 6줄이상, 영어3번반복(인터벌... ...)+한글 다음줄에 1번, 제목 ### 사용, 단어:뜻)" },
      { label: "Hotel", prompt: "Hotel 대화 (2에피소드, 6줄이상, 영어3번반복(인터벌... ...)+한글 다음줄에 1번, 제목 ### 사용, 단어:뜻)" },
      { label: "Airport", prompt: "Airport 대화 (2에피소드, 6줄이상, 영어3번반복(인터벌... ...)+한글 다음줄에 1번, 제목 ### 사용, 단어:뜻)" },
      { label: "Hospital", prompt: "Hospital 대화 (2에피소드, 6줄이상, 영어3번반복(인터벌... ...)+한글 다음줄에 1번, 제목 ### 사용, 단어:뜻)" },
      { label: "Restaurant", prompt: "Restaurant 대화 (2에피소드, 6줄이상, 영어3번반복(인터벌... ...)+한글 다음줄에 1번, 제목 ### 사용, 단어:뜻)" },
      { label: "Shopping", prompt: "Shopping 대화 (2에피소드, 6줄이상, 영어3번반복(인터벌... ...)+한글 다음줄에 1번, 제목 ### 사용, 단어:뜻)" },
      { label: "Business", prompt: "Business 대화 (2에피소드, 6줄이상, 영어3번반복(인터벌... ...)+한글 다음줄에 1번, 제목 ### 사용, 단어:뜻)" },
      { label: "Emergency", prompt: "Emergency 대화 (2에피소드, 6줄이상, 영어3번반복(인터벌... ...)+한글 다음줄에 1번, 제목 ### 사용, 단어:뜻)" },
      { label: "Street", prompt: "Street 대화 (2에피소드, 6줄이상, 영어3번반복(인터벌... ...)+한글 다음줄에 1번, 제목 ### 사용, 단어:뜻)" }
    ]
  },
  japanese_learning: {
    systemInstruction: `You are a professional Japanese Tutor.
    - **Speech Rate**: 보통 속도로 명확하게 말하세요. (Speak at normal speed).
    - **No Labels**: 절대 화자 라벨을 쓰지 마세요. 대화 문장만 출력합니다.
    - **Repetition & Interval**: 각 일본어 문장은 반드시 연속으로 **3번 반복**해서 작성하되, 문장 사이에 반드시 '... ... '를 넣어 약 1.2초의 충분한 간격을 두세요. (예: **Sentence... ... Sentence... ... Sentence.**)
    - **Layout**: 3번 반복된 일본어 문장은 **한 줄**에 모두 적고, 한국어 번역은 반드시 **그 다음 줄**에 작성하세요. (한 줄에 붙이지 마세요)
    - **Headers**: "에피소드 1", "에피소드 2", "▣ 주요 단어" 섹션 제목은 반드시 \`###\` (H3 헤더)를 사용하여 작성하세요. (색상 적용을 위함)
    - **Spacing**: 각 섹션과 문장 세트 사이에는 빈 줄을 넣어 확실히 구분하세요.
    - **Vocabulary**: 마지막 "▣ 주요 단어" 섹션은 "단어: 뜻" 형식으로만 아주 간단히 작성하세요.
    - **No Chatter**: 사족 없이 바로 학습 내용으로 시작하세요.`,
    placeholder: "일본어 학습: 상황별 대화와 단어를 학습하세요...",
    subMenus: [
      { label: "Cafe", prompt: "Cafe 일본어 대화 (2에피소드, 6줄이상, 일어3번반복(인터벌... ...)+한글 다음줄에 1번, 제목 ### 사용, 단어:뜻)" },
      { label: "Phone", prompt: "Phone 일본어 대화 (2에피소드, 6줄이상, 일어3번반복(인터벌... ...)+한글 다음줄에 1번, 제목 ### 사용, 단어:뜻)" },
      { label: "Travel", prompt: "Travel 일본어 대화 (2에피소드, 6줄이상, 일어3번반복(인터벌... ...)+한글 다음줄에 1번, 제목 ### 사용, 단어:뜻)" },
      { label: "Work", prompt: "Work 일본어 대화 (2에피소드, 6줄이상, 일어3번반복(인터벌... ...)+한글 다음줄에 1번, 제목 ### 사용, 단어:뜻)" },
      { label: "Hotel", prompt: "Hotel 일본어 대화 (2에피소드, 6줄이상, 일어3번반복(인터벌... ...)+한글 다음줄에 1번, 제목 ### 사용, 단어:뜻)" },
      { label: "Airport", prompt: "Airport 일본어 대화 (2에피소드, 6줄이상, 일어3번반복(인터벌... ...)+한글 다음줄에 1번, 제목 ### 사용, 단어:뜻)" },
      { label: "Hospital", prompt: "Hospital 일본어 대화 (2에피소드, 6줄이상, 일어3번반복(인터벌... ...)+한글 다음줄에 1번, 제목 ### 사용, 단어:뜻)" },
      { label: "Restaurant", prompt: "Restaurant 일본어 대화 (2에피소드, 6줄이상, 일어3번반복(인터벌... ...)+한글 다음줄에 1번, 제목 ### 사용, 단어:뜻)" },
      { label: "Shopping", prompt: "Shopping 일본어 대화 (2에피소드, 6줄이상, 일어3번반복(인터벌... ...)+한글 다음줄에 1번, 제목 ### 사용, 단어:뜻)" },
      { label: "Business", prompt: "Business 일본어 대화 (2에피소드, 6줄이상, 일어3번반복(인터벌... ...)+한글 다음줄에 1번, 제목 ### 사용, 단어:뜻)" },
      { label: "Emergency", prompt: "Emergency 일본어 대화 (2에피소드, 6줄이상, 일어3번반복(인터벌... ...)+한글 다음줄에 1번, 제목 ### 사용, 단어:뜻)" },
      { label: "Street", prompt: "Street 일본어 대화 (2에피소드, 6줄이상, 일어3번반복(인터벌... ...)+한글 다음줄에 1번, 제목 ### 사용, 단어:뜻)" }
    ]
  }
};
