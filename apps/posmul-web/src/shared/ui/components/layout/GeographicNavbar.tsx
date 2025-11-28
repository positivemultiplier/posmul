"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDownIcon, MapPinIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

// 🔥 서울 제외한 지역 목록
const regions = [
  {
    code: "busan",
    name: "부산광역시",
    keywords: ["부산", "busan", "Busan"],
    subRegions: [
      { code: "haeundae", name: "해운대구" },
      { code: "busanjin", name: "부산진구" },
      { code: "dong", name: "동구" },
      { code: "nam", name: "남구" },
      { code: "saha", name: "사하구" },
      { code: "seo", name: "서구" },
    ]
  },
  {
    code: "daegu",
    name: "대구광역시",
    keywords: ["대구", "daegu", "Daegu"],
    subRegions: [
      { code: "jung", name: "중구" },
      { code: "dong_daegu", name: "동구" },
      { code: "seo_daegu", name: "서구" },
      { code: "nam_daegu", name: "남구" },
      { code: "buk", name: "북구" },
    ]
  },
  {
    code: "incheon",
    name: "인천광역시",
    keywords: ["인천", "incheon", "Incheon"],
    subRegions: [
      { code: "yeonsu", name: "연수구" },
      { code: "namdong", name: "남동구" },
      { code: "bupyeong", name: "부평구" },
      { code: "michuhol", name: "미추홀구" },
    ]
  },
  {
    code: "gwangju",
    name: "광주광역시",
    keywords: ["광주", "gwangju", "Gwangju"],
    subRegions: [
      { code: "dong_gwangju", name: "동구" },
      { code: "seo_gwangju", name: "서구" },
      { code: "nam_gwangju", name: "남구" },
      { code: "buk_gwangju", name: "북구" },
      { code: "gwangsan", name: "광산구" },
    ]
  },
  {
    code: "daejeon",
    name: "대전광역시",
    keywords: ["대전", "daejeon", "Daejeon"],
    subRegions: [
      { code: "jung_daejeon", name: "중구" },
      { code: "dong_daejeon", name: "동구" },
      { code: "seo_daejeon", name: "서구" },
      { code: "yuseong", name: "유성구" },
      { code: "daedeok", name: "대덕구" },
    ]
  },
  {
    code: "ulsan",
    name: "울산광역시",
    keywords: ["울산", "ulsan", "Ulsan"],
    subRegions: [
      { code: "jung_ulsan", name: "중구" },
      { code: "nam_ulsan", name: "남구" },
      { code: "dong_ulsan", name: "동구" },
      { code: "buk_ulsan", name: "북구" },
      { code: "ulju", name: "울주군" },
    ]
  },
  {
    code: "sejong",
    name: "세종특별자치시",
    keywords: ["세종", "sejong", "Sejong"],
    subRegions: []
  },
];

