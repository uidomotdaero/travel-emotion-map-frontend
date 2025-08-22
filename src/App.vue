<template>
  <div>
    <!-- 고정할 타이틀 부분 -->
    <div class="fixed-title">
      <div class="title-container">
        <h1>Road Emotion Archive</h1>
        <span class="account-name">@uido_motdaero</span>
      </div>
      <!-- 필요한 다른 요소들 (서브타이틀, 메뉴 등) -->
    </div>
    <main>
      <!-- 스크롤 되는 컨텐츠 부분 -->
      <div class="scrollable-content">
      <KakaoMap />

      <footer>
      <h2 style="color: black;">여정을 담다</h2>
      <label class="emotion-label quicksand-font">유튜브 채널 '의도된 멋대로'의 특별 기획! <br>제가 직접 달린 길 위에서 느낀 다채로운 감정들을 실시간으로 기록하고 지도 위에 시각화했습니다. 지도 속 작은 마커 하나하나가 저의 생생한 라이딩 스토리를 담고 있습니다.</label>
      <br>
      <h2 style="color: black;">위로가 되는 길의 기록</h2>
      <label class="emotion-label quicksand-font">여정 속 모든 감정을, 지도를 통해 당신의 마음으로 안내합니다. </label>
    </footer>
      </div>
      <p class="update-info">
        이 지도는 항상 <strong>업데이트 예정입니다</strong>. <br>
        <strong>마지막 업데이트: 2025. 8. 24.</strong><br><strong>새로운 기능</strong>과 여정으로 꾸준히 채워질 예정입니다.
      </p>
    </main>
  </div>
    <div class="footer-credit">
  <p class="made-with">
    <span class="made-text">crafted with</span>
    <span class="tech-icons">
      <i class="fab fa-vuejs" title="Vue.js"></i>
      <i class="fab fa-java" title="Spring Boot"></i>
      <i class="fab fa-postgresql" title="PostgreSQL DB"></i> <!-- Oracle DB 아이콘을 PostgreSQL로 변경! -->
    </span>
    <span class="heart-text">and <i class="fas fa-heart pulse"></i></span>
  </p>
  <p class="year-text">2025</p>

   <!-- 여기가 감성 문구 들어갈 자리! -->
  <p class="emotional-phrase">마음이 머무는 길을 기록합니다.</p>
  <!-- 또는 원하는 다른 문구로 바꾸면 돼! -->
  <!-- SNS 링크는 이전과 동일하게 유지 -->
  <div class="sns-links">
    <a href="https://www.youtube.com/@uido_motdaero" target="_blank" rel="noopener noreferrer" title="내 유튜브 채널로 이동">
      <i class="fab fa-youtube"></i>
    </a>
    <a href="https://www.instagram.com/roostergm_92/" target="_blank" rel="noopener noreferrer" title="내 인스타그램으로 이동">
      <i class="fab fa-instagram"></i>
    </a>
    <a href="https://blog.naver.com/PostList.naver?blogId=modern-gentleman" target="_blank" rel="noopener noreferrer" title="내 네이버 블로그로 이동">
      <i class="fas fa-blog"></i>
    </a>
  </div>
</div>

<div>
  <!-- 모달 열기 버튼 -->
  <button @click="openModal">공지사항 보기</button>

  <!-- 모달 창 -->
  <div v-if="showModal" class="modal-overlay">
    <div class="modal-content">
      <span class="close-btn" @click="closeModal">&times;</span>
      <h2>🌟 업데이트 공지</h2>
      <p>구독자 감정 스팟 기능이 곧 추가될 예정이에요!</p>
      <p>더 많은 여러분의 여행 감성을 공유해주세요.</p>
      <button class="modal-btn" @click="closeModal">확인</button>
    </div>
  </div>
</div>
</template>

<script>
import KakaoMap from './components/KakaoMap.vue'

export default {
  name: 'App',
  components: {
    KakaoMap
  },
  data () {
    return {
      showModal: false
    }
  },
  methods: {
    openModal () {
      this.showModal = true
    },
    closeModal () {
      this.showModal = false
    }
  },
  // 페이지 로드 시 자동으로 모달 표시 (원한다면)
  mounted () {
    setTimeout(() => {
      this.showModal = true
    }, 1000) // 1초 후에 모달 표시
  }
}

