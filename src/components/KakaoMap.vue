<template>
  <div>
    <div id="map" class="map" style="width:100%; height:500px;">
        <button v-if="isRegionZoomed" @click="backToMainMap" class="back-to-main-button">
        <span role="img" aria-label="back">↩️</span> 전체 지도로 돌아가기
    </button>
    <!-- *** 이 부분을 추가해주세요! 레이어 컨트롤   *** -->
   <div class="layer-controls">
      <div class="layer-toggle">
        <input type="radio" id="myLayerToggle" value="my" v-model="selectedLayer" @change="loadAndDisplayLayer">
        <label for="myLayerToggle">내 감정 스팟</label>
      </div>
      <!-- <div class="layer-toggle">
        <input type="radio" id="subscriberLayerToggle" value="subscriber" v-model="selectedLayer" @change="loadAndDisplayLayer" v-bind="disabled">
        <label for="subscriberLayerToggle">구독자 감정 스팟</label>
      </div> -->
      <!-- disabled 속성 추가 -->
      <div class="layer-toggle disabled">
      <!-- disabled 속성 추가 -->
        <input type="radio" id="subscriberLayerToggle" value="subscriber" disabled>
        <label for="subscriberLayerToggle" class="disabled-label">구독자 감정 스팟 (준비중)</label>
      </div>
      <!-- 기타 레이어나 컨트롤이 있다면 추가   -->
   </div>
    <!-- *** 여기까지 추가해주세요! ***  -->
    </div>

   <!-- 감정 상세 정보 모달 -->
    <div v-if="selectedEmotion" class="emotion-modal">
      <div class="emotion-modal-content">
        <span class="close-btn" @click="closeModal">&times;</span>
        <h2>{{ selectedEmotion.title }}</h2>
        <p class="location"><strong>위치:</strong> {{ selectedEmotion.locationName }}</p>
        <p class="date"><strong>날짜:</strong> {{ formatDate(selectedEmotion.travelDate) }}</p>
        <!-- 이름 정보 추가 -->
        <p class="author"><strong>작성자:</strong> {{ selectedEmotion.meName || '익명' }}</p>
        <div class="emotion-tags">
          <span v-for="(tag, index) in emotionTagsArray"
          :key="index"
          class="tag"
          @click="highlightTag(index)">{{ tag }}</span>
        </div>

        <!-- 모달 내 날씨 정보 표시 부분 수정 -->
        <div class="weather-info" v-if="selectedEmotion && selectedEmotion.weatherCondition">
          <div class="weather-icon">
            <i :class="getWeatherIcon(selectedEmotion.weatherCondition)"></i>
          </div>
          <div class="weather-details">
            <p class="weather-condition">{{ selectedEmotion.weatherCondition }}</p>
          </div>
        </div>

        <p class="review">{{ selectedEmotion.reviewText }}</p>
        <!-- 유튜브 영상이 있는 경우에만 표시 -->
        <div v-if="selectedEmotion.youtubeUrl" class="youtube-container">
          <iframe :src="getYoutubeEmbedUrl(selectedEmotion.youtubeUrl)"
                  frameborder="0" allowfullscreen></iframe>
        </div>
        <!-- 사진이 있으면 표시 -->
        <div v-if="selectedEmotion && selectedEmotion.imageUrl && selectedEmotion.imageUrl.length > 0" class="photo-slider">
          <div class="slider-image-wrapper" @mousedown="onDragStart"
                                            @mouseup="onDragEnd"
                                            @mouseleave="onDragEnd"
                                            @mousemove="onDragMove"
                                            @touchstart="onDragStart"
                                            @touchend="onDragEnd"
                                            @touchmove="onDragMove">
            <!-- 이미지 표시 -->
            <img :src="`/travel-emotion-map-frontend/images/${currentImageFilename}`" alt="여행 사진" class="slider-image" />
            <!-- 슬라이드 내비게이션 버튼 (화살표 아이콘 사용) -->
            <button v-if="imageFilenames.length > 1" @click="prevImage" class="nav-btn prev">
              <i class="fas fa-chevron-left"></i> <!-- 이전 화살표 아이콘 -->
            </button>
            <button v-if="imageFilenames.length > 1" @click="nextImage" class="nav-btn next">
              <i class="fas fa-chevron-right"></i> <!-- 다음 화살표 아이콘 -->
            </button>
          </div>

          <!-- 슬라이드 페이지네이션 점 (갯수가 1개 이상일 때만 표시) -->
          <div v-if="imageFilenames.length > 1" class="slider-dots">
            <span v-for="(_, index) in imageFilenames" :key="index"
                  :class="{'active-dot': currentImageIndex === index}"
                  @click="setCurrentImage(index)"></span>
          </div>
        </div>
        <!-- 모달 하단에 공유하기 버튼 추가 -->
        <div class="share-section" v-if="selectedEmotion">
          <p class="share-title">이 감정 스팟 공유하기</p>
          <div class="share-buttons">
            <button @click="shareToKakao" class="share-btn kakao-btn" title="카카오톡 공유">
              <i class="fas fa-comment"></i>
            </button>
            <button @click="shareToTwitter" class="share-btn twitter-btn" title="트위터 공유">
              <i class="fab fa-twitter"></i>
            </button>
            <button @click="shareToFacebook" class="share-btn facebook-btn" title="페이스북 공유">
              <i class="fab fa-facebook-f"></i>
            </button>
          </div>
        </div>
    </div>
    </div>
</div>
</template>