function GeographicNavbar({ selectedRegion: initialRegion = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeoulUser, setIsSeoulUser] = useState(false);
  const [showSeoulWarning, setShowSeoulWarning] = useState(false);

  // 🔥 지역 자동 감지 함수
  const detectUserLocation = async () => {
    try {
      // 1. Geolocation API로 위치 확인
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;

            // 2. 좌표를 지역명으로 변환 (Reverse Geocoding)
            try {
              const response = await fetch(
                `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'demo'}`
              );
              const data = await response.json();

              if (data && data.length > 0) {
                const locationName = data[0].name || data[0].state || '';
                const detectedRegion = detectRegionFromName(locationName);

                if (detectedRegion === 'seoul') {
                  setIsSeoulUser(true);
                  setShowSeoulWarning(true);
                  setSelectedRegion(null); // 서울 사용자는 지역 선택 필요
                } else if (detectedRegion) {
                  setSelectedRegion(detectedRegion);
                } else {
                  // 감지되지 않은 지역은 부산으로 기본 설정
                  setSelectedRegion('busan');
                }
              } else {
                setSelectedRegion('busan'); // 기본값
              }
            } catch (geocodingError) {
              console.warn('Geocoding failed, using default region');
              setSelectedRegion('busan');
            }
            setIsLoading(false);
          },
          (error) => {
            console.warn('Geolocation failed:', error);
            // 위치 액세스 실패시 IP 기반 감지 시도
            detectLocationByIP();
          }
        );
      } else {
        // Geolocation 미지원시 IP 기반 감지
        detectLocationByIP();
      }
    } catch (error) {
      console.error('Location detection failed:', error);
      setSelectedRegion('busan'); // 최종 기본값
      setIsLoading(false);
    }
  };

  // IP 기반 지역 감지
  const detectLocationByIP = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();

      if (data.city || data.region) {
        const locationName = data.city || data.region;
        const detectedRegion = detectRegionFromName(locationName);

        if (detectedRegion === 'seoul') {
          setIsSeoulUser(true);
          setShowSeoulWarning(true);
          setSelectedRegion(null);
        } else if (detectedRegion) {
          setSelectedRegion(detectedRegion);
        } else {
          setSelectedRegion('busan');
        }
      } else {
        setSelectedRegion('busan');
      }
    } catch (error) {
      console.error('IP-based location detection failed:', error);
      setSelectedRegion('busan');
    }
    setIsLoading(false);
  };

  // 지역명에서 코드 감지
  const detectRegionFromName = (locationName) => {
    const lowerName = locationName.toLowerCase();

    // 🚨 서울 감지
    if (lowerName.includes('seoul') || lowerName.includes('서울')) {
      return 'seoul';
    }

    // 다른 지역 감지
    for (const region of regions) {
      if (region.keywords.some(keyword =>
        lowerName.includes(keyword.toLowerCase())
      )) {
        return region.code;
      }
    }
    return null;
  };

  // 컴포넌트 마운트시 지역 자동 감지
  useEffect(() => {
    if (initialRegion) {
      setSelectedRegion(initialRegion);
      setIsLoading(false);
    } else {
      detectUserLocation();
    }
  }, [initialRegion]);

  const currentRegionData = selectedRegion ? regions.find(region => region.code === selectedRegion) : null;

  const handleRegionSelect = (regionCode) => {
    setSelectedRegion(regionCode);
    setIsOpen(false);
    setShowSeoulWarning(false); // 지역 선택시 경고 숨김
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {/* 🚨 서울 사용자 경고 메시지 */}
      {showSeoulWarning && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center space-x-2 text-sm text-yellow-800 dark:text-yellow-200">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span className="font-medium">서울 사용자 알림:</span>
              <span>PosMul은 지역 기반 서비스입니다. 참여하실 지역을 선택해주세요!</span>
              <button
                onClick={() => setIsOpen(true)}
                className="ml-2 px-2 py-1 bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded text-xs hover:bg-yellow-300 dark:hover:bg-yellow-700 transition-colors"
              >
                지역 선택
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* 지역 선택 드롭다운 */}
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isLoading
                  ? 'text-gray-400 cursor-not-allowed'
                  : selectedRegion
                    ? 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                    : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}
              disabled={isLoading}
            >
              <MapPinIcon className="h-4 w-4" />
              <span>
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    위치 확인 중...
                  </span>
                ) : selectedRegion ? (
                  currentRegionData?.name || "지역 선택"
                ) : (
                  "지역을 선택해주세요!"
                )}
              </span>
              {!isLoading && <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
            </button>

            {/* 지역 선택 드롭다운 메뉴 */}
            {isOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-80 overflow-y-auto">
                <div className="py-1">
                  {regions.map((region) => (
                    <div key={region.code}>
                      <button
                        onClick={() => handleRegionSelect(region.code)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          selectedRegion === region.code
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{region.name}</span>
                          {selectedRegion === region.code && (
                            <span className="text-blue-500">✓</span>
                          )}
                        </div>
                      </button>

                      {/* 하위 지역 (시군구) */}
                      {region.subRegions && selectedRegion === region.code && (
                        <div className="bg-gray-50 dark:bg-gray-700/50">
                          {region.subRegions.map((subRegion) => (
                            <button
                              key={subRegion.code}
                              onClick={() => handleRegionSelect(subRegion.code)}
                              className="w-full text-left px-8 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                              {subRegion.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 지역별 퀵 링크 */}
          <div className="flex items-center space-x-6 text-sm">
            {selectedRegion ? (
              <>
                <Link
                  href={`/region/${selectedRegion}/stats`}
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  지역 통계
                </Link>
                <Link
                  href={`/region/${selectedRegion}/ranking`}
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  지역 랭킹
                </Link>
                <Link
                  href={`/region/${selectedRegion}/events`}
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  지역 이벤트
                </Link>
              </>
            ) : (
              <span className="text-red-500 dark:text-red-400 text-xs">지역 선택 후 이용 가능</span>
            )}
          </div>

          {/* 지역 정보 요약 */}
          <div className="hidden lg:flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            {selectedRegion && !isLoading ? (
              <>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>활성 사용자: 1,247</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span>진행중 예측: 23</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  <span>투자 기회: 8</span>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                <span>지역 선택 필요</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { GeographicNavbar };