window.addEventListener('scroll', function () {
  const scrollPosition = window.scrollY
  const titleContainer = document.querySelector('.title-container')
  const titleText = document.querySelector('.title-container h1')
  const accountName = document.querySelector('.title-container .account-name')

  // 기본 크기와 최소 크기 설정
  const maxHeight = 120 // 시작 높이
  const minHeight = 60 // 최소 높이
  const maxFontSize = 2.8 // 시작 폰트 크기 (rem)
  const minFontSize = 1.8 // 최소 폰트 크기 (rem)

  // 스크롤 위치에 따라 계산 (300px 스크롤하면 최소 크기에 도달)
  const shrinkRatio = Math.max(0, Math.min(1, scrollPosition / 300))

  // 높이와 폰트 크기 계산
  const newHeight = maxHeight - shrinkRatio * (maxHeight - minHeight)
  const newFontSize = maxFontSize - shrinkRatio * (maxFontSize - minFontSize)

  // 스타일 적용
  titleContainer.style.height = newHeight + 'px'
  titleText.style.fontSize = newFontSize + 'rem'

  // 계정명도 비율에 맞게 축소
  accountName.style.fontSize = (1.1 - shrinkRatio * 0.3) + 'rem'

  // 패딩도 조절해서 전체적인 균형 유지
  titleContainer.style.paddingBottom = (35 - shrinkRatio * 15) + 'px'
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@500;700&family=Montserrat:wght@500;700&family=Poppins:wght@500;700&display=swap');
#app {
  font-family: 'Noto Sans KR', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  text-align: center;
  margin-bottom: 30px;
}

/* 공통 Footer 스타일 */
.social-links-footer {
  width: 100%;
  padding: 40px 20px; /* 위아래 여백, 좌우 여백 */
  background-color: #b3cde7; /* 어두운 배경색 (감성적 느낌) */
  color: #ecf0f1; /* 텍스트 색상 */
  text-align: center;
  border-top: 1px solid rgba(184, 184, 184, 0.1); /* 상단 구분선 */
  box-sizing: border-box; /* 패딩이 너비에 포함되도록 */
  position: relative; /* 필요 시 하단 고정 등을 위해 */
  margin-top: 60px; /* 위에 컨텐츠와 여백 주기 */
}

#app {
  width: 100%;
  padding: 40px 20px; /* 위아래 여백, 좌우 여백 */
  background-color: #ffffff; /* 어두운 배경색 (감성적 느낌) */

  color: #000000; /* 텍스트 색상 */
  text-align: center;
  border-top: 1px solid rgb(255, 255, 255); /* 상단 구분선 */
  box-sizing: border-box; /* 패딩이 너비에 포함되도록 */
  position: relative; /* 필요 시 하단 고정 등을 위해 */
  margin-top: 60px; /* 위에 컨텐츠와 여백 주기 */
}

/* 푸터 텍스트 스타일 */
.footer-text {
  font-size: 18px;
  margin-bottom: 25px;
  line-height: 1.6;
  color: #bdc3c7; /* 부드러운 회색 텍스트 */
  /* gaegu-font는 이미 정의된 곳에서 불러와 사용 */
}

/* 아이콘 컨테이너 (가운데 정렬 및 간격) */
.social-icons-container {
  display: flex;
  justify-content: center;
  gap: 25px; /* 아이콘 사이 간격 */
  align-items: center;
}

/* 각 소셜 아이콘 링크 스타일 */
.social-icon-link {
  display: inline-flex; /* flex로 정렬 */
  width: 50px; /* 아이콘 크기 */
  height: 50px;
  justify-content: center; /* 아이콘 가운데 정렬 */
  align-items: center;
  border-radius: 50%; /* 원형 모양 */
  background-color: rgba(255, 255, 255, 0.1); /* 투명한 배경 */
  transition: all 0.3s ease-out; /* 모든 변화에 부드러운 전환 효과 */
  box-shadow: 0 4px 8px rgba(0,0,0,0.2); /* 은은한 그림자 */
}

/* 아이콘 자체 (SVG) 스타일 */
.social-icon {
  width: 28px; /* SVG 아이콘 실제 크기 */
  height: 28px;
  fill: #ecf0f1; /* 아이콘 색상 (채우기) */
  transition: fill 0.3s ease-out, transform 0.3s ease-out; /* 색상 및 크기 변화 부드럽게 */
}

/* 호버 효과 (마우스 올렸을 때) */
.social-icon-link:hover {
  background-color: #000000; /* 주호 메인 컬러로 배경색 변경 */
  transform: translateY(-5px); /* 위로 살짝 올라가는 효과 */
  box-shadow: 0 6px 12px rgba(0,0,0,0.3); /* 그림자 진해짐 */
}

.social-icon-link:hover .social-icon {
  fill: #ffffff; /* 아이콘 색상 흰색으로 변경 */
  transform: scale(1.1); /* 아이콘 자체도 살짝 커짐 */
}

/* 기본 라벨 스타일 */
.emotion-label {
  display: inline-block;
  margin-bottom: 8px;
  font-size: 16px;
  color: #000000;
  transition: all 0.3s ease;
}

/* 폰트 스타일 클래스들 */
.quicksand-font {
  font-family: 'Quicksand', sans-serif;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.fixed-title {
  position: fixed; /* 이게 핵심! 화면에 고정됨 */
  text-align: center; /* 가운데 정렬 */
  top: 0; /* 화면 상단에 붙임 */
  left: 0; /* 화면 왼쪽에 붙임 */
  width: 100%; /* 전체 너비 차지 */
  background-color: #ffffff; /* 배경색 */
  padding: 5px 10px; /* 여백 */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); /* 그림자 효과 */
  z-index: 1000; /* 다른 요소들보다 위에 표시 */
}