<script>
import axios from 'axios'
export default {
  globals: {
    kakao: 'readonly' // kakao를 전역 변수로 선언
  },

  name: 'KakaoMap',
  data () {
    return {
      map: null,
      provinceOverviewFeatures: null, // 전국 시도 오버뷰 GeoJSON Features
      currentPolygons: [], // 현재 지도에 그려진 폴리곤들
      currentLabels: [], // 현재 지도에 그려진 라벨들
      districtDetailsCache: {}, // 시도별 상세 GeoJSON 데이터 캐시
      isRegionZoomed: false, // 지도가 확대되었는지 여부
      selectedEmotion: null, // 선택된 감정 정보
      emotionMarkers: [], // 감정 마커 배열
      // 25.08.19 구독자 참여를 위해 추가
      myMarkers: [], // 내가 기록한 감정 마커들을 담을 배열
      subscriberMarkers: [], // 구독자 감정 마커 객체들
      myEmotionsData: [], // 내 감정 원본 데이터 캐시
      subscriberEmotionsData: [], // 구독자 감정 원본 데이터 캐시
      selectedLayer: 'my', // 현재 선택된 레이어 (초기값: 내 감정 스팟)
      // 이미지슬라이드관련
      currentImageIndex: 0,
      imageFilenames: [],
      // 기존 이미지 슬라이더 상태들..
      isDragging: false,
      dragStartX: 0,
      dragEndX: 0,
      // 기존 데이터...
      linkCopied: false
    }
  },
  mounted () {
    // 지도 초기화
    if (window.kakao && window.kakao.maps) {
      this.initMap()
    } else {
      const script = document.createElement('script')
      script.src = '//dapi.kakao.com/v2/maps/sdk.js?appkey=595fec59341e6b118c1f93b2426c80da&autoload=false'
      script.onload = () => {
        window.kakao.maps.load(() => {
          this.initMap()
        })
      }
      document.head.appendChild(script)
    }
  },
  methods: {
    initMap () {
      const container = document.getElementById('map')
      const options = {
        center: new window.kakao.maps.LatLng(36.2, 127.9), // 한반도 중심
        level: 13 // 한반도 전체가 보이는 레벨
      }
      this.map = new window.kakao.maps.Map(container, options)

      // 초기 전국 시도 오버뷰 GeoJSON 로드
      this.loadProvinceOverviewGeoJson()
      // this.fetchEmotionData() // 이 함수가 마커를 또 생성하고 있다면 제거
      // this.loadMyEmotions()   // 이 함수도 여기서 직접 호출할 필요 없어요

      // 초기에는 loadAndDisplayLayer만 호출 (내 감정 스팟만 보이도록)
      this.loadAndDisplayLayer()
      // 초기 전국 시도 오버뷰 GeoJSON 로드
      // this.loadProvinceOverviewGeoJson()
      // this.fetchEmotionData()
      // this.loadMyEmotions() // 기존에 내 마커 로드하는 함수
      // this.loadSubscriberEmotions() // 새로 추가할 구독자 마커 로드 함수
      // 초기 로드 시 'my' 레이어 데이터를 가져와서 지도에 표시
      // this.loadAndDisplayLayer()
    },

    // 위도, 경도로 날씨 정보 가져오기
    async fetchWeatherData (lat, lng) {
      const API_KEY = '6b8d9db94d4b8a61b8d8a4c4e38edaa1' // API 키 발급 필요
      try {
        const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
          params: {
            lat: lat,
            lon: lng,
            appid: API_KEY,
            units: 'metric', // 섭씨 온도
            lang: 'kr' // 한국어 결과
          }
        })

        return {
          condition: response.data.weather[0].description,
          temperature: Math.round(response.data.main.temp),
          humidity: response.data.main.humidity,
          windSpeed: response.data.wind.speed,
          icon: response.data.weather[0].icon
        }
      } catch (error) {
        console.error('날씨 정보를 가져오는 중 오류 발생:', error)
        return null
      }
    },

    // 감정 스팟 선택 시 날씨 정보도 함께 로드
    async showEmotionDetails (emotion) {
      this.selectedEmotion = { // 이렇게 바꿔주는 거지!
        ...emotion,
        weatherCondition: emotion.weatherCondition || '정보 없음'
      }

      // 이미 날씨 정보가 있으면 다시 요청하지 않음
      if (!this.selectedEmotion.weatherInfo && this.selectedEmotion.lat && this.selectedEmotion.lng) {
        const weatherInfo = await this.fetchWeatherData(
          this.selectedEmotion.lat,
          this.selectedEmotion.lng
        )

        if (weatherInfo) {
          // Vue.set을 사용하여 반응성 유지
          this.$set(this.selectedEmotion, 'weatherInfo', weatherInfo)
        }
      }
    },

    // 날씨 상태에 따른 아이콘 클래스 반환
    getWeatherIcon (condition) {
      // condition이 없을 경우 안전하게 처리
      if (!condition) return 'fas fa-cloud'
      // 날씨 상태에 따라 적절한 Font Awesome 아이콘 클래스 반환
      switch (condition) {
        case '맑음':
          return 'fas fa-sun'
        case '흐림':
          return 'fas fa-cloud'
        case '비':
          return 'fas fa-cloud-rain'
        case '눈':
          return 'fas fa-snowflake'
        default:
          return 'fas fa-cloud'
      }
    },

    // 모달 열 때 이미지 배열 초기화
    setImageFilenames () {
      if (this.selectedEmotion && this.selectedEmotion.imageUrl) {
        this.imageFilenames = this.selectedEmotion.imageUrl.split(',')
          .map(filename => filename.trim())
          .filter(filename => filename)
        this.currentImageIndex = 0
      }
    },

    // 다음 이미지로
    nextImage () {
      if (this.isTransitioning) return // 전환 중이면 추가 클릭 무시
      this.isTransitioning = true

      // 먼저 현재 이미지 페이드 아웃
      const imageElement = document.querySelector('.slider-image')
      imageElement.style.opacity = '0'

      // 페이드 아웃 후 이미지 변경 (인덱스는 한 번만 변경)
      setTimeout(() => {
        this.currentImageIndex = (this.currentImageIndex + 1) % this.imageFilenames.length

        // 새 이미지 로드 후 페이드 인
        setTimeout(() => {
          imageElement.style.opacity = '1'
          this.isTransitioning = false // 전환 완료
        }, 50)
      }, 200)
    },

    // 태그 클릭 시 강조 효과
    highlightTag (index) {
      const tagElements = document.querySelectorAll('.tag')
      tagElements[index].classList.add('tag-highlight')

      setTimeout(() => {
        tagElements[index].classList.remove('tag-highlight')
      }, 1000)
    },

    // 이전 이미지로
    prevImage () {
      if (this.isTransitioning) return
      this.isTransitioning = true

      // 먼저 현재 이미지 페이드 아웃
      const imageElement = document.querySelector('.slider-image')
      imageElement.style.opacity = '0'

      // 페이드 아웃 후 이미지 변경
      setTimeout(() => {
        // 이전 이미지로 인덱스 변경 (뒤로 가기)
        this.currentImageIndex = (this.currentImageIndex - 1 + this.imageFilenames.length) % this.imageFilenames.length

        // 새 이미지 로드 후 페이드 인
        setTimeout(() => {
          imageElement.style.opacity = '1'
          this.isTransitioning = false // 전환 완료 표시
        }, 50)
      }, 200)
    },

    // 특정 이미지로 이동
    setCurrentImage (index) {
      this.currentImageIndex = index
    },

    // 모든 마커를 지도에서 숨기는 함수
    hideAllMarkers () {
      this.myMarkers.forEach(marker => marker.setMap(null))
      this.subscriberMarkers.forEach(marker => marker.setMap(null))
    },

    // 선택된 레이어의 데이터를 로드하고 지도에 표시하는 핵심 함수
    loadAndDisplayLayer () {
      this.hideAllMarkers() // 모든 마커 먼저 숨김

      if (this.selectedLayer === 'my') {
        // 내 감정 데이터만 로드하고 표시
        this.loadMyEmotions()
      } else if (this.selectedLayer === 'subscriber') {
        // 구독자 감정 데이터만 로드하고 표시
        this.loadSubscriberEmotions()
      }
    },

    // 실제 API 호출 및 마커 생성 로직 (재활용)
    loadEmotions (apiUrl, type) {
      axios.get(apiUrl)
        .then(response => {
          if (type === 'my') {
            this.myEmotionsData = response.data
            this.createMarkers(this.myEmotionsData, 'my')
            this.myMarkers.forEach(marker => marker.setMap(this.map)) // 현재 선택된 레이어만 표시
          } else if (type === 'subscriber') {
            this.subscriberEmotionsData = response.data
            this.createMarkers(this.subscriberEmotionsData, 'subscriber')
            this.subscriberMarkers.forEach(marker => marker.setMap(this.map)) // 현재 선택된 레이어만 표시
          }
        })
        .catch(error => {
          console.error(`${type} 감정 데이터 로드 실패:`, error)
          // 데이터 로드 실패 시에도 레이어 비활성화 또는 메시지 표시
          alert(`데이터 로드에 실패했습니다. (${type})`)
        })
    },

    // 내 감정 데이터 로드 및 마커 생성 (기존 함수를 분리/수정)
    loadMyEmotions () {
      // local
      // axios.get('/api/travel-emotions')
      // prod
      axios.get('https://travel-emotion-map-backend.onrender.com/api/travel-emotions')
        .then(response => {
          this.createMarkers(response.data, 'my')
          // 여기서 마커를 지도에 표시해줘야 해!
          this.myMarkers.forEach(marker => marker.setMap(this.map))
        })
        .catch(error => console.error('내 감정 데이터 로드 실패:', error))
    },

    // 구독자 감정 데이터 로드 및 마커 생성
    loadSubscriberEmotions () {
      axios.get('https://travel-emotion-map-backend.onrender.com/api/subscriber-emotions')
        .then(response => {
          this.createMarkers(response.data, 'subscriber')
          // 여기서 마커를 지도에 표시해줘야 해!
          this.subscriberMarkers.forEach(marker => marker.setMap(this.map))
        })
        .catch(error => console.error('구독자 감정 데이터 로드 실패:', error))
    },

    // 마커 생성 공통 함수 (기존 마커 생성 로직을 이 함수로 옮겨서 재활용)
    createMarkers (emotions, type) {
      // 마커를 새로 생성하기 전에 기존 마커 배열 비우기 (선택 사항: 데이터 갱신 시 필요)
      if (type === 'my') this.myMarkers = []
      else if (type === 'subscriber') this.subscriberMarkers = []
      emotions.forEach(emotion => {
        let markerImage = null
        let zIndex = 1 // zIndex로 마커 겹침 순서 조절
        const markerSize = new kakao.maps.Size(32, 32)

        if (type === 'my') {
          // 주호의 마커 이미지 경로와 사이즈
          markerImage = new kakao.maps.MarkerImage(
            '/travel-emotion-map-frontend/images/my_marker.png', // 예시 경로, 실제 이미지 경로로 변경
            markerSize
          )
          zIndex = 2 // 주호 마커를 더 위에
        } else if (type === 'subscriber') {
          // 구독자 마커 이미지 경로와 사이즈
          markerImage = new kakao.maps.MarkerImage(
            '/travel-emotion-map-frontend/images/subscriber_marker.png', // 예시 경로, 실제 이미지 경로로 변경
            new kakao.maps.Size(24, 24) // 주호 마커보다 작게
          )
          zIndex = 1 // 구독자 마커를 아래에
        }

        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(emotion.latitude, emotion.longitude),
          image: markerImage,
          zIndex: zIndex,
          map: null // 마커 객체는 생성하되, 처음에는 지도에 표시하지 않음 (null)
        })

        // 마커에 인포윈도우나 클릭 이벤트 추가 (예시)
        kakao.maps.event.addListener(marker, 'click', () => {
          this.showEmotionDetail(emotion)
        })

        if (type === 'my') {
          this.myMarkers.push(marker)
        } else if (type === 'subscriber') {
          this.subscriberMarkers.push(marker)
        }
      })
    },

    // '내 감정 스팟' 레이어 토글 함수
    toggleMyLayer () {
      this.myMarkers.forEach(marker => {
        marker.setMap(this.showMyLayer ? this.map : null) // showMyLayer가 true면 지도에 표시, 아니면 숨김
      })
    },

    // '구독자 감정 스팟' 레이어 토글 함수
    toggleSubscriberLayer () {
      this.subscriberMarkers.forEach(marker => {
        marker.setMap(this.showSubscriberLayer ? this.map : null) // showSubscriberLayer가 true면 지도에 표시, 아니면 숨김
      })
    },

    // 카카오톡 공유
    shareToKakao () {
      // 카카오 SDK가 로드되었는지 확인
      if (window.Kakao) {
        if (!window.Kakao.isInitialized()) {
          // 여기에 네 카카오 앱 키를 넣어야 해
          window.Kakao.init('595fec59341e6b118c1f93b2426c80da')
        }

        window.Kakao.Link.sendDefault({
          objectType: 'location',
          address: this.selectedEmotion.locationName,
          addressTitle: this.selectedEmotion.title,
          content: {
            title: this.selectedEmotion.title,
            description: this.selectedEmotion.reviewText.substring(0, 80) + '...',
            imageUrl: this.selectedEmotion.imageUrl ? '/images/' + this.selectedEmotion.imageUrl[0] : '',
            link: {
              mobileWebUrl: window.location.href,
              webUrl: window.location.href
            }
          },
          buttons: [
            {
              title: '감정 스팟 보기',
              link: {
                mobileWebUrl: window.location.href,
                webUrl: window.location.href
              }
            }
          ]
        })
      } else {
        alert('카카오톡 공유 기능을 사용할 수 없습니다.')
      }
    },

    // 트위터 공유
    shareToTwitter () {
      const text = `${this.selectedEmotion.title} - ${this.selectedEmotion.reviewText.substring(0, 50)}...`
      const url = window.location.href
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
      window.open(shareUrl, '_blank')
    },

    // 페이스북 공유
    shareToFacebook () {
      const url = window.location.href
      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
      window.open(shareUrl, '_blank')
    },

    // 초기 전국 시도 오버뷰 로딩 및 그리기
    loadProvinceOverviewGeoJson () {
      fetch('./geojson/korea-provinces-overview.geojson') // 단순화된 시도 경계 데이터
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          return response.json()
        })
        .then(geojsonData => {
          this.provinceOverviewFeatures = geojsonData.features
          this.drawProvinceOverview() // 로드 완료 후 오버뷰 그리기
        })
        .catch(error => {
          console.error('시도 오버뷰 GeoJSON 로딩 에러:', error)
          alert('초기 지도 데이터 로딩에 실패했습니다.')
        })
    },

    drawProvinceOverview () {
      this.clearMapObjects() // 이전 객체들 모두 제거

      const displayedProvinceNames = new Set() // 라벨 중복 방지

      this.provinceOverviewFeatures.forEach(feature => {
        const sidonm = feature.properties.sidonm // 예: "서울특별시"
        if (!sidonm) return

        // 폴리곤 그리기
        this.drawPolygon(feature, this.getRegionColor(sidonm), 'province')

        // 라벨 추가 (한 시도당 하나의 라벨만)
        if (!displayedProvinceNames.has(sidonm)) {
          const center = this.getProvinceCenter(sidonm)
          const labelContent = this.createLabelElement(sidonm, 'region-label')

          const labelOverlay = new window.kakao.maps.CustomOverlay({
            position: center,
            content: labelContent,
            yAnchor: 1,
            map: this.map
          })

          // 라벨 클릭 시 해당 시도로 확대
          labelContent.onclick = () => {
            this.zoomToDistrictView(sidonm, center, this.getProvinceZoomLevel(sidonm))
          }

          this.currentLabels.push(labelOverlay)
          displayedProvinceNames.add(sidonm)
        }
      })

      this.isRegionZoomed = false // 초기 화면이므로 확대 상태 아님
      this.map.setCenter(new window.kakao.maps.LatLng(36.2, 127.9))
      this.map.setLevel(14)
    },

    // 시도 클릭 시 시군구 상세 로딩 및 그리기
    zoomToDistrictView (selectedProvinceName, center, level) {
      this.clearMapObjects() // 기존 객체 모두 제거

      // 여기서 먼저 변수를 선언해줘야 해!
      const provinceOutlineFeature = this.provinceOverviewFeatures.find(
        f => f.properties.sidonm === selectedProvinceName
      )
      if (provinceOutlineFeature.geometry.type === 'MultiPolygon') {
        // MultiPolygon인 경우 처리
        provinceOutlineFeature.geometry.coordinates.forEach(polygonCoords => {
          const path = polygonCoords[0].map(coord =>
            new window.kakao.maps.LatLng(coord[1], coord[0])
          )

          const polygon = new window.kakao.maps.Polygon({
            map: this.map,
            path: path,
            strokeWeight: 5, // 굵은 테두리
            strokeColor: this.getRegionColor(selectedProvinceName),
            strokeOpacity: 1,
            fillOpacity: 0
          })

          this.currentPolygons.push(polygon)
        })
      } else {
        // Polygon인 경우 (기존 코드)
        const path = provinceOutlineFeature.geometry.coordinates[0].map(
          coord => new window.kakao.maps.LatLng(coord[1], coord[0])
        )

        const polygon = new window.kakao.maps.Polygon({
          map: this.map,
          path: path,
          strokeWeight: 5,
          strokeColor: this.getRegionColor(selectedProvinceName),
          strokeOpacity: 1,
          fillOpacity: 0
        })

        this.currentPolygons.push(polygon)
      }
      this.map.setCenter(center)
      this.map.setLevel(level)
      this.isRegionZoomed = true
    },

    drawDistrictView (districtFeatures, center, level) {
    // 필터링된 각 상세 GeoJSON Feature를 그리고 라벨 추가
      districtFeatures.forEach(feature => {
        const districtName = feature.properties.adm_nm
        const polygonColor = this.getDistrictColor(districtName) // 시군구별 색상

        this.drawPolygon(feature, polygonColor, 'district')

        // 시군구 이름 라벨 추가
        const labelCenter = this.getPolygonCenter(feature.geometry)
        if (labelCenter) {
          const labelContent = this.createLabelElement(feature.properties.sggnm, 'subregion-label') // 시군구 이름만 표시
          const labelOverlay = new window.kakao.maps.CustomOverlay({
            position: labelCenter,
            content: labelContent,
            map: this.map,
            yAnchor: 1 // 라벨이 중심점 위로 오도록 조정
          })
          this.currentLabels.push(labelOverlay)
        }
      })

      this.map.setCenter(center)
      this.map.setLevel(level)
      this.isRegionZoomed = true // 확대 상태
    },

    // 폴리곤 그리기 로직 (재활용)
    drawPolygon (feature, fillColor, type = 'default') {
      const paths = []

      if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach(polygonCoords => {
          const path = polygonCoords[0].map(coord => new window.kakao.maps.LatLng(coord[1], coord[0]))
          paths.push(path)
        })
      } else if (feature.geometry.type === 'Polygon') {
        const path = feature.geometry.coordinates[0].map(coord => new window.kakao.maps.LatLng(coord[1], coord[0]))
        paths.push(path)
      } else {
        console.warn('지원하지 않는 지오메트리 타입:', feature.geometry.type)
        return
      }

      paths.forEach(path => {
        const polygon = new window.kakao.maps.Polygon({
          map: this.map,
          path: path,
          strokeWeight: (type === 'province' ? 1 : 0.5),
          strokeColor: '#585858',
          strokeOpacity: (type === 'province' ? 0.6 : 0.5),
          fillColor: fillColor,
          fillOpacity: (type === 'province' ? 0.7 : 0.8)
        })

        // 마우스 오버/아웃 이벤트
        window.kakao.maps.event.addListener(polygon, 'mouseover', () => {
          polygon.setOptions({ fillOpacity: (type === 'province' ? 0.9 : 1.0), strokeWeight: (type === 'province' ? 2 : 0.7) })
        })
        window.kakao.maps.event.addListener(polygon, 'mouseout', () => {
          polygon.setOptions({ fillOpacity: (type === 'province' ? 0.7 : 0.8), strokeWeight: (type === 'province' ? 1 : 0.5) })
        })

        // 클릭 이벤트 (시도 클릭 시 확대)
        if (type === 'province') {
          window.kakao.maps.event.addListener(polygon, 'click', () => {
            this.zoomToDistrictView(
              feature.properties.sidonm,
              this.getProvinceCenter(feature.properties.sidonm),
              this.getProvinceZoomLevel(feature.properties.sidonm)
            )
          })
        } else if (type === 'district') {
          window.kakao.maps.event.addListener(polygon, 'click', () => {
            // 여기에 해당 시군구의 감정 데이터 보여주기 등의 로직 추가
          })
        }

        this.currentPolygons.push(polygon) // 현재 그려진 폴리곤 저장
      })
    },

    // 유틸리티 함수들
    clearMapObjects () {
      this.currentPolygons.forEach(p => p.setMap(null))
      this.currentPolygons = []
      this.currentLabels.forEach(l => l.setMap(null))
      this.currentLabels = []
    },

    createLabelElement (text, className) {
      const element = document.createElement('div')
      element.className = className
      element.innerHTML = text
      element.style.cssText = `
        padding: 5px 10px;
        background-color: rgba(255, 255, 255, 0.8);
        border: 1px solid #ddd;
        border-radius: 5px;
        font-size: 13px;
        font-weight: bold;
        white-space: nowrap;
        text-align: center;
        cursor: pointer;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        transition: all 0.2s;
    `
      element.onmouseover = () => { element.style.backgroundColor = 'rgba(255, 107, 107, 0.7)'; element.style.color = 'white' }
      element.onmouseout = () => { element.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'; element.style.color = 'black' }
      return element
    },

    backToMainMap () {
      this.clearMapObjects()
      this.drawProvinceOverview() // 다시 시도 단위 오버뷰 그리기

      this.map.setCenter(new window.kakao.maps.LatLng(36.2, 127.9))
      this.map.setLevel(13)

      this.isRegionZoomed = false
    },

    // 시도별 중심 좌표 및 레벨 정의
    getProvinceCenter (sidonm) {
      const centers = {
        서울특별시: new window.kakao.maps.LatLng(37.566826, 126.9786567),
        부산광역시: new window.kakao.maps.LatLng(35.1798, 129.0756),
        대구광역시: new window.kakao.maps.LatLng(35.8714, 128.6014),
        인천광역시: new window.kakao.maps.LatLng(37.4563, 126.7052),
        광주광역시: new window.kakao.maps.LatLng(35.1595, 126.8526),
        대전광역시: new window.kakao.maps.LatLng(36.3504, 127.3845),
        울산광역시: new window.kakao.maps.LatLng(35.5384, 129.3114),
        세종특별자치시: new window.kakao.maps.LatLng(36.4806, 127.2890),
        경기도: new window.kakao.maps.LatLng(37.5307, 127.0863),
        강원특별자치도: new window.kakao.maps.LatLng(37.8853, 128.0906),
        충청북도: new window.kakao.maps.LatLng(36.8, 127.7),
        충청남도: new window.kakao.maps.LatLng(36.6, 126.8),
        전북특별자치도: new window.kakao.maps.LatLng(35.7, 127.1),
        전라남도: new window.kakao.maps.LatLng(34.8, 126.9),
        경상북도: new window.kakao.maps.LatLng(36.5, 128.7),
        경상남도: new window.kakao.maps.LatLng(35.4, 128.1),
        제주특별자치도: new window.kakao.maps.LatLng(33.3761, 126.5496)
      }
      return centers[sidonm] || new window.kakao.maps.LatLng(36.2, 127.9)
    },

    getProvinceZoomLevel (sidonm) {
      const levels = {
        서울특별시: 8,
        부산광역시: 8,
        대구광역시: 8,
        인천광역시: 8,
        광주광역시: 8,
        대전광역시: 8,
        울산광역시: 8,
        세종특별자치시: 9,
        경기도: 9,
        강원특별자치도: 9,
        충청북도: 9,
        충청남도: 9,
        전북특별자치도: 9,
        전라남도: 9,
        경상북도: 9,
        경상남도: 9,
        제주특별자치도: 9
      }
      return levels[sidonm] || 8
    },

    getPolygonCenter (geometry) {
      let latSum = 0
      let lngSum = 0
      let count = 0

      const processCoords = (coordsArray) => {
        coordsArray.forEach(coord => {
          latSum += coord[1] // 위도
          lngSum += coord[0] // 경도
          count++
        })
      }

      if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach(polygonCoords => {
          processCoords(polygonCoords[0])
        })
      } else if (geometry.type === 'Polygon') {
        processCoords(geometry.coordinates[0])
      }

      if (count > 0) {
        return new window.kakao.maps.LatLng(latSum / count, lngSum / count)
      }
      return null
    },

    // 색상 헬퍼 함수들
    getRegionColor (sidonm) {
      const categoryColors = {
        서울특별시: '#FF6B6B',
        부산광역시: '#6a0dad',
        대구광역시: '#008080',
        인천광역시: '#ffa500',
        광주광역시: '#00CED1',
        대전광역시: '#9932CC',
        울산광역시: '#f8d227',
        세종특별자치시: '#20B2AA',
        경기도: '#FFD700',
        강원특별자치도: '#4682B4',
        충청북도: '#32CD32',
        충청남도: '#ff69b4',
        전북특별자치도: '#00BFFF',
        전라남도: '#800000',
        경상북도: '#8A2BE2',
        경상남도: '#DC143C',
        제주특별자치도: '#008000'
      }
      return categoryColors[sidonm] || this.getRandomColor()
    },

    getDistrictColor (admNm) {
      const colors = ['#f4cccc', '#fff2cc', '#d9ead3', '#cfe2f3', '#d9d2e9', '#ead1dc', '#d0e0e3', '#ffe8d6', '#c9e4de', '#ecc5c0', '#e3f3d1', '#fcf6bd', '#aed581', '#ffab91', '#4db6ac']
      let hash = 0
      for (let i = 0; i < admNm.length; i++) {
        hash = admNm.charCodeAt(i) + ((hash << 5) - hash)
      }
      const index = Math.abs(hash % colors.length)
      return colors[index]
    },

    getRandomColor () {
      const letters = '0123456789ABCDEF'
      let color = '#'
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)]
      }
      return color
    },
    fetchEmotionData () {
      fetch('/api')
        .then(response => response.json())
        .then(data => {
        // 받아온 감정 데이터로 지도에 마커 표시
          data.forEach(item => {
            // 마커 생성 시 감정 데이터 전체를 전달
            this.addEmotionMarker(
              item.latitude,
              item.longitude,
              item.emotionTags ? item.emotionTags.split(',')[0] : '기본감정',
              item // 전체 데이터 객체 전달
            )
          })
        })
        .catch(error => console.error('감정 데이터 로딩 실패:', error))
    },
    addEmotionMarker (lat, lng, emotion, emotionData) {
      // 마커 위치 생성
      const position = new window.kakao.maps.LatLng(lat, lng)

      // 감정에 따른 색상 결정 (간단한 예시)
      let markerColor = '#FF6B6B' // 기본 빨간색
      let emotionIcon = '😊'

      // 감정에 따라 다른 색상과 이모지 할당
      if (emotion === '행복' || emotion === '즐거움') {
        markerColor = '#FFD700'
        emotionIcon = '😄'
      } else if (emotion === '감동' || emotion === '벅참') {
        markerColor = '#9370DB'
        emotionIcon = '😢'
      } else if (emotion === '힐링' || emotion === '평화') {
        markerColor = '#98FB98'
        emotionIcon = '😌'
      } else if (emotion === '아찔함' || emotion === '스릴') {
        markerColor = '#FF4500'
        emotionIcon = '😱'
      }

      // 커스텀 오버레이 내용 (HTML)
      const content = `
    <div class="emotion-marker" style="
    background-color: ${markerColor};
    color: white;
    padding: 10px;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    text-align: center;
    font-size: 20px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    ">
    ${emotionIcon}
    </div>
    `

      // 커스텀 오버레이 생성
      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: content,
        yAnchor: 1
      })

      // 지도에 오버레이 표시
      customOverlay.setMap(this.map)

      // 나중에 제거하거나 관리할 수 있도록 배열에 저장
      if (!this.emotionMarkers) {
        this.emotionMarkers = []
      }
      this.emotionMarkers.push(customOverlay)

      // 클릭 이벤트 추가 (선택사항)
      // 마커 클릭 시 상세 정보 표시 등의 기능 구현 가능
      const markerElement = customOverlay.a
      if (markerElement) {
        markerElement.onclick = () => {
          // 모달 표시
          this.loadAndDisplayLayer()
          this.showEmotionDetail(emotionData)
        }
      }
    },
    // 마커 클릭 시 감정 데이터 표시
    showEmotionDetail (emotionData) {
      this.selectedEmotion = emotionData

      this.showEmotionDetails(emotionData)

      // 이미지 URL 처리 추가
      if (emotionData.imageUrl && typeof emotionData.imageUrl === 'string' && emotionData.imageUrl.length > 0) {
        // 콘솔에 확인용 로그 출력

        // 콤마로 구분된 이미지 URL을 배열로 변환
        this.imageFilenames = emotionData.imageUrl.split(',')
          .map(filename => filename.trim())
          .filter(filename => filename)

        this.currentImageIndex = 0
      } else {
        this.imageFilenames = []
        this.currentImageIndex = 0
      }
    },
    // 모달 닫기
    closeModal () {
      this.selectedEmotion = null
      // 모달에 closing 클래스 추가
      if (this.selectedEmotion) {
        document.querySelector('.emotion-modal').classList.add('closing')

        // 애니메이션 완료 후 모달 닫기
        setTimeout(() => {
          this.selectedEmotion = null
          if (this.$refs.audioPlayer) {
            this.$refs.audioPlayer.pause()
            this.isPlaying = false
          }
        }, 300) // 애니메이션 시간과 동일하게
      }
    },
    // 날짜 포맷 변환
    formatDate (dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
    },
    // 유튜브 URL을 임베드 URL로 변환
    getYoutubeEmbedUrl (url) {
      if (!url) return ''
      // YouTube URL 형식: https://www.youtube.com/watch?v=VIDEO_ID
      // 임베드 URL 형식: https://www.youtube.com/embed/VIDEO_ID
      const videoId = url.split('v=')[1]
      if (!videoId) return url
      const ampersandPosition = videoId.indexOf('&')
      if (ampersandPosition !== -1) {
        return `https://www.youtube.com/embed/${videoId.substring(0, ampersandPosition)}`
      }
      return `https://www.youtube.com/embed/${videoId}`
    },
    onDragStart (event) {
      this.isDragging = true
      this.dragStartX = event.type.includes('mouse') ? event.clientX : event.touches[0].clientX
    },
    onDragMove (event) {
      if (!this.isDragging) return
      this.dragEndX = event.type.includes('mouse') ? event.clientX : event.touches[0].clientX
    },
    onDragEnd () {
      if (!this.isDragging) return
      const dragDistance = this.dragEndX - this.dragStartX
      const threshold = 50 // 드래그 인식 최소 거리(px)
      if (dragDistance > threshold) {
        this.prevImage() // 왼쪽에서 오른쪽으로 드래그 => 이전 이미지
      } else if (dragDistance < -threshold) {
        this.nextImage() // 오른쪽에서 왼쪽으로 드래그 => 다음 이미지
      }
      this.isDragging = false
      this.dragStartX = 0
      this.dragEndX = 0
    }
  },
  computed: {
    emotionTagsArray () {
      return this.selectedEmotion && this.selectedEmotion.emotionTags
        ? this.selectedEmotion.emotionTags.split(',')
        : []
    },
    currentImageFilename () {
      return this.imageFilenames[this.currentImageIndex] || ''
    }
  }
}

