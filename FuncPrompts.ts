
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
    5. Use markdown code blocks for all code outputs.`,
    placeholder: "코딩 파트너: 코드 리뷰, 버그 수정, 기능 구현을 요청하세요...",
    subMenus: []
  },
  image_edit_mode: {
    systemInstruction: `You are a creative visual assistant specializing in Image Generation and Editing prompts.
    1. If the user wants to generate an image, help refine their prompt to be highly descriptive (lighting, style, composition).
    2. If the user uploads an image, analyze it or suggest edits.`,
    placeholder: "이미지 편집/생성: 생성하고 싶은 이미지를 묘사하거나 사진을 올려주세요...",
    subMenus: []
  },
  cooking: {
    systemInstruction: `You are a world-class Chef and Culinary Expert (Cooking Mode).
    1. Provide detailed, step-by-step recipes.
    2. Include a list of ingredients with precise measurements.
    3. Add tips for better taste or plating.
    4. Format the output elegantly using Markdown (tables for ingredients, bold for steps).
    5. Be encouraging and passionate about food.`,
    placeholder: "요리 배우기: 레시피나 요리 팁을 선택하세요...",
    subMenus: [
      { label: "한식 탕", prompt: "임의의 한식 탕 관련 레시피 하나를 제공 해" },
      { label: "한식 찌개", prompt: "임의의 한식 찌개 관련 레시피 하나를 제공 해" },
      { label: "한식 볶음", prompt: "임의의 한식 볶음 관련 레시피 하나를 제공 해" },
      { label: "한식 무침", prompt: "임의의 한식 무침 관련 레시피 하나를 제공 해" },
      { label: "일식 요리", prompt: "임의의 일식 요리 관련 레시피 하나를 제공 해" },
      { label: "중식 요리", prompt: "임의의 중식 요리 관련 레시피 하나를 제공 해" },
      { label: "프랑스 요리", prompt: "임의의 프랑스 요리 관련 레시피 하나를 제공 해" },
      { label: "이탈리아 요리", prompt: "임의의 이탈리아 요리 관련 레시피 하나를 제공 해" },
      { label: "Baguette", prompt: "임의의 빵 관련 레시피 하나를 제공 해" },
      { label: "오늘의 요리", prompt: "국적이 다 포함된 임의의 요리 관련 레시피 하나를 제공 해" },
      { label: "건강 요리", prompt: "임의의 건강하고 영양가 있는 요리 관련 레시피 하나를 제공 해" },
      { label: "추천 요리", prompt: "현재 할 수 있는 요리 하나를 레시피 제공 해" }
    ]
  },
  health: {
    systemInstruction: `You are a professional Health & Wellness Consultant.
    1. Provide reliable, general health information (disclaimer: not medical advice).
    2. Use '▣' or '◈' for lists instead of numbers (1, 2).
    3. Structure content clearly with headings.
    4. Tone: Supportive, informative, and professional.`,
    placeholder: "건강 관리: 건강 팁이나 운동 정보를 선택하세요...",
    subMenus: [
      { label: "건강 습관", prompt: "건강 습관 관련 정보를 이전과 다른 2개씩 제공 해 (목록은 ▣ 사용)" },
      { label: "건강 식단", prompt: "건강 식단 임의의 건강하고 영양가 있는 레시피 하나를 임의로 제공 해" },
      { label: "건강 운동", prompt: "건강 운동 관련 정보를 이전과 다른 2개씩 제공 해 (목록은 ▣ 사용)" },
      { label: "다이어트", prompt: "다이어트 관련 정보를 이전과 다른 2개씩 제공 해 (목록은 ▣ 사용)" },
      { label: "비만 관리", prompt: "비만 관리 관련 정보를 이전과 다른 2개씩 제공 해 (목록은 ▣ 사용)" },
      { label: "구강 치아", prompt: "구강과 치아 관련 정보를 이전과 다른 2개씩 제공 해 (목록은 ▣ 사용)" },
      { label: "피부 건강", prompt: "피부 건강 관련 정보를 이전과 다른 2개씩 제공 해 (목록은 ▣ 사용)" },
      { label: "관절 척추", prompt: "관절과 척추 관련 정보를 이전과 다른 2개씩 제공 해 (목록은 ▣ 사용)" },
      { label: "통증 관리", prompt: "통증 관리 관련 정보를 이전과 다른 2개씩 제공 해 (목록은 ▣ 사용)" },
      { label: "환경 관리", prompt: "평상시 생활 속 환경 위생 관리 관련 정보를 이전과 다른 2개씩 제공 해 (목록은 ▣ 사용)" },
      { label: "멘탈 강화", prompt: "멘탈 강화 관련 정보를 이전과 다른 2개씩 제공 해 (목록은 ▣ 사용)" },
      { label: "면역 강화", prompt: "면역 강화 관련 정보를 이전과 다른 2개씩 제공 해 (목록은 ▣ 사용)" }
    ]
  },
  life_tips: {
    systemInstruction: `You are a Life Hack and Lifestyle Expert.
    1. Provide practical, easy-to-follow tips for daily life.
    2. Use '▣' or '◈' for lists instead of numbers (1, 2).
    3. Cover various aspects like cleaning, organizing, travel, etc.
    4. Tone: Friendly and helpful.`,
    placeholder: "생활 Tips: 유용한 생활 꿀팁을 선택하세요...",
    subMenus: [
      { label: "세탁 의류", prompt: "세탁 의류 Tip을 이전과 다른 2개씩 제공 해 (목록은 ▣ 사용)" },
      { label: "주방 요리", prompt: "주방 요리 Tip을 이전과 다른 2개씩 제공 해 (목록은 ▣ 사용)" },
      { label: "청소 정리", prompt: "청소 정리 Tip을 이전과 다른 2개씩 제공 해 (목록은 ▣ 사용)" },
      { label: "집안 관리", prompt: "집안 관리 Tip을 이전과 다른 2개씩 제공 해 (목록은 ▣ 사용)" },
      { label: "생활용품", prompt: "생활용품 관리 Tip을 이전과 다른 2개씩 제공 해 (목록은 ▣ 사용)" },
      { label: "여행 나들이", prompt: "여행 나들이 Tip을 이전과 다른 2개씩 제공 해 (목록은 ▣ 사용)" },
      { label: "건강 운동", prompt: "건강 운동 Tip을 이전과 다른 2개씩 제공 해 (목록은 ▣ 사용)" },
      { label: "멘탈 관리", prompt: "멘탈 관리 Tip을 이전과 다른 2개씩 제공 해 (목록은 ▣ 사용)" },
      { label: "뷰티 패션", prompt: "뷰티 패션 Tip을 이전과 다른 2개씩 제공 해 (목록은 ▣ 사용)" },
      { label: "앱 활용", prompt: "앱 활용 Tip을 이전과 다른 2개씩 제공 해 (목록은 ▣ 사용)" },
      { label: "안전 비상", prompt: "안전 비상 Tip을 이전과 다른 2개씩 제공 해 (목록은 ▣ 사용)" },
      { label: "캠핑 야외", prompt: "캠핑 할때 Tip을 이전과 다른 2개씩 제공 해 (목록은 ▣ 사용)" }
    ]
  },
  english_learning: {
    systemInstruction: `You are a professional English language tutor. 
    1. Primary Goal: Teach conversation and vocabulary.
    2. Output strictly the content requested (Dialogue or Word List). Avoid unnecessary introductory text.
    3. For dialogues: Provide 3-6 lines per dialogue, 3 different sets.
    4. For words: Provide 10 words with pronunciation (IPA or phonetic) and Korean translation.
    5. When playing audio, speak clearly and at a moderate pace.`,
    placeholder: "영어 학습: 상황별 회화나 단어를 선택하세요...",
    subMenus: [
      { label: "Cafe", prompt: "Cafe 관련된 상황에 맞게 상황극 영어 대화를 3~6줄씩 3개를 이전과 다르게 만들어 (잡담 제외, 회화만 출력)" },
      { label: "Phone", prompt: "Phone 관련된 상황에 맞게 상황극 영어 대화를 3~6줄씩 3개를 이전과 다르게 만들어 (잡담 제외, 회화만 출력)" },
      { label: "Travel", prompt: "Travel 관련된 상황에 맞게 상황극 영어 대화를 3~6줄씩 3개를 이전과 다르게 만들어 (잡담 제외, 회화만 출력)" },
      { label: "Work", prompt: "Work 관련된 상황에 맞게 상황극 영어 대화를 3~6줄씩 3개를 이전과 다르게 만들어 (잡담 제외, 회화만 출력)" },
      { label: "Hotel", prompt: "Hotel 관련된 상황에 맞게 상황극 영어 대화를 3~6줄씩 3개를 이전과 다르게 만들어 (잡담 제외, 회화만 출력)" },
      { label: "Airport", prompt: "Airport 관련된 상황에 맞게 상황극 영어 대화를 3~6줄씩 3개를 이전과 다르게 만들어 (잡담 제외, 회화만 출력)" },
      { label: "Hospital", prompt: "Hospital 관련된 상황에 맞게 상황극 영어 대화를 3~6줄씩 3개를 이전과 다르게 만들어 (잡담 제외, 회화만 출력)" },
      { label: "Restaurant", prompt: "Restaurant 관련된 상황에 맞게 상황극 영어 대화를 3~6줄씩 3개를 이전과 다르게 만들어 (잡담 제외, 회화만 출력)" },
      { label: "Shopping", prompt: "Shopping 관련된 상황에 맞게 상황극 영어 대화를 3~6줄씩 3개를 이전과 다르게 만들어 (잡담 제외, 회화만 출력)" },
      { label: "Business", prompt: "Business 관련된 상황에 맞게 상황극 영어 대화를 3~6줄씩 3개를 이전과 다르게 만들어 (잡담 제외, 회화만 출력)" },
      { label: "Emergency", prompt: "Emergency 관련된 상황에 맞게 상황극 영어 대화를 3~6줄씩 3개를 이전과 다르게 만들어 (잡담 제외, 회화만 출력)" },
      { label: "Street", prompt: "Street 관련된 상황에 맞게 상황극 영어 대화를 3~6줄씩 3개를 이전과 다르게 만들어 (잡담 제외, 회화만 출력)" },
      { label: "Chatter", prompt: "Chatter 관련된 상황에 맞게 상황극 영어 대화를 3~6줄씩 3개를 이전과 다르게 만들어 (잡담 제외, 회화만 출력)" },
      { label: "초급 단어", prompt: "초급~중급에 해당하는 영어 단어를 10개씩 보여주며 발음을 주고 번역 해" },
      { label: "중급 단어", prompt: "중급~고급에 해당하는 영어 단어를 10개씩 보여주며 발음을 주고 번역 해" },
      { label: "고급 단어", prompt: "고급~전문에 해당하는 영어 단어를 10개씩 보여주며 발음을 주고 번역 해" }
    ]
  }
};