/* 스크롤 컨텐츠가 고정된 타이틀 아래에 표시되도록 여백 추가 */
.scrollable-content {
  padding-top: 70px; /* 타이틀 높이 + 여백만큼 추가 (적절히 조절) */
}

body {
  background: linear-gradient(135deg, #f0f4f8, #d9e2ec);
  font-family: 'Noto Sans KR', sans-serif;
  color: #333;
  line-height: 1.6;
  padding: 20px;
}

p {
  color: #4a4a4a;
  margin-bottom: 15px;
}

.map-marker {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.map-marker:hover {
  transform: scale(1.2);
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.6);
}

.card {
  background: #ffffffdd;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.title-container {
  position: fixed; /* 고정 위치 */
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95); /* 살짝 투명한 배경 */
  z-index: 100; /* 다른 요소들보다 앞에 보이게 */
  transition: all 0.3s ease; /* 부드러운 애니메이션 */
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 120px; /* 초기 높이 */
  box-shadow: 0 2px 10px rgba(0,0,0,0.05); /* 은은한 그림자 */
}

/* 메인 타이틀 스타일링 */
.title-container h1 {
  font-size: 2.8rem;
  font-weight: 700;
  color: #3a3a3a;
  letter-spacing: 0.06em;
  margin: 0;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

/* 유튜브 계정명 스타일링 */
.title-container .account-name {
  position: absolute;
  right: 5%; /* 오른쪽에서 여유 공간 */
  bottom: 0;
  font-size: 1.1rem;
  font-weight: 500;
  color: #777777cc;
  transition: color 0.3s ease, transform 0.3s ease;
}

/* 호버 효과 */
.title-container .account-name:hover {
  color: #ff7b6a;
  transform: translateX(5px);
}

/* 모바일 반응형 설정 */
@media (max-width: 768px) {
  .title-container h1 {
    font-size: 2.2rem;
  }

  .title-container .account-name {
    font-size: 0.9rem;
    right: 2%;
  }
}

.title-container span:hover {
  color: #ff7b6a;
  transform: translateX(5px);
}
.footer-credit {
  text-align: center;
  padding: 30px 0 15px;
  margin-top: 40px;
  font-family: 'Nanum Gothic', sans-serif;
  color: #888;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.footer-credit:hover {
  opacity: 1;
}

.made-with {
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 5px;
}

.made-text, .heart-text {
  color: #999;
  font-weight: 300;
}

.tech-icons {
  display: inline-flex;
  gap: 10px;
}

.tech-icons i {
  font-size: 1rem;
  transition: transform 0.3s ease, color 0.3s ease;
}

.fa-vuejs {
  color: #42b883; /* Vue.js 공식 색상 */
}

.fa-java { /* Spring Boot는 자바 기반이라 fa-java 사용 */
  color: #5382a1; /* 자바 로고 색상 */
}

.fa-postgresql { /* PostgreSQL 공식 색상 추가 */
  color: #336791; /* PostgreSQL 로고 색상 */
}

.tech-icons i:hover {
  transform: translateY(-3px);
}

.fa-heart {
  color: #ff6b6b;
  font-size: 0.8rem;
}

.pulse {
  animation: pulse 1.5s infinite;
}

.year-text {
  font-size: 0.75rem;
  margin-top: 5px;
  color: #aaa;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .footer-credit {
    padding: 20px 0 10px;
  }

  .made-with {
    font-size: 0.75rem;
  }
}

/* SNS 링크 스타일은 이전과 동일하게 유지 */
.sns-links {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 25px;
}

.sns-links a {
  color: #a0a0a0;
  font-size: 1.8rem;
  transition: all 0.3s ease;
  text-decoration: none;
}

.sns-links a:hover {
  transform: translateY(-5px);
}

.sns-links a .fa-youtube:hover {
  color: #ff0000;
}

.sns-links a .fa-instagram:hover {
  color: #E1306C;
}

.sns-links a .fa-blog:hover {
  color: #03C75A;
}

@media (max-width: 768px) {
  .sns-links {
    gap: 18px;
  }
  .sns-links a {
    font-size: 1.5rem;
  }
}

.update-info {
  font-size: 0.8rem; /* 연도보다 살짝 작게, 감성 문구와 비슷하게 */
  color: #999;     /* 좀 더 밝은 회색으로 부드럽게 */
  margin-top: 10px; /* 위쪽 요소와 간격 주기 */
  line-height: 1.4; /* 줄 간격 */
  letter-spacing: 0.02em;
  font-weight: bold;
}

@media (max-width: 768px) {
  .update-info {
    font-size: 0.75rem; /* 모바일에서 더 작게 */
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 10px;
  width: 80%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  position: relative;
  animation: fadeIn 0.3s;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 24px;
  cursor: pointer;
}

.modal-btn {
  background: #42b983;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  margin-top: 15px;
  cursor: pointer;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