</script>

<style scoped>

#map {
  position: relative; /* 지도 컨테이너가 layer-controls의 기준이 됨 */
  width: 100%; /* 너비는 적절히 조절 */
  height: 200%; /* 높이도 적절히 조절 */
}

/* 모달 페이드인/아웃 애니메이션 */
@keyframes modalFadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes modalFadeOut {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-20px); }
}

/* *** 이 부분을 추가해주세요! 레이어 컨트롤 CSS *** */
.layer-controls {
  position: absolute;
  bottom: 10px; /* 지도의 아래쪽에서 10px 위로 */
  right: 10px;   /* 지도의 오른쪽에서 10px 왼쪽으로 */
  /* 나머지 스타일 (background, padding, border-radius, box-shadow, z-index)은 그대로 유지 */
  background: rgba(255, 255, 255, 0.9);
  padding: 12px 15px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  z-index: 2;
  flex-direction: column;
  margin: 15px 0;
  display: flex;
  gap: 20px;
}

.layer-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  cursor: pointer;
}

.layer-toggle input[type="checkbox"] {
  /* 기본 체크박스 스타일 초기화 (선택 사항) */
  appearance: none; /* 브라우저 기본 스타일 제거 */
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid #ccc; /* 테두리 */
  border-radius: 4px; /* 살짝 둥글게 */
  margin-right: 8px;
  cursor: pointer;
  outline: none; /* 클릭 시 아웃라인 제거 */
  position: relative; /* 체크 마크 위치 기준 */
  transition: all 0.2s ease-in-out;
}

.layer-toggle.disabled {
  color: #999;
  cursor: not-allowed;
}

.layer-toggle.disabled label {
  cursor: not-allowed;
}

.layer-toggle input[type="checkbox"]:checked {
  background-color: #42b883; /* 체크 시 배경색 (Vue.js 녹색 계열) */
  border-color: #42b883;
}

.layer-toggle input[type="checkbox"]:checked::before {
  content: '✔'; /* 체크 마크 */
  font-size: 14px;
  color: white;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  line-height: 1; /* 글자 라인 높이 조절 */
}

.layer-toggle label {
  font-size: 1rem; /* 폰트 크기 */
  color: #555; /* 글자 색상 */
  cursor: pointer;
  transition: color 0.3s ease;
  font-weight: 400; /* 일반적인 두께 */
}

.layer-toggle input:checked + label {
  color: #333; /* 체크 시 글자 색상 */
  font-weight: 500; /* 체크 시 글자 두께 살짝 두껍게 */
}
/* *** 여기까지 추가해주세요! *** */

.back-to-main-button {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 8px 15px;
  background-color: #f8f9fa;
  border: 1px solid #ced4da;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: background-color 0.2s, border-color 0.2s;
  display: flex;
  align-items: center;
  gap: 5px;
}

.back-to-main-button:hover {
  background-color: #e2e6ea;
  border-color: #c4c8cc;
}

.region-label, .subregion-label {
  position: relative;
  transform: translate(-50%, -50%);
}
.region-label {
  font-weight: bold;
  font-size: 14px;
}
.subregion-label {
  font-size: 11px;
}

/* 모달 스타일 */
.emotion-modal {
  position: fixed;
  top: 0; left: 0; right:0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px;
  overflow-y: auto;
  z-index: 9999;
}

.emotion-modal-content {
  background: #fff;
  border-radius: 14px;
  padding: 24px 30px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  position: relative;
  animation: modalFadeIn 0.3s ease forwards;
}

.emotion-modal.closing .emotion-modal-content {
  animation: modalFadeOut 0.3s ease forwards;
}

.back-to-main-button {
  transition: all 0.2s ease;
  transform-origin: center;
}

.back-to-main-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: #000;
  transform: rotate(90deg);
}

.emotion-tags {
  margin: 10px 0;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  background: linear-gradient(45deg, #ff7675, #fd79a8);
  padding: 6px 14px;
  border-radius: 20px;
  font-weight: 600;
  color: white;
  cursor: default;
  transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* 이미지 로딩 효과 */
@keyframes imageFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.tag:hover {
  transform: translateY(-3px) rotate(2deg);
  box-shadow: 0 5px 15px rgba(253, 121, 168, 0.4);
}

.youtube-container {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 */
  height: 0;
  overflow: hidden;
  border-radius: 14px;
  margin-top: 20px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}

.youtube-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

/* 기존 .photos는 이제 .photo-slider로 변경될 거예요. */
.photo-slider {
  margin-top: 20px;
  width: 100%; /* 슬라이더 전체 너비 */
  max-width: 600px; /* 슬라이더 최대 너비 (조정 가능) */
  margin-left: auto; /* 가운데 정렬 */
  margin-right: auto; /* 가운데 정렬 */
  display: flex;
  flex-direction: column; /* 세로로 정렬: 이미지 영역 위에 점 영역 */
  align-items: center; /* 가운데 정렬 */
}

.slider-image-wrapper {
  position: relative; /* 자식 요소인 버튼들의 위치 기준 */
  width: 100%;
  padding-top: 75%; /* 4:3 비율 유지 (너비 대비 높이 75% -> 높이 고정) */
  /* 또는 height: 450px; 등으로 고정 높이를 주어도 됨 (object-fit 주의) */
  overflow: hidden; /* 이미지가 이 영역을 벗어나지 않도록 */
  background-color: #f0f0f0; /* 이미지가 로드되기 전 배경색 */
  display: flex; /* 이미지를 중앙 정렬하기 위해 */
  align-items: center; /* 이미지를 중앙 정렬하기 위해 */
  justify-content: center; /* 이미지를 중앙 정렬하기 위해 */
  margin-top: 20px;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.25);
  cursor: grab;
  user-select: none; /* 드래그 시 텍스트 선택되는 거 방지 */
}

.slider-image-wrapper:active {
  cursor: grabbing;
}

.slider-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain; /* 이미지 비율 유지하며 컨테이너에 맞춤 (여백 생길 수 있음) */
  /* object-fit: cover;  이미지 잘릴 수 있지만 컨테이너를 꽉 채움 (원하는 방식 선택) */
  transition: transform 0.3s ease;
  padding: 10px; /* 이미지 자체에 살짝 패딩 줘서 컨테이너 엣지랑 분리 */
  display: block;
  border-radius: 12px;
  animation: imageFadeIn 0.5s ease;
}

.nav-btn {
  position: absolute; /* slider-image-wrapper 내에서 절대 위치 */
  top: 50%; /* 수직 중앙 */
  transform: translateY(-50%); /* 정확히 중앙 정렬 */
  color: white; /* 화살표 색상 */
  border: none;
  border-radius: 50%; /* 원형 버튼 */
  width: 40px;
  height: 40px;
  font-size: 20px;
  cursor: pointer;
  z-index: 10; /* 이미지 위에 오도록 */
  display: flex; /* 아이콘 중앙 정렬 */
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease, transform 0.3s ease;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.5);
}

.nav-btn.prev {
  left: 15px; /* 왼쪽에서 15px */
}

.nav-btn.next {
  right: 15px; /* 오른쪽에서 15px */
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.85);
  transform: translateY(-50%) scale(1.1); /* 호버 시 약간 커짐 */
}

.slider-dots {
  display: flex;
  justify-content: center;
  margin-top: 12px; /* 이미지 영역 아래에 배치 */
  gap: 8px;
}

.slider-dots span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ccc;
  cursor: pointer;
  transition: all 0.3s ease;
}

.slider-dots span.active-dot {
  background: #fd79a8;
  transform: scale(1.2);
}

/* 공유하기 버튼 스타일 */
.share-section {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.share-title {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 12px;
  font-weight: 500;
}

.share-buttons {
  display: flex;
  gap: 12px;
}

.share-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.share-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.kakao-btn {
  background: #FEE500;
  color: #3C1E1E;
}

.twitter-btn {
  background: #1DA1F2;
  color: white;
}

.facebook-btn {
  background: #4267B2;
  color: white;
}

.copy-btn {
  background: white;
  color: #4b5563;
  position: relative;
}

.copy-tooltip {
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  animation: fadeInOut 2s ease;
}

@keyframes fadeInOut {
  0% { opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}

/* 추가 스타일 - 태그 강조 효과 */
.tag-highlight {
  background: linear-gradient(45deg, #e84393, #fd79a8);
  transform: scale(1.1);
}

/* 부드러운 스크롤 효과 */
html {
  scroll-behavior: smooth;
}

/* 버튼 클릭 효과 */
.play-btn:active, .volume-btn:active, .share-btn:active {
  transform: scale(0.95);
}

/* 로딩 상태를 위한 스켈레톤 효과 */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.loading-skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

/* 간소화된 날씨 스타일 */
.weather-info {
  display: flex;
  align-items: center;
  margin: 12px 0;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 10px;
}

.weather-icon {
  font-size: 24px;
  margin-right: 10px;
}

.weather-condition {
  font-weight: 600;
  margin: 0;
}

/* 날씨별 아이콘 색상 */
.fa-sun { color: #ff9900; }
.fa-cloud { color: #6c757d; }
.fa-cloud-rain { color: #0099cc; }
.fa-snowflake { color: #99ccff; }

</style>
